let pendingCheckHWList = {};
let selectedCheckHwClass = "";
let selectedCheckHwSubject = "";
let selectedHWStatus = {};

// Event listener for hw class dropdown change
document.getElementById("checkHWclass").addEventListener("change", function () {
  selectedCheckHwClass = this.value.trim();
  document.getElementById("checkHWNext").disabled = true;

  populateCheckHWSubjectDropdown();

  // Reset subject dropdown to default "Select" option when class is changed
  document.getElementById("checkHWsubject").value = "";
});

// Event listener for exam subject dropdown change
document
  .getElementById("checkHWsubject")
  .addEventListener("change", function () {
    selectedCheckHwSubject = this.value.trim();

    if (selectedCheckHwClass && selectedCheckHwSubject) {
      checkAllSelected("checkHWContainer", "checkHWNext");
    } else document.getElementById("checkHWNext").disabled = true;
  });

document
  .getElementById("selectCheckHWContainer")
  .addEventListener("change", function (e) {
    if (e.target.type === "radio" || e.target.type === "checkbox") {
      toggleSubmitButton("selectCheckHWContainer", "submitButtonCheckHW");
    }
  });

function validateHWStatusSelection() {
  let result = { row_cols: {} };
  let work_map = {};
  let i;
  const parent_container = document.getElementById("selectCheckHWContainer");

  const selected = parent_container.querySelectorAll(
    `input[type="radio"]:checked`,
  );

  selected.forEach((el) => {
    const input_arr = el.id.split("_");
    const chapter = input_arr[0];
    const hw_title = input_arr[1]; //hw_title
    const col_num = input_arr[3]; //col
    const status = input_arr[4]; //status
    const row_num = input_arr[2]; //row
    const text = el.value; //student name

    if (!result[status]) result[status] = {};
    if (!result[status][chapter]) result[status][chapter] = [];
    if (!result["row_cols"][status]) result["row_cols"][status] = [];

    if (!work_map[status + "_" + chapter + "_" + hw_title])
      work_map[status + "_" + chapter + "_" + hw_title] = [];

    result["row_cols"][status].push(row_num + " : " + col_num);
    work_map[status + "_" + chapter + "_" + hw_title].push(text);
  });

  for (i in work_map) {
    let index_split_arr = i.split("_");
    let student_arr = work_map[i];
    let out_text = index_split_arr[2] + " #% ";
    for (let j = 0; j < student_arr.length; j++)
      out_text += student_arr[j] + ", ";

    result[index_split_arr[0]][index_split_arr[1]].push(
      out_text.substring(0, out_text.length - 2),
    );
  }

  return result;
}

async function openHomeworkWindow() {
  document.getElementById("checkHWclass").value = "";
  document.getElementById("checkHWsubject").value = "";
  document.getElementById("checkHWNext").disabled = true;

  const outputData = await CALL_API(
    API_TYPE_CONSTANT.GET_TEACHER_PENDING_HOMEWORKS,
    selectedTeacher,
  );
  if (outputData?.status && outputData.response) {
    if (
      typeof outputData.response === "string" &&
      outputData.response.includes("ERR")
    ) {
      SHOW_ERROR_POPUP(outputData.response.split("ERR: ")[1]);
      return;
    }

    pendingCheckHWList = outputData.response.data;
    if (Object.keys(pendingCheckHWList).length == 0) {
      SHOW_INFO_POPUP("No Pending Homeworks!");
      homePageClick();
    } else {
      populateCheckHWClassDropdown();
      SHOW_SPECIFIC_DIV("checkHWContainer");
    }
  } else {
    SHOW_ERROR_POPUP(
      "Unable to fetch the pending homeworks for teacher: " +
        selectedTeacher +
        "!!",
    );
    return;
  }
}

