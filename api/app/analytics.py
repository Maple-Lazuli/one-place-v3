from flask import Blueprint, jsonify

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/report', methods=['GET'])
def report():
    return jsonify({"report": "This is your analytics report."})


@analytics_bp.route('/test', methods=['GET'])
def test():
    return jsonify({"test": "Analytics  Endpoint Reached."})
