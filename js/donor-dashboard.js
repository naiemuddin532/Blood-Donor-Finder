var user = initPage("donor");

var hour = new Date().getHours();
var timeWord = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
var firstName = user.name ? user.name.split(" ")[0] : "Donor";
document.getElementById("welcome").textContent = timeWord + ", " + firstName;
document.getElementById("subGreeting").textContent = "You are helping save lives in " + (user.area || "your area") + ".";

var availToggle = document.getElementById("availToggle");
var availText = document.getElementById("availText");
availToggle.checked = user.available !== false;
availText.textContent = availToggle.checked ? "Available to donate" : "Not available";

availToggle.addEventListener("change", function () {
  user.available = this.checked;
  availText.textContent = this.checked ? "Available to donate" : "Not available";
  saveUser(user);
  toast(this.checked ? "Status: Available to donate" : "Status: Not available", "success");
});

function renderKPIs() {
  document.getElementById("kGroup").textContent = user.bloodGroup || "O+";
  document.getElementById("kArea").textContent = (user.area || "Mirpur") + ", Dhaka";

  var myDonations = getDonations().filter(function (d) { return d.userId === user.id; });
  document.getElementById("kTotal").textContent = myDonations.length;

  var verified = myDonations.filter(function (d) { return d.status === "verified"; });
  verified.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

  if (verified.length > 0) {
    document.getElementById("kLastDonation").textContent = "Last: " + verified[0].date;
    var next = new Date(verified[0].date);
    next.setMonth(next.getMonth() + 3);
    if (next <= new Date()) {
      document.getElementById("kEligible").textContent = "Eligible now";
      document.getElementById("kEligibleNote").textContent = "Over 3 months since last donation";
    } else {
      document.getElementById("kEligible").textContent = "Not yet";
      document.getElementById("kEligibleNote").textContent = "Eligible on " + next.toISOString().slice(0, 10);
    }
  } else if (user.lastDonated) {
    document.getElementById("kLastDonation").textContent = "Last: " + user.lastDonated;
    var nextU = new Date(user.lastDonated);
    nextU.setMonth(nextU.getMonth() + 3);
    if (nextU <= new Date()) {
      document.getElementById("kEligible").textContent = "Eligible now";
      document.getElementById("kEligibleNote").textContent = "Ready to donate";
    } else {
      document.getElementById("kEligible").textContent = "Not yet";
      document.getElementById("kEligibleNote").textContent = "Eligible on " + nextU.toISOString().slice(0, 10);
    }
  } else {
    document.getElementById("kLastDonation").textContent = "No donations recorded";
    document.getElementById("kEligible").textContent = "Eligible now";
    document.getElementById("kEligibleNote").textContent = "First-time donor";
  }

  var answeredCount = getRequests().filter(function (r) { return r.acceptedBy === user.id; }).length;
  document.getElementById("kAnswered").textContent = answeredCount;
}

function renderMatchingRequests() {
  var listEl = document.getElementById("requestList");
  var countEl = document.getElementById("matchingCount");
  var openReqs = getRequests().filter(function (r) {
    return r.status === "open" && (!user.bloodGroup || r.bloodGroup === user.bloodGroup);
  });

  var urgencyVal = { high: 1, medium: 2, low: 3 };
  openReqs.sort(function (a, b) {
    return (urgencyVal[a.urgency] || 2) - (urgencyVal[b.urgency] || 2);
  });

  countEl.textContent = openReqs.length + " new";
  if (openReqs.length === 0) {
    listEl.innerHTML = '<p class="muted" style="padding: 12px 0;">No matching open requests right now.</p>';
    return;
  }

  var html = "";
  openReqs.forEach(function (r) {
    var recipient = findUser(r.recipientId);
    var place = esc(r.hospital) + (r.area ? " (" + esc(r.area) + ")" : "");
    var unitsStr = r.units + " unit" + (r.units > 1 ? "s" : "");
    html += '<div class="list-row">' +
              '<div class="blood-badge">' + esc(r.bloodGroup) + '</div>' +
              '<div class="grow">' +
                '<b>' + place + '</b>' +
                '<small>' + unitsStr + ' &middot; ' + neededText(r) + ' &middot; ' + timeAgo(r.createdAt) + '</small>' +
              '</div>' +
              '<div class="chips">' + urgencyChip(r.urgency) + '</div>' +
              '<div style="display:flex; gap:6px;">' +
                '<button class="btn small" onclick="acceptReq(' + r.id + ')">Accept</button>' +
                '<button class="btn light small" onclick="declineReq(' + r.id + ')">Decline</button>' +
              '</div>' +
            '</div>';
  });
  listEl.innerHTML = html;
}

function renderTimeline() {
  var box = document.getElementById("timeline");
  var myDonations = getDonations().filter(function (d) { return d.userId === user.id; });
  myDonations.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

  if (myDonations.length === 0) {
    box.innerHTML = '<p class="muted" style="padding: 6px 0;">No past donations added yet.</p>';
    return;
  }

  var html = "";
  myDonations.slice(0, 3).forEach(function (d) {
    var statusClass = d.status === "verified" ? "chip-green" : "chip-medium";
    html += '<div class="timeline-item">' +
              '<b>' + esc(d.date) + '</b>' +
              '<span>' + esc(d.hospital) + ' <span class="chip ' + statusClass + '" style="font-size:11px; margin-left:6px;">' + esc(d.status) + '</span></span>' +
            '</div>';
  });
  box.innerHTML = html;
}

window.acceptReq = function (id) {
  var reqs = getRequests();
  var r = reqs.find(function (item) { return item.id === id; });
  if (!r) return;

  r.status = "accepted";
  r.acceptedBy = user.id;
  saveRequests(reqs);

  var recipient = findUser(r.recipientId);
  var recInfo = recipient ? recipient.name + " (" + recipient.phone + ")" : "the recipient";
  addNotif(r.recipientId, user.name + " (" + user.phone + ") accepted your " + r.bloodGroup + " blood request!");

  toast("Request accepted! Recipient contact: " + (recipient ? recipient.phone : "Saved"), "success");
  openModal('<h3>Request Accepted!</h3>' +
            '<p style="margin: 10px 0;">Please contact <b>' + esc(recInfo) + '</b> to coordinate donation.</p>' +
            '<p>Hospital: <b>' + esc(r.hospital) + '</b><br>Required units: <b>' + r.units + ' unit(s)</b></p>' +
            '<div style="text-align:right; margin-top:16px;"><button class="btn small" onclick="closeModal()">Close</button></div>');

  renderMatchingRequests();
  renderKPIs();
};

window.declineReq = function (id) {
  toast("Request hidden from view", "info");
  renderMatchingRequests();
};

renderKPIs();
renderMatchingRequests();
renderTimeline();
