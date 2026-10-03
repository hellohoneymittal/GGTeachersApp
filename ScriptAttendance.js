let selectedTeacher = "";
let selectedClass = "";
let selectedSubject = "";
let examNextDay = 0;
let teacherMarkTime = "";

const questions = [
  {
    q: "Do you give homework that takes around 25 minutes to complete?",
    correct: "Yes",
  },
  {
    q: "Do you sometimes delay checking the class test beyond 3 days?",
    correct: "No",
  },
  { q: "Am I conducting chanting sessions seriously?", correct: "Yes" },
  {
    q: "Do you usually announce class tests just before taking them?",
    correct: "No",
  },
  {
    q: "Do you balance your focus between writing on the board and observing students?",
    correct: "Yes",
  },
  {
    q: "Have you ever made any personal remarks about a student in class?",
    correct: "No",
  },
  { q: "Is it true that homework is not given daily?", correct: "No" },
  {
    q: "Do you ensure that exams are checked within a week?",
    correct: "Yes",
  },
  {
    q: "Have you ever used physical punishment with students?",
    correct: "No",
  },
  {
    q: "Am I punctual and well-prepared in class?",
    correct: "Yes",
  },
  {
    q: "Do you stay in class or inform admin if you need to leave?",
    correct: "Yes",
  },
  {
    q: "Do I create a respectful environment?",
    correct: "Yes",
  },
  {
    q: "Is the average homework duration more than 30 minutes?",
    correct: "No",
  },
  { q: "Do you check unit test papers within 3 days?", correct: "Yes" },
  {
    q: "Am I NOT focussing on children while they are chanting?",
    correct: "No",
  },
  { q: "Am I having good interaction with students?", correct: "Yes" },
  {
    q: "Do you ignore students while writing continuously on the board?",
    correct: "No",
  },
  {
    q: "Do you humiliate students?",
    correct: "No",
  },
  {
    q: "Do you show any favoritism?",
    correct: "No",
  },
  {
    q: "Do you lose your temper?",
    correct: "No",
  },
  {
    q: "Do you discourage students to ask questions?",
    correct: "No",
  },
  {
    q: "Do I Write date, day, and topic clearly on board?",
    correct: "Yes",
  },
  {
    q: "Am I maintaining neat and inspiring handwriting?",
    correct: "Yes",
  },
  {
    q: "Am I appreciating effort and progress?",
    correct: "Yes",
  },
  {
    q: "Am I being a role model in values?",
    correct: "Yes",
  },
  {
    q: "Am I supporting every learner?",
    correct: "Yes",
  },
  {
    q: "Am I updating classwork & homework daily?",
    correct: "Yes",
  },
  {
    q: "Am I checking notebooks regularly with feedback?",
    correct: "Yes",
  },
  {
    q: "Do you ensure there are no personal or harsh remarks in class?",
    correct: "Yes",
  },
  {
    q: "Do you hit or shout at students when they misbehave?",
    correct: "No",
  },
  {
    q: "Do you spend equal time teaching and observing your students?",
    correct: "Yes",
  },
  {
    q: "Do you stay in the classroom during periods or notify when stepping out?",
    correct: "Yes",
  },
  {
    q: "Do you directly punish naughty children instead of counseling?",
    correct: "No",
  },
  {
    q: "Do you give learning work of a subject only before its Unit Test day, as per the guidelines?",
    correct: "Yes",
  },
  {
    q: "Do you give written homework only in Mathematics, English Grammar, or Hindi Grammar as per the guidelines?",
    correct: "Yes",
  },
];

let today = new Date().getDate();
let index = (today - 1) % questions.length; // so it loops if month > questions.length
let question = questions[index];

document.addEventListener("DOMContentLoaded", function () {
  const pledgeContainer = document.getElementById("pledgeContainer");
  const submitBtn = document.getElementById("mark_attendance_button");

  submitBtn.disabled = true;

  function isVisible(el) {
    return el.offsetParent !== null;
  }

  function validatePledge() {
    // If container is hidden → enable button
    if (!isVisible(pledgeContainer)) {
      submitBtn.disabled = false;
      return;
    }

    // Get only visible checkboxes inside container
    const checkboxes = pledgeContainer.querySelectorAll(".custom-checkbox");

    const allChecked = Array.from(checkboxes)
      .filter((cb) => isVisible(cb))
      .every((cb) => cb.checked);

    submitBtn.disabled = !allChecked;
  }

  // Listen to changes inside container
  pledgeContainer.addEventListener("change", validatePledge);

  // Also call when page loads or visibility might change
  validatePledge();
});

document.addEventListener("DOMContentLoaded", function () {
  const todaysQ = getTodaysQuestion();
  document.getElementById("ques-label").innerText = todaysQ.q;
});

// document.getElementById("mcq-pledge").addEventListener("change", validateAnswer);

document.querySelectorAll('input[name="ques"]').forEach((el) => {
  el.addEventListener("change", validateAnswer);
});

