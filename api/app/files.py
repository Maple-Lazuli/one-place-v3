from flask import Blueprint, jsonify

files_bp = Blueprint('files', __name__)


@files_bp.route('/test',  methods=['GET'])
def report():
    return jsonify({"test": "Files  Endpoint Reached."})
