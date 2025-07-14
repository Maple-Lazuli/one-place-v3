from flask import Blueprint, jsonify

users_bp = Blueprint('users', __name__)


@users_bp.route('/test',  methods=['GET'])
def report():
    return jsonify({"test": "Users Reached."})
