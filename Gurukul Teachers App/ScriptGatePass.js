let gatePassData = {};

async function openGatePassWindow() {
  let i;
  const outputData = await CALL_API(
    API_TYPE_CONSTANT.GET_PENDING_GATE_PASSES,
    "",
  );

  if (outputData?.status && outputData.response) {
    if (
      typeof outputData.response === "string" &&
      outputData.response.includes("ERR")
    ) {
      SHOW_ERROR_POPUP(outputData.response.split("ERR: ")[1]);
      return;
    }

    if (Object.keys(outputData.response.data).length == 0) {
      SHOW_INFO_POPUP(`No pending gate pass requests!`);
      return;
    }

    const teacherLeavesDiv = document.getElementById("gatePassHeading_div");
    const teacherLeavesLabel = document.getElementById("gatePassHeading_lbl");
    let nextButton = document.getElementById("gatePassNextBtn");
    const checkboxList = document.getElementById("gatePassWindow");

    nextButton.disabled = true;
    checkboxList.innerHTML = "";

    nextButton.onclick = function () {
      moveNextStepGatePass();
    };

    teacherLeavesDiv.style.display = "block";
    teacherLeavesLabel.innerHTML = `${selectedTeacher}`;

    checkboxList.addEventListener("change", function (e) {
      if (e.target.type === "radio") {
        const anyChecked = checkboxList.querySelector(
          'input[type="radio"]:checked',
        );

        nextButton.disabled = !anyChecked;
      }
    });

    const grid = document.createElement("div");
    grid.classList.add("question-grid");

    const checkboxContent = document.createElement("div");
    checkboxContent.className = "radio-content-without-flex";
    checkboxContent.id = "dynamic-feedback-list";

    const headerRow = document.createElement("div");
    headerRow.classList.add("radio-content-box-head-GP");
    headerRow.innerHTML = `
    <div class="radio-content-inbox">
        Student Name - Reason
    </div>

    <div class="radio-content-inbox">
        Accept
    </div>

    <div class="radio-content-inbox">
        Reject
    </div>
    `;

    grid.appendChild(headerRow);

    Object.entries(outputData.response.data).forEach(([student, details]) => {
      // 🔹 Pending Entries

      const row = document.createElement("div");
      row.classList.add("radio-content-box-GP");
      row.innerHTML = `
        <label>${student} - ${details["reason"]}</label>
        <div class="radio-content-inbox">
        <input type="radio" name="${student}_${details["reason"]}_${details["row_num"]}" id="${details["row_num"]}_${details["phone_num"]}_${details["otp"]}_Approved" value="${student} - ${details["reason"]}">
        </div>
        <div class="radio-content-inbox">
        <input type="radio" name="${student}_${details["reason"]}_${details["row_num"]}" id="${details["row_num"]}_${details["phone_num"]}_${details["otp"]}_Rejected" value="${student} - ${details["reason"]}">
        </div>
        `;

      grid.appendChild(row);
    });

    checkboxList.appendChild(grid);
  } else {
    SHOW_ERROR_POPUP("Problem in fetching details from Backend!");
    return;
  }

  SHOW_SPECIFIC_DIV("gatePassContainer");
}

function validateGPSelection() {
  let result = { rows: [] };
  let work_map = {};
  let i;
  let check_type = "radio";
  const parent_container = document.getElementById("gatePassContainer");

  const selected = parent_container.querySelectorAll(
    `input[type="${check_type}"]:checked`,
  );

  selected.forEach((el) => {
    const input_arr = el.id.split("_");
    const type = input_arr[3];
    const phone_num = input_arr[1];
    const row_num = input_arr[0];
    const text = el.value;

    if (!result[type]) result[type] = {};
    if (!result[type][phone_num]) result[type][phone_num] = "";
    if (!work_map[type + "_" + phone_num])
      work_map[type + "_" + phone_num] = [];

    result["rows"].push(type + " : " + row_num);
    work_map[type + "_" + phone_num].push(text);
  });

  for (i in work_map) {
    let index_split_arr = i.split("_");
    let question_arr = work_map[i];
    let out_text = "";

    for (let j = 0; j < question_arr.length; j++)
      out_text += question_arr[j] + "\n";

    result[index_split_arr[0]][index_split_arr[1]] = out_text.substring(
      0,
      out_text.length - 1,
    );
  }

  return result;
}

function moveNextStepGatePass() {
  gatePassData = validateGPSelection();
  if (gatePassData["ERR"] != null) {
    SHOW_ERROR_POPUP(gatePassData["ERR"]);
    return;
  }
  console.log("Selected Values:");
  console.log(gatePassData);

  let outGrid = {};
  let header_arr = [];

  for (let header in gatePassData) {
    if (header == "rows") continue;

    outGrid[header] = {};

    header_arr.push(header);
    for (let phone_num in gatePassData[header]) {
      let student_str = gatePassData[header][phone_num];
      let type_map = { Approved: "", Rejected: "" };

      type_map[header] += student_str + "\n";

      for (j in type_map)
        if (type_map[j] != "") {
          let map_key = `${phone_num}_${j}`;
          outGrid[header][map_key] = {};
          outGrid[header][map_key]["Phone Number"] = phone_num;
          outGrid[header][map_key]["Student - Reason"] = type_map[j];
        }
    }
  }

  openVerifyDetailsWindow(
    ["Phone Number", "Student - Reason"],
    header_arr,
    outGrid,
    () =>
      SHOW_CONFIRMATION_POPUP(
        "Are you sure to submit the approvals!",
        submitGatePass,
      ),
    "gatePassContainer",
  );
}

async function submitGatePass() {
  const inputData = {
    teacher: selectedTeacher,
    rowArr: gatePassData["rows"],
  };
  const outputData = await CALL_API("SUBMIT_GATE_PASS_APPROVALS", inputData);

  if (
    outputData?.status &&
    outputData.response &&
    typeof outputData.response === "string"
  ) {
    console.log(outputData.response);
    if (outputData.response == "ok")
      SHOW_SUCCESS_POPUP("Gatepass approvals submitted Successfully!", () => {
        SHOW_SPECIFIC_DIV("menuPopup");
      });
    else
      SHOW_ERROR_POPUP(
        "Unable to submit gatepass approvals !!\n\n" +
          outputData.response.split("ERR: ")[1],
      );
  } else SHOW_ERROR_POPUP("Unable to submit gatepass approvals !!");

  return;
}
