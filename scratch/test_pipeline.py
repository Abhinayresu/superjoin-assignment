import os
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, os.path.abspath('.'))
import glob
import json

from src.pipeline import FactPipeline
from src.reconciler import KnowledgeReconciler

p = FactPipeline()
rec = KnowledgeReconciler()

def run_evaluation(dataset_name, dir_path):
    print(f"\n=======================================================")
    print(f"EVALUATING DATASET: {dataset_name}")
    print(f"=======================================================")
    pdfs = sorted(glob.glob(os.path.join(dir_path, '*.pdf')))
    ingest_res = p.process_multiple_pdfs(pdfs)
    
    all_facts = []
    for doc_name, res in ingest_res.items():
        print(f"Doc: {doc_name} -> {len(res.facts)} facts extracted")
        all_facts.extend(res.facts)
        
    eval_res = rec.evaluate_facts(all_facts)
    
    print(f"\n--- RESULTS FOR {dataset_name.upper()} ---")
    print(f"Total Extracted Facts: {len(all_facts)}")
    print(f"Corroborations: {len(eval_res['corroborations'])}")
    print(f"Genuine Contradictions: {len(eval_res['conflicts'])}")
    print(f"Context Explained Differences: {len(eval_res['context_explained'])}")
    print(f"Uncertainties: {len(eval_res['uncertainties'])}")
    
    if eval_res['corroborations']:
        print("\n--- CORROBORATIONS ---")
        for c in eval_res['corroborations']:
            print(f"  * {c['title']} [{c['entityA']} p.{c['pageA']} ({c['valueA']}) vs {c['entityB']} p.{c['pageB']} ({c['valueB']})]")
            print(f"    Reason: {c['verdictReason']}")

    if eval_res['conflicts']:
        print("\n--- GENUINE CONTRADICTIONS ---")
        for c in eval_res['conflicts']:
            print(f"  * {c['title']} [{c['entityA']} p.{c['pageA']} ({c['valueA']}) vs {c['entityB']} p.{c['pageB']} ({c['valueB']})]")
            print(f"    Reason: {c['verdictReason']}")

    if eval_res['context_explained']:
        print(f"\n--- CONTEXT EXPLAINED (Showing top 5 of {len(eval_res['context_explained'])}) ---")
        for c in eval_res['context_explained'][:5]:
            print(f"  * {c['title']} [{c['entityA']} p.{c['pageA']} ({c['valueA']}) vs {c['entityB']} p.{c['pageB']} ({c['valueB']})]")
            print(f"    Reason: {c['verdictReason']}")

    if eval_res['uncertainties']:
        print(f"\n--- UNCERTAINTIES (Showing top 5 of {len(eval_res['uncertainties'])}) ---")
        for u in eval_res['uncertainties'][:5]:
            print(f"  * {u['fact']} ({u['source']} p.{u['page']}): {u['explanation']}")

    return all_facts, eval_res

run_evaluation('delhivery', 'dataset/starter-datasets/delhivery')
run_evaluation('india-macroeconomy', 'dataset/starter-datasets/india-macroeconomy')
