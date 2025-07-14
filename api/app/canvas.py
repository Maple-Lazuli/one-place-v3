from flask import Blueprint, jsonify

canvas_bp = Blueprint('canvas', __name__)


@canvas_bp.route('/test',  methods=['GET'])
def report():
    return jsonify({"test": "Canvas  Endpoint Reached."})
