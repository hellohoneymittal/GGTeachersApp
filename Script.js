let classSubList = {};
let japaFlag = 0;
let qpClassList = [];
let qpTimestampMap = new Map();
let pendingExamList = {};
let japaClassList = {};
let japaStudentArr = [];
let chapterListArr = [];
let chapterData = {};
let selectedExamClass = "";
let selectedExamSubject = "";
let selectedExamDetails = {};
let totalSum = 0;
let maxMarksVal = 0;
let examDateVal = "";
let studentData = [];
let studentListArr = [];
let selectedStudentsArr = [];
let studentTimers = [];
let timerIntervalGGs = [];
let lstResponseData = [];
let studentIntervals = {};
let ctResponse = {};
let dataByClassResponse = "";
let japaData = "";
let inputPassword = "";
let inputMarksDetails = {};
let timetable_input_map = {};
let lessonPlanFlag = 0;

document.querySelectorAll(".accordion-header").forEach((header) => {
  header.addEventListener("click", () => {
    const content = header.nextElementSibling;

    content.classList.toggle("show");

    header.classList.toggle("active");
  });
});

const feedbackArr = [
  "😊Student's Behaviour is Perfect!👍",
  "Not Disciplined behaviour",
  "Not Follows Gurukul/Hostel schedule",
  "Not Active in class",
  "Not Complete homework on time",
  "Not Good quality of home work",
  "Not Chants seriously",
  "Not Sincere in bringing textbook/workbook/notebook",
  "Not Have good relations with others",
  "Not Show proper respect to teachers",
];

function updateTimerColor(color = "black", toggleBtn) {
  toggleBtn.classList.remove(
    "bulbwhite",
    "bulbyellow",
    "bulbgreen",
    "gg-button-icon",
    "bulbgreenDisabled",
  );
  toggleBtn.classList.add("gg-button-icon");

  // Timer styling
  if (color === "black") {
    toggleBtn.classList.add("bulbwhite");
  } else if (color === "yellow") {
    toggleBtn.classList.add("bulbyellow");
  } else if (color === "greenDisabled") {
    toggleBtn.classList.add("bulbgreenDisabled");
  } else {
    toggleBtn.classList.add("bulbgreen");
  }
}

// Event listener for exam class dropdown change
document.getElementById("examclass").addEventListener("change", function () {
  selectedExamClass = this.value.trim();
  populateExamSubjectDropdown(selectedExamClass);
  // Reset subject dropdown to default "Select" option when class is changed
  document.getElementById("examsubject").value = "";
  document.getElementById("pendingexam").value = "";
});

// Event listener for exam subject dropdown change
document.getElementById("examsubject").addEventListener("change", function () {
  selectedExamSubject = this.value.trim();
  // Reset subject dropdown to default "Select" option when class is changed
  document.getElementById("pendingexam").innerHTML = "";
  if (selectedExamClass && selectedExamSubject) {
    populatePendingExamDropdown(selectedExamClass, selectedExamSubject);
  }
});

document.getElementById("pendingexam").addEventListener("change", function () {
  if (this.value != "") {
    let exam_val_arr = this.value.trim().split("%")[1].split("#");
    selectedExamDetails = {
      row: exam_val_arr[0],
      maxMarks: exam_val_arr[1],
      handwritingNeeded: exam_val_arr[2],
      feedbackNeeded: exam_val_arr[3],
      commentNeeded: exam_val_arr[4],
      studentArr:
        pendingExamList[selectedExamClass][selectedExamSubject][
          this.value.trim()
        ],
      examName: this.value.trim().split("%")[0],
    };
  }

  checkAllSelected("examContainer", "examNext");
});

// Event listener for class dropdown change for Japa only
document.getElementById("classForJapa").addEventListener("change", function () {
  selectedClass = this.value.trim();

  if (selectedClass) {
    japaStudentArr = japaClassList[selectedClass];
    // Populate multi-select UI
    populateStudentMultiSelectDropdown(
      "dynamic-student-list-japa",
      japaStudentArr,
      "japaStudentList",
    );
  }

  checkAllSelected("attendanceForJapaContainer", "attendanceForJapaNext");
});

