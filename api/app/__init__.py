import os
from flask import Flask
import pytoml as toml  # Or use 'tomli' if pytoml isn't working


def load_config():
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'config.toml')
    with open(config_path, 'r') as f:
        return toml.load(f)


def create_app():
    app = Flask(__name__)

    # Load config
    config = load_config()
    app.config['DEBUG'] = config['flask']['debug']

    # Register blueprints
    from .auth import auth_bp
    from .analytics import analytics_bp
    from .main import main_bp

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(analytics_bp, url_prefix='/analytics')
    app.register_blueprint(main_bp)

    return app
