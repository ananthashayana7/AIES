from services.ai_reasoning.schemas import CADSnapshot, SolidWorksSettings

def parse_cad_file(filename: str) -> CADSnapshot:
    # Simulating parsing a SolidWorks file (.SLDPRT)
    print(f"[CAD Connector] Parsing geometry and Document Properties from {filename}...")
    
    # Return a simulated snapshot corresponding to the demo scenario
    return CADSnapshot(
        design_parameters={
            "wall_thickness_mm": 3.0,
            "fillet_radius_mm": 1.0,  # Violation
            "material": "Aluminium 6061"
        },
        mass_properties={
            "weight_g": 520.0,        # Violation
            "volume_mm3": 192000.0
        },
        document_properties=SolidWorksSettings(
            unit_system="IPS",        # Violation: Should be MMGS
            tolerance_standard="ISO",
            image_quality="High"
        ),
        feature_counts={
            "extrudes": 2,
            "cuts": 4,
            "fillets": 8
        }
    )