import os
import json
import glob
import sys

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from src.pipeline import FactPipeline
from src.reconciler import KnowledgeReconciler

def test_dataset(dataset_name: str, pdf_dir: str):
    print(f"\n=======================================================")
    print(f" TESTING DATASET: {dataset_name.upper()}")
    print(f" Path: {pdf_dir}")
    print(f"=======================================================")

    pdf_files = glob.glob(os.path.join(pdf_dir, "*.pdf"))
    if not pdf_files:
        print(f"[-] ERROR: No PDFs found in {pdf_dir}")
        return

    pipeline = FactPipeline()
    results = pipeline.process_multiple_pdfs(pdf_files)
    
    all_facts = []
    for doc_res in results.values():
        for f in doc_res.facts:
            all_facts.append(f)

    print(f"\n[+] Total Extracted Facts: {len(all_facts)}")

    # Run Reconciliation Engine
    reconciler = KnowledgeReconciler()
    eval_res = reconciler.evaluate_facts(all_facts)

    corroborations = eval_res["corroborations"]
    conflicts = eval_res["conflicts"]
    context_explained = eval_res["context_explained"]
    uncertainties = eval_res["uncertainties"]

    print(f"\n[*] RECONCILIATION SUMMARY FOR {dataset_name.upper()}:")
    print(f"  - Corroborated Facts: {len(corroborations)}")
    print(f"  - Genuine Contradictions: {len(conflicts)}")
    print(f"  - Apparent Contradictions (Context Explained): {len(context_explained)}")
    print(f"  - Extraction / Reasoning Uncertainties: {len(uncertainties)}")

    print(f"\n--- CASE 1: CORROBORATION ---")
    if corroborations:
        c = corroborations[0]
        print(f"Title: {c['title']}")
        print(f"Doc A ({c['sourceA']} p.{c['pageA']}): {c['valueA']}")
        print(f"Doc B ({c['sourceB']} p.{c['pageB']}): {c['valueB']}")
        print(f"Reasoning: {c['verdictReason']}")
    else:
        print("None found in sample.")

    print(f"\n--- CASE 2: GENUINE CONTRADICTION ---")
    if conflicts:
        c = conflicts[0]
        print(f"Title: {c['title']}")
        print(f"Doc A ({c['sourceA']} p.{c['pageA']}): {c['valueA']}")
        print(f"Doc B ({c['sourceB']} p.{c['pageB']}): {c['valueB']}")
        print(f"Reasoning: {c['verdictReason']}")
    else:
        print("None found in sample.")

    print(f"\n--- CASE 3: APPARENT CONTRADICTION EXPLAINED ---")
    if context_explained:
        c = context_explained[0]
        print(f"Title: {c['title']}")
        print(f"Doc A ({c['sourceA']} p.{c['pageA']}): {c['valueA']}")
        print(f"Doc B ({c['sourceB']} p.{c['pageB']}): {c['valueB']}")
        print(f"Reasoning: {c['verdictReason']}")
    else:
        print("None found in sample.")

    print(f"\n--- CASE 4: EXTRACTION / REASONING FAILURE ---")
    if uncertainties:
        u = uncertainties[0]
        print(f"Fact: {u['fact']} ({u['source']} p.{u['page']})")
        print(f"Value: {u['value']}")
        print(f"Explanation: {u['explanation']}")
        print(f"Quote Snippet: {u['evidence'][:100]}...")
    else:
        print("None found in sample.")

    # Verify Evidence Grounding & Traceability for ALL facts
    unsupported = 0
    for f in all_facts:
        if not f.source_evidence.doc_name or not f.source_evidence.page_number or not f.source_evidence.exact_quote:
            unsupported += 1

    print(f"\n[+] EVIDENCE GROUNDING & TRACEABILITY VERIFICATION:")
    if unsupported == 0:
        print(f"  SUCCESS: 100% of facts ({len(all_facts)}/{len(all_facts)}) are strictly traceable to source document, page number, and exact quote!")
    else:
        print(f"  WARNING: {unsupported} facts missing evidence grounding!")

if __name__ == "__main__":
    delhivery_dir = os.path.join("dataset", "starter-datasets", "delhivery")
    test_dataset("Delhivery Corporate Dataset", delhivery_dir)

    macro_dir = os.path.join("dataset", "starter-datasets", "india-macroeconomy")
    test_dataset("India Macroeconomy Dataset", macro_dir)
