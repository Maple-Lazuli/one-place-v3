from flask import Blueprint, jsonify, request, make_response
from http import HTTPStatus as STATUS
from datetime import datetime

code_snippets_bp = Blueprint('code_snippet', __name__, url_prefix='/code_snippet')
from .db import get_db_connection
from .sessions import verify_session_for_access
from .pages import authorized_page_access
from .projects import authorized_project_access

code_fields = ['CodeID', 'PageID', 'name', 'description', 'language', 'content', 'timeCreated', 'lastEditTime']


def log_access(snippet_id, allowed, notes):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO codesnippetsrequests (CodeID, accessGranted, notes)
        VALUES (%s, %s, %s);
    """, (snippet_id, allowed, notes))
    conn.commit()
    cursor.close()
    conn.close()


def convert_time(object):
    object['timeCreated'] = object['timeCreated'].timestamp()
    object['lastEditTime'] = object['lastEditTime'].timestamp()
    return object


def get_last_update(snippet_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT lastEditTime FROM CodeSnippets where CodeID = %s;", (snippet_id,))
    last_update = cursor.fetchone()
    cursor.close()
    conn.close()
    if last_update is not None:
        return last_update[0].timestamp()
    return None


def delete_snippet(snippet_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM CodeSnippets where CodeID = %s;", (snippet_id,))
    conn.commit()
    cursor.close()
    conn.close()


def update_snippet(snippet_id, name, description, language, content):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE CodeSnippets SET name = %s, description = %s, language = %s, content = %s, lastEditTime = %s
        WHERE CodeID = %s
        RETURNING *;
    """, (name, description, language, content, datetime.now(), snippet_id,))
    snippet = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if snippet is not None:
        snippet = {k: v for k, v in zip(code_fields, snippet)}
        snippet = convert_time(snippet)
    return snippet


def get_snippet_by_id(snippet_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM CodeSnippets where CodeID = %s;", (snippet_id,))
    snippet = cursor.fetchone()
    cursor.close()
    conn.close()
    if snippet is not None:
        snippet = {k: v for k, v in zip(code_fields, snippet)}
        snippet = convert_time(snippet)
    return snippet


def get_snippets_by_page(page_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM CodeSnippets where PageID = %s;", (page_id,))
    snippets = cursor.fetchall()
    cursor.close()
    conn.close()
    if snippets is not None:
        snippets_list = []
        for snippet in snippets:
            snippet = {k: v for k, v in zip(code_fields, snippet)}
            snippet = convert_time(snippet)
            snippets_list.append(snippet)
        return snippets_list
    return None


def get_snippets_by_project(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""SELECT CodeSnippets.*, pages.pageID FROM CodeSnippets
     inner join pages on CodeSnippets.pageID = pages.pageID
     where pages.projectID = %s;
     """, (project_id,))
    snippets = cursor.fetchall()
    cursor.close()
    conn.close()
    if snippets is not None:
        snippets_list = []
        for snippet in snippets:
            snippet = {k: v for k, v in zip(code_fields + ['pageID'], snippet)}
            snippet = convert_time(snippet)
            snippets_list.append(snippet)
        return snippets_list
    return None


def create_snippet(page_id, name, description, language, content):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO codesnippets (PageID, name, description, language, content, lastEditTime)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING *;
    """, (page_id, name, description, language, content, datetime.now()))
    new_snippet = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if new_snippet is not None:
        new_snippet = {k: v for k, v in zip(code_fields, new_snippet)}
        new_snippet = convert_time(new_snippet)
    return new_snippet


@code_snippets_bp.route('/test', methods=['GET'])
def test_ep():
    return jsonify({"test": "Snippets  Endpoint Reached."})


@code_snippets_bp.route('/create', methods=['POST'])
def create_ep():
    data = request.get_json()
    page_id = data.get("page_id")
    name = data.get("name")
    description = data.get("description")
    language = data.get("language")
    content = data.get("content")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    if not authorized_page_access(token, page_id):
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    new_snippet = create_snippet(page_id, name, description, language, content)

    if new_snippet is None:
        return make_response({'status': 'error', 'message': "Failed To Create Snippet"}, STATUS.INTERNAL_SERVER_ERROR)

    log_access(new_snippet['CodeID'], True, "CREATE")
    response = make_response({'status': 'success', 'message': f'Created {name}', 'id': new_snippet['CodeID']},
                             STATUS.OK)
    return response


@code_snippets_bp.route('/get', methods=['GET'])
def get_ep():
    snippet_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        log_access(snippet_id, valid, "GET")
        return make_response("Invalid Session", STATUS.FORBIDDEN)

    snippet = get_snippet_by_id(snippet_id)

    if not authorized_page_access(token, snippet['PageID']):
        log_access(snippet_id, False, "GET")
        return make_response("Not Authorized To Access Equation", STATUS.FORBIDDEN)

    if snippet is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.FORBIDDEN)

    log_access(snippet_id, True, "GET")
    response = make_response({'status': 'success', 'message': snippet}, STATUS.OK)
    return response


@code_snippets_bp.route('/get_all_by_page', methods=['GET'])
def get_all_by_page_ep():
    page_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Invalid Session", STATUS.FORBIDDEN)

    equations = get_snippets_by_page(page_id)

    if not authorized_page_access(token, page_id):
        return make_response("Not Authorized To Access Equation", STATUS.FORBIDDEN)

    if equations is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.FORBIDDEN)

    response = make_response({'status': 'success', 'message': equations}, STATUS.OK)
    return response


