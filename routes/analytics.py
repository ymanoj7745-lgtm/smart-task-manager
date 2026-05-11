from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from models import Task
import pandas as pd
import numpy as np

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/api/analytics", methods=["GET"])
@login_required
def get_analytics():
    tasks = Task.query.filter_by(user_id=current_user.id).all()

    if not tasks:
        return jsonify({
            "success": True,
            "analytics": {
                "total_tasks": 0,
                "completed_tasks": 0,
                "pending_tasks": 0,
                "in_progress_tasks": 0,
                "completion_percentage": 0.0,
                "priority_breakdown": {"low": 0, "medium": 0, "high": 0},
                "avg_tasks_per_day": 0.0,
                "status_distribution": [],
            }
        })

    # ── Build DataFrame ────────────────────────────────────────────────────────
    df = pd.DataFrame([t.to_dict() for t in tasks])
    df["created_at"] = pd.to_datetime(df["created_at"])

    # ── Core counts (NumPy) ────────────────────────────────────────────────────
    total       = len(df)
    status_arr  = df["status"].values                          # NumPy array
    completed   = int(np.sum(status_arr == "completed"))
    in_progress = int(np.sum(status_arr == "in_progress"))
    pending     = int(np.sum(status_arr == "pending"))

    completion_pct = round(float(np.round((completed / total) * 100, 2)), 2) if total else 0.0

    # ── Priority breakdown (Pandas value_counts) ──────────────────────────────
    priority_counts = df["priority"].value_counts().to_dict()
    priority_breakdown = {
        "low":    priority_counts.get("low", 0),
        "medium": priority_counts.get("medium", 0),
        "high":   priority_counts.get("high", 0),
    }

    # ── Tasks per day average ──────────────────────────────────────────────────
    tasks_per_day = df.groupby(df["created_at"].dt.date).size()
    avg_per_day   = round(float(np.mean(tasks_per_day.values)), 2) if len(tasks_per_day) else 0.0

    # ── Status distribution for chart ─────────────────────────────────────────
    status_dist = df["status"].value_counts().reset_index()
    status_dist.columns = ["status", "count"]
    status_distribution = status_dist.to_dict(orient="records")

    return jsonify({
        "success": True,
        "analytics": {
            "total_tasks":          total,
            "completed_tasks":      completed,
            "pending_tasks":        pending,
            "in_progress_tasks":    in_progress,
            "completion_percentage": completion_pct,
            "priority_breakdown":   priority_breakdown,
            "avg_tasks_per_day":    avg_per_day,
            "status_distribution":  status_distribution,
        }
    }), 200
