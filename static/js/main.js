const socket = window.io ? window.io({ transports: ["websocket", "polling"] }) : null;

if (socket) {
  socket.on("connect", () => {
    socket.emit("join");
    document.getElementById("liveBadge")?.classList.add("visible");
  });

  socket.on("disconnect", () => {
    document.getElementById("liveBadge")?.classList.remove("visible");
  });

  socket.on("task_added", (data) => {
    addTaskToGrid(data.task);
    showToast("New task added");
  });

  socket.on("task_updated", (data) => {
    replaceTaskInGrid(data.task);
    showToast("Task updated");
  });

  socket.on("task_deleted", (data) => {
    removeTaskFromGrid(data.task_id);
    showToast("Task removed");
  });
}

function showSection(name) {
  document.getElementById("section-tasks").style.display = name === "tasks" ? "block" : "none";
  document.getElementById("section-analytics").style.display = name === "analytics" ? "block" : "none";

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("onclick")?.includes(`'${name}'`));
  });

  if (name === "analytics") {
    loadAnalytics();
  }
}

async function api(method, url, body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : { success: false, message: await response.text() };

  if (!response.ok && data.success !== false) {
    data.success = false;
  }

  return data;
}

async function loadTasks() {
  const status = document.getElementById("filterStatus").value;
  const priority = document.getElementById("filterPriority").value;
  const params = new URLSearchParams();

  if (status) {
    params.set("status", status);
  }
  if (priority) {
    params.set("priority", priority);
  }

  const data = await api("GET", `/api/tasks?${params.toString()}`);
  const grid = document.getElementById("taskGrid");

  if (!data.success) {
    grid.innerHTML = '<div class="empty-state">Failed to load tasks.</div>';
    return;
  }

  if (data.tasks.length === 0) {
    grid.innerHTML = '<div class="empty-state">No tasks yet. Click <strong>+ Add Task</strong> to get started.</div>';
    return;
  }

  grid.innerHTML = data.tasks.map(taskCard).join("");
}

function taskCard(task) {
  const date = new Date(task.created_at).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const taskJson = escHtml(JSON.stringify(task));

  return `
    <div class="task-card" id="task-${task.id}">
      <div class="task-card__header">
        <span class="task-card__title">${escHtml(task.title)}</span>
        <span class="badge badge--${escHtml(task.priority)}">${escHtml(task.priority).toUpperCase()}</span>
      </div>
      ${task.description ? `<p class="task-card__desc">${escHtml(task.description)}</p>` : ""}
      <div class="task-card__meta">
        <span class="badge badge--${escHtml(task.status)}">${escHtml(task.status).replace("_", " ")}</span>
      </div>
      <p class="task-date">${date}</p>
      <div class="task-card__actions">
        <button class="btn btn--ghost btn--sm" onclick="openEditModal(JSON.parse(this.dataset.task))" data-task="${taskJson}">Edit</button>
        <button class="btn btn--danger btn--sm" onclick="deleteTask(${task.id})">Delete</button>
      </div>
    </div>`;
}

function addTaskToGrid(task) {
  if (document.getElementById(`task-${task.id}`)) {
    replaceTaskInGrid(task);
    return;
  }

  const grid = document.getElementById("taskGrid");
  const empty = grid.querySelector(".empty-state");
  if (empty) {
    empty.remove();
  }
  grid.insertAdjacentHTML("afterbegin", taskCard(task));
}

function replaceTaskInGrid(task) {
  const element = document.getElementById(`task-${task.id}`);
  if (element) {
    element.outerHTML = taskCard(task);
  }
}

function removeTaskFromGrid(taskId) {
  document.getElementById(`task-${taskId}`)?.remove();

  if (document.getElementById("taskGrid").children.length === 0) {
    document.getElementById("taskGrid").innerHTML =
      '<div class="empty-state">No tasks yet. Click <strong>+ Add Task</strong> to get started.</div>';
  }
}

function openModal() {
  document.getElementById("modalTitle").textContent = "Add New Task";
  document.getElementById("editTaskId").value = "";
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDesc").value = "";
  document.getElementById("taskPriority").value = "medium";
  document.getElementById("statusGroup").style.display = "none";
  document.getElementById("modalOverlay").classList.add("open");
  document.getElementById("taskTitle").focus();
}

function openEditModal(task) {
  document.getElementById("modalTitle").textContent = "Edit Task";
  document.getElementById("editTaskId").value = task.id;
  document.getElementById("taskTitle").value = task.title;
  document.getElementById("taskDesc").value = task.description || "";
  document.getElementById("taskPriority").value = task.priority;
  document.getElementById("taskStatus").value = task.status;
  document.getElementById("statusGroup").style.display = "flex";
  document.getElementById("modalOverlay").classList.add("open");
  document.getElementById("taskTitle").focus();
}

function closeModal(event) {
  if (!event || event.target === document.getElementById("modalOverlay")) {
    document.getElementById("modalOverlay").classList.remove("open");
  }
}

async function saveTask() {
  const id = document.getElementById("editTaskId").value;
  const title = document.getElementById("taskTitle").value.trim();
  const description = document.getElementById("taskDesc").value.trim();
  const priority = document.getElementById("taskPriority").value;
  const status = document.getElementById("taskStatus").value;

  if (!title) {
    showToast("Title is required");
    return;
  }

  const data = id
    ? await api("PUT", `/api/tasks/${id}`, { title, description, priority, status })
    : await api("POST", "/api/tasks", { title, description, priority });

  if (!data.success) {
    showToast(data.message || "Unable to save task");
    return;
  }

  closeModal();
  await loadTasks();
}

async function deleteTask(id) {
  if (!confirm("Delete this task?")) {
    return;
  }

  const data = await api("DELETE", `/api/tasks/${id}`);
  if (!data.success) {
    showToast(data.message || "Unable to delete task");
    return;
  }

  await loadTasks();
}

async function loadAnalytics() {
  const grid = document.getElementById("analyticsGrid");
  grid.innerHTML = '<div class="empty-state">Crunching numbers...</div>';

  const data = await api("GET", "/api/analytics");
  if (!data.success) {
    grid.innerHTML = '<div class="empty-state">Failed to load analytics.</div>';
    return;
  }

  const analytics = data.analytics;
  const total = analytics.total_tasks || 1;

  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-card__value">${analytics.total_tasks}</div>
      <div class="stat-card__label">Total Tasks</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value" style="color:var(--success)">${analytics.completed_tasks}</div>
      <div class="stat-card__label">Completed</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value" style="color:var(--warning)">${analytics.in_progress_tasks}</div>
      <div class="stat-card__label">In Progress</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value" style="color:#7dd3fc">${analytics.pending_tasks}</div>
      <div class="stat-card__label">Pending</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value" style="color:var(--accent2)">${analytics.completion_percentage}%</div>
      <div class="stat-card__label">Completion Rate</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value" style="color:var(--accent2)">${analytics.avg_tasks_per_day}</div>
      <div class="stat-card__label">Avg Tasks / Day</div>
    </div>
    <div class="priority-bar" style="grid-column: span 3;">
      <h4>Priority Breakdown</h4>
      ${["high", "medium", "low"].map((priority) => `
        <div class="bar-row">
          <span class="bar-label">${priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
          <div class="bar-track">
            <div class="bar-fill bar-fill--${priority}"
              style="width:${Math.round((analytics.priority_breakdown[priority] / total) * 100)}%"></div>
          </div>
          <span class="bar-count">${analytics.priority_breakdown[priority]}</span>
        </div>`).join("")}
    </div>`;
}

function escHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let toastTimer;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

loadTasks();
