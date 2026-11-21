/* common.js - small helpers used by every page.
   Data is saved in the browser (localStorage). Later PHP + MySQL will replace it. */

var GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
var AREAS = ["Mirpur", "Dhanmondi", "Uttara", "Mohammadpur", "Gulshan"];
var MAX_PER_DAY = 3;   // a recipient can post at most 3 requests in 24 hours
var ADMIN_CODE = "NNNT";   // needed to register as admin (PHP will check this on the server)

// Menu of each role (the top bar is built from this)
var MENU = {
  recipient: [
    ["Dashboard", "recipient-dashboard.html"],
    ["Find Donors", "find-donors.html"],
    ["My Requests", "my-requests.html"],
    ["Profile", "profile.html"]
  ],
  donor: [
    ["Dashboard", "donor-dashboard.html"],
    ["Blood Requests", "donor-requests.html"],
    ["Donation History", "donor-history.html"],
    ["Profile", "profile.html"]
  ],
  staff: [
    ["Dashboard", "hospital-dashboard.html"],
    ["Profile", "profile.html"]
  ],
  admin: [
    ["Overview", "admin-dashboard.html", "\ud83d\udcca"],
    ["Users", "admin-users.html", "\ud83d\udc65"],
    ["Reports", "admin-reports.html", "\ud83d\udee1\ufe0f"],
    ["Analytics", "admin-analytics.html", "\ud83d\udcc8"],
    ["Notices", "admin-notices.html", "\ud83d\udce2"]
  ]
};

// Where each role goes after login
var HOME = {
  recipient: "recipient-dashboard.html",
  donor: "donor-dashboard.html",
  staff: "hospital-dashboard.html",
  admin: "admin-dashboard.html"
};

/* ---------------- read / write data ---------------- */

function readData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}
function writeData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsers()    { seedData(); return readData("bdf_users"); }
function saveUsers(a)  { writeData("bdf_users", a); }
function getRequests() { seedData(); return readData("bdf_requests"); }
function saveRequests(a) { writeData("bdf_requests", a); }
function getNotifs()   { seedData(); return readData("bdf_notifs"); }
function getReports()  { seedData(); return readData("bdf_reports"); }
function saveReports(a) { writeData("bdf_reports", a); }
function getNotices()  { seedData(); return readData("bdf_notices"); }
function saveNotices(a) { writeData("bdf_notices", a); }
function saveNotifs(a) { writeData("bdf_notifs", a); }
function getDonations()   { seedData(); return readData("bdf_donations"); }
function saveDonations(a) { writeData("bdf_donations", a); }
function getStock()       { seedData(); return JSON.parse(localStorage.getItem("bdf_stock")) || {}; }
function saveStock(a)     { localStorage.setItem("bdf_stock", JSON.stringify(a)); }
function getCamps()       { seedData(); return readData("bdf_camps"); }
function saveCamps(a)     { writeData("bdf_camps", a); }

function findUser(id) {
  var users = getUsers();
  for (var i = 0; i < users.length; i++) {
    if (users[i].id == id) return users[i];
  }
  return null;
}

function saveUser(user) {
  var users = getUsers();
  for (var i = 0; i < users.length; i++) {
    if (users[i].id == user.id) users[i] = user;
  }
  saveUsers(users);
}

/* ---------------- demo data (created only once) ---------------- */

function daysAgo(n)    { return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10); }
function hoursFromNow(h) { return new Date(Date.now() + h * 3600000).toISOString(); }

