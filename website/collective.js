(() => {
  const SUPABASE_URL = "https://hdsqwkydgruyfbqqwhdk.supabase.co";
  const SUPABASE_KEY = "sb_publishable_m24u_7V16Y-bq_B_YydL-w_dw_4bOb8";
  const $ = (id) => document.getElementById(id);
  const status = $("collectiveStatus");
  const authPanel = $("collectiveAuth");
  const workspace = $("collectiveWorkspace");
  const output = $("collectiveOutput");
  const client = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY);

  function note(message, kind = "info") {
    status.textContent = message;
    status.dataset.kind = kind;
  }
  function safeText(value) {
    const node = document.createElement("span");
    node.textContent = String(value ?? "");
    return node;
  }
  function renderList(items, fields, emptyText) {
    output.replaceChildren();
    if (!items?.length) {
      const p = document.createElement("p"); p.className = "collective-empty"; p.textContent = emptyText; output.appendChild(p); return;
    }
    items.forEach(item => {
      const card = document.createElement("article"); card.className = "collective-item";
      fields.forEach(field => {
        const p = document.createElement(field === fields[0] ? "h4" : "p");
        p.textContent = String(item[field] ?? "");
        card.appendChild(p);
      });
      output.appendChild(card);
    });
  }
  async function invoke(action, data = {}) {
    if (!client) throw new Error("Library autentikasi belum termuat. Muat ulang halaman.");
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) throw new Error("Silakan masuk terlebih dahulu.");
    const { data: result, error } = await client.functions.invoke("collective-orchestrator", { body: { action, ...data } });
    if (error) {
      let detail = error.message || "Permintaan gagal.";
      try { const context = error.context; if (context?.json) { const body = await context.json(); detail = body.message || body.error || detail; } } catch (_) {}
      throw new Error(detail);
    }
    if (result?.error) throw new Error(result.message || result.error);
    return result;
  }
  async function updateAuth() {
    if (!client) { note("Autentikasi belum siap. Coba muat ulang halaman.", "error"); return; }
    const { data } = await client.auth.getSession();
    const session = data.session;
    authPanel.hidden = !!session;
    workspace.hidden = !session;
    $("collectiveUser").textContent = session?.user?.email || "";
    if (session) note("Terhubung sebagai " + session.user.email + ". Data tugas dan agen tetap privat.", "success");
    else note("Masuk atau buat akun untuk menggunakan workspace kolektif. Naskah tidak dibagikan otomatis.");
  }
  $("signInBtn").addEventListener("click", async () => {
    try {
      const email = $("authEmail").value.trim(), password = $("authPassword").value;
      if (!email || !password) throw new Error("Isi email dan kata sandi.");
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.code === "email_not_confirmed" || /email not confirmed/i.test(error.message || "")) {
          note("Email belum dikonfirmasi. Buka tautan di email pendaftaran atau pilih “Kirim ulang email konfirmasi”. Periksa folder Spam jika belum terlihat.", "error");
          return;
        }
        throw error;
      }
      await updateAuth();
    } catch (e) { note(e.message || "Gagal masuk.", "error"); }
  });
  $("resendConfirmationBtn").addEventListener("click", async () => {
    try {
      const email = $("authEmail").value.trim();
      if (!email) throw new Error("Masukkan alamat email terlebih dahulu.");
      const { error } = await client.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: "https://yudi8377.github.io/NARATIVA/#collective" }
      });
      if (error) throw error;
      note("Jika alamat tersebut memiliki pendaftaran yang menunggu konfirmasi, email konfirmasi telah diminta. Periksa Kotak Masuk dan Spam.", "success");
    } catch (e) { note(e.message || "Email konfirmasi belum dapat dikirim ulang.", "error"); }
  });
  $("signUpBtn").addEventListener("click", async () => {
    try {
      const email = $("authEmail").value.trim(), password = $("authPassword").value;
      if (!email || password.length < 8) throw new Error("Isi email dan kata sandi minimal 8 karakter.");
      const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: "https://yudi8377.github.io/NARATIVA/#collective" } });
      if (error) throw error;
      if (!data.session) note("Akun dibuat. Periksa email untuk konfirmasi, lalu masuk.", "success");
      else await updateAuth();
    } catch (e) { note(e.message || "Pendaftaran gagal.", "error"); }
  });
  $("signOutBtn").addEventListener("click", async () => {
    const { error } = await client.auth.signOut();
    note(error ? error.message : "Anda telah keluar.");
    await updateAuth();
  });
  $("taskForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const result = await invoke("create_task", {
        title: $("taskTitle").value.trim(), objective: $("taskObjective").value.trim(),
        task_type: $("taskType").value, max_agents: Number($("maxAgents").value),
        budget_units: Number($("budgetUnits").value)
      });
      note("Tugas dibuat dan masuk antrean. " + (result.notice || ""), "success");
      $("taskForm").reset(); $("maxAgents").value = "3"; $("budgetUnits").value = "10";
      await loadTasks();
    } catch (e) { note(e.message, "error"); }
  });
  $("agentForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const result = await invoke("register_agent", {
        display_name: $("agentName").value.trim(), specialty: $("agentSpecialty").value,
        description: $("agentDescription").value.trim(),
        capabilities: $("agentCapabilities").value.split(",").map(s => s.trim()).filter(Boolean)
      });
      note("Agen personal terdaftar: " + result.agent.display_name, "success");
      $("agentForm").reset(); await loadAgents();
    } catch (e) { note(e.message, "error"); }
  });
  $("skillForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const result = await invoke("submit_skill", {
        name: $("skillName").value.trim(), slug: $("skillSlug").value.trim(),
        summary: $("skillSummary").value.trim(), version: $("skillVersion").value.trim() || "1.0.0",
        share_to_network: $("skillShare").checked,
        skill_definition: { kind: "workflow", instructions: $("skillInstructions").value.trim() }
      });
      note(result.notice || "Skill tersimpan.", "success");
      $("skillForm").reset();
    } catch (e) { note(e.message, "error"); }
  });
  $("knowledgeForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const result = await invoke("submit_knowledge", {
        title: $("knowledgeTitle").value.trim(), summary: $("knowledgeSummary").value.trim(),
        domain: $("knowledgeDomain").value.trim() || "general",
        source_url: $("knowledgeSource").value.trim(),
        share_to_network: $("knowledgeShare").checked
      });
      note(result.notice || "Pengetahuan tersimpan.", "success");
      $("knowledgeForm").reset();
    } catch (e) { note(e.message, "error"); }
  });
  function renderTasks(tasks) {
    output.replaceChildren();
    if (!tasks?.length) {
      const p = document.createElement("p"); p.className = "collective-empty"; p.textContent = "Belum ada tugas. Buat tugas pertama di atas."; output.appendChild(p); return;
    }
    tasks.forEach(task => {
      const card = document.createElement("article"); card.className = "collective-item";
      const title = document.createElement("h4"); title.textContent = task.title || "Tugas";
      const meta = document.createElement("p"); meta.textContent = (task.task_type || "other") + " · status: " + (task.status || "unknown");
      card.append(title, meta);
      if (task.result && typeof task.result === "object") {
        const heading = document.createElement("p"); heading.textContent = task.result.plan_title || "Hasil tugas";
        const mode = document.createElement("small"); mode.textContent = task.result.mode === "structured-planning-only" ? "Rencana terstruktur · bukan keluaran model AI" : "Hasil tugas tersimpan";
        card.append(heading, mode);
        const deliverables = document.createElement("ul");
        (task.result.deliverables || []).forEach(item => { const li = document.createElement("li"); li.textContent = item; deliverables.appendChild(li); });
        if (deliverables.childNodes.length) card.appendChild(deliverables);
        const details = document.createElement("details");
        const summary = document.createElement("summary"); summary.textContent = "Lihat hasil lengkap";
        const pre = document.createElement("pre"); pre.className = "collective-result-json"; pre.textContent = JSON.stringify(task.result, null, 2);
        details.append(summary, pre); card.appendChild(details);
      }
      if (task.status !== "completed" && task.status !== "running") {
        const run = document.createElement("button"); run.type = "button"; run.className = "button secondary"; run.textContent = "Jalankan rencana tugas";
        run.addEventListener("click", async () => {
          run.disabled = true; run.textContent = "Menyusun rencana…";
          try {
            const r = await invoke("execute_task", { task_id: task.id });
            note(r.notice || "Rencana tugas dibuat.", "success");
            await loadTasks();
          } catch (e) { note(e.message || "Tugas belum dapat dijalankan.", "error"); run.disabled = false; run.textContent = "Coba lagi"; }
        });
        card.appendChild(run);
      }
      output.appendChild(card);
    });
  }
  async function loadTasks() {
    try { const r = await invoke("list_tasks"); renderTasks(r.tasks); }
    catch (e) { note(e.message, "error"); }
  }
  async function loadAgents() {
    try {
      const { data, error } = await client.from("collective_agents").select("display_name,specialty,status").order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      renderList(data, ["display_name","specialty","status"], "Belum ada agen personal terdaftar.");
    } catch (e) { note(e.message, "error"); }
  }
  $("refreshTasksBtn").addEventListener("click", loadTasks);
  $("refreshAgentsBtn").addEventListener("click", loadAgents);
  $("discoverBtn").addEventListener("click", async () => {
    try {
      const r = await invoke("discover", { domain: $("discoverDomain").value.trim() });
      output.replaceChildren();
      const all = [
        ...(r.knowledge || []).map(x => ({title: x.title, detail: x.summary, kind: "PENGETAHUAN", confidence: "Keyakinan: " + x.confidence})),
        ...(r.skills || []).map(x => ({title: x.name, detail: x.summary, kind: "SKILL v" + x.version, confidence: "Terverifikasi"}))
      ];
      all.forEach(item => {
        const card = document.createElement("article"); card.className = "collective-item";
        const tag = document.createElement("small"); tag.textContent = item.kind; card.appendChild(tag);
        const h = document.createElement("h4"); h.textContent = item.title; card.appendChild(h);
        const p = document.createElement("p"); p.textContent = item.detail; card.appendChild(p);
        const meta = document.createElement("small"); meta.textContent = item.confidence; card.appendChild(meta);
        output.appendChild(card);
      });
      if (!all.length) { const p = document.createElement("p"); p.className = "collective-empty"; p.textContent = "Belum ada pengetahuan atau skill bersama yang terverifikasi. Kontribusi yang dibagikan harus ditinjau terlebih dahulu."; output.appendChild(p); }
      note("Katalog hanya menampilkan kontribusi yang telah diverifikasi.", "success");
    } catch (e) { note(e.message, "error"); }
  });
  $("viewTasksBtn").addEventListener("click", loadTasks);
  $("viewAgentsBtn").addEventListener("click", loadAgents);
  client?.auth.onAuthStateChange(() => { updateAuth(); });
  updateAuth().catch(e => note(e.message, "error"));
})();