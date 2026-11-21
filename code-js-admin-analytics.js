var user = initPage("admin");

var users = getUsers();
var requests = getRequests();

var groups = {};
GROUPS.forEach(function (g) {
  groups[g] = users.filter(function (u) { return u.role === "donor" && u.bloodGroup === g; }).length;
});
document.getElementById("groupChart").innerHTML = barChart(groups);

var months = [];
for (var i = 5; i >= 0; i--) {
  var d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - i);
  months.push({ key: d.getFullYear() + "-" + d.getMonth(), label: d.toLocaleString("en", { month: "short" }), count: 0 });
}
requests.forEach(function (r) {
  var date = new Date(r.createdAt);
  var key = date.getFullYear() + "-" + date.getMonth();
  months.forEach(function (m) { if (m.key === key) m.count++; });
});
var max = 1;
months.forEach(function (m) { if (m.count > max) max = m.count; });

var points = "", dots = "";
months.forEach(function (m, index) {
  var x = 30 + index * 52;
  var y = 120 - (m.count / max) * 100;
  points += x + "," + y + " ";
  dots += '<circle cx="' + x + '" cy="' + y + '" r="4" fill="#c8102e"/>' +
          '<text x="' + x + '" y="' + (y - 9) + '" text-anchor="middle" font-size="11" fill="#6b7088">' + m.count + "</text>" +
          '<text x="' + x + '" y="145" text-anchor="middle" font-size="11" fill="#6b7088">' + m.label + "</text>";
});
document.getElementById("monthChart").innerHTML =
  '<svg class="line-chart" viewBox="0 0 320 150"><polyline points="' + points + '" fill="none" stroke="#c8102e" stroke-width="3"/>' + dots + "</svg>";

var urgency = { High: 0, Medium: 0, Low: 0 };
requests.forEach(function (r) {
  urgency[r.urgency.charAt(0).toUpperCase() + r.urgency.slice(1)]++;
});
document.getElementById("urgencyChart").innerHTML = donutChart(urgency, ["#c8102e", "#f5a524", "#12b76a"]);

var areas = {};
requests.forEach(function (r) { areas[r.area] = (areas[r.area] || 0) + 1; });
document.getElementById("areaChart").innerHTML = hBarChart(areas);