function validateAnswer() {
  // const pledgeChecked = document.getElementById("mcq-pledge").checked;
  const nextBtn = document.getElementById("nextBtn");
  const labelText = document.getElementById("ques-label").innerText.trim();
  const matchedQuestion = questions.find((item) => item.q.trim() === labelText);
  const selectedAnswer = document.querySelector(
    'input[name="ques"]:checked',
  )?.value;
  const errorDiv = document.getElementById("quesError");

  errorDiv.innerHTML = "";
  nextBtn.disabled = true;

  if (selectedAnswer === matchedQuestion.correct) nextBtn.disabled = false;
  else if (selectedAnswer && selectedAnswer !== matchedQuestion.correct)
    errorDiv.innerHTML = "Incorrect answer. Please try again!";
}

// Event listener for class dropdown change
document.getElementById("class").addEventListener("change", function () {
  selectedClass = this.value.trim();
  examNextDay = classSubList[selectedClass]["examNextDay"];
  populateSubjectDropdown(selectedClass);
  getTodaysQuestion;
  // Reset subject dropdown to default "Select" option when class is changed
  document.getElementById("subject").value = "";
});

// Event listener for subject dropdown change
document.getElementById("subject").addEventListener("change", function () {
  selectedSubject = this.value.trim();
  if (selectedClass && selectedSubject) {
    callStudentListLocal();
  }
  checkAllSelected("attendanceContainer", "attendanceNext");
});

function checkAllSelected(src, target) {
  let allSelected = true;
  let inputDiv = document.getElementById(src);
  inputDiv.querySelectorAll("select").forEach((item) => {
    allSelected = allSelected && item.value;
  });

  console.log(
    "Checking the div: " +
      src +
      " FOUND the select: " +
      allSelected +
      " -> " +
      target,
  );

  document.getElementById(target).disabled = !allSelected;
}

function callStudentListLocal() {
  const students = classSubList[selectedClass]?.students || [];
  studentData = students;
  studentListArr = [...students];

  // Populate multi-select UI
  populateStudentMultiSelectDropdown(
    "dynamic-student-list",
    studentListArr,
    "studentList",
  );
}

function populateStudentMultiSelectDropdown(outId, inArr, name) {
  const container = document.getElementById(outId);
  container.innerHTML = ""; // clear old list

  inArr.forEach((student, index) => {
    const studentId = `student-${index}`; // unique id per student

    const option = document.createElement("div");
    option.classList.add("options");

    if (student.includes(" - L"))
      option.innerHTML = `
      <input type="checkbox" id="${studentId} - L" name="${name}" value="${student}" class="custom-checkbox" disabled>
      <label for="${studentId}" class="disabled-label">${student.split(" - ")[0]}</label>
    `;
    else
      option.innerHTML = `
      <input type="checkbox" id="${studentId}" name="${name}" value="${student}" class="custom-checkbox">
      <label for="${studentId}" class="custom-label-student">${student}</label>
    `;

    container.appendChild(option);
  });
}

function getTodaysQuestion() {
  const today = new Date();
  const dayIndex = today.getDate(); // 1–31
  const qIndex = dayIndex % questions.length; // loop if > length
  return questions[qIndex];
}

// Function to populate the class dropdown
function populateClassDropdown() {
  const classDropdown = document.getElementById("class");
  const subDropdown = document.getElementById("subject");
  classDropdown.innerHTML = ""; // Clear existing classes

  subDropdown.innerHTML = "";

  let defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select";

  let defaultSubOption = document.createElement("option");
  defaultSubOption.value = "";
  defaultSubOption.textContent = "Select";

  classDropdown.appendChild(defaultOption);
  subDropdown.appendChild(defaultSubOption);

  for (const className in classSubList) {
    const option = document.createElement("option");
    option.value = className;
    option.textContent = className;
    classDropdown.appendChild(option);
  }
}

// Function to populate the class dropdown for examination
function populateExamClassDropdown() {
  const examclassDropdown = document.getElementById("examclass");
  const subjectDropdown = document.getElementById("examsubject");
  const pendingExamDropdown = document.getElementById("pendingexam");

  examclassDropdown.innerHTML = ""; // Clear existing classes
  subjectDropdown.innerHTML = "";
  pendingExamDropdown.innerHTML = "";

  // Default option for exam class
  let defaultClass = document.createElement("option");
  defaultClass.value = "";
  defaultClass.textContent = "Select";
  examclassDropdown.appendChild(defaultClass);

  // Default option for subject
  let defaultSubject = document.createElement("option");
  defaultSubject.value = "";
  defaultSubject.textContent = "Select";
  subjectDropdown.appendChild(defaultSubject);

  // Default option for pending exam
  let defaultPending = document.createElement("option");
  defaultPending.value = "";
  defaultPending.textContent = "Select";
  pendingExamDropdown.appendChild(defaultPending);

  for (const className in pendingExamList) {
    const option = document.createElement("option");
    option.value = className;
    option.textContent = className;
    examclassDropdown.appendChild(option);
  }
}

// Function to populate the subject dropdown based on the selected class
function populateSubjectDropdown(selectedClass) {
  const subjectDropdown = document.getElementById("subject");
  subjectDropdown.innerHTML = ""; // Clear existing subjects

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select";
  subjectDropdown.appendChild(defaultOption);

  if (classSubList[selectedClass] && classSubList[selectedClass].subjects) {
    classSubList[selectedClass].subjects.forEach((subject) => {
      const option = document.createElement("option");
      option.value = subject;
      option.textContent = subject;
      subjectDropdown.appendChild(option);
    });
  }
}

