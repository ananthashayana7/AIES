from fastapi import FastAPI
from services.rule_engine.engine import evaluate_rules
from services.knowledge_base.retriever import retrieve_lessons
from services.cost_estimator.estimator import estimate_impact
from .schemas import AnalysisRequest, FeedbackRequest
from .prompt import SYSTEM_PROMPT, build_analysis_prompt
from services.config import LOG_FILE
import json
import os

app = FastAPI(title="AI Reasoning Service")

# Mocking an LLM client for this demonstration
def mock_llm_inference(system_prompt, user_prompt, detected_violations, history):
    # In a real system, this would call OpenAI/Gemini API
    
    # Dynamic response based on input violations
    suggestions = {}
    explanation = "AI Reasoning: Design meets most criteria."
    
    for v in detected_violations:
        if v["rule_id"] == "max_weight_drone":
            suggestions["wall_thickness_mm"] = 2.5  # Suggest reducing thickness
            explanation = "AI Reasoning: Weight limit exceeded. Reducing wall thickness by 0.5mm will bring mass within 500g limit while maintaining structural integrity."
        elif v["rule_id"] == "min_fillet_cnc":
            suggestions["fillet_radius_mm"] = 2.0
            explanation = "AI Reasoning: Sharp corners detected. Increasing fillet radius to 2mm ensures CNC manufacturability."
        elif v["rule_id"] == "unit_system_check":
            suggestions["unit_system"] = "MMGS"
            explanation += " Detected IPS units; switching to MMGS to align with project standards."
            
    if "Accepted decision" in history:
        explanation += " (Incorporated insights from past engineering feedback)."

    return {
        "risk_score": 0.8 if detected_violations else 0.1,
        "violations": [], 
        "suggested_parameter_updates": suggestions,
        "explanation": explanation
    }

@app.post("/analyze")
def analyze(payload: AnalysisRequest):
    # 1. Flatten parameters for Rule Engine (combining design params and mass props)
    flat_params = {
        **payload.cad_snapshot.design_parameters, 
        **payload.cad_snapshot.mass_properties,
        **payload.cad_snapshot.document_properties.dict()
    }

    # 2. Deterministic Rule Check
    violations = evaluate_rules(flat_params)

    # 3. Retrieve Knowledge (RAG)
    history = retrieve_lessons()

    # 4. Estimate Cost & Sustainability
    material = payload.cad_snapshot.design_parameters.get("material", "Unknown")
    volume = payload.cad_snapshot.mass_properties.get("volume_mm3", 0)
    impact = estimate_impact(material, volume)

    # 5. AI Reasoning
    user_prompt = build_analysis_prompt(
        intent=payload.design_intent,
        snapshot=payload.cad_snapshot.dict(),
        violations=violations,
        history=history,
        impact_data=impact if impact else "Impact data unavailable"
    )
    
    # Call LLM (Mocked)
    ai_response = mock_llm_inference(SYSTEM_PROMPT, user_prompt, violations, history)
    
    # Merge Rule Violations with AI response
    # We prioritize the deterministic rule violations
    final_violations = violations + ai_response.get("violations", [])
    
    response = {
        "compliance": len(final_violations) == 0,
        "risk_score": 0.9 if violations else ai_response["risk_score"],
        "estimated_cost": impact["cost_usd"] if impact else None,
        "carbon_footprint_kg": impact["carbon_kg"] if impact else None,
        "violations": final_violations,
        "suggested_parameter_updates": ai_response["suggested_parameter_updates"],
        "explanation": f"Rule Engine found {len(violations)} violations. " + ai_response["explanation"]
    }

    return response

@app.post("/feedback")
def log_feedback(feedback: FeedbackRequest):
    # Log feedback to a file for future fine-tuning
    log_entry = feedback.dict()
    
    # Simple append to file
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(log_entry) + "\n")
        
    return {"status": "logged", "message": "Engineer feedback recorded for learning loop."}
