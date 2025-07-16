from flask import Blueprint, jsonify, request, make_response
from http import HTTPStatus as STATUS
from datetime import datetime

code_snippets_bp = Blueprint('code_snippet', __name__, url_prefix='/code_snippet')
from .db import get_db_connection
from .sessions import verify_session_for_access
from .pages import authorized_page_access

code_fields = ['CodeID', 'PageID', 'name', 'description', 'language', 'content', 'timeCreated', 'lastEditTime']


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
    return snippet


def get_snippet_by_id(snippet_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM CodeSnippets where CodeID = %s;", (snippet_id,))
    snippet = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if snippet is not None:
        snippet = {k: v for k, v in zip(code_fields, snippet)}
    return snippet


def get_snippets_by_page(page_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM CodeSnippets where PageID = %s;", (page_id,))
    snippets = cursor.fetchall()
    conn.commit()
    cursor.close()
    conn.close()
    if snippets is not None:
        snippets_list = []
        for snippet in snippets:
            snippet = {k: v for k, v in zip(code_fields, snippet)}
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
    return new_snippet


@code_snippets_bp.route('/test', methods=['GET'])
def test_ep():
    return jsonify({"test": "Equations  Endpoint Reached."})


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
        return make_response("Session is Invalid", STATUS.FORBIDDEN)

    if not authorized_page_access(token, page_id):
        return make_response("Not Authorized To Access Project", STATUS.FORBIDDEN)

    new_equation = create_snippet(page_id, name, description, language, content)

    if new_equation is None:
        return make_response("Failed To Create Snippet", STATUS.INTERNAL_SERVER_ERROR)

    response = make_response(f"Created: {name}", STATUS.OK)
    return response


@code_snippets_bp.route('/get', methods=['GET'])
def get_ep():
    snippet_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Invalid Session", STATUS.FORBIDDEN)

    snippet = get_snippet_by_id(snippet_id)

    if not authorized_page_access(token, snippet['PageID']):
        return make_response("Not Authorized To Access Equation", STATUS.FORBIDDEN)

    if snippet is None:
        response = make_response("Does Not Exist", STATUS.OK)
        return response

    response = make_response(snippet, STATUS.OK)
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
        response = make_response("Does Not Exist", STATUS.OK)
        return response

    response = make_response(equations, STATUS.OK)
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
        return make_response("Session is Invalid", STATUS.FORBIDDEN)

    equation = get_snippet_by_id(snippet_id)

    if not authorized_page_access(token, equation['PageID']):
        return make_response("Not Authorized To Access Project", STATUS.FORBIDDEN)

    updated_snippet = update_snippet(snippet_id, name, description, language, content)

    if updated_snippet is None:
        return make_response("Failed To Update Snippet", STATUS.INTERNAL_SERVER_ERROR)

    response = make_response(f"Updated: {name}", STATUS.OK)
    return response


@code_snippets_bp.route('/delete', methods=['DELETE'])
def delete_ep():
    data = request.get_json()
    snippet_id = data.get("snippet_id")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Session is Invalid", STATUS.FORBIDDEN)

    snippet = get_snippet_by_id(snippet_id)

    if not authorized_page_access(token, snippet['PageID']):
        return make_response("Not Authorized To Access Project", STATUS.FORBIDDEN)

    delete_snippet(snippet_id)

    response = make_response(f"Deleted: {snippet}", STATUS.OK)
    return response
