let computer_output_map = {};

const classSelect = document.getElementById("computerClassSelect");
const sessionSelect = document.getElementById("computerSessionSelect");
const viewQPBtn = document.getElementById("viewQPBtn");
const openWorkBtn = document.getElementById("openWorkBtn");
const tableBlock = document.getElementById("tableBlock");

// ----------------------
// Populate Classes
// ----------------------

function loadClasses() {
  Object.keys(computer_output_map).forEach((className) => {
    classSelect.innerHTML += `
      <option value="${className}">
        ${className}
      </option>
    `;
  });
}

// ----------------------
// On Class Change
// ----------------------

classSelect.addEventListener("change", function () {
  const selectedClass = this.value;

  sessionSelect.innerHTML = `<option value="">---------Select Session--------</option>`;

  if (!selectedClass) {
    tableBlock.hidden = true;
    openWorkBtn.hidden = true;
    return;
  }

  const sessions = computer_output_map[selectedClass];

  Object.keys(sessions).forEach((sessionName) => {
    sessionSelect.innerHTML += `
      <option value="${sessionName}">
        ${sessionName}
      </option>
    `;
  });
});

// ----------------------
// On Session Change
// ----------------------

sessionSelect.addEventListener("change", function () {
  const selectedClass = classSelect.value;
  const selectedSession = this.value;

  if (!selectedClass || !selectedSession) {
    tableBlock.hidden = true;
    openWorkBtn.hidden = true;
    return;
  }

  const examData = computer_output_map[selectedClass][selectedSession];

  // View Question Paper
  viewQPBtn.onclick = function () {
    window.open(examData.question_paper, "_blank");
  };

  tableBlock.hidden = false;

  document.getElementById("computerExamHeading").innerHTML =
    `Details for ${selectedClass} - ${selectedSession}`;

  if (examData.work_area) {
    openWorkBtn.onclick = function () {
      window.open(examData.work_area, "_blank");
    };
    openWorkBtn.hidden = false;
  } else openWorkBtn.hidden = true;
});

async function openComputerExamWindow() {
  let i, j;
  const outputData = await CALL_API("GET_COMPUTER_EXAMS", {
    teacherName: selectedTeacher,
  });

  if (typeof outputData?.data === "string") {
    if (outputData.data.includes("ERR")) {
      SHOW_ERROR_POPUP(outputData.data.split("ERR: ")[1]);
    } else SHOW_INFO_POPUP(outputData.data);
    return;
  }

  if (outputData && Object.keys(outputData.data.output).length == 0) {
    SHOW_INFO_POPUP("No Computer Exam Found for today!");
    return;
  }

  if (!outputData) {
    SHOW_ERROR_POPUP("Problem in fetching Computer Exams!");
    return;
  }

  computer_output_map = outputData.data.output;
  console.log(computer_output_map);

  // Clear old options
  sessionSelect.innerHTML = "";
  classSelect.innerHTML = "";

  // Default option
  let defaultOption = document.createElement("option");

  defaultOption.value = "";
  defaultOption.textContent = "---------Select Session--------";

  sessionSelect.appendChild(defaultOption);

  defaultOption = document.createElement("option");

  defaultOption.value = "";
  defaultOption.textContent = "---------Select Class--------";

  classSelect.appendChild(defaultOption);

  loadClasses();

  // Create options dynamically from keys
  Object.keys(computer_output_map).forEach((key) => {
    const option = document.createElement("option");

    option.value = key;
    option.textContent = key;

    sessionSelect.appendChild(option);
  });

  tableBlock.hidden = true;
  openWorkBtn.hidden = true;

  document.getElementById("computerExamHeading_lbl").innerText =
    `${selectedTeacher}`;

  // Show the parent popup
  SHOW_SPECIFIC_DIV("computerExamWindow");
}
