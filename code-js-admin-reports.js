var user = initPage("admin");

var selectedId = null;

function nameOf(id) {
  var u = findUser(id);
  return u ? u.name : "(deleted user)";
}

function draw() {
  var reports = getReports().sort(function (a, b) { return new Date(b.at) - new Date(a.at); });

  var current = null;
  reports.forEach(function (r) { if (r.id === selectedId) current = r; });
  if (!current) current = reports.filter(function (r) { return r.status === "open"; })[0] || reports[0] || null;
  selectedId = current ? current.id : null;

  var rows = "";
  reports.forEach(function (r) {
    rows += '<tr class="report-row' + (r.id === selectedId ? " selected" : "") + '" data-id="' + r.id + '">' +
      '<td data-id="' + r.id + '"><b data-id="' + r.id + '">Report #' + r.id + ": " + esc(nameOf(r.reportedId)) + "</b></td>" +
      '<td data-id="' + r.id + '">' + esc(nameOf(r.by)) + "</td>" +
      '<td data-id="' + r.id + '">' + (r.status === "open" ? '<span class="chip chip-high">Open</span>' : statusChip("resolved")) + "</td></tr>";
  });
  document.getElementById("reportBody").innerHTML = rows || '<tr><td colspan="3" class="empty">No reports.</td></tr>';

  var box = document.getElementById("detail");
  if (!current) { box.innerHTML = '<p class="empty">No reports.</p>'; updateBadges(); return; }

  var actions;
  if (current.status === "open") {
    actions = '<div class="action-row">' +
      '<button class="btn" data-a="block" data-id="' + current.id + '">Block user</button>' +
      '<button class="btn light" data-a="warn" data-id="' + current.id + '">Send warning</button>' +
      '<button class="btn light" data-a="dismiss" data-id="' + current.id + '">Dismiss</button></div>';
  } else {
    actions = '<p class="muted">Resolved: ' + esc(current.action || "") + "</p>";
  }

  box.innerHTML =
    "<h3>Report #" + current.id + " " + (current.status === "open" ? '<span class="chip chip-high">Open</span>' : statusChip("resolved")) + "</h3>" +
    "<b>" + esc(nameOf(current.reportedId)) + "</b>" +
    '<p class="muted">Reported by ' + esc(nameOf(current.by)) + " · " + timeAgo(current.at) + "</p>" +
    '<div class="reason-box">“' + esc(current.reason) + "”</div>" + actions;
  updateBadges();
}

function updateReport(id, changes) {
  var list = getReports();
  list.forEach(function (r) {
    if (r.id == id) for (var key in changes) r[key] = changes[key];
  });
  saveReports(list);
}

document.getElementById("reportBody").addEventListener("click", function (e) {
  var id = e.target.getAttribute("data-id");
  if (id) { selectedId = Number(id); draw(); }
});

document.getElementById("detail").addEventListener("click", function (e) {
  var action = e.target.getAttribute("data-a");
  var id = e.target.getAttribute("data-id");
  if (!action) return;

  var report = getReports().filter(function (r) { return r.id == id; })[0];
  var target = findUser(report.reportedId);

  if (action === "block") {
    if (target) { target.status = "blocked"; saveUser(target); }
    updateReport(id, { status: "resolved", action: "user blocked" });
    toast("User blocked");
  } else if (action === "warn") {
    if (target) addNotif(target.id, "Warning from admin: please follow our community guidelines.");
    updateReport(id, { status: "resolved", action: "warning sent" });
    toast("Warning sent");
  } else if (action === "dismiss") {
    updateReport(id, { status: "resolved", action: "dismissed" });
    toast("Report dismissed");
  }
  draw();
});

draw();