// Event listenenr for CT question
document.querySelectorAll('input[name="ctques"]').forEach((input) => {
  input.addEventListener("change", function () {
    document.getElementById("ErrClassTestQuestion").innerHTML = "";

    const dependentDiv = document.getElementById("ctReason");

    if (document.getElementById("ct-ques-no").checked)
      dependentDiv.style.display = "block";
    else {
      dependentDiv.style.display = "none";
      document.getElementById("ErrctReason").innerHTML = "";
      dependentDiv.value = "";
    }
  });
});

async function checkSelectedTest(rev = 0) {
  //This function comes intermediate, which checks if selected test is a class test then asks the user if needs to skip, else continue
  if (selectedExamDetails["examName"].toLowerCase().includes("class test")) {
    document.getElementById("ct-question-label").textContent =
      "Have you taken the " + selectedExamDetails["examName"] + "?";

    document
      .querySelectorAll('input[name="ctques"]')
      .forEach((radio) => (radio.checked = false));

    // hide reason textarea & clear value
    const reason = document.getElementById("ctReason");
    reason.value = "";
    reason.style.display = "none";

    // clear errors
    document.getElementById("ErrClassTestQuestion").textContent = "";
    document.getElementById("ErrctReason").textContent = "";

    SHOW_SPECIFIC_DIV("classTestPopup");
  } else if (rev == 0) showMarksWindow();
  else openExamsWindow();
}

async function goNextFromCt() {
  let valid_status = true;
  inputMarksDetails["class"] = selectedExamClass;
  inputMarksDetails["subject"] = selectedExamSubject;
  inputMarksDetails["row"] = selectedExamDetails["row"];
  inputMarksDetails["teacher"] = selectedTeacher;
  inputMarksDetails["ctReason"] = "";
  inputMarksDetails["marks"] = {};

  // Validate the fields

  let radioErr = document.getElementById("ErrClassTestQuestion");

  if (
    document.getElementById("ct-ques-yes").checked ||
    document.getElementById("ct-ques-no").checked
  )
    radioErr.innerHTML = "";
  else radioErr.innerHTML = "Please select an option!";

  let reasonBlock = document.getElementById("ctReason");
  if (reasonBlock.style.display == "block") {
    if (validateTextarea(reasonBlock))
      inputMarksDetails["ctReason"] = reasonBlock.value.trim();
  }

  document.querySelectorAll('[id^="Err"]').forEach((e) => {
    if (e.innerHTML.trim() != "") {
      valid_status = false;
      // console.log(e.innerHTML.trim())
      // console.log(e.id)
    }
  });

  if (valid_status) {
    if (inputMarksDetails["ctReason"] != "")
      SHOW_CONFIRMATION_POPUP(
        "Are you sure you want to submit your response?",
        submitExamMarks,
      );
    else showMarksWindow();
  }

  return valid_status;
}

async function openJapaWindow(in_flag = 0) {
  japaFlag = in_flag;
  let [h, m] = school_end_time.split(":").map(Number);
  let endMinutes = h * 60 + m;
  [h, m] = school_start_time.split(":").map(Number);
  let startMinutes = h * 60 + m;
  let now = new Date();
  let currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (now.getDay() === 0) {
    in_flag == 0
      ? SHOW_INFO_POPUP("⚠️ Cannot start student Japa on a Sunday!")
      : SHOW_INFO_POPUP("⚠️ Cannot mark attendance on a Sunday!");
    return;
  }

  if (currentMinutes > endMinutes || currentMinutes < startMinutes) {
    in_flag == 0
      ? SHOW_INFO_POPUP("⚠️ Cannot start Japa outside of school hours!")
      : SHOW_INFO_POPUP("⚠️ Cannot mark attendance outside of school hours!");
    return;
  }

  document.getElementById("classForJapa").value = "";

  const outputData = await CALL_API(
    API_TYPE_CONSTANT.GET_CLASS_STUDENTS_MAP,
    in_flag,
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
      in_flag == 0
        ? SHOW_INFO_POPUP(
            "No classes scheduled in Gurukul for today.<br/><br/>Cannot use this utility for Japa!",
          )
        : SHOW_INFO_POPUP(
            "No Examinations scheduled for today.<br/><br/>Cannot use this utility for Attendance!",
          );
      return;
    }

    japaClassList = outputData.response.data;
    populateJapaClassDropdown();
    document.getElementById("ErrStudentForJapa").innerHTML = "";

    SHOW_SPECIFIC_DIV("attendanceForJapaContainer");
  } else {
    SHOW_ERROR_POPUP("Unable to fetch the student list!!");
    return;
  }
}

