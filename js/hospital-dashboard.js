var user = initPage("staff");

var areaName = user.area || "Mirpur";
document.getElementById("staffSubtitle").textContent = "City Care Blood Bank · " + areaName;
document.getElementById("staffBadge").textContent = "City Care Hospital (" + areaName + ")";

document.querySelectorAll(".tabs button.tab").forEach(function (btn) {
  btn.addEventListener("click", function () {
    var tabId = btn.getAttribute("data-tab");
    if (!tabId) return;

    btn.parentElement.querySelectorAll(".tab").forEach(function (b) { b.classList.remove("active"); });
    btn.classList.add("active");

    document.querySelectorAll(".tab-content").forEach(function (c) { c.classList.remove("active"); });
    var target = document.getElementById(tabId);
    if (target) target.classList.add("active");
  });
});

function updateDashboard() {
  var stock = getStock();
  var total = 0, lowCount = 0, lowGroups = [];
  for (var group in stock) {
    var units = stock[group];
    total += units;
    if (units < 8) {
      lowCount++;
      lowGroups.push(group + " (" + units + " units)");
    }
  }

  var areaRequests = getRequests().filter(function (r) {
    return r.status === "open" && (!user.area || !r.area || r.area === user.area);
  });

  var pendingVerif = getDonations().filter(function (d) { return d.status === "pending"; });

  document.getElementById("dashTotal").textContent = total;
  document.getElementById("dashLow").textContent = lowCount;
  document.getElementById("dashRequests").textContent = areaRequests.length;
  document.getElementById("dashPending").textContent = pendingVerif.length;
  document.getElementById("verifBadge").textContent = pendingVerif.length;

  var alertEl = document.getElementById("dashAlertText");
  if (lowCount > 0) {
    alertEl.textContent = "Urgent Reserve Warning: " + lowGroups.join(", ") + " are below the minimum safety threshold (8 units)! Consider scheduling a blood drive.";
    alertEl.style.display = "block";
  } else {
    alertEl.textContent = "All blood stock levels are currently healthy and sufficient.";
    alertEl.style.display = "block";
  }
}

function renderStock() {
  var stock = getStock();
  var tbody = document.getElementById("stockTableBody");
  tbody.innerHTML = "";
  var lowGroups = [];

  for (var grp in stock) {
    var units = stock[grp];
    var badgeClass = units < 5 ? "badge-red" : units < 8 ? "badge-amber" : "badge-green";
    var statusText = units < 5 ? "Critical" : units < 8 ? "Low" : "Healthy";

    if (units < 8) lowGroups.push(grp);

    var tr = document.createElement("tr");
    tr.innerHTML = "<td><b>" + grp + "</b></td>" +
                   "<td>" + units + " units</td>" +
                   "<td><span class='badge " + badgeClass + "'>" + statusText + "</span></td>";
    tbody.appendChild(tr);
  }

  var stockAlertEl = document.getElementById("stockAlert");
  if (lowGroups.length > 0) {
    stockAlertEl.textContent = "Low Stock Alert: Groups " + lowGroups.join(", ") + " need replenishment.";
    stockAlertEl.style.display = "block";
  } else {
    stockAlertEl.textContent = "All blood stock levels are healthy across all groups.";
    stockAlertEl.style.display = "block";
  }
  updateDashboard();
}

document.getElementById("stockForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var grpInput = document.getElementById("stockGroup");
  var unitsInput = document.getElementById("stockUnits");
  var grpErr = document.getElementById("stockGroupErr");
  var unitsErr = document.getElementById("stockUnitsErr");
  var success = document.getElementById("stockSuccess");

  grpErr.textContent = ""; unitsErr.textContent = ""; success.textContent = "";
  grpInput.classList.remove("errorBorder", "successBorder");
  unitsInput.classList.remove("errorBorder", "successBorder");

  var valid = true;
  if (!grpInput.value) {
    grpErr.textContent = "Please select a blood group.";
    grpInput.classList.add("errorBorder");
    valid = false;
  } else { grpInput.classList.add("successBorder"); }

  var val = Number(unitsInput.value);
  if (unitsInput.value === "" || isNaN(val) || !Number.isInteger(val) || val < 0) {
    unitsErr.textContent = "Enter a valid positive number.";
    unitsInput.classList.add("errorBorder");
    valid = false;
  } else { unitsInput.classList.add("successBorder"); }

  if (!valid) return;

  var stock = getStock();
  stock[grpInput.value] = val;
  saveStock(stock);

  success.textContent = "Stock updated: " + grpInput.value + " is now " + val + " units.";
  toast("Stock saved!", "success");
  renderStock();
});

