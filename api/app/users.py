from flask import Blueprint, jsonify, request
import hashlib
import secrets
import json

from .db import get_db_connection
from .sessions import create_session

users_bp = Blueprint('users', __name__, url_prefix='/users')


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


users_fields = ['UserID', 'name', 'hash', 'salt', 'lastFailedLogin', 'timeCreated', 'preferences']


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
        ON CONFLICT (name) DO NOTHING;
    """, (name, pwd_hash, salt, prefs))
    conn.commit()
    cursor.close()
    conn.close()


def authenticate_user(name, password):
    account = get_user_by_name(name)

    if account is None:
        return -1

    if get_hash(password, account['salt']) != account['hash']:
        return -1

    return account['UserID']


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
        return jsonify({"error": "Password Too Short"}), 400

    if get_user_by_name(username) is not None:
        return jsonify({"error": "Username Taken"}), 400

    create_user(username, password, preferences)

    if get_user_by_name(username) is None:
        return jsonify({"error": "Error Creating Account"}), 400

    return jsonify({"success": f"Created: {username}"}), 200


@users_bp.route('/login', methods=['POST'])
def login_ep():
    data = request.get_json()
    username = data.get("username").strip()
    password = data.get("password").strip()

    result = authenticate_user(username, password)
    if result == -1:
        return jsonify({"error": "Failed To Authenticate"}), 400

    token = create_session(result, request.remote_addr)

    if token is None:
        return jsonify({"error": "Failed To Create Session"}), 400

    return jsonify({"session": token}), 200




