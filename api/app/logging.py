from flask import Blueprint, jsonify, request, make_response
from http import HTTPStatus as STATUS
from datetime import datetime, timezone,timedelta

logging_bp = Blueprint('logging', __name__, url_prefix='/logging')
from .db import get_db_connection
from .sessions import verify_session_for_access


def authorized_page_access(token, page_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT endTime, isActive, token  FROM sessions
    inner join projects
    on projects.UserID = sessions.UserID
    inner join pages
    on pages.projectID = projects.projectID
    where token = %s and pages.PageID = %s
    """, (token, page_id))
    result = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()


def authorized_project_access(token, project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT endTime, isActive, token  FROM sessions
    inner join projects
    on projects.UserID = sessions.UserID
    where token = %s and ProjectID = %s
    """, (token, project_id))
    result = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()

    if result is not None:
        result = {k: v for k, v in zip(['endTime', 'isActive', 'token'], result)}
        if (result['endTime'] >= datetime.now()) and (result['isActive']):
            return True
    return False


def create_access_request(session_id, project_id, allowed, notes):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO projectrequests (sessionID, projectID, accessGranted, notes)
        VALUES (%s, %s, %s, %s);
    """, (session_id, project_id, allowed, notes))
    conn.commit()
    cursor.close()
    conn.close()


def get_project_access_requests():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT accessTime, accessGranted, ipAddress, name, notes FROM projectRequests
    JOIN projects on projects.projectID = projectRequests.projectID
    JOIN sessions on sessions.sessionID = projectRequests.sessionID
    """)
    requests = cursor.fetchall()
    conn.commit()
    cursor.close()
    conn.close()
    return requests


def create_page_access_request(session_id, page_id, allowed, notes):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO pagerequests (sessionID, pageID, accessGranted, notes)
        VALUES (%s, %s, %s, %s);
    """, (session_id, page_id, allowed, notes,))
    conn.commit()
    cursor.close()
    conn.close()


def get_page_access_requests():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT accessTime, accessGranted, ipAddress, name, notes FROM pageRequests
    JOIN pages on page.PageID = page.PageID
    JOIN sessions on sessions.sessionID = pageRequests.sessionID
    """)
    requests = cursor.fetchall()
    conn.commit()
    cursor.close()
    conn.close()
    return requests


