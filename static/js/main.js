/* ══════════════════════════════════════════════════════
   TaskFlow — main.js
   Handles: API calls, WebSocket, UI rendering
   ══════════════════════════════════════════════════════ */

// ── WebSocket setup ────────────────────────────────────────────────────────
const socket = io({ transports: ["websocket", "polling"] });

socket.on("connect", () => {
  socket.emit("join");
  document.getElementById("liveBadge").classList.add("visible");
});

socket.on("disconnect", () => {
  document.getElementById("liveBadge").classList.remove("visible");
});

// Real-time task events from server
socket.on("task_added",   (data) => { addTaskToGrid(data.task);           showToast("✅ New task added");          });
socket.on("task_updated", (data) => { replaceTaskInGrid(data.task);       showToast("✏️ Task updated");            });
socket.on("task_deleted", (data) => { removeTaskFromGrid(data.task_id);   showToast("🗑️ Task removed");            });


// ── Section navigation ─────────────────────────────────────────────────────
function showSection(name) {
  document.getElementById("section-tasks").style.display     = name === "tasks"     ? "block" : "none";
  document.getElementById("section-analytics").style.display = name === "analytics" ? "block" : "none";

  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
  event.target.classList.add("active");

  if (name === "analytics") loadAnalytics();
}


// ── API helper ─────────────────────────────────────────────────────────────
async function api(method, url, body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(url, opts);
  return res.json();
}


// ══════════════════════════════════════════════════════
//  TASKS
// ══════════════════════════════════════════════════════

async function loadTasks() {
  const status   = document.getElementById("filterStatus").value;
  const priority = document.getElementById("filterPriority").value;

  let url = "/api/tasks?";
  if (status)   url += `status=${status}&`;
  if (priority) url += `priority=${priority}`;

  const data = await api("GET", url);
  const grid = document.getElementById("taskGrid");

  if (!data.success) { grid.innerHTML = `<div class="empty-state">Failed to load tasks.</div>`; return; }

  if (data.tasks.length === 0) {
    grid.innerHTML = `<div class="empty-state">No tasks yet — click <strong>+ Add Task</strong> to get started!</div>`;
    return;
  }

  grid.innerHTML = data.tasks.map(taskCard).join("");
}


function taskCard(task) {
  const date = new Date(task.created_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
  return `
  <div class="task-card" id="task-${task.id}">
    <div class="task-card__header">
      <span class="task-card__title">${escHtml(task.title)}</span>
      <span class="badge badge--${task.priority}">${task.priority.toUpperCase()}</span>
    </div>
    ${task.description ? `<p class="task-card__desc">${escHtml(task.description)}</p>` : ""}
    <div class="task-card__meta">
      <span class="badge badge--${task.status}">${task.status.replace("_", " ")}</span>
    </div>
    <p class="task-date">📅 ${date}</p>
    <div class="task-card__actions">
      <button class="btn btn--ghost btn--sm" onclick="openEditModal(${JSON.stringify(task).replace(/"/g, '&quot;')})">✏️ Edit</button>
      <button class="btn btn--danger btn--sm" onclick="deleteTask(${task.id})">🗑️ Delete</button>
    </div>
  </div>`;
}

function addTaskToGrid(task) {
  const grid = document.getElementById("taskGrid");
  const empty = grid.querySelector(".empty-state");
  if (empty) empty.remove();
  grid.insertAdjacentHTML("afterbegin", taskCard(task));
}

function replaceTaskInGrid(task) {
  const el = document.getElementById(`task-${task.id}`);
  if (el) el.outerHTML = taskCard(task);
}

function removeTaskFromGrid(taskId) {
  const el = document.getElementById(`task-${taskId}`);
  if (el) el.remove();
  if (document.getElementById("taskGrid").children.length === 0) {
    document.getElementById("taskGrid").innerHTML =
      `<div class="empty-state">No tasks yet — click <strong>+ Add Task</strong> to get started!</div>`;
  }
}


// ── Add / Edit Modal ───────────────────────────────────────────────────────
function openModal() {
  document.getElementById("modalTitle").textContent = "Add New Task";
  document.getElementById("editTaskId").value = "";
  document.getElementById("taskTitle").value  = "";
  document.getElementById("taskDesc").value   = "";
  document.getElementById("taskPriority").value = "medium";
  document.getElementById("statusGroup").style.display = "none";
  document.getElementById("modalOverlay").classList.add("open");
}

function openEditModal(task) {
  document.getElementById("modalTitle").textContent  = "Edit Task";
  document.getElementById("editTaskId").value        = task.id;
  document.getElementById("taskTitle").value         = task.title;
  document.getElementById("taskDesc").value          = task.description || "";
  document.getElementById("taskPriority").value      = task.priority;
  document.getElementById("taskStatus").value        = task.status;
  document.getElementById("statusGroup").style.display = "flex";
  document.getElementById("modalOverlay").classList.add("open");
}

function closeModal(e) {
  if (!e || e.target === document.getElementById("modalOverlay")) {
    document.getElementById("modalOverlay").classList.remove("open");
  }
}

async function saveTask() {
  const id       = document.getElementById("editTaskId").value;
  const title    = document.getElementById("taskTitle").value.trim();
  const desc     = document.getElementById("taskDesc").value.trim();
  const priority = document.getElementById("taskPriority").value;
  const status   = document.getElementById("taskStatus").value;

  if (!title) { showToast("⚠️ Title is required!", "warn"); return; }

  let data;
  if (id) {
    data = await api("PUT", `/api/tasks/${id}`, { title, description: desc, priority, status });
  } else {
    data = await api("POST", "/api/tasks", { title, description: desc, priority });
  }

  if (data.success) {
    closeModal();
  } else {
    showToast(`❌ ${data.message}`, "error");
  }
}

async function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  const data = await api("DELETE", `/api/tasks/${id}`);
  if (!data.success) showToast(`❌ ${data.message}`, "error");
}


