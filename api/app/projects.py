from flask import Blueprint, jsonify, request, make_response
from http import HTTPStatus as STATUS
from datetime import datetime, timedelta
from .db import get_db_connection
from .sessions import verify_session_for_access
from .logging import create_access_request

projects_bp = Blueprint('projects', __name__, url_prefix='/projects')
projects_fields = ['ProjectID', 'UserID', 'name', 'description', 'TimeCreated']


def create_project(user_id, name, description):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO projects (UserID, name, description)
        VALUES (%s, %s, %s)
        RETURNING *;
    """, (user_id, name, description))

    new_project = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if new_project is not None:
        new_project = {k: v for k, v in zip(projects_fields, new_project)}
    return new_project


def get_projects():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects")
    projects = cursor.fetchall()
    cursor.close()
    conn.close()
    return projects


def get_project_by_id(projectID):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects where projectID = %s;", (projectID,))
    project = cursor.fetchone()
    cursor.close()
    conn.close()
    project = {k: v for k, v in zip(projects_fields, project)}
    return project


def authorized_project_access(token, project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT endTime, isActive, token  FROM sessions
    inner join projects
    on projects.UserID = sessions.UserID
    where token = %s and ProjectID = %s
    """, (token, project_id))
    result = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()

    if result is not None:
        result = {k: v for k, v in zip(['endTime', 'isActive', 'token'], result)}
        if (result['endTime'] >= datetime.now()) and (result['isActive']):
            return True
    return False


@projects_bp.route('/test', methods=['GET'])
def test_ep():
    return jsonify({"test": "Projects  Endpoint Reached."})


@projects_bp.route('/create_project', methods=['POST'])
def create_project_ep():
    data = request.get_json()
    project_name = data.get("project_name").strip()
    description = data.get("project_description").strip()
    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Not Authorized", STATUS.FORBIDDEN)

    new_project = create_project(session['UserID'], project_name, description)

    if new_project is None:
        return make_response("Failed To Create Project", STATUS.INTERNAL_SERVER_ERROR)

    create_access_request(session['SessionID'], new_project['ProjectID'], valid)

    response = make_response(f"Created: {project_name}", STATUS.OK)
    return response
