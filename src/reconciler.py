import re
import json
import logging
from typing import List, Dict, Any, Optional
from src.schema import ExtractedFact

logger = logging.getLogger(__name__)

class KnowledgeReconciler:
    """Evaluates extracted facts across documents with high-precision candidate pairing and strict context checks."""

    def evaluate_facts(self, facts: List[ExtractedFact]) -> Dict[str, Any]:
        """Group facts strictly by normalized sub-metric and evaluate high-precision candidate relationships."""
        # Classify sub-metrics
        sub_metric_groups: Dict[str, List[ExtractedFact]] = {}
        for f in facts:
            if f.attribute == "generic_unclassified":
                continue
            sub_key = self._extract_sub_metric(f)
            sub_metric_groups.setdefault(sub_key, []).append(f)

        corroborations = []
        genuine_conflicts = []
        context_explained = []
        uncertainties = []

        # Flag extraction uncertainties (low confidence, unclassified metrics, or missing context)
        for f in facts:
            if f.confidence_score < 0.85 or f.attribute == "generic_unclassified" or f.time_period == "Unspecified":
                uncertainties.append({
                    "id": f.fact_id,
                    "fact": f.subject,
                    "entity": f.doc_name,
                    "value": f.value_text,
                    "period": f.time_period,
                    "scope": f.scope,
                    "confidence": int(f.confidence_score * 100),
                    "source": f.doc_name,
                    "page": f.source_evidence.page_number,
                    "evidence": f.source_evidence.exact_quote,
                    "issue_type": "Extraction Uncertainty / Missing Context",
                    "explanation": f"Context or period is incomplete ('{f.time_period}'). Flagged for human review instead of speculative comparison.",
                    "status": "UNRESOLVED"
                })

        # Evaluate pairs within sub-metric groups OR across compatible sub-metrics for contextual differences
        evaluated_pair_ids = set()

        for sub_key, group in sub_metric_groups.items():
            if len(group) < 2:
                continue

            for i in range(len(group)):
                for j in range(i + 1, len(group)):
                    fa = group[i]
                    fb = group[j]

                    if fa.doc_name == fb.doc_name and fa.source_evidence.page_number == fb.source_evidence.page_number:
                        continue

                    pair_key = tuple(sorted([fa.fact_id, fb.fact_id]))
                    if pair_key in evaluated_pair_ids:
                        continue
                    evaluated_pair_ids.add(pair_key)

                    if not self._are_claims_meaningfully_comparable(fa, fb):
                        if fa.doc_name != fb.doc_name:
                            uncertainties.append({
                                "id": f"u_align_{fa.fact_id}_{fb.fact_id}",
                                "fact": f"{fa.subject} vs {fb.subject}",
                                "entity": f"{fa.doc_name} / {fb.doc_name}",
                                "value": f"{fa.value_text} vs {fb.value_text}",
                                "period": f"{fa.time_period} vs {fb.time_period}",
                                "scope": f"{fa.scope} vs {fb.scope}",
                                "confidence": 65,
                                "source": fa.doc_name,
                                "page": fa.source_evidence.page_number,
                                "evidence": f"Fact A: '{fa.source_evidence.exact_quote}' | Fact B: '{fb.source_evidence.exact_quote}'",
                                "issue_type": "Semantic Metric Alignment Uncertainty",
                                "explanation": f"Facts share broad category ('{fa.attribute}'), but specific claims cannot be confidently aligned. Kept UNCERTAIN to prevent false contradiction.",
                                "status": "UNRESOLVED"
                            })
                        continue

                    eval_result = self._evaluate_pair(fa, fb)
                    if not eval_result:
                        continue

                    category = eval_result["category"]
                    if category == "CORROBORATION":
                        corroborations.append(eval_result)
                    elif category == "GENUINE_CONTRADICTION":
                        genuine_conflicts.append(eval_result)
                    elif category == "APPARENT_CONTRADICTION_EXPLAINED":
                        context_explained.append(eval_result)

        return {
            "corroborations": corroborations,
            "conflicts": genuine_conflicts,
            "context_explained": context_explained,
            "uncertainties": uncertainties
        }

    def _extract_sub_metric(self, fact: ExtractedFact) -> str:
        """Extract precise sub-metric category for exact claim matching."""
        s = (fact.subject + " " + fact.source_evidence.exact_quote).lower()

        if fact.attribute == "inflation_rate":
            if any(w in s for w in ["tomato", "pulse", "fruit", "food", "vegetable", "cpi-iw"]):
                if "tomato" in s: return "inflation_tomato"
                return "inflation_food"
            if "fuel" in s or "energy" in s:
                return "inflation_fuel"
            if "wpi" in s or "producer" in s or "wholesale" in s:
                return "inflation_wpi"
            if "core" in s:
                return "inflation_core"
            if any(w in s for w in ["headline", "cpi", "overall", "target", "average"]):
                return "inflation_headline"
            return "inflation_general"

        if fact.attribute == "gdp_growth":
            if any(w in s for w in ["ratio", "deficit", "capex", "expenditure"]):
                return "gdp_fiscal_ratio"
            if any(w in s for w in ["nominal"]):
                return "nominal_gdp_growth"
            if any(w in s for w in ["gdp", "growth", "constant", "real"]):
                return "real_gdp_growth"
            return "gdp_general"

        if fact.attribute == "revenue":
            if "expenditure" in s:
                return "revenue_expenditure"
            if "tax" in s:
                return "tax_revenue"
            if "express parcel" in s:
                return "revenue_express_parcel"
            if "ptl" in s:
                return "revenue_ptl"
            if any(w in s for w in ["contract", "customer", "operation", "services", "sales"]):
                return "revenue_consolidated"
            return "revenue_general"

        if fact.attribute == "ebitda":
            if "adjusted" in s:
                return "ebitda_adjusted"
            return "ebitda_reported"

        if fact.attribute == "net_profit":
            return "net_profit"

        return fact.attribute

    def _are_claims_meaningfully_comparable(self, fa: ExtractedFact, fb: ExtractedFact) -> bool:
        """Ensure two facts refer to the exact same underlying claim/metric before generating a comparison."""
        if not self._are_entities_compatible(fa.subject, fb.subject):
            return False

        # Unit check: Do not compare base year numbers (e.g. 2011/2012) with growth/inflation percentages or currency amounts
        if (fa.unit == "Year" and fb.unit != "Year") or (fb.unit == "Year" and fa.unit != "Year"):
            return False

        # Unit domain check: Percentage vs Currency vs Count
        unit_a = "%" if fa.unit == "%" else ("INR" if "INR" in fa.unit else "Numerical")
        unit_b = "%" if fb.unit == "%" else ("INR" if "INR" in fb.unit else "Numerical")
        if unit_a != unit_b:
            return False

        # Sub-metric alignment check
        sub_a = self._extract_sub_metric(fa)
        sub_b = self._extract_sub_metric(fb)

        # Allow comparing reported vs adjusted EBITDA or segment vs consolidated revenue ONLY for contextual differences
        if sub_a == sub_b:
            return True
        if {sub_a, sub_b} in [{"ebitda_reported", "ebitda_adjusted"}, {"revenue_consolidated", "revenue_express_parcel"}]:
            return True

        return False

    def _evaluate_pair(self, fa: ExtractedFact, fb: ExtractedFact) -> Optional[Dict[str, Any]]:
        """Evaluate a candidate pair across 5 criteria dimensions."""
        match_entity = True
        sub_a = self._extract_sub_metric(fa)
        sub_b = self._extract_sub_metric(fb)
        match_metric = (sub_a == sub_b)

        match_period = (fa.time_period.lower() == fb.time_period.lower() and fa.time_period != "Unspecified")
        match_scope = (fa.scope.lower() == fb.scope.lower())
        
        # Compatible unit check
        unit_a_domain = "%" if fa.unit == "%" else ("INR" if "INR" in fa.unit else "Numerical")
        unit_b_domain = "%" if fb.unit == "%" else ("INR" if "INR" in fb.unit else "Numerical")
        match_unit = (unit_a_domain == unit_b_domain)

        # Value comparison with 3% relative tolerance
        vals_equal = False
        if fa.normalized_value is not None and fb.normalized_value is not None and fa.normalized_value > 0 and fb.normalized_value > 0:
            rel_diff = abs(fa.normalized_value - fb.normalized_value) / max(fa.normalized_value, fb.normalized_value)
            vals_equal = (rel_diff < 0.03)
        elif fa.value_text.strip().lower() == fb.value_text.strip().lower():
            vals_equal = True

        criteria = [
            {"label": "Entity", "valueA": fa.subject, "valueB": fb.subject, "match": match_entity},
            {"label": "Metric", "valueA": sub_a, "valueB": sub_b, "match": match_metric},
            {"label": "Period", "valueA": fa.time_period, "valueB": fb.time_period, "match": match_period,
             "note": "" if match_period else "Different time periods explain value variation"},
            {"label": "Scope", "valueA": fa.scope, "valueB": fb.scope, "match": match_scope,
             "note": "" if match_scope else "Scope / segment difference"},
            {"label": "Unit", "valueA": fa.unit, "valueB": fb.unit, "match": match_unit,
             "note": "" if match_unit else "Unit difference"},
        ]

        pair_id = f"c_{fa.fact_id}_{fb.fact_id}"

        if vals_equal:
            # Independent corroboration requires evidence from DIFFERENT documents
            if fa.doc_name == fb.doc_name:
                return None

            return {
                "id": pair_id,
                "title": f"{fa.subject} — Corroborated Evidence",
                "category": "CORROBORATION",
                "entityA": fa.doc_name,
                "valueA": fa.value_text,
                "sourceA": fa.doc_name,
                "pageA": fa.source_evidence.page_number,
                "entityB": fb.doc_name,
                "valueB": fb.value_text,
                "sourceB": fb.doc_name,
                "pageB": fb.source_evidence.page_number,
                "criteria": criteria,
                "verdict": "CORROBORATED",
                "verdictReason": f"Fact is independently corroborated across '{fa.doc_name}' (p.{fa.source_evidence.page_number}) and '{fb.doc_name}' (p.{fb.source_evidence.page_number}) for period '{fa.time_period}' with value '{fa.value_text}'."
            }

        # If values differ AND period matches AND scope matches AND unit matches AND distinct documents -> Genuine Contradiction
        if not vals_equal and match_period and match_scope and match_unit and match_metric and fa.doc_name != fb.doc_name:
            return {
                "id": pair_id,
                "title": f"{fa.subject} — Discrepancy",
                "category": "GENUINE_CONTRADICTION",
                "entityA": fa.doc_name,
                "valueA": fa.value_text,
                "sourceA": fa.doc_name,
                "pageA": fa.source_evidence.page_number,
                "entityB": fb.doc_name,
                "valueB": fb.value_text,
                "sourceB": fb.doc_name,
                "pageB": fb.source_evidence.page_number,
                "criteria": criteria,
                "verdict": "GENUINE CONTRADICTION",
                "verdictReason": f"Both sources report on identical period ({fa.time_period}) and scope ({fa.scope}), yet state conflicting figures ({fa.value_text} vs {fb.value_text}). Requires direct source verification."
            }
        elif fa.doc_name != fb.doc_name:
            # Contextually explained difference across documents
            reason = []
            if not match_metric:
                reason.append(f"metrics differ ({sub_a} vs {sub_b})")
            if not match_period:
                reason.append(f"reporting periods differ ({fa.time_period} vs {fb.time_period})")
            if not match_scope:
                reason.append(f"reporting scopes differ ({fa.scope} vs {fb.scope})")
            if not match_unit:
                reason.append(f"units differ ({fa.unit} vs {fb.unit})")

            explanation_str = " and ".join(reason) if reason else "different document context"

            return {
                "id": pair_id,
                "title": f"{fa.subject} — Contextual Difference",
                "category": "APPARENT_CONTRADICTION_EXPLAINED",
                "entityA": fa.doc_name,
                "valueA": fa.value_text,
                "sourceA": fa.doc_name,
                "pageA": fa.source_evidence.page_number,
                "entityB": fb.doc_name,
                "valueB": fb.value_text,
                "sourceB": fb.doc_name,
                "pageB": fb.source_evidence.page_number,
                "criteria": criteria,
                "verdict": "NOT A CONTRADICTION",
                "verdictReason": f"Apparent difference in values ({fa.value_text} vs {fb.value_text}) is reconciled by context: {explanation_str}."
            }

        return None

    @staticmethod
    def _are_entities_compatible(subj_a: str, subj_b: str) -> bool:
        """Ensure facts belong to compatible entity domains before attempting pairwise comparison."""
        sa = subj_a.lower()
        sb = subj_b.lower()

        # Both Delhivery/Corporate
        if ('delhivery' in sa or 'company' in sa or 'revenue' in sa) and ('delhivery' in sb or 'company' in sb or 'revenue' in sb):
            return True

        # Both Macroeconomic
        if ('gdp' in sa or 'india' in sa or 'inflation' in sa or 'cpi' in sa) and ('gdp' in sb or 'india' in sb or 'inflation' in sb or 'cpi' in sb):
            return True

        # Shareholding / Director pairs
        if ('share' in sa or 'holding' in sa or 'director' in sa) and ('share' in sb or 'holding' in sb or 'director' in sb):
            return True

        return False
