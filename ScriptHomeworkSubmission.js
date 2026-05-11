let eligibleHWList = {};
let selectedHwClass = "";
let selectedHwSubject = "";
let lp_option_map = {
  0: {
    class_test: "Class Test",
    revision: "Revision",
    book_questions: "Questions from textbook/workbook",
  },
  1: {
    class_test: "Class Test",
    revision: "Revision",
    book_questions: "Questions from textbook/workbook",
    custom_input: "Enter the topic(s) covered today",
  },
};
let selectedLessonPlan = {};

// Event listener for hw class dropdown change
document.getElementById("raiseHWclass").addEventListener("change", function () {
  selectedHwClass = this.value.trim();
  document.getElementById("raiseHWNext").disabled = true;

  populateHWSubjectDropdown();

  // Reset subject dropdown to default "Select" option when class is changed
  document.getElementById("raiseHWsubject").value = "";
});

// Event listener for exam subject dropdown change
document
  .getElementById("raiseHWsubject")
  .addEventListener("change", function () {
    selectedHwSubject = this.value.trim();

    if (selectedHwClass && selectedHwSubject) {
      checkAllSelected("raiseHWContainer", "raiseHWNext");
    } else document.getElementById("raiseHWNext").disabled = true;
  });

// Event listener for lesson plan radio
document
  .getElementById("dynamic-lp-list")
  .addEventListener("change", function (e) {
    if (e.target.name === "worktype") {
      let selected_value = e.target.id.trim();

      let comment_box = document.getElementById("custom_comment_text");
      let comment_err = document.getElementById("Errcustom_comment_text");
      let next_button = document.getElementById("nextButtonLP");

      next_button.disabled = true;
      next_button.innerHTML = "Submit";
      next_button.onclick = function () {
        submitLP();
      };

      if (selected_value === "custom_input") {
        comment_box.value = "";
        comment_box.style.display = "block";
        comment_err.innerHTML = "";
        comment_err.style.display = "block";

        comment_box.oninput = function () {
          let val = this.value.trim();

          if (val.length < 10) {
            comment_err.innerHTML = "Minimum 10 characters required";
            next_button.disabled = true;
          } else {
            comment_err.innerHTML = "";
            next_button.disabled = false;
          }
        };
      } else {
        if (comment_box) {
          comment_box.value = "";
          comment_box.style.display = "none";
          comment_err.innerHTML = "";
          comment_err.style.display = "none";
        }

        if (selected_value === "book_questions") {
          next_button.innerHTML = "Next";
          next_button.onclick = function () {
            showHWWindow();
          };
        }

        next_button.disabled = false;
      }
    }
  });

document
  .getElementById("selectHWContainer")
  .addEventListener("change", function (e) {
    if (e.target.type === "radio" || e.target.type === "checkbox") {
      toggleSubmitButton("selectHWContainer", "submitButtonLP");
    }
  });

function validateLPSelection(ct_sub) {
  let result = { rows: {} };
  let work_map = {};
  let i;
  let check_type = ct_sub == 0 ? "radio" : "checkbox";
  const parent_container = document.getElementById("selectHWContainer");

  const selected = parent_container.querySelectorAll(
    `input[type="${check_type}"]:checked`,
  );

  selected.forEach((el) => {
    const input_arr = el.id.split("_");
    const chapter = input_arr[0];
    const source = input_arr[1];
    const category = input_arr[2];
    const workType = input_arr[4];
    const row_num = input_arr[3];
    const text = el.value;

    if (!result[workType]) result[workType] = {};
    if (!result[workType][chapter]) result[workType][chapter] = [];
    if (!result["rows"][source]) result["rows"][source] = [];

    if (!work_map[workType + "_" + chapter + "_" + source + " #% " + category])
      work_map[workType + "_" + chapter + "_" + source + " #% " + category] =
        [];

    result["rows"][source].push(workType + " : " + row_num);
    work_map[workType + "_" + chapter + "_" + source + " #% " + category].push(
      text,
    );
  });

  for (i in work_map) {
    let index_split_arr = i.split("_");
    let question_arr = work_map[i];
    let out_text = index_split_arr[2] + " : ";
    for (let j = 0; j < question_arr.length; j++)
      out_text += question_arr[j] + ", ";

    result[index_split_arr[0]][index_split_arr[1]].push(
      out_text.substring(0, out_text.length - 2),
    );
  }

  return result;
}

