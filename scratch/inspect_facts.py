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

def inspect_dataset(name, path_pattern):
    print(f'=== {name.upper()} ===')
    pdfs = sorted(glob.glob(os.path.join(path_pattern, '*.pdf')))
    print('PDFs found:', pdfs)
    results = p.process_multiple_pdfs(pdfs)
    all_facts = []
    for doc_name, res in results.items():
        print(f'--- {doc_name} ({res.extracted_facts_count} facts) ---')
        for f in res.facts:
            all_facts.append(f)
            print(f'  [p.{f.source_evidence.page_number}] Subj: {f.subject!r} | Attr: {f.attribute} | Val: {f.value_text!r} | Period: {f.time_period} | Unit: {f.unit} | Quote: {f.source_evidence.exact_quote[:80]!r}')
    
    rec = KnowledgeReconciler()
    eval_res = rec.evaluate_facts(all_facts)
    print(f'EVALUATION FOR {name}:')
    print(f'  Corroborations: {len(eval_res["corroborations"])}')
    print(f'  Conflicts: {len(eval_res["conflicts"])}')
    print(f'  Context Explained: {len(eval_res["context_explained"])}')
    print(f'  Uncertainties: {len(eval_res["uncertainties"])}')
    return all_facts, eval_res

facts_d, res_d = inspect_dataset('delhivery', 'dataset/starter-datasets/delhivery')
facts_m, res_m = inspect_dataset('india-macroeconomy', 'dataset/starter-datasets/india-macroeconomy')
