from flask import Blueprint, jsonify, request, make_response
from http import HTTPStatus as STATUS
from datetime import datetime

pages_bp = Blueprint('pages', __name__, url_prefix='/pages')
from .db import get_db_connection
from .sessions import verify_session_for_access
from .projects import authorized_project_access
from .logging import create_page_access_request

page_fields = ['PageID', 'ProjectID', 'name', 'content', 'timeCreated', 'lastEditTime', 'timeInvestment']


@pages_bp.route('/test', methods=['GET'])
def test_ep():
    return jsonify({"test": "Pages  Endpoint Reached."})


def get_last_update(page_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT lastEditTime FROM pages where PageID = %s;", (page_id,))
    last_update = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return last_update


def authorized_page_access(token, page_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT endTime, isActive, token  FROM sessions
    inner join projects
    on projects.UserID = sessions.UserID
    inner join pages
    on pages.projectID = projects.projectID
    where token = %s and pages.PageID = %s
    """, (token, page_id))
    result = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()

    if result is not None:
        result = {k: v for k, v in zip(['endTime', 'isActive', 'token'], result)}
        if (result['endTime'] >= datetime.now()) and (result['isActive']):
            return True
    return False


def create_page(project_id, name, content):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO pages (ProjectID, name, content, lastEditTime)
        VALUES (%s, %s, %s, %s)
        RETURNING *;
    """, (project_id, name, content, datetime.now()))
    new_page = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if new_page is not None:
        new_page = {k: v for k, v in zip(page_fields, new_page)}
    return new_page


def get_page_by_id(page_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM pages where pageID = %s;", (page_id,))
    page = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if page is not None:
        page = {k: v for k, v in zip(page_fields, page)}
    return page


def update_page(page_id, name):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE pages SET name = %s
        WHERE PageID = %s
        RETURNING *;
    """, (name, page_id,))
    updated_page = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if updated_page is not None:
        updated_page = {k: v for k, v in zip(page_fields, updated_page)}
    return updated_page


def delete_page(page_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM pages where PageID = %s;", (page_id,))
    conn.commit()
    cursor.close()
    conn.close()


def update_content(page_id, content):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE pages SET content = %s, lastEditTime = %s
        WHERE PageID = %s;
    """, (content, datetime.now(), page_id,))
    conn.commit()
    cursor.close()
    conn.close()


@pages_bp.route('/create', methods=['POST'])
def create_ep():
    data = request.get_json()
    project_id = data.get("project_id")
    name = data.get("name")
    content = f'Created On: {datetime.now()}'

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Session is Invalid", STATUS.FORBIDDEN)

    if not authorized_project_access(token, project_id):
        return make_response("Not Authorized To Access Project", STATUS.FORBIDDEN)

    new_page = create_page(project_id, name, content)

    if new_page is None:
        return make_response("Failed To Create Page", STATUS.INTERNAL_SERVER_ERROR)

    create_page_access_request(session['SessionID'], new_page['PageID'], True, "CREATE")

    response = make_response(f"Created: {name}", STATUS.OK)
    return response


@pages_bp.route('/update', methods=['PATCH'])
def update_ep():
    data = request.get_json()
    page_id = data.get("page_id")
    name = data.get("name")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        create_page_access_request(session['SessionID'], page_id, valid, "UPDATE")
        return make_response("Session is Invalid", STATUS.FORBIDDEN)

    page = get_page_by_id(page_id)

    if not authorized_project_access(token, page['ProjectID']):
        create_page_access_request(session['SessionID'], page_id, False, "UPDATE")
        return make_response("Not Authorized To Access Page", STATUS.FORBIDDEN)

    updated_page = update_page(page_id, name)

    if updated_page is None:
        return make_response("Failed To Create Page", STATUS.INTERNAL_SERVER_ERROR)

    create_page_access_request(session['SessionID'], updated_page['PageID'], True, "UPDATE")

    response = make_response(f"Updated: {name}", STATUS.OK)
    return response


@pages_bp.route('/content', methods=['PUT'])
def content_ep():
    data = request.get_json()
    page_id = data.get("page_id")
    content = data.get("content")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        create_page_access_request(session['SessionID'], page_id, valid, "UPDATE")
        return make_response("Session is Invalid", STATUS.FORBIDDEN)

    page = get_page_by_id(page_id)

    if not authorized_project_access(token, page['ProjectID']):
        create_page_access_request(session['SessionID'], page_id, False, "UPDATE")
        return make_response("Not Authorized To Access Page", STATUS.FORBIDDEN)

    update_content(page_id, content)
    create_page_access_request(session['SessionID'], page_id, valid, "UPDATE")

    response = make_response(f"Updated: {page_id}", STATUS.OK)
    return response


@pages_bp.route('/delete', methods=['DELETE'])
def delete_ep():
    data = request.get_json()
    page_id = data.get("page_id")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        create_page_access_request(session['SessionID'], page_id, valid, "DELETE")
        return make_response("Session is Invalid", STATUS.FORBIDDEN)

    page = get_page_by_id(page_id)

    if not authorized_project_access(token, page['ProjectID']):
        create_page_access_request(session['SessionID'], page_id, False, "DELETE")
        return make_response("Not Authorized To Access Page", STATUS.FORBIDDEN)

    create_page_access_request(session['SessionID'], page['PageID'], valid, "DELETE")
    delete_page(page_id)

    response = make_response(f"Deleted: {page}", STATUS.OK)
    return response


@pages_bp.route('/get', methods=['GET'])
def get_page_ep():
    page_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        create_page_access_request(session['SessionID'], page_id, valid, "DELETE")
        return make_response("Invalid Session", STATUS.FORBIDDEN)

    page = get_page_by_id(page_id)

    if not authorized_project_access(token, page['ProjectID']):
        create_page_access_request(session['SessionID'], page_id, False, "DELETE")
        return make_response("Not Authorized To Access Page", STATUS.FORBIDDEN)

    if page is None:
        response = make_response("Does Not Exist", STATUS.OK)
        return response

    create_page_access_request(session['SessionID'], page['PageID'], valid, "DELETE")

    response = make_response(page, STATUS.OK)
    return response


@pages_bp.route('/last_update', methods=['GET'])
def last_update():
    page_ip = int(request.args.get("id"))
    time = get_last_update(page_ip)
    if time is None:
        return make_response({"page_ip": page_ip, "last_update": None}, STATUS.NO_CONTENT)
    return make_response({"page_ip": page_ip, "last_update": time}, STATUS.OK)