document.addEventListener("DOMContentLoaded", function () {
  let user = localStorage.getItem("loggedInUser");
  let role = localStorage.getItem("userRole");
  let dashboardContainer = document.getElementById("dashboardContainer");
  let sideBar = document.getElementById("sideBar");

  let welcomeMessage = document.getElementById("welcomeMessage");
  let loginModal = document.getElementById("loginModal");

  if (user && dashboardContainer && welcomeMessage) {
    dashboardContainer.classList.remove("hidden");
    welcomeMessage.innerText = `Welcome: ${user} (${role})`;
    if (role === "Admin") {
      loadEngineers();
      // Hide engineer-only cards
      const cards = document.getElementById("engineerAnalyticsCards");
      if (cards) cards.style.display = "none";
      renderAdminAnalytics(user);
      // ✅ NEW: Load analytics table for admin
    }
    if (role === "Engineer") {
      updateEngineerAnalytics(user); // ✅ Added here
    }
  } else if (loginModal) {
    loginModal.classList.remove("hidden");
  } else {
    console.error(
      "❌ Element Not Found: Check 'visitContainer' or 'loginModal' in HTML."
    );
  }
});

// ✅ Engineers List Load Function
async function loadEngineers() {
  try {
    let response = await fetch(
      "https://script.google.com/macros/s/AKfycbyjyoAGc0OxKldWB4Zcj9pJxgaZQRoMbLpMjkhOZbvqWzJC-M_LrdPz44iJZTfeb0kKpw/exec?action=fetchEngineers"
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

  let apiUrl = `https://script.google.com/macros/s/AKfycbyjyoAGc0OxKldWB4Zcj9pJxgaZQRoMbLpMjkhOZbvqWzJC-M_LrdPz44iJZTfeb0kKpw/exec?action=login&username=${username}&password=${password}`;

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

// 🔹 Show/Hide Sections
function showSection(sectionId) {
  const sections = ["dashboardContainer", "visitContainer", "statusModal"];
  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
  const target = document.getElementById(sectionId);
  if (target) target.classList.remove("hidden");
}

function hideVisitContainer() {
  const container = document.getElementById("visitContainer");
  if (container) container.classList.add("hidden");
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

  let apiUrl = `https://script.google.com/macros/s/AKfycbyjyoAGc0OxKldWB4Zcj9pJxgaZQRoMbLpMjkhOZbvqWzJC-M_LrdPz44iJZTfeb0kKpw/exec?action=fetchVisitData&from=${encodeURIComponent(
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
  const apiUrl = `https://script.google.com/macros/s/AKfycbyjyoAGc0OxKldWB4Zcj9pJxgaZQRoMbLpMjkhOZbvqWzJC-M_LrdPz44iJZTfeb0kKpw/exec?action=getStatus&roCode=${encodeURIComponent(
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

function hideVisitContainer() {
  const container = document.getElementById("visitContainer");
  if (container) {
    container.classList.add("hidden");
  }
}

const locationField1 = document.getElementById("locationField1");

if (navigator.geolocation && locationField1) {
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      let locationName = "Unknown";
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        const addr = data.address;

        locationName =
          addr.village ||
          addr.town ||
          addr.suburb ||
          addr.locality ||
          addr.hamlet ||
          addr.county ||
          addr.state_district ||
          addr.state ||
          "Unknown";
      } catch (error) {
        console.error("Error fetching location name:", error);
      }

      // locationField1.textContent = `Current Location: ${locationName} Lat/Long: ${lat.toFixed(
      //   4
      // )}, ${lng.toFixed(4)}`;
      locationField1.innerHTML = `Current Location: ${locationName}<br>Lat/Long: ${lat.toFixed(
        4
      )}, ${lng.toFixed(4)}`;
    },
    (error) => {
      console.warn("Location access denied or error:", error.message);
      locationField1.textContent = "Unable to fetch location";
    }
  );
}

function updateEngineerAnalytics(user) {
  const fromDate = "2025-04-22"; // Optional: filter logic ke liye
  const toDate = "2025-12-31"; // Optional

  fetch(
    `https://script.google.com/macros/s/AKfycbyjyoAGc0OxKldWB4Zcj9pJxgaZQRoMbLpMjkhOZbvqWzJC-M_LrdPz44iJZTfeb0kKpw/exec?action=fetchVisitData&user=${encodeURIComponent(
      user
    )}&from=${fromDate}&to=${toDate}`
  )
    .then((res) => res.json())
    .then((visitData) => {
      if (!visitData || visitData.length === 0) return;

      // const validVisits = visitData.filter((v) => v.roCode !== "N/A");
      const excludedPhases = [
        "NO PLAN",
        "RBML",
        "JIO BP",
        "BPCL",
        "HPCL OFFICE",
        "IN LEAVE",
      ];
      const validVisits = visitData.filter(
        (v) => !excludedPhases.includes(v.phase)
      );
      const totalVisits = validVisits.length;

      // Get the latest valid visit date
      const lastVisitDate = validVisits.length
        ? validVisits.map((v) => new Date(v.date)).sort((a, b) => b - a)[0]
        : null;

      fetch(
        `https://script.google.com/macros/s/AKfycbyjyoAGc0OxKldWB4Zcj9pJxgaZQRoMbLpMjkhOZbvqWzJC-M_LrdPz44iJZTfeb0kKpw/exec?action=getStatus&user=${encodeURIComponent(
          user
        )}`
      )
        .then((res) => res.json())
        .then((statusData) => {
          // const completed = statusData.length;
          const completed = Array.isArray(statusData) ? statusData.length : 0;
          const pending = totalVisits - completed;

          console.log("Status Data:", statusData);

          document.getElementById("totalVisits").textContent = totalVisits;
          document.getElementById("completed").textContent = completed;
          document.getElementById("pending").textContent = pending;
          document.getElementById("lastVisit").textContent = lastVisitDate
            ? formatDate(lastVisitDate)
            : "--";
        });
    });
}

// Admin Anlytics view

// function renderAdminAnalytics(user) {
//   const fromDate = "2025-04-22";
//   const toDate = "2025-12-31";

//   fetch(
//     `https://script.google.com/macros/s/AKfycbyjyoAGc0OxKldWB4Zcj9pJxgaZQRoMbLpMjkhOZbvqWzJC-M_LrdPz44iJZTfeb0kKpw/exec?action=fetchVisitData&user=${encodeURIComponent(
//       user
//     )}&from=${fromDate}&to=${toDate}`
//   )
//     .then((res) => res.json())
//     .then((visitData) => {
//       const validVisits = visitData.filter((v) => v.roCode !== "N/A");
//       const analytics = {};
//       const engineerRows = {};

//       validVisits.forEach((v) => {
//         const eng = v.engineer;
//         if (!analytics[eng]) {
//           analytics[eng] = { total: 0, completed: 0, lastVisit: null };
//           engineerRows[eng] = [];
//         }
//         analytics[eng].total += 1;
//         if (v.statusAvailable) analytics[eng].completed += 1;

//         const visitDate = new Date(v.date);
//         if (
//           !analytics[eng].lastVisit ||
//           visitDate > new Date(analytics[eng].lastVisit)
//         ) {
//           analytics[eng].lastVisit = visitDate.toISOString().split("T")[0];
//         }

//         engineerRows[eng].push({
//           ...v,
//           status: v.statusAvailable ? "Completed" : "Pending",
//         });
//       });

//       const sortedEngineers = Object.keys(analytics).sort();
//       const container = document.getElementById("adminAnalyticsContainer");

//       // Render UI
//       container.innerHTML = `
//         <div class="relative inline-block mb-3 w-[260px]">
//           <button id="dropdownToggle" class="w-full text-left border px-3 py-2 rounded bg-white shadow">
//             Select Engineers ▼
//           </button>
//           <div id="checkboxDropdown" class="absolute z-10 mt-1 hidden border bg-white shadow rounded w-full max-h-60 overflow-y-auto">
//             <label class="block px-3 py-1 hover:bg-gray-100 font-semibold">
//               <input type="checkbox" id="selectAllEngineers" class="mr-2" />
//               All Engineers
//             </label>
//             ${sortedEngineers
//               .map(
//                 (name) => `
//               <label class="block px-3 py-1 hover:bg-gray-100">
//                 <input type="checkbox" class="engineerCheckbox mr-2" value="${name}" />
//                 ${name}
//               </label>
//             `
//               )
//               .join("")}
//           </div>
//         </div>
//         <button id="applyFilter" class="ml-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Apply</button>

//         <div class="overflow-x-auto mt-4">
//           <table class="min-w-full text-sm border border-gray-300 rounded shadow-md">
//             <thead class="bg-blue-600 text-white">
//               <tr>
//                 <th class="px-4 py-2 border">Engineer</th>
//                 <th class="px-4 py-2 border cursor-pointer" id="exportVisits">Total Visits</th>
//                 <th class="px-4 py-2 border cursor-pointer" id="exportCompleted">Status Updated</th>
//                 <th class="px-4 py-2 border">Status Pending</th>
//                 <th class="px-4 py-2 border">Last Visit</th>
//               </tr>
//             </thead>
//             <tbody id="engineerTableBody" class="bg-white">
//               ${sortedEngineers
//                 .map((name) => renderTableRow(name, analytics[name]))
//                 .join("")}
//             </tbody>
//           </table>
//         </div>
//       `;

//       // Dropdown toggle
//       document
//         .getElementById("dropdownToggle")
//         .addEventListener("click", () => {
//           document
//             .getElementById("checkboxDropdown")
//             .classList.toggle("hidden");
//         });

//       // Select All logic
//       const allCheckbox = document.getElementById("selectAllEngineers");
//       allCheckbox.addEventListener("change", function () {
//         document.querySelectorAll(".engineerCheckbox").forEach((cb) => {
//           cb.checked = this.checked;
//         });
//       });

//       // Apply filter
//       document.getElementById("applyFilter").addEventListener("click", () => {
//         const selected = Array.from(
//           document.querySelectorAll(".engineerCheckbox:checked")
//         ).map((cb) => cb.value);
//         const tbody = document.getElementById("engineerTableBody");

//         const filtered =
//           selected.length === 0
//             ? sortedEngineers
//             : sortedEngineers.filter((name) => selected.includes(name));
//         tbody.innerHTML = filtered
//           .map((name) => renderTableRow(name, analytics[name]))
//           .join("");

//         document.getElementById("checkboxDropdown").classList.add("hidden");
//       });

//       // Export: Total Visits
//       document.getElementById("exportVisits").addEventListener("click", () => {
//         const selected = getSelectedEngineers() || sortedEngineers;
//         const rows = selected.flatMap((eng) => engineerRows[eng] || []);
//         exportToExcel(rows, "Total_Visits");
//       });

//       // Export: Status Updated
//       document
//         .getElementById("exportCompleted")
//         .addEventListener("click", () => {
//           const selected = getSelectedEngineers() || sortedEngineers;
//           const completedRows = selected.flatMap((eng) =>
//             (engineerRows[eng] || []).filter((r) => r.status === "Completed")
//           );
//           exportToExcel(completedRows, "Status_Updated");
//         });

//       function getSelectedEngineers() {
//         const checked = Array.from(
//           document.querySelectorAll(".engineerCheckbox:checked")
//         ).map((cb) => cb.value);
//         return checked.length > 0 ? checked : null;
//       }

//       function exportToExcel(rows, filenamePrefix) {
//         if (rows.length === 0) {
//           alert("No data to export!");
//           return;
//         }

//         const headers = [
//           "Engineer",
//           "RO Code",
//           "RO Name",
//           "Purpose",
//           "Issue Type",
//           "AMC Qtr",
//           "Date",
//           "Status",
//         ];
//         const csv = [
//           headers.join(","),
//           ...rows.map((r) =>
//             [
//               r.engineer,
//               r.roCode,
//               r.roName,
//               r.purpose,
//               r.issueType,
//               r.amcQtr,
//               r.date,
//               r.status,
//             ]
//               .map((v) => `"${v}"`)
//               .join(",")
//           ),
//         ].join("\n");

//         const blob = new Blob([csv], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);

//         const a = document.createElement("a");
//         a.href = url;
//         a.download = `${filenamePrefix}_${
//           new Date().toISOString().split("T")[0]
//         }.csv`;
//         a.click();
//         URL.revokeObjectURL(url);
//       }
//     });
// }

// function renderTableRow(name, stat) {
//   return `
//     <tr class="hover:bg-gray-100">
//       <td class="px-4 py-2 border font-medium">${name}</td>
//       <td class="px-4 py-2 border text-center">${stat.total}</td>
//       <td class="px-4 py-2 border text-center">${stat.completed}</td>
//       <td class="px-4 py-2 border text-center">${
//         stat.total - stat.completed
//       }</td>
//       <td class="px-4 py-2 border text-center">${stat.lastVisit || "--"}</td>
//     </tr>
//   `;
// }

function renderAdminAnalytics(user) {
  const fromDate = "2025-04-22";
  const toDate = "2025-12-31";

  fetch(
    `https://script.google.com/macros/s/AKfycbyjyoAGc0OxKldWB4Zcj9pJxgaZQRoMbLpMjkhOZbvqWzJC-M_LrdPz44iJZTfeb0kKpw/exec?action=fetchVisitData&user=${encodeURIComponent(
      user
    )}&from=${fromDate}&to=${toDate}`
  )
    .then((res) => res.json())
    .then((visitData) => {
      // const validVisits = visitData.filter((v) => v.phase !== "NO PLAN");
      const excludedPhases = [
        "NO PLAN",
        "RBML",
        "JIO BP",
        "BPCL",
        "HPCL OFFICE",
        "IN LEAVE",
      ];
      const validVisits = visitData.filter(
        (v) => !excludedPhases.includes(v.phase)
      );

      const analytics = {};
      const engineerRows = {};

      validVisits.forEach((v) => {
        const eng = v.engineer;
        if (!analytics[eng]) {
          analytics[eng] = { total: 0, completed: 0, lastVisit: null };
          engineerRows[eng] = [];
        }
        analytics[eng].total += 1;
        if (v.statusAvailable) analytics[eng].completed += 1;

        const visitDate = new Date(v.date);
        if (
          !analytics[eng].lastVisit ||
          visitDate > new Date(analytics[eng].lastVisit)
        ) {
          analytics[eng].lastVisit = visitDate.toISOString().split("T")[0];
        }

        engineerRows[eng].push({
          ...v,
          status: v.statusAvailable ? "Completed" : "Pending",
        });
      });

      const sortedEngineers = Object.keys(analytics).sort();
      const container = document.getElementById("adminAnalyticsContainer");

      // Render HTML
      container.innerHTML = `
        <div class="relative inline-block mb-3 w-[260px]">
          <button id="dropdownToggle" class="w-full text-left border px-3 py-2 rounded bg-white shadow">
            Select Engineers ▼
          </button>
          <div id="checkboxDropdown" class="absolute z-10 mt-1 hidden border bg-white shadow rounded w-full max-h-60 overflow-y-auto">
            <label class="block px-3 py-1 hover:bg-gray-100 font-semibold">
              <input type="checkbox" id="selectAllEngineers" class="mr-2" />
              All Engineers
            </label>
            ${sortedEngineers
              .map(
                (name) => `
              <label class="block px-3 py-1 hover:bg-gray-100">
                <input type="checkbox" class="engineerCheckbox mr-2" value="${name}" />
                ${name}
              </label>
            `
              )
              .join("")}
          </div>
        </div>
        <button id="applyFilter" class="ml-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Apply</button>

        <div class="overflow-x-auto mt-4">
          <table class="min-w-full text-sm border border-gray-300 rounded shadow-md">
            <thead class="bg-blue-600 text-white">
              <tr>
                <th class="px-4 py-2 border">Engineer</th>
                <th class="px-4 py-2 border cursor-pointer" id="exportVisits">Total Visits</th>
                <th class="px-4 py-2 border cursor-pointer" id="exportCompleted">Status Updated</th>
                <th class="px-4 py-2 border">Status Pending</th>
                <th class="px-4 py-2 border">Last Visit</th>
              </tr>
            </thead>
            <tbody id="engineerTableBody" class="bg-white"></tbody>
            <tfoot id="engineerTableFoot"></tfoot>
          </table>
        </div>
      `;

      // Dropdown toggle
      document
        .getElementById("dropdownToggle")
        .addEventListener("click", () => {
          document
            .getElementById("checkboxDropdown")
            .classList.toggle("hidden");
        });

      // Select All checkbox logic
      document
        .getElementById("selectAllEngineers")
        .addEventListener("change", function () {
          const allBoxes = document.querySelectorAll(".engineerCheckbox");
          allBoxes.forEach((cb) => (cb.checked = this.checked));
        });

      // Helper: render table rows and totals
      function renderAndUpdateTable(filtered) {
        const tbody = document.getElementById("engineerTableBody");
        tbody.innerHTML = filtered
          .map((name) => renderTableRow(name, analytics[name]))
          .join("");

        const total = getTotals(filtered, analytics);
        document.getElementById("engineerTableFoot").innerHTML = `
          <tr class="bg-gray-100 font-semibold">
            <td class="px-4 py-2 border text-left">Total</td>
            <td class="px-4 py-2 border text-center">${total.visits}</td>
            <td class="px-4 py-2 border text-center">${total.completed}</td>
            <td class="px-4 py-2 border text-center">${total.pending}</td>
            <td class="px-4 py-2 border"></td>
          </tr>
        `;
      }

      // Initial render with all engineers
      renderAndUpdateTable(sortedEngineers);

      // Apply filter
      document.getElementById("applyFilter").addEventListener("click", () => {
        const selected = getSelectedEngineers() || sortedEngineers;
        renderAndUpdateTable(selected);
        document.getElementById("checkboxDropdown").classList.add("hidden");
      });

      // Export logic
      document.getElementById("exportVisits").addEventListener("click", () => {
        const selected = getSelectedEngineers() || sortedEngineers;
        const rows = selected.flatMap((eng) => engineerRows[eng] || []);
        exportToExcel(rows, "Total_Visits");
      });

      document
        .getElementById("exportCompleted")
        .addEventListener("click", () => {
          const selected = getSelectedEngineers() || sortedEngineers;
          const completedRows = selected.flatMap((eng) =>
            (engineerRows[eng] || []).filter((r) => r.status === "Completed")
          );
          exportToExcel(completedRows, "Status_Updated");
        });

      function getSelectedEngineers() {
        const checked = Array.from(
          document.querySelectorAll(".engineerCheckbox:checked")
        ).map((cb) => cb.value);
        return checked.length > 0 ? checked : null;
      }

      function exportToExcel(rows, filenamePrefix) {
        if (rows.length === 0) {
          alert("No data to export!");
          return;
        }

        const headers = [
          "Engineer",
          "RO Code",
          "RO Name",
          "Purpose",
          "Issue Type",
          "AMC Qtr",
          "Date",
          "Status",
        ];
        const csv = [
          headers.join(","),
          ...rows.map((r) =>
            [
              r.engineer,
              r.roCode,
              r.roName,
              r.purpose,
              r.issueType,
              r.amcQtr,
              r.date,
              r.status,
            ]
              .map((v) => `"${v}"`)
              .join(",")
          ),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filenamePrefix}_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      function getTotals(filteredEngineers, analytics) {
        let visits = 0,
          completed = 0;
        filteredEngineers.forEach((name) => {
          visits += analytics[name]?.total || 0;
          completed += analytics[name]?.completed || 0;
        });
        return { visits, completed, pending: visits - completed };
      }

      function renderTableRow(name, stat) {
        return `
          <tr class="hover:bg-gray-100">
            <td class="px-4 py-2 border font-medium">${name}</td>
            <td class="px-4 py-2 border text-center">${stat.total}</td>
            <td class="px-4 py-2 border text-center">${stat.completed}</td>
            <td class="px-4 py-2 border text-center">${
              stat.total - stat.completed
            }</td>
            <td class="px-4 py-2 border text-center">${
              stat.lastVisit || "--"
            }</td>
          </tr>
        `;
      }
    });
}
