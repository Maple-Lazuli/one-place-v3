from flask import Blueprint, jsonify, request, make_response
from http import HTTPStatus as STATUS
from datetime import datetime

recipe_bp = Blueprint('recipes', __name__, url_prefix='/recipes')
from .db import get_db_connection
from .sessions import verify_session_for_access
from .pages import authorized_page_access
from .projects import authorized_project_access

recipe_fields = ['RecipeID', 'PageID', 'name', 'description', 'content', 'timeCreated', 'lastEditTime']


def log_access(recipe_id, allowed, notes):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO reciperequests (RecipeID, accessGranted, notes)
        VALUES (%s, %s, %s);
    """, (recipe_id, allowed, notes))
    conn.commit()
    cursor.close()
    conn.close()


def convert_time(object):
    object['timeCreated'] = object['timeCreated'].timestamp()
    object['lastEditTime'] = object['lastEditTime'].timestamp()
    return object


def get_last_update(recipe_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT lastEditTime FROM recipes where RecipeID = %s;", (recipe_id,))
    last_update = cursor.fetchone()
    cursor.close()
    conn.close()
    if last_update is not None:
        return last_update[0].timestamp()
    return None


def delete_recipe(recipe_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM recipes where RecipeID = %s;", (recipe_id,))
    conn.commit()
    cursor.close()
    conn.close()


def update_recipe(recipe_id, name, description, content):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE recipes SET name = %s, description = %s, content = %s, lastEditTime = %s
        WHERE RecipeID = %s
        RETURNING *;
    """, (name, description, content, datetime.now(), recipe_id,))
    recipe = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if recipe is not None:
        recipe = {k: v for k, v in zip(recipe_fields, recipe)}
        recipe = convert_time(recipe)
    return recipe


def get_recipe_by_id(recipe_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM recipes where RecipeID = %s;", (recipe_id,))
    recipe = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if recipe is not None:
        recipe = {k: v for k, v in zip(recipe_fields, recipe)}
        recipe = convert_time(recipe)
    return recipe


def get_recipes_by_page(page_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM recipes where PageID = %s;", (page_id,))
    recipes = cursor.fetchall()
    conn.commit()
    cursor.close()
    conn.close()
    if recipes is not None:
        recipe_list = []
        for recipe in recipes:
            recipe = {k: v for k, v in zip(recipe_fields, recipe)}
            recipe = convert_time(recipe)
            recipe_list.append(recipe)
        return recipe_list
    return None


def get_recipes_by_project(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT recipes.* FROM recipes 
    inner join pages on pages.pageID = recipes.pageID
    where pages.projectID = %s;
    """, (project_id,))
    recipes = cursor.fetchall()
    conn.commit()
    cursor.close()
    conn.close()
    if recipes is not None:
        recipe_list = []
        for recipe in recipes:
            recipe = {k: v for k, v in zip(recipe_fields, recipe)}
            recipe = convert_time(recipe)
            recipe_list.append(recipe)
        return recipe_list
    return None


def create_recipe(page_id, name, description, content):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO recipes (PageID, name, description, content, lastEditTime)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING *;
    """, (page_id, name, description, content, datetime.now()))
    new_recipe = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if new_recipe is not None:
        new_recipe = {k: v for k, v in zip(recipe_fields, new_recipe)}
        new_recipe = convert_time(new_recipe)
    return new_recipe


@recipe_bp.route('/test', methods=['GET'])
def test_ep():
    return jsonify({"test": "Recipes  Endpoint Reached."})


@recipe_bp.route('/create', methods=['POST'])
def create_ep():
    data = request.get_json()
    page_id = data.get("page_id")
    name = data.get("name")
    description = data.get("description")
    content = data.get("content")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    if not authorized_page_access(token, page_id):
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    new_recipe = create_recipe(page_id, name, description, content)

    if new_recipe is None:
        return make_response({'status': 'error', 'message': "Failed To Create Recipe"}, STATUS.INTERNAL_SERVER_ERROR)

    log_access(new_recipe['RecipeID'], True, "CREATE")
    response = make_response({'status': 'success', 'message': f'Created {name}', 'id':new_recipe['RecipeID']}, STATUS.OK)
    return response


@recipe_bp.route('/get', methods=['GET'])
def get_ep():
    recipe_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        log_access(recipe_id, valid, "GET")
        return make_response("Invalid Session", STATUS.FORBIDDEN)

    recipe = get_recipe_by_id(recipe_id)

    if not authorized_page_access(token, recipe['PageID']):
        log_access(recipe_id, False, "GET")
        return make_response("Not Authorized To Access Recipe", STATUS.FORBIDDEN)

    if recipe is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.OK)

    log_access(recipe_id, valid, "GET")
    response = make_response({'status': 'success', 'message': recipe}, STATUS.OK)
    return response


@recipe_bp.route('/get_all_by_page', methods=['GET'])
def get_all_by_page_ep():
    page_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response("Invalid Session", STATUS.FORBIDDEN)

    recipes = get_recipes_by_page(page_id)

    if not authorized_page_access(token, page_id):
        return make_response("Not Authorized To Access Recipe", STATUS.FORBIDDEN)

    if recipes is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.OK)

    response = make_response({'status': 'success', 'message': recipes}, STATUS.OK)
    return response


