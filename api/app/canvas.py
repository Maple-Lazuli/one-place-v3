from flask import Blueprint, jsonify, request, make_response
from http import HTTPStatus as STATUS
from datetime import datetime

canvas_bp = Blueprint('canvas', __name__, url_prefix='/canvas')
from .db import get_db_connection
from .sessions import verify_session_for_access
from .pages import authorized_page_access
from .projects import authorized_project_access

canvas_fields = ['CanvasID', 'PageID', 'name', 'description', 'content', 'timeCreated', 'lastEditTime']


def convert_time(object):
    object['timeCreated'] = object['timeCreated'].timestamp()
    object['lastEditTime'] = object['lastEditTime'].timestamp()
    return object


def log_access(canvas_id, allowed, notes):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO canvasrequests (CanvasID, accessGranted, notes)
        VALUES (%s, %s, %s);
    """, (canvas_id, allowed, notes))
    conn.commit()
    cursor.close()
    conn.close()


def get_last_update(canvas_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT lastEditTime FROM canvas where CanvasID = %s;", (canvas_id,))
    last_update = cursor.fetchone()
    cursor.close()
    conn.close()
    if last_update is not None:
        return last_update[0].timestamp()
    return None


def delete_canvas(canvas_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM canvas where CanvasID = %s;", (canvas_id,))
    conn.commit()
    cursor.close()
    conn.close()


def update_canvas(canvas_id, name, description):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE canvas SET name = %s, description = %s, lastEditTime = %s
        WHERE CanvasID = %s
        RETURNING *;
    """, (name, description, datetime.now(), canvas_id,))
    canvas = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if canvas is not None:
        canvas = {k: v for k, v in zip(canvas_fields, canvas)}
        canvas = convert_time(canvas)
    return canvas


def update_canvas_content(canvas_id, content):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE canvas SET content = %s, lastEditTime = %s
        WHERE CanvasID = %s
        RETURNING *;
    """, (content, datetime.now(), canvas_id,))
    conn.commit()
    cursor.close()
    conn.close()


def get_canvas_by_id(canvas_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM canvas where CanvasID = %s;", (canvas_id,))
    canvas = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if canvas is not None:
        canvas = {k: v for k, v in zip(canvas_fields, canvas)}
        canvas = convert_time(canvas)
    return canvas


def get_canvas_by_page(page_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM canvas where PageID = %s;", (page_id,))
    canvases = cursor.fetchall()
    conn.commit()
    cursor.close()
    conn.close()
    if canvases is not None:
        canvas_list = []
        for canvas in canvases:
            canvas = {k: v for k, v in zip(canvas_fields, canvas) if k != "content"}
            canvas = convert_time(canvas)
            canvas_list.append(canvas)
        return canvas_list
    return None


def get_canvas_by_project(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""SELECT canvas.*, pages.pageID FROM canvas
    inner join pages
    on pages.pageID = canvas.pageID
    where pages.projectID = %s
    """, (project_id,))
    canvases = cursor.fetchall()
    conn.commit()
    cursor.close()
    conn.close()
    if canvases is not None:
        canvas_list = []
        for canvas in canvases:
            canvas = {k: v for k, v in zip(canvas_fields+['pageID'], canvas) if k != "content"}
            canvas = convert_time(canvas)
            canvas_list.append(canvas)
        return canvas_list
    return None


