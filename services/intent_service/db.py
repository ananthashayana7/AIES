_intent_store = {}

def store_intent(intent):
    _intent_store[intent.design_id] = intent.dict()

def get_intent(design_id):
    return _intent_store.get(design_id)