function showJapaWindow() {
  let japaSubButton = document.getElementById("japaSubmitButton");
  let popup_cnt = 0;

  japaSubButton.disabled = true;

  SHOW_SPECIFIC_DIV("studentsJapaContainer");
  const container = document.getElementById("studentsJapaWindow");
  container.innerHTML = ""; // Clear old UI

  selectedStudentsArr.forEach((name) => {
    let startTime = null;
    let timerIntervalGG = null;
    let elapsed = 0;

    const studentRecord = { name, elapsed: 0 };
    studentTimers.push(studentRecord);

    // UI
    const studentDiv = document.createElement("div");
    studentDiv.className = "student gg-row-layout";

    const title = document.createElement("div");
    title.textContent = name;
    title.className = "gg-name";
    studentDiv.appendChild(title);

    const timerDisplay = document.createElement("div");
    timerDisplay.className = "gg-timer";
    timerDisplay.textContent = "00:00:000";

    // TIMER stays hidden (background only)
    timerDisplay.style.display = "none";
    studentDiv.appendChild(timerDisplay);

    // START / PAUSE / RESUME BUTTON
    const startBtn = document.createElement("button");
    startBtn.textContent = "Start";
    startBtn.className = "gg-button-icon bulbgreenDisabled";

    // REJECT BUTTON
    const rejectBtn = document.createElement("button");
    rejectBtn.textContent = "Reject";
    rejectBtn.className = "gg-button-icon";
    rejectBtn.style.background = "red";
    rejectBtn.style.color = "white";

    studentDiv.appendChild(startBtn);
    studentDiv.appendChild(rejectBtn);

    container.appendChild(studentDiv);

    // --- TIMER UPDATE FUNCTION ---
    function updateDisplay() {
      const time = elapsed + (Date.now() - startTime);
      const minutes = Math.floor(time / 60000);
      const seconds = Math.floor((time % 60000) / 1000);
      const milliseconds = time % 1000;

      timerDisplay.textContent =
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0") +
        ":" +
        String(milliseconds).padStart(3, "0");

      studentRecord.elapsed = time;
    }

    // --- START/PAUSE/RESUME ---
    startBtn.addEventListener("click", () => {
      if (popup_cnt == 0 && lessonPlanFlag == 1) {
        showLPWindow(1);
        popup_cnt = 1;
      }
      japaSubButton.disabled = false;
      if (!timerIntervalGG) {
        startTime = Date.now();
        timerIntervalGG = setInterval(updateDisplay, 10);
        timerIntervalGGs.push(timerIntervalGG);
        startBtn.textContent = "Pause";
        updateTimerColor("", startBtn);
      } else {
        elapsed += Date.now() - startTime;
        clearInterval(timerIntervalGG);
        timerIntervalGGs = timerIntervalGGs.filter(
          (t) => t !== timerIntervalGG,
        );
        timerIntervalGG = null;
        startBtn.textContent = "Resume";
        updateTimerColor("yellow", startBtn);
      }
    });

    // --- REJECT BUTTON (UPDATED) ---
    rejectBtn.addEventListener("click", () => {
      SHOW_CONFIRMATION_POPUP(
        `Do you want to reject <span style="color:red;font-weight:bold;">${name}</span> Japa ?`,
        handleRejectStudent,
      );
    });

    function handleRejectStudent() {
      // STOP TIMER if running
      if (timerIntervalGG) {
        clearInterval(timerIntervalGG);
        timerIntervalGGs = timerIntervalGGs.filter(
          (t) => t !== timerIntervalGG,
        );
        timerIntervalGG = null;
      }

      // Name RED
      title.style.color = "red";

      // Timer text RED
      timerDisplay.style.color = "red";

      // Disable both buttons
      startBtn.disabled = true;
      rejectBtn.disabled = true;

      // Grey-out + disable hover
      startBtn.classList.remove("bulbgreen");
      startBtn.classList.add("bulbgreenDisabled", "disabled-btn");
      rejectBtn.classList.add("disabled-btn");

      // Reset record
      studentRecord.elapsed = 0;
    }
  });
}

