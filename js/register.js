// register.js - works with register.html
// 4 account types: donor, recipient, staff (hospital), admin

fillSelect("bloodGroup", GROUPS, "B+");
fillSelect("area", AREAS, "Mirpur");

var roleRadios = document.querySelectorAll('input[name="role"]');

// show only the fields that this role needs
function updateFields() {
  var role = document.querySelector('input[name="role"]:checked').value;
  document.getElementById("bloodGroupBox").classList.toggle("hide", role === "staff" || role === "admin");
  document.getElementById("lastDonatedBox").classList.toggle("hide", role !== "donor");
  document.getElementById("areaBox").classList.toggle("hide", role === "admin");
  document.getElementById("hospitalGroup").classList.toggle("hide", role !== "staff");
  document.getElementById("codeGroup").classList.toggle("hide", role !== "admin");
}
for (var i = 0; i < roleRadios.length; i++) roleRadios[i].addEventListener("change", updateFields);
updateFields();

document.getElementById("registerForm").addEventListener("submit", function (e) {
  e.preventDefault();

  // 1. read the values
  var role = document.querySelector('input[name="role"]:checked').value;
  var name = document.getElementById("name").value.trim();
  var email = document.getElementById("email").value.trim().toLowerCase();
  var phone = document.getElementById("phone").value.trim();
  var hospital = document.getElementById("hospital").value.trim();
  var bloodGroup = document.getElementById("bloodGroup").value;
  var area = document.getElementById("area").value;
  var lastDonated = document.getElementById("lastDonated").value;
  var adminCode = document.getElementById("adminCode").value;
  var password = document.getElementById("password").value;
  var confirm = document.getElementById("confirm").value;
  var terms = document.getElementById("terms").checked;

  // 2. validation (the first problem is shown)
  if (name.length < 3) {
    showMsg("Enter your full name (at least 3 letters)", "error");
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    showMsg("Enter a valid email address", "error");
    return;
  }
  if (!/^01[3-9][0-9]{8}$/.test(phone)) {
    showMsg("Enter a valid phone number like 01700000000", "error");
    return;
  }
  if (role === "staff" && hospital.length < 3) {
    showMsg("Enter the hospital or blood bank name", "error");
    return;
  }
  if (role === "donor" && lastDonated !== "" && new Date(lastDonated) > new Date()) {
    showMsg("Last donation date cannot be in the future", "error");
    return;
  }
  if (role === "admin" && adminCode !== ADMIN_CODE) {
    showMsg("Wrong admin access code", "error");
    return;
  }
  if (password.length < 8) {
    showMsg("Password must be at least 8 characters", "error");
    return;
  }
  if (password !== confirm) {
    showMsg("Passwords do not match", "error");
    return;
  }
  if (!terms) {
    showMsg("Please tick the agreement box", "error");
    return;
  }

  // 3. email must be new
  var users = getUsers();
  for (var j = 0; j < users.length; j++) {
    if (users[j].email === email) {
      showMsg("This email is already registered", "error");
      return;
    }
  }

  // 4. save the new user
  var needsBlood = (role === "donor" || role === "recipient");
  var newUser = {
    id: Date.now(),
    name: name,
    email: email,
    phone: phone,
    password: password,          // plain text only in this demo; PHP will use password_hash()
    role: role,
    bloodGroup: needsBlood ? bloodGroup : "",
    area: role === "admin" ? "" : area,
    status: role === "staff" ? "pending" : "active",   // staff must wait for the admin
    available: true,
    lastDonated: role === "donor" ? (lastDonated || null) : null,
    createdAt: new Date().toISOString().slice(0, 10)
  };
  if (role === "staff") newUser.hospital = hospital;
  users.push(newUser);
  saveUsers(users);

  // the admin is told about a staff account waiting for approval
  if (role === "staff") {
    notifyRole("admin", "New staff account waiting for approval: " + name);
  }

  if (role === "staff") {
    showMsg("Account created. You can sign in after the admin approves it.", "success");
  } else {
    showMsg("Account created! Taking you to login...", "success");
  }
  setTimeout(function () {
    window.location.href = "login.html";
  }, role === "staff" ? 2200 : 1200);
});
