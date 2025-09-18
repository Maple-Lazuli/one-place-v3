from datetime import datetime, timedelta
from flask import Blueprint, jsonify
import secrets
import base64

from .configuration import load_config
from .db import get_db_connection

config = load_config()
sessions_bp = Blueprint('sessions', __name__, url_prefix='/sessions')
sessions_fields = ['SessionID', 'UserID', 'startTime', 'endTime', 'token', 'ipAddress', 'isActive']


def generate_token():
    base = datetime.now().timestamp().hex() + secrets.token_bytes(64).hex()
    base = base.encode()
    token = base64.encodebytes(base).strip().decode()
    return token


def create_session(user_id, ip):
    token = generate_token()
    start_time = datetime.now()
    end_time = start_time + timedelta(seconds=config['app']['session_life_seconds'])
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO sessions (UserID, startTime, endTime, token, ipAddress, isActive)
        VALUES (%s, %s, %s, %s, %s, %s);
    """, (user_id, start_time, end_time, token, ip, True))
    conn.commit()
    cursor.close()
    conn.close()

    if verify_session(token, user_id):
        return token
    else:
        return None


def verify_session(token, user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sessions where token = %s;", (token,))
    session = cursor.fetchone()
    cursor.close()
    conn.close()
    if session is None:
        return False

    session = {k: v for k, v in zip(sessions_fields, session)}

    if session['UserID'] != user_id:
        return False

    if (session['endTime'] >= datetime.now()) and (session['isActive']):
        return True
    else:
        return False


def verify_session_for_access(token):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sessions where token = %s;", (token,))
    session = cursor.fetchone()
    cursor.close()
    conn.close()
    if session is None:
        return False, None

    session = {k: v for k, v in zip(sessions_fields, session)}

    if (session['endTime'] >= datetime.now()) and (session['isActive']):
        return True, session
    else:
        return False, None


def deactivate_session(token):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE sessions SET isActive = FALSE where token = %s;", (token,))
    conn.commit()
    cursor.close()
    conn.close()
    return


@sessions_bp.route('/test', methods=['GET'])
def test_ep():
    return jsonify({"test": "Sessions  Endpoint Reached."})
