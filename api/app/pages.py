from flask import Blueprint, jsonify

pages_bp = Blueprint('pages', __name__)


@pages_bp.route('/test',  methods=['GET'])
def report():
    return jsonify({"test": "Pages  Endpoint Reached."})
