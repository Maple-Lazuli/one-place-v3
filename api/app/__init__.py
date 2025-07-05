import os
from flask import Flask
import tomli as toml


def load_config():
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'config.toml')
    with open(config_path, 'rb') as f:
        return toml.load(f)


def create_app():
    app = Flask(__name__)

    # Load config
    config = load_config()
    app.config['DEBUG'] = config['flask']['debug']

    # Register blueprints
    from .auth import auth_bp
    from .analytics import analytics_bp
    from .demo import demo_bp
    from .main import main_bp

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(analytics_bp, url_prefix='/analytics')
    app.register_blueprint(demo_bp, url_prefix='/demo')

    app.register_blueprint(main_bp)

    return app
