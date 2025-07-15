from http import HTTPStatus as STATUS
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request, make_response

todo_bp = Blueprint('todo', __name__, url_prefix='/todo')

from .db import get_db_connection
from .sessions import verify_session_for_access
from .projects import authorized_project_access


@todo_bp.route('/test', methods=['GET'])
def test_ep():
    return jsonify({"test": "Todo  Endpoint Reached."})


@todo_bp.route('/create', methods=['POST'])
def create_ep():
    data = request.get_json()
    project_id = int(data.get("project_id"))
    todo_name = data.get("name").strip()
    todo_description = data.get("description").strip()
    todo_due = float(data.get("dueTime", None))

    if todo_due is not None:
        todo_due = datetime.fromtimestamp(todo_due)

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Not Authorized", STATUS.FORBIDDEN)

    new_todo = create_todo(session['UserID'], project_name, description)

    if new_todo is None:
        return make_response("Failed To Create Project", STATUS.INTERNAL_SERVER_ERROR)

    response = make_response(f"Created: {todo_name}", STATUS.OK)
    return response


@todo_bp.route('/get', methods=['GET'])
def get_ep():
    return jsonify({"test": "Todo  Endpoint Reached."})


@todo_bp.route('/get_all', methods=['GET'])
def get_all_ep():
    return jsonify({"test": "Todo  Endpoint Reached."})


@todo_bp.route('/update', methods=['PATCH'])
def update_ep():
    return jsonify({"test": "Todo  Endpoint Reached."})


@todo_bp.route('/complete', methods=['PATCH'])
def complete_ep():
    return jsonify({"test": "Todo  Endpoint Reached."})


@todo_bp.route('/delete', methods=['DELETE'])
def delete_ep():
    return jsonify({"test": "Todo  Endpoint Reached."})
