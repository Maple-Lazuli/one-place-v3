from flask import Blueprint, jsonify, request, make_response
from http import HTTPStatus as STATUS
from datetime import datetime

equation_bp = Blueprint('equations', __name__, url_prefix='/equations')
from .db import get_db_connection
from .sessions import verify_session_for_access
from .pages import authorized_page_access

equations_fields = ['EquationID', 'PageID', 'name', 'description', 'content', 'timeCreated', 'lastEditTime']


def log_access(equation_id, allowed, notes):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO equationsrequests (EquationID, accessGranted, notes)
        VALUES (%s, %s, %s);
    """, (equation_id, allowed, notes))
    conn.commit()
    cursor.close()
    conn.close()


def get_last_update(equation_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT lastEditTime FROM equations where EquationID = %s;", (equation_id,))
    last_update = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return last_update


def delete_equation(equation_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM equations where EquationID = %s;", (equation_id,))
    conn.commit()
    cursor.close()
    conn.close()


def update_equation(equation_id, name, description, content):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE equations SET name = %s, description = %s, content = %s, lastEditTime = %s
        WHERE EquationID = %s
        RETURNING *;
    """, (name, description, content, datetime.now(), equation_id,))
    equation = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if equation is not None:
        equation = {k: v for k, v in zip(equations_fields, equation)}
    return equation


def get_equation_by_id(equation_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM equations where EquationID = %s;", (equation_id,))
    equation = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if equation is not None:
        equation = {k: v for k, v in zip(equations_fields, equation)}
    return equation


def get_equations_by_page(page_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM equations where PageID = %s;", (page_id,))
    equations = cursor.fetchall()
    conn.commit()
    cursor.close()
    conn.close()
    if equations is not None:
        equations_list = []
        for equation in equations:
            equation = {k: v for k, v in zip(equations_fields, equation)}
            equations_list.append(equation)
        return equations_list
    return None


def create_equation(page_id, name, description, content):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO equations (PageID, name, description, content, lastEditTime)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING *;
    """, (page_id, name, description, content, datetime.now()))
    new_equation = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if new_equation is not None:
        new_equation = {k: v for k, v in zip(equations_fields, new_equation)}
    return new_equation


@equation_bp.route('/test', methods=['GET'])
def test_ep():
    return jsonify({"test": "Equations  Endpoint Reached."})


@equation_bp.route('/create', methods=['POST'])
def create_ep():
    data = request.get_json()
    page_id = data.get("page_id")
    name = data.get("name")
    description = data.get("description")
    content = data.get("content")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Session is Invalid", STATUS.FORBIDDEN)

    if not authorized_page_access(token, page_id):
        return make_response("Not Authorized To Access Project", STATUS.FORBIDDEN)

    new_equation = create_equation(page_id, name, description, content)

    if new_equation is None:
        return make_response("Failed To Create Equation", STATUS.INTERNAL_SERVER_ERROR)

    log_access(new_equation['EquationID'], True, "CREATE")
    response = make_response(f"Created: {name}", STATUS.OK)
    return response


@equation_bp.route('/get', methods=['GET'])
def get_ep():
    equation_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        log_access(equation_id, valid, "GET")
        return make_response("Invalid Session", STATUS.FORBIDDEN)

    equations = get_equation_by_id(equation_id)

    if not authorized_page_access(token, equations['PageID']):
        log_access(equation_id, False, "GET")
        return make_response("Not Authorized To Access Equation", STATUS.FORBIDDEN)

    if equations is None:
        response = make_response("Does Not Exist", STATUS.OK)
        return response

    log_access(equation_id, valid, "GET")
    response = make_response(equations, STATUS.OK)
    return response


@equation_bp.route('/get_all_by_page', methods=['GET'])
def get_all_by_page_ep():
    page_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Invalid Session", STATUS.FORBIDDEN)

    equation = get_equations_by_page(page_id)

    if not authorized_page_access(token, page_id):
        return make_response("Not Authorized To Access Equation", STATUS.FORBIDDEN)

    if equation is None:
        response = make_response("Does Not Exist", STATUS.OK)
        return response

    response = make_response(equation, STATUS.OK)
    return response


@equation_bp.route('/update', methods=['PATCH'])
def update_ep():
    data = request.get_json()
    equation_id = data.get("equation_id")
    name = data.get("new_name")
    description = data.get("new_description")
    content = data.get("new_content")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        log_access(equation_id, valid, "UPDATE")
        return make_response("Session is Invalid", STATUS.FORBIDDEN)

    equation = get_equation_by_id(equation_id)

    if not authorized_page_access(token, equation['PageID']):
        log_access(equation_id, False, "UPDATE")
        return make_response("Not Authorized To Access Project", STATUS.FORBIDDEN)

    updated_equation = update_equation(equation_id, name, description, content)

    if updated_equation is None:
        return make_response("Failed To Update Equation", STATUS.INTERNAL_SERVER_ERROR)

    log_access(equation_id, valid, "UPDATE")
    response = make_response(f"Updated: {name}", STATUS.OK)
    return response


@equation_bp.route('/delete', methods=['DELETE'])
def delete_ep():
    data = request.get_json()
    equation_id = data.get("equation_id")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        log_access(equation_id, valid, "DELETE")
        return make_response("Session is Invalid", STATUS.FORBIDDEN)

    equation = get_equation_by_id(equation_id)

    if not authorized_page_access(token, equation['PageID']):
        log_access(equation_id, False, "DELETE")
        return make_response("Not Authorized To Access Project", STATUS.FORBIDDEN)

    log_access(equation_id, valid, "DELETE")
    delete_equation(equation_id)

    response = make_response(f"Deleted: {equation}", STATUS.OK)
    return response


@equation_bp.route('/last_update', methods=['GET'])
def last_update():
    equation_id = int(request.args.get("id"))
    time = get_last_update(equation_id)
    if time is None:
        return make_response({"equation_id": equation_id, "last_update": None}, STATUS.NO_CONTENT)
    return make_response({"equation_id": equation_id, "last_update": time}, STATUS.OK)
