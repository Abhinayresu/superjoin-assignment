import os
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import re

out = open("scratch/search_results.txt", "w", encoding="utf-8")

def log(msg=""):
    print(msg)
    out.write(str(msg) + "\n")

def search_text_files(file_list, query):
    log(f"\n================ SEARCH QUERY: '{query}' ================")
    for fname in file_list:
        bname = os.path.basename(fname)
        with open(fname, "r", encoding="utf-8") as f:
            content = f.read()
        pages = content.split("--- PAGE ")
        for p in pages[1:]:
            lines = p.split("\n")
            page_num = lines[0].split(" ---")[0]
            p_text = "\n".join(lines[1:])
            if re.search(query, p_text, re.IGNORECASE):
                matching_lines = [l.strip() for l in lines if re.search(query, l, re.IGNORECASE) and any(c.isdigit() for c in l)]
                if matching_lines:
                    log(f"[{bname} Page {page_num}]:")
                    for ml in matching_lines[:5]:
                        log(f"   {ml[:140]}")

delhivery_files = [
    "scratch/dump_01-delhivery-prospectus-2022-excerpt.pdf.txt",
    "scratch/dump_02-delhivery-annual-report-fy24-excerpt.pdf.txt",
    "scratch/dump_03-delhivery-q4-fy24-earnings-presentation.pdf.txt"
]

macro_files = [
    "scratch/dump_01-india-economic-survey-2024-25-excerpt.pdf.txt",
    "scratch/dump_02-rbi-annual-report-2024-25-excerpt.pdf.txt",
    "scratch/dump_03-imf-india-2025-article-iv-excerpt.pdf.txt"
]

log("=== DELHIVERY SEARCHES ===")
search_text_files(delhivery_files, r"gdp|growth|revenue|ebitda|profit|loss|pin\s*code|express\s*parcel|network|headcount|employee|shareholding|sahil|barua")

log("\n=== INDIA MACRO SEARCHES ===")
search_text_files(macro_files, r"gdp|real gdp|growth|headline inflation|cpi inflation|food inflation|core inflation|wpi|revenue expenditure|fiscal deficit")

out.close()
log("DONE SEARCHING")
