from fastapi import FastAPI, HTTPException
from schemas import DesignIntent
from db import store_intent, get_intent

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
