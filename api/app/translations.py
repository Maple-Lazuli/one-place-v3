from flask import Blueprint, jsonify

translations_bp = Blueprint('translations', __name__)


@translations_bp.route('/test',  methods=['GET'])
def report():
    return jsonify({"test": "Translations Reached."})
