let computer_output_map = {};
let datesheet_input_map = {};

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
  const defaultClassOption = document.createElement("option");

  defaultClassOption.value = "";
  defaultClassOption.textContent = "---------Select Class--------";

  classSelect.appendChild(defaultClassOption);

  loadClasses();

  const defaultOption = document.createElement("option");

  defaultOption.value = "";
  defaultOption.textContent = "---------Select Session--------";

  sessionSelect.appendChild(defaultOption);

  tableBlock.hidden = true;
  openWorkBtn.hidden = true;

  document.getElementById("computerExamHeading_lbl").innerText =
    `${selectedTeacher}`;

  // Show the parent popup
  SHOW_SPECIFIC_DIV("computerExamWindow");
}

document
  .getElementById("classSelect")
  .addEventListener("change", loadExamSchedule);

async function openDateSheetWindow() {
  const outputData = await CALL_API(API_TYPE_CONSTANT.GET_DATESHEET, {});
  if (outputData?.status && outputData.response) {
    if (typeof outputData.response === "string") {
      if (outputData.response.includes("ERR"))
        SHOW_ERROR_POPUP(outputData.response.split("ERR: ")[1]);
      else SHOW_INFO_POPUP(outputData.response);
      return;
    }

    if (Object.keys(outputData.response.output).length == 0) {
      SHOW_INFO_POPUP("No exams scheduled!");
      return;
    }

    console.log(outputData.response);

    const parent_popup = document.getElementById("examScheduleGridPopup");
    const popup = document.getElementById("examScheduleGridSubPopup");
    const buttonRow = popup.querySelector(".button-row");
    const dropdown = document.getElementById("classDropdown");

    dropdown.value = "";

    //Removing all elements or cleanup
    const heading = popup.querySelector(".heading");

    let current = heading.nextElementSibling;

    while (current && current !== buttonRow) {
      const next = current.nextElementSibling;
      if (current !== dropdown) {
        current.remove();
      }
      current = next;
    }

    datesheet_input_map = outputData.response;

    // Show the parent popup
    SHOW_SPECIFIC_DIV(parent_popup.id);
  } else {
    SHOW_ERROR_POPUP("Unable to fetch the datesheet!!");
    return;
  }
}

function loadExamSchedule() {
  const selectedClass = document.getElementById("classSelect").value;
  const popup = document.getElementById("examScheduleGridSubPopup");
  const buttonRow = popup.querySelector(".button-row");
  const dropdown = document.getElementById("classDropdown");
  const heading = popup.querySelector(".heading");

  //Removing all elements or cleanup

  let current = heading.nextElementSibling;

  while (current && current !== buttonRow) {
    const next = current.nextElementSibling;
    if (current !== dropdown) {
      current.remove();
    }
    current = next;
  }

  if (!selectedClass) {
    return;
  }

  let header_arr =
    selectedClass == "All"
      ? Object.keys(datesheet_input_map.header)
      : [selectedClass];
  let input_data_map = datesheet_input_map.output;

  for (i = 0; i < header_arr.length; i++) {
    let class_header = datesheet_input_map.header[header_arr[i]];

    // Add Header element
    const header = document.createElement("div");
    header.className = "heading";
    header.id = `StudentGridStatusText_${i}`;
    header.style.marginTop = "10px";
    popup.insertBefore(header, buttonRow);

    console.log(`${header_arr[i]}`);

    const container = document.createElement("div");

    if (typeof class_header === "string") {
      const text = document.createElement("h3");
      console.log(input_data_map[`${header_arr[i]}`]);
      text.innerHTML = input_data_map[`${header_arr[i]}`] + "\n";
      header.innerHTML = header_arr[i];
      container.appendChild(text);
      popup.insertBefore(container, buttonRow);
      continue;
    }

    // Add Table
    console.log(`Creating container with ID StudentGridContainer_${i}`);

    container.id = `StudentGridContainer_${i}`;

    container.classList.add(
      "collection-table-container",
      "scrollable-content-table",
    );

    // Avoid style string
    container.style.marginTop = "10px";

    // TABLE
    const table = document.createElement("table");
    table.id = `StudentGridTable_${i}`;

    // THEAD
    const thead = document.createElement("thead");
    thead.id = `StudentGridTHead_${i}`;
    thead.classList.add("table-header");

    // TBODY
    const tbody = document.createElement("tbody");
    tbody.id = `StudentGridTBody_${i}`;
    tbody.innerHTML = "";

    // Build hierarchy
    table.appendChild(thead);
    table.appendChild(tbody);

    container.appendChild(table);

    popup.insertBefore(container, buttonRow);

    populateActionGrid(
      `Student`,
      `${header_arr[i]}`,
      class_header,
      input_data_map[`${header_arr[i]}`],
      i,
    );
  }
}
