import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.pdf_parser import PDFParser
from src.fact_extractor import GroundedFactExtractor
from src.reconciler import KnowledgeReconciler

extractor = GroundedFactExtractor(api_key="")
reconciler = KnowledgeReconciler()

def inspect_dataset(name, folder):
    print(f"\n=======================================================")
    print(f"INSPECTING DATASET: {name}")
    print(f"=======================================================")
    pdf_files = [os.path.join(folder, f) for f in os.listdir(folder) if f.endswith(".pdf")]
    
    all_facts = []
    for pdf in pdf_files:
        chunks = PDFParser.parse_pdf(pdf)
        facts = extractor.extract_from_chunks(chunks)
        all_facts.extend(facts)
        
    res = reconciler.evaluate_facts(all_facts)
    
    corroborations = res["corroborations"]
    contradictions = res["conflicts"]
    context_diffs = res["context_explained"]
    uncertainties = res["uncertainties"]
    
    print(f"Total facts: {len(all_facts)}")
    print(f"Corroborations: {len(corroborations)}")
    print(f"Contradictions: {len(contradictions)}")
    print(f"Context Diffs: {len(context_diffs)}")
    print(f"Uncertainties: {len(uncertainties)}")
    
    print("\n--- ALL CORROBORATIONS ---")
    for r in corroborations:
        print(f"Title: {r['title']}")
        print(f"  A: {r['sourceA']} p.{r['pageA']} ({r['valueA']})")
        print(f"  B: {r['sourceB']} p.{r['pageB']} ({r['valueB']})")
        print(f"  Reasoning: {r['verdictReason']}\n")

    print("\n--- TOP CONTRADICTIONS ---")
    for r in contradictions[:15]:
        print(f"Title: {r['title']}")
        print(f"  A: {r['sourceA']} p.{r['pageA']} ({r['valueA']})")
        print(f"  B: {r['sourceB']} p.{r['pageB']} ({r['valueB']})")
        print(f"  Reasoning: {r['verdictReason']}\n")

    print("\n--- TOP CONTEXT DIFFS ---")
    for r in context_diffs[:5]:
        print(f"Title: {r['title']}")
        print(f"  A: {r['sourceA']} p.{r['pageA']} ({r['valueA']})")
        print(f"  B: {r['sourceB']} p.{r['pageB']} ({r['valueB']})")
        print(f"  Reasoning: {r['verdictReason']}\n")

    print("\n--- TOP UNCERTAINTIES ---")
    for r in uncertainties[:5]:
        print(f"Fact/Issue: {r['fact']} / {r['issue_type']}")
        print(f"  Source: {r['source']} p.{r['page']}")
        print(f"  Explanation: {r['explanation']}\n")

inspect_dataset("delhivery", "dataset/starter-datasets/delhivery")
inspect_dataset("india-macroeconomy", "dataset/starter-datasets/india-macroeconomy")
