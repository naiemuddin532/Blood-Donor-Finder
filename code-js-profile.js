// profile.js - works with profile.html (same page for every role)

var user = initPage();   // no role given = every logged-in user can open it

fillSelect("area", AREAS, user.area);

// staff has a hospital name, admin has no area
document.getElementById("hospitalGroup").classList.toggle("hide", user.role !== "staff");
document.getElementById("areaGroup").classList.toggle("hide", user.role === "admin");

var roleName = { donor: "Donor", recipient: "Recipient", staff: "Hospital staff", admin: "Admin" };

// show the saved data on the page
function showProfile() {
  document.getElementById("photo").innerHTML = avatarHtml(user);
  document.getElementById("sideName").textContent = user.name;
  document.getElementById("sideRole").textContent = roleName[user.role];
  document.getElementById("sideSince").textContent = "Member since " + new Date(user.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  document.getElementById("sideEmail").textContent = "✉ " + user.email;
  document.getElementById("sideArea").textContent = user.area ? "📍 " + user.area + ", Dhaka" : "";

  document.getElementById("name").value = user.name;
  document.getElementById("email").value = user.email;
  document.getElementById("phone").value = user.phone;
  document.getElementById("area").value = user.area;
  document.getElementById("hospital").value = user.hospital || "";
}
showProfile();

// ----- save personal information -----
document.getElementById("infoForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var name = document.getElementById("name").value.trim();
  var email = document.getElementById("email").value.trim().toLowerCase();
  var phone = document.getElementById("phone").value.trim();
  var area = user.role === "admin" ? "" : document.getElementById("area").value;
  var hospital = document.getElementById("hospital").value.trim();

  if (name.length < 3) { showMsg("Enter your full name", "error"); return; }
  if (!/^\S+@\S+\.\S+$/.test(email)) { showMsg("Enter a valid email address", "error"); return; }
  if (!/^01[3-9][0-9]{8}$/.test(phone)) { showMsg("Enter a valid phone number like 01700000000", "error"); return; }
  if (user.role === "staff" && hospital.length < 3) { showMsg("Enter the hospital or blood bank name", "error"); return; }

  // email must not belong to someone else
  var users = getUsers();
  for (var i = 0; i < users.length; i++) {
    if (users[i].email === email && users[i].id !== user.id) {
      showMsg("This email is used by another account", "error");
      return;
    }
  }

  user.name = name;
  user.email = email;
  user.phone = phone;
  user.area = area;
  if (user.role === "staff") user.hospital = hospital;
  saveUser(user);
  showMsg("Profile updated", "success");
  showProfile();
  renderNav(user);
});

document.getElementById("cancelEdit").addEventListener("click", function () {
  showProfile();
  document.getElementById("msg").className = "msg";
});

// ----- change photo (saved inside the browser) -----
document.getElementById("photoBtn").addEventListener("click", function () {
  document.getElementById("photoInput").click();
});
document.getElementById("photoInput").addEventListener("change", function () {
  var file = this.files[0];
  if (!file) return;
  if (file.size > 300 * 1024) {
    toast("Photo is too big. Choose one under 300 KB", "error");
    return;
  }
  var reader = new FileReader();
  reader.onload = function () {
    user.photo = reader.result;
    saveUser(user);
    showProfile();
    renderNav(user);
    toast("Photo changed");
  };
  reader.readAsDataURL(file);
});

// ----- change password -----
function showPassMsg(text, type) {
  var box = document.getElementById("passMsg");
  box.textContent = text;
  box.className = "msg " + type;
}
document.getElementById("passForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var oldPass = document.getElementById("oldPass").value;
  var newPass = document.getElementById("newPass").value;

  if (oldPass !== user.password) { showPassMsg("Current password is wrong", "error"); return; }
  if (newPass.length < 8) { showPassMsg("New password must be at least 8 characters", "error"); return; }
  if (newPass === oldPass) { showPassMsg("New password must be different", "error"); return; }

  user.password = newPass;
  saveUser(user);
  showPassMsg("Password updated", "success");
  this.reset();
});

// ----- delete account -----
document.getElementById("deleteBtn").addEventListener("click", function () {
  if (!confirm("Delete your account for good? This cannot be undone.")) return;

  saveUsers(getUsers().filter(function (u) { return u.id !== user.id; }));
  saveRequests(getRequests().filter(function (r) { return r.recipientId !== user.id; }));
  saveNotifs(getNotifs().filter(function (n) { return n.userId !== user.id; }));
  localStorage.removeItem("bdf_currentUser");
  window.location.href = "register.html";
});
