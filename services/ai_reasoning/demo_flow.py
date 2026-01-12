import sys
import os
import json

# Add project root to path to allow imports
# We need to go up two levels: services/ai_reasoning -> services -> AIES (root)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from services.intent_service.main import extract_intent_from_text
from services.intent_service.schemas import RequirementText
from services.ai_reasoning.main import analyze, log_feedback
from services.ai_reasoning.schemas import AnalysisRequest, CADSnapshot, FeedbackRequest
from services.cad_connector.mock_cad import parse_cad_file
from services.reporting.generator import generate_html_report

def run_demo():
    print("=== AI-Augmented Design System Demo ===\n")

    # 1. Engineer inputs raw requirements (NLP Step)
    raw_req = "We need a drone arm that can hold 1000N, made of Aluminium 6061. It must weigh less than 500g."
    print(f"1. Input Requirements: '{raw_req}'")
    
    intent_req = RequirementText(raw_text=raw_req, project_name="DroneArm_X1")
    design_intent = extract_intent_from_text(intent_req)
    
    print("\n2. AI Extracted Design Intent:")
    print(json.dumps(design_intent.dict(exclude={'design_id', 'version'}), indent=2))

    # 2. Engineer creates a design in SolidWorks (Simulated Snapshot)
    # Scenario: The design is too heavy (520g) and has a sharp corner (1mm fillet)
    print("\n3. Extracting CAD Snapshot from SolidWorks...")
    # Using the CAD Connector Service
    current_snapshot = parse_cad_file("C:/Projects/Drone/Arm_v1.SLDPRT")
    print(f"   - Document Properties: {current_snapshot.document_properties}")
    print(f"   - Mass: {current_snapshot.mass_properties['weight_g']}g")

    # 3. AI Analysis Loop
    print("\n4. Running AI Engineering Analysis...")
    request = AnalysisRequest(
        design_intent=design_intent.dict(),
        cad_snapshot=current_snapshot
    )
    
    analysis_result = analyze(request)

    print("\n=== ANALYSIS REPORT ===")
    print(f"Compliance: {analysis_result['compliance']}")
    print(f"Risk Score: {analysis_result['risk_score']}")
    print(f"Estimated Cost: ${analysis_result.get('estimated_cost', 'N/A')}")
    print(f"Carbon Footprint: {analysis_result.get('carbon_footprint_kg', 'N/A')} kg CO2e")
    
    if analysis_result['violations']:
        print(f"\n[!] Violations Detected ({len(analysis_result['violations'])}):")
        for v in analysis_result['violations']:
            print(f"  - {v['message']} (Current: {v['current']}, Required: {v['required']})")
            
    if analysis_result['suggested_parameter_updates']:
        print(f"\n[+] AI Suggestions:")
        print(json.dumps(analysis_result['suggested_parameter_updates'], indent=2))
        print(f"\nReasoning: {analysis_result['explanation']}")

    # 4. Generate Report
    print("\n5. Generating Compliance Report...")
    report_path = generate_html_report(analysis_result, project_name="DroneArm_X1")
    print(f"Report generated successfully: {report_path}")
        
    # 5. Human-in-the-loop Feedback
    print("\n6. Engineer Review & Feedback...")
    feedback = FeedbackRequest(
        decision="accepted",
        comments="Suggestions to reduce thickness and increase fillet radius look correct for this load case."
    )
    feedback_response = log_feedback(feedback)
    print(f"Feedback Status: {feedback_response['message']}")
    print("\n=== DEMO COMPLETE ===")

if __name__ == "__main__":
    run_demo()