def get_page_last_review(page_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT max(accessTime) FROM pageRequests
    where pageRequests.PageID = %s AND accessGranted = TRUE AND notes = 'REVIEW' 
    """, (page_id,))
    last_review = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()
    if last_review is not None:
        last_review = last_review.timestamp()
    return last_review


def get_project_history(project_id, start_time, end_time):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    -- Projects
    SELECT name, notes, 'project', accessTime FROM projectRequests
    inner join projects on
    projects.projectID = projectRequests.projectID 
    where projectRequests.ProjectID = %s AND accessGranted = TRUE 
    AND accessTime BETWEEN %s AND %s
    --Pages
    UNION
    SELECT name, notes, 'page', accessTime FROM pageRequests
    inner join pages on
    pages.pageID = pageRequests.pageID
    where pages.ProjectID = %s AND accessGranted = TRUE
    AND accessTime BETWEEN %s AND %s
    --CodeSnippets
    UNION
    SELECT codesnippets.name, notes, 'code', accessTime FROM codesnippetsrequests
    inner join codesnippets on
    codesnippets.CodeID = codesnippetsrequests.CodeID
    inner join pages on
    pages.pageID = codesnippets.pageID
    where pages.ProjectID = %s AND accessGranted = TRUE
    AND accessTime BETWEEN %s AND %s
    --Translations
    UNION
    SELECT translations.language, notes, 'translation', accessTime FROM translationrequests
    inner join translations on
    translations.TranslationID = translationrequests.TranslationID
    inner join pages on
    pages.pageID = translations.pageID
    where pages.ProjectID = %s AND accessGranted = TRUE
    AND accessTime BETWEEN %s AND %s
    --Equations
    UNION
    SELECT equations.name, notes, 'equation', accessTime FROM equationsrequests
    inner join equations on
    equations.EquationID = equationsrequests.EquationID
    inner join pages on
    pages.pageID = equations.pageID
    where pages.ProjectID = %s AND accessGranted = TRUE
    AND accessTime BETWEEN %s AND %s
    --Recipes
    UNION
    SELECT recipes.name, notes, 'recipe', accessTime FROM reciperequests
    inner join recipes on
    recipes.recipeID = reciperequests.recipeID
    inner join pages on
    pages.pageID = recipes.pageID
    where pages.ProjectID = %s AND accessGranted = TRUE
    AND accessTime BETWEEN %s AND %s
    --Canvas
    UNION
    SELECT canvas.name, notes, 'canvas', accessTime FROM canvasrequests
    inner join canvas on
    canvas.CanvasID = canvasrequests.CanvasID
    inner join pages on
    pages.pageID = canvas.pageID
    where pages.ProjectID = %s AND accessGranted = TRUE
    AND accessTime BETWEEN %s AND %s
    --Files
    UNION
    SELECT files.name, 'UPLOAD', 'file', files.timeCreated FROM files
    inner join pages on
    pages.pageID = files.pageID
    where pages.ProjectID = %s
    AND files.timeCreated BETWEEN %s AND %s
    """, (project_id, start_time, end_time, project_id, start_time, end_time, project_id, start_time, end_time,
          project_id, start_time, end_time, project_id, start_time, end_time, project_id, start_time, end_time,
          project_id, start_time, end_time, project_id, start_time, end_time,))
    logs = cursor.fetchall()
    cursor.close()
    conn.close()
    if logs is not None:
        logs = [l for l in logs if l[1] != 'GET']
        log_list = []
        for log in logs:
            log = {k: v for k, v in zip(['name', 'event', 'type', 'time'], log)}
            log['time'] = log['time'].timestamp()
            log_list.append(log)
        return log_list
    return None


