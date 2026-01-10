from fastapi import FastAPI
from rule_engine.engine import evaluate_rules

app = FastAPI(title="AI Reasoning Service")

@app.post("/analyze")
def analyze(payload: dict):
    parameters = payload["cad_snapshot"]["parameters"]

    violations = evaluate_rules(parameters)

    response = {
        "compliance": len(violations) == 0,
        "risk_score": 0.8 if violations else 0.2,
        "violations": violations,
        "suggested_parameter_updates": {
            "fillet_radius_mm": 2.5
        } if violations else {},
        "explanation": "Rule-based assessment completed"
    }

    return response