function demoUsers() {
  var U = function (id, name, email, phone, role, bg, area, last, avail) {
    return { id: id, name: name, email: email, phone: phone, password: "12345678", role: role,
             bloodGroup: bg, area: area, status: "active", available: avail,
             lastDonated: last, createdAt: "2026-09-10" };
  };
  return [
    U(1,  "Karim Rahman",   "karim@example.com",  "01700001001", "donor",     "B+", "Mirpur",      daysAgo(150), true),
    U(2,  "Rahim Uddin",    "rahim@example.com",  "01800001002", "recipient", "B+", "Mirpur",      null, true),
    U(3,  "Rafiq Hasan",    "rafiq@citycare.org", "01700001003", "staff",     "",   "Mirpur",      null, true),
    U(4,  "Admin",          "admin@example.com",  "01700001004", "admin",     "",   "",            null, true),
    U(5,  "Sadia Akter",    "sadia@example.com",  "01700001005", "donor",     "B+", "Mirpur",      daysAgo(120), true),
    U(6,  "Imran Hossain",  "imran@example.com",  "01700001006", "donor",     "B+", "Mirpur",      null, true),
    U(7,  "Nusrat Jahan",   "nusrat@example.com", "01700001007", "donor",     "B+", "Mirpur",      daysAgo(180), true),
    U(8,  "Tanvir Ahmed",   "tanvir@example.com", "01700001008", "donor",     "B+", "Mirpur",      daysAgo(100), true),
    U(9,  "Farhana Islam",  "farhana@example.com","01700001009", "donor",     "B+", "Mirpur",      daysAgo(240), true),
    U(10, "Hasan Mahmud",   "hasan@example.com",  "01700001010", "donor",     "B+", "Mirpur",      daysAgo(20),  true),
    U(11, "Arif Chowdhury", "arif@example.com",   "01700001011", "donor",     "A-", "Uttara",      daysAgo(200), true),
    U(12, "Tariq Aziz",     "tariq@example.com",  "01700001012", "donor",     "O+", "Gulshan",     daysAgo(90),  true),
    U(13, "Mina Begum",     "mina@example.com",   "01700001013", "donor",     "A+", "Dhanmondi",   daysAgo(150), true),
    U(14, "Jamal Uddin",    "jamal@example.com",  "01700001014", "donor",     "O-", "Mirpur",      daysAgo(300), false)
  ];
}

// delete all saved data; the demo data is created again on the next page load
function resetDemoData() {
  localStorage.removeItem("bdf_users");
  localStorage.removeItem("bdf_requests");
  localStorage.removeItem("bdf_notifs");
  localStorage.removeItem("bdf_reports");
  localStorage.removeItem("bdf_notices");
  localStorage.removeItem("bdf_donations");
  localStorage.removeItem("bdf_stock");
  localStorage.removeItem("bdf_camps");
  localStorage.removeItem("bdf_admin_seeded");
  localStorage.removeItem("bdf_currentUser");
  window.name = "";
}

