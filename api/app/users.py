from flask import Blueprint, jsonify, request, make_response
from http import HTTPStatus as STATUS
import hashlib
import secrets
import json

from .configuration import load_config
from .db import get_db_connection
from .sessions import create_session, verify_session, deactivate_session

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
    preferences = data.get("preferences", "{}")

    if len(password) < 8:
        return make_response("Password Too Short. Needs more than 8 characters.", STATUS.BAD_REQUEST)

    if get_user_by_name(username) is not None:
        return make_response("Username Unavailable", STATUS.BAD_REQUEST)

    response = create_user(username, password, preferences)

    if response is None:
        return make_response("Error Creating Account", STATUS.INTERNAL_SERVER_ERROR)

    return jsonify({"success": f"Created: {username}"}), STATUS.OK


@users_bp.route('/update_user', methods=['PATCH'])
def update_user_ep():
    # TODO: Flesh this out.
    pass


@users_bp.route('/login', methods=['POST'])
def login_ep():
    data = request.get_json()
    username = data.get("username").strip()
    password = data.get("password").strip()

    user_id = authenticate_user(username, password)
    if user_id == -1:
        return make_response("Failed To Authenticate", STATUS.FORBIDDEN)

    token = create_session(user_id, request.remote_addr)

    if token is None:
        return make_response("Failed To Create Session", STATUS.INTERNAL_SERVER_ERROR)

    response = make_response(f"Authenticated: {username}", STATUS.CREATED)

    response.set_cookie("token", token, max_age=config['app']['session_life_seconds'], httponly=True)
    # will need to set the user preferences cookie here too.

    return response


@users_bp.route('/delete', methods=['DELETE'])
def delete_user_ep():
    data = request.get_json()
    username = data.get("username").strip()
    password = data.get("password").strip()

    user_id = authenticate_user(username, password)
    if user_id == -1:
        return make_response("Failed To Authenticate", STATUS.FORBIDDEN)

    token = request.cookies.get("token")

    if not verify_session(token, user_id):
        return make_response("Invalid Session", STATUS.FORBIDDEN)

    delete_user_by_id(user_id)
    if get_user_by_id(user_id) is not None:
        return make_response("Error Deleting Account", STATUS.INTERNAL_SERVER_ERROR)

    response = make_response(f"Deleted {username}", STATUS.OK)
    response.delete_cookie("token")
    return response


@users_bp.route('/logout', methods=['PATCH'])
def logout_ep():
    data = request.get_json()

    username = data.get("username").strip()
    user_id = get_user_by_name(username)['UserID']

    token = request.cookies.get("token")

    if not verify_session(token, user_id):
        return make_response("Invalid Session", STATUS.FORBIDDEN)

    deactivate_session(token)

    if verify_session(token, user_id):
        return make_response("Error Ending Session", STATUS.FORBIDDEN)

    response = make_response(f"Logged Out {username}", STATUS.OK)
    response.delete_cookie("token")
    return response
