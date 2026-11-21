// reset.js - works with reset.html
// Step 1: email + phone must match one account.  Step 2: set the new password.

var foundUser = null;
var step1 = document.getElementById("verifyForm");
var step2 = document.getElementById("newPassForm");

step1.addEventListener("submit", function (e) {
  e.preventDefault();
  var email = document.getElementById("email").value.trim().toLowerCase();
  var phone = document.getElementById("phone").value.trim();

  var users = getUsers();
  foundUser = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].email === email && users[i].phone === phone) foundUser = users[i];
  }

  if (foundUser === null) {
    showMsg("No account matches this email and phone number", "error");
    return;
  }
  showMsg("Account verified. Now set a new password.", "success");
  step1.classList.remove("active");
  step2.classList.add("active");
});

step2.addEventListener("submit", function (e) {
  e.preventDefault();
  if (foundUser === null) {
    showMsg("Please verify your account first", "error");
    return;
  }
  var pass = document.getElementById("newPass").value;
  var confirm = document.getElementById("confirmPass").value;

  if (pass.length < 8) {
    showMsg("Password must be at least 8 characters", "error");
    return;
  }
  if (pass !== confirm) {
    showMsg("Passwords do not match", "error");
    return;
  }

  foundUser.password = pass;
  saveUser(foundUser);
  showMsg("Password changed! Taking you to login...", "success");
  setTimeout(function () { window.location.href = "login.html"; }, 1200);
});
