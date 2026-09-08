import os
import json
import glob
import logging
from typing import List, Dict, Any
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from src.pipeline import FactPipeline
from src.reconciler import KnowledgeReconciler
from src.schema import ExtractedFact

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Fact Knowledge Layer API", version="1.0.0")

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = FactPipeline()
reconciler = KnowledgeReconciler()

STORE_PATH = "knowledge_store.json"

def load_store() -> List[Dict[str, Any]]:
    if os.path.exists(STORE_PATH):
        try:
            with open(STORE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading store: {e}")
    return []

def save_store(facts: List[Dict[str, Any]]):
    with open(STORE_PATH, "w", encoding="utf-8") as f:
        json.dump(facts, f, indent=2, ensure_ascii=False)

def get_extracted_facts() -> List[ExtractedFact]:
    raw_facts = load_store()
    facts = []
    for item in raw_facts:
        try:
            facts.append(ExtractedFact(**item))
        except Exception:
            pass
    return facts

@app.get("/api/status")
def get_status():
    facts = get_extracted_facts()
    eval_res = reconciler.evaluate_facts(facts)
    
    # Get unique document names
    doc_names = list(set([f.doc_name for f in facts]))

    return {
        "status": "online",
        "total_documents": len(doc_names),
        "total_facts": len(facts),
        "pending_conflicts": len(eval_res["conflicts"]),
        "corroborations": len(eval_res["corroborations"]),
        "context_explained": len(eval_res["context_explained"]),
        "uncertainties": len(eval_res["uncertainties"])
    }

@app.get("/api/documents")
def get_documents():
    facts = get_extracted_facts()
    doc_groups: Dict[str, Dict[str, Any]] = {}

    for f in facts:
        name = f.doc_name
        if name not in doc_groups:
            doc_groups[name] = {
                "name": name,
                "size": "Excerpt PDF",
                "step": 6,
                "done": True,
                "facts": 0,
                "conflicts": 0,
                "pages": 0
            }
        doc_groups[name]["facts"] += 1
        doc_groups[name]["pages"] = max(doc_groups[name]["pages"], f.source_evidence.page_number)

    eval_res = reconciler.evaluate_facts(facts)
    for c in eval_res["conflicts"]:
        for doc_key in [c.get("sourceA"), c.get("sourceB")]:
            if doc_key in doc_groups:
                doc_groups[doc_key]["conflicts"] += 1

    return list(doc_groups.values())

@app.post("/api/ingest")
async def ingest_file(file: UploadFile = File(...)):
    try:
        uploads_dir = "uploads"
        os.makedirs(uploads_dir, exist_ok=True)
        file_path = os.path.join(uploads_dir, file.filename)
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        ingest_res = pipeline.process_pdf(file_path)

        # Merge with existing store
        existing = load_store()
        new_dict_facts = [fact.model_dump() for fact in ingest_res.facts]
        updated_store = existing + new_dict_facts
        save_store(updated_store)

        return {
            "success": True,
            "filename": ingest_res.doc_name,
            "total_pages": ingest_res.total_pages,
            "extracted_facts": ingest_res.extracted_facts_count
        }
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/demo/seed")
def seed_demo_data(dataset: str = "delhivery"):
    """Ingest starter datasets directly from workspace."""
    path_map = {
        "delhivery": os.path.join("dataset", "starter-datasets", "delhivery"),
        "india-macroeconomy": os.path.join("dataset", "starter-datasets", "india-macroeconomy")
    }

    target_dir = path_map.get(dataset, path_map["delhivery"])
    pdf_files = glob.glob(os.path.join(target_dir, "*.pdf"))

    if not pdf_files:
        raise HTTPException(status_code=404, detail="Starter dataset PDFs not found.")

    results = pipeline.process_multiple_pdfs(pdf_files)
    pipeline.save_facts_to_json(results, output_path=STORE_PATH)

    facts = get_extracted_facts()
    return {
        "success": True,
        "message": f"Successfully ingested {len(pdf_files)} dataset PDFs",
        "total_facts": len(facts)
    }

@app.get("/api/facts")
def get_facts():
    facts = get_extracted_facts()
    eval_res = reconciler.evaluate_facts(facts)

    conflict_ids = set()
    for c in eval_res["conflicts"]:
        # Extract fact IDs from pair string if format c_fact1_fact2
        parts = c["id"].split("_")
        if len(parts) >= 3:
            conflict_ids.add(parts[1])
            conflict_ids.add(parts[2])

    result_facts = []
    for f in facts:
        # Assign tag dynamically based on subject/attribute
        subj_lower = (f.subject + " " + f.attribute).lower()
        if any(w in subj_lower for w in ["revenue", "gdp", "profit", "growth", "price", "inflation", "financial", "expenditure"]):
            tag = "financial"
        elif any(w in subj_lower for w in ["director", "ceo", "governance", "board", "management", "history"]):
            tag = "governance"
        else:
            tag = "workforce"

        result_facts.append({
            "id": f.fact_id,
            "fact": f.subject,
            "entity": f.doc_name,
            "value": f.value_text,
            "period": f.time_period,
            "scope": f.scope,
            "confidence": int(f.confidence_score * 100),
            "source": f.doc_name,
            "page": f.source_evidence.page_number,
            "evidence": f.source_evidence.exact_quote,
            "tag": tag,
            "conflict": f.fact_id in conflict_ids
        })

    return result_facts

@app.get("/api/conflicts")
def get_conflicts():
    facts = get_extracted_facts()
    eval_res = reconciler.evaluate_facts(facts)
    # Combine genuine conflicts and context-explained comparisons
    all_evals = eval_res["conflicts"] + eval_res["context_explained"]
    return all_evals

@app.get("/api/uncertainties")
def get_uncertainties():
    facts = get_extracted_facts()
    eval_res = reconciler.evaluate_facts(facts)
    return eval_res["uncertainties"]

@app.get("/api/evidence")
def get_evidence():
    facts = get_extracted_facts()
    doc_evidence: Dict[str, List[Dict[str, Any]]] = {}

    for f in facts:
        name = f.doc_name
        if name not in doc_evidence:
            doc_evidence[name] = []

        doc_evidence[name].append({
            "fact_id": f.fact_id,
            "subject": f.subject,
            "value": f.value_text,
            "page_number": f.source_evidence.page_number,
            "exact_quote": f.source_evidence.exact_quote,
            "context_snippet": f.source_evidence.context_snippet
        })

    return doc_evidence

@app.get("/api/graph")
def get_graph():
    facts = get_extracted_facts()
    eval_res = reconciler.evaluate_facts(facts)

    nodes = []
    links = []

    doc_names = list(set([f.doc_name for f in facts]))
    for d_idx, doc in enumerate(doc_names):
        nodes.append({
            "id": f"doc_{d_idx}",
            "label": doc,
            "type": "document",
            "val": 15
        })

    for idx, f in enumerate(facts[:40]):  # Limit top facts for graph rendering
        fact_node_id = f"fact_{f.fact_id}"
        nodes.append({
            "id": fact_node_id,
            "label": f"{f.subject}: {f.value_text}",
            "type": "fact",
            "val": 8,
            "doc": f.doc_name
        })

        doc_node_id = f"doc_{doc_names.index(f.doc_name)}" if f.doc_name in doc_names else "doc_0"
        links.append({
            "source": doc_node_id,
            "target": fact_node_id,
            "relationship": "EXTRACTED_FROM"
        })

    # Add cross-document relationship links
    for c in eval_res["corroborations"][:15]:
        parts = c["id"].split("_")
        if len(parts) >= 3:
            links.append({
                "source": f"fact_{parts[1]}",
                "target": f"fact_{parts[2]}",
                "relationship": "CORROBORATES",
                "color": "#4ade80"
            })

    for c in eval_res["conflicts"][:15]:
        parts = c["id"].split("_")
        if len(parts) >= 3:
            links.append({
                "source": f"fact_{parts[1]}",
                "target": f"fact_{parts[2]}",
                "relationship": "CONTRADICTS",
                "color": "#f87171"
            })

    return {"nodes": nodes, "links": links}

@app.get("/api/timeline")
def get_timeline():
    facts = get_extracted_facts()
    events = []
    for f in facts:
        events.append({
            "id": f.fact_id,
            "title": f.subject,
            "value": f.value_text,
            "period": f.time_period,
            "source": f.doc_name,
            "page": f.source_evidence.page_number,
            "evidence": f.source_evidence.exact_quote,
            "scope": f.scope
        })
    return events
