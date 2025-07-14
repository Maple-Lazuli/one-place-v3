from flask import Blueprint, jsonify

todo_bp = Blueprint('todo', __name__)


@todo_bp.route('/test',  methods=['GET'])
def report():
    return jsonify({"test": "Todo Reached."})
