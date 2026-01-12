import json
import os
from services.config import MATERIALS_FILE

def get_material_properties(material_name):
    if not os.path.exists(MATERIALS_FILE):
        return None
    
    with open(MATERIALS_FILE, 'r') as f:
        db = json.load(f)
    return db.get(material_name)