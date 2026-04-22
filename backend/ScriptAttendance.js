let selectedTeacher = "";
let selectedClass = "";
let selectedSubject = "";
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
  {q: "Is the average homework duration more than 30 minutes?",
    correct: "No",},
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
      .filter(cb => isVisible(cb))
      .every(cb => cb.checked);

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
  const subDropdown = document.getElementById("subject")
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
  const schoolLat = 28.657501589771897;   // your school latitude
  const schoolLng = 77.43753484576277;   // your school longitude
  const allowedRadius = 50;   // meters

  let school_end_time = "15:00";
  let [h, m] = school_end_time.split(":").map(Number);
  let endMinutes = h * 60 + m;
  let now = new Date();
  let currentMinutes = now.getHours() * 60 + now.getMinutes();
  let ignoreTeachers = ["Aravinda Nimai Prabhuji","Amani Nitai Prabhuji"]
  let result = 0;

  if (now.getDay() === 0) {
    SHOW_INFO_POPUP("Cannot mark attendance on a Sunday!");
    return;
  }

  if (currentMinutes > endMinutes) {
    SHOW_INFO_POPUP("School Time over for Today! Cannot mark attendance!");
    return;
  }

  //Check current location
  if(!ignoreTeachers.includes(selectedTeacher)){
    try{
      result = await checkLocation(schoolLat, schoolLng, allowedRadius);
    }
    catch (error) {
      console.error(error);
      if(error.message)
        SHOW_ERROR_POPUP(`ERROR: ${error.message}`);
      return;
    }

    if (result !== 1) {
      SHOW_ERROR_POPUP(`Outside Gurukul campus ❌\n\nPosition: ${result.split("_")[0]}\n\nDistance: ${result.split("_")[1]}`);
      return; // ✅ NOW this works as expected
    }

    console.log(`Inside Gurukul!`)
  }

  const outputData = await CALL_API(
    API_TYPE_CONSTANT.GET_TEACHER_CLASS_SUBJECTS_AND_STUDENTS_BY_NAME,
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