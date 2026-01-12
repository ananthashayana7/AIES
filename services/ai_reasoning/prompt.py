SYSTEM_PROMPT = """
You are an engineering reasoning assistant.
You NEVER generate geometry.
You only reason over parameters, constraints, and simulation results.
You must return valid JSON matching the response schema.
"""

def build_analysis_prompt(intent, snapshot, violations, history="", impact_data=None):
    return f"""
Analyze the following engineering design context:

DESIGN INTENT:
{intent}

CURRENT CAD SNAPSHOT:
{snapshot}

DETECTED RULE VIOLATIONS:
{violations}

COST & SUSTAINABILITY IMPACT:
{impact_data}

RELEVANT PAST DECISIONS (LEARNING):
{history}

Task:
1. Evaluate compliance with design intent.
2. Assess risks (manufacturing, structural, etc.).
3. Suggest parameter updates to resolve violations or improve the design.
4. Explain your reasoning.

Output JSON format:
{{
    "compliance": bool,
    "risk_score": float (0.0 to 1.0),
    "violations": list,
    "suggested_parameter_updates": dict,
    "explanation": str
}}
"""