// Function to populate the class dropdown for examination
function populateCheckHWClassDropdown() {
  const hwclassDropdown = document.getElementById("checkHWclass");
  const hwsubjectDropdown = document.getElementById("checkHWsubject");

  hwclassDropdown.innerHTML = ""; // Clear existing classes
  hwsubjectDropdown.innerHTML = "";

  // Default option for exam class
  let defaultClass = document.createElement("option");
  defaultClass.value = "";
  defaultClass.textContent = "Select";
  hwclassDropdown.appendChild(defaultClass);

  // Default option for subject
  let defaultSubject = document.createElement("option");
  defaultSubject.value = "";
  defaultSubject.textContent = "Select";
  hwsubjectDropdown.appendChild(defaultSubject);

  for (const className in pendingCheckHWList) {
    const option = document.createElement("option");
    option.value = className;
    option.textContent = className;
    hwclassDropdown.appendChild(option);
  }
}

//  Function to populate the subject dropdown based on the selected class for examination
function populateCheckHWSubjectDropdown() {
  const hwsubjectDropdown = document.getElementById("checkHWsubject");
  hwsubjectDropdown.innerHTML = ""; // Clear existing subjects

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select";
  hwsubjectDropdown.appendChild(defaultOption);

  if (pendingCheckHWList[selectedCheckHwClass]) {
    Object.keys(pendingCheckHWList[selectedCheckHwClass]).forEach((subject) => {
      const option = document.createElement("option");
      option.value = subject;
      option.textContent = subject;
      hwsubjectDropdown.appendChild(option);
    });
  }
}

function showHWCheckWindow() {
  const examDetailDiv = document.getElementById("selectCheckHWHeading_div");
  const examDetailLabel = document.getElementById("selectCheckHWHeading_lbl");
  let nextButton = document.getElementById("submitButtonCheckHW");

  nextButton.disabled = true;

  examDetailDiv.style.display = "block";
  examDetailLabel.innerHTML = `${selectedCheckHwClass} : ${selectedCheckHwSubject}`;
  nextButton.onclick = function () {
    submitHWStatus();
  };

  createMainAccordionHW("selectCheckHWWindow");

  SHOW_SPECIFIC_DIV("selectCheckHWContainer");
}

function submitHWStatus() {
  selectedHWStatus["class"] = selectedCheckHwClass;
  selectedHWStatus["subject"] = selectedCheckHwSubject;
  selectedHWStatus["teacher"] = selectedTeacher;
  selectedHWStatus["row_map"] = {};
  let j;

  let validationMap = validateHWStatusSelection();
  if (validationMap["ERR"] != null) {
    SHOW_ERROR_POPUP(validationMap["ERR"]);
    return;
  }
  console.log("Selected Values:");
  console.log(validationMap);
  selectedHWStatus["row_map"] = validationMap;

  let outGrid = {};
  let header_arr = [];

  for (let header in validationMap) {
    if (header == "row_cols") continue;

    outGrid[header] = {};

    header_arr.push(header);
    for (let chapter in validationMap[header]) {
      let work_arr = validationMap[header][chapter];
      let type_map = {};
      for (j = 0; j < work_arr.length; j++) {
        let split_arr = work_arr[j].split(" #% ");
        if (type_map[split_arr[0]] == null) type_map[split_arr[0]] = "";

        type_map[split_arr[0]] += split_arr[1] + "\n";
      }

      for (j in type_map)
        if (type_map[j] != "") {
          let map_key = `${chapter}_${j}`;
          outGrid[header][map_key] = {};
          outGrid[header][map_key]["Chapter"] = chapter;
          outGrid[header][map_key]["Homework"] = j;
          outGrid[header][map_key]["Students"] = type_map[j];
        }
    }
  }

  openVerifyDetailsWindow(
    ["Chapter", "Homework", "Students"],
    header_arr,
    outGrid,
    () =>
      SHOW_CONFIRMATION_POPUP(
        "Are you sure to proceed!",
        sendHomeworkStatusBackend,
      ),
    "selectCheckHWContainer",
  );
}

