from flask import Blueprint, request, jsonify, render_template
from flask_login import login_required, current_user
from flask_socketio import emit
from models import db, Task
from extensions import socketio

tasks_bp = Blueprint("tasks", __name__)


@tasks_bp.route("/")
@tasks_bp.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html", user=current_user)


# ── GET all tasks ──────────────────────────────────────────────────────────────
@tasks_bp.route("/api/tasks", methods=["GET"])
@login_required
def get_tasks():
    status   = request.args.get("status")
    priority = request.args.get("priority")

    query = Task.query.filter_by(user_id=current_user.id)
    if status:
        query = query.filter_by(status=status)
    if priority:
        query = query.filter_by(priority=priority)

    tasks = query.order_by(Task.created_at.desc()).all()
    return jsonify({"success": True, "tasks": [t.to_dict() for t in tasks]}), 200


# ── ADD task ───────────────────────────────────────────────────────────────────
@tasks_bp.route("/api/tasks", methods=["POST"])
@login_required
def add_task():
    data = request.get_json()
    if not data or not data.get("title", "").strip():
        return jsonify({"success": False, "message": "Title is required."}), 400

    priority = data.get("priority", "medium")
    if priority not in ("low", "medium", "high"):
        return jsonify({"success": False, "message": "Priority must be low, medium, or high."}), 400

    task = Task(
        title=data["title"].strip(),
        description=data.get("description", "").strip(),
        priority=priority,
        status="pending",
        user_id=current_user.id,
    )
    db.session.add(task)
    db.session.commit()

    # Broadcast via WebSocket
    socketio.emit("task_added", {"task": task.to_dict()}, room=f"user_{current_user.id}")

    return jsonify({"success": True, "message": "Task created.", "task": task.to_dict()}), 201


# ── UPDATE task ────────────────────────────────────────────────────────────────
@tasks_bp.route("/api/tasks/<int:task_id>", methods=["PUT"])
@login_required
def update_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({"success": False, "message": "Task not found."}), 404

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data provided."}), 400

    if "title" in data and data["title"].strip():
        task.title = data["title"].strip()
    if "description" in data:
        task.description = data["description"].strip()
    if "priority" in data:
        if data["priority"] not in ("low", "medium", "high"):
            return jsonify({"success": False, "message": "Priority must be low, medium, or high."}), 400
        task.priority = data["priority"]
    if "status" in data:
        if data["status"] not in ("pending", "in_progress", "completed"):
            return jsonify({"success": False, "message": "Invalid status."}), 400
        task.status = data["status"]

    db.session.commit()

    socketio.emit("task_updated", {"task": task.to_dict()}, room=f"user_{current_user.id}")

    return jsonify({"success": True, "message": "Task updated.", "task": task.to_dict()}), 200


# ── DELETE task ────────────────────────────────────────────────────────────────
@tasks_bp.route("/api/tasks/<int:task_id>", methods=["DELETE"])
@login_required
def delete_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({"success": False, "message": "Task not found."}), 404

    db.session.delete(task)
    db.session.commit()

    socketio.emit("task_deleted", {"task_id": task_id}, room=f"user_{current_user.id}")

    return jsonify({"success": True, "message": "Task deleted."}), 200