async function openAttendanceWindow() {
  //28.657501589771897, 77.43753484576277
  const schoolLat = 28.657501589771897; // your school latitude
  const schoolLng = 77.43753484576277; // your school longitude
  const allowedRadius = 150; // meters
  let [h, m] = school_end_time.split(":").map(Number);
  let endMinutes = h * 60 + m;
  [h, m] = school_start_time.split(":").map(Number);
  let startMinutes = h * 60 + m;
  let now = new Date();
  let currentMinutes = now.getHours() * 60 + now.getMinutes();
  let ignoreTeachers = [];
  let result = 0;
  teacherMarkTime = teacherMarkTime || now;

  if (now.getDay() === 0) {
    SHOW_INFO_POPUP("⚠️ Cannot mark attendance on a Sunday!");
    return;
  }

  if (currentMinutes > endMinutes || currentMinutes < startMinutes) {
    SHOW_INFO_POPUP("⚠️ Cannot mark attendance outside of school hours!");
    return;
  }

  //Check current location
  if (!ignoreTeachers.includes(selectedTeacher)) {
    try {
      result = await checkLocation(schoolLat, schoolLng, allowedRadius);
    } catch (error) {
      console.error(error);
      if (error.message)
        SHOW_ERROR_POPUP(`❌ Action Disallowed ❌\n\nERROR: ${error.message}`);
      return;
    }

    if (result !== 1) {
      SHOW_ERROR_POPUP(
        `❌ Action Disallowed ❌\n\n⚠️ Your current location ${result.split("%")[1]} is ${result.split("%")[0]} away from Gurukul.\n\nAttendance can only be marked within the school campus.`,
      );
      return; // ✅ NOW this works as expected
    }

    console.log(`Inside Gurukul!`);
  }

  const outputData = await CALL_API_READ(
    API_TYPE_CONSTANT.GET_TEACHER_CLASS_SUBJECTS_AND_STUDENTS_BY_NAME,
    selectedTeacher,
  );

  SHOW_INFO_POPUP(
    "Attendance Login Time: " +
      teacherMarkTime.toLocaleString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
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
      SHOW_INFO_POPUP("No classes scheduled for today!");
      return;
    }

    ctResponse = outputData.response.cTResponse;
    classSubList = outputData.response.data;
    populateClassDropdown();
  } else {
    SHOW_ERROR_POPUP(
      "Unable to fetch the subjects for teacher: " + selectedTeacher + "!!",
    );
    return;
  }

  //Resetting the next page

  document.getElementById("nextBtn").disabled = true;

  document.querySelectorAll('input[name="ques"]').forEach((el) => {
    el.checked = false;
  });

  SHOW_SPECIFIC_DIV("pledgePopup");
}

async function goToStudentContainer() {
  const data = {
    className: selectedClass,
    subjectName: selectedSubject,
  };

  const nameDiv = document.getElementById("selectStudentsHeading_div");
  const nameLabel = document.getElementById("selectStudentsHeading_lbl");
  const submitBtn = document.getElementById("mark_attendance_button");
  let pledgeArr = [];

  submitBtn.disabled = true;

  nameDiv.style.display = "block";
  nameLabel.innerHTML = `${selectedClass} : ${selectedSubject}`;

  if (selectedSubject == "English") {
    pledgeArr.push(
      "I will use only English while speaking with students during the period.",
    );
  }

  if (selectedSubject == "Hindi") {
    pledgeArr.push(
      "मैं कक्षा के दौरान विद्यार्थियों से केवल हिंदी में ही बात करूँगा/करूँगी।",
    );
  }

  SHOW_SPECIFIC_DIV("stdAttendanceContainer");

  const pledgeDiv = document.getElementById("pledgeContainer");

  if (
    ctResponse[selectedClass] &&
    ctResponse[selectedClass].includes(selectedSubject.toLowerCase())
  ) {
    pledgeArr.push("I will take Learning Assessment Today!");
  } else if (examNextDay == 1) {
    pledgeArr.push("I will discuss question paper today!");
  }

  if (pledgeArr.length > 0) {
    pledgeDiv.style.display = "inline-block";
    // Populate multi-select UI
    populateStudentMultiSelectDropdown(
      "dynamic-pledge-list",
      pledgeArr,
      "pledgeList",
    );
  } else {
    pledgeDiv.style.display = "none"; // Hide
    submitBtn.disabled = false;
  }
}

async function getStudentDetails(inputLeaveFlag = 0) {
  const outputData = await CALL_API_READ(API_TYPE_CONSTANT.STUDENT_DETAILS, {
    leaveFlag: inputLeaveFlag,
  });
  const studentTbody = document.getElementById("studentTable");
  const studentSearch = document.getElementById("searchStudent");
  let studentsDetailsArr = [];

  document.getElementById("showStudentsHeading_lbl").innerHTML =
    selectedTeacher;

  function render(list) {
    studentTbody.innerHTML = "";

    list.forEach((student) => {
      studentTbody.innerHTML += `
        <tr>
            <td>${student[0]}</td>
            <td>${student[1]}</td>
            ${
              inputLeaveFlag == 0
                ? `<td>${student[3]}<br/><a href="tel:${student[4]}">${student[4]}</a><br/><br/>${student[5]}<br/><a href="tel:${student[6]}">${student[6]}</a></td>`
                : ""
            }
        </tr>`;
    });
  }

  studentSearch.addEventListener("input", () => {
    const text = studentSearch.value.toLowerCase();

    const filtered = studentsDetailsArr.filter(
      (student) =>
        student[0].toLowerCase().includes(text) ||
        student[1].toLowerCase().includes(text),
    );

    render(filtered);
  });

  if (outputData?.status && outputData.response) {
    if (typeof outputData.data === "string") {
      if (outputData.response.includes("ERR"))
        SHOW_ERROR_POPUP(outputData.response.split("ERR: ")[1]);
      else SHOW_INFO_POPUP(outputData.response);
      return;
    }

    if (outputData.response.output.length == 0) {
      SHOW_INFO_POPUP(`Unable to fetch Details!`);
      return;
    }

    studentsDetailsArr = outputData.response.output;

    console.log(studentsDetailsArr);

    render(studentsDetailsArr);

    SHOW_SPECIFIC_DIV("stdDetailsContainer");
  } else {
    SHOW_ERROR_POPUP("Unable to fetch student details!!");
    return;
  }
}