// ══════════════════════════════════════════════════════
//  ANALYTICS
// ══════════════════════════════════════════════════════

async function loadAnalytics() {
  const grid = document.getElementById("analyticsGrid");
  grid.innerHTML = `<div class="empty-state">Crunching numbers…</div>`;

  const data = await api("GET", "/api/analytics");
  if (!data.success) { grid.innerHTML = `<div class="empty-state">Failed to load analytics.</div>`; return; }

  const a = data.analytics;
  const total = a.total_tasks || 1; // avoid div-by-zero for bar widths

  grid.innerHTML = `
    <!-- Stat cards -->
    <div class="stat-card">
      <div class="stat-card__value">${a.total_tasks}</div>
      <div class="stat-card__label">Total Tasks</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value" style="color:var(--success)">${a.completed_tasks}</div>
      <div class="stat-card__label">Completed</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value" style="color:var(--warning)">${a.in_progress_tasks}</div>
      <div class="stat-card__label">In Progress</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value" style="color:#7dd3fc">${a.pending_tasks}</div>
      <div class="stat-card__label">Pending</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value" style="color:var(--accent2)">${a.completion_percentage}%</div>
      <div class="stat-card__label">Completion Rate</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value" style="color:var(--accent2)">${a.avg_tasks_per_day}</div>
      <div class="stat-card__label">Avg Tasks / Day</div>
    </div>

    <!-- Priority breakdown bar -->
    <div class="priority-bar" style="grid-column: span 3;">
      <h4>Priority Breakdown</h4>
      ${["high","medium","low"].map(p => `
        <div class="bar-row">
          <span class="bar-label">${p.charAt(0).toUpperCase()+p.slice(1)}</span>
          <div class="bar-track">
            <div class="bar-fill bar-fill--${p}"
                 style="width:${Math.round((a.priority_breakdown[p]/total)*100)}%"></div>
          </div>
          <span class="bar-count">${a.priority_breakdown[p]}</span>
        </div>`).join("")}
    </div>`;
}


// ── Utilities ──────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

let toastTimer;
function showToast(msg, type = "info") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
}

// ── Keyboard shortcut: Escape closes modal ─────────────────────────────────
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

// ── Boot ───────────────────────────────────────────────────────────────────
loadTasks();
