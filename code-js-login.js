// login.js - works with login.html

seedData();

// message when a protected page sent the user back here
if (window.location.search.indexOf("reason=login") !== -1) {
  showMsg("Please login first", "error");
}
// tip when the page is opened by double click
if (window.location.protocol === "file:") {
  document.getElementById("fileTip").style.display = "block";
}

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  var email = document.getElementById("email").value.trim().toLowerCase();
  var password = document.getElementById("password").value;

  // 1. empty check
  if (email === "" || password === "") {
    showMsg("Please enter your email and password", "error");
    return;
  }

  // 2. find the user
  var users = getUsers();
  var user = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].email === email && users[i].password === password) {
      user = users[i];
    }
  }
  if (user === null) {
    showMsg("Wrong email or password", "error");
    return;
  }

  // 3. account status
  if (user.status === "pending") {
    showMsg("Your account is waiting for admin approval", "error");
    return;
  }
  if (user.status === "blocked") {
    showMsg("This account is blocked", "error");
    return;
  }

  // 4. save login, then open the dashboard of that role
  setLoggedInUser(user.id);
  window.location.href = HOME[user.role];
});