// ============================== TEACHER ATTENDANCE REPORT ==============================

let teacherAttendanceReportData = {};

let selectedAttendanceClass = "";
let selectedAttendanceSubject = "";
let selectedAttendanceTeacher = "";
let selectedAttendanceExam = "";
let attendanceTeacherNames = [];

function populateTeacherAttendanceExams() {
  const examSelect = document.getElementById("teacherAttendanceExam");

  if (!examSelect) return;

  examSelect.innerHTML = `
    <option value="" selected>
      All Exams
    </option>
  `;

  const examSet = new Set();

  // Get ALL exam names from ALL classes and subjects
  Object.values(teacherAttendanceReportData).forEach((classData) => {
    Object.values(classData).forEach((subjectData) => {
      Object.keys(subjectData).forEach((examName) => {
        examSet.add(examName);
      });
    });
  });

  [...examSet].sort().forEach((examName) => {
    const option = document.createElement("option");

    option.value = examName;
    option.textContent = examName;

    examSelect.appendChild(option);
  });

  // Exam is always available
  examSelect.disabled = false;
}

document
  .getElementById("teacherAttendanceClass")
  .addEventListener("change", function () {
    selectedAttendanceClass = this.value;

    selectedAttendanceSubject = "";
    selectedAttendanceTeacher = "";

    resetTeacherAttendanceSubject();

    // Clear teacher because Class/Subject route is being used
    document.getElementById("teacherAttendanceTeacherSearch").value = "";

    selectedAttendanceTeacher = "";
    hideTeacherSearchOptions();

    if (selectedAttendanceClass) {
      populateTeacherAttendanceSubjects();

      clearTeacherAttendanceReport();
    } else {
      renderDefaultTeacherAttendanceReport();
    }
  });

document
  .getElementById("teacherAttendanceSubject")
  .addEventListener("change", function () {
    selectedAttendanceSubject = this.value;

    if (selectedAttendanceSubject) {
      // Class + Subject route
      selectedAttendanceTeacher = "";

      document.getElementById("teacherAttendanceTeacherSearch").value = "";

      selectedAttendanceTeacher = "";
      hideTeacherSearchOptions();

      renderClassSubjectAttendanceReport();
    } else {
      renderDefaultTeacherAttendanceReport();
    }
  });

document
  .getElementById("teacherAttendanceExam")
  .addEventListener("change", function () {
    selectedAttendanceExam = this.value;

    // If Class + Subject are selected
    if (selectedAttendanceClass && selectedAttendanceSubject) {
      renderClassSubjectAttendanceReport();
      return;
    }

    // If Teacher is selected
    if (selectedAttendanceTeacher) {
      renderTeacherAttendanceReport();
      return;
    }

    // No Class/Subject/Teacher selected
    // → show DEFAULT low-attendance view,
    // filtered by the selected Exam
    renderDefaultTeacherAttendanceReport();
  });

function getClassSubjectAttendanceRecords() {
  const classData = teacherAttendanceReportData[selectedAttendanceClass];

  if (!classData) return [];

  const subjectData = classData[selectedAttendanceSubject];

  if (!subjectData) return [];

  const records = [];

  Object.entries(subjectData).forEach(([examName, examData]) => {
    if (selectedAttendanceExam && examName !== selectedAttendanceExam) {
      return;
    }

    normalizeAttendanceRecords(examData).forEach((record) => {
      records.push({
        examName,
        ...record,
      });
    });
  });

  return records;
}

function getTeacherAttendanceRecords() {
  const records = [];

  Object.entries(teacherAttendanceReportData).forEach(
    ([className, classData]) => {
      Object.entries(classData).forEach(([subjectName, subjectData]) => {
        Object.entries(subjectData).forEach(([examName, examData]) => {
          // Optional exam filter
          if (selectedAttendanceExam && examName !== selectedAttendanceExam) {
            return;
          }

          normalizeAttendanceRecords(examData).forEach((record) => {
            if (record.teacherName === selectedAttendanceTeacher) {
              records.push({
                className,
                subjectName,
                examName,
                ...record,
              });
            }
          });
        });
      });
    },
  );

  return records;
}

function resetTeacherAttendanceSubject() {
  const subjectSelect = document.getElementById("teacherAttendanceSubject");

  if (!subjectSelect) return;

  subjectSelect.innerHTML = `
    <option value="" selected>Select</option>
  `;

  subjectSelect.disabled = true;

  selectedAttendanceSubject = "";
}

function resetTeacherAttendanceExam() {
  const examSelect = document.getElementById("teacherAttendanceExam");

  if (!examSelect) return;

  examSelect.innerHTML = `
    <option value="" selected>
      All Exams
    </option>
  `;

  examSelect.disabled = false;

  selectedAttendanceExam = "";
}

function clearTeacherAttendanceReport() {
  document.getElementById("teacherAttendanceReportOutput").innerHTML = `
    <div class="teacher-attendance-message">
      Select subject to view report.
    </div>
  `;
}

