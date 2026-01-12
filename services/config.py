import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Data Paths
REPORTS_DIR = os.path.join(BASE_DIR, "../reports")
LOG_FILE = os.path.join(BASE_DIR, "ai_reasoning/feedback_log.json")
RULES_FILE = os.path.join(BASE_DIR, "rule_engine/rules.json")
MATERIALS_FILE = os.path.join(BASE_DIR, "material_service/materials.json")
INTENT_DB_FILE = os.path.join(BASE_DIR, "intent_service/intent_db.json")

# Ensure critical directories exist
os.makedirs(REPORTS_DIR, exist_ok=True)