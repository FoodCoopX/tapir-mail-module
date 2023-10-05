trigger_registry = {}


def register_trigger(name):
    trigger_registry[name] = True


def fire_trigger(name):
    pass