async function openTeacherAttendanceReport() {
  // Reset selections
  selectedAttendanceClass = "";
  selectedAttendanceSubject = "";
  selectedAttendanceTeacher = "";
  selectedAttendanceExam = "";

  const response = await CALL_API_READ("GET_TEACHER_ATTENDANCE", {});

  if (!response || response.status !== true) {
    SHOW_ERROR_POPUP(
      response?.data || "Unable to load teacher attendance report.",
    );

    return;
  }

  if (typeof response.data === "string" && response.data.includes("ERR")) {
    SHOW_ERROR_POPUP(response.data.split("ERR: ")[1]);
    return;
  }

  teacherAttendanceReportData = response.data?.data || {};

  console.log(teacherAttendanceReportData);

  populateTeacherAttendanceClasses();
  populateTeacherAttendanceTeachers();

  resetTeacherAttendanceSubject();
  resetTeacherAttendanceExam();

  populateTeacherAttendanceExams();

  renderDefaultTeacherAttendanceReport();

  document.getElementById("teacherAttendanceReportHeading").innerHTML =
    selectedTeacher;

  SHOW_SPECIFIC_DIV("teacherAttendanceReportPopup");
}

function populateTeacherAttendanceClasses() {
  const classSelect = document.getElementById("teacherAttendanceClass");

  if (!classSelect) return;

  classSelect.innerHTML = `
    <option value="" selected>Select</option>
  `;

  Object.keys(teacherAttendanceReportData)
    .sort()
    .forEach((className) => {
      const option = document.createElement("option");
      option.value = className;
      option.textContent = className;
      classSelect.appendChild(option);
    });
}

function populateTeacherAttendanceTeachers() {
  const teacherSet = new Set();

  Object.values(teacherAttendanceReportData).forEach((classData) => {
    Object.values(classData).forEach((subjectData) => {
      Object.values(subjectData).forEach((examData) => {
        normalizeAttendanceRecords(examData).forEach((record) => {
          if (record.teacherName) {
            teacherSet.add(record.teacherName);
          }
        });
      });
    });
  });

  attendanceTeacherNames = [...teacherSet].sort((a, b) => a.localeCompare(b));

  const searchInput = document.getElementById("teacherAttendanceTeacherSearch");

  if (searchInput) searchInput.value = "";

  hideTeacherSearchOptions();
}

function populateTeacherAttendanceSubjects() {
  const subjectSelect = document.getElementById("teacherAttendanceSubject");

  if (!subjectSelect) return;

  subjectSelect.innerHTML = `
    <option value="" selected>Select</option>
  `;

  if (!selectedAttendanceClass) {
    subjectSelect.disabled = true;
    return;
  }

  const classData = teacherAttendanceReportData[selectedAttendanceClass];

  if (!classData) {
    subjectSelect.disabled = true;
    return;
  }

  Object.keys(classData)
    .sort()
    .forEach((subjectName) => {
      const option = document.createElement("option");

      option.value = subjectName;
      option.textContent = subjectName;

      subjectSelect.appendChild(option);
    });

  subjectSelect.disabled = Object.keys(classData).length === 0;
}

function normalizeAttendanceRecords(examData) {
  if (!examData) return [];

  // Recommended API format:
  // examData = [
  //   {
  //     teacherName: "...",
  //     ok: 12,
  //     late: 8,
  //     absent: 1,
  //     leaves: 2,
  //     total: 23
  //   }
  // ]

  if (Array.isArray(examData)) {
    return examData.map((record) => ({
      teacherName: record.teacherName || "",
      ok: Number(record.ok) || 0,
      late: Number(record.late) || 0,
      absent: Number(record.absent) || 0,
      leaves: Number(record.leaves) || 0,
      total: Number(record.total) || 0,
    }));
  }

  // In case API returns a single record instead of an array
  if (typeof examData === "object") {
    return [
      {
        teacherName: examData.teacherName || "",
        ok: Number(examData.ok) || 0,
        late: Number(examData.late) || 0,
        absent: Number(examData.absent) || 0,
        leaves: Number(examData.leaves) || 0,
        total: Number(examData.total) || 0,
      },
    ];
  }

  return [];
}