@recipe_bp.route('/get_all_by_project', methods=['GET'])
def get_all_by_project_ep():
    project_id = int(request.args.get("id"))

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    if not authorized_project_access(token, project_id):
        return make_response({'status': 'error', 'message': "Cannot Access Project"}, STATUS.FORBIDDEN)

    recipes = get_recipes_by_project(project_id)

    if recipes is None:
        return make_response({'status': 'error', 'message': "Does Not Exist"}, STATUS.OK)

    response = make_response({'status': 'success', 'message': recipes}, STATUS.OK)
    return response


@recipe_bp.route('/update', methods=['PATCH'])
def update_ep():
    data = request.get_json()
    recipe_id = data.get("recipe_id")
    name = data.get("new_name")
    description = data.get("new_description")
    content = data.get("new_content")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        log_access(recipe_id, valid, "UPDATE")
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    recipe = get_recipe_by_id(recipe_id)

    if not authorized_page_access(token, recipe['PageID']):
        log_access(recipe_id, False, "UPDATE")
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    updated_recipe = update_recipe(recipe_id, name, description, content)

    if updated_recipe is None:
        return make_response({'status': 'error', 'message': "Failed To Update Recipe"}, STATUS.INTERNAL_SERVER_ERROR)

    log_access(recipe_id, valid, "UPDATE")
    response = make_response({'status': 'success', 'message': f'Updated {name}'}, STATUS.OK)
    return response


@recipe_bp.route('/delete', methods=['DELETE'])
def delete_ep():
    data = request.get_json()
    recipe_id = data.get("recipe_id")

    token = request.cookies.get("token")

    valid, session = verify_session_for_access(token)

    if not valid:
        log_access(recipe_id, valid, "DELETE")
        return make_response({'status': 'error', 'message': "Session is Invalid"}, STATUS.FORBIDDEN)

    recipe = get_recipe_by_id(recipe_id)

    if not authorized_page_access(token, recipe['PageID']):
        log_access(recipe_id, False, "DELETE")
        return make_response({'status': 'error', 'message': "Not Authorized To Access Project"}, STATUS.FORBIDDEN)

    log_access(recipe_id, valid, "DELETE")
    delete_recipe(recipe_id)

    response = make_response({'status': 'success', 'message': f'Deleted {recipe["name"]}'}, STATUS.OK)
    return response


@recipe_bp.route('/last_update', methods=['GET'])
def last_update():
    recipe_id = int(request.args.get("id"))
    time = get_last_update(recipe_id)
    if time is None:
        return make_response({"recipe_id": recipe_id, "last_update": "Null"}, STATUS.OK)
    return make_response({"recipe_id": recipe_id, "last_update": time}, STATUS.OK)
