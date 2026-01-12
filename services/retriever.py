import json
import os
from services.config import LOG_FILE

def retrieve_lessons():
    if not os.path.exists(LOG_FILE):
        return "No past lessons found."
    
    lessons = []
    try:
        with open(LOG_FILE, "r") as f:
            for line in f:
                try:
                    data = json.loads(line)
                    if data.get("decision") == "accepted":
                        lessons.append(f"- Accepted decision: {data.get('comments')}")
                except json.JSONDecodeError:
                    continue
    except Exception:
        pass
    
    if not lessons:
        return "No relevant lessons found."
    
    return "\n".join(lessons[-5:])