def get_user_history(user_id, start_time, end_time):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    -- Projects
    SELECT name, notes, 'project', accessTime FROM projectRequests
    inner join projects on
    projects.projectID = projectRequests.projectID 
    where projects.UserID = %s AND accessGranted = TRUE 
    AND accessTime BETWEEN %s AND %s
    AND notes != 'GET'
    --Pages
    UNION
    SELECT pages.name, notes, 'page', accessTime FROM pageRequests
    inner join pages on
    pages.pageID = pageRequests.pageID
    inner join projects on
    projects.projectID = pages.projectID 
    where projects.UserID = %s AND accessGranted = TRUE
    AND accessTime BETWEEN %s AND %s
    AND notes != 'GET'
    --CodeSnippets
    UNION
    SELECT codesnippets.name, notes, 'code', accessTime FROM codesnippetsrequests
    inner join codesnippets on
    codesnippets.CodeID = codesnippetsrequests.CodeID
    inner join pages on
    pages.pageID = codesnippets.pageID
    inner join projects on
    projects.projectID = pages.projectID
    where projects.UserID = %s AND accessGranted = TRUE
    AND accessTime BETWEEN %s AND %s
    AND notes != 'GET'
    --Translations
    UNION
    SELECT translations.language, notes, 'translation', accessTime FROM translationrequests
    inner join translations on
    translations.TranslationID = translationrequests.TranslationID
    inner join pages on
    pages.pageID = translations.pageID
    inner join projects on
    projects.projectID = pages.projectID
    where projects.UserID = %s AND accessGranted = TRUE
    AND accessTime BETWEEN %s AND %s
    AND notes != 'GET'
    --Equations
    UNION
    SELECT equations.name, notes, 'equation', accessTime FROM equationsrequests
    inner join equations on
    equations.EquationID = equationsrequests.EquationID
    inner join pages on
    pages.pageID = equations.pageID
    inner join projects on
    projects.projectID = pages.projectID
    where projects.UserID = %s AND accessGranted = TRUE
    AND accessTime BETWEEN %s AND %s
    AND notes != 'GET'
    --Recipes
    UNION
    SELECT recipes.name, notes, 'recipe', accessTime FROM reciperequests
    inner join recipes on
    recipes.recipeID = reciperequests.recipeID
    inner join pages on
    pages.pageID = recipes.pageID
    inner join projects on
    projects.projectID = pages.projectID
    where projects.UserID = %s AND accessGranted = TRUE
    AND accessTime BETWEEN %s AND %s
    AND notes != 'GET'
    --Canvas
    UNION
    SELECT canvas.name, notes, 'canvas', accessTime FROM canvasrequests
    inner join canvas on
    canvas.CanvasID = canvasrequests.CanvasID
    inner join pages on
    pages.pageID = canvas.pageID
    inner join projects on
    projects.projectID = pages.projectID
    where projects.UserID = %s AND accessGranted = TRUE
    AND accessTime BETWEEN %s AND %s
    AND notes != 'GET'
    --Files
    UNION
    SELECT files.name, 'UPLOAD', 'file', files.timeCreated FROM files
    inner join pages on
    pages.pageID = files.pageID
    inner join projects on
    projects.projectID = pages.projectID
    where projects.UserID = %s
    AND files.timeCreated BETWEEN %s AND %s
    """, (user_id, start_time, end_time, user_id, start_time, end_time, user_id, start_time, end_time, user_id,
          start_time, end_time, user_id, start_time, end_time, user_id, start_time, end_time, user_id, start_time,
          end_time, user_id, start_time, end_time,))
    logs = cursor.fetchall()
    cursor.close()
    conn.close()
    if logs is not None:
        logs = [l for l in logs if l[1] != 'GET']
        log_list = []
        for log in logs:
            log = {k: v for k, v in zip(['name', 'event', 'type', 'time'], log)}
            log['time'] = log['time'].timestamp()
            log_list.append(log)
        return log_list
    return None


@logging_bp.route('/get_project_history', methods=['GET'])
def get_history_by_project_ep():
    project_id = int(request.args.get("id"))
    start_time = float(request.args.get("start"))
    end_time = float(request.args.get("end"))

    start_time = datetime.fromtimestamp(start_time)
    end_time = datetime.fromtimestamp(end_time)

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    if not authorized_project_access(token, project_id):
        return make_response({'status': 'error', 'message': "Not Authorized To Access Page"}, STATUS.FORBIDDEN)

    logs = get_project_history(project_id, start_time, end_time)

    if logs is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.OK)

    response = make_response({'status': 'success', 'message': logs}, STATUS.OK)
    return response


@logging_bp.route('/get_user_history', methods=['GET'])
def get_history_by_user_ep():
    start_time = float(request.args.get("start"))
    end_time = float(request.args.get("end"))

    start_time = datetime.fromtimestamp(start_time)
    end_time = datetime.fromtimestamp(end_time)
    # print(f"Start: {start_time}")
    # print(f"End: {end_time}")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    logs = get_user_history(session['UserID'], start_time, end_time)
    if logs is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.OK)

    response = make_response({'status': 'success', 'message': logs}, STATUS.OK)
    return response


@logging_bp.route('/get_page_last_review', methods=['GET'])
def get_last_page_review_ep():
    page_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    # if not authorized_page_access(token, page_id):
    #     return make_response({'status': 'error', 'message': "Not Authorized To Access Page"}, STATUS.FORBIDDEN)

    last_review = get_page_last_review(page_id)

    if last_review is None:
        return make_response({'status': 'error', 'message': 0}, STATUS.OK)

    response = make_response({'status': 'success', 'message': last_review}, STATUS.OK)
    return response
