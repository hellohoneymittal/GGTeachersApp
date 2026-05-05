const department = document.getElementById("feedbackDepartment");
const comment = document.getElementById("feedbackComment");
const commentError = document.getElementById("feedbackCommentError");
const submitBtn = document.getElementById("submitFeedbackFromBtn");
const feedback_label_arr = [
  "teacher-existing-feedback-lbl_user",
  "teacher-feedback-input-lbl_user",
  "teacher-feedback-menu-lbl_user",
];

// Enable textarea when department selected
department.addEventListener("change", function () {
  if (this.value !== "") {
    comment.disabled = false;
    comment.focus();
  } else {
    comment.disabled = true;
    submitBtn.disabled = true;
    comment.value = "";
  }
});

// Enable submit only if 30+ characters
comment.addEventListener("input", function () {
  const textLength = this.value.trim().length;
  if (textLength < 30) {
    submitBtn.disabled = true;
    commentError.innerHTML = "Minimum 30 characters needed!";
  } else {
    submitBtn.disabled = false;
    commentError.innerHTML = "";
  }
});

function resetFeedbackForm() {
  document.getElementById("feedbackForm").reset();
  submitBtn.disabled = true;
  comment.disabled = true;
  commentError.innerHTML = "";
}

function openFeedbacksWindow() {
  //Populating all info blocks
  for (i = 0; i < feedback_label_arr.length; i++) {
    document.getElementById(feedback_label_arr[i]).innerText =
      `${selectedTeacher}`;
  }
  SHOW_SPECIFIC_DIV("feedbackMenuPopup");
}

async function submitFeedback() {
  let value = comment.value;
  let dept_value = department.value;

  const outputData = await CALL_API("SUBMIT_TEACHER_FEEDBACK", {
    teacherName: selectedTeacher,
    comment: value,
    department: dept_value,
  });

  if (outputData?.status && outputData.data) {
    if (
      typeof outputData.data === "string" &&
      outputData.data.includes("ERR")
    ) {
      SHOW_ERROR_POPUP(outputData.data.split("ERR: ")[1]);
      return;
    }

    SHOW_SUCCESS_POPUP(
      "Feedback submitted successfully!\n\nPlease track the status through this App!",
      SHOW_SPECIFIC_DIV("parentMenuPopup"),
    );
  } else {
    SHOW_ERROR_POPUP("Internal error!");
    return;
  }
}

async function getTeacherFeedback() {
  let value = comment.value;
  let dept_value = department.value;
  let input_map;
  let i, j;

  const outputData = await CALL_API("GET_TEACHER_FEEDBACKS", {
    teacherName: selectedTeacher,
  });

  if (outputData?.status && outputData.data) {
    if (
      typeof outputData.data === "string" &&
      outputData.data.includes("ERR")
    ) {
      SHOW_ERROR_POPUP(outputData.data.split("ERR: ")[1]);
      return;
    }

    input_map = outputData.data;

    let outGrid = {};
    let header_arr = [];
    let columnNames_arr = [];

    for (let header in input_map) {
      outGrid[header] = {};

      if (input_map[header]["data"].length == 0) {
        console.log(`Skipping header: ${header} as length is 0!`);
        continue;
      }

      header_arr.push(header);
      columnNames_arr.push(input_map[header]["columns"]);

      for (i = 0; i < input_map[header]["data"].length; i++)
        outGrid[header][i] = input_map[header]["data"][i];
    }

    console.log(outGrid);

    openFeedbackGridWindow(
      columnNames_arr,
      header_arr,
      outGrid,
      () => SHOW_SPECIFIC_DIV("feedbackMenuPopup"),
      "",
      "Existing Feedback/Issues",
      ["Ok"],
      "existingFeedback",
    );
  } else {
    SHOW_ERROR_POPUP("Internal error!");
    return;
  }
}