function seedData() {
  // saved data that is broken (not a list) is thrown away
  ["bdf_users", "bdf_requests", "bdf_notifs", "bdf_reports", "bdf_notices", "bdf_donations", "bdf_camps"].forEach(function (key) {
    try {
      if (localStorage.getItem(key) && !Array.isArray(JSON.parse(localStorage.getItem(key)))) localStorage.removeItem(key);
    } catch (e) { localStorage.removeItem(key); }
  });

  if (!localStorage.getItem("bdf_users")) writeData("bdf_users", demoUsers());

  // if saved data has none of the demo accounts (old/broken data), add them
  var users = readData("bdf_users"), demo = demoUsers();
  var hasDemo = users.some(function (u) {
    return demo.some(function (d) { return d.email === u.email; });
  });
  if (!hasDemo) writeData("bdf_users", users.concat(demo));

  if (!localStorage.getItem("bdf_requests")) {
    var R = function (id, g, hospital, units, hours, urgency, status, neededH, agoH, acceptedBy) {
      return { id: id, recipientId: 2, bloodGroup: g, area: "Mirpur", hospital: hospital, units: units,
               hours: hours, urgency: urgency, status: status, neededBy: hoursFromNow(neededH),
               createdAt: hoursFromNow(-agoH), targetDonorId: null, acceptedBy: acceptedBy, rating: null };
    };
    writeData("bdf_requests", [
      R(1, "B+", "City Care Hospital",  2, 6,  "high",   "open",      5,   0.2, null),
      R(2, "B+", "Green Life Clinic",   1, 24, "medium", "accepted",  20,  30,  1),
      R(3, "B+", "Popular Diagnostic",  1, 72, "low",    "fulfilled", -60, 200, 5),
      R(4, "A+", "Square Hospital",     2, 24, "medium", "expired",   -48, 100, null),
      R(5, "B+", "City Care Hospital",  1, 72, "low",    "cancelled", 40,  120, null)
    ]);
  }

  if (!localStorage.getItem("bdf_notifs")) {
    var now = new Date().toISOString();
    writeData("bdf_notifs", [
      { id: 1, userId: 2, msg: "Karim R. accepted your B+ request",   read: false, at: hoursFromNow(-0.1) },
      { id: 2, userId: 2, msg: "Your B+ request is still open",       read: false, at: hoursFromNow(-0.7) },
      { id: 3, userId: 2, msg: "Sadia A. confirmed the donation",     read: true,  at: hoursFromNow(-200) },
      { id: 4, userId: 1, msg: "Urgent: B+ blood needed at City Care Hospital (Mirpur)", read: false, at: now }
    ]);
  }

  // accounts for the admin to test (added once, only if the email is not used)
  if (!localStorage.getItem("bdf_admin_seeded")) {
    var list = readData("bdf_users");
    var extras = [
      { id: 21, name: "Salma Khatun",  email: "salma@greenlife.org", phone: "01700001021", password: "12345678", role: "staff", bloodGroup: "",   area: "Dhanmondi", status: "pending", available: true,  lastDonated: null, createdAt: "2026-11-15" },
      { id: 22, name: "Nabil Hasan",   email: "nabil@example.com",   phone: "01700001022", password: "12345678", role: "donor", bloodGroup: "A-", area: "Uttara",    status: "pending", available: true,  lastDonated: null, createdAt: "2026-11-16" },
      { id: 23, name: "Shuvo Das",     email: "shuvo@example.com",   phone: "01700001023", password: "12345678", role: "donor", bloodGroup: "O+", area: "Gulshan",   status: "blocked", available: false, lastDonated: null, createdAt: "2026-10-01" }
    ];
    extras.forEach(function (x) {
      var used = list.some(function (u) { return u.email === x.email || u.id === x.id; });
      if (!used) list.push(x);
    });
    writeData("bdf_users", list);
    localStorage.setItem("bdf_admin_seeded", "1");
  }

  if (!localStorage.getItem("bdf_reports")) {
    writeData("bdf_reports", [
      { id: 1, reportedId: 6,  by: 2, reason: "Said he would come to the hospital but the phone is always switched off.", status: "open", at: hoursFromNow(-30) },
      { id: 2, reportedId: 12, by: 2, reason: "This donor profile looks fake. The blood group does not match what he told me.", status: "open", at: hoursFromNow(-50) },
      { id: 3, reportedId: 10, by: 2, reason: "Asked for money before donating blood.", status: "open", at: hoursFromNow(-90) }
    ]);
  }

  if (!localStorage.getItem("bdf_notices")) {
    writeData("bdf_notices", [
      { id: 1, title: "Welcome to Blood Donor Finder", msg: "Please keep your profile and availability up to date.", audience: "all", at: hoursFromNow(-300) }
    ]);
  }

  if (!localStorage.getItem("bdf_donations")) {
    writeData("bdf_donations", [
      { id: 1, userId: 1, donorName: "Karim Rahman", bloodGroup: "B+", date: daysAgo(150), hospital: "City Care Hospital", verifiedBy: "Rafiq Hasan", status: "verified" },
      { id: 2, userId: 1, donorName: "Karim Rahman", bloodGroup: "B+", date: daysAgo(280), hospital: "Green Life Clinic", verifiedBy: "Rafiq Hasan", status: "verified" },
      { id: 3, userId: 1, donorName: "Karim Rahman", bloodGroup: "B+", date: daysAgo(410), hospital: "Donation camp, Mirpur", verifiedBy: "Rafiq Hasan", status: "verified" },
      { id: 4, userId: 1, donorName: "Karim Rahman", bloodGroup: "B+", date: daysAgo(15), hospital: "Popular Diagnostic", verifiedBy: "-", status: "pending" },
      { id: 5, userId: 7, donorName: "Nusrat Jahan", bloodGroup: "A+", date: daysAgo(20), hospital: "City Care Hospital", verifiedBy: "-", status: "pending" },
      { id: 6, userId: 8, donorName: "Tanvir Ahmed", bloodGroup: "O+", date: daysAgo(22), hospital: "City Care Hospital", verifiedBy: "-", status: "pending" }
    ]);
  }

  if (!localStorage.getItem("bdf_stock")) {
    saveStock({ "A+": 28, "A-": 6, "B+": 31, "B-": 9, "O+": 36, "O-": 4, "AB+": 18, "AB-": 10 });
  }

  if (!localStorage.getItem("bdf_camps")) {
    writeData("bdf_camps", [
      { id: 1, title: "Community Blood Camp", date: "2026-12-05 10:00 AM", loc: "Mirpur Community Hall", hospital: "City Care Hospital" },
      { id: 2, title: "University Donation Drive", date: "2026-12-20 11:00 AM", loc: "Mirpur College", hospital: "City Care Hospital" }
    ]);
  }
}

