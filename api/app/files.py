from flask import Blueprint, jsonify, request, make_response, send_file
from http import HTTPStatus as STATUS
from io import BytesIO
import hashlib

files_bp = Blueprint('files', __name__, url_prefix='/files')
from .db import get_db_connection
from .sessions import verify_session_for_access
from .pages import authorized_page_access

files_fields = ['FileID', 'PageID', 'name', 'hash', 'filename', 'description', 'upload_date', 'content']


def create_file(page_id, name, filename, description, content):
    hash_object = hashlib.sha512(content)
    file_hash = hash_object.hexdigest()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO files (PageID, name, hash, filename, description, content)
        VALUES (%s, %s, %s, %s, %s, %s);
    """, (page_id, name, file_hash, filename, description, content))
    conn.commit()
    cursor.close()
    conn.close()


def get_file_by_id(file_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM files where fileID = %s;", (file_id,))
    file = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if file is not None:
        file = {k: v for k, v in zip(files_fields, file)}
    return file


def get_files_by_page(page_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM files where PageID = %s;", (page_id,))
    file = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if file is not None:
        file = {k: v for k, v in zip(files_fields, file) if k != "content"}
    return file


@files_bp.route('/test', methods=['GET'])
def test_ep():
    return jsonify({"test": "Files  Endpoint Reached."})


@files_bp.route('/file', methods=['post'])
def upload_file_ep():
    file = request.files.get("file")
    name = request.form.get("name")
    page_id = request.form.get("page_id")
    description = request.form.get("description")

    filename = file.filename
    content = file.read()

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Session is Invalid", STATUS.FORBIDDEN)

    if not authorized_page_access(token, page_id):
        return make_response("Not Authorized To Access Project", STATUS.FORBIDDEN)

    create_file(page_id, name, filename, description, content)

    response = make_response(f"Uploaded: {name}", STATUS.OK)
    return response


@files_bp.route('/file', methods=['get'])
def get_file_ep():
    file_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Invalid Session", STATUS.FORBIDDEN)

    file = get_file_by_id(file_id)

    if not authorized_page_access(token, file['PageID']):
        return make_response("Not Authorized To Access Equation", STATUS.FORBIDDEN)

    if file is None:
        response = make_response("Does Not Exist", STATUS.OK)
        return response

    return send_file(
        BytesIO(file['content']),
        mimetype="application/octet-stream",
        as_attachment=True,
        download_name=file['filename']
    )


@files_bp.route('/files_by_page', methods=['get'])
def get_files_ep():
    page_id = int(request.args.get("page_id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Invalid Session", STATUS.FORBIDDEN)

    files = get_files_by_page(page_id)

    if not authorized_page_access(token, page_id):
        return make_response("Not Authorized To Access Equation", STATUS.FORBIDDEN)

    if files is None:
        response = make_response("Does Not Exist", STATUS.OK)
        return response

    response = make_response(files, STATUS.OK)
    return response
