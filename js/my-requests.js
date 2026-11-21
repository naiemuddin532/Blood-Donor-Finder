// my-requests.js - works with my-requests.html

var user = initPage("recipient");
var filter = "all";

function myRequests() {
  var list = getRequests().filter(function (r) { return r.recipientId === user.id; });
  list.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  return list;
}

function render() {
  var all = myRequests();

  // numbers on the tabs
  var tabs = document.querySelectorAll(".tab");
  for (var i = 0; i < tabs.length; i++) {
    var f = tabs[i].getAttribute("data-filter");
    var n = all.filter(function (r) { return f === "all" || r.status === f; }).length;
    tabs[i].textContent = f.charAt(0).toUpperCase() + f.slice(1) + " (" + n + ")";
    tabs[i].classList.toggle("active", f === filter);
  }

  var rows = "";
  all.filter(function (r) { return filter === "all" || r.status === filter; }).forEach(function (r) {
    var donor = r.acceptedBy ? findUser(r.acceptedBy) : null;
    var donorText = "—", action = "";

    if (r.status === "open") {
      donorText = "Waiting for a donor";
      action = '<button class="btn small light" data-action="cancel" data-id="' + r.id + '">Cancel</button>';
    } else if (r.status === "accepted") {
      donorText = donor ? "<b>" + esc(donor.name) + "</b> · " + esc(donor.phone) : "Donor removed";   // phone shown only after accept
      action = '<button class="btn small" data-action="fulfill" data-id="' + r.id + '">Mark fulfilled</button>';
    } else if (r.status === "fulfilled") {
      donorText = donor ? esc(donor.name) : "Donor removed";
      action = r.rating
        ? '<span class="muted">Rated ' + r.rating + " &#9733;</span>"
        : '<button class="btn small light" data-action="rate" data-id="' + r.id + '">Rate donor</button>';
    } else if (r.status === "expired") {
      donorText = "No donor accepted";
      action = '<button class="btn small light" data-action="repost" data-id="' + r.id + '">Repost</button>';
    }

    rows += "<tr>" +
      "<td><b>" + r.bloodGroup + " · " + r.units + " unit" + (r.units > 1 ? "s" : "") + "</b></td>" +
      "<td>" + esc(r.hospital) + ", " + r.area + "</td>" +
      "<td>" + urgencyChip(r.urgency) + "</td>" +
      "<td>" + statusChip(r.status) + "</td>" +
      "<td>" + donorText + "</td>" +
      "<td>" + action + "</td></tr>";
  });
  document.getElementById("requestBody").innerHTML = rows || '<tr><td colspan="6" class="empty">No requests here.</td></tr>';
}

function updateRequest(id, changes) {
  var reqs = getRequests();
  for (var i = 0; i < reqs.length; i++) {
    if (reqs[i].id == id) {
      for (var key in changes) reqs[i][key] = changes[key];
    }
  }
  saveRequests(reqs);
}

// tabs
document.getElementById("tabs").addEventListener("click", function (e) {
  var f = e.target.getAttribute("data-filter");
  if (f) { filter = f; render(); }
});

// buttons inside the table
document.getElementById("requestBody").addEventListener("click", function (e) {
  var action = e.target.getAttribute("data-action");
  var id = e.target.getAttribute("data-id");
  if (!action) return;

  var req = myRequests().filter(function (r) { return r.id == id; })[0];

  if (action === "cancel") {
    if (confirm("Cancel this request?")) {
      updateRequest(id, { status: "cancelled" });
      toast("Request cancelled");
      render();
    }
  }

  if (action === "fulfill") {
    updateRequest(id, { status: "fulfilled" });
    if (req.acceptedBy) addNotif(req.acceptedBy, user.name + " marked the request as fulfilled. Thank you!");
    toast("Marked as fulfilled");
    render();
  }

  if (action === "repost") {
    var result = createRequest(user, {
      bloodGroup: req.bloodGroup, area: req.area, hospital: req.hospital,
      units: req.units, hours: req.hours || 24, targetDonorId: null
    });
    if (result.ok) { toast("Request posted again"); render(); }
    else toast(result.error, "error");
  }

  if (action === "rate") {
    openModal(
      "<h3>Rate your donor</h3><p>How was your experience?</p>" +
      '<div class="stars">' +
        [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-star="' + n + '">&#9733;</button>'; }).join("") +
      "</div>" +
      '<div class="modal-actions"><button type="button" class="btn light" id="cancelBtn">Cancel</button></div>'
    );
    document.getElementById("cancelBtn").onclick = closeModal;
    document.querySelector(".stars").onclick = function (ev) {
      var star = ev.target.getAttribute("data-star");
      if (!star) return;
      updateRequest(id, { rating: Number(star) });
      closeModal();
      toast("Thanks for rating!");
      render();
    };
  }
});

render();
