from flask import Blueprint, jsonify, request
import hashlib
import secrets
import json

from .db import get_db_connection

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
        return jsonify({"error": "Password Too Short"}), 500

    if get_user_by_name(username) is not None:
        return jsonify({"error": "Username Taken"}), 500

    create_user(username, password, preferences)

    if get_user_by_name(username) is None:
        return jsonify({"error": "Error Creating Account"}), 500

    return jsonify({"success": f"Created: {username}"}), 200