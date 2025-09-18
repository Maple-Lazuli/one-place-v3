from flask import Blueprint, jsonify, request, make_response
from http import HTTPStatus as STATUS
from datetime import datetime, timezone

pages_bp = Blueprint('pages', __name__, url_prefix='/pages')
from .db import get_db_connection
from .sessions import verify_session_for_access
from .projects import authorized_project_access
from .logging import create_page_access_request

page_fields = ['PageID', 'ProjectID', 'name', 'content', 'timeCreated', 'lastEditTime', 'timeInvestment']


@pages_bp.route('/test', methods=['GET'])
def test_ep():
    return jsonify({"test": "Pages  Endpoint Reached."})


def convert_time(object):
    object['timeCreated'] = object['timeCreated'].timestamp()
    object['lastEditTime'] = object['lastEditTime'].timestamp()
    return object


def get_last_review_by_user_id(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT %s - max(accessTime), pagerequests.pageID, pages.name, pages.projectID FROM pagerequests
        inner join pages on pages.pageid = pagerequests.pageid
        inner join projects on projects.projectID = pages.projectID
        where accessGranted = TRUE AND pagerequests.notes = 'REVIEW' AND projects.UserID = %s
        group by pagerequests.pageID, pages.name, pages.projectID
    """, (datetime.now().astimezone(), user_id))
    review_deltas = cursor.fetchall()
    cursor.close()
    conn.close()
    if review_deltas is not None:
        review_deltas_list = []
        for review_delta in review_deltas:
            review_delta = {k: v for k, v in zip(['days', 'page_id', 'name', 'project_id'], review_delta)}
            review_delta['days'] = review_delta['days'].days
            review_deltas_list.append(review_delta)
        return review_deltas_list
    return review_deltas


def get_last_edit_by_user_id(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT max(accessTime), pagerequests.pageID, pages.name, pages.projectID FROM pagerequests
        inner join pages on pages.pageid = pagerequests.pageid
        inner join projects on projects.projectID = pages.projectID
        where accessGranted = TRUE AND pagerequests.notes = 'UPDATE' AND projects.UserID = %s
        group by pagerequests.pageID, pages.name, pages.projectID
    """, (user_id,))
    review_deltas = cursor.fetchall()
    cursor.close()
    conn.close()
    if review_deltas is not None:
        review_deltas_list = []
        for review_delta in review_deltas:
            review_delta = {k: v for k, v in zip(['lastEditTime', 'page_id', 'name', 'project_id'], review_delta)}
            review_delta['lastEditTime'] = str(review_delta['lastEditTime'].timestamp())
            review_deltas_list.append(review_delta)
        return review_deltas_list
    return review_deltas


