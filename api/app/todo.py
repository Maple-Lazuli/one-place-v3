from http import HTTPStatus as STATUS
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request, make_response

todo_bp = Blueprint('todo', __name__, url_prefix='/todo')

from .db import get_db_connection
from .sessions import verify_session_for_access
from .projects import authorized_project_access

todo_fields = ['TodoID', 'ProjectID', 'name', 'description', 'timeCreated', 'dueTime', 'completed', 'timeCompleted',
               'lastUpdate']


def get_last_update(todo_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT lastUpdate FROM todo where TodoID = %s;", (todo_id,))
    last_update = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return last_update


def create_todo(project_id, name, description, due=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO todo (ProjectID, name, description, dueTime)
        VALUES (%s, %s, %s, %s)
        RETURNING *;
    """, (project_id, name, description, due))
    new_todo = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if new_todo is not None:
        new_todo = {k: v for k, v in zip(todo_fields, new_todo)}
    return new_todo


def get_all_todo(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM todo where projectID = %s", (project_id,))
    todos = cursor.fetchall()
    conn.commit()
    cursor.close()
    conn.close()
    if todos is not None:
        todo_list = []
        for todo in todos:
            todo = {k: v for k, v in zip(todo_fields, todo)}
            todo_list.append(todo)
        return todo_list
    return None


def get_todo_by_id(todo_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM todo where TodoID = %s", (todo_id,))
    todo = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if todo is not None:
        todo = {k: v for k, v in zip(todo_fields, todo)}
    return todo


def complete_todo(todo_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE todo SET completed = TRUE, timeCompleted = %s where TodoID = %s RETURNING *;",
                   (datetime.now(), todo_id,))
    completed_todo = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if completed_todo is not None:
        completed_todo = {k: v for k, v in zip(todo_fields, completed_todo)}
    return completed_todo


def delete_todo(todo_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM todo where TodoID = %s;", (todo_id,))
    conn.commit()
    cursor.close()
    conn.close()


def update_todo(todo_id, name, description, due=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE todo SET name = %s, description = %s, dueTime = %s  
        WHERE todoID = %s
        RETURNING *;
    """, (name, description, due, todo_id))
    updated_todo = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if updated_todo is not None:
        updated_todo = {k: v for k, v in zip(todo_fields, updated_todo)}
    return updated_todo


@todo_bp.route('/test', methods=['GET'])
def test_ep():
    return jsonify({"test": "Todo  Endpoint Reached."})


@todo_bp.route('/create', methods=['POST'])
def create_ep():
    data = request.get_json()
    project_id = int(data.get("project_id"))
    todo_name = data.get("name").strip()
    todo_description = data.get("description").strip()
    todo_due = data.get("dueTime", None)

    if todo_due is not None:
        todo_due = float(todo_due)
        todo_due = datetime.fromtimestamp(todo_due)

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Session is Invalid", STATUS.FORBIDDEN)

    if not authorized_project_access(token, project_id):
        return make_response("Not Authorized To Access ToDo", STATUS.FORBIDDEN)

    new_todo = create_todo(project_id, todo_name, todo_description, todo_due)
    if new_todo is None:
        return make_response("Failed To Create Todo", STATUS.INTERNAL_SERVER_ERROR)

    response = make_response(f"Created: {todo_name}", STATUS.OK)
    return response


@todo_bp.route('/get', methods=['GET'])
def get_ep():
    todo_id = int(request.args.get("id"))
    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Invalid Session", STATUS.FORBIDDEN)

    todo = get_todo_by_id(todo_id)

    if not authorized_project_access(token, todo['ProjectID']):
        return make_response("Not Authorized To Access ToDo", STATUS.FORBIDDEN)

    if todo is None:
        response = make_response("Does Not Exist", STATUS.OK)
        return response

    response = make_response(todo, STATUS.OK)
    return response


@todo_bp.route('/get_project_todo', methods=['GET'])
def get_all_ep():
    project_id = int(request.args.get("project_id"))
    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Invalid Session", STATUS.FORBIDDEN)

    if not authorized_project_access(token, project_id):
        return make_response("Not Authorized To Access", STATUS.FORBIDDEN)

    todo_list = get_all_todo(project_id)

    if todo_list is None:
        response = make_response("Does Not Exist", STATUS.OK)
        return response

    response = make_response(todo_list, STATUS.OK)
    return response


@todo_bp.route('/update', methods=['PATCH'])
def update_ep():
    data = request.get_json()
    todo_id = int(data.get("todo_id"))
    todo_name = data.get("new_name").strip()
    todo_description = data.get("new_description").strip()
    todo_due = data.get("dueTime", None)

    if todo_due is not None:
        todo_due = float(todo_due)
        todo_due = datetime.fromtimestamp(todo_due)

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Session is Invalid", STATUS.FORBIDDEN)

    todo = get_todo_by_id(todo_id)

    if not authorized_project_access(token, todo['ProjectID']):
        return make_response("Not Authorized To Access ToDo", STATUS.FORBIDDEN)

    updated_todo = update_todo(todo_id, todo_name, todo_description, todo_due)

    if updated_todo is None:
        return make_response("Failed To Update Todo", STATUS.INTERNAL_SERVER_ERROR)

    response = make_response(f"Updated: {todo_name}", STATUS.OK)
    return response


@todo_bp.route('/complete', methods=['PATCH'])
def complete_ep():
    data = request.get_json()
    todo_id = int(data.get("todo_id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Session is Invalid", STATUS.FORBIDDEN)

    todo = get_todo_by_id(todo_id)

    if not authorized_project_access(token, todo['ProjectID']):
        return make_response("Not Authorized To Access ToDo", STATUS.FORBIDDEN)

    completed_todo = complete_todo(todo_id)

    if completed_todo is None:
        return make_response("Failed To Complete Todo", STATUS.INTERNAL_SERVER_ERROR)

    response = make_response(f"Completed: {completed_todo['name']}", STATUS.OK)
    return response


@todo_bp.route('/delete', methods=['DELETE'])
def delete_ep():
    data = request.get_json()
    todo_id = int(data.get("todo_id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Session is Invalid", STATUS.FORBIDDEN)

    todo = get_todo_by_id(todo_id)

    if not authorized_project_access(token, todo['ProjectID']):
        return make_response("Not Authorized To Access ToDo", STATUS.FORBIDDEN)

    delete_todo(todo_id)

    response = make_response(f"Deleted: {todo['name']}", STATUS.OK)
    return response


@todo_bp.route('/last_update', methods=['GET'])
def last_update():
    todo_id = int(request.args.get("id"))
    time = get_last_update(todo_id)
    if time is None:
        return make_response({"todo_id": todo_id, "last_update": None}, STATUS.NO_CONTENT)
    return make_response({"todo_id": todo_id, "last_update": time}, STATUS.OK)
