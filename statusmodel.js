let isViewOnly = false; // Default to false

function openModal(rowData, isViewOnly) {
  const modal = document.getElementById("statusModal");
  if (!modal) {
    console.error("Modal not found!");
    return;
  }
  modal.classList.remove("hidden");

  if (!rowData) {
    console.error("Row data not provided!");
    return;
  }

  document.getElementById("engineerName").value = rowData.engineer || "";
  document.getElementById("roCode").value = rowData.roCode || "";
  document.getElementById("roName").value = rowData.roName || "";
  document.getElementById("visitDate").value = rowData.date || "";
}

if (isViewOnly) {
  document
    .querySelectorAll("#statusForm input, #statusForm select")
    .forEach((input) => {
      input.setAttribute("disabled", "true");
    });
  document.getElementById("saveBtn").classList.add("hidden");
} else {
  document
    .querySelectorAll("#statusForm input, #statusForm select")
    .forEach((input) => {
      input.removeAttribute("disabled");
    });
  document.getElementById("saveBtn").classList.remove("hidden");
}

function closeStatusModal() {
  document.getElementById("statusModal").classList.add("hidden");
}

const saveBtn = document.getElementById("saveBtn");

// Handle form submission
document
  .getElementById("statusForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    saveBtn.disabled = true;
    saveBtn.innerText = "Saving... ⏳";
    const statusData = {
      engineer: document.getElementById("engineerName").value,
      roCode: document.getElementById("roCode").value,
      roName: document.getElementById("roName").value,
      visitDate: document.getElementById("visitDate").value,
      probeMake: document.getElementById("probeMake").value,
      lowProductLock: document.getElementById("lowProductLock").value,
      highWaterSet: document.getElementById("highWaterSet").value,
      duSerialNumber: document.getElementById("duSerialNumber").value,
      connectivityType: document.getElementById("connectivityType").value,
      sim1Provider: document.getElementById("sim1Provider").value,
      sim1Number: document.getElementById("sim1Number").value,
      sim2Provider: document.getElementById("sim2Provider").value,
      sim2Number: document.getElementById("sim2Number").value,
      iemiNumber: document.getElementById("iemiNumber").value,
      bosVersion: document.getElementById("bosVersion").value,
      fccVersion: document.getElementById("fccVersion").value,
      wirelessSlave: document.getElementById("wirelessSlave").value,
      sftpConfig: document.getElementById("sftpConfig").value,
      adminPassword: document.getElementById("adminPassword").value,
      workCompletion: document.getElementById("workCompletion").value,
      earthingStatus: document.getElementById("earthingStatus").value,
    };

    fetch(
      "https://script.google.com/macros/s/AKfycbyY1Xojtte_Fzk5xS5NBl2uhOjysbH125XuzFZhw5lUS22GL82Bwt3I_PPvPC9SZzvfKA/exec?action=saveUpdateStatus",
      {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(statusData),
      }
    )
      .then(() => {
        Swal.fire("Success", "Status Updated Successfully!", "success");
        closeStatusModal();
      })
      .catch(() => {
        Swal.fire("Error", "Failed to Update Status", "error");
        document.getElementById("saveBtn").disabled = false;
        document.getElementById("saveBtn").innerText = "Submit";
      });
  });
