document.addEventListener("DOMContentLoaded", function () {
  let user = localStorage.getItem("loggedInUser");
  let role = localStorage.getItem("userRole");
  let dashboardContainer = document.getElementById("dashboardContainer");
  let welcomeMessage = document.getElementById("welcomeMessage");
  let loginModal = document.getElementById("loginModal");

  if (user && dashboardContainer && welcomeMessage) {
    dashboardContainer.style.display = "block";
    welcomeMessage.innerText = `Welcome: ${user} (${role})`;

    if (role === "Admin") {
      loadEngineers();
    }
  } else if (loginModal) {
    loginModal.classList.remove("hidden");
  } else {
    console.error(
      "❌ Element Not Found: Check 'dashboardContainer' or 'loginModal' in HTML."
    );
  }
});

// ✅ Engineers List Load Function
async function loadEngineers() {
  try {
    let response = await fetch(
      "https://script.google.com/macros/s/AKfycbzFJ9mpILRPUKCKMziyMQiT16D3Jp5UhYjvWeObwvmTLF3YkbUHjPhJzT91_xMtCutfeA/exec?action=fetchEngineers"
    );
    let data = await response.json();
    let engineerFilter = document.getElementById("engineerFilter");

    // ✅ Agar engineers list empty hai to error show karein
    if (!data.engineers || data.engineers.length === 0) {
      console.error("⚠ No engineers found in API response");
      return;
    }

    engineerFilter.innerHTML = '<option value="">All Engineers</option>';
    data.engineers.forEach((engineer) => {
      engineerFilter.innerHTML += `<option value="${engineer}">${engineer}</option>`;
    });

    // console.log("✅ Engineers Loaded:", data.engineers); // ✅ Debugging log
  } catch (error) {
    console.error("Error Fetching Engineers List:", error);
  }
}

document
  .getElementById("fetchbutton")
  .addEventListener("click", fetchVisitData);

// document
//   .getElementById("engineerFilter")
//   .addEventListener("change", fetchVisitData);

// ✅ Search Function

document.getElementById("searchInput").addEventListener("keyup", function () {
  let filter = searchInput.value.toLowerCase();
  let rows = document.querySelectorAll("#visitData tr");
  rows.forEach((row) => {
    let text = row.innerText.toLowerCase();
    row.style.display = text.includes(filter) ? "" : "none";
  });
});

// 🔹 **Login Function with Role Fetching**
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

  let apiUrl = `https://script.google.com/macros/s/AKfycbzFJ9mpILRPUKCKMziyMQiT16D3Jp5UhYjvWeObwvmTLF3YkbUHjPhJzT91_xMtCutfeA/exec?action=login&username=${username}&password=${password}`;

  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data && data.status === "success") {
        localStorage.setItem("loggedInUser", username);
        localStorage.setItem("userRole", data.role); // ✅ Role save karein
        Swal.fire("Success", "Login successful!", "success").then(() => {
          window.location.href = "dashboard.html";
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
// 🔹 **Fetch Visit Data with Role-based Access**
function fetchVisitData() {
  let fromDate = document.getElementById("fromDate").value;
  let toDate = document.getElementById("toDate").value;
  let fetchbutton = document.getElementById("fetchbutton");
  let engineer = document.getElementById("engineerFilter").value; // 🔹 Selected Engineer
  let user = localStorage.getItem("loggedInUser");
  let role = localStorage.getItem("userRole");

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

  let apiUrl = `https://script.google.com/macros/s/AKfycbzFJ9mpILRPUKCKMziyMQiT16D3Jp5UhYjvWeObwvmTLF3YkbUHjPhJzT91_xMtCutfeA/exec?action=fetchVisitData&from=${encodeURIComponent(
    fromDate
  )}&to=${encodeURIComponent(toDate)}&user=${user}`;

  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      console.log("API Response:", data); // ✅ Debugging log
      if (!data || data.status === "error") {
        Swal.fire("Error", data.message || "Failed to fetch data!", "error");
        return;
      }

      if (data.length === 0) {
        Swal.fire("Info", "No visit records found for selected dates!", "info");
        return;
      }

      // ✅ **Frontend Filtering (if API doesn't filter correctly)**
      if (role === "Admin" && engineer && engineer !== "All Engineers") {
        data = data.filter((row) => row.engineer === engineer);
      }

      // ✅ **Frontend Filtering (if API doesn't filter correctly)**
      if (role === "Admin" && engineer && engineer !== "All Engineers") {
        data = data.filter((row) => row.engineer === engineer);
      }

      let tableBody = document.getElementById("visitData");
      tableBody.innerHTML = "";
      data.forEach((row) => {
        //add status button

        let statusButton = row.statusSaved
          ? `<button onclick='openModal(${JSON.stringify(
              row
            )}, true)' class="bg-blue-500 text-white px-2 py-1 rounded">View Status</button>`
          : `<button onclick='openModal(${JSON.stringify(
              row
            )}, false)' class="bg-green-500 text-white px-2 py-1 rounded">Add Status</button>`;

        tableBody.innerHTML += `<tr>
              <td class='p-1 border border-black'>${row.region}</td>
              <td class='p-1 border border-black'>${row.engineer}</td>
              <td class='p-1 border border-black'>${row.phase}</td>
              <td class='p-1 border border-black'>${row.roCode}</td>
              <td class='p-1 border border-black'>${row.roName}</td>
              <td class='p-1 border border-black'>${row.purpose}</td>
              <td class='p-1 border border-black'>${row.issueType}</td>
              <td class='p-1 border border-black'>${row.amcQtr}</td>
              <td class='p-1 border border-black'>${formatDate(row.date)}</td>
              <td class='p-1 border border-black'>${statusButton}</td>

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

  let user = localStorage.getItem("loggedInUser");
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
  link.download = `${user}_visit_data.csv`;
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
