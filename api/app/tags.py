from flask import Blueprint, jsonify, request, make_response
from http import HTTPStatus as STATUS
from datetime import datetime

tags_bp = Blueprint('tags', __name__, url_prefix='/tags')
from .db import get_db_connection
from .sessions import verify_session_for_access
from .projects import authorized_project_access

tag_fields = ['TagID', 'UserID', 'tag', 'options']


def create_tag(user_id, tag, options):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO tags (UserID, tag, options)
        VALUES (%s, %s, %s)
        RETURNING *;
    """, (user_id, tag, options,))
    new_tag = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if new_tag is not None:
        new_tag = {k: v for k, v in zip(tag_fields, new_tag)}
    return new_tag


def get_tags_by_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tags where UserID = %s;", (user_id,))
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


def get_tags_by_project(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT TagID, UserID, tag, options FROM tags 
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


def get_tag_by_id(tag_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tags where TagID = %s", (tag_id,))
    tag = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if tag is not None:
        tag = {k: v for k, v in zip(tag_fields, tag)}
    return tag


def update_tag(tag_id, tag, options):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE tags SET tag = %s, options = %s WHERE TagID = %s RETURNING *;", (tag, options, tag_id,))
    tag = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if tag is not None:
        tag = {k: v for k, v in zip(tag_fields, tag)}
    return tag


def delete_tag(tag_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tags where TagID = %s;", (tag_id,))
    conn.commit()
    cursor.close()
    conn.close()


def create_mapping(tag_id, project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO tagmappings (tagID, projectID)
        VALUES (%s, %s);
    """, (tag_id, project_id))
    conn.commit()
    cursor.close()
    conn.close()


@tags_bp.route('/test', methods=['GET'])
def test_ep():
    return jsonify({"test": "Tags  Endpoint Reached."})


@tags_bp.route('/create', methods=['POST'])
def create_ep():
    data = request.get_json()
    tag = data.get("tag").strip()
    options = data.get("options").strip()

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    new_tag = create_tag(session['UserID'], tag, options)

    if new_tag is None:
        return make_response({'status': 'error', 'message': "Failed To Create Tag"}, STATUS.INTERNAL_SERVER_ERROR)

    response = make_response({'status': 'success', 'message': f'Created {tag}'}, STATUS.OK)
    return response


@tags_bp.route('/get', methods=['GET'])
def get_all_by_user_ep():
    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    tags = get_tags_by_user(session['UserID'])

    if tags is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.FORBIDDEN)

    response = make_response({'status': 'success', 'message': tags}, STATUS.OK)
    return response


@tags_bp.route('/get_by_project', methods=['GET'])
def get_all_by_project_ep():
    project_id = int(request.args.get("project_id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    tags = get_tags_by_project(project_id)

    if tags is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.FORBIDDEN)


    response = make_response({'status': 'success', 'message': tags}, STATUS.OK)
    return response


@tags_bp.route('/update', methods=['PATCH'])
def update_ep():
    data = request.get_json()
    tag_id = data.get("tag_id")
    new_tag = data.get("new_tag").strip()
    new_options = data.get("new_options").strip()

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    tag = get_tag_by_id(tag_id)

    if session['UserID'] != tag['UserID']:
        return make_response({'status': 'error', 'message': "Not Authorized"}, STATUS.FORBIDDEN)

    updated_tag = update_tag(tag_id, new_tag, new_options)

    if updated_tag is None:
        return make_response({'status': 'error', 'message': "Failed To Update Tag"}, STATUS.FORBIDDEN)

    response = make_response({'status': 'success', 'message': f'Updated {tag}'}, STATUS.OK)
    return response


@tags_bp.route('/assign', methods=['POST'])
def assign_ep():
    data = request.get_json()
    tag_id = data.get("tag_id")
    project_id = data.get("project_id")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    if not authorized_project_access(token, project_id):
        return make_response({'status': 'error', 'message': "Not Authorized"}, STATUS.FORBIDDEN)

    tag = get_tag_by_id(tag_id)
    if session['UserID'] != tag['UserID']:
                return make_response({'status': 'error', 'message': "Not Authorized"}, STATUS.FORBIDDEN)

    create_mapping(tag_id, project_id)

    response = make_response({'status': 'success', 'message': 'Mapped Tag'}, STATUS.OK)
    return response


@tags_bp.route('/delete', methods=['DELETE'])
def delete_ep():
    data = request.get_json()
    tag_id = data.get("tag_id")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    tag = get_tag_by_id(tag_id)

    if session['UserID'] != tag['UserID']:
        return make_response({'status': 'error', 'message': "Failed To Delete Tag"}, STATUS.FORBIDDEN)

    delete_tag(tag_id)

    response = make_response({'status': 'success', 'message': f'Deleted {tag_id}'}, STATUS.OK)
    return response