def create_canvas(page_id, name, description, content):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO canvas (PageID, name, description, content, lastEditTime)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING *;
    """, (page_id, name, description, content, datetime.now()))
    canvas = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if canvas is not None:
        canvas = {k: v for k, v in zip(canvas_fields, canvas)}
        canvas = convert_time(canvas)
    return canvas


@canvas_bp.route('/create', methods=['POST'])
def create_ep():
    data = request.get_json()
    page_id = data.get("page_id")
    name = data.get("name")
    description = data.get("description")
    content = data.get("content")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    if not authorized_page_access(token, page_id):
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    new_canvas = create_canvas(page_id, name, description, content)

    if new_canvas is None:
        return make_response({'status': 'error', 'message': "Failed To Create Canvas"}, STATUS.INTERNAL_SERVER_ERROR)

    log_access(new_canvas['CanvasID'], True, "CREATE")
    response = make_response({'status': 'success', 'message': f'Created {name}', 'id': new_canvas['CanvasID']},
                             STATUS.OK)
    return response


@canvas_bp.route('/get', methods=['GET'])
def get_ep():
    canvas_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        log_access(canvas_id, False, "GET")
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    canvas = get_canvas_by_id(canvas_id)

    if not authorized_page_access(token, canvas['PageID']):
        log_access(canvas_id, False, "GET")
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    if canvas is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.FORBIDDEN)

    log_access(canvas_id, True, "GET")
    response = make_response({'status': 'success', 'message': canvas}, STATUS.OK)
    return response


@canvas_bp.route('/get_fields', methods=['GET'])
def get_fields_ep():
    canvas_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        log_access(canvas_id, False, "GET")
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    canvas = get_canvas_by_id(canvas_id)

    if not authorized_page_access(token, canvas['PageID']):
        log_access(canvas_id, False, "GET")
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    if canvas is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.FORBIDDEN)

    if canvas['content'] is not None:
        del canvas['content']

    log_access(canvas_id, True, "GET")
    print(canvas)
    response = make_response({'status': 'success', 'message': canvas}, STATUS.OK)
    return response


@canvas_bp.route('/get_all_by_page', methods=['GET'])
def get_all_by_page_ep():
    page_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    canvases = get_canvas_by_page(page_id)

    if not authorized_page_access(token, page_id):
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    if canvases is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.OK)

    response = make_response({'status': 'success', 'message': canvases}, STATUS.OK)
    return response


@canvas_bp.route('/get_all_by_project', methods=['GET'])
def get_all_by_project_ep():
    project_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    if not authorized_project_access(token, project_id):
        return make_response({'status': 'error', 'message': "Cannot Access Project"}, STATUS.FORBIDDEN)

    canvases = get_canvas_by_project(project_id)

    if canvases is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.OK)

    response = make_response({'status': 'success', 'message': canvases}, STATUS.OK)
    return response


@canvas_bp.route('/update', methods=['PATCH'])
def update_ep():
    data = request.get_json()
    canvas_id = data.get("canvas_id")
    name = data.get("new_name")
    description = data.get("new_description")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        log_access(canvas_id, False, "UPDATE")
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    equation = get_canvas_by_id(canvas_id)

    if not authorized_page_access(token, equation['PageID']):
        log_access(canvas_id, False, "UPDATE")
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    updated_canvas = update_canvas(canvas_id, name, description)

    if updated_canvas is None:
        return make_response({'status': 'error', 'message': "Failed To Update Canvas"}, STATUS.FORBIDDEN)

    log_access(canvas_id, True, "UPDATE")
    response = make_response({'status': 'success', 'message': f'Updated {name}'}, STATUS.OK)
    return response


@canvas_bp.route('/content', methods=['PUT'])
def update_content_ep():
    data = request.get_json()
    canvas_id = data.get("canvas_id")
    content = data.get("new_content")
    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        log_access(canvas_id, False, "UPDATE")
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)
    canvas = get_canvas_by_id(canvas_id)
    if not authorized_page_access(token, canvas['PageID']):
        log_access(canvas_id, False, "UPDATE")
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    update_canvas_content(canvas_id, content)
    log_access(canvas_id, True, "UPDATE")
    response = make_response({'status': 'success', 'message': f'Updated {canvas["name"]}'}, STATUS.OK)
    return response


@canvas_bp.route('/delete', methods=['DELETE'])
def delete_ep():
    data = request.get_json()
    canvas_id = data.get("canvas_id")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        log_access(canvas_id, False, "DELETE")
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    canvas = get_canvas_by_id(canvas_id)

    if not authorized_page_access(token, canvas['PageID']):
        log_access(canvas_id, False, "DELETE")
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    log_access(canvas_id, True, "DELETE")
    delete_canvas(canvas_id)

    response = make_response({'status': 'success', 'message': f'Deleted {canvas["name"]}'}, STATUS.OK)
    return response


@canvas_bp.route('/test', methods=['GET'])
def test_ep():
    return jsonify({"test": "Canvas  Endpoint Reached."})


@canvas_bp.route('/last_update', methods=['GET'])
def last_update():
    canvas_id = int(request.args.get("id"))
    time = get_last_update(canvas_id)
    if time is None:
        return make_response({"canvas_id": canvas_id, "last_update": "Null"}, STATUS.OK)
    return make_response({"canvas_id": canvas_id, "last_update": time}, STATUS.OK)