function renderClassSubjectAttendanceReport() {
  const output = document.getElementById("teacherAttendanceReportOutput");

  if (!output) return;

  if (!selectedAttendanceClass || !selectedAttendanceSubject) {
    clearTeacherAttendanceReport();
    return;
  }

  const records = getClassSubjectAttendanceRecords();

  if (!records.length) {
    output.innerHTML = `
      <div class="teacher-attendance-message">
        No attendance data found.
      </div>
    `;
    return;
  }

  let heading = `
    <div class="teacher-attendance-header">
      <h3>
        ${escapeHTML(selectedAttendanceClass)}
        - 
        ${escapeHTML(selectedAttendanceSubject)}
      </h3>

      <div class="teacher-attendance-subtitle">
        ${
          selectedAttendanceExam
            ? `Examination: ${escapeHTML(selectedAttendanceExam)}`
            : `All Examinations`
        }
      </div>
    </div>
  `;

  /*
    If an exam is selected, show one table.

    If no exam is selected, records from multiple exams
    are separated by examination.
  */

  let reportHTML = "";

  if (selectedAttendanceExam) {
    reportHTML = createTeacherAttendanceTable(records, false, false);
  } else {
    const examGroups = {};

    records.forEach((record) => {
      const examName = record.examName || "Unknown Examination";

      if (!examGroups[examName]) {
        examGroups[examName] = [];
      }

      examGroups[examName].push(record);
    });

    Object.entries(examGroups).forEach(([examName, examRecords]) => {
      reportHTML += `
          <div class="teacher-attendance-exam">

            <div class="teacher-attendance-exam-title">
              ${escapeHTML(examName)}
            </div>

            ${createTeacherAttendanceTable(examRecords, false, false)}

          </div>
        `;
    });
  }

  output.innerHTML = heading + reportHTML;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderTeacherAttendanceReport() {
  const output = document.getElementById("teacherAttendanceReportOutput");

  if (!output) return;

  if (!selectedAttendanceTeacher) {
    clearTeacherAttendanceReport();
    return;
  }

  const records = getTeacherAttendanceRecords();

  if (!records.length) {
    output.innerHTML = `
      <div class="teacher-attendance-message">
        No attendance data found for this teacher.
      </div>
    `;
    return;
  }

  const heading = `
    <div class="teacher-attendance-header">
      <h3>
        ${escapeHTML(selectedAttendanceTeacher)}
      </h3>

      <div class="teacher-attendance-subtitle">
        ${
          selectedAttendanceExam
            ? `Examination: ${escapeHTML(selectedAttendanceExam)}`
            : `All Examinations`
        }
      </div>
    </div>
  `;

  let reportHTML = "";

  if (selectedAttendanceExam) {
    // One selected examination
    reportHTML = createTeacherAttendanceTable(records, true, true);
  } else {
    // All examinations
    const examGroups = {};

    records.forEach((record) => {
      const examName = record.examName || "Unknown Examination";

      if (!examGroups[examName]) {
        examGroups[examName] = [];
      }

      examGroups[examName].push(record);
    });

    Object.entries(examGroups).forEach(([examName, examRecords]) => {
      reportHTML += `
          <div class="teacher-attendance-exam">

            <div class="teacher-attendance-exam-title">
              ${escapeHTML(examName)}
            </div>

            ${createTeacherAttendanceTable(examRecords, true, true)}

          </div>
        `;
    });
  }

  output.innerHTML = heading + reportHTML;
}

function createTeacherAttendanceTable(
  records,
  showClassSubject = false,
  hideTeacher = false,
) {
  if (!records || !records.length) {
    return `
      <div class="feedback-report-message">
        No attendance data found.
      </div>
    `;
  }

  let rowsHTML = "";

  records.forEach((record) => {
    const percentage = getAttendancePercentage(record);

    const percentageValue = Number(percentage);

    const percentageClass =
      percentageValue < 75
        ? "teacher-attendance-red"
        : "teacher-attendance-green";

    rowsHTML += `
      <tr>

        ${
          showClassSubject
            ? `
              <td>
                ${escapeHTML(record.className || "-")}
              </td>

              <td>
                ${escapeHTML(record.subjectName || "-")}
              </td>
            `
            : ""
        }

        ${
          !hideTeacher
            ? `
              <td>
                ${escapeHTML(record.teacherName || "-")}
              </td>
            `
            : ""
        }

        <td class="teacher-attendance-black">${record.ok}</td>

        <td class="teacher-attendance-red">
          ${record.late}
        </td>

        <td class="teacher-attendance-red">
          ${record.absent}
        </td>

        <td class="teacher-attendance-red">
          ${record.leaves}
        </td>

        <td class="teacher-attendance-black">${record.total}</td>

        <td class="${percentageClass}">
          ${percentage}%
        </td>

      </tr>
    `;
  });

  return `
    <div class="collection-table-container scrollable-content-table">

      <table class="
        ${hideTeacher ? "feedback-question-table2" : "feedback-question-table3"}
        teacher-attendance-table
        ${hideTeacher ? "teacher-attendance-teacher-table" : "teacher-attendance-class-subject-table"}
      ">

        <thead class="table-header">
          <tr>

            ${
              showClassSubject
                ? `
                  <th>Class</th>
                  <th>Subject</th>
                `
                : ""
            }

            ${!hideTeacher ? `<th>Teacher</th>` : ""}

            <th>OK</th>
            <th>Late</th>
            <th>Absent</th>
            <th>Leaves</th>
            <th>Total</th>
            <th>OK %</th>

          </tr>
        </thead>

        <tbody>
          ${rowsHTML}
        </tbody>

      </table>

    </div>
  `;
}

function getAttendancePercentage(record) {
  const total = Number(record.total) || 0;
  const ok = Number(record.ok) || 0;

  if (total === 0) {
    return "0.0";
  }

  return ((ok / total) * 100).toFixed(2);
}

function getLowAttendanceRecords() {
  const records = [];

  Object.entries(teacherAttendanceReportData).forEach(
    ([className, classData]) => {
      Object.entries(classData).forEach(([subjectName, subjectData]) => {
        Object.entries(subjectData).forEach(([examName, examData]) => {
          // Apply Exam filter
          if (selectedAttendanceExam && examName !== selectedAttendanceExam) {
            return;
          }

          normalizeAttendanceRecords(examData).forEach((record) => {
            const total = Number(record.total) || 0;
            const ok = Number(record.ok) || 0;

            if (total === 0) return;

            const okPercentage = (ok / total) * 100;

            // Only below 75%
            if (okPercentage < 75) {
              records.push({
                className,
                subjectName,
                examName,
                teacherName: record.teacherName || "",
                leaves: Number(record.leaves) || 0,
                absent: Number(record.absent) || 0,
                late: Number(record.late) || 0,
                ok: Number(record.ok) || 0,
                total,
                okPercentage,
              });
            }
          });
        });
      });
    },
  );

  // Lowest OK % first
  records.sort((a, b) => a.okPercentage - b.okPercentage);

  return records;
}

function renderDefaultTeacherAttendanceReport() {
  const output = document.getElementById("teacherAttendanceReportOutput");

  if (!output) return;

  const records = getLowAttendanceRecords();

  if (!records.length) {
    output.innerHTML = `
      <div class="feedback-report-message">
        No teacher attendance below 75% found.
      </div>
    `;
    return;
  }

  // Show Examination column only when All Exams is selected
  const showExamColumn = !selectedAttendanceExam;

  let rowsHTML = "";

  records.forEach((record) => {
    rowsHTML += `
      <tr>

        <td>
          ${escapeHTML(record.className)}
          -
          ${escapeHTML(record.subjectName)}
        </td>

        ${
          showExamColumn
            ? `
              <td>
                ${escapeHTML(record.examName)}
              </td>
            `
            : ""
        }

        <td>
          ${escapeHTML(record.teacherName || "-")}
        </td>

        <td class="teacher-attendance-red">
          ${record.leaves}
        </td>

        <td class="teacher-attendance-red">
          ${record.absent}
        </td>

        <td class="teacher-attendance-red">
          ${record.late}
        </td>

        <td class="teacher-attendance-red">
          ${record.okPercentage.toFixed(2)}%
        </td>

      </tr>
    `;
  });

  output.innerHTML = `
    <div class="teacher-attendance-header">

      <h3>
        ${
          selectedAttendanceExam
            ? `Teachers with Attendance Below 75% — ${escapeHTML(selectedAttendanceExam)}`
            : `Teachers with Attendance Below 75% — All Examinations`
        }
      </h3>

    </div>

    <div class="collection-table-container scrollable-content-table">

      <table class="
  feedback-question-table
  teacher-attendance-table
  teacher-attendance-default-table
  ${showExamColumn ? "all-exams" : "selected-exam"}
">

        <thead class="table-header">
          <tr>

            <th>Class - Subject</th>

            ${showExamColumn ? `<th>Examination</th>` : ""}

            <th>Teacher</th>
            <th>Leaves</th>
            <th>Absent</th>
            <th>Late</th>
            <th>OK %</th>

          </tr>
        </thead>

        <tbody>
          ${rowsHTML}
        </tbody>

      </table>

    </div>
  `;
}

function hideTeacherSearchOptions() {
  const options = document.getElementById("teacherAttendanceTeacherOptions");

  if (options) {
    options.hidden = true;
    options.innerHTML = "";
  }
}

function showTeacherSearchOptions(searchText = "") {
  const options = document.getElementById("teacherAttendanceTeacherOptions");

  if (!options) return;

  options.innerHTML = "";

  const search = searchText.trim().toLowerCase();

  const matchingTeachers = attendanceTeacherNames.filter((name) =>
    name.toLowerCase().includes(search),
  );

  if (!matchingTeachers.length) {
    const empty = document.createElement("div");
    empty.className = "teacher-search-empty";
    empty.textContent = "No matching teacher found";
    options.appendChild(empty);
  } else {
    matchingTeachers.forEach((name) => {
      const item = document.createElement("div");

      item.className = "teacher-search-option";
      item.textContent = name;
      item.tabIndex = 0;

      item.addEventListener("click", () => {
        selectAttendanceTeacher(name);
      });

      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          selectAttendanceTeacher(name);
        }
      });

      options.appendChild(item);
    });
  }

  options.hidden = false;
}

