// post-request.js - works with post-request.html

var user = initPage("recipient");

fillSelect("group", GROUPS, user.bloodGroup);
fillSelect("area", AREAS, user.area);

// right side: how many people will get the alert
function updateAlerts() {
  var group = document.getElementById("group").value;
  var area = document.getElementById("area").value;
  var donors = matchingDonors(group, area).length;
  var banks = bloodBanks(area).length;

  document.getElementById("alertBadge").textContent = group;
  document.getElementById("alertDonors").textContent = donors + " available " + group + " donor" + (donors === 1 ? "" : "s");
  document.getElementById("alertDonorsSub").textContent = "Eligible donors in " + area;
  document.getElementById("alertBanks").textContent = banks + " blood bank" + (banks === 1 ? "" : "s");
  document.getElementById("alertBanksSub").textContent = "All hospital blood banks in " + area;
}
document.getElementById("group").addEventListener("change", updateAlerts);
document.getElementById("area").addEventListener("change", updateAlerts);
updateAlerts();

document.getElementById("postForm").addEventListener("submit", function (e) {
  e.preventDefault();

  var hospital = document.getElementById("hospital").value.trim();
  var units = Number(document.getElementById("units").value);
  var hours = Number(document.querySelector('input[name="hours"]:checked').value);

  if (hospital.length < 3) {
    showMsg("Enter the hospital name", "error");
    return;
  }
  if (!(units >= 1 && units <= 10)) {
    showMsg("Units must be between 1 and 10", "error");
    return;
  }

  var result = createRequest(user, {
    bloodGroup: document.getElementById("group").value,
    area: document.getElementById("area").value,
    hospital: hospital,
    units: units,
    hours: hours,
    targetDonorId: null      // null = area-wide request
  });

  if (!result.ok) {
    showMsg(result.error, "error");
    return;
  }
  showMsg("Request sent! Matching donors and blood banks were alerted.", "success");
  setTimeout(function () { window.location.href = "my-requests.html"; }, 1200);
});