var currentReqFilter = "All";

document.querySelectorAll("#requestFilterBtns .tab").forEach(function (btn) {
  btn.addEventListener("click", function () {
    document.querySelectorAll("#requestFilterBtns .tab").forEach(function (b) { b.classList.remove("active"); });
    btn.classList.add("active");
    currentReqFilter = btn.getAttribute("data-filter");
    renderRequests();
  });
});

function renderRequests() {
  var container = document.getElementById("requestsList");
  container.innerHTML = "";

  var reqs = getRequests().filter(function (r) {
    return r.status === "open" && (!user.area || !r.area || r.area === user.area);
  });

  if (currentReqFilter !== "All") {
    reqs = reqs.filter(function (r) { return r.urgency === currentReqFilter; });
  }

  if (reqs.length === 0) {
    container.innerHTML = '<p class="muted" style="padding:12px 0;">No matching requests in this category.</p>';
    return;
  }

  reqs.forEach(function (r) {
    var recipient = findUser(r.recipientId);
    var div = document.createElement("div");
    div.className = "item-row";
    div.innerHTML = "<div>" +
                      "<b>" + esc(r.bloodGroup) + " &middot; " + r.units + " unit" + (r.units > 1 ? "s" : "") + "</b>" +
                      "<br><small class='muted'>" + esc(r.hospital) + " &middot; " + neededText(r) + " &middot; Contact: " + (recipient ? esc(recipient.name) : "Patient") + "</small>" +
                    "</div>" +
                    "<div>" + urgencyChip(r.urgency) + "</div>";
    container.appendChild(div);
  });
}

function renderVerifications() {
  var pendingDiv = document.getElementById("pendingList");
  var logDiv = document.getElementById("verifiedList");
  pendingDiv.innerHTML = ""; logDiv.innerHTML = "";

  var allDonations = getDonations();
  var pending = allDonations.filter(function (d) { return d.status === "pending"; });
  var verified = allDonations.filter(function (d) { return d.status === "verified"; });

  if (pending.length === 0) {
    pendingDiv.innerHTML = '<p class="muted" style="padding:12px 0;">No donations awaiting verification.</p>';
  }

  pending.forEach(function (d) {
    var div = document.createElement("div");
    div.className = "item-row";
    div.innerHTML = "<div>" +
                      "<b>" + esc(d.donorName || "Donor") + " (" + esc(d.bloodGroup || "Blood") + ")</b>" +
                      "<br><small class='muted'>Donated on " + esc(d.date) + " &middot; " + esc(d.hospital) + "</small>" +
                    "</div>" +
                    "<div style='display:flex; gap:6px;'>" +
                      "<button class='btn small btn-verify' onclick='verifyDonation(" + d.id + ")'>Verify</button>" +
                      "<button class='btn small btn-reject' onclick='rejectDonation(" + d.id + ")'>Reject</button>" +
                    "</div>";
    pendingDiv.appendChild(div);
  });

  verified.slice(0, 8).forEach(function (v) {
    var li = document.createElement("li");
    li.style.padding = "8px 0";
    li.style.borderBottom = "1px solid #f0f1f6";
    li.innerHTML = "<span class='chip chip-green' style='font-size:11px; margin-right:6px;'>Verified</span>" +
                   "<b>" + esc(v.donorName || "Donor") + "</b> (" + esc(v.bloodGroup || "") + ") &middot; " +
                   "<small class='muted'>" + esc(v.date) + " at " + esc(v.hospital) + "</small>";
    logDiv.appendChild(li);
  });

  updateDashboard();
}

