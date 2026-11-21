var user = initPage("admin");

var audienceName = { all: "All users", donor: "Donors", recipient: "Recipients", staff: "Blood bank staff" };

function draw() {
  var list = getNotices().sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
  var html = "";
  list.forEach(function (n) {
    html += '<div class="list-row">' +
      '<div class="grow"><b>' + esc(n.title) + "</b><small>" + esc(n.msg) + " · " + timeAgo(n.at) + "</small></div>" +
      '<span class="chip chip-blue">' + audienceName[n.audience] + "</span>" +
      '<button class="btn small light" data-id="' + n.id + '">Delete</button></div>';
  });
  document.getElementById("noticeList").innerHTML = html || '<p class="empty">No notices yet.</p>';
}

document.getElementById("noticeForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var title = document.getElementById("title").value.trim();
  var message = document.getElementById("message").value.trim();
  var audience = document.getElementById("audience").value;

  if (title.length < 3) { showMsg("Write a title (at least 3 letters)", "error"); return; }
  if (message.length < 5) { showMsg("Write a message (at least 5 letters)", "error"); return; }

  var notices = getNotices();
  notices.push({ id: Date.now(), title: title, msg: message, audience: audience, at: new Date().toISOString() });
  saveNotices(notices);

  var count = 0;
  getUsers().forEach(function (u) {
    if (u.status === "active" && u.role !== "admin" && (audience === "all" || u.role === audience)) {
      addNotif(u.id, "Notice: " + title);
      count++;
    }
  });

  showMsg("Notice published. " + count + " user" + (count === 1 ? "" : "s") + " notified.", "success");
  this.reset();
  draw();
});

document.getElementById("noticeList").addEventListener("click", function (e) {
  var id = e.target.getAttribute("data-id");
  if (!id) return;
  saveNotices(getNotices().filter(function (n) { return n.id != id; }));
  toast("Notice deleted");
  draw();
});

draw();