async function openGenerateHomeworkWindow() {
  let school_end_time = "15:20";
  let [h, m] = school_end_time.split(":").map(Number);
  let endMinutes = h * 60 + m;
  let now = new Date();
  let currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (currentMinutes > endMinutes) {
    SHOW_INFO_POPUP("School Time over for Today! Cannot submit today's work!");
    return;
  }

  if (now.getDay() === 0) {
    SHOW_INFO_POPUP("Cannot submit today's work on a Sunday!");
    return;
  }

  document.getElementById("raiseHWclass").value = "";
  document.getElementById("raiseHWsubject").value = "";
  document.getElementById("raiseHWNext").disabled = true;

  const outputData = await CALL_API(
    API_TYPE_CONSTANT.GET_TEACHER_ELIGIBLE_SUBJECTS,
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

    eligibleHWList = outputData.response.data;
    if (outputData.response.infoMsg)
      console.log(
        "Information from Eligible Subject Function:\n\n" +
          outputData.response.infoMsg,
      );

    if (Object.keys(eligibleHWList).length == 0) {
      SHOW_INFO_POPUP(
        "No class-subjects available for raising Homework/Class Test Syllabus today!",
      );
      homePageClick();
    } else {
      populateHWClassDropdown();
      SHOW_SPECIFIC_DIV("raiseHWContainer");
    }
  } else {
    SHOW_ERROR_POPUP(
      "Unable to fetch the class-subjects for teacher: " +
        selectedTeacher +
        "!!",
    );
    return;
  }
}

// Function to populate the class dropdown for examination
function populateHWClassDropdown() {
  const hwclassDropdown = document.getElementById("raiseHWclass");
  const hwsubjectDropdown = document.getElementById("raiseHWsubject");

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

  for (const className in eligibleHWList) {
    const option = document.createElement("option");
    option.value = className;
    option.textContent = className;
    hwclassDropdown.appendChild(option);
  }
}

//  Function to populate the subject dropdown based on the selected class for examination
function populateHWSubjectDropdown() {
  const hwsubjectDropdown = document.getElementById("raiseHWsubject");
  hwsubjectDropdown.innerHTML = ""; // Clear existing subjects

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select";
  hwsubjectDropdown.appendChild(defaultOption);

  if (eligibleHWList[selectedHwClass]) {
    Object.keys(eligibleHWList[selectedHwClass]).forEach((subject) => {
      const option = document.createElement("option");
      option.value = subject;
      option.textContent = subject;
      hwsubjectDropdown.appendChild(option);
    });
  }
}

function showHWWindow() {
  const examDetailDiv = document.getElementById("selectHWHeading_div");
  const examDetailLabel = document.getElementById("selectHWHeading_lbl");
  let nextButton = document.getElementById("submitButtonLP");

  nextButton.disabled = true;

  examDetailDiv.style.display = "block";
  examDetailLabel.innerHTML = `${selectedHwClass} : ${selectedHwSubject}`;
  nextButton.onclick = function () {
    submitLP(Number(eligibleHWList[selectedHwClass][selectedHwSubject]["ct"]));
  };

  createMainAccordion("selectHWWindow");

  SHOW_SPECIFIC_DIV("selectHWContainer");
}

function submitLP(in_flag = 2) {
  selectedLessonPlan["class"] = selectedHwClass;
  selectedLessonPlan["subject"] = selectedHwSubject;
  selectedLessonPlan["teacher"] = selectedTeacher;
  selectedLessonPlan["worktype"] = "";
  selectedLessonPlan["workdescription"] = "";
  selectedLessonPlan["row_map"] = {};
  let j;

  if (in_flag === 2) {
    const selectedRadio = document.querySelector(
      'input[name="worktype"]:checked',
    );

    selectedLessonPlan["worktype"] = selectedRadio.value;
    selectedLessonPlan["workdescription"] = "CW:$\n" + selectedRadio.value;

    if (selectedRadio.id == "custom_input")
      selectedLessonPlan["workdescription"] =
        "CW:$\n" + document.getElementById("custom_comment_text").value.trim();

    SHOW_CONFIRMATION_POPUP(
      "Are you sure to submit today's work!",
      sendTodaysWorkBackend,
    );
  } else {
    selectedLessonPlan["worktype"] = "Questions from textbook/workbook";
    let validationMap = validateLPSelection(in_flag);
    if (validationMap["ERR"] != null) {
      SHOW_ERROR_POPUP(validationMap["ERR"]);
      return;
    }
    console.log("Selected Values:");
    console.log(validationMap);
    selectedLessonPlan["row_map"] = validationMap;

    let outGrid = {};
    let header_arr = [];

    for (let header in validationMap) {
      if (header == "rows") continue;

      outGrid[header] = {};

      header_arr.push(header);
      for (let chapter in validationMap[header]) {
        let work_arr = validationMap[header][chapter];
        let type_map = { Textbook: "", Workbook: "" };
        for (j = 0; j < work_arr.length; j++) {
          let split_arr = work_arr[j].split(" #% ");
          type_map[split_arr[0]] += split_arr[1] + "\n";
        }

        for (j in type_map)
          if (type_map[j] != "") {
            let map_key = `${chapter}_${j}`;
            outGrid[header][map_key] = {};
            outGrid[header][map_key]["Chapter"] = chapter;
            outGrid[header][map_key]["Source"] = j;
            outGrid[header][map_key]["Work"] = type_map[j];
          }
      }
    }

    openVerifyDetailsWindow(
      ["Chapter", "Source", "Work"],
      header_arr,
      outGrid,
      () =>
        SHOW_CONFIRMATION_POPUP(
          "Are you sure to submit today's work!",
          sendTodaysWorkBackend,
        ),
      "selectHWContainer",
    );
  }
}

