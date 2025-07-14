from flask import Blueprint, jsonify

tags_bp = Blueprint('tags', __name__)


@tags_bp.route('/test',  methods=['GET'])
def report():
    return jsonify({"test": "Tags  Endpoint Reached."})
