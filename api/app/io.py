from flask import Blueprint, jsonify

auth_bp = Blueprint('io', __name__)


@auth_bp.route('/create_page',  methods=['POST'])
def login():
    return jsonify({"status": "logged in"})