async function openExamsWindow() {
  document.getElementById("examclass").value = "";
  document.getElementById("examsubject").value = "";
  document.getElementById("pendingexam").value = "";

  const outputData = await CALL_API(
    API_TYPE_CONSTANT.GET_TEACHER_PENDING_EXAMS,
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

    pendingExamList = outputData.response.data;
    if (Object.keys(pendingExamList).length == 0) {
      SHOW_INFO_POPUP("No Pending Examinations!");
      homePageClick();
    } else {
      populateExamClassDropdown();
      SHOW_SPECIFIC_DIV("examContainer");
    }
  } else {
    SHOW_ERROR_POPUP(
      "Unable to fetch the pending exams for teacher: " +
        selectedTeacher +
        "!!",
    );
    return;
  }
}

async function submitPass() {
  const errorDiv = document.getElementById("inputPasswordError");
  errorDiv.innerHTML = "";
  let password = GetControlValue("passworTxtBox");

  if (password) {
    password = password.trim();
    inputPassword = password;
    const inputData = {
      password: password,
      roleName: "all",
    };
    const outputData = await CALL_API(
      API_TYPE_CONSTANT.GET_TEACHER_ACCESS_BY_PASSWORD,
      inputData,
    );
    if (outputData?.status && outputData.response) {
      // Save login data in IndexedDB
      await DB_SET(
        INDEX_DB.storeKey,
        outputData.response,
        INDEX_DB.dbName,
        INDEX_DB.storeName,
      );
      loginData = outputData.response;
      renderMenus(outputData.response.name, outputData.response.role);
    } else {
      errorDiv.innerHTML = "Please enter correct password !!";
      return;
    }
  } else {
    errorDiv.innerHTML = "Password Required!";
    return;
  }

  homePageClick();
}

async function callChapterListApi() {
  const onlineRes = await IS_ONLINE();
  if (onlineRes) {
    const inputDataClsSub = {
      className: selectedClass,
      subjectName: selectedSubject,
    };
    const request = {
      apiType: API_TYPE_CONSTANT.GET_LIST_BY_CLASS_SUBJECT,
      inputData: inputDataClsSub,
    };
    try {
      const response = await API_HANDLER_AXIOS(request);

      if (response) {
        const chapters = response?.data[selectedClass]?.[selectedSubject];

        if (chapters) {
          chapterData = chapters;
          chapterListArr = Object.keys(chapters);
          populateMultiSelectDropdown();
        } else {
          return null;
        }
      } else {
        SHOW_ERROR_POPUP("Something Went Wrong");
      }
    } catch (ex) {
      SHOW_ERROR_POPUP("Error :- " + ex);
    }
  }
}

//  Function to populate the subject dropdown based on the selected class for examination
function populateExamSubjectDropdown(selectedClass) {
  const examsubjectDropdown = document.getElementById("examsubject");
  examsubjectDropdown.innerHTML = ""; // Clear existing subjects

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select";
  examsubjectDropdown.appendChild(defaultOption);

  if (pendingExamList[selectedClass]) {
    Object.keys(pendingExamList[selectedClass]).forEach((subject) => {
      const option = document.createElement("option");
      option.value = subject;
      option.textContent = subject;
      examsubjectDropdown.appendChild(option);
    });
  }
}

// Function to populate the pending exam dropdown based on the selected class and subject
function populatePendingExamDropdown(examClass, examSubject) {
  const examDropdown = document.getElementById("pendingexam");

  examDropdown.innerHTML = ""; // Clear existing subjects

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select";
  examDropdown.appendChild(defaultOption);

  if (pendingExamList[examClass] && pendingExamList[examClass][examSubject]) {
    Object.keys(pendingExamList[examClass][examSubject])
      .sort()
      .forEach((exam) => {
        const option = document.createElement("option");
        option.value = exam;
        option.textContent = exam.split("%")[0];
        examDropdown.appendChild(option);
      });
  }
}

