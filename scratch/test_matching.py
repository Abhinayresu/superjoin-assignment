import os
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, os.path.abspath('.'))
import glob
from src.pipeline import FactPipeline
from src.schema import ExtractedFact

p = FactPipeline()

def extract_and_show_all(folder_name):
    print(f"\n=======================================================")
    print(f"FACT EXTRACTOR DUMP FOR: {folder_name}")
    print(f"=======================================================")
    files = sorted(glob.glob(os.path.join('dataset', 'starter-datasets', folder_name, '*.pdf')))
    res_dict = p.process_multiple_pdfs(files)
    
    all_facts = []
    for doc_name, res in res_dict.items():
        print(f"\n--- Document: {doc_name} ({len(res.facts)} facts) ---")
        for idx, f in enumerate(res.facts):
            all_facts.append(f)
            print(f"  [{idx}] p.{f.source_evidence.page_number} | Subj: {f.subject!r} | Attr: {f.attribute} | Val: {f.value_text!r} (norm: {f.normalized_value}) | Unit: {f.unit} | Period: {f.time_period} | Scope: {f.scope}")
            print(f"      Quote: {f.source_evidence.exact_quote[:120]!r}")

extract_and_show_all('delhivery')
extract_and_show_all('india-macroeconomy')