function openFeedbackGridWindow(
  columnNames = [],
  headerArr = [],
  inputMap,
  submitClassBack,
  returnId = "",
  gridHeading = "Verify Details",
  buttonLables = ["Submit", "Back"],
  headerPrefix = "verifyDetails",
) {
  const parent_popup = document.getElementById("existingFeedbackPopup");
  const popup = document.getElementById("existingFeedbackSubPopup");
  const verifySubmitButton = document.getElementById(
    "existingFeedbackSubmitBtn",
  );
  const returnSubmitButton = document.getElementById(
    "existingFeedbackBackButton",
  );
  const buttonRow = popup.querySelector(".button-row");
  const gridheadingelement = document.getElementById("gridHeading");

  if (gridHeading == "") gridheadingelement.hidden = true;
  else gridheadingelement.innerHTML = gridHeading;

  let cntr = 0;

  verifySubmitButton.onclick = function () {
    submitClassBack();
  };

  returnSubmitButton.hidden = true;

  verifySubmitButton.innerHTML = buttonLables[0];

  if (buttonLables.length == 2) {
    returnSubmitButton.innerHTML = buttonLables[1];
    returnSubmitButton.onclick = function () {
      SHOW_SPECIFIC_DIV(returnId);
    };

    returnSubmitButton.hidden = false;
  }

  //Removing all elements or cleanup
  const heading = popup.querySelector("h2");

  let current = heading.nextElementSibling;

  while (current && current !== buttonRow) {
    const next = current.nextElementSibling;
    current.remove();
    current = next;
  }

  for (cntr = 0; cntr < headerArr.length; cntr++) {
    // Add Header element
    const header = document.createElement("div");
    header.className = "heading";
    header.id = `${headerPrefix}GridStatusText_${cntr}`;
    header.style.marginTop = "10px";
    popup.insertBefore(header, buttonRow);

    // Add Table

    const container = document.createElement("div");
    console.log(
      `Creating container with ID ${headerPrefix}GridContainer_${cntr}`,
    );

    container.id = `${headerPrefix}GridContainer_${cntr}`;

    container.classList.add(
      "collection-table-container",
      "scrollable-content-table",
    );

    // Avoid style string
    container.style.marginTop = "10px";

    // TABLE
    const table = document.createElement("table");
    table.id = `${headerPrefix}GridTable_${cntr}`;

    // THEAD
    const thead = document.createElement("thead");
    thead.id = `${headerPrefix}GridTHead_${cntr}`;
    thead.classList.add("table-header");

    // TBODY
    const tbody = document.createElement("tbody");
    tbody.id = `${headerPrefix}GridTBody_${cntr}`;
    tbody.innerHTML = "";

    // Build hierarchy
    table.appendChild(thead);
    table.appendChild(tbody);

    container.appendChild(table);

    popup.insertBefore(container, buttonRow);

    populateFeedbackActionGrid(
      `${headerPrefix}`,
      headerArr[cntr],
      columnNames[cntr],
      inputMap[headerArr[cntr]],
      cntr,
    );
  }

  // Show the parent popup
  SHOW_SPECIFIC_DIV(parent_popup.id);
}

function populateFeedbackActionGrid(
  inputType,
  inputMsg,
  columnNames,
  gridData,
  instance = 0,
) {
  const gridContainer = document.getElementById(
    inputType + "GridContainer_" + instance,
  );
  const statusTextElement = document.getElementById(
    inputType + "GridStatusText_" + instance,
  );
  let totalRows = 0;

  // Clear any existing content in the grid container
  statusTextElement.textContent = inputMsg;

  // Create the table element and headers dynamically
  let table = document.getElementById(inputType + "GridTable_" + instance);

  const thead = document.getElementById(`${inputType}GridTHead_${instance}`);
  thead.replaceChildren();

  const headerRow = document.createElement("tr");
  headerRow.id = `${inputType}GridTHRow_${instance}`;

  // Add table headers dynamically from columnNames array
  columnNames.forEach((column) => {
    const th = document.createElement("th");
    th.textContent = column; // Use displayName for the header
    th.style.textAlign = "center";
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.getElementById(`${inputType}GridTBody_${instance}`);
  tbody.replaceChildren();

  console.info(gridData);

  // Populate table rows dynamically from gridData
  for (let key in gridData) {
    const row = document.createElement("tr");
    let spiritualFlag = gridData[key]["Spiritual Mentor's Name"] == "" ? 0 : 1;
    row.id = `${inputType}GridTRow_${instance}_${totalRows}`;
    row.dataset.name = `TableRow_${key}`;

    // Add each data field into a new table cell (td)
    columnNames.forEach((column) => {
      if (gridData[key][column] == null) return;
      const td = document.createElement("td");

      if (column === "Description") {
        const container = document.createElement("div");
        container.className = "desc-container";

        const textDiv = document.createElement("div");
        textDiv.className = "desc-text";
        textDiv.innerText = gridData[key][column];

        const toggle = document.createElement("span");
        toggle.className = "toggle-btn read-more";
        toggle.innerText = "Read more ▼";

        const toggleHandler = () => {
          const expanded = textDiv.classList.toggle("expanded");

          if (expanded) {
            toggle.innerText = "Show less ▲";
            toggle.classList.remove("read-more");
            toggle.classList.add("show-less");
          } else {
            toggle.innerText = "Read more ▼";
            toggle.classList.remove("show-less");
            toggle.classList.add("read-more");
          }
        };

        // Make BOTH clickable (better mobile UX)
        textDiv.addEventListener("click", toggleHandler);
        toggle.addEventListener("click", toggleHandler);

        container.appendChild(textDiv);
        container.appendChild(toggle);
        td.appendChild(container);
      } else {
        td.innerText = gridData[key][column];
      }

      //td.textContent = gridData[key][column];
      row.appendChild(td);
    });

    totalRows++;

    tbody.appendChild(row);
  }
  table.appendChild(tbody);

  // Append the table to the grid container
  gridContainer.appendChild(table);
  return totalRows;
}
