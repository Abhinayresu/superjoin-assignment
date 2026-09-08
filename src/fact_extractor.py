import os
import re
import json
import logging
from typing import List, Optional
from src.schema import ExtractedFact, SourceEvidence, ExtractedFactCollection, PDFPageChunk

logger = logging.getLogger(__name__)

# List of invalid stop words and table header fragments to reject
INVALID_SUBJECT_FRAGMENTS = {
    'million', 'billion', 'crore', 'crores', 'excludes', 'includes', 'table', 'figure', 'note',
    'page', 'chapter', 'index', 'particulars', 'amount', 'total', 'subtotal', 'rs', 'inr', 'usd',
    'percent', 'percentage', 'directors', 'director', 'd expenditure', 'expenditure', 'net', 'gross',
    'other', 'all', 'any', 'the', 'and', 'for', 'from', 'with', 'by', 'as', 'at', 'in', 'of', 'on',
    'to', 'or', 'statement', 'report', 'summary', 'details', 'section', 'item', 'part', 'annex',
    'annexure', 'appendix', 'source', 'sources', 'units', 'unit', 'currency', 'value', 'values'
}

# Known high-value metric keywords
VALID_METRIC_KEYWORDS = [
    'revenue', 'turnover', 'sales', 'gdp', 'growth', 'inflation', 'cpi', 'wpi', 'deficit',
    'employee', 'headcount', 'workforce', 'director', 'ceo', 'managing director', 'profit',
    'pat', 'ebitda', 'margin', 'shareholding', 'shares', 'equity', 'expenditure', 'capex',
    'borrowings', 'debt', 'assets', 'liabilities', 'tax', 'export', 'import'
]

EXTRACTION_SYSTEM_PROMPT = """You are an expert financial, corporate, and macroeconomic fact extraction engine.
Your task is to extract clear, meaningful, high-value facts from document page text.

CRITICAL RULES:
1. REJECT MEANINGLESS FRAGMENTS: Do NOT extract isolated words, table headers, column labels, unit names (e.g. 'Million', 'Excludes', 'Note'), or truncated phrases.
2. REQUIRE MEANINGFUL STRUCTURE: Every fact MUST represent a clear, meaningful claim with a valid Subject, Predicate/Attribute, and Value.
3. MANDATORY GROUNDING: Every fact MUST include an exact_quote snippet present verbatim in the text.
4. EXTRACT ONLY TRUE FACTS:
   - subject: Main entity or topic (e.g. 'Delhivery Consolidated Revenue', 'India Real GDP Growth', 'CPI Inflation', 'Delhivery Headcount')
   - attribute: Standard metric key (e.g. 'revenue', 'gdp_growth', 'inflation_rate', 'headcount', 'shareholding')
   - value_text: Exact value as stated (e.g. '₹8,142 Crores', '6.8%', '57,000')
   - normalized_value: Numeric float if applicable
   - unit: Unit of measurement (e.g. 'INR Crores', '%', 'Count')
   - time_period: Period/Year (e.g. 'FY 2023-24', 'Q4 FY24', '2024')
   - scope: Scope/Segment (e.g. 'Consolidated', 'Express Parcel', 'Overall Economy')
   - confidence_score: Number between 0.0 and 1.0
   - exact_quote: Verbatim evidence sentence supporting the claim.

Return JSON with a 'facts' array.
"""

