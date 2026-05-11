# ✅ TaskFlow — Smart Task Management System

A full-stack web application built with **Flask**, **PostgreSQL**, **WebSockets**, **Pandas & NumPy**, and a clean HTML/CSS frontend.

---

## 🧱 Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Backend     | Python 3.10+, Flask                 |
| Database    | PostgreSQL + SQLAlchemy ORM         |
| Real-time   | Flask-SocketIO (WebSockets)         |
| Analytics   | Pandas, NumPy                       |
| Auth        | Flask-Login, Flask-Bcrypt           |
| Frontend    | HTML5, CSS3, Vanilla JS             |

---

## 📁 Project Structure

```
smart_task_manager/
├── app.py                  # App entry point + WebSocket events
├── config.py               # Configuration (reads .env)
├── models.py               # SQLAlchemy models (User, Task)
├── extensions.py           # SocketIO instance (avoids circular imports)
├── schema.sql              # Raw PostgreSQL schema
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
├── routes/
│   ├── auth.py             # Register / Login / Logout
│   ├── tasks.py            # CRUD REST APIs + dashboard view
│   └── analytics.py        # Pandas & NumPy analytics endpoint
├── templates/
│   ├── base.html           # Base layout
│   ├── login.html
│   ├── register.html
│   └── dashboard.html      # Main UI
└── static/
    ├── css/style.css
    └── js/main.js          # WebSocket client + API calls
```

---

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/your-username/smart-task-manager.git
cd smart-task-manager
```

### 2. Create and activate a virtual environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Set up PostgreSQL

Make sure PostgreSQL is installed and running, then:

```bash
psql -U postgres
```

Inside psql:
```sql
CREATE DATABASE task_manager;
\q
```

(Optional) Run the schema manually:
```bash
psql -U postgres -d task_manager -f schema.sql
```

### 5. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env`:
```
SECRET_KEY=your-very-secret-key
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/task_manager
```

### 6. Run the application
```bash
python app.py
```

Visit **http://localhost:5000** in your browser.

> Flask-SocketIO will automatically create all database tables on first run.

---

## 🌐 REST API Reference

All API endpoints require login (session cookie).

| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| GET    | `/api/tasks`          | Get all tasks        |
| GET    | `/api/tasks?status=pending&priority=high` | Filter tasks |
| POST   | `/api/tasks`          | Create a new task    |
| PUT    | `/api/tasks/<id>`     | Update a task        |
| DELETE | `/api/tasks/<id>`     | Delete a task        |
| GET    | `/api/analytics`      | Get analytics data   |
| POST   | `/register`           | Register user        |
| POST   | `/login`              | Login user           |
| GET    | `/logout`             | Logout user          |

### Example — Create Task (POST /api/tasks)
```json
{
  "title": "Build REST API",
  "description": "Implement all CRUD endpoints",
  "priority": "high"
}
```

### Example — Update Task (PUT /api/tasks/1)
```json
{
  "status": "completed",
  "priority": "low"
}
```

---

## 📊 Analytics

The `/api/analytics` endpoint uses **Pandas** and **NumPy** to return:

- Total, completed, pending, in-progress task counts
- Completion percentage
- Priority breakdown (high / medium / low)
- Average tasks created per day

---

## ⚡ WebSocket Events

| Event (server → client) | Payload              | Trigger               |
|-------------------------|----------------------|-----------------------|
| `task_added`            | `{ task }`           | New task created      |
| `task_updated`          | `{ task }`           | Task edited           |
| `task_deleted`          | `{ task_id }`        | Task deleted          |
| `connected`             | `{ message }`        | Client connects       |

Each user gets their own private WebSocket room (`user_<id>`), so updates are isolated per account.

---

## ✅ Features Checklist

- [x] User Registration, Login, Logout
- [x] Add / Edit / Delete / Get All Tasks
- [x] Task fields: Title, Description, Priority, Status, Created Date
- [x] PostgreSQL database with proper schema & indexes
- [x] Analytics using Pandas & NumPy
- [x] WebSocket real-time task updates
- [x] Clean, responsive HTML/CSS frontend
- [x] Filter tasks by status and priority
- [x] Flash messages and toast notifications
