from flask import Blueprint, jsonify

sessions_bp = Blueprint('sessions', __name__, url_prefix='/sessions')

@sessions_bp.route('/test',  methods=['GET'])
def test():
    return jsonify({"test": "Sessions  Endpoint Reached."})