//Function to populate the class dropdown for japa only
function populateJapaClassDropdown() {
  const classDropdown = document.getElementById("classForJapa");
  let i;

  classDropdown.innerHTML = ""; // Clear existing subjects

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select";
  classDropdown.appendChild(defaultOption);

  for (i in japaClassList) {
    if (japaFlag == 0 && i.includes("Keshava")) continue;

    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    classDropdown.appendChild(option);
  }
}

function pauseAllTimers(mainBtn) {
  document
    .querySelectorAll("#studentsJapaWindow .student")
    .forEach((student) => {
      const toggleBtn = student.querySelector(".gg-button-icon");
      if (toggleBtn.textContent.trim() === "Pause") {
        toggleBtn.click(); // pause karwa do
      }
    });

  mainBtn.textContent = "Resume All";
  updateTimerColor("yellow", mainBtn);
}

async function saveGGJapaData() {
  const mainBtn = document.getElementById("toggleAllBtn");
  pauseAllTimers(mainBtn);
  const inputData = studentTimers.map((stu) => ({
    className: selectedClass,
    subject: selectedSubject,
    name: stu.name,
    teacherName: selectedTeacher,
    time: formatTime(stu.elapsed),
  }));

  japaData = inputData;

  console.log("Request to save Japa data:", inputData);
  const outputData = await CALL_API(
    API_TYPE_CONSTANT.SAVE_GG_STUDENT_JAPA_DATA,
    inputData,
  );
  if (outputData?.status) {
    SHOW_SUCCESS_POPUP("Japa data saved successfully");
    resetJapaFormFields();
    populateJapaResultDataView(inputData);
    console.log(outputData);
  }
}

