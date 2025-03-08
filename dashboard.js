document.addEventListener("DOMContentLoaded", function () {
  let user = localStorage.getItem("loggedInUser");

  if (user) {
    document.getElementById("dashboardContainer").style.display = "block";
    document.getElementById("welcomeMessage").innerText = `Welcome, ${user}`;
  } else {
    document.getElementById("loginModal").classList.remove("hidden");
  }
});

// 🔹 **Login Function**
function login() {
  let username = document.getElementById("username").value.trim();
  let password = document.getElementById("password").value.trim();
  let loginButton = document.getElementById("loginButton");

  if (!username || !password) {
    Swal.fire("Error", "Please enter both username and password!", "error");
    return;
  }

  loginButton.innerHTML = '<span class="spinner"></span> Logging in...';
  loginButton.disabled = true;

  let apiUrl = `https://script.google.com/macros/s/AKfycbwCJzmc2bjcwjuVxu1KeUadp81WXyNZhn4bsCaGxaH2gaGNg4zTZdhpnGMEeDrYFgr9ew/exec?action=login&username=${username}&password=${password}`;

  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data && data.status === "success") {
        localStorage.setItem("loggedInUser", username); // ✅ LocalStorage में save करें
        Swal.fire("Success", "Login successful!", "success").then(() => {
          window.location.href = "dashboard.html"; // ✅ Redirect to Dashboard
        });
      } else {
        Swal.fire("Error", data.message || "Invalid credentials", "error");
      }
    })
    .catch((error) => {
      console.error("Login Error:", error);
      Swal.fire("Error", "Something went wrong! Try again.", "error");
    })
    .finally(() => {
      loginButton.innerHTML = "Login";
      loginButton.disabled = false;
    });
}

// 🔹 **Logout Function**
function logout() {
  localStorage.removeItem("loggedInUser"); // ✅ Remove user session
  window.location.href = "login.html"; // ✅ Redirect to Login
}

// 🔹 **Fetch Visit Data**
function fetchVisitData() {
  let fromDate = document.getElementById("fromDate").value;
  let toDate = document.getElementById("toDate").value;
  let fetchbutton = document.getElementById("fetchbutton");
  let user = localStorage.getItem("loggedInUser"); // ✅ LocalStorage से User लो

  if (!fromDate || !toDate) {
    Swal.fire("Warning", "Please select both dates!", "warning");
    return;
  }

  if (!user) {
    Swal.fire("Error", "User not logged in!", "error");
    return;
  }

  fetchbutton.innerHTML = `<span class="spinner"></span> Fetching Visit Data...`;
  fetchbutton.disabled = true;

  let apiUrl = `https://script.google.com/macros/s/AKfycbwCJzmc2bjcwjuVxu1KeUadp81WXyNZhn4bsCaGxaH2gaGNg4zTZdhpnGMEeDrYFgr9ew/exec?action=fetchData&from=${encodeURIComponent(
    fromDate
  )}&to=${encodeURIComponent(toDate)}&user=${encodeURIComponent(user)}`;

  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      if (!data || data.status === "error") {
        Swal.fire("Error", data.message || "Failed to fetch data!", "error");
        return;
      }

      let tableBody = document.getElementById("visitData");
      tableBody.innerHTML = "";
      data.forEach((row) => {
        tableBody.innerHTML += `<tr>
              <td class='border p-2'>${row.region}</td>
              <td class='border p-2'>${row.engineer}</td>
              <td class='border p-2'>${row.phase}</td>
              <td class='border p-2'>${row.roCode}</td>
              <td class='border p-2'>${row.roName}</td>
              <td class='border p-2'>${row.purpose}</td>
              <td class='border p-2'>${formatDate(row.date)}</td>
            </tr>`;
      });
    })
    .catch((error) => {
      console.error("Visit Data Fetch Error:", error);
      Swal.fire("Error", "Failed to fetch data!", "error");
    })
    .finally(() => {
      fetchbutton.innerHTML = "Get Visit Detail";
      fetchbutton.disabled = false;
    });
}

// 🔹 **Export Data Function**
function exportData() {
  let table = document.querySelector("table");
  if (!table) {
    Swal.fire("Error", "No data to export!", "error");
    return;
  }

  let csv = [];
  let rows = table.querySelectorAll("tr");

  rows.forEach((row) => {
    let cols = row.querySelectorAll("th, td");
    let data = Array.from(cols)
      .map((col) => `"${col.innerText}"`)
      .join(",");
    csv.push(data);
  });

  let csvFile = new Blob([csv.join("\n")], { type: "text/csv" });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(csvFile);
  link.download = "visit_data.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 🔹 **Format Date Function**
function formatDate(isoDate) {
  let date = new Date(isoDate);
  let year = date.getFullYear();
  let month = (date.getMonth() + 1).toString().padStart(2, "0");
  let day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`; // Output: YYYY-MM-DD
}

//reload

document.addEventListener("DOMContentLoaded", function () {
  const visitDetailLinks = document.querySelectorAll(".visit-detail-link");

  visitDetailLinks.forEach((link) => {
    link.addEventListener("click", function (event) {
      event.preventDefault(); // लिंक पर तुरंत नेविगेट होने से रोकें
      const url = this.href; // लिंक का URL सेव करें
      setTimeout(() => {
        window.location.href = url; // कुछ सेकंड बाद पेज को रीडायरेक्ट करें
        setTimeout(() => location.reload(), 3000); // फिर 3 सेकंड बाद रीलोड करें
      }, 1000); // पहले 1 सेकंड बाद रीडायरेक्ट करें
    });
  });
});
