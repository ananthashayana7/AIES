from services.material_service.library import get_material_properties

def estimate_impact(material_name, volume_mm3):
    props = get_material_properties(material_name)
    if not props:
        return None
    
    # Volume mm3 to cm3 (1 cm3 = 1000 mm3)
    vol_cm3 = volume_mm3 / 1000.0
    
    # Mass in kg (density is g/cm3) -> g -> kg
    mass_g = vol_cm3 * props['density_g_cm3']
    mass_kg = mass_g / 1000.0
    
    # Financial Cost
    material_cost = mass_kg * props['cost_per_kg']
    manufacturing_cost = material_cost * 3.0 # Heuristic
    total_cost = round(material_cost + manufacturing_cost, 2)

    # Environmental Cost (Carbon Footprint)
    carbon_footprint = round(mass_kg * props.get('co2_kg_per_kg', 0), 2)
    
    return {
        "cost_usd": total_cost,
        "carbon_kg": carbon_footprint
    }