function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )} Sec`;
}

function resetJapaFormFields() {
  studentTimers = [];
  timerIntervalGGs = [];
  selectedClass = "";
  selectedSubject = "";
  document.getElementById("studentsJapaWindow").innerHTML = "";
  document.getElementById("studentsJapaContainer").style.display = "none";

  document.getElementById("class").value = "";
  document.getElementById("subject").value = "";

  document.querySelectorAll(".gg-timer").forEach((timer) => {
    timer.textContent = "00:00:000";
  });

  // Reset dropdown button text
  const dropdownBtn = document.querySelector(".dynamic-dropdown-btn");
  if (dropdownBtn) {
    dropdownBtn.innerText = "Select Student";
  }

  const mainBtn = document.getElementById("toggleAllBtn");
  mainBtn.textContent = "Start All";
  updateTimerColor("greenDisabled", mainBtn);
}

function groupByChapter(data) {
  const grouped = {};
  data.forEach(([chapter, type, desc]) => {
    if (!grouped[chapter]) grouped[chapter] = [];
    grouped[chapter].push({ type, desc });
  });
  return grouped;
}

function onChapterSelect(event) {
  const selectedValue = event.value;

  console.log("Selected Chapter Option:", selectedValue);

  // hide all task groups
  document
    .querySelectorAll(".chapter-tasks")
    .forEach((div) => (div.style.display = "none"));

  // show selected group agar exist kare to
  const selectedDiv = document.getElementById(event.id + "-tasks");
  if (selectedDiv) {
    selectedDiv.style.display = "block";
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function startAllTimers() {
  const mainBtn = document.getElementById("toggleAllBtn");
  const btnText = mainBtn.textContent.trim();

  if (btnText === "Start All") {
    // सारे timers start करो
    document
      .querySelectorAll("#studentsJapaWindow .student")
      .forEach((student) => {
        const toggleBtn = student.querySelector(".gg-button-icon");
        if (toggleBtn.textContent.trim() === "Start") {
          toggleBtn.click(); // start karwa do
        }
      });

    // main button update
    mainBtn.textContent = "Pause All";
    updateTimerColor("", mainBtn);
  } else if (btnText === "Pause All") {
    pauseAllTimers(mainBtn);
  } else if (btnText === "Resume All") {
    document
      .querySelectorAll("#studentsJapaWindow .student")
      .forEach((student) => {
        const toggleBtn = student.querySelector(".gg-button-icon");
        if (toggleBtn.textContent.trim() === "Resume") {
          toggleBtn.click();
        }
      });

    mainBtn.textContent = "Pause All";
    updateTimerColor("", mainBtn);
  }

  document.getElementById("japaSubmitButton").disabled = false;
}

function getSelectedStudents(name) {
  const selectedStudentsArr = [];
  document.querySelectorAll(`input[name="${name}"]:checked`).forEach((cb) => {
    selectedStudentsArr.push(cb.value);
  });
  console.log("Selected Students:", selectedStudentsArr);
  return selectedStudentsArr;
}

async function markAttendanceClick() {
  // if (dataByClassResponse === "") {
  //   SHOW_ERROR_POPUP("Wait for 2 sec to fetch chapter data");
  //   return;
  // }

  if (japaFlag == 0) selectedStudentsArr = getSelectedStudents("studentList");

  if (!Array.isArray(selectedStudentsArr) || selectedStudentsArr.length === 0) {
    SHOW_CONFIRMATION_POPUP(
      "Do you wish to proceed without selecting any student?",
      callMarkAttendanceClick,
    );
  } else {
    callMarkAttendanceClick();
  }
}

async function callMarkAttendanceClick() {
  // Attendance details format → हर student line by line
  if (japaFlag == 1) selectedSubject = "Examination";
  const attendanceStr = selectedStudentsArr.join("\n");
  const separatedStudentList =
    japaFlag == 0 ? studentListArr.join("\n") : japaStudentArr.join("\n");
  const apiPayload = {
    selectedClass,
    selectedSubject,
    selectedTeacher,
    studentList: separatedStudentList,
    //lessonPlan: lessonPlanStr,
    attendance: attendanceStr,
    sendWhatsappFlag: 0,
  };

  const outputData = await CALL_API(
    API_TYPE_CONSTANT.SAVE_ATTENDANCE,
    apiPayload,
  );

  if (outputData?.status) {
    apiPayload["sendWhatsappFlag"] = 1;
    CALL_API_WITHOUT_LOADING(API_TYPE_CONSTANT.SAVE_ATTENDANCE, apiPayload);
    SHOW_SUCCESS_POPUP("Attendance marked successfully!", async () => {
      if (selectedClass.includes("Keshava") || japaFlag == 1) {
        homePageClick();
        return;
      }

      if (selectedSubject) {
        const outputData1 = await CALL_API(
          API_TYPE_CONSTANT.GET_TEACHER_ELIGIBLE_SUBJECTS,
          selectedTeacher,
        );

        if (outputData1?.status && outputData1.response) {
          if (
            typeof outputData1.response === "string" &&
            outputData1.response.includes("ERR")
          ) {
            SHOW_ERROR_POPUP(outputData1.response.split("ERR: ")[1]);
            return;
          }

          eligibleHWList = outputData1.response.data;

          if (outputData1.response.infoMsg) {
            console.log(
              "Information from Eligible Subject Function:\n\n" +
                outputData1.response.infoMsg,
            );
          }

          if (
            Object.keys(eligibleHWList).length > 0 &&
            eligibleHWList[selectedClass] &&
            eligibleHWList[selectedClass][selectedSubject]
          ) {
            lessonPlanFlag = 1;
            selectedHwClass = selectedClass;
            selectedHwSubject = selectedSubject;
          }
        }
      }
      //lessonPlanFlag == 1 ? showLPWindow(1) : showJapaWindow();
      showJapaWindow();
    });
  } else {
    SHOW_ERROR_POPUP("ERROR in marking attendance!\n\n" + outputData.response);
    console.log(outputData.response);
  }
}

function markAttendanceforJapaClick() {
  selectedStudentsArr = getSelectedStudents("japaStudentList");
  let errorDiv = document.getElementById("ErrStudentForJapa");
  if (!Array.isArray(selectedStudentsArr) || selectedStudentsArr.length === 0) {
    errorDiv.innerHTML = "Please select at least one student!";
    return;
  } else {
    errorDiv.innerHTML = "";
    japaFlag == 0 ? showJapaWindow() : markAttendanceClick();
  }
}

function populateJapaResultDataView(data) {
  const container = document.getElementById("classDataContainer");
  const japaNextButton = document.getElementById("japaNext");

  // if (lessonPlanFlag == 0) {
  //   japaNextButton.innerHTML = "Home";
  //   japaNextButton.addEventListener("click", homePageClick);
  // } else {
  //   japaNextButton.innerHTML = "Fill Today's Work";
  //   japaNextButton.addEventListener("click", () => showLPWindow(1));
  // }

  // Group by className (optional — in case you later get multiple classes)
  const grouped = {};
  data.forEach((d) => {
    if (!grouped[d.className]) grouped[d.className] = [];
    grouped[d.className].push(d);
  });

  // Create UI for each class
  Object.keys(grouped).forEach((className) => {
    const classCard = document.createElement("div");
    classCard.className = "class-card";

    const header = document.createElement("div");
    header.className = "class-header";
    header.textContent = `${className} — ${grouped[className][0].subject}`;
    classCard.appendChild(header);

    grouped[className].forEach((student) => {
      const row = document.createElement("div");
      row.className = "student-row";

      const nameDiv = document.createElement("div");
      nameDiv.className = "student-name";
      nameDiv.textContent = student.name;

      const timeDiv = document.createElement("div");
      timeDiv.className = "student-time";
      timeDiv.textContent = student.time;

      const match = student.time.match(/(\d+):(\d+)\s*Sec/i);
      let totalSeconds = 0;
      if (match) {
        const min = parseInt(match[1]) || 0;
        const sec = parseInt(match[2]) || 0;
        totalSeconds = min * 60 + sec;
      }

      if (totalSeconds >= 360 && totalSeconds <= 450) {
        row.style.backgroundColor = "green";
        row.style.color = "white";
      } else {
        row.style.backgroundColor = "red";
        row.style.color = "white";
      }

      row.appendChild(nameDiv);
      row.appendChild(timeDiv);
      classCard.appendChild(row);
    });

    const teacher = document.createElement("div");
    teacher.className = "teacher-info";
    teacher.textContent = `Teacher: ${grouped[className][0].teacherName}`;
    classCard.appendChild(teacher);

    container.appendChild(classCard);
  });
  SHOW_SPECIFIC_DIV("classDataMainContainer");
}

function downloadJapaReportClick() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 20;
  let data = japaData;
  data.forEach((record, index) => {
    if (index === 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(`${record.className} — ${record.subject}`, 14, y);
      y += 10;

      doc.setFontSize(12);
      doc.text("Name", 14, y);
      doc.text("Time", 150, y);
      y += 8;
    }

    doc.setFont("helvetica", "normal");
    doc.text(record.name, 14, y);
    doc.text(record.time, 150, y);
    y += 8;
  });

  y += 10;
  doc.setFont("helvetica", "italic");
  doc.text(`Teacher: ${data[0].teacherName}`, 14, y);
  y += 10;

  const today = new Date().toLocaleString();
  doc.setFontSize(10);
  doc.text(`Generated on: ${today}`, 14, y);

  doc.save("Japa_Chanting_Report.pdf");
}

function setUserNameOnFrontScreen(devName) {
  const loginUserDiv = document.getElementById("login-user-name-div_fp");
  const loginUserLabel = document.getElementById("login-user-name-lbl_fp");

  if (devName) {
    loginUserDiv.style.display = "block";
    loginUserLabel.innerHTML = `<strong>${devName}</strong>`;
  } else {
    loginUserDiv.style.display = "none";
    loginUserLabel.innerHTML = `<strong>${devName}</strong>`;
  }
}

function validateNumber(input, maxMarks) {
  const enteredNum = input.value.trim();
  const errorDiv = document.getElementById("Err" + input.id);

  errorDiv.innerHTML = "";

  console.log("Checking for max marks: " + maxMarks);

  if (enteredNum != "") {
    if (Number(enteredNum) < 0 || Number(enteredNum) > maxMarks) {
      errorDiv.innerHTML = "Please enter marks between 0 and " + maxMarks + "!";
      input.value = "";
      return false;
    }
  } else if (input.required) {
    errorDiv.innerHTML = "Please enter a valid number!";
    return false;
  }

  return true;
}

function validateTextarea(input) {
  const namePattern = /^[A-Za-z0-9,.\-\s]+$/;
  const errorDiv = document.getElementById("Err" + input.id);

  errorDiv.innerHTML = "";

  let inputName = input.value.trim();

  if (!input.required && inputName == "") {
    return true;
  }

  if (inputName.length < 15) {
    errorDiv.innerHTML = "Need atleast 15 characters!";
    return false;
  }

  if (!namePattern.test(inputName)) {
    errorDiv.innerHTML =
      "Only letters, numbers, new line, spaces and special characters(, . -) allowed!";
    return false;
  }

  return true;
}

function resetExamForm() {
  document.querySelectorAll(".error").forEach((el) => {
    el.innerHTML = "";
  });
  document.querySelectorAll('[id^="comment_"]').forEach((input) => {
    input.style.display = "none";
  });

  document.querySelectorAll('input[type="number"]').forEach((input) => {
    input.value = "";
  });

  document.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.checked = false;
  });

  document.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.checked = false;
  });

  return;
}

function resetFormGenData(moveAway = 0) {
  if (moveAway == 0)
    SHOW_CONFIRMATION_POPUP("Do you want to reset form?", resetFormFields);
  else {
    resetFormFields();
    moveAway == 1
      ? SHOW_SPECIFIC_DIV("menuPopup")
      : SHOW_SPECIFIC_DIV("uploadMarksGridPopup");
  }
}

async function openTimeTableWindow() {
  const outputData = await CALL_API(
    API_TYPE_CONSTANT.GET_TEACHER_TIMETABLE,
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

    if (Object.keys(outputData.response.data).length == 0) {
      SHOW_INFO_POPUP("No classes scheduled for you!");
      return;
    }

    openVerifyDetailsWindow(
      outputData.response.header,
      [`Timetable for: ${selectedTeacher}`],
      outputData.response.data,
      homePageClick,
      "",
      "",
      ["Ok"],
    );
  } else {
    SHOW_ERROR_POPUP("Unable to fetch the timetable!!");
    return;
  }
}

async function distributeQPWindow() {
  const outputData = await CALL_API(
    API_TYPE_CONSTANT.GET_CLASS_EXAM_SCHEDULE,
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

    if (outputData.response.length == 0) {
      SHOW_INFO_POPUP("No examinations scheduled in Gurukul for today");
      return;
    }

    qpClassList = outputData.response;
    populateStudentMultiSelectDropdown(
      "dynamic-class-list-qp",
      qpClassList,
      "classList",
    );

    document.getElementById("qpSubmitBtn").disabled = true;
    qpTimestampMap.clear();

    SHOW_SPECIFIC_DIV("distributeQPContainer");
  } else {
    SHOW_ERROR_POPUP("Unable to fetch the examination schedule!!");
    return;
  }
}

document
  .getElementById("distributeQPContainer")
  .addEventListener("change", function (e) {
    if (e.target.type === "checkbox") {
      const value = e.target.value;
      const timestamp = new Date();

      if (e.target.checked) {
        qpTimestampMap.set(value, timestamp);
      } else {
        qpTimestampMap.delete(value);
      }

      document.getElementById("qpSubmitBtn").disabled =
        qpTimestampMap.size == 0;
    }
  });

async function submitQPDistribution() {
  const payload = Object.fromEntries(qpTimestampMap);

  console.log(payload);

  const outputData = await CALL_API(
    API_TYPE_CONSTANT.SUBMIT_QP_DISTRIBUTION_STATUS,
    payload,
  );

  if (
    outputData?.status &&
    outputData.response &&
    typeof outputData.response === "string"
  ) {
    console.log(outputData.response);
    if (outputData.response == "ok")
      SHOW_SUCCESS_POPUP("Response submitted Successfully!", homePageClick);
    else
      SHOW_ERROR_POPUP(
        "Unable to submit response for: !!\n\n" +
          outputData.response.split("ERR: ")[1],
      );
  } else SHOW_ERROR_POPUP("Unable to submit response !!");

  return;
}

const passwordDataBlock = document.getElementById("studentPasswordtableBlock");
const passwordClassSelect = document.getElementById("studentClassSelect");
const passwordTableBody = document.getElementById("studentPasswordTableBody");
const tableCard = document.getElementById("studentPasswordtableBlock");
let passwordOutData = {};

passwordClassSelect.addEventListener("change", loadStudentPasswords);

function loadStudentPasswords() {
  const selectedClass = passwordClassSelect.value;

  passwordTableBody.innerHTML = "";

  console.log(selectedClass);

  if (selectedClass === "") {
    tableCard.hidden = true;
    passwordDataBlock.hidden = true;
    return;
  }

  passwordDataBlock.hidden = false;

  tableCard.hidden = false;

  console.log(passwordOutData[selectedClass]);

  renderPasswordTable(passwordOutData[selectedClass]);
}

function renderPasswordTable(data) {
  passwordTableBody.innerHTML = "";
  let i;

  for (i = 0; i < data.length; i++) {
    let next_element = data[i];

    const row = document.createElement("tr");

    row.innerHTML = `

          <td>${next_element["name"]}</td>

          <td>${next_element["admission_num"]}</td>

          <td>${next_element["password"]}</td>

        `;

    passwordTableBody.appendChild(row);
  }
}

function processPasswordSessionData(text, subjectMap) {
  const lines = text.split("\n");

  lines.forEach((line) => {
    const match = line.match(/(.+) - (\d+)\/(\d+)/);

    if (!match) return;

    const subject = match[1].trim();

    const present = Number(match[2]);
    const total = Number(match[3]);

    if (!subjectMap[subject]) {
      subjectMap[subject] = {
        present: 0,
        total: 0,
      };
    }

    subjectMap[subject].present += present;
    subjectMap[subject].total += total;
  });
}

async function openStudentPasswordWindow() {
  let passwordOutputData = await CALL_API("GET_STUDENT_PASSWORD", {});

  if (passwordOutputData?.status && passwordOutputData.data) {
    if (
      typeof passwordOutputData.data === "string" &&
      passwordOutputData.data.includes("ERR")
    ) {
      SHOW_ERROR_POPUP(passwordOutputData.data.split("ERR: ")[1]);
      return;
    }

    passwordOutData = passwordOutputData.data;

    console.log(passwordOutData);

    document.getElementById("studentPasswordHeading_lbl").innerText =
      `${selectedTeacher}`;

    passwordTableBody.innerHTML = "";
    passwordClassSelect.innerHTML = "";

    passwordDataBlock.hidden = true;
    tableCard.hidden = true;

    let defaultOption = document.createElement("option");

    defaultOption.value = "";
    defaultOption.textContent = "---------Select Class--------";

    passwordClassSelect.appendChild(defaultOption);

    Object.keys(passwordOutData).forEach((className) => {
      passwordClassSelect.innerHTML += `
      <option value="${className}">
        ${className}
      </option>
    `;
    });

    SHOW_SPECIFIC_DIV("studentPasswordWindow");
  } else {
    SHOW_ERROR_POPUP("Some problem in fetching passwords for Students!");
    return;
  }
}

//Timetable Related

document
  .getElementById("timetableClassSelect")
  .addEventListener("change", loadTimetableSchedule);

async function openTimetableWindow() {
  const outputData = await CALL_API(API_TYPE_CONSTANT.GET_ALL_TIMETABLE, {});
  if (outputData?.status && outputData.response) {
    if (typeof outputData.response === "string") {
      if (outputData.response.includes("ERR"))
        SHOW_ERROR_POPUP(outputData.response.split("ERR: ")[1]);
      else SHOW_INFO_POPUP(outputData.response);
      return;
    }

    if (Object.keys(outputData.response.output).length == 0) {
      SHOW_INFO_POPUP("No timetable found!");
      return;
    }

    console.log(outputData.response);

    const parent_popup = document.getElementById("timetableGridPopup");
    const popup = document.getElementById("timetableGridSubPopup");
    const buttonRow = popup.querySelector(".button-row");
    const dropdown = document.getElementById("timetableClassDropdown");

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

    timetable_input_map = outputData.response;

    // Show the parent popup
    SHOW_SPECIFIC_DIV(parent_popup.id);
  } else {
    SHOW_ERROR_POPUP("Unable to fetch the timetable!!");
    return;
  }
}

function loadTimetableSchedule() {
  const selectedClass = document.getElementById("timetableClassSelect").value;
  const popup = document.getElementById("timetableGridSubPopup");
  const buttonRow = popup.querySelector(".button-row");
  const dropdown = document.getElementById("timetableClassDropdown");
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

  let header_arr = [selectedClass];
  let input_data_map = timetable_input_map.output;

  for (i = 0; i < header_arr.length; i++) {
    let class_header = timetable_input_map.header[header_arr[i]];

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
