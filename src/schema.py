from pydantic import BaseModel, Field
from typing import List, Optional
import uuid

class SourceEvidence(BaseModel):
    doc_name: str = Field(..., description="Name of the source PDF document")
    page_number: int = Field(..., description="1-indexed page number where the fact was found")
    exact_quote: str = Field(..., description="Exact verbatim text quote from the document supporting the fact")
    context_snippet: Optional[str] = Field(None, description="Surrounding text paragraph for additional context")

class ExtractedFact(BaseModel):
    fact_id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8], description="Unique identifier for the fact")
    doc_name: str = Field(..., description="Name of the source PDF document")
    subject: str = Field(..., description="The main entity or topic (e.g. 'Delhivery Revenue', 'India Real GDP Growth')")
    attribute: str = Field(..., description="The metric or property (e.g. 'revenue', 'gdp_growth_rate', 'active_directors')")
    value_text: str = Field(..., description="The exact value as stated in text (e.g. '₹8,142 Crores', '6.8%')")
    normalized_value: Optional[float] = Field(None, description="Standardized numeric value if applicable (e.g. 81420000000.0 or 6.8)")
    unit: str = Field(default="N/A", description="Unit of measurement if applicable (e.g. 'INR Crores', '%', 'Count')")
    time_period: str = Field(default="Unspecified", description="Time period or date context (e.g. 'FY 2023-24', 'Q4 FY24', 'As of March 31, 2024')")
    scope: str = Field(default="General", description="Scope or segment (e.g. 'Consolidated', 'Express Parcel Segment', 'Overall Economy')")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Extraction confidence score between 0.0 and 1.0")
    source_evidence: SourceEvidence = Field(..., description="Source evidence linking fact directly to document page and quote")

class ExtractedFactCollection(BaseModel):
    facts: List[ExtractedFact] = Field(default_factory=list, description="Collection of extracted facts")

class PDFPageChunk(BaseModel):
    doc_name: str
    page_number: int
    text: str

class IngestionResult(BaseModel):
    doc_name: str
    total_pages: int
    extracted_facts_count: int
    facts: List[ExtractedFact]