async function sendTodaysWorkBackend() {
  console.log(selectedLessonPlan);
  const outputData = await CALL_API(
    API_TYPE_CONSTANT.SUBMIT_TODAYS_WORK,
    selectedLessonPlan,
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
        "Unable to submit today's work for: " +
          selectedLessonPlan["class"] +
          " : " +
          selectedLessonPlan["subject"] +
          "!!\n\n" +
          outputData.response.split("ERR: ")[1],
      );
  } else
    SHOW_ERROR_POPUP(
      "Unable to submit today's work for: " +
        selectedLessonPlan["class"] +
        " : " +
        selectedLessonPlan["subject"] +
        "!!",
    );

  return;
}

function showLPWindow() {
  const examDetailDiv = document.getElementById("selectLPHeading_div");
  const examDetailLabel = document.getElementById("selectLPHeading_lbl");
  const dynamic_option_element = document.getElementById("dynamic-lp-list");
  let ct_sub = Number(eligibleHWList[selectedHwClass][selectedHwSubject]["ct"]);
  let comment_needed = Number(
    eligibleHWList[selectedHwClass][selectedHwSubject]["comment"],
  );
  let custom_input_label =
    eligibleHWList[selectedHwClass][selectedHwSubject]["custom_label"];
  let book_question_enabled =
    Object.keys(
      eligibleHWList[selectedHwClass][selectedHwSubject]["question_map"],
    ).length > 0;
  let i;
  let next_button = document.getElementById("nextButtonLP");

  next_button.disabled = true;
  next_button.innerHTML = "Submit";
  examDetailDiv.style.display = "block";
  examDetailLabel.innerHTML = `${selectedHwClass} : ${selectedHwSubject}`;
  dynamic_option_element.innerHTML = "";

  let options_to_be_published = lp_option_map[ct_sub || comment_needed];

  //Generate dynamic values for lesson plan

  for (i in options_to_be_published) {
    let option_element = document.createElement("div");
    option_element.className = "options";

    let input_element = document.createElement("input");
    input_element.className = "custom-checkbox";
    input_element.name = "worktype";
    input_element.type = "radio";
    input_element.value = options_to_be_published[i];
    input_element.id = i;

    option_element.appendChild(input_element);

    let label_element = document.createElement("label");
    label_element.className = "custom-label-radio-content-custom-box";
    label_element.innerHTML = options_to_be_published[i];

    option_element.appendChild(label_element);

    dynamic_option_element.appendChild(option_element);

    if (i == "book_questions") {
      input_element.disabled = !book_question_enabled;
      if (!book_question_enabled) {
        label_element.classList.add("disabled-label");
      } else {
        label_element.classList.remove("disabled-label");
      }
    }

    if (i == "custom_input") {
      label_element.innerHTML = custom_input_label;
      input_element.value = custom_input_label;

      let text_element = document.createElement("textarea");
      text_element.required = true;
      text_element.placeholder = "Only Class Work to be entered!";
      text_element.style.display = "none";
      text_element.value = "";
      text_element.id = "custom_comment_text";

      dynamic_option_element.appendChild(text_element);

      let err_element = document.createElement("div");
      err_element.className = "error";
      err_element.id = "Errcustom_comment_text";
      err_element.style.display = "none";

      dynamic_option_element.appendChild(err_element);
    }
  }

  SHOW_SPECIFIC_DIV("selectLPContainer");
}

