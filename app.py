import eventlet
eventlet.monkey_patch()

from flask import Flask
from flask_login import LoginManager, current_user
from flask_socketio import join_room, leave_room

from config import Config
from models import db, bcrypt, User
from extensions import socketio
from routes.auth import auth_bp
from routes.tasks import tasks_bp
from routes.analytics import analytics_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # ── Init extensions ────────────────────────────────────────────────────────
    db.init_app(app)
    bcrypt.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*", async_mode="eventlet")

    # ── Flask-Login ────────────────────────────────────────────────────────────
    login_manager = LoginManager(app)
    login_manager.login_view = "auth.login"
    login_manager.login_message_category = "info"

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # ── Register blueprints ────────────────────────────────────────────────────
    app.register_blueprint(auth_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(analytics_bp)

    # ── Create tables ──────────────────────────────────────────────────────────
    with app.app_context():
        db.create_all()

    return app


app = create_app()


# ── WebSocket Events ───────────────────────────────────────────────────────────
@socketio.on("connect")
def on_connect():
    if current_user.is_authenticated:
        join_room(f"user_{current_user.id}")
        socketio.emit("connected", {"message": "Real-time connection established."})


@socketio.on("disconnect")
def on_disconnect():
    if current_user.is_authenticated:
        leave_room(f"user_{current_user.id}")


@socketio.on("join")
def on_join(data):
    if current_user.is_authenticated:
        join_room(f"user_{current_user.id}")


if __name__ == "__main__":
    socketio.run(app, debug=True, host="0.0.0.0", port=5000)
