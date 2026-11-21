var user = initPage("admin");

var roleName = { donor: "Donor", recipient: "Recipient", staff: "Blood Bank Staff" };

function draw() {
  var users = getUsers();
  var requests = getRequests();
  var pending = users.filter(function (u) { return u.status === "pending"; });
  var openReports = getReports().filter(function (r) { return r.status === "open"; });

  document.getElementById("kUsers").textContent = users.length;
  document.getElementById("kDonors").textContent = users.filter(function (u) { return u.role === "donor" && u.status === "active"; }).length;
  document.getElementById("kOpen").textContent = requests.filter(function (r) { return r.status === "open"; }).length;
  document.getElementById("kPending").textContent = pending.length + openReports.length;
  document.getElementById("kPendingSub").textContent = pending.length + " approvals · " + openReports.length + " reports";

  var groups = {};
  GROUPS.forEach(function (g) {
    groups[g] = users.filter(function (u) { return u.role === "donor" && u.bloodGroup === g; }).length;
  });
  document.getElementById("groupChart").innerHTML = barChart(groups);

  var status = { Open: 0, Accepted: 0, Fulfilled: 0, Expired: 0, Cancelled: 0 };
  requests.forEach(function (r) {
    var key = r.status.charAt(0).toUpperCase() + r.status.slice(1);
    status[key]++;
  });
  document.getElementById("statusChart").innerHTML = donutChart(status, ["#c8102e", "#2f5bd3", "#12b76a", "#f5a524", "#9aa0b8"]);

  var rows = "";
  pending.forEach(function (u) {
    rows += "<tr><td><b>" + esc(u.name) + "</b></td><td>" + roleName[u.role] + "</td><td>" + (u.area || "—") + "</td>" +
            '<td><div class="action-row">' +
              '<button class="btn small" data-a="approve" data-id="' + u.id + '">Approve</button>' +
              '<button class="btn small light" data-a="reject" data-id="' + u.id + '">Reject</button>' +
            "</div></td></tr>";
  });
  document.getElementById("pendingBody").innerHTML = rows || '<tr><td colspan="4" class="empty">No pending accounts.</td></tr>';
  updateBadges();
}

document.getElementById("pendingBody").addEventListener("click", function (e) {
  var action = e.target.getAttribute("data-a");
  var id = e.target.getAttribute("data-id");
  if (!action) return;

  var target = findUser(id);
  if (action === "approve") {
    target.status = "active";
    saveUser(target);
    addNotif(target.id, "Your account was approved. You can sign in.");
    toast(target.name + " approved");
  } else if (confirm("Reject and delete " + target.name + "?")) {
    removeUser(id);
    toast(target.name + " rejected");
  }
  draw();
});

draw();
