from .db import get_db_connection


def create_access_request(session_id, project_id, allowed):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO projectrequests (sessionID, projectID, accessGranted)
        VALUES (%s, %s, %s);
    """, (session_id, project_id, allowed))
    conn.commit()
    cursor.close()
    conn.close()


def get_project_access_requests():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT accessTime, accessGranted, ipAddress, name FROM projectRequests
    JOIN projects on projects.projectID = projectRequests.projectID
    JOIN sessions on sessions.sessionID = projectRequests.sessionID
    """)
    requests = cursor.fetchall()
    conn.commit()
    cursor.close()
    conn.close()
    return requests
