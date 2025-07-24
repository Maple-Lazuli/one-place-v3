from flask import Blueprint, jsonify, request, make_response
from http import HTTPStatus as STATUS
import hashlib
import secrets
import json

from .configuration import load_config
from .db import get_db_connection
from .sessions import create_session, verify_session, deactivate_session, verify_session_for_access, deactivate_session

config = load_config()
users_bp = Blueprint('users', __name__, url_prefix='/users')
users_fields = ['UserID', 'name', 'hash', 'salt', 'lastFailedLogin', 'timeCreated', 'preferences']


def generate_salt():
    """
    Generates 16 bytes to server as the salt to go with the supplied password.
    :return: bytes array
    """
    return secrets.token_bytes(16)


def get_hash(password, salt):
    """"
    Creates the password hash from the salt and the user provided password.
    """
    plain_text = password.encode() + salt

    hash_object = hashlib.sha512(plain_text)
    hashed_hex = hash_object.hexdigest()
    return hashed_hex


def get_user_by_name(user_name):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users where name = %s", (user_name,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    if user is not None:
        user = {k: v for k, v in zip(users_fields, user)}
    return user


def get_user_by_id(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users where UserID = %s", (user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    if user is not None:
        user = {k: v for k, v in zip(users_fields, user)}
    return user


def update_user_name(user_id, new_username):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET name = %s where UserID = %s RETURNING *", (new_username, user_id,))
    modified_user = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if modified_user is not None:
        modified_user = {k: v for k, v in zip(users_fields, modified_user)}
    return modified_user


def update_user_preferences(user_id, preferences):
    if type(preferences) == dict:
        preferences = json.dumps(preferences)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET preferences = %s where UserID = %s RETURNING *", (preferences, user_id,))
    modified_user = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if modified_user is not None:
        modified_user = {k: v for k, v in zip(users_fields, modified_user)}
    return modified_user


def update_user_password(user_id, new_password):
    account = get_user_by_id(user_id)
    new_hash = get_hash(new_password, account['salt'])

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET hash = %s where UserID = %s RETURNING *", (new_hash, user_id,))
    modified_user = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if modified_user is not None:
        modified_user = {k: v for k, v in zip(users_fields, modified_user)}
    return modified_user


def create_user(name, password, prefs):
    if type(prefs) == dict:
        prefs = json.dumps(prefs)

    salt = generate_salt()
    pwd_hash = get_hash(password, salt)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO users (name, hash, salt, preferences)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (name) DO NOTHING
        RETURNING *;
    """, (name, pwd_hash, salt, prefs))
    new_user = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if new_user is not None:
        new_user = {k: v for k, v in zip(users_fields, new_user)}
    return new_user


def authenticate_user(name, password):
    account = get_user_by_name(name)

    if account is not None:
        if get_hash(password, account['salt']) == account['hash']:
            return account['UserID']

    return -1


def delete_user_by_id(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users where UserID = (%s)", (user_id,))
    conn.commit()
    cursor.close()
    conn.close()


@users_bp.route('/test', methods=['GET'])
def test_ep():
    return jsonify({"test": "Users Endpoint Reached."})


@users_bp.route('/create_user', methods=['POST'])
def create_user_ep():
    data = request.get_json()
    username = data.get("username").strip()
    password = data.get("password").strip()
    preferences = data.get("preferences", 'light')

    if len(password) < 8:
        return make_response({'status': 'error', 'message': "Password Needs To Be Longer Than 8 Charactes"},
                             STATUS.BAD_REQUEST)

    if get_user_by_name(username) is not None:
        return make_response({'status': 'error', 'message': "Username Unavailable"}, STATUS.BAD_REQUEST)

    response = create_user(username, password, preferences)

    if response is None:
        return make_response({'status': 'error', 'message': "Error Creating Account"}, STATUS.BAD_REQUEST)

    return jsonify({'status': 'success', "message": f"Created: {username}", "id": response['UserID']}), STATUS.OK


@users_bp.route('/update_user_name', methods=['PATCH'])
def update_user_name_ep():
    data = request.get_json()

    username = data.get("username").strip()
    new_username = data.get("new_username").strip()
    password = data.get("password").strip()
    token = request.cookies.get("token")

    user_id = authenticate_user(username, password)

    if user_id == -1:
        return make_response({'status': 'error', 'message': "Failed To Authenticate"}, STATUS.FORBIDDEN)

    if not verify_session(token, user_id):
        return make_response({'status': 'error', 'message': "Invalid Session"}, STATUS.FORBIDDEN)

    if get_user_by_name(new_username) is not None:
        return make_response({'status': 'error', 'message': "Username Unavailable"}, STATUS.BAD_REQUEST)

    modified_account = update_user_name(user_id, new_username)

    if (modified_account is None) or (modified_account['name'] == username):
        return make_response({'status': 'error', 'message': "Failed To Mutate Account"}, STATUS.INTERNAL_SERVER_ERROR)

    response = make_response({'status': 'success', 'message': f"Changed username to: {new_username}"}, STATUS.OK)

    return response


@users_bp.route('/update_user_password', methods=['PATCH'])
def update_user_password_ep():
    data = request.get_json()

    username = data.get("username").strip()
    new_password = data.get("new_password").strip()
    password = data.get("password").strip()
    token = request.cookies.get("token")

    user_id = authenticate_user(username, password)

    if user_id == -1:
        return make_response({'status': 'error', 'message': "Failed To Authenticate"}, STATUS.FORBIDDEN)

    if not verify_session(token, user_id):
        return make_response({'status': 'error', 'message': "Invalid Session"}, STATUS.FORBIDDEN)

    modified_account = update_user_password(user_id, new_password)

    if modified_account is None:
        return make_response({'status': 'error', 'message': "Failed To Mutate Account"}, STATUS.INTERNAL_SERVER_ERROR)

    response = make_response({'status': 'success', 'message': "Updated Password Successfully"}, STATUS.OK)
    return response


@users_bp.route('/update_user_preferences', methods=['PATCH'])
def update_user_preferences_ep():
    data = request.get_json()

    username = data.get("username").strip()
    preferences = data.get("preferences").strip()
    password = data.get("password").strip()
    token = request.cookies.get("token")

    user_id = authenticate_user(username, password)

    if user_id == -1:
        return make_response({'status': 'error', 'message': "Failed To Authenticate"}, STATUS.FORBIDDEN)

    if not verify_session(token, user_id):
        return make_response({'status': 'error', 'message': "Invalid Session"}, STATUS.FORBIDDEN)

    modified_account = update_user_preferences(user_id, preferences)

    if modified_account is None:
        return make_response({'status': 'error', 'message': "Failed To Mutate Account"}, STATUS.INTERNAL_SERVER_ERROR)

    response = make_response({'status': 'success', 'message': "Updated Preferences Successfully"}, STATUS.OK)
    response.set_cookie("preferences", modified_account['preferences'], max_age=config['app']['session_life_seconds'],
                        httponly=False)
    response.set_cookie("username", modified_account['name'], max_age=config['app']['session_life_seconds'],
                        httponly=False)
    return response


@users_bp.route('/login', methods=['POST'])
def login_ep():
    data = request.get_json()
    username = data.get("username").strip()
    password = data.get("password").strip()

    user_id = authenticate_user(username, password)
    if user_id == -1:
        return make_response({'status': 'error', 'message': "Failed To Authenticate"}, STATUS.FORBIDDEN)

    token = create_session(user_id, request.remote_addr)

    if token is None:
        return make_response({'status': 'error', 'message': "Invalid Session"}, STATUS.FORBIDDEN)

    user = get_user_by_id(user_id)

    response = make_response({'status': 'success', 'message': "Authenticated Successfully"}, STATUS.OK)
    response.set_cookie("token", token, max_age=config['app']['session_life_seconds'], httponly=True)
    response.set_cookie("preferences", user['preferences'], max_age=config['app']['session_life_seconds'],
                        httponly=False)
    response.set_cookie("username", user['name'], max_age=config['app']['session_life_seconds'], httponly=False)

    return response


@users_bp.route('/new_session', methods=['get'])
def create_new_session_ep():
    token = request.cookies.get("token")
    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    if request.remote_addr != session['ipAddress']:
        return make_response({'status': 'error', 'message': "Session Must Be Renewed From Same Host"}, STATUS.FORBIDDEN)

    token = create_session(session['UserID'], request.remote_addr)

    if token is None:
        return make_response({'status': 'error', 'message': "Invalid Session"}, STATUS.FORBIDDEN)

    response = make_response({'status': 'success', 'message': "Authenticated Successfully"}, STATUS.OK)
    response.set_cookie("token", token, max_age=config['app']['session_life_seconds'], httponly=True)
    return response


@users_bp.route('/session', methods=['get'])
def get_session_details_ep():
    token = request.cookies.get("token")
    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    if token is None:
        return make_response({'status': 'error', 'message': "Invalid Session"}, STATUS.FORBIDDEN)

    response = make_response(
        {'status': 'success', 'active': session['isActive'], 'endTime': session['endTime'].timestamp()}, STATUS.OK)
    return response


@users_bp.route('/delete', methods=['DELETE'])
def delete_user_ep():
    data = request.get_json()
    username = data.get("username").strip()
    password = data.get("password").strip()

    user_id = authenticate_user(username, password)
    if user_id == -1:
        return make_response({'status': 'error', 'message': "Failed To Authenticate"}, STATUS.FORBIDDEN)

    token = request.cookies.get("token")

    if not verify_session(token, user_id):
        return make_response({'status': 'error', 'message': "Invalid Session"}, STATUS.FORBIDDEN)

    delete_user_by_id(user_id)
    if get_user_by_id(user_id) is not None:
        return make_response({'status': 'error', 'message': "Failed To Delete Account"}, STATUS.INTERNAL_SERVER_ERROR)

    deactivate_session(token)

    response = make_response({'status': 'success', 'message': f'Deleted: {username}'}, STATUS.OK)
    response.delete_cookie("token")
    response.delete_cookie("preferences")
    response.delete_cookie("username")

    return response


@users_bp.route('/logout', methods=['PATCH'])
def logout_ep():
    data = request.get_json()

    username = data.get("username").strip()
    user_id = get_user_by_name(username)['UserID']

    token = request.cookies.get("token")

    if not verify_session(token, user_id):
        return make_response({'status': 'error', 'message': "Invalid Session"}, STATUS.FORBIDDEN)

    deactivate_session(token)

    if verify_session(token, user_id):
        return make_response({'status': 'error', 'message': "Error Ending Session"}, STATUS.INTERNAL_SERVER_ERROR)

    response = make_response({'status': 'success', 'message': f'Logged Out: {username}'}, STATUS.OK)
    response.delete_cookie("token")
    response.delete_cookie("preferences")
    response.delete_cookie("username")

    return response


@users_bp.route('/get_name', methods=['GET'])
def get_name_ep():
    token = request.cookies.get("token")
    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    name = get_user_by_id(session['UserID'])['name']

    response = make_response({'status': 'success', 'name': name}, STATUS.OK)
    return response
