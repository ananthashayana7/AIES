import json

with open("rules.json") as f:
    RULES = json.load(f)

def evaluate_rules(parameters: dict):
    violations = []

    for rule in RULES:
        param = rule["parameter"]
        if param in parameters:
            if parameters[param] < rule["min_value"]:
                violations.append({
                    "rule_id": rule["id"],
                    "message": rule["message"],
                    "current": parameters[param],
                    "required": rule["min_value"]
                })

    return violations
