// find-donors.js - works with find-donors.html

var user = initPage("recipient");

fillSelect("group", GROUPS, user.bloodGroup);
fillSelect("area", AREAS, user.area);

var shownDonors = [];   // donors currently on the screen

function searchDonors() {
  var group = document.getElementById("group").value;
  var area = document.getElementById("area").value;
  var onlyAvailable = document.getElementById("onlyAvailable").checked;

  // same blood group + same area
  var donors = getUsers().filter(function (u) {
    return u.role === "donor" && u.status === "active" && u.bloodGroup === group && u.area === area;
  });

  // toggle ON = only donors who are available AND eligible (3 months passed)
  if (onlyAvailable) {
    donors = donors.filter(function (u) { return u.available && isEligible(u); });
  }

  // never donated / oldest donation first
  donors.sort(function (a, b) {
    return (a.lastDonated || "") < (b.lastDonated || "") ? -1 : 1;
  });
  shownDonors = donors;

  document.getElementById("resultTitle").textContent =
    donors.length + " donor" + (donors.length === 1 ? "" : "s") + " found in " + area;

  var html = "";
  donors.forEach(function (d) {
    var canRequest = d.available && isEligible(d);
    html += '<div class="card donor-card">' +
      '<div class="donor-top"><div class="blood-badge">' + d.bloodGroup + "</div>" +
        "<div><b>" + esc(d.name) + "</b><small>&#128205; " + d.area + ", Dhaka</small></div></div>" +
      '<div class="chips">' +
        (d.available ? '<span class="chip chip-green">Available</span>' : '<span class="chip chip-grey">Unavailable</span>') +
        (isEligible(d) ? '<span class="chip chip-blue">Eligible</span>' : '<span class="chip chip-medium">Not eligible yet</span>') +
      "</div>" +
      '<p class="last">Last donated: ' + lastDonatedText(d) + "</p>" +
      '<div class="donor-bottom"><span>&#128274; Phone after accept</span>' +
        '<span><button class="link-btn" data-report="' + d.id + '">Report</button>' +
        '<button class="btn small" data-id="' + d.id + '"' + (canRequest ? "" : " disabled") + ">Request Blood</button></span></div>" +
    "</div>";
  });
  document.getElementById("donorGrid").innerHTML = html || '<p class="empty">No donors found. Try another area, or post an area-wide request.</p>';
}

document.getElementById("searchForm").addEventListener("submit", function (e) {
  e.preventDefault();
  searchDonors();
});
searchDonors();

// ----- click "Request Blood" -> popup form -----
document.getElementById("donorGrid").addEventListener("click", function (e) {
  // "Report" link: tell the admin about a fake donor
  var reportId = e.target.getAttribute("data-report");
  if (reportId) {
    var bad = findUser(reportId);
    openModal(
      "<h3>Report " + esc(bad.name) + "</h3>" +
      "<p>Tell the admin what is wrong with this donor.</p>" +
      '<div id="msg" class="msg"></div>' +
      '<form id="reportForm" novalidate>' +
        '<div class="form-group"><textarea id="reason" rows="4" placeholder="Example: the phone is always off, fake profile..."></textarea></div>' +
        '<div class="modal-actions"><button type="button" class="btn light" id="cancelBtn">Cancel</button><button type="submit" class="btn">Send report</button></div>' +
      "</form>"
    );
    document.getElementById("cancelBtn").onclick = closeModal;
    document.getElementById("reportForm").onsubmit = function (ev) {
      ev.preventDefault();
      var reason = document.getElementById("reason").value.trim();
      if (reason.length < 10) {
        showMsg("Write at least 10 letters so the admin can understand", "error");
        return;
      }
      addReport(user.id, bad.id, reason);
      closeModal();
      toast("Report sent to the admin");
    };
    return;
  }

  var id = e.target.getAttribute("data-id");
  if (!id) return;
  var donor = findUser(id);

  openModal(
    "<h3>Request blood from " + esc(donor.name) + "</h3>" +
    "<p>" + donor.bloodGroup + " donor in " + donor.area + ". Only this donor will be notified.</p>" +
    '<div id="msg" class="msg"></div>' +
    '<form id="directForm" novalidate>' +
      '<div class="form-group"><label>Hospital</label><input type="text" id="hospital" placeholder="City Care Hospital"></div>' +
      '<div class="row-2">' +
        '<div class="form-group"><label>Units needed</label><select id="units"><option>1</option><option>2</option><option>3</option><option>4</option></select></div>' +
        '<div class="form-group"><label>Needed within</label><select id="hours"><option value="6">6 hours</option><option value="24">24 hours</option><option value="72">3 days</option></select></div>' +
      "</div>" +
      '<div class="modal-actions"><button type="button" class="btn light" id="cancelBtn">Cancel</button><button type="submit" class="btn">Send request</button></div>' +
    "</form>"
  );

  document.getElementById("cancelBtn").onclick = closeModal;
  document.getElementById("directForm").onsubmit = function (ev) {
    ev.preventDefault();
    var hospital = document.getElementById("hospital").value.trim();
    if (hospital.length < 3) {
      showMsg("Enter the hospital name", "error");
      return;
    }
    var result = createRequest(user, {
      bloodGroup: donor.bloodGroup,
      area: donor.area,
      hospital: hospital,
      units: Number(document.getElementById("units").value),
      hours: Number(document.getElementById("hours").value),
      targetDonorId: donor.id
    });
    if (!result.ok) {
      showMsg(result.error, "error");
      return;
    }
    closeModal();
    toast("Request sent to " + donor.name);
  };
});