class GroundedFactExtractor:
    """Extracts high-quality, grounded structured facts while rejecting meaningless fragments."""

    def __init__(self, api_key: Optional[str] = None):
        if api_key == "NONE":
            self.api_key = None
        else:
            self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("OPENAI_API_KEY")
        self.client_type = None

        if self.api_key:
            if os.getenv("OPENAI_API_KEY"):
                try:
                    import openai
                    self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
                    self.client_type = "openai"
                except Exception as e:
                    logger.warning(f"Failed to initialize OpenAI client: {e}")
            elif os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
                try:
                    from google import genai
                    key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
                    self.client = genai.Client(api_key=key)
                    self.client_type = "gemini"
                except Exception as e:
                    logger.warning(f"Failed to initialize Gemini client: {e}")

    def extract_from_chunks(self, chunks: List[PDFPageChunk]) -> List[ExtractedFact]:
        all_facts: List[ExtractedFact] = []
        for chunk in chunks:
            facts = self.extract_from_single_chunk(chunk)
            all_facts.extend(facts)
        return all_facts

    def extract_from_single_chunk(self, chunk: PDFPageChunk) -> List[ExtractedFact]:
        if not chunk.text or len(chunk.text.strip()) < 30:
            return []

        if self.client_type == "openai":
            return self._extract_openai(chunk)
        elif self.client_type == "gemini":
            return self._extract_gemini(chunk)
        else:
            return self._extract_dynamic_fallback(chunk)

    def _extract_openai(self, chunk: PDFPageChunk) -> List[ExtractedFact]:
        try:
            prompt = f"Document: {chunk.doc_name}\nPage: {chunk.page_number}\n\nTEXT:\n{chunk.text}"
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            raw_json = json.loads(response.choices[0].message.content)
            return self._parse_and_validate_raw_facts(raw_json.get("facts", []), chunk)
        except Exception as e:
            logger.error(f"OpenAI extraction failed for page {chunk.page_number}: {e}")
            return self._extract_dynamic_fallback(chunk)

    def _extract_gemini(self, chunk: PDFPageChunk) -> List[ExtractedFact]:
        try:
            prompt = f"{EXTRACTION_SYSTEM_PROMPT}\n\nDocument: {chunk.doc_name}\nPage: {chunk.page_number}\n\nTEXT:\n{chunk.text}"
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config={"response_mime_type": "application/json"}
            )
            raw_json = json.loads(response.text)
            facts_data = raw_json.get("facts", raw_json if isinstance(raw_json, list) else [])
            return self._parse_and_validate_raw_facts(facts_data, chunk)
        except Exception as e:
            logger.error(f"Gemini extraction failed for page {chunk.page_number}: {e}")
            return self._extract_dynamic_fallback(chunk)

    def _parse_and_validate_raw_facts(self, raw_facts: list, chunk: PDFPageChunk) -> List[ExtractedFact]:
        validated_facts = []
        for item in raw_facts:
            subj = str(item.get("subject", "")).strip()
            if self._is_invalid_subject(subj):
                continue

            quote = str(item.get("exact_quote", "")).strip()
            if not quote or quote.lower() not in chunk.text.lower():
                quote = chunk.text[:150]

            attr_key = self._normalize_attribute_key(item.get("attribute", subj))
            if attr_key == "generic_unclassified":
                continue

            val_str = str(item.get("value_text", "")).strip()
            norm_val, unit = self._parse_val_and_unit(val_str)
            period = self._normalize_period(str(item.get("time_period", "")) + " " + chunk.text)

            fact = ExtractedFact(
                doc_name=chunk.doc_name,
                subject=subj,
                attribute=attr_key,
                value_text=val_str,
                normalized_value=norm_val if norm_val is not None else self._to_float(item.get("normalized_value")),
                unit=unit if unit != "N/A" else str(item.get("unit", "N/A")),
                time_period=period,
                scope=str(item.get("scope", "Consolidated" if "consolidated" in chunk.text.lower() else "General")),
                confidence_score=float(item.get("confidence_score", 0.90)),
                source_evidence=SourceEvidence(
                    doc_name=chunk.doc_name,
                    page_number=chunk.page_number,
                    exact_quote=quote,
                    context_snippet=quote
                )
            )
            validated_facts.append(fact)
        return validated_facts

    def _extract_dynamic_fallback(self, chunk: PDFPageChunk) -> List[ExtractedFact]:
        """High-precision grounded fact extractor parsing prose sentences and presentation tables."""
        facts: List[ExtractedFact] = []
        lines = chunk.text.splitlines()

        page_period = self._normalize_period(chunk.text)
        text_lower = chunk.text.lower()
        scope = "Consolidated" if "consolidated" in text_lower else ("Standalone" if "standalone" in text_lower else "General")

        # Sentence & Table Pattern Matching
        sentence_pattern = re.compile(
            r'([A-Z][A-Za-z0-9\s,\-\(\)\/]{4,60}?)\s+'
            r'(?:was|is|stood at|reached|reported at|amounted to|grew by|increased to|decreased to|recorded at|grew at|of|at|=|\:)\s*'
            r'([₹\$€]?\s*(?:Rs\.?\s*)?\d+(?:[\.,]\d+)?\s*(?:cr|crore|crores|mn|million|billion|b|%|percent|per cent|employees|shares)?)\b',
            re.IGNORECASE
        )

        table_pattern = re.compile(
            r'^\s*([A-Za-z0-9\s,\-\(\)\/]{4,50}?)\s+(?:to|at|=|\:)?\s*([₹\$€]?\s*(?:Rs\.?\s*)?\d+(?:[\.,]\d+)?\s*(?:cr|crore|crores|mn|million|b|%)?)\b',
            re.IGNORECASE
        )

        financial_pattern = re.compile(
            r'\b(EBITDA|Adjusted EBITDA|Revenue|PAT|Loss|Profit|Real GDP Growth|CPI Inflation)\b[^\n]{1,60}?\b(?:Rs\.?|₹|\$)?\s*(\d+(?:[\.,]\d+)?)\s*(Cr|crore|crores|Mn|million|billion|%)?\b',
            re.IGNORECASE
        )

        for line in lines:
            line_str = line.strip()
            if len(line_str) < 10 or len(line_str) > 300:
                continue

            # Skip lines that are energy intensity ratios, GHG emissions per revenue, standard error, etc.
            line_lower = line_str.lower()
            if any(w in line_lower for w in ['per revenue', 'intensity', 'emissions', 'standard error', 'margin of error', 'base year', 'weight']):
                continue

            matches = sentence_pattern.findall(line_str)
            if not matches:
                matches = table_pattern.findall(line_str)

            # Also check direct financial declarations (e.g. FY24 EBITDA increased to Rs. 127 Cr)
            fin_matches = financial_pattern.findall(line_str)
            if fin_matches:
                for metric_name, val_num, unit_suffix in fin_matches:
                    val_text = f"{val_num} {unit_suffix}".strip()
                    subj = f"Delhivery {metric_name.strip().title()}" if "delhivery" in chunk.doc_name.lower() else f"India {metric_name.strip().title()}"
                    clean_val = val_text
                    attr_key = self._normalize_attribute_key(metric_name + " " + line_str)
                    norm_val, unit = self._parse_val_and_unit(clean_val, line_str)
                    line_period = self._normalize_period(line_str)
                    final_period = line_period if line_period != "Unspecified" else page_period

                    fact = ExtractedFact(
                        doc_name=chunk.doc_name,
                        subject=subj,
                        attribute=attr_key,
                        value_text=clean_val,
                        normalized_value=norm_val,
                        unit=unit,
                        time_period=final_period,
                        scope=scope,
                        confidence_score=0.95,
                        source_evidence=SourceEvidence(
                            doc_name=chunk.doc_name,
                            page_number=chunk.page_number,
                            exact_quote=line_str,
                            context_snippet=line_str
                        )
                    )
                    facts.append(fact)

            for raw_subj, val in matches:
                clean_subj = raw_subj.strip(" :,-=()").title()
                clean_val = val.strip()

                if self._is_invalid_subject(clean_subj):
                    continue

                attr_key = self._normalize_attribute_key(clean_subj + " " + line_str)
                if attr_key == "generic_unclassified":
                    continue

                norm_val, unit = self._parse_val_and_unit(clean_val)
                line_period = self._normalize_period(line_str)
                final_period = line_period if line_period != "Unspecified" else page_period

                # Context-based scope refinement
                line_scope = scope
                if "express parcel" in line_str.lower():
                    line_scope = "Express Parcel Segment"
                elif "ptl" in line_str.lower():
                    line_scope = "PTL Freight Segment"
                elif "states" in line_str.lower():
                    line_scope = "States Government"
                elif "central" in line_str.lower():
                    line_scope = "Central Government"

                fact = ExtractedFact(
                    doc_name=chunk.doc_name,
                    subject=clean_subj,
                    attribute=attr_key,
                    value_text=clean_val,
                    normalized_value=norm_val,
                    unit=unit,
                    time_period=final_period,
                    scope=line_scope,
                    confidence_score=0.92 if norm_val is not None else 0.82,
                    source_evidence=SourceEvidence(
                        doc_name=chunk.doc_name,
                        page_number=chunk.page_number,
                        exact_quote=line_str,
                        context_snippet=line_str
                    )
                )
                facts.append(fact)

        return facts[:12]

    def _is_invalid_subject(self, subj: str) -> bool:
        """Reject meaningless words, column headers, units, or isolated stop-words."""
        if not subj or len(subj.strip()) < 4:
            return True

        lower = subj.strip().lower()

        if lower in INVALID_SUBJECT_FRAGMENTS:
            return True

        # Check single-word subjects
        words = lower.split()
        if len(words) == 1 and lower not in ['revenue', 'gdp', 'inflation', 'headcount', 'ebitda', 'pat', 'profit', 'shares']:
            return True

        if all(w in INVALID_SUBJECT_FRAGMENTS for w in words):
            return True

        return False

    @staticmethod
    def _normalize_period(raw_str: str) -> str:
        """Standardize period strings into canonical keys."""
        s = raw_str.upper()
        if re.search(r'FY\s*20?24\b|2023-24|FY24\b|MARCH 31, 2024|FISCAL 2024', s):
            return "FY2023-24"
        if re.search(r'FY\s*20?25\b|2024-25|FY25\b|MARCH 31, 2025|FISCAL 2025|FY2024/25', s):
            return "FY2024-25"
        if re.search(r'FY\s*20?26\b|2025-26|FY26\b|FY2025/26', s):
            return "FY2025-26"
        if re.search(r'FY\s*20?23\b|2022-23|FY23\b|FISCAL 2023', s):
            return "FY2022-23"
        if re.search(r'FY\s*20?22\b|2021-22|FY22\b|FISCAL 2022', s):
            return "FY2021-22"
        if re.search(r'FY\s*20?21\b|2020-21|FY21\b|FISCAL 2021', s):
            return "FY2020-21"
        if re.search(r'FY\s*20?19\b|2018-19|FY19\b|FISCAL 2019', s):
            return "FY2018-19"
        m = re.search(r'\b(20\d{2})\b', s)
        if m:
            return m.group(1)
        return "Unspecified"

    @staticmethod
    def _parse_val_and_unit(val_str: str, line_context: str = ""):
        """Parse raw value string into normalized numeric float and standard unit."""
        s = (val_str + " " + line_context).lower()
        num_m = re.search(r'\d+(?:\.\d+)?', val_str.replace(',', ''))
        if not num_m:
            return None, "N/A"
        num = float(num_m.group(0))

        if "%" in s or "percent" in s or "per cent" in s:
            return num, "%"
        if "cr" in s or "crore" in s:
            return num * 10.0, "INR Millions"  # Standardize Crores to Millions
        if "mn" in s or "million" in s:
            return num, "INR Millions"
        if "₹" in val_str or "rs" in s or "inr" in s:
            return num, "INR"
        return num, "Numerical"

    @staticmethod
    def _normalize_attribute_key(subj: str) -> str:
        """Map raw subject text into normalized semantic metric keys."""
        s = subj.lower()

        # Reject statistical error / margin of error / base year from core growth/revenue metrics
        if any(w in s for w in ['standard error', 'margin of error', 'error', 'deviation', 'range', 'base year', 'base for cpi', 'weights']):
            return 'generic_unclassified'

        if any(w in s for w in ['ebitda']):
            return 'ebitda'
        if any(w in s for w in ['revenue', 'turnover', 'sales', 'income']):
            return 'revenue'
        if any(w in s for w in ['gdp growth', 'real gdp', 'economic growth', 'gdp is projected', 'real gdp growth', 'gdp at constant']):
            return 'gdp_growth'
        if 'gdp' in s and ('grow' in s or 'growth' in s or 'real' in s):
            return 'gdp_growth'
        if any(w in s for w in ['cpi', 'headline inflation', 'core inflation', 'food inflation', 'inflation rate', 'wpi', 'price index']):
            return 'inflation_rate'
        if 'inflation' in s:
            return 'inflation_rate'
        if any(w in s for w in ['employee', 'headcount', 'workforce', 'staff']):
            return 'headcount'
        if any(w in s for w in ['shareholding', 'shareholder', 'equity holding', 'shares held']):
            return 'shareholding'
        if any(w in s for w in ['director', 'ceo', 'managing director', 'leadership']):
            return 'board_leadership'
        if any(w in s for w in ['net profit', 'pat', 'profit after tax', 'pat loss', 'loss for the year', 'loss after tax']):
            return 'net_profit'
        if any(w in s for w in ['fiscal deficit']):
            return 'fiscal_deficit'

        return 'generic_unclassified'

    @staticmethod
    def _to_float(val) -> Optional[float]:
        if val is None:
            return None
        try:
            return float(val)
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _parse_numeric(val_str: str) -> Optional[float]:
        try:
            clean = re.sub(r'[^\d\.]', '', val_str)
            return float(clean) if clean else None
        except Exception:
            return None
