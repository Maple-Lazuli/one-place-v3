from flask import Flask, request, jsonify, Blueprint
import psycopg2
import os

demo_bp = Blueprint('demo', __name__)


def get_db():
    return psycopg2.connect(
        dbname="mydatabase",
        user="myuser",
        password="mypassword",
        host="db"  # Docker service name!
    )


@demo_bp.route("/todos", methods=["GET"])
def get_todos():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, task, completed FROM todos ORDER BY id DESC")
    todos = [{"id": row[0], "task": row[1], "completed": row[2]} for row in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify(todos)


@demo_bp.route("/todos", methods=["POST"])
def add_todo():
    data = request.get_json()
    task = data.get("task", "")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO todos (task) VALUES (%s) RETURNING id", (task,))
    conn.commit()
    new_id = cur.fetchone()[0]
    cur.close()
    conn.close()
    return jsonify({"id": new_id, "task": task, "completed": False}), 201
