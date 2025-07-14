from flask import Blueprint, jsonify

equation_bp = Blueprint('equations', __name__)


@equation_bp.route('/test',  methods=['GET'])
def report():
    return jsonify({"test": "Equations  Endpoint Reached."})
