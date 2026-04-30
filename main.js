// ================= SIDEBAR MOBILE =================
  function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('active');
  }
  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
  }

  // ================= DATA =================
  const content = document.getElementById('mainContent');

  let kelarIn    = JSON.parse(localStorage.getItem("kelarIn"))      || [];
  let history    = JSON.parse(localStorage.getItem("todoHistory"))  || [];
  let undoStack  = JSON.parse(localStorage.getItem("undoStack"))    || [];

  function save() {
    localStorage.setItem("kelarIn",      JSON.stringify(kelarIn));
    localStorage.setItem("todoHistory",  JSON.stringify(history));
    localStorage.setItem("undoStack",    JSON.stringify(undoStack));
  }

  // ================= NAV ACTIVE =================
  function setActive(btn) {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  }

  // ================= HOME =================
  function showHome() {
    document.getElementById("pageTitle").innerText = "Home";
    const lastTask = kelarIn.length > 0 ? kelarIn[kelarIn.length - 1] : null;

    content.innerHTML = `
      <div class="card big" style="text-align:center; padding:32px 20px; width:screen">
        <div style="font-size:52px; margin-bottom:12px;">⚡</div>
        <h2 style="margin:0 0 8px; color:#e0e7ff;">Selamat Datang! ✨</h2>
        <p style="color:#94a3b8; margin-bottom:28px;">Siap menyelesaikan tugasmu hari ini dengan sistem LIFO?</p>

        <div class="grid" style="max-width:500px; margin:0 auto;">
          <div class="card" style="cursor:pointer; text-align:center;" onclick="document.querySelectorAll('.nav-btn')[2].click()">
            <div style="font-size:28px;">📂</div>
            <h4 style="margin:8px 0 4px;">Lihat Tugas</h4>
            <p style="font-size:12px; color:#94a3b8; margin:0;">Cek tumpukan tugasmu</p>
          </div>
          <div class="card" style="cursor:pointer; text-align:center;" onclick="document.querySelectorAll('.nav-btn')[3].click()">
            <div style="font-size:28px;">➕</div>
            <h4 style="margin:8px 0 4px;">Tambah Baru</h4>
            <p style="font-size:12px; color:#94a3b8; margin:0;">Push tugas ke stack</p>
          </div>
        </div>

        ${lastTask ? `
          <div style="margin-top:28px; padding:20px; border-top:1px solid rgba(255,255,255,0.1); border-radius:14px; background:rgba(99,102,241,0.1);">
            <p style="font-size:13px; font-weight:600; color:#a5b4fc; margin:0 0 8px;">📌 TUGAS TERATAS STACK:</p>
            <h3 style="margin:0 0 6px; color:#e0e7ff;">${lastTask.text}</h3>
            <small style="color:#94a3b8;">⏰ Deadline: ${lastTask.deadline !== "Tanpa Deadline" ? lastTask.deadline.replace("T"," | ") : lastTask.deadline}</small>
          </div>
        ` : `<div class="empty" style="margin-top:20px;">Belum ada tugas di tumpukan 🥱</div>`}
      </div>
    `;
  }

  // ================= DASHBOARD =================
  function showDashboard() {
    document.getElementById("pageTitle").innerText = "Dashboard";
    const total          = kelarIn.length;
    const doneCount      = kelarIn.filter(t => t.done).length;
    const pendingCount   = total - doneCount;
    const progressPercent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

    content.innerHTML = `
      <div class="card big">
        <h3 style="margin:0 0 4px;">Statistik Tugas ✨</h3>
        <p style="color:#94a3b8; margin:0;">Pantau progres tumpukan tugasmu.</p>
      </div>
      <div class="grid">
        <div class="card">
          <h4 style="margin:0 0 4px;">📌 Total Tugas</h4>
          <div class="number">${total}</div>
        </div>
        <div class="card">
          <h4 style="margin:0 0 4px;">⏳ Belum Selesai</h4>
          <div class="number" style="color:#ffadad;">${pendingCount}</div>
        </div>
        <div class="card">
          <h4 style="margin:0 0 4px;">✅ Sudah Selesai</h4>
          <div class="number" style="color:#a0c4ff;">${doneCount}</div>
        </div>
      </div>
      <div class="card" style="margin-top:4px;">
        <h4>📊 Progres Penyelesaian</h4>
        <div style="background:rgba(255,255,255,0.08); border-radius:20px; height:30px; width:100%; margin:12px 0; overflow:hidden;">
          <div style="background:linear-gradient(90deg,#bdb2ff,#a0c4ff); height:100%; width:${progressPercent}%; transition:width 0.6s ease; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:14px; min-width:${progressPercent > 0 ? '40px' : '0'};">
            ${progressPercent > 0 ? progressPercent + '%' : ''}
          </div>
        </div>
        ${progressPercent === 0 ? `<small style="color:#94a3b8;">Belum ada tugas selesai</small>` : ''}
      </div>
    `;
  }

  // ================= TASKS (LIFO) =================
  function showTasks() {
    document.getElementById("pageTitle").innerText = "Daftar Tugas";

    let html = `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;" class="action-row">
          <h3 style="margin:0;">Tumpukan Tugas (LIFO)</h3>
          <div style="display:flex; gap:8px; flex-wrap:wrap;" class="action-row">
            <button onclick="undoRemove()" class="icon-btn-main">
              <img src="icon/undo.png" class="btn-icon" onerror="this.style.display='none'">
              <span>Undo Pop</span>
            </button>
            <button onclick="removeTodo()" class="icon-btn-main delete">
              <img src="icon/delete.png" class="btn-icon" onerror="this.style.display='none'">
              <span>Pop Teratas</span>
            </button>
          </div>
        </div>
        <div class="search-box">
          <img src="icon/search.png" class="search-icon" onerror="this.style.display='none'">
          <input type="text" id="searchTask" placeholder="Cari tugas..." onkeyup="filterTasks()">
        </div>
    `;

    if (kelarIn.length === 0) {
      html += `<div class="empty">Tumpukan kosong ✨</div>`;
    } else {
      [...kelarIn].reverse().forEach((t, i) => {
        const originalIndex = kelarIn.length - 1 - i;
        const isTop = i === 0
          ? '<span class="badge">TOP</span>'
          : '';
        html += `
          <div class="task" style="display:flex; align-items:center; gap:12px; padding:14px 8px; border-bottom:1px solid rgba(255,255,255,0.07);">
            <input type="checkbox" ${t.done ? 'checked' : ''} onclick="toggleStatus(${originalIndex})"
              style="width:18px; height:18px; flex-shrink:0; cursor:pointer; accent-color:#6366f1;">
            <div style="flex:1; min-width:0;">
              <div style="font-size:14px; word-break:break-word; ${t.done ? 'text-decoration:line-through; color:#475569;' : 'color:#e2e8f0;'}">
                ${t.text} ${isTop}
              </div>
              <div style="font-size:12px; color:#6366f1; margin-top:4px; font-weight:600;">
                ⏰ ${t.deadline !== "Tanpa Deadline" ? t.deadline.replace("T"," | ") : "Tanpa Deadline"}
              </div>
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;
    content.innerHTML = html;
  }

  // ================= ADD (PUSH) =================
  function showAdd() {
    document.getElementById("pageTitle").innerText = "Tambah Tugas";
    content.innerHTML = `
      <div class="card add-modern">
        <h3 style="margin:0 0 20px;">✨ Tambah Tugas Baru</h3>
        <div class="form-group">
          <label>Judul Tugas</label>
          <input id="todoInput" placeholder="Contoh: Belajar Stack...">
        </div>
        <div class="form-group">
          <label>Tanggal Deadline</label>
          <input type="datetime-local" id="deadlineInput">
        </div>
        <button class="btn-add" onclick="addTodo()">➕ Tambahkan ke Stack</button>
      </div>
    `;
  }

  // ================= CALENDAR =================
  function showCalendar() {
    document.getElementById("pageTitle").innerText = "Calendar & Deadline";
    const sortedTasks = kelarIn
      .filter(t => t.deadline && t.deadline !== "Tanpa Deadline" && !t.done)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    let html = `
      <div class="card">
        <h3 style="margin:0 0 6px;">📅 Pengingat Deadline</h3>
        <p style="font-size:13px; color:#94a3b8; margin:0 0 16px;">Tugas diurutkan dari yang paling mendesak.</p>
    `;

    if (sortedTasks.length === 0) {
      html += `<div class="empty">Tidak ada deadline aktif ✨</div>`;
    } else {
      sortedTasks.forEach(t => {
        const now = new Date();
        const target = new Date(t.deadline);
        const diffTime = target - now;
        let timeText = "", statusColor = "#a0c4ff";

        if (diffTime < 0) {
          timeText = "Terlambat"; statusColor = "#ef4444";
        } else {
          const d = Math.floor(diffTime / 86400000);
          const h = Math.floor((diffTime % 86400000) / 3600000);
          const m = Math.floor((diffTime % 3600000) / 60000);
          timeText = d > 0 ? `${d}h ${h}j lagi` : h > 0 ? `${h}j ${m}m lagi` : `${m}m lagi`;
          if (d < 1) statusColor = "#ffadad";
        }

        html += `
          <div class="calendar-item" style="border-left:4px solid ${statusColor}; background:rgba(255,255,255,0.03);">
            <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px;">
              <strong style="word-break:break-word;">${t.text}</strong>
              <span style="color:${statusColor}; font-weight:700; font-size:13px; flex-shrink:0;">${timeText}</span>
            </div>
            <small style="color:#94a3b8;">Deadline: ${t.deadline.replace('T',' ')}</small>
          </div>
        `;
      });
    }

    html += `</div>`;
    content.innerHTML = html;
  }

  // ================= STATS =================
  function showStats() {
    document.getElementById("pageTitle").innerText = "Statistik & Riwayat";
    const totalCreated = kelarIn.length + history.length;
    const totalDone    = kelarIn.filter(t => t.done).length + history.filter(t => t.done).length;

    content.innerHTML = `
      <div class="card big">
        <h3 style="margin:0 0 4px;">📊 Statistik Penggunaan</h3>
        <p style="color:#94a3b8; margin:0;">Laporan aktivitas tugas kamu.</p>
      </div>
      <div class="grid">
        <div class="card">
          <h4 style="margin:0 0 4px;">📝 Total Input</h4>
          <div class="number">${totalCreated}</div>
          <small style="color:#94a3b8;">Semua tugas pernah dibuat</small>
        </div>
        <div class="card">
          <h4 style="margin:0 0 4px;">✅ Total Selesai</h4>
          <div class="number" style="color:#a0c4ff;">${totalDone}</div>
          <small style="color:#94a3b8;">Tugas berhasil dikerjakan</small>
        </div>
      </div>
      <div class="card" style="margin-top:4px;">
        <h3 style="margin:0 0 12px;">📜 Riwayat (Tugas di-Pop)</h3>
        ${history.length === 0
          ? `<div class="empty">Belum ada riwayat ✨</div>`
          : [...history].reverse().map(h => `
            <div style="padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.07); display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px;">
              <span style="word-break:break-word;">${h.text}</span>
              <small style="color:#94a3b8; flex-shrink:0;">${h.done ? '✅ Selesai' : '❌ Belum'}</small>
            </div>
          `).join('')}
      </div>
    `;
  }

  // ================= CORE ACTIONS =================
  function addTodo() {
    const input     = document.getElementById("todoInput");
    const dateInput = document.getElementById("deadlineInput");
    if (!input || !input.value.trim()) { showPopup("Oops 😅","Judul tugas tidak boleh kosong!"); return; }

    kelarIn.push({ text: input.value.trim(), deadline: dateInput.value || "Tanpa Deadline", done: false, notified: false });
    input.value = ""; if (dateInput) dateInput.value = "";
    save();
    showPopup("Berhasil ✅","Tugas masuk ke stack.");
    showTasks();
    document.querySelectorAll(".nav-btn")[2].classList.remove("active");
    document.querySelectorAll(".nav-btn")[2].classList.add("active");
  }

  function removeTodo() {
    if (kelarIn.length === 0) { showPopup("Stack Kosong","Belum ada tugas."); return; }
    const removed = kelarIn.pop();
    undoStack.push(removed);
    history.push(removed);
    save(); showTasks();
    showPopup("Pop Berhasil ✅","Tugas \"" + removed.text + "\" dihapus dari stack.");
  }

  function undoRemove() {
    if (undoStack.length === 0) { showPopup("Undo Gagal","Tidak ada data yang bisa dikembalikan."); return; }
    kelarIn.push(undoStack.pop());
    save(); showTasks();
    showPopup("Undo Berhasil ↩️","Task berhasil dikembalikan.");
  }

  function toggleStatus(index) {
    kelarIn[index].done = !kelarIn[index].done;
    save(); showTasks();
  }

  function filterTasks() {
    const kw = document.getElementById("searchTask").value.toLowerCase();
    document.querySelectorAll(".task").forEach(el => {
      el.style.display = el.innerText.toLowerCase().includes(kw) ? "block" : "none";
    });
  }

  // ================= POPUP =================
  function showPopup(title, desc) {
    document.getElementById("popupText").innerText  = title;
    document.getElementById("popupDesc").innerText  = desc;
    document.getElementById("popupModal").classList.add("active");
  }
  function closePopup() { document.getElementById("popupModal").classList.remove("active"); }
  document.addEventListener("click", e => {
    const modal = document.getElementById("popupModal");
    if (modal && e.target === modal) modal.classList.remove("active");
  });

  // ================= NOTIFICATIONS =================
  function checkDeadlines() {
    kelarIn.forEach((t, i) => {
      if (t.deadline !== "Tanpa Deadline" && !t.done && !t.notified) {
        if (new Date() >= new Date(t.deadline)) {
          if (Notification.permission === "granted")
            new Notification("⏰ Pengingat Tugas!", { body: "Waktunya mengerjakan: " + t.text });
          showPopup("🚨 Deadline Tiba!","Segera kerjakan: " + t.text);
          kelarIn[i].notified = true;
          save();
        }
      }
    });
  }
  if (Notification.permission !== "denied") Notification.requestPermission();
  setInterval(checkDeadlines, 30000);

  // ================= INIT =================
  window.onload = () => showHome();