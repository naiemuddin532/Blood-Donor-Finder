var user = initPage("admin");

var filter = "all";
var roleName = { donor: "Donor", recipient: "Recipient", staff: "Staff" };
var roleChip = { donor: "chip-blue", recipient: "chip-green", staff: "chip-medium" };

function visibleUsers() {
  var text = document.getElementById("search").value.trim().toLowerCase();
  return getUsers().filter(function (u) {
    if (u.role === "admin") return false;
    if (filter === "pending" && u.status !== "pending") return false;
    if (filter !== "all" && filter !== "pending" && u.role !== filter) return false;
    return (u.name + " " + u.email).toLowerCase().indexOf(text) !== -1;
  });
}

function draw() {
  var all = getUsers().filter(function (u) { return u.role !== "admin"; });
  var tabs = document.querySelectorAll(".tab");
  for (var i = 0; i < tabs.length; i++) {
    var f = tabs[i].getAttribute("data-filter");
    var label = { all: "All", donor: "Donors", recipient: "Recipients", staff: "Staff", pending: "Pending" }[f];
    if (f === "pending") label += " (" + all.filter(function (u) { return u.status === "pending"; }).length + ")";
    tabs[i].textContent = label;
    tabs[i].classList.toggle("active", f === filter);
  }

  var rows = "";
  visibleUsers().forEach(function (u) {
    var buttons = "";
    if (u.status === "pending") {
      buttons = '<button class="btn small" data-a="approve" data-id="' + u.id + '">Approve</button>' +
                '<button class="btn small light" data-a="delete" data-id="' + u.id + '">Reject</button>';
    } else if (u.status === "blocked") {
      buttons = '<button class="btn small light" data-a="unblock" data-id="' + u.id + '">Unblock</button>';
    } else {
      buttons = '<button class="btn small light" data-a="block" data-id="' + u.id + '">Block</button>';
    }
    if (u.status !== "pending") {
      buttons += '<button class="btn small light" data-a="delete" data-id="' + u.id + '">Delete</button>';
    }

    rows += "<tr>" +
      '<td><div class="user-cell"><div class="mini-av">' + esc(initials(u.name)) + '</div><div><b>' + esc(u.name) + "</b><small>" + esc(u.email) + "</small></div></div></td>" +
      '<td><span class="chip ' + roleChip[u.role] + '">' + roleName[u.role] + "</span></td>" +
      "<td>" + (u.area || "—") + "</td>" +
      "<td>" + statusChip(u.status) + "</td>" +
      '<td><div class="action-row">' + buttons + "</div></td></tr>";
  });
  document.getElementById("userBody").innerHTML = rows || '<tr><td colspan="5" class="empty">No users found.</td></tr>';
  updateBadges();
}

document.getElementById("tabs").addEventListener("click", function (e) {
  var f = e.target.getAttribute("data-filter");
  if (f) { filter = f; draw(); }
});

document.getElementById("search").addEventListener("input", draw);

document.getElementById("userBody").addEventListener("click", function (e) {
  var action = e.target.getAttribute("data-a");
  var id = e.target.getAttribute("data-id");
  if (!action) return;
  var target = findUser(id);

  if (action === "approve") {
    target.status = "active";
    saveUser(target);
    addNotif(target.id, "Your account was approved. You can sign in.");
    toast(target.name + " approved");
  }
  if (action === "block") {
    target.status = "blocked";
    saveUser(target);
    addNotif(target.id, "Your account was blocked by the administrator.");
    toast(target.name + " blocked");
  }
  if (action === "unblock") {
    target.status = "active";
    saveUser(target);
    addNotif(target.id, "Your account was unblocked.");
    toast(target.name + " unblocked");
  }
  if (action === "delete") {
    if (confirm("Delete " + target.name + " and all related data?")) {
      removeUser(id);
      toast(target.name + " deleted");
    }
  }
  draw();
});

draw();
