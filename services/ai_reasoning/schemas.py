from pydantic import BaseModel
from typing import Dict, Optional, Any, Union

class SolidWorksSettings(BaseModel):
    unit_system: str  # e.g., "MMGS", "IPS"
    tolerance_standard: str  # e.g., "ISO", "ANSI"
    image_quality: str  # e.g., "High", "Draft"

class CADSnapshot(BaseModel):
    design_parameters: Dict[str, Union[float, str]]
    mass_properties: Dict[str, float]
    document_properties: SolidWorksSettings
    feature_counts: Dict[str, int]
    fea_summary: Optional[Dict[str, float]] = None

class AnalysisRequest(BaseModel):
    # We accept a dict for design_intent to be flexible, 
    # or we could duplicate the schema from intent_service
    design_intent: Dict[str, Any]
    cad_snapshot: CADSnapshot

class FeedbackRequest(BaseModel):
    analysis_id: Optional[str] = "latest"
    decision: str  # "accepted", "rejected", "modified"
    comments: Optional[str] = None