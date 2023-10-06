trigger_registry = {}


def register_trigger(trigger_id, name):
    trigger_registry[trigger_id] = name


def fire_trigger(name):
    pass
