from flask import Blueprint, jsonify, request, make_response
from http import HTTPStatus as STATUS
from datetime import datetime, timedelta

from .db import get_db_connection
from .sessions import verify_session_for_access
from .logging import create_access_request

projects_bp = Blueprint('projects', __name__, url_prefix='/projects')
projects_fields = ['ProjectID', 'UserID', 'name', 'description', 'TimeCreated', 'lastUpdate']
tag_fields = ['TagID', 'UserID', 'tag', 'options']


def get_tags_by_project(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT tags.TagID, UserID, tag, options FROM tags 
    join tagmappings on tags.tagid = tagmappings.tagid
    where projectID = %s order by Tag;
    """, (project_id,))
    tags = cursor.fetchall()
    conn.commit()
    cursor.close()
    conn.close()
    if tags is not None:
        tag_list = []
        for tag in tags:
            tag = {k: v for k, v in zip(tag_fields, tag)}
            tag_list.append(tag)
        return tag_list
    return None


def get_last_update(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT lastUpdate FROM projects where projectID = %s;", (project_id,))
    last_update = cursor.fetchone()
    cursor.close()
    conn.close()
    if last_update is not None:
        return last_update[0]
    return None


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


def update_project(project_id, new_name, new_description):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE projects SET name = %s, description = %s, lastUpdate = %s
        WHERE projectID = %s
        RETURNING *;
    """, (new_name, new_description, datetime.now(), project_id))

    updated_project = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if updated_project is not None:
        updated_project = {k: v for k, v in zip(projects_fields, updated_project)}
    return updated_project


def delete_project(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM projects where ProjectID = (%s)", (project_id,))
    conn.commit()
    cursor.close()
    conn.close()


def get_projects_with_token(token):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT ProjectID, name, description, timeCreated FROM sessions
    inner join projects
    on projects.UserID = sessions.UserID
    where token = %s and endTime > %s and isActive = TRUE 
    ORDER BY projects.timeCreated DESC
    """, (token, datetime.now()))
    results = cursor.fetchall()
    conn.commit()
    cursor.close()
    conn.close()

    if results is not None:
        result_list = []
        for result in results:
            result = {k: v for k, v in zip(['ProjectID', 'name', 'description', 'timeCreated'], result)}
            result['timeCreated'] = result['timeCreated'].timestamp()
            result_list.append(result)
        return result_list
    return None


def get_project_by_id(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects where projectID = %s;", (project_id,))
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


@projects_bp.route('/create', methods=['POST'])
def create_project_ep():
    data = request.get_json()
    project_name = data.get("project_name").strip()
    description = data.get("project_description").strip()
    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    new_project = create_project(session['UserID'], project_name, description)
    create_access_request(session['SessionID'], new_project['ProjectID'], valid, f"CREATE")

    if new_project is None:
        return make_response({'status': 'error', 'message': "Failed To Create Project"}, STATUS.INTERNAL_SERVER_ERROR)

    response = make_response({'status': 'success', 'id': new_project['ProjectID']}, STATUS.OK)
    return response


@projects_bp.route('/update', methods=['PATCH'])
def update_project_ep():
    data = request.get_json()
    project_id = int(data.get("project_id"))
    new_project_name = data.get("new_project_name").strip()
    new_description = data.get("new_project_description").strip()

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        create_access_request(session['SessionID'], project_id, valid, f"UPDATE")
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    if not authorized_project_access(token, project_id):
        create_access_request(session['SessionID'], project_id, valid, f"UPDATE")
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    updated_project = update_project(project_id, new_project_name, new_description)

    create_access_request(session['SessionID'], project_id, valid, f"UPDATE")

    if updated_project is None:
        return make_response({'status': 'error', 'message': "Failed To Update Project"}, STATUS.FORBIDDEN)

    response = make_response({'status': 'success', 'message': f'Updated {new_project_name}'}, STATUS.OK)
    return response


@projects_bp.route('/delete', methods=['DELETE'])
def delete_project_ep():
    data = request.get_json()
    project_id = int(data.get("project_id"))
    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        create_access_request(session['SessionID'], project_id, valid, "DELETE")
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    if not authorized_project_access(token, project_id):
        create_access_request(session['SessionID'], project_id, valid, "DELETE")
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    create_access_request(session['SessionID'], project_id, valid, "DELETE")
    delete_project(project_id)

    response = make_response({'status': 'success', 'message': f'Deleted: {project_id}'}, STATUS.OK)
    return response


@projects_bp.route('/get', methods=['GET'])
def get_projects_ep():
    project_id = int(request.args.get("id"))
    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        create_access_request(session['SessionID'], project_id, valid, "GET")
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    if not authorized_project_access(token, project_id):
        create_access_request(session['SessionID'], project_id, valid, "GET")
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    project = get_project_by_id(project_id)

    project['tags'] = get_tags_by_project(project['ProjectID'])

    create_access_request(session['SessionID'], project_id, valid, "GET")
    if project is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.OK)

    response = make_response({'status': 'success', 'message': project}, STATUS.OK)
    return response


@projects_bp.route('/get_all', methods=['GET'])
def get_all_projects_ep():
    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Not Authorized", STATUS.FORBIDDEN)

    projects = get_projects_with_token(token)

    if projects is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.OK)

    project_list = []
    for project in projects:
        project['tags'] = get_tags_by_project(project['ProjectID'])
        project_list.append(project)

    response = make_response({'status': 'success', 'message': project_list}, STATUS.OK)
    return response


@projects_bp.route('/last_update', methods=['GET'])
def last_update():
    project_id = int(request.args.get("id"))
    time = get_last_update(project_id)
    if time is None:
        return make_response({"project_id": project_id, "last_update": "Null"}, STATUS.OK)
    return make_response({"project_id": project_id, "last_update": time}, STATUS.OK)
