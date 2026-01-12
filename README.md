# AI-Augmented Engineering System (AIES)

This system provides an AI-driven layer over mechanical design processes, validating SolidWorks designs against requirements, rules, and sustainability metrics.

## System Components
- **Intent Service**: NLP extraction of requirements.
- **Rule Engine**: Deterministic validation (Geometry, Materials, Units).
- **AI Reasoning**: LLM-based trade-off analysis and suggestions.
- **Cost & Carbon Estimator**: Real-time impact analysis.
- **Reporting**: Automated HTML compliance reports.

## How to Run the Demo

The demo script simulates the full lifecycle:
1. Engineer inputs text requirements.
2. System parses CAD file (simulated).
3. AI analyzes design, checks rules, and estimates cost/carbon.
4. Report is generated.

**Run Command:**
`python services/ai_reasoning/demo_flow.py`