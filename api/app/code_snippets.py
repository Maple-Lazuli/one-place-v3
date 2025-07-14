from flask import Blueprint, jsonify

code_snippets_bp = Blueprint('code_snippet', __name__)


@code_snippets_bp.route('/test',  methods=['GET'])
def report():
    return jsonify({"test": "Code Snippet  Endpoint Reached."})