function selectAttendanceTeacher(name) {
  selectedAttendanceTeacher = name;

  document.getElementById("teacherAttendanceTeacherSearch").value = name;

  // Clear Class + Subject, but preserve Exam.
  selectedAttendanceClass = "";
  selectedAttendanceSubject = "";

  document.getElementById("teacherAttendanceClass").value = "";

  resetTeacherAttendanceSubject();

  hideTeacherSearchOptions();

  renderTeacherAttendanceReport();
}

const teacherSearchInput = document.getElementById(
  "teacherAttendanceTeacherSearch",
);

teacherSearchInput.addEventListener("input", function () {
  // Clear the previously selected teacher when typing.
  selectedAttendanceTeacher = "";

  showTeacherSearchOptions(this.value);

  // Return to the default view until a teacher is selected.
  renderDefaultTeacherAttendanceReport();
});

teacherSearchInput.addEventListener("focus", function () {
  showTeacherSearchOptions(this.value);
});

teacherSearchInput.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    hideTeacherSearchOptions();
  }

  if (event.key === "Enter") {
    const matches = attendanceTeacherNames.filter((name) =>
      name.toLowerCase().includes(this.value.trim().toLowerCase()),
    );

    if (matches.length === 1) {
      selectAttendanceTeacher(matches[0]);
    }
  }
});

document.addEventListener("click", function (event) {
  if (!event.target.closest(".teacher-search-container")) {
    hideTeacherSearchOptions();
  }
});
