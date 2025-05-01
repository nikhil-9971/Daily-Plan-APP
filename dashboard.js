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
      "https://script.google.com/macros/s/AKfycbxk3OWvmuJphVxYRRVxFx67bwlaCFRG10Y9ZgIVaLOTjhdtCgMm8wSwDSl1oBABbCPeng/exec?action=fetchEngineers"
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

  let apiUrl = `https://script.google.com/macros/s/AKfycbxk3OWvmuJphVxYRRVxFx67bwlaCFRG10Y9ZgIVaLOTjhdtCgMm8wSwDSl1oBABbCPeng/exec?action=login&username=${username}&password=${password}`;

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

  let apiUrl = `https://script.google.com/macros/s/AKfycbxk3OWvmuJphVxYRRVxFx67bwlaCFRG10Y9ZgIVaLOTjhdtCgMm8wSwDSl1oBABbCPeng/exec?action=fetchVisitData&from=${encodeURIComponent(
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

      let tableBody = document.getElementById("visitData");
      tableBody.innerHTML = "";
      data.forEach((row) => {
        let statusButton = row.statusAvailable
          ? `<button onclick='generatePDF("${row.roCode}", "${row.date}")' class="bg-red-600 text-white px-2 py-1 rounded">Download Status</button>`
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

async function fetchStatusData(roCode, visitDate) {
  const apiUrl = `https://script.google.com/macros/s/AKfycbxk3OWvmuJphVxYRRVxFx67bwlaCFRG10Y9ZgIVaLOTjhdtCgMm8wSwDSl1oBABbCPeng/exec?action=getStatus&roCode=${encodeURIComponent(
    roCode
  )}&visitDate=${encodeURIComponent(visitDate)}`;

  const response = await fetch(apiUrl);
  const data = await response.json();
  return data;
  // console.log(data);
}

// Generate Pdf
async function generatePDF(roCode, visitDate) {
  try {
    const response = await fetchStatusData(roCode, visitDate);
    if (!response || response.status !== "success" || !response.data) {
      Swal.fire("Not Found", "Status not available for this visit.", "info");
      return;
    }

    const data = response.data;

    const fieldLabelMap = {
      engineer: "Engineer Name",
      roCode: "RO Code",
      roName: "RO Name",
      visitDate: "Visit Date",
      probeMake: "Probe Make",
      lowProductLock: "Low Product Lock Set",
      highWaterSet: "High Water Set at 50mm",
      duSerialNumber: "All DU Serial Number",
      connectivityType: "Connectivity Type",
      sim1Provider: "SIM-1 Service Provider",
      sim1Number: "SIM 1 Number",
      sim2Provider: "SIM-2 Service Provider",
      sim2Number: "SIM 2 Number",
      iemiNumber: "IEMI Number",
      bosVersion: "BOS Version with Date",
      fccVersion: "FCC Version with Date",
      wirelessSlave: "Wireless Slave Version",
      sftpConfig: "SFTP Config",
      adminPassword: "Admin Password Updated",
      workCompletion: "Work Completion Status",
      earthingStatus: "Earthing Status",
      duOffline: "No of DU offline",
      duRemark: "Reason for DU offline",
      location: "Site Location",
    };

    // HTML content with custom styles
    const htmlContent = `
      <div style="font-family: 'Poppins',Arial, sans-serif; padding: 20px; color: #333;">
        <style>
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border: 1px solid #ccc; padding: 6px; }
          th { background-color: #d9edf7; }
          tr { page-break-inside: avoid; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          tr:hover { background-color: #f1f1f1; }
        </style>

        <h2 style="text-align: center; margin-bottom: 20px; font-weight: bold; font-size: 18px;">
          RELCON Bihar Site Visit Status Report
        </h2>

        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            ${Object.keys(fieldLabelMap)
              .map(
                (key) => `
                  <tr>
                    <td>${fieldLabelMap[key]}</td>
                    <td>${data[key] || ""}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>

        <div style="margin-top: 30px; font-size: 12px;">
          <p><strong>Generated by:</strong> ${localStorage.getItem(
            "loggedInUser"
          )}</p>
          <p><strong>Generated on:</strong> ${new Date().toLocaleString(
            "en-IN"
          )}</p>
          <p style="margin-top: 30px;"><strong>Engineer Signature:</strong> ___________________________</p>
        </div>
      </div>
    `;

    const element = document.createElement("div");
    element.innerHTML = htmlContent;

    await html2pdf()
      .set({
        margin: 0.2,
        filename: `${roCode}_${visitDate}_Status.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          scrollY: 0,
          useCORS: true,
        },
        jsPDF: {
          unit: "in",
          format: "a4",
          orientation: "portrait",
        },
        pagebreak: {
          mode: ["css", "legacy"],
          avoid: ["tr", "td"],
        },
      })
      .from(element)
      .save();
    Swal.fire("Success", "Pdf Download Successfully!", "success");
  } catch (error) {
    console.error("PDF Generation Error:", error);
    Swal.fire("Error", "Failed to generate PDF.", "error");
  }
}
