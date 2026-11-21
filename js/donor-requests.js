var user = initPage("donor");

var currentTab = "All";

document.querySelectorAll(".tabs button.tab").forEach(function (btn) {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".tabs button.tab").forEach(function (b) { b.classList.remove("active"); });
    btn.classList.add("active");
    currentTab = btn.getAttribute("data-tab");
    renderOpenRequests();
  });
});

function getMatchingRequests() {
  var allReqs = getRequests();
  return allReqs.filter(function (r) {
    if (r.status !== "open") return false;
    if (user.bloodGroup && r.bloodGroup !== user.bloodGroup) return false;
    return true;
  });
}

function renderOpenRequests() {
  var list = document.getElementById("requestList");
  var openReqs = getMatchingRequests();

  var directCount = openReqs.filter(function (r) { return r.targetDonorId === user.id; }).length;
  var areaCount = openReqs.filter(function (r) { return !r.targetDonorId; }).length;

  document.getElementById("tabAll").textContent = "All (" + openReqs.length + ")";
  document.getElementById("tabDirect").textContent = "Direct to me (" + directCount + ")";
  document.getElementById("tabArea").textContent = "Area-wide (" + areaCount + ")";

  var shown = openReqs.filter(function (r) {
    if (currentTab === "Direct") return r.targetDonorId === user.id;
    if (currentTab === "Area-wide") return !r.targetDonorId;
    return true;
  });

  var urgencyVal = { high: 1, medium: 2, low: 3 };
  shown.sort(function (a, b) {
    return (urgencyVal[a.urgency] || 2) - (urgencyVal[b.urgency] || 2);
  });

  if (shown.length === 0) {
    list.innerHTML = '<p class="muted" style="padding: 12px 0;">No open requests in this category.</p>';
    return;
  }

  var html = "";
  shown.forEach(function (r) {
    var typeBadge = r.targetDonorId === user.id
      ? '<span class="chip chip-blue">Direct to you</span>'
      : '<span class="chip chip-medium">Area-wide</span>';

    html += '<div class="list-row">' +
              '<div class="blood-badge">' + esc(r.bloodGroup) + '</div>' +
              '<div class="grow">' +
                '<b>' + esc(r.hospital) + ' (' + esc(r.area || "Mirpur") + ')</b>' +
                '<small>' + r.units + ' unit(s) &middot; ' + neededText(r) + ' &middot; ' + timeAgo(r.createdAt) + '</small>' +
              '</div>' +
              '<div class="chips">' + urgencyChip(r.urgency) + typeBadge + '</div>' +
              '<div style="display:flex; gap:6px;">' +
                '<button class="btn small" onclick="acceptRequest(' + r.id + ')">Accept</button>' +
                '<button class="btn light small" onclick="declineRequest(' + r.id + ')">Decline</button>' +
              '</div>' +
            '</div>';
  });
  list.innerHTML = html;
}

function renderAcceptedRequests() {
  var list = document.getElementById("acceptedList");
  var accepted = getRequests().filter(function (r) {
    return r.acceptedBy === user.id;
  });

  document.getElementById("activeCount").textContent = accepted.length + " active";

  if (accepted.length === 0) {
    list.innerHTML = '<p class="muted" style="padding: 12px 0;">You have not accepted any requests yet.</p>';
    return;
  }

  var html = "";
  accepted.forEach(function (r) {
    var recipient = findUser(r.recipientId);
    var contactName = recipient ? recipient.name : "Recipient";
    var contactPhone = recipient ? recipient.phone : "Not provided";

    html += '<div class="list-row">' +
              '<div class="blood-badge">' + esc(r.bloodGroup) + '</div>' +
              '<div class="grow">' +
                '<b>' + esc(r.hospital) + '</b>' +
                '<small>Contact: <strong>' + esc(contactName) + '</strong> &middot; Phone: ' + esc(contactPhone) + ' &middot; Needed: ' + r.units + ' unit(s)</small>' +
              '</div>' +
              '<div class="chips">' + statusChip(r.status) + '</div>' +
              '<div style="display:flex; gap:6px;">' +
                '<button class="btn small" onclick="callPhone(\'' + esc(contactPhone) + '\')">Call recipient</button>' +
              '</div>' +
            '</div>';
  });
  list.innerHTML = html;
}

window.callPhone = function (phone) {
  alert("Dialing " + phone + "...\nPlease coordinate your arrival with the patient or hospital staff.");
};

window.acceptRequest = function (id) {
  var reqs = getRequests();
  var r = reqs.find(function (item) { return item.id === id; });
  if (!r) return;

  r.status = "accepted";
  r.acceptedBy = user.id;
  saveRequests(reqs);

  var recipient = findUser(r.recipientId);
  addNotif(r.recipientId, user.name + " (" + user.phone + ") accepted your " + r.bloodGroup + " request!");

  toast("Request accepted!", "success");
  renderOpenRequests();
  renderAcceptedRequests();
};

window.declineRequest = function (id) {
  toast("Request dismissed", "info");
  renderOpenRequests();
};

renderOpenRequests();
renderAcceptedRequests();