function createMainAccordion(inputId) {
  const mainContainer = document.getElementById(inputId);
  mainContainer.innerHTML = "";

  let ct_sub = eligibleHWList[selectedHwClass][selectedHwSubject]["ct"];

  Object.entries(
    eligibleHWList[selectedHwClass][selectedHwSubject]["question_map"],
  ).forEach(([chapterTitle, sources]) => {
    const chapterItem = document.createElement("div");

    const chapterHeader = document.createElement("button");
    chapterHeader.classList.add("accordion-header");
    chapterHeader.innerHTML = `${chapterTitle} <span class="icon">▶</span>`;

    const chapterContent = document.createElement("div");
    chapterContent.classList.add("accordion-content");

    chapterItem.appendChild(chapterHeader);
    chapterItem.appendChild(chapterContent);

    mainContainer.appendChild(chapterItem);

    chapterHeader.onclick = () => {
      chapterContent.classList.toggle("show")
        ? chapterHeader.classList.add("active")
        : chapterHeader.classList.remove("active");
    };

    // TEXTBOOK / WORKBOOK
    Object.entries(sources).forEach(([sourceTitle, types]) => {
      const sourceItem = document.createElement("div");

      const sourceHeader = document.createElement("button");
      sourceHeader.classList.add("accordion-header");
      sourceHeader.innerHTML = `${sourceTitle} <span class="icon">▶</span>`;

      const sourceContent = document.createElement("div");
      sourceContent.classList.add("accordion-content");

      sourceItem.appendChild(sourceHeader);
      sourceItem.appendChild(sourceContent);
      chapterContent.appendChild(sourceItem);

      sourceHeader.onclick = () => {
        sourceContent.classList.toggle("show")
          ? sourceHeader.classList.add("active")
          : sourceHeader.classList.remove("active");
      };

      // QUESTION TYPES
      Object.entries(types).forEach(([typeTitle, totalQuestions]) => {
        const typeItem = document.createElement("div");

        const typeHeader = document.createElement("button");
        typeHeader.classList.add("accordion-header");
        typeHeader.innerHTML = `${typeTitle} <span class="icon">▶</span>`;

        const typeContent = document.createElement("div");
        typeContent.classList.add("accordion-content");

        typeItem.appendChild(typeHeader);
        typeItem.appendChild(typeContent);
        sourceContent.appendChild(typeItem);

        typeHeader.onclick = () => {
          typeContent.classList.toggle("show")
            ? typeHeader.classList.add("active")
            : typeHeader.classList.remove("active");
        };

        // QUESTION GRID
        const grid = document.createElement("div");
        grid.classList.add("question-grid");

        // 🔹 HEADER ROW
        const headerRow = document.createElement("div");
        headerRow.classList.add("radio-content-box-head-HS");

        if (ct_sub == 0) {
          headerRow.innerHTML = `
        <div class="radio-content-inbox">
          Question Number
        </div>

        <div class="radio-content-inbox">
          Classwork
        </div>

        <div class="radio-content-inbox">
          Homework
        </div>
      `;
        } else {
          headerRow.innerHTML = `
        <div class="radio-content-inbox">
          Question Number
        </div>

        <div class="radio-content-inbox">
          Classwork
        </div>
      `;
        }

        grid.appendChild(headerRow);

        for (let i = 0; i < totalQuestions.length; i++) {
          let text = totalQuestions[i]["text"];
          let row_num = totalQuestions[i]["row"];

          const row = document.createElement("div");

          if (ct_sub == 0) {
            row.classList.add("radio-content-box-HS");
            row.innerHTML = `
          <label>${text}</label>
          <div class="radio-content-inbox">
          <input type="radio" name="${sourceTitle}_${row_num}" id="${chapterTitle}_${sourceTitle}_${typeTitle}_${row_num}_CW" value="${text}">
          </div>
          <div class="radio-content-inbox">
          <input type="radio" name="${sourceTitle}_${row_num}" id="${chapterTitle}_${sourceTitle}_${typeTitle}_${row_num}_HW" value="${text}">
          </div>
          `;
          } else {
            row.classList.add("radio-content-chkbox");
            row.innerHTML = `
          <label>${text}</label>
          <div class="radio-content-inbox">
          <input type="checkbox" name="${sourceTitle}_${row_num}" id="${chapterTitle}_${sourceTitle}_${typeTitle}_${row_num}_CW" value="${text}">
          </div>
          `;
          }

          grid.appendChild(row);
        }

        typeContent.appendChild(grid);
      });
    });
  });
}
