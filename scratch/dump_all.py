import os
import sys
import re
sys.path.insert(0, os.path.abspath('.'))
import glob
from src.pdf_parser import PDFParser

parser = PDFParser()

def dump_all_text(folder_name):
    files = sorted(glob.glob(os.path.join('dataset', 'starter-datasets', folder_name, '*.pdf')))
    print(f"\n=================== DUMPING TEXT: {folder_name} ===================")
    
    for f in files:
        bname = os.path.basename(f)
        chunks = parser.parse_pdf(f)
        out_name = f"scratch/dump_{bname}.txt"
        with open(out_name, "w", encoding="utf-8") as out:
            out.write(f"=== {bname} ({len(chunks)} pages) ===\n")
            for c in chunks:
                out.write(f"\n--- PAGE {c.page_number} ---\n")
                out.write(c.text + "\n")
        print(f"Wrote {out_name}")

dump_all_text('delhivery')
dump_all_text('india-macroeconomy')
