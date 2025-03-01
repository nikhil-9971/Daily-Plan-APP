document.addEventListener("DOMContentLoaded", function () {
  const roCode = document.getElementById("roCode");
  const region = document.getElementById("region");
  const roName = document.getElementById("roName");
  const phase = document.getElementById("phase");
  const issueType = document.getElementById("issueType");
  const dateOfVisit = document.getElementById("date");
  const submitBtn = document.getElementById("submitBtn");
  const engineer = document.getElementById("engineer");
  const purpose = document.getElementById("purpose");

  // Set current date as default in Date of Visit field
  const today = new Date().toISOString().split("T")[0];
  dateOfVisit.value = today;

  roCode.addEventListener("input", function () {
    if (roCode.value.length === 8) {
      fetch(
        `https://script.google.com/macros/s/AKfycbw22jTT7iHCe_qCOXqx0Bzkx_5MZjAigZl17CM29lW1TtDfGfkaWGGK0l3iVOKKlayuoQ/exec?roCode=${roCode.value}`
      )
        .then((response) => response.json())
        .then((data) => {
          console.log("API Response:", data);
          if (data) {
            region.value = data.region || "Not Found";
            region.setAttribute("readonly", true);
            roName.value = data.roName || "Not Found";
            roName.setAttribute("readonly", true);
            phase.value = data.phase || "";
            phase.setAttribute("disabled", true);
            engineer.value = data.engineer || "";
          }
        })
        .catch((error) =>
          console.error("Error fetching RO Master data:", error)
        );
    }

    // When user enter NO PLAN in RO Code field
    if (roCode.value.toUpperCase() === "NO PLAN") {
      roCode.value = "N/A";
      convertRegionToDropdown();
      roName.value = "NO PLAN";
      roName.setAttribute("readonly", true);
      phase.value = "NO PLAN";
      phase.setAttribute("disabled", true);
      issueType.value = "NO PLAN";
      issueType.setAttribute("disabled", true);
      purpose.value = "NO PLAN";
      purpose.setAttribute("readonly", true);
    }
  });

  phase.addEventListener("change", function () {
    if (["NPL", "JIO BP", "IN LEAVE", "HPCL OFFICE"].includes(phase.value)) {
      region.removeAttribute("readonly");
      roName.removeAttribute("readonly");
      roCode.removeAttribute("maxlength");
    } else {
      roCode.setAttribute("maxlength", "8");
    }
  });

  function convertRegionToDropdown() {
    let select = document.createElement("select");
    select.id = "region";
    select.className =
      "w-full p-4 border rounded-xl bg-white focus:ring-4 focus:ring-blue-400 shadow-lg";

    let option1 = new Option("BEGUSARAI RET RO", "BEGUSARAI RET RO");
    let option2 = new Option("PATNA RET RO", "PATNA RET RO");

    select.appendChild(option1);
    select.appendChild(option2);

    region.replaceWith(select);
  }

  submitBtn.addEventListener("click", function (event) {
    event.preventDefault();

    // सभी इनपुट फील्ड्स को सेलेक्ट करें
    let requiredFields = [
      roCode,
      document.getElementById("region"),
      roName,
      engineer,
      phase,
      issueType,
      purpose,
      dateOfVisit,
    ];

    // चेक करें कि कोई फील्ड खाली तो नहीं है
    let emptyFields = requiredFields.filter(
      (field) => !field.value || field.value.trim() === ""
    );

    if (emptyFields.length > 0) {
      Swal.fire({
        title: "⚠️ Warning!",
        text: "सभी फ़ील्ड भरना अनिवार्य है!",
        icon: "warning",
        confirmButtonText: "OK",
        showClass: {
          popup: "animate__animated animate__fadeInDown",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp",
        },
      });
      return; // फॉर्म सबमिट नहीं होगा
    }

    let regionValue;
    const regionField = document.getElementById("region");
    if (regionField.tagName === "SELECT") {
      regionValue = regionField.options[regionField.selectedIndex].value;
    } else {
      regionValue = regionField.value;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = "Submitting... ⏳";

    const formData = {
      roCode: roCode.value,
      region: regionValue,
      roName: roName.value,
      engineer: engineer.value,
      phase: phase.value,
      issueType: issueType.value,
      purpose: purpose.value.toUpperCase(),
      dateOfVisit: dateOfVisit.value,
    };

    fetch(
      "https://script.google.com/macros/s/AKfycbw22jTT7iHCe_qCOXqx0Bzkx_5MZjAigZl17CM29lW1TtDfGfkaWGGK0l3iVOKKlayuoQ/exec",
      {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    )
      .then(() => {
        let timestamp = new Date().toLocaleString();
        Swal.fire({
          title: "✅ Success!",
          text: `Your today plan has been Submitted!\nPlan Submit Time: ${timestamp}`,
          icon: "success",
          confirmButtonText: "OK",
          timer: 3000, // Auto-close after 3 seconds
          timerProgressBar: true,
          showClass: {
            popup: "animate__animated animate__zoomIn",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut",
          },
          customClass: {
            popup:
              "rounded-xl shadow-xl bg-gradient-to-r from-green-400 to-blue-500 text-white",
          },
        }).then(() => {
          document.querySelectorAll("input, select").forEach((field) => {
            if (field.id !== "date") {
              field.value = "";
            }
          });

          dateOfVisit.value = new Date().toISOString().split("T")[0];

          submitBtn.disabled = false;
          submitBtn.innerText = "🚀 Submit";
        });
      })
      .catch(() => {
        Swal.fire({
          title: "⚠️ Error!",
          text: "There was an issue submitting your details. Please try again.",
          icon: "error",
          confirmButtonText: "OK",
          showClass: {
            popup: "animate__animated animate__shakeX",
          },
          hideClass: {
            popup: "animate__animated animate__fadeOutDown",
          },
        });

        submitBtn.disabled = false;
        submitBtn.innerText = "🚀 Submit";
      });
  });
});
