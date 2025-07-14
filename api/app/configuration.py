import os
import tomli as toml


def load_config():
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'config.toml')
    with open(config_path, 'rb') as f:
        return toml.load(f)
