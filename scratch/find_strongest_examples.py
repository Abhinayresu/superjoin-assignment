import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.pdf_parser import PDFParser
from src.fact_extractor import GroundedFactExtractor
from src.reconciler import KnowledgeReconciler

extractor = GroundedFactExtractor(api_key="NONE")
reconciler = KnowledgeReconciler()

def analyze_dataset(name, folder):
    print(f"\n=======================================================")
    print(f"ANALYZING DATASET: {name}")
    print(f"=======================================================")
    pdf_files = [os.path.join(folder, f) for f in os.listdir(folder) if f.endswith(".pdf")]
    
    all_facts = []
    for pdf in pdf_files:
        chunks = PDFParser.parse_pdf(pdf)
        facts = extractor.extract_from_chunks(chunks)
        all_facts.extend(facts)
        
    res = reconciler.evaluate_facts(all_facts)
    
    print(f"Extracted Facts: {len(all_facts)}")
    print(f"Corroborations: {len(res['corroborations'])}")
    print(f"Genuine Contradictions: {len(res['conflicts'])}")
    print(f"Contextual Differences: {len(res['context_explained'])}")
    print(f"Uncertainties: {len(res['uncertainties'])}")

    print("\n--- ALL CORROBORATIONS ---")
    for r in res['corroborations']:
        print(f"[{r['title']}]")
        print(f"  Source A: {r['sourceA']} (p.{r['pageA']}) => Value: {r['valueA']}")
        print(f"  Source B: {r['sourceB']} (p.{r['pageB']}) => Value: {r['valueB']}")
        print(f"  Reason: {r['verdictReason']}\n")

    print("\n--- ALL GENUINE CONTRADICTIONS ---")
    for r in res['conflicts']:
        print(f"[{r['title']}]")
        print(f"  Source A: {r['sourceA']} (p.{r['pageA']}) => Value: {r['valueA']}")
        print(f"  Source B: {r['sourceB']} (p.{r['pageB']}) => Value: {r['valueB']}")
        print(f"  Reason: {r['verdictReason']}\n")

    print("\n--- TOP CONTEXTUAL DIFFERENCES ---")
    for r in res['context_explained'][:10]:
        print(f"[{r['title']}]")
        print(f"  Source A: {r['sourceA']} (p.{r['pageA']}) => Value: {r['valueA']}")
        print(f"  Source B: {r['sourceB']} (p.{r['pageB']}) => Value: {r['valueB']}")
        print(f"  Reason: {r['verdictReason']}\n")

    print("\n--- TOP UNCERTAINTIES ---")
    for r in res['uncertainties'][:10]:
        print(f"Fact: {r['fact']}")
        print(f"  Source: {r['source']} (p.{r['page']})")
        print(f"  Issue: {r['issue_type']} => {r['explanation']}\n")

analyze_dataset("delhivery", "dataset/starter-datasets/delhivery")
analyze_dataset("india-macroeconomy", "dataset/starter-datasets/india-macroeconomy")
