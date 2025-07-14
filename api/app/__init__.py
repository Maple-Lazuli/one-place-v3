import os
from flask import Flask
import tomli as toml

from .configuration import load_config


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
    app.register_blueprint(canvas_bp)
    app.register_blueprint(code_snippets_bp)
    app.register_blueprint(equation_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(files_bp)
    app.register_blueprint(images_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(pages_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(sessions_bp)
    app.register_blueprint(tags_bp)
    app.register_blueprint(todo_bp)
    app.register_blueprint(translations_bp)
    app.register_blueprint(users_bp)

    return app