@code_snippets_bp.route('/get_all_by_project', methods=['GET'])
def get_all_by_project_ep():
    project_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    if not authorized_project_access(token, project_id):
        return make_response({'status': 'error', 'message': "Cannot Access Project"}, STATUS.FORBIDDEN)

    snippets = get_snippets_by_project(project_id)

    if snippets is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.FORBIDDEN)

    response = make_response({'status': 'success', 'message': snippets}, STATUS.OK)
    return response


@code_snippets_bp.route('/update', methods=['PATCH'])
def update_ep():
    data = request.get_json()
    snippet_id = data.get("snippet_id")
    name = data.get("new_name")
    description = data.get("new_description")
    language = data.get("new_language")
    content = data.get("new_content")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        log_access(snippet_id, False, "UPDATE")
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    equation = get_snippet_by_id(snippet_id)

    if not authorized_page_access(token, equation['PageID']):
        log_access(snippet_id, False, "UPDATE")
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    updated_snippet = update_snippet(snippet_id, name, description, language, content)

    if updated_snippet is None:
        return make_response({'status': 'error', 'message': "Failed To Update Snippet"}, STATUS.FORBIDDEN)

    log_access(snippet_id, True, "UPDATE")
    response = make_response({'status': 'success', 'message': f'Updated {name}'}, STATUS.OK)
    return response


@code_snippets_bp.route('/delete', methods=['DELETE'])
def delete_ep():
    data = request.get_json()
    snippet_id = data.get("snippet_id")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        log_access(snippet_id, False, "DELETE")
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    snippet = get_snippet_by_id(snippet_id)

    if not authorized_page_access(token, snippet['PageID']):
        log_access(snippet_id, False, "DELETE")
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    log_access(snippet_id, True, "DELETE")
    delete_snippet(snippet_id)

    response = make_response({'status': 'success', 'message': f'Deleted {snippet["name"]}'}, STATUS.OK)
    return response


@code_snippets_bp.route('/last_update', methods=['GET'])
def last_update():
    snippet_id = int(request.args.get("id"))
    time = get_last_update(snippet_id)
    if time is None:
        return make_response({"snippet_id": snippet_id, "last_update": "Null"}, STATUS.OK)
    return make_response({"snippet_id": snippet_id, "last_update": time}, STATUS.OK)
