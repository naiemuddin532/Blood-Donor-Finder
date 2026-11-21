// recipient-dashboard.js - works with recipient-dashboard.html

var user = initPage("recipient");   // protects the page + builds the top bar

document.getElementById("welcome").textContent = "Welcome back, " + user.name.split(" ")[0];

// ----- my requests -----
var all = getRequests().filter(function (r) { return r.recipientId === user.id; });
all.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

function count(status) {
  return all.filter(function (r) { return r.status === status; }).length;
}

document.getElementById("kActive").textContent = count("open") + count("accepted");
document.getElementById("kActiveSub").textContent = count("open") + " open · " + count("accepted") + " accepted";
document.getElementById("kAccepted").textContent = count("accepted");
document.getElementById("kFulfilled").textContent = count("fulfilled");
document.getElementById("kExpired").textContent = count("expired");

// ----- recent requests (latest 3) -----
var html = "";
all.slice(0, 3).forEach(function (r) {
  var line = r.status === "accepted" && findUser(r.acceptedBy)
    ? "Accepted by " + esc(findUser(r.acceptedBy).name)
    : neededText(r);
  html += '<div class="list-row">' +
            '<div class="blood-badge">' + r.bloodGroup + "</div>" +
            '<div class="grow"><b>' + r.bloodGroup + " · " + r.units + " unit" + (r.units > 1 ? "s" : "") + " · " + esc(r.hospital) + "</b><small>" + line + "</small></div>" +
            '<div class="chips">' + urgencyChip(r.urgency) + statusChip(r.status) + "</div>" +
          "</div>";
});
document.getElementById("recentList").innerHTML = html || '<p class="empty">No requests yet. Post your first request.</p>';

// ----- notifications -----
var notifs = getNotifs().filter(function (n) { return n.userId === user.id; });
notifs.sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
var unread = notifs.filter(function (n) { return !n.read; }).length;

var nHtml = "";
notifs.slice(0, 4).forEach(function (n) {
  nHtml += '<div class="list-row"><div class="grow"><b>' + esc(n.msg) + "</b><small>" + timeAgo(n.at) + "</small></div></div>";
});
document.getElementById("notifList").innerHTML = nHtml || '<p class="empty">No notifications yet.</p>';

var newChip = document.getElementById("newCount");
if (unread > 0) newChip.textContent = unread + " new"; else newChip.style.display = "none";
