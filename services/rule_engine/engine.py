import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RULES_PATH = os.path.join(BASE_DIR, "rules.json")

with open(RULES_PATH) as f:
    RULES = json.load(f)

def evaluate_rules(parameters: dict):
    violations = []

    for rule in RULES:
        param = rule["parameter"]
        if param in parameters:
            # Check allowed values (categorical)
            if "allowed_values" in rule and parameters[param] not in rule["allowed_values"]:
                violations.append({
                    "rule_id": rule["id"],
                    "message": rule["message"],
                    "current": parameters[param],
                    "required": f"One of {rule['allowed_values']}"
                })

            # Check minimum value constraint
            if "min_value" in rule and parameters[param] < rule["min_value"]:
                violations.append({
                    "rule_id": rule["id"],
                    "message": rule["message"],
                    "current": parameters[param],
                    "required": f">= {rule['min_value']}"
                })

            # Check maximum value constraint
            if "max_value" in rule and parameters[param] > rule["max_value"]:
                violations.append({
                    "rule_id": rule["id"],
                    "message": rule["message"],
                    "current": parameters[param],
                    "required": f"<= {rule['max_value']}"
                })

    return violations
