from flask import Blueprint, jsonify, request, make_response, send_file
from http import HTTPStatus as STATUS
from io import BytesIO
import hashlib

images_bp = Blueprint('images', __name__, url_prefix='/images')
from .db import get_db_connection
from .sessions import verify_session_for_access

image_fields = ['ImageID', 'UserID', 'Content', 'TimeCreated']


def create_image(user_id, content):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO images (UserID, content)
        VALUES (%s, %s)
        RETURNING ImageID;
    """, (user_id, content))
    image_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()
    return image_id


def get_image(user_id, image_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT content FROM images WHERE UserID = %s AND ImageID = %s;",
        (user_id, image_id))
    image_bytes = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()
    return image_bytes


def delete_image(image_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM images images ImageID = %s;", (image_id,))
    conn.commit()
    cursor.close()
    conn.close()


@images_bp.route('/test', methods=['GET'])
def test_ep():
    return jsonify({"test": "Files  Endpoint Reached."})


@images_bp.route('/image', methods=['post'])
def upload_file_ep():
    file = request.files.get("file")
    content = file.read()

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Session is Invalid", STATUS.FORBIDDEN)

    image_id = create_image(session['UserID'], content)

    response = make_response({"id": image_id}, STATUS.OK)

    return response


@images_bp.route('/image', methods=['get'])
def get_file_ep():
    image_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Invalid Session", STATUS.FORBIDDEN)

    image_content = get_image(session['UserID'], image_id)

    if image_content is None:
        response = make_response("Does Not Exist", STATUS.OK)
        return response

    return send_file(BytesIO(image_content), mimetype='image/png')


@images_bp.route('/image', methods=['delete'])
def delete_file_ep():
    image_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Invalid Session", STATUS.FORBIDDEN)

    image_content = get_image(session['UserID'], image_id)

    if image_content is None:
        response = make_response("Does Not Exist", STATUS.OK)
        return response

    response = make_response({"status": "success"}, STATUS.OK)
    return response