def get_last_review_by_project_id(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT %s - max(accessTime), pagerequests.pageID, pages.name FROM pagerequests
        inner join pages on pages.pageid = pagerequests.pageid
        where accessGranted = TRUE AND pages.projectID = %s AND pagerequests.notes = 'REVIEW'
        group by pagerequests.pageID, pages.name
    """, (datetime.now().astimezone(), project_id,))
    review_deltas = cursor.fetchall()
    cursor.close()
    conn.close()
    if review_deltas is not None:
        review_deltas_list = []
        for review_delta in review_deltas:
            review_delta = {k: v for k, v in zip(['days', 'page_id', 'name'], review_delta)}
            review_delta['days'] = review_delta['days'].days
            review_deltas_list.append(review_delta)
        return review_deltas_list
    return review_deltas


def get_last_update(page_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT lastEditTime FROM pages where PageID = %s;", (page_id,))
    last_update = cursor.fetchone()
    cursor.close()
    conn.close()
    if last_update is not None:
        return last_update[0].timestamp()
    return None


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
        new_page = convert_time(new_page)
    return new_page


def get_page_by_id(page_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM pages where pageID = %s;", (page_id,))
    page = cursor.fetchone()
    cursor.close()
    conn.close()
    if page is not None:
        page = {k: v for k, v in zip(page_fields, page)}
        page = convert_time(page)
    return page


def get_pages_by_project(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM pages where projectID = %s;", (project_id,))
    pages = cursor.fetchall()
    cursor.close()
    conn.close()
    if pages is not None:
        page_list = []
        for page in pages:
            page = {k: v for k, v in zip(page_fields, page)}
            page = convert_time(page)
            del page['content']
            page_list.append(page)
        return page_list
    return None


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
        updated_page = convert_time(updated_page)
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
    content = f'No Content Yet'

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    if not authorized_project_access(token, project_id):
        return make_response({'status': 'error', 'message': "Not Authorized To Access Page"}, STATUS.FORBIDDEN)

    new_page = create_page(project_id, name, content)

    if new_page is None:
        return make_response({'status': 'error', 'message': "Failed To Create Page"}, STATUS.INTERNAL_SERVER_ERROR)

    create_page_access_request(session['SessionID'], new_page['PageID'], True, "CREATE")

    response = make_response({'status': 'success', 'message': f'Created {name}', 'id': new_page['PageID']}, STATUS.OK)
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
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    page = get_page_by_id(page_id)

    if not authorized_project_access(token, page['ProjectID']):
        create_page_access_request(session['SessionID'], page_id, False, "UPDATE")
        return make_response({'status': 'error', 'message': "Not Authorized To Access Page"}, STATUS.FORBIDDEN)

    updated_page = update_page(page_id, name)

    if updated_page is None:
        return make_response({'status': 'error', 'message': "Failed To Update Page"}, STATUS.INTERNAL_SERVER_ERROR)

    create_page_access_request(session['SessionID'], updated_page['PageID'], True, "UPDATE")

    response = make_response({'status': 'success', 'message': f'Updated {name}'}, STATUS.OK)
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
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    page = get_page_by_id(page_id)

    if not authorized_project_access(token, page['ProjectID']):
        create_page_access_request(session['SessionID'], page_id, False, "UPDATE")
        return make_response({'status': 'error', 'message': "Not Authorized To Access Page"}, STATUS.FORBIDDEN)

    update_content(page_id, content)
    create_page_access_request(session['SessionID'], page_id, valid, "UPDATE")

    response = make_response({'status': 'success', 'message': f'Updated {page["name"]}'}, STATUS.OK)
    return response


@pages_bp.route('/delete', methods=['DELETE'])
def delete_ep():
    data = request.get_json()
    page_id = data.get("page_id")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        create_page_access_request(session['SessionID'], page_id, valid, "DELETE")
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    page = get_page_by_id(page_id)

    if not authorized_project_access(token, page['ProjectID']):
        create_page_access_request(session['SessionID'], page_id, False, "DELETE")
        return make_response({'status': 'error', 'message': "Not Authorized To Access Page"}, STATUS.FORBIDDEN)

    create_page_access_request(session['SessionID'], page['PageID'], valid, "DELETE")
    delete_page(page_id)

    response = make_response({'status': 'success', 'message': f'Deleted {page["name"]}'}, STATUS.OK)
    return response


@pages_bp.route('/get', methods=['GET'])
def get_page_ep():
    page_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        create_page_access_request(session['SessionID'], page_id, valid, "GET")
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    page = get_page_by_id(page_id)

    if not authorized_project_access(token, page['ProjectID']):
        create_page_access_request(session['SessionID'], page_id, False, "GET")
        return make_response({'status': 'error', 'message': "Not Authorized To Access Page"}, STATUS.FORBIDDEN)

    if page is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.OK)

    create_page_access_request(session['SessionID'], page['PageID'], valid, "GET")

    response = make_response({'status': 'success', 'message': page}, STATUS.OK)
    return response


@pages_bp.route('/review', methods=['POST'])
def update_page_review():
    page_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        create_page_access_request(session['SessionID'], page_id, valid, "REVIEW")
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    page = get_page_by_id(page_id)

    if not authorized_project_access(token, page['ProjectID']):
        create_page_access_request(session['SessionID'], page_id, False, "REVIEW")
        return make_response({'status': 'error', 'message': "Not Authorized To Access Page"}, STATUS.FORBIDDEN)

    if page is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.OK)

    create_page_access_request(session['SessionID'], page['PageID'], valid, "REVIEW")

    response = make_response({'status': 'success', 'message': f"Reviewed: {page['name']}"}, STATUS.OK)
    return response


@pages_bp.route('/get_project_pages', methods=['GET'])
def get_pages_by_project_ep():
    project_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    if not authorized_project_access(token, project_id):
        return make_response({'status': 'error', 'message': "Not Authorized To Access Page"}, STATUS.FORBIDDEN)

    pages = get_pages_by_project(project_id)

    if pages is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.OK)

    response = make_response({'status': 'success', 'message': pages}, STATUS.OK)
    return response


@pages_bp.route('/get_project_pages_review_list', methods=['GET'])
def get_pages_review_by_project_ep():
    project_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    if not authorized_project_access(token, project_id):
        return make_response({'status': 'error', 'message': "Not Authorized To Access Page"}, STATUS.FORBIDDEN)

    pages = get_last_review_by_project_id(project_id)
    if pages is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.OK)

    response = make_response({'status': 'success', 'message': pages}, STATUS.OK)
    return response


@pages_bp.route('/get_user_pages_review_list', methods=['GET'])
def get_pages_review_by_user_ep():
    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    pages = get_last_review_by_user_id(session['UserID'])
    if pages is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.OK)

    response = make_response({'status': 'success', 'message': pages}, STATUS.OK)
    return response


@pages_bp.route('/get_user_pages_update_list', methods=['GET'])
def get_pages_update_by_user_ep():
    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    pages = get_last_edit_by_user_id(session['UserID'])
    if pages is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.OK)

    response = make_response({'status': 'success', 'message': pages}, STATUS.OK)
    return response


@pages_bp.route('/last_update', methods=['GET'])
def last_update():
    page_ip = int(request.args.get("id"))
    time = get_last_update(page_ip)
    if time is None:
        return make_response({"page_ip": page_ip, "last_update": "Null"}, STATUS.OK)
    return make_response({"page_ip": page_ip, "last_update": time}, STATUS.OK)
