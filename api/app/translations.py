from flask import Blueprint, jsonify, request, make_response
from http import HTTPStatus as STATUS
from datetime import datetime

translations_bp = Blueprint('translations', __name__, url_prefix='/translations')
from .db import get_db_connection
from .sessions import verify_session_for_access
from .pages import authorized_page_access

translation_fields = ['TranslationID', 'PageID', 'language', 'content', 'timeCreated', 'lastEditTime']


def log_access(translation_id, allowed, notes):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO translationrequests (TranslationID, accessGranted, notes)
        VALUES (%s, %s, %s);
    """, (translation_id, allowed, notes))
    conn.commit()
    cursor.close()
    conn.close()


def convert_time(object):
    object['timeCreated'] = object['timeCreated'].timestamp()
    object['lastEditTime'] = object['lastEditTime'].timestamp()
    return object


def get_last_update(translation_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT lastEditTime FROM Translations where TranslationID = %s;", (translation_id,))
    last_update = cursor.fetchone()
    cursor.close()
    conn.close()
    if last_update is not None:
        return last_update[0].timestamp()
    return None


def delete_translation(translation_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Translations where TranslationID = %s;", (translation_id,))
    conn.commit()
    cursor.close()
    conn.close()


def update_translation(translation_id, content):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE Translations SET content = %s, lastEditTime = %s
        WHERE TranslationID = %s
        RETURNING *;
    """, (content, datetime.now(), translation_id,))
    translation = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if translation is not None:
        translation = {k: v for k, v in zip(translation_fields, translation)}
        translation = convert_time(translation)
    return translation


def get_translation_by_id(translation_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Translations where TranslationID = %s;", (translation_id,))
    translation = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if translation is not None:
        translation = {k: v for k, v in zip(translation_fields, translation)}
        translation = convert_time(translation)
    return translation


def get_translations_by_page(page_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Translations where PageID = %s;", (page_id,))
    translations = cursor.fetchall()
    conn.commit()
    cursor.close()
    conn.close()
    if translations is not None:
        translation_list = []
        for translation in translations:
            translation = {k: v for k, v in zip(translation_fields, translation)}
            translation = convert_time(translation)
            translation_list.append(translation)
        return translation_list
    return None


def create_translation(page_id, language):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO Translations (PageID, language, lastEditTime)
        VALUES (%s, %s, %s)
        RETURNING *;
    """, (page_id, language, datetime.now()))
    translation = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if translation is not None:
        translation = {k: v for k, v in zip(translation_fields, translation)}
        translation = convert_time(translation)
    return translation


@translations_bp.route('/test', methods=['GET'])
def test_ep():
    return jsonify({"test": "Translations  Endpoint Reached."})


@translations_bp.route('/create', methods=['POST'])
def create_ep():
    data = request.get_json()
    page_id = data.get("page_id")
    language = data.get("language")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    if not authorized_page_access(token, page_id):
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    new_translation = create_translation(page_id, language)

    if new_translation is None:
        return make_response({'status': 'error', 'message': "Failed To Create Translation"}, STATUS.INTERNAL_SERVER_ERROR)

    log_access(new_translation['TranslationID'], True, "CREATE")
    response = make_response({'status': 'success', 'message': f"Created Translation in {new_translation['language']}", "id": new_translation['TranslationID']}, STATUS.OK)
    return response


@translations_bp.route('/get', methods=['GET'])
def get_ep():
    translation_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        log_access(translation_id, False, "GET")
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    translation = get_translation_by_id(translation_id)

    if not authorized_page_access(token, translation['PageID']):
        log_access(translation_id, False, "GET")
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    if translation is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.OK)

    log_access(translation_id, True, "GET")
    response = make_response({'status': 'success', 'message': translation}, STATUS.OK)
    return response


@translations_bp.route('/get_all_by_page', methods=['GET'])
def get_all_by_page_ep():
    page_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    translations = get_translations_by_page(page_id)

    if not authorized_page_access(token, page_id):
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    if translations is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.OK)

    response = make_response({'status': 'success', 'message': translations}, STATUS.OK)
    return response


@translations_bp.route('/update', methods=['PUT'])
def update_ep():
    data = request.get_json()
    translation_id = data.get("translation_id")
    content = data.get("new_content")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        log_access(translation_id, False, "GET")
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    translation = get_translation_by_id(translation_id)

    if not authorized_page_access(token, translation['PageID']):
        log_access(translation_id, False, "GET")
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    updated_translation = update_translation(translation_id, content)

    if updated_translation is None:
        return make_response({'status': 'error', 'message': "Error updating translation"}, STATUS.INTERNAL_SERVER_ERROR)

    log_access(translation_id, True, "GET")
    response = make_response({'status': 'success', 'message': f"Updated {updated_translation['language']} Translation"},
                             STATUS.OK)
    return response


@translations_bp.route('/delete', methods=['DELETE'])
def delete_ep():
    data = request.get_json()
    translation_id = data.get("translation_id")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        log_access(translation_id, False, "GET")
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    translation = get_translation_by_id(translation_id)

    if not authorized_page_access(token, translation['PageID']):
        log_access(translation_id, False, "GET")
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    log_access(translation_id, True, "GET")
    delete_translation(translation_id)
    response = make_response({'status': 'success', 'message': f"Deleted: {translation_id}"}, STATUS.OK)
    return response


@translations_bp.route('/last_update', methods=['GET'])
def last_update():
    translation_id = int(request.args.get("id"))
    time = get_last_update(translation_id)
    if time is None:
        return make_response({"translation_id": translation_id, "last_update": "Null"}, STATUS.OK)
    return make_response({"translation_id": translation_id, "last_update": time}, STATUS.OK)