window.verifyDonation = function (id) {
  var donations = getDonations();
  var d = donations.find(function (item) { return item.id === id; });
  if (!d) return;

  d.status = "verified";
  d.verifiedBy = user.name || "Hospital Staff";
  saveDonations(donations);

  if (d.userId) {
    var donorUser = findUser(d.userId);
    if (donorUser) {
      donorUser.lastDonated = d.date;
      saveUser(donorUser);
      addNotif(d.userId, "Your donation at " + d.hospital + " on " + d.date + " has been verified by " + user.name + "! Next eligible date updated.");
    }
  }

  var stock = getStock();
  if (d.bloodGroup && stock[d.bloodGroup] !== undefined) {
    stock[d.bloodGroup] += 1;
    saveStock(stock);
    renderStock();
  }

  toast("Donation verified! Added 1 unit to " + d.bloodGroup + " stock.", "success");
  renderVerifications();
};

window.rejectDonation = function (id) {
  var donations = getDonations();
  var d = donations.find(function (item) { return item.id === id; });
  if (!d) return;

  d.status = "rejected";
  d.verifiedBy = user.name || "Hospital Staff";
  saveDonations(donations);

  toast("Donation marked as rejected.", "info");
  renderVerifications();
};

function renderCamps() {
  var list = document.getElementById("campsList");
  list.innerHTML = "";
  var camps = getCamps();

  if (camps.length === 0) {
    list.innerHTML = '<p class="muted" style="padding:12px 0;">No camps scheduled.</p>';
    return;
  }

  camps.forEach(function (c) {
    var mapUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(c.loc);
    var div = document.createElement("div");
    div.className = "item-row";
    div.innerHTML = "<div>" +
                      "<b>" + esc(c.title) + "</b>" +
                      "<br><small class='muted'>" + esc(c.date) + " &middot; " + esc(c.loc) + "</small>" +
                    "</div>" +
                    "<a class='btn small light' href='" + mapUrl + "' target='_blank'>Map</a>";
    list.appendChild(div);
  });
}

document.getElementById("campForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var title = document.getElementById("campTitle");
  var date = document.getElementById("campDate");
  var loc = document.getElementById("campLoc");
  var success = document.getElementById("campSuccess");

  document.getElementById("campTitleErr").textContent = "";
  document.getElementById("campDateErr").textContent = "";
  document.getElementById("campLocErr").textContent = "";
  success.textContent = "";

  [title, date, loc].forEach(function (el) { el.classList.remove("errorBorder", "successBorder"); });

  var valid = true;
  if (title.value.trim().length < 3) {
    document.getElementById("campTitleErr").textContent = "Title must be at least 3 characters.";
    title.classList.add("errorBorder"); valid = false;
  } else { title.classList.add("successBorder"); }

  if (!date.value.trim()) {
    document.getElementById("campDateErr").textContent = "Please provide date and time.";
    date.classList.add("errorBorder"); valid = false;
  } else { date.classList.add("successBorder"); }

  if (loc.value.trim().length < 3) {
    document.getElementById("campLocErr").textContent = "Enter a valid location.";
    loc.classList.add("errorBorder"); valid = false;
  } else { loc.classList.add("successBorder"); }

  if (!valid) return;

  var camps = getCamps();
  camps.unshift({
    id: Date.now(),
    title: title.value.trim(),
    date: date.value.trim(),
    loc: loc.value.trim(),
    hospital: user.name || "City Care Blood Bank"
  });
  saveCamps(camps);

  notifyRole("donor", "New blood donation camp announced: " + title.value.trim() + " (" + loc.value.trim() + ")");

  success.textContent = "Donation drive published and notified to area donors!";
  toast("Donation drive published!", "success");
  this.reset();
  [title, date, loc].forEach(function (el) { el.classList.remove("successBorder"); });
  renderCamps();
});

renderStock();
renderRequests();
renderVerifications();
renderCamps();
updateDashboard();
