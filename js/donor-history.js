var user = initPage("donor");

var todayStr = new Date().toISOString().slice(0, 10);
document.getElementById("donationDate").max = todayStr;

document.getElementById("donorArea").textContent = user.area || "Mirpur";

function renderDonations() {
  var tbody = document.getElementById("donationTable");
  var allDonations = getDonations().filter(function (d) { return d.userId === user.id; });

  allDonations.sort(function (a, b) {
    return new Date(b.date) - new Date(a.date);
  });

  if (allDonations.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="muted" style="text-align:center; padding:14px;">No donations recorded yet.</td></tr>';
  } else {
    var html = "";
    allDonations.forEach(function (d) {
      var chipClass = d.status === "verified" ? "chip-green" : d.status === "pending" ? "chip-medium" : "chip-grey";
      html += '<tr>' +
                '<td><b>' + esc(d.date) + '</b></td>' +
                '<td>' + esc(d.hospital) + '</td>' +
                '<td>' + esc(d.verifiedBy || "-") + '</td>' +
                '<td><span class="chip ' + chipClass + '">' + esc(d.status) + '</span></td>' +
              '</tr>';
    });
    tbody.innerHTML = html;
  }

  var verified = allDonations.filter(function (d) { return d.status === "verified"; });
  var pending = allDonations.filter(function (d) { return d.status === "pending"; });

  document.getElementById("totalCount").textContent = allDonations.length;
  document.getElementById("totalNote").textContent = verified.length + " verified, " + pending.length + " pending";

  if (verified.length > 0) {
    document.getElementById("lastDate").textContent = verified[0].date;
    document.getElementById("lastPlace").textContent = verified[0].hospital;

    var next = new Date(verified[0].date);
    next.setMonth(next.getMonth() + 3);

    if (next <= new Date()) {
      document.getElementById("nextDate").textContent = "Eligible now";
    } else {
      document.getElementById("nextDate").textContent = next.toISOString().slice(0, 10);
    }
  } else if (user.lastDonated) {
    document.getElementById("lastDate").textContent = user.lastDonated;
    document.getElementById("lastPlace").textContent = "Past record";
    var nextU = new Date(user.lastDonated);
    nextU.setMonth(nextU.getMonth() + 3);
    document.getElementById("nextDate").textContent = nextU <= new Date() ? "Eligible now" : nextU.toISOString().slice(0, 10);
  } else {
    document.getElementById("lastDate").textContent = "None";
    document.getElementById("lastPlace").textContent = "";
    document.getElementById("nextDate").textContent = "Eligible now";
  }
}

document.getElementById("donationForm").addEventListener("submit", function (e) {
  e.preventDefault();

  var dateInput = document.getElementById("donationDate");
  var hospInput = document.getElementById("hospital");
  var dateErr = document.getElementById("dateError");
  var hospErr = document.getElementById("hospitalError");
  var successEl = document.getElementById("formSuccess");

  dateErr.textContent = "";
  hospErr.textContent = "";
  successEl.textContent = "";
  dateInput.classList.remove("errorBorder", "successBorder");
  hospInput.classList.remove("errorBorder", "successBorder");

  var valid = true;
  if (!dateInput.value) {
    dateErr.textContent = "Please choose a donation date.";
    dateInput.classList.add("errorBorder");
    valid = false;
  } else if (dateInput.value > todayStr) {
    dateErr.textContent = "Date cannot be in the future.";
    dateInput.classList.add("errorBorder");
    valid = false;
  } else {
    dateInput.classList.add("successBorder");
  }

  if (!hospInput.value) {
    hospErr.textContent = "Please select a hospital or camp.";
    hospInput.classList.add("errorBorder");
    valid = false;
  } else {
    hospInput.classList.add("successBorder");
  }

  if (!valid) return;

  var all = getDonations();
  var newDonation = {
    id: Date.now(),
    userId: user.id,
    donorName: user.name,
    bloodGroup: user.bloodGroup || "B+",
    date: dateInput.value,
    hospital: hospInput.value,
    verifiedBy: "-",
    status: "pending"
  };

  all.unshift(newDonation);
  saveDonations(all);

  notifyRole("staff", "New donation record from " + user.name + " (" + user.bloodGroup + ") awaiting verification.");

  successEl.textContent = "Donation logged successfully! Pending verification by hospital staff.";
  toast("Donation logged! Staff will verify it.", "success");
  this.reset();
  dateInput.classList.remove("successBorder");
  hospInput.classList.remove("successBorder");

  renderDonations();
});

renderDonations();
