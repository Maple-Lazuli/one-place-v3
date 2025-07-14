from flask import Blueprint, jsonify

projects_bp = Blueprint('projects', __name__)


@projects_bp.route('/test',  methods=['GET'])
def report():
    return jsonify({"test": "Projects  Endpoint Reached."})
