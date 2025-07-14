from flask import Blueprint, jsonify

images_bp = Blueprint('images', __name__)


@images_bp.route('/test',  methods=['GET'])
def report():
    return jsonify({"test": "Images  Endpoint Reached."})
