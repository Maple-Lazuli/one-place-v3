from datetime import datetime, timedelta
from flask import Blueprint, jsonify
import secrets
import base64

from .db import get_db_connection

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
    end_time = start_time + timedelta(hours=48)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO sessions (UserID, startTime, endTime, token, ipAddress, isActive)
        VALUES (%s, %s, %s, %s, %s, %s);
    """, (user_id, start_time, end_time, token, ip, True))
    conn.commit()
    cursor.close()
    conn.close()

    if verify_session(token):
        return token
    else:
        return None


def verify_session(token):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sessions where token = %s;", (token,))
    session = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if session is None:
        return False

    session = {k: v for k, v in zip(sessions_fields, session)}

    if (session['endTime'] >= datetime.now()) and (session['isActive']):
        return True
    else:
        return False


@sessions_bp.route('/test', methods=['GET'])
def test_ep():
    return jsonify({"test": "Sessions  Endpoint Reached."})