async function sendHomeworkStatusBackend() {
  console.log(selectedHWStatus);
  const outputData = await CALL_API(
    API_TYPE_CONSTANT.SUBMIT_HOMEWORK_STATUS,
    selectedHWStatus,
  );

  if (
    outputData?.status &&
    outputData.response &&
    typeof outputData.response === "string"
  ) {
    console.log(outputData.response);
    if (outputData.response == "ok")
      SHOW_SUCCESS_POPUP("Today's work submitted Successfully!", homePageClick);
    else
      SHOW_ERROR_POPUP(
        "Unable to submit home work status for: " +
          selectedHWStatus["class"] +
          " : " +
          selectedHWStatus["subject"] +
          "!!\n\n" +
          outputData.response.split("ERR: ")[1],
      );
  } else
    SHOW_ERROR_POPUP(
      "Unable to submit home work status for: " +
        selectedHWStatus["class"] +
        " : " +
        selectedHWStatus["subject"] +
        "!!",
    );

  return;
}

function createMainAccordionHW(inputId) {
  const mainContainer = document.getElementById(inputId);
  mainContainer.innerHTML = "";

  Object.entries(
    pendingCheckHWList[selectedCheckHwClass][selectedCheckHwSubject],
  ).forEach(([chapterTitle, homeworks]) => {
    const chapterItem = document.createElement("div");
    chapterItem.classList.add("accordion-item");

    const chapterHeader = document.createElement("button");
    chapterHeader.classList.add("accordion-header");
    chapterHeader.innerHTML = `${chapterTitle} <span class="icon">▶</span>`;

    const chapterContent = document.createElement("div");
    chapterContent.classList.add("accordion-content");

    chapterItem.appendChild(chapterHeader);
    chapterItem.appendChild(chapterContent);
    mainContainer.appendChild(chapterItem);

    // 🔹 Toggle Chapter
    chapterHeader.onclick = () => {
      chapterContent.classList.toggle("show");
      chapterHeader.classList.toggle("active");
    };

    // 🔹 HOMEWORK LEVEL
    Object.entries(homeworks).forEach(([hwTitle, students]) => {
      const typeItem = document.createElement("div");
      typeItem.classList.add("accordion-item");

      const typeHeader = document.createElement("button");
      typeHeader.classList.add("accordion-header");
      typeHeader.innerHTML = `${hwTitle} <span class="icon">▶</span>`;

      const typeContent = document.createElement("div");
      typeContent.classList.add("accordion-content");

      typeItem.appendChild(typeHeader);
      typeItem.appendChild(typeContent);

      // ✅ FIX: append inside chapterContent
      chapterContent.appendChild(typeItem);

      // 🔹 Toggle Homework
      typeHeader.onclick = () => {
        typeContent.classList.toggle("show");
        typeHeader.classList.toggle("active");
      };

      // 🔹 GRID
      const grid = document.createElement("div");
      grid.classList.add("question-grid");

      // 🔹 HEADER ROW
      const headerRow = document.createElement("div");
      headerRow.classList.add("radio-content-box-head");

      headerRow.innerHTML = `
        <div class="radio-content-inbox">
          Student Name
        </div>

        <div class="radio-content-inbox">
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Not<br/>Submitted
        </div>

        <div class="radio-content-inbox">
          Checked
        </div>
      `;

      grid.appendChild(headerRow);

      for (let i = 0; i < students.length; i++) {
        let [text, col_num, row_num] = students[i].split("%"); // ✅ clean split

        const row = document.createElement("div");
        row.classList.add("radio-content-box");

        row.innerHTML = `
          <label>${text}</label>

          <div class="radio-content-inbox">
            <input type="radio"
                   name="${chapterTitle}_${row_num}_${col_num}"
                   id="${chapterTitle}_${hwTitle}_${row_num}_${col_num}_Not Submitted"
                   value="${text}">
          </div>

          <div class="radio-content-inbox">
            <input type="radio"
                   name="${chapterTitle}_${row_num}_${col_num}"
                   id="${chapterTitle}_${hwTitle}_${row_num}_${col_num}_Checked"
                   value="${text}">
          </div>
        `;

        grid.appendChild(row);
      }

      typeContent.appendChild(grid);
    });
  });
}
