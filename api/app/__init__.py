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
    from .analytics import analytics_bp
    from .canvas import canvas_bp
    from .code_snippets import code_snippets_bp
    from .equations import equation_bp
    from .events import events_bp
    from .files import files_bp
    from .images import images_bp
    from .main import main_bp
    from .pages import pages_bp
    from .projects import projects_bp
    from .sessions import sessions_bp
    from .tags import tags_bp
    from .todo import todo_bp
    from .translations import translations_bp
    from .users import users_bp

    app.register_blueprint(analytics_bp)
    app.register_blueprint(users_bp)

    app.register_blueprint(main_bp)

    return app
