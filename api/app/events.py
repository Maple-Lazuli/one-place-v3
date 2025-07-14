from flask import Blueprint, jsonify

events_bp = Blueprint('events', __name__)


@events_bp.route('/test',  methods=['GET'])
def report():
    return jsonify({"test": "Events  Endpoint Reached."})
