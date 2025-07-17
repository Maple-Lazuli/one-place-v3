from flask import Blueprint, jsonify, request, make_response
from http import HTTPStatus as STATUS
from datetime import datetime

events_bp = Blueprint('events', __name__, url_prefix='/events')

from .db import get_db_connection
from .sessions import verify_session_for_access
from .projects import authorized_project_access

event_fields = ['EventID', 'ProjectID', 'name', 'description', 'timeCreated', 'eventTime', 'duration', 'lastUpdate']


def get_last_update(event_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT lastUpdate FROM events where EventID = %s;", (event_id,))
    last_update = cursor.fetchone()
    cursor.close()
    conn.close()
    if last_update is not None:
        return last_update[0]
    return None


def create_event(projectID, name, description, eventTime, duration):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO events (ProjectID, name, description, eventTime, duration)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING *;
    """, (projectID, name, description, eventTime, duration))
    new_event = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if new_event is not None:
        new_event = {k: v for k, v in zip(event_fields, new_event)}
    return new_event


def update_event(event_id, name, description, eventTime, duration):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE events SET name = %s, description = %s, eventTime = %s, duration = %s, lastUpdate = %s
        WHERE eventID = %s
        RETURNING *;
    """, (name, description, eventTime, duration, datetime.now(), event_id))
    updated_event = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if updated_event is not None:
        updated_event = {k: v for k, v in zip(event_fields, updated_event)}
    return updated_event


def delete_event(event_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM events where EventID = %s;", (event_id,))
    conn.commit()
    cursor.close()
    conn.close()


def get_event_by_id(event_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM events where EventID = %s", (event_id,))
    event = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if event is not None:
        event = {k: v for k, v in zip(event_fields, event)}
    return event


def get_all_events(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM events where projectID = %s", (project_id,))
    events = cursor.fetchall()
    conn.commit()
    cursor.close()
    conn.close()
    if events is not None:
        event_list = []
        for event in events:
            event = {k: v for k, v in zip(event_fields, event)}
            event_list.append(event)
        return event_list
    return None


@events_bp.route('/test', methods=['GET'])
def test_ep():
    return jsonify({"test": "Events  Endpoint Reached."})


@events_bp.route('/create', methods=['POST'])
def create_ep():
    data = request.get_json()
    project_id = int(data.get("project_id"))
    event_name = data.get("name").strip()
    event_description = data.get("description").strip()
    event_time = data.get("time")
    duration = data.get("duration", None)

    event_time = datetime.fromtimestamp(float(event_time))

    if duration is not None:
        duration = int(duration)

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    if not authorized_project_access(token, project_id):
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    new_event = create_event(project_id, event_name, event_description, event_time, duration)
    if new_event is None:
        return make_response({'status': 'error', 'message': "Failed To Create Event"}, STATUS.INTERNAL_SERVER_ERROR)

    response = make_response({'status': 'success', 'message': f'Created {event_name}'}, STATUS.OK)
    return response


@events_bp.route('/get', methods=['GET'])
def get_ep():
    event_id = int(request.args.get("id"))
    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    event = get_event_by_id(event_id)

    if not authorized_project_access(token, event['ProjectID']):
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    if event is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.FORBIDDEN)

    response = make_response({'status': 'success', 'message': event}, STATUS.OK)
    return response


@events_bp.route('/get_project_events', methods=['GET'])
def get_all_ep():
    project_id = int(request.args.get("project_id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    if not authorized_project_access(token, project_id):
        return make_response("Not Authorized To Access", STATUS.FORBIDDEN)

    event_list = get_all_events(project_id)

    if event_list is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.FORBIDDEN)

    response = make_response({'status': 'success', 'message': event_list}, STATUS.OK)
    return response


@events_bp.route('/update', methods=['PATCH'])
def update_ep():
    data = request.get_json()
    event_id = int(data.get("event_id"))
    event_name = data.get("new_name").strip()
    event_description = data.get("new_description").strip()
    event_time = data.get("new_time")
    duration = data.get("new_duration", None)

    event_time = datetime.fromtimestamp(float(event_time))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    todo = get_event_by_id(event_id)

    if not authorized_project_access(token, todo['ProjectID']):
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    updated_event = update_event(event_id, event_name, event_description, event_time, duration)

    if updated_event is None:
        return make_response({'status': 'error', 'message': "Failed To Update Event"}, STATUS.FORBIDDEN)

    response = make_response({'status': 'success', 'message': f'Updated {event_name}'}, STATUS.OK)
    return response


@events_bp.route('/delete', methods=['DELETE'])
def delete_ep():
    data = request.get_json()
    event_id = int(data.get("event_id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    event = get_event_by_id(event_id)

    if not authorized_project_access(token, event['ProjectID']):
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    delete_event(event_id)

    response = make_response({'status': 'success', 'message': f'Deleted {event["name"]}'}, STATUS.OK)
    return response


@events_bp.route('/last_update', methods=['GET'])
def last_update():
    event_id = int(request.args.get("id"))
    time = get_last_update(event_id)
    if time is None:
        return make_response({"event_id": event_id, "last_update": "Null"}, STATUS.OK)
    return make_response({"event_id": event_id, "last_update": time}, STATUS.OK)
