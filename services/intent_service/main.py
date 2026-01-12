from fastapi import FastAPI, HTTPException
from .schemas import DesignIntent, RequirementText
from .db import store_intent, get_intent
import uuid

app = FastAPI(title="Design Intent Service")

@app.post("/intent")
def create_intent(intent: DesignIntent):
    store_intent(intent)
    return {"status": "stored", "design_id": intent.design_id}

@app.get("/intent/{design_id}")
def read_intent(design_id: str):
    intent = get_intent(design_id)
    if not intent:
        raise HTTPException(status_code=404, detail="Not found")
    return intent

@app.post("/intent/extract", response_model=DesignIntent)
def extract_intent_from_text(req: RequirementText):
    # Mocking LLM extraction logic
    # In production, this would call an LLM with the raw_text
    extracted_data = {
        "functional_requirements": {"max_load": "1000N", "environment": "outdoor"},
        "constraints": {"material": "Aluminium 6061", "max_weight": "500g"},
        "interfaces": {"mounting": "M6 bolts"},
        "design_parameters": {"wall_thickness": 3.0},
        "acceptance_criteria": {"safety_factor": 1.5}
    }
    
    intent = DesignIntent(
        design_id=str(uuid.uuid4()),
        version="1.0",
        part_class="extracted_part",
        **extracted_data
    )
    store_intent(intent)
    return intent
