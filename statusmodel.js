// Combined Logic for Enhanced Dashboard Behavior

function openModal(rowData, isViewOnly = false) {
  const modal = document.getElementById("statusModal");
  if (!modal || !rowData) {
    console.error("Modal or row data missing");
    return;
  }
  modal.classList.remove("hidden");

  // Fill fields
  document.getElementById("engineerName").value = rowData.engineer || "";
  document.getElementById("roCode").value = rowData.roCode || "";
  document.getElementById("roName").value = rowData.roName || "";
  document.getElementById("visitDate").value = rowData.date || "";

  document
    .getElementById("connectivityType")
    .addEventListener("change", function () {
      const selected = this.value;

      const sim1Provider = document.getElementById("sim1Provider");
      const sim1Number = document.getElementById("sim1Number");
      const sim2Provider = document.getElementById("sim2Provider");
      const sim2Number = document.getElementById("sim2Number");
      const iemiNumber = document.getElementById("iemiNumber");

      if (selected !== "RELCON SIM") {
        sim1Provider.value = "NA";
        sim1Number.value = "NA";
        sim2Provider.value = "NA";
        sim2Number.value = "NA";
        iemiNumber.value = "NA";

        sim1Provider.setAttribute("disabled", true);
        sim1Number.setAttribute("disabled", true);
        sim2Provider.setAttribute("disabled", true);
        sim2Number.setAttribute("disabled", true);
        iemiNumber.setAttribute("disabled", true);
      } else {
        sim1Provider.removeAttribute("disabled");
        sim1Number.removeAttribute("disabled");
        sim2Provider.removeAttribute("disabled");
        sim2Number.removeAttribute("disabled");
        iemiNumber.removeAttribute("disabled");

        sim1Provider.value = "";
        sim1Number.value = "";
        sim2Provider.value = "";
        sim2Number.value = "";
        iemiNumber.value = "";
      }
    });

  //Capital Letter
  document.querySelectorAll("textarea").forEach((el) => {
    el.addEventListener("input", function () {
      this.value = this.value.toUpperCase();
    });
  });
  // Clear fields if adding
  if (!isViewOnly) {
    document.getElementById("statusForm").reset();
  }

  // Disable all fields if view only
  const formElements = document.querySelectorAll(
    "#statusForm input, #statusForm select, #statusForm textarea"
  );
  formElements.forEach((el) => {
    el.disabled = isViewOnly;
  });

  // Hide Save button in view mode
  document.getElementById("saveBtn").style.display = isViewOnly
    ? "none"
    : "inline-block";
}

function closeStatusModal() {
  document.getElementById("statusModal").classList.add("hidden");
}

const saveBtn = document.getElementById("saveBtn");
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
      duOffline: document.getElementById("duOffline").value,
      duRemark: document.getElementById("duRemark").value,
    };

    fetch(
      "https://script.google.com/macros/s/AKfycbymE1Hjtj0prXw0HkuvWpSdriDDwoECVv01VhzSq5dqjvIXOZajYMnxCUBGstPgCZx7kA/exec?action=saveUpdateStatus",
      {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statusData),
      }
    )
      .then(() => {
        Swal.fire("Success", "Status Updated Successfully!", "success");

        closeStatusModal();
        saveBtn.disabled = false;
        saveBtn.innerText = "Save";
        // Replace Add Status with Download File
        replaceButtonToDownload(statusData);
      })
      .catch(() => {
        Swal.fire("Error", "Failed to Update Status", "error");
        saveBtn.disabled = false;
        saveBtn.innerText = "Submit";
      });
  });

function replaceButtonToDownload(rowData) {
  const rows = document.querySelectorAll("#visitData tr");

  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    const roCodeCell = cells[3]?.innerText?.trim();
    const dateCell = cells[8]?.innerText?.trim();

    if (roCodeCell === rowData.roCode && dateCell === rowData.visitDate) {
      const btn = row.querySelector("button");
      if (btn && btn.innerText === "Add Status") {
        btn.innerText = "Download Status";
        btn.className = "bg-red-600 text-white px-2 py-1 rounded";
        btn.disabled = false;
        btn.onclick = () => generatePDF(rowData);
      }
    }
  });
}
