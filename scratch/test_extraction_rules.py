import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import re

def normalize_period(raw_str):
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

def parse_val_and_unit(val_str):
    s = val_str.lower()
    num_m = re.search(r'\d+(?:\.\d+)?', val_str.replace(',', ''))
    if not num_m:
        return None, "N/A"
    num = float(num_m.group(0))
    
    if "%" in s or "percent" in s or "per cent" in s:
        return num, "%"
    if "cr" in s or "crore" in s:
        return num * 10.0, "INR Millions" # convert Crores to Millions
    if "mn" in s or "million" in s:
        return num, "INR Millions"
    if "₹" in val_str or "rs" in s or "inr" in s:
        return num, "INR"
    return num, "Numerical"

print("FY24 test:", normalize_period("Achieved EBITDA profit of ₹1,266 million in FY24"))
print("FY24 Earnings test:", normalize_period("FY24 EBITDA increased by Rs. 578 Cr to Rs. 127 Cr"))
print("FY25 Economic Survey test:", normalize_period("headline inflation softened to 4.9 per cent in FY25"))
print("FY25 RBI test:", normalize_period("Headline inflation moderated to an average of 4.6 per cent in 2024-25"))

v1, u1 = parse_val_and_unit("₹1,266 million")
v2, u2 = parse_val_and_unit("Rs. 127 Cr")
print(f"₹1,266 Mn -> {v1} {u1} | Rs. 127 Cr -> {v2} {u2} | Rel Diff: {abs(v1-v2)/v1:.4f}")

v3, u3 = parse_val_and_unit("₹81,415.38 million")
v4, u4 = parse_val_and_unit("Rs 8,142 Cr")
print(f"₹81,415 Mn -> {v3} {u3} | Rs 8,142 Cr -> {v4} {u4} | Rel Diff: {abs(v3-v4)/v3:.4f}")
