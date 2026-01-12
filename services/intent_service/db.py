import json
import os

DB_FILE = os.path.join(os.path.dirname(__file__), "intent_db.json")

def _load_db():
    if not os.path.exists(DB_FILE):
        return {}
    with open(DB_FILE, "r") as f:
        return json.load(f)

def _save_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=2)

def store_intent(intent):
    data = _load_db()
    data[intent.design_id] = intent.dict()
    _save_db(data)

def get_intent(design_id):
    data = _load_db()
    return data.get(design_id)