/* ---------------- small helpers ---------------- */

function esc(text) {
  return String(text == null ? "" : text).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function initials(name) {
  var parts = name.split(" ");
  return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
}

function timeAgo(iso) {
  var min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return min + " min ago";
  if (min < 1440) return Math.round(min / 60) + " hr ago";
  return Math.round(min / 1440) + " days ago";
}

function neededText(r) {
  var h = Math.round((new Date(r.neededBy).getTime() - Date.now()) / 3600000);
  if (r.status !== "open" && r.status !== "accepted") return "Needed " + r.units + " unit(s)";
  if (h < 24) return "Needed within " + Math.max(h, 1) + " hours";
  return "Needed within " + Math.round(h / 24) + " days";
}

// donor can donate again 3 months (90 days) after the last donation
function isEligible(user) {
  if (!user.lastDonated) return true;
  return (Date.now() - new Date(user.lastDonated).getTime()) / 86400000 >= 90;
}

function lastDonatedText(user) {
  if (!user.lastDonated) return "Never donated";
  var days = Math.floor((Date.now() - new Date(user.lastDonated).getTime()) / 86400000);
  if (days < 30) return days + " days ago";
  return Math.floor(days / 30) + " months ago";
}

// 6 hours = High, 24 hours = Medium, 3 days = Low
function urgencyFromHours(h) {
  if (h <= 6) return "high";
  if (h <= 24) return "medium";
  return "low";
}

function urgencyChip(u) {
  var label = { high: "High", medium: "Medium", low: "Low" }[u];
  return '<span class="chip chip-' + u + '">' + label + "</span>";
}

function statusChip(s) {
  var label = s.charAt(0).toUpperCase() + s.slice(1);
  return '<span class="chip st-' + s + '">' + label + "</span>";
}

function fillSelect(id, list, selected) {
  var html = "";
  for (var i = 0; i < list.length; i++) {
    html += '<option value="' + list[i] + '"' + (list[i] === selected ? " selected" : "") + ">" + list[i] + "</option>";
  }
  document.getElementById(id).innerHTML = html;
}

// message box inside the page: <div id="msg" class="msg"></div>
function showMsg(text, type) {
  var box = document.getElementById("msg");
  box.textContent = text;
  box.className = "msg " + type;   // "error" or "success"
}

// small popup message at the bottom
function toast(text, type) {
  var t = document.createElement("div");
  t.className = "toast " + (type || "");
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(function () { t.remove(); }, 3000);
}

// popup window
function openModal(html) {
  var m = document.getElementById("modal");
  if (!m) {
    m = document.createElement("div");
    m.id = "modal";
    m.className = "modal";
    document.body.appendChild(m);
  }
  m.innerHTML = '<div class="modal-box">' + html + "</div>";
  m.style.display = "flex";
  m.onclick = function (e) { if (e.target === m) closeModal(); };
}
function closeModal() {
  var m = document.getElementById("modal");
  if (m) m.style.display = "none";
}

/* ---------------- requests + notifications ---------------- */

// requests whose time has passed become "expired"
function expireRequests() {
  var reqs = getRequests(), changed = false;
  for (var i = 0; i < reqs.length; i++) {
    if (reqs[i].status === "open" && new Date(reqs[i].neededBy).getTime() < Date.now()) {
      reqs[i].status = "expired";
      changed = true;
    }
  }
  if (changed) saveRequests(reqs);
}

function addNotif(userId, msg) {
  var list = getNotifs();
  list.push({ id: Date.now() + Math.floor(Math.random() * 1000), userId: userId, msg: msg, read: false, at: new Date().toISOString() });
  saveNotifs(list);
}

// donors who are available + eligible + same blood group + same area
function matchingDonors(group, area) {
  return getUsers().filter(function (u) {
    return u.role === "donor" && u.status === "active" && u.bloodGroup === group &&
           u.area === area && u.available && isEligible(u);
  });
}
function bloodBanks(area) {
  return getUsers().filter(function (u) {
    return u.role === "staff" && u.status === "active" && u.area === area;
  });
}

// d = { bloodGroup, area, hospital, units, hours, targetDonorId }
function createRequest(user, d) {
  var reqs = getRequests();
  var count = 0, since = Date.now() - 86400000;
  for (var i = 0; i < reqs.length; i++) {
    if (reqs[i].recipientId === user.id && new Date(reqs[i].createdAt).getTime() > since) count++;
  }
  if (count >= MAX_PER_DAY) {
    return { ok: false, error: "You can post only " + MAX_PER_DAY + " requests in 24 hours" };
  }

  reqs.push({
    id: Date.now(), recipientId: user.id, bloodGroup: d.bloodGroup, area: d.area,
    hospital: d.hospital, units: d.units, hours: d.hours, urgency: urgencyFromHours(d.hours),
    status: "open", neededBy: hoursFromNow(d.hours), createdAt: new Date().toISOString(),
    targetDonorId: d.targetDonorId || null, acceptedBy: null, rating: null
  });
  saveRequests(reqs);

  var msg = d.bloodGroup + " blood needed at " + d.hospital + " (" + d.area + ")";
  if (d.targetDonorId) {
    addNotif(d.targetDonorId, "Direct request: " + msg);
  } else {
    var donors = matchingDonors(d.bloodGroup, d.area);
    for (var j = 0; j < donors.length; j++) addNotif(donors[j].id, "Urgent: " + msg);
    var banks = bloodBanks(d.area);
    for (var k = 0; k < banks.length; k++) addNotif(banks[k].id, "New area request: " + msg);
  }
  return { ok: true };
}


// notify every active user of one role (example: all admins)
function notifyRole(role, msg) {
  getUsers().forEach(function (u) {
    if (u.role === role && u.status === "active") addNotif(u.id, msg);
  });
}

// a recipient reports a fake donor / false request
function addReport(byId, reportedId, reason) {
  var list = getReports();
  var nextId = 1;
  list.forEach(function (r) { if (r.id >= nextId) nextId = r.id + 1; });   // short report number: 4, 5, 6...
  list.push({ id: nextId, reportedId: reportedId, by: byId, reason: reason, status: "open", at: new Date().toISOString() });
  saveReports(list);
  var who = findUser(reportedId);
  notifyRole("admin", "New report about " + (who ? who.name : "a user"));
}

// delete a user with his requests and notifications
function removeUser(id) {
  saveUsers(getUsers().filter(function (u) { return u.id != id; }));
  saveRequests(getRequests().filter(function (r) { return r.recipientId != id; }));
  saveNotifs(getNotifs().filter(function (n) { return n.userId != id; }));
}

/* ---------------- small charts (HTML + CSS only) ---------------- */

// counts = { "A+": 3, "B+": 5 ... }  ->  vertical bars
function barChart(counts) {
  var max = 1, key;
  for (key in counts) if (counts[key] > max) max = counts[key];
  var html = '<div class="bars">';
  for (key in counts) {
    html += '<div class="bar-col"><span>' + counts[key] + '</span><div class="bar" style="height:' + Math.round(counts[key] / max * 100) + '%"></div><small>' + key + "</small></div>";
  }
  return html + "</div>";
}

// counts = { Open: 3, ... }, colors = ["#..", ".."]  ->  donut + legend
function donutChart(counts, colors) {
  var total = 0, key;
  for (key in counts) total += counts[key];
  var parts = [], start = 0, i = 0, legend = "";
  for (key in counts) {
    var end = start + (total ? counts[key] / total * 100 : 0);
    parts.push(colors[i] + " " + start + "% " + end + "%");
    legend += '<div><i style="background:' + colors[i] + '"></i>' + key + " <b>" + counts[key] + "</b></div>";
    start = end; i++;
  }
  var bg = total ? "conic-gradient(" + parts.join(",") + ")" : "#eceef4";
  return '<div class="donut-wrap"><div class="donut" style="background:' + bg + '"><span>' + total + '</span></div><div class="legend">' + legend + "</div></div>";
}

// counts = { Mirpur: 4 ... }  ->  horizontal bars
function hBarChart(counts) {
  var max = 1, key;
  for (key in counts) if (counts[key] > max) max = counts[key];
  var html = "";
  for (key in counts) {
    html += '<div class="hbar-row"><span>' + key + '</span><div class="hbar"><i style="width:' + Math.round(counts[key] / max * 100) + '%"></i></div><b>' + counts[key] + "</b></div>";
  }
  return html || '<p class="muted">No data.</p>';
}

/* ---------------- login protection + top bar ---------------- */

// The login is saved in 2 places (localStorage + window.name), so it also
// works when the page is opened by double click (file://) in Firefox.
function setLoggedInUser(id) {
  localStorage.setItem("bdf_currentUser", id);
  window.name = "bdf_user=" + id;
}

function getLoggedInUser() {
  var id = localStorage.getItem("bdf_currentUser");
  if (!id && window.name.indexOf("bdf_user=") === 0) id = window.name.slice(9);
  return findUser(id);
}

function logout() {
  localStorage.removeItem("bdf_currentUser");
  window.name = "";
  window.location.href = "login.html";
}

function avatarHtml(user) {
  if (user.photo) return '<img src="' + user.photo + '" alt="">';
  return esc(initials(user.name));
}

// Put this at the top of every protected page:  var user = initPage("recipient");
// role = "recipient" / "donor" / ... or leave empty to allow every role
function initPage(role) {
  seedData();
  expireRequests();
  var user = getLoggedInUser();
  if (!user || user.status !== "active" || (role && user.role !== role)) {
    window.location.href = "login.html?reason=login";
    throw new Error("Please login first");
  }
  document.body.classList.remove("protected");   // page was hidden until login is checked
  renderNav(user);
  return user;
}

function bellHtml(notifs, unread) {
  var items = "";
  for (var j = 0; j < Math.min(notifs.length, 6); j++) {
    items += '<div class="notif-item"><b>' + esc(notifs[j].msg) + "</b><small>" + timeAgo(notifs[j].at) + "</small></div>";
  }
  if (items === "") items = '<p class="muted">Nothing yet.</p>';
  return '<div class="bell-wrap"><button class="bell" id="bellBtn" type="button">&#128276;' +
           (unread ? "<i>" + unread + "</i>" : "") + "</button>" +
           '<div class="notif-panel" id="notifPanel"><h4>Notifications</h4>' + items + "</div></div>";
}

function renderNav(user) {
  var file = window.location.pathname.split("/").pop();
  if (file === "post-request.html") file = "find-donors.html";   // belongs to Find Donors menu

  var notifs = getNotifs().filter(function (n) { return n.userId === user.id; })
                          .sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
  var unread = notifs.filter(function (n) { return !n.read; }).length;
  var bell = bellHtml(notifs, unread);

  if (user.role === "admin") renderSidebar(user, file, bell);
  else renderTopbar(user, file, bell);

  document.getElementById("logoutBtn").onclick = function (e) { e.preventDefault(); logout(); };

  document.getElementById("bellBtn").onclick = function () {
    var panel = document.getElementById("notifPanel");
    panel.classList.toggle("show");
    if (panel.classList.contains("show")) {
      var all = getNotifs();
      for (var k = 0; k < all.length; k++) if (all[k].userId === user.id) all[k].read = true;
      saveNotifs(all);
      var badge = document.querySelector("#bellBtn i");
      if (badge) badge.remove();
    }
  };
  // click anywhere else closes the notification box
  document.addEventListener("click", function (e) {
    var wrap = document.querySelector(".bell-wrap");
    if (wrap && !wrap.contains(e.target)) document.getElementById("notifPanel").classList.remove("show");
  });
}

// top bar (donor, recipient, staff)
function renderTopbar(user, file, bell) {
  var links = "";
  var menu = MENU[user.role];
  for (var i = 0; i < menu.length; i++) {
    links += '<a href="' + menu[i][1] + '"' + (menu[i][1] === file ? ' class="active"' : "") + ">" + menu[i][0] + "</a>";
  }
  document.getElementById("navbar").innerHTML =
    '<header class="topbar">' +
      '<a class="brand" href="' + HOME[user.role] + '"><span class="brand-icon">&#129656;</span>Blood Donor Finder</a>' +
      '<nav class="nav-links">' + links + "</nav>" +
      '<div class="nav-right">' + bell +
        '<a class="avatar" href="profile.html" title="My profile">' + avatarHtml(user) + "</a>" +
        '<a class="logout" href="#" id="logoutBtn">Logout</a>' +
      "</div>" +
    "</header>";
}

// left sidebar (admin)
function renderSidebar(user, file, bell) {
  document.body.classList.add("with-sidebar");
  var links = "";
  MENU.admin.forEach(function (m) {
    links += '<a href="' + m[1] + '" class="side-link' + (m[1] === file ? " active" : "") + '"><span>' + m[2] + "</span>" + m[0] +
             '<i class="side-badge" data-for="' + m[1] + '"></i></a>';
  });
  document.getElementById("navbar").innerHTML =
    '<aside class="sidebar">' +
      '<a class="brand" href="' + HOME[user.role] + '"><span class="brand-icon">&#129656;</span>Blood Donor Finder</a>' +
      "<nav>" + links + "</nav>" +
      '<div class="side-user">' +
        '<a class="avatar" href="profile.html" title="My profile">' + avatarHtml(user) + "</a>" +
        '<div><b>' + esc(user.name) + "</b><small>Administrator</small></div>" +
        '<a class="logout" href="#" id="logoutBtn">Logout</a>' +
      "</div>" +
    "</aside>";

  // the bell goes to the top right of the page (next to the page title)
  var head = document.querySelector(".page-head");
  if (head) {
    var right = document.createElement("div");
    right.className = "head-right";
    right.innerHTML = bell;
    while (head.children.length > 1) right.appendChild(head.children[1]);   // keep the buttons
    head.appendChild(right);
  }
  updateBadges();
}

// red numbers in the admin sidebar: pending users + open reports
function updateBadges() {
  var pending = getUsers().filter(function (u) { return u.status === "pending"; }).length;
  var open = getReports().filter(function (r) { return r.status === "open"; }).length;
  var badges = document.querySelectorAll(".side-badge");
  for (var i = 0; i < badges.length; i++) {
    var f = badges[i].getAttribute("data-for"), n = 0;
    if (f === "admin-users.html") n = pending;
    if (f === "admin-reports.html") n = open;
    badges[i].textContent = n;
    badges[i].style.display = n ? "inline-block" : "none";
  }
}
