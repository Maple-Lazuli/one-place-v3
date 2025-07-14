from flask import Blueprint, jsonify

sessions_bp = Blueprint('sessions', __name__)


@sessions_bp.route('/test',  methods=['GET'])
def report():
    return jsonify({"test": "Sessions  Endpoint Reached."})
