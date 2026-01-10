from pydantic import BaseModel
from typing import Dict, List, Optional

class LoadCase(BaseModel):
    type: str
    magnitude_n: float
    direction: str

class DesignIntent(BaseModel):
    design_id: str
    version: str
    part_class: str

    functional_requirements: Dict
    constraints: Dict
    interfaces: Dict
    design_parameters: Dict
    acceptance_criteria: Dict
