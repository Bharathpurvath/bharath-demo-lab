(() => {
  const $ = (selector) => document.querySelector(selector);
  const dialog = $("#applyflow-dialog");
  const form = $("#job-form");
  const list = $("#jobs-list");
  const storageKey = "bharath-demo-lab-applyflow-v1";
  const sampleJobs = [
    { id: "sample-1", company: "Northstar Labs", title: "Frontend Developer", stage: "Applied", date: "2026-10-14" },
    { id: "sample-2", company: "Greenfield Systems", title: "QA Engineer", stage: "Interview", date: "2026-10-16" },
    { id: "sample-3", company: "Pixelcraft Studio", title: "Junior Web Developer", stage: "Wishlist", date: "2026-10-18" },
    { id: "sample-4", company: "Orbit Digital", title: "Software Engineer Intern", stage: "Offer", date: "2026-10-19" }
  ];
  let jobs = loadJobs();

  function loadJobs() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      console.warn("Local demo storage is unavailable", error);
    }
    return sampleJobs.map((job) => ({ ...job }));
  }

  function saveJobs() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(jobs));
    } catch (error) {
      console.warn("Could not save demo data in this browser", error);
    }
  }

  function localDate() {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  }

  function formatDate(value) {
    if (!value) return "Date not set";
    const parsed = new Date(value + "T12:00:00");
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }

  function render() {
    const query = $("#job-search").value.trim().toLowerCase();
    const filter = $("#stage-filter").value;
    const visible = jobs.filter((job) => {
      const matchesQuery = (job.company + " " + job.title).toLowerCase().includes(query);
      return matchesQuery && (filter === "All" || job.stage === filter);
    });
    $("#stat-total").textContent = jobs.length;
    $("#stat-interviews").textContent = jobs.filter((job) => job.stage === "Interview").length;
    $("#stat-offers").textContent = jobs.filter((job) => job.stage === "Offer").length;

    if (!visible.length) {
      list.innerHTML = '<div class="empty-state">No applications match this view.<br>Try another search or add a new application.</div>';
      return;
    }

    list.innerHTML = visible.map((job) => {
      const stageClass = job.stage.toLowerCase();
      const initials = job.company.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("") || "J";
      return '<article class="job-item">' +
        '<div class="company-mark" aria-hidden="true">' + escapeHTML(initials) + '</div>' +
        '<div class="job-detail"><strong>' + escapeHTML(job.title) + '</strong><small>' + escapeHTML(job.company) + ' · ' + escapeHTML(formatDate(job.date)) + '</small></div>' +
        '<div class="job-meta"><span class="stage-badge ' + stageClass + '">' + escapeHTML(job.stage) + '</span>' +
        '<div class="job-actions"><button type="button" data-action="edit" data-id="' + escapeHTML(job.id) + '">Edit</button><button type="button" data-action="delete" data-id="' + escapeHTML(job.id) + '">Delete</button></div></div></article>';
    }).join("");
  }

  function resetForm() {
    form.reset();
    $("#job-id").value = "";
    $("#job-date").value = localDate();
    $("#save-job").textContent = "Add application";
    $("#cancel-edit").classList.add("hidden");
  }

  $("#open-applyflow").addEventListener("click", () => {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    resetForm();
    render();
  });

  $("#close-applyflow").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", resetForm);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const id = $("#job-id").value;
    const entry = {
      id: id || (window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
      company: $("#company").value.trim(),
      title: $("#job-title").value.trim(),
      stage: $("#job-stage").value,
      date: $("#job-date").value || localDate()
    };
    if (!entry.company || !entry.title) return;
    if (id) jobs = jobs.map((job) => job.id === id ? entry : job);
    else jobs.unshift(entry);
    saveJobs();
    resetForm();
    render();
  });

  $("#cancel-edit").addEventListener("click", resetForm);
  $("#job-search").addEventListener("input", render);
  $("#stage-filter").addEventListener("change", render);

  list.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const job = jobs.find((item) => item.id === button.dataset.id);
    if (!job) return;
    if (button.dataset.action === "edit") {
      $("#job-id").value = job.id;
      $("#company").value = job.company;
      $("#job-title").value = job.title;
      $("#job-stage").value = job.stage;
      $("#job-date").value = job.date || localDate();
      $("#save-job").textContent = "Save changes";
      $("#cancel-edit").classList.remove("hidden");
      $("#company").focus();
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (button.dataset.action === "delete") {
      jobs = jobs.filter((item) => item.id !== job.id);
      saveJobs();
      render();
      if ($("#job-id").value === job.id) resetForm();
    }
  });

  $("#reset-demo").addEventListener("click", () => {
    jobs = sampleJobs.map((job) => ({ ...job }));
    saveJobs();
    $("#job-search").value = "";
    $("#stage-filter").value = "All";
    resetForm();
    render();
  });

  $("#year").textContent = new Date().getFullYear();
  $("#job-date").value = localDate();
  render();
})();