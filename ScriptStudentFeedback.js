/* =========================================================
   STUDENT FEEDBACK
========================================================= */

let pendingStudentFeedbackData = {};

let selectedFeedbackClass = "";
let selectedFeedbackSubject = "";
let selectedFeedbackExam = "";

let currentFeedbackQuestions = [];

let currentFeedbackRemaining = 0;
let currentFeedbackTotalStrength = 0;
let savedStudentFeedbacks = [];

document
  .getElementById("clearStudentFeedbackBtn")
  ?.addEventListener("click", () => {
    SHOW_CONFIRMATION_POPUP(
      "Do you want to clear the form?",
      clearStudentFeedbackForm,
    );
  });

/* ================= LOAD PENDING FEEDBACK ================= */

async function openStudentFeedback() {
  const classSelect = document.getElementById("studentFeedbackClass");

  const subjectSelect = document.getElementById("studentFeedbackSubject");

  const examSelect = document.getElementById("studentFeedbackExam");

  const outputData = await CALL_API("PENDING_STUDENT_FEEDBACK", {});

  if (classSelect) {
    classSelect.value = "";
  }

  if (subjectSelect) {
    subjectSelect.innerHTML = `
      <option value="" selected>
        Select
      </option>
    `;

    subjectSelect.disabled = true;
  }

  if (examSelect) {
    examSelect.innerHTML = `
      <option value="" selected>
        Select
      </option>
    `;

    examSelect.disabled = true;
  }

  document.getElementById("studentFeedbackNext").disabled = true;

  if (outputData?.status && outputData.data) {
    if (
      typeof outputData.data === "string" &&
      outputData.data.includes("ERR")
    ) {
      SHOW_ERROR_POPUP(outputData.data.split("ERR: ")[1]);
      return;
    }

    pendingStudentFeedbackData = outputData.data.data;

    if (Object.keys(pendingStudentFeedbackData).length == 0) {
      SHOW_INFO_POPUP("No Pending Feedbacks!");
      homePageClick();
    } else {
      document.getElementById("studentFeedback_lbl").innerHTML =
        selectedTeacher;

      setupStudentFeedbackClassChange();

      setupStudentFeedbackSubjectChange();

      setupStudentFeedbackExamChange();

      populateStudentFeedbackClasses();
    }
  } else {
    SHOW_ERROR_POPUP("Unable to fetch the pending feedbacks!!");
  }
}

/* ================= POPULATE CLASS DROPDOWN ================= */

function populateStudentFeedbackClasses() {
  const classSelect = document.getElementById("studentFeedbackClass");

  if (!classSelect) return;

  classSelect.innerHTML = `
    <option value="" selected>
      Select
    </option>
  `;

  console.log(pendingStudentFeedbackData);

  Object.entries(pendingStudentFeedbackData).forEach(
    ([className, subjects]) => {
      /*
       * Check whether this class has
       * any feedback remaining.
       */

      let hasPending = false;

      Object.values(subjects || {}).forEach((exams) => {
        Object.values(exams || {}).forEach((examData) => {
          if (Number(examData?.remaining) > 0) {
            hasPending = true;
          }
        });
      });

      if (!hasPending) return;

      const option = document.createElement("option");

      option.value = className;

      option.textContent = className;

      classSelect.appendChild(option);
    },
  );

  SHOW_SPECIFIC_DIV("studentFeedbackPopup");
}

function setupStudentFeedbackClassChange() {
  const classSelect = document.getElementById("studentFeedbackClass");

  const subjectSelect = document.getElementById("studentFeedbackSubject");

  const examSelect = document.getElementById("studentFeedbackExam");

  if (!classSelect || !subjectSelect || !examSelect) {
    return;
  }

  classSelect.addEventListener("change", function () {
    selectedFeedbackClass = this.value;

    /*
     * Reset subject and exam
     */

    subjectSelect.innerHTML = `
        <option value="" selected>
          Select
        </option>
      `;

    examSelect.innerHTML = `
        <option value="" selected>
          Select
        </option>
      `;

    subjectSelect.disabled = true;

    examSelect.disabled = true;

    document.getElementById("studentFeedbackNext").disabled = true;

    selectedFeedbackSubject = "";
    selectedFeedbackExam = "";

    if (!selectedFeedbackClass) {
      return;
    }

    const subjects = pendingStudentFeedbackData[selectedFeedbackClass];

    if (!subjects) return;

    /*
     * Populate subjects having
     * at least one pending exam.
     */

    Object.entries(subjects).forEach(([subjectName, exams]) => {
      let hasPending = false;

      Object.values(exams || {}).forEach((examData) => {
        if (Number(examData?.remaining) > 0) {
          hasPending = true;
        }
      });

      if (!hasPending) return;

      const option = document.createElement("option");

      option.value = subjectName;

      option.textContent = subjectName.split("_")[0];

      subjectSelect.appendChild(option);
    });

    subjectSelect.disabled = false;
  });
}

function setupStudentFeedbackSubjectChange() {
  const classSelect = document.getElementById("studentFeedbackClass");

  const subjectSelect = document.getElementById("studentFeedbackSubject");

  const examSelect = document.getElementById("studentFeedbackExam");

  if (!classSelect || !subjectSelect || !examSelect) {
    return;
  }

  subjectSelect.addEventListener("change", function () {
    selectedFeedbackSubject = this.value;

    examSelect.innerHTML = `
        <option value="" selected>
          Select
        </option>
      `;

    examSelect.disabled = true;

    selectedFeedbackExam = "";

    document.getElementById("studentFeedbackNext").disabled = true;

    if (!selectedFeedbackClass || !selectedFeedbackSubject) {
      return;
    }

    const exams =
      pendingStudentFeedbackData?.[selectedFeedbackClass]?.[
        selectedFeedbackSubject
      ];

    if (!exams) return;

    Object.entries(exams).forEach(([examName, examData]) => {
      const remaining = Number(examData?.remaining) || 0;

      /*
       * Don't show completed exams.
       */

      if (remaining <= 0) {
        return;
      }

      const option = document.createElement("option");

      option.value = examName;

      option.textContent = examName.split("_")[0];

      examSelect.appendChild(option);
    });

    examSelect.disabled = false;
  });
}

function setupStudentFeedbackExamChange() {
  const examSelect = document.getElementById("studentFeedbackExam");

  const nextButton = document.getElementById("studentFeedbackNext");

  if (!examSelect || !nextButton) {
    return;
  }

  examSelect.addEventListener("change", function () {
    selectedFeedbackExam = this.value;

    nextButton.disabled = !(
      selectedFeedbackClass &&
      selectedFeedbackSubject &&
      selectedFeedbackExam
    );
  });
}

function openSelectedStudentFeedback() {
  const examData =
    pendingStudentFeedbackData?.[selectedFeedbackClass]?.[
      selectedFeedbackSubject
    ]?.[selectedFeedbackExam];

  if (!examData) {
    SHOW_ERROR_POPUP("Feedback data not found.");

    return;
  }

  const remaining = Number(examData.remaining) || 0;

  const totalStrength = Number(examData.total_strength) || 0;

  /*
   * VERY IMPORTANT
   *
   * If remaining is 0,
   * don't open the form.
   */

  if (remaining <= 0) {
    SHOW_INFO_POPUP(
      "All feedback forms for this Class, Subject and Exam have already been completed.",
    );

    return;
  }

  /*
   * Save current selection
   */

  savedStudentFeedbacks = [];

  currentFeedbackQuestions = examData.questions || [];

  currentFeedbackRemaining = remaining;

  currentFeedbackTotalStrength = totalStrength;

  /*
   * Set heading
   */

  const heading = document.getElementById("studentFeedbackFormHeading");

  if (heading) {
    heading.innerText = `Feedback Form : ${selectedFeedbackClass} | ${selectedFeedbackSubject.split("_")[0]} | ${selectedFeedbackExam.split("_")[0]}`;
  }

  /*
   * Render questions
   */

  renderStudentFeedbackQuestions(currentFeedbackQuestions);

  /*
   * Update counter
   */

  updateStudentFeedbackCounter();

  /*
   * Configure buttons
   */

  updateStudentFeedbackButtons();

  /*
   * Open actual feedback popup
   */

  SHOW_SPECIFIC_DIV("studentFeedbackContainer");
}

function renderStudentFeedbackQuestions(questions) {
  const tbody = document.getElementById("feedbackTableBody");

  if (!tbody) return;

  tbody.innerHTML = "";

  questions.forEach((question, index) => {
    const questionText = String(question || "")
      .replace(/\r/g, "")
      .trim();

    const tr = document.createElement("tr");

    tr.innerHTML = `

        <td class="center-text-td">
          ${index + 1}
        </td>

        <td>
          ${questionText}
        </td>

        <td class="center-text-td td-green">

          <input
              type="radio"
              name="studentFeedback_${index}"
              value="G"
            >
        </td>

        <td class="center-text-td td-red">

           <input
              type="radio"
              name="studentFeedback_${index}"
              value="NG"
            >

        </td>

      `;

    tbody.appendChild(tr);
  });
}

function updateStudentFeedbackCounter() {
  const counter = document.getElementById("feedbackCounter");

  if (!counter) return;

  counter.innerText = `Feedback Forms Remaining : ${currentFeedbackRemaining}`;
}

function updateStudentFeedbackButtons() {
  const saveButton = document.getElementById("saveStudentFeedbackBtn");

  const clrbutton = document.getElementById("clearStudentFeedbackBtn");

  if (currentFeedbackRemaining > 0) {
    saveButton.innerText = "Save Current Feedback";
    saveButton.className = "yellow";
  } else {
    saveButton.innerText = "Submit";
    saveButton.className = "green";
  }

  if (clrbutton) {
    clrbutton.disabled = currentFeedbackRemaining <= 0;
  }
}

function getCurrentStudentFeedback() {
  const goodQuestions = [];
  const notGoodQuestions = [];

  currentFeedbackQuestions.forEach((question, index) => {
    const selected = document.querySelector(
      `input[name="studentFeedback_${index}"]:checked`,
    );

    if (!selected) return;

    const cleanQuestion = question
      .replace(/\r/g, "")
      .replace(/\n/g, " ")
      .trim();

    if (selected.value === "G") {
      goodQuestions.push(cleanQuestion);
    } else if (selected.value === "NG") {
      notGoodQuestions.push(cleanQuestion);
    }
  });

  return `G: ${goodQuestions.join("# ")}\nNG: ${notGoodQuestions.join("# ")}`;
}

function saveStudentFeedback() {
  const feedback = getCurrentStudentFeedback();

  savedStudentFeedbacks.push({
    feedback: feedback,
  });

  currentFeedbackRemaining--;

  clearStudentFeedbackForm();

  updateStudentFeedbackCounter();
  updateStudentFeedbackButtons();
}

async function submitAllStudentFeedbacks() {
  if (savedStudentFeedbacks.length == 0) openStudentFeedback();

  const combinedFeedback = savedStudentFeedbacks
    .map((item) => item.feedback)
    .join("\nxxxxx\n");

  const payload = {
    className: selectedFeedbackClass,
    colNum: selectedFeedbackSubject.split("_")[1],
    rowNum: selectedFeedbackExam.split("_")[1],
    feedback: combinedFeedback,
  };

  console.log(payload);

  const outputData = await CALL_API("SUBMIT_STUDENT_FEEDBACK", payload);

  if (outputData?.status && outputData.data) {
    if (
      typeof outputData.data === "string" &&
      outputData.data.includes("ERR")
    ) {
      SHOW_ERROR_POPUP(outputData.data.split("ERR: ")[1]);
      return;
    }

    SHOW_SUCCESS_POPUP("Feedback submitted successfully.", () => {
      savedStudentFeedbacks = [];
      openStudentFeedback();
    });
  } else {
    SHOW_ERROR_POPUP("Unable to submit the feedbacks!!");
  }
}

function clearStudentFeedbackForm() {
  document
    .querySelectorAll('#feedbackTableBody input[type="radio"]')
    .forEach((radio) => {
      radio.checked = false;
    });
}

function handleStudentFeedbackButton() {
  if (currentFeedbackRemaining > 0) {
    const feedback = getCurrentStudentFeedback();

    const isBlankFeedback = feedback === "G: \nNG: " || feedback === "G:\nNG:";

    if (isBlankFeedback) {
      SHOW_CONFIRMATION_POPUP(
        "Submitting Empty Feedback?",
        saveStudentFeedback,
      );
    } else saveStudentFeedback();
  } else {
    submitAllStudentFeedbacks();
  }
}

//================================== REPORTING ==========================================

/* =========================================================
   STUDENT FEEDBACK REPORT
========================================================= */

let studentFeedbackReportData = {};

let feedbackReportClass = "";
let feedbackReportSubject = "";
let feedbackReportExam = "";

/* =========================================================
   OPEN REPORT
========================================================= */

async function openStudentFeedbackReport() {
  const response = await CALL_API("GET_STUDENT_FEEDBACK", {});

  if (!response || response.status !== true) {
    SHOW_ERROR_POPUP(
      response?.data || "Unable to load student feedback report.",
    );

    return;
  }

  studentFeedbackReportData = response.data?.data || {};

  feedbackReportClass = "";
  feedbackReportSubject = "";
  feedbackReportExam = "";

  populateFeedbackReportClasses();

  console.log(studentFeedbackReportData);

  document.getElementById("studentFeedbackReportHeading").innerHTML =
    selectedTeacher;

  SHOW_SPECIFIC_DIV("studentFeedbackReportPopup");
}

/* =========================================================
   CLASS DROPDOWN
========================================================= */

function populateFeedbackReportClasses() {
  const select = document.getElementById("feedbackReportClass");

  select.innerHTML = `<option value="" selected>Select</option>`;

  Object.keys(studentFeedbackReportData).forEach((className) => {
    const option = document.createElement("option");

    option.value = className;
    option.textContent = className;

    select.appendChild(option);
  });

  resetFeedbackReportSubject();
  resetFeedbackReportExam();

  clearFeedbackReportOutput();
}

/* =========================================================
   SUBJECT DROPDOWN
========================================================= */

function populateFeedbackReportSubjects() {
  const select = document.getElementById("feedbackReportSubject");

  select.innerHTML = `<option value="" selected>Select</option>`;

  const classData = studentFeedbackReportData[feedbackReportClass];

  if (!classData) return;

  Object.keys(classData).forEach((subjectName) => {
    const option = document.createElement("option");

    option.value = subjectName;
    option.textContent = subjectName;

    select.appendChild(option);
  });

  select.disabled = false;
}

/* =========================================================
   EXAM DROPDOWN
========================================================= */

function populateFeedbackReportExams() {
  const select = document.getElementById("feedbackReportExam");

  select.innerHTML = `<option value="" selected>
       All Exams
     </option>`;

  const subjectData =
    studentFeedbackReportData[feedbackReportClass]?.[feedbackReportSubject];

  if (!subjectData) return;

  Object.keys(subjectData).forEach((examName) => {
    const option = document.createElement("option");

    option.value = examName;
    option.textContent = examName;

    select.appendChild(option);
  });

  select.disabled = false;
}

/* =========================================================
   RESET
========================================================= */

function resetFeedbackReportSubject() {
  const select = document.getElementById("feedbackReportSubject");

  select.innerHTML = `<option value="" selected>Select</option>`;

  select.disabled = true;

  feedbackReportSubject = "";
}

function resetFeedbackReportExam() {
  const select = document.getElementById("feedbackReportExam");

  select.innerHTML = `<option value="" selected>
       All Exams
     </option>`;

  select.disabled = true;

  feedbackReportExam = "";
}

/* =========================================================
   PARSE FEEDBACK
========================================================= */

/*
  Converts:

  G: Question 1, Question 2
  NG: Question 3
  xxxxx
  G: Question 4
  NG: Question 5

  into:

  [
    {
      good: [...],
      noGood: [...]
    },
    {
      good: [...],
      noGood: [...]
    }
  ]
*/

function parseFeedbackString(feedback) {
  if (!feedback) return [];

  const text = String(feedback).replace(/\r/g, "").trim();

  if (!text) return [];

  // Each xxxxx represents one student's feedback
  const studentBlocks = text
    .split("xxxxx")
    .map((block) => block.trim())
    .filter(Boolean);

  return studentBlocks.map((block) => {
    const lines = block.split("\n").map((line) => line.trim());

    let goodText = "";
    let noGoodText = "";

    lines.forEach((line) => {
      if (line.startsWith("G:")) {
        goodText = line.substring(2).trim();
      } else if (line.startsWith("NG:")) {
        noGoodText = line.substring(3).trim();
      }
    });

    return {
      good: splitFeedbackQuestions(goodText),
      noGood: splitFeedbackQuestions(noGoodText),
    };
  });
}

function splitFeedbackQuestions(text) {
  if (!text) return [];

  return text
    .split("# ")
    .map((question) => question.replace(/\r/g, "").replace(/\n/g, " ").trim())
    .filter(Boolean);
}

/* =========================================================
   GET SELECTED EXAMS
========================================================= */

function getFeedbackReportExams() {
  const subjectData =
    studentFeedbackReportData[feedbackReportClass]?.[feedbackReportSubject];

  if (!subjectData) return [];

  if (!feedbackReportExam) {
    return Object.entries(subjectData).map(([examName, examData]) => ({
      examName,
      examData,
    }));
  }

  if (!subjectData[feedbackReportExam]) {
    return [];
  }

  return [
    {
      examName: feedbackReportExam,
      examData: subjectData[feedbackReportExam],
    },
  ];
}

/* =========================================================
   BUILD STATISTICS
========================================================= */

function buildFeedbackStatistics(exams) {
  const questionMap = {};

  let totalGood = 0;
  let totalNoGood = 0;

  exams.forEach(({ examData }) => {
    const feedback = examData.feedback || "";

    const students = parseFeedbackString(feedback);

    students.forEach((student) => {
      student.good.forEach((question) => {
        totalGood++;

        if (!questionMap[question]) {
          questionMap[question] = {
            good: 0,
            noGood: 0,
          };
        }

        questionMap[question].good++;
      });

      student.noGood.forEach((question) => {
        totalNoGood++;

        if (!questionMap[question]) {
          questionMap[question] = {
            good: 0,
            noGood: 0,
          };
        }

        questionMap[question].noGood++;
      });
    });
  });

  return {
    questionMap,
    totalGood,
    totalNoGood,
  };
}

/* =========================================================
   RENDER REPORT
========================================================= */

function renderStudentFeedbackReport() {
  if (!feedbackReportClass || !feedbackReportSubject) {
    clearFeedbackReportOutput();
    return;
  }

  const exams = getFeedbackReportExams();

  if (!exams.length) {
    document.getElementById("feedbackReportOutput").innerHTML = `
      <div class="feedback-report-message">
        No feedback found.
      </div>
    `;
    return;
  }

  const stats = buildFeedbackStatistics(exams);

  const totalResponses = stats.totalGood + stats.totalNoGood;

  const goodPercentage = totalResponses
    ? (stats.totalGood / totalResponses) * 100
    : 0;

  const noGoodPercentage = totalResponses
    ? (stats.totalNoGood / totalResponses) * 100
    : 0;

  let teacherHTML = "";

  // Show teacher only when a specific exam is selected
  if (feedbackReportExam) {
    const examData = exams[0].examData;

    teacherHTML = `
      <div class="feedback-report-teacher">
        Teacher:
        ${escapeFeedbackHTML(examData.teacherName || "-")}
      </div>
    `;
  }

  document.getElementById("feedbackReportOutput").innerHTML = `

    <div class="feedback-report-header">

      <h3>
        ${escapeFeedbackHTML(feedbackReportClass)}
        -
        ${escapeFeedbackHTML(feedbackReportSubject)}
      </h3>

      <div class="feedback-report-exam">
        ${
          feedbackReportExam
            ? `Examination:
               ${escapeFeedbackHTML(feedbackReportExam)}`
            : `All Examinations`
        }
      </div>

      ${teacherHTML}

    </div>


    <div class="feedback-report-section-title">
      Overall Feedback
    </div>


    <table class="feedback-summary-table">

      <thead>
        <tr>
          <th>Good</th>
          <th>Not Good</th>
          <th>Good %</th>
          <th>Not Good %</th>
        </tr>
      </thead>

      <tbody>
        <tr>

          <td class="feedback-good">
            ${stats.totalGood}
          </td>

          <td class="feedback-no-good">
            ${stats.totalNoGood}
          </td>

          <td class="feedback-good">
            ${goodPercentage.toFixed(2)}%
          </td>

          <td class="feedback-no-good">
            ${noGoodPercentage.toFixed(2)}%
          </td>

        </tr>
      </tbody>

    </table>


    <div class="feedback-report-section-title">
      Question-wise Feedback
    </div>

    ${createFeedbackQuestionTable(stats.questionMap)}

  `;
}

/* =========================================================
   QUESTION TABLE
========================================================= */

function createFeedbackQuestionTable(questionMap) {
  const questions = Object.keys(questionMap);

  if (!questions.length) {
    return `
      <div class="feedback-report-message">
        No question-wise feedback available.
      </div>
    `;
  }

  let rows = "";

  questions.forEach((question, index) => {
    const data = questionMap[question];

    const responses = data.good + data.noGood;

    const goodPercentage = responses ? (data.good / responses) * 100 : 0;

    const noGoodPercentage = responses ? (data.noGood / responses) * 100 : 0;

    rows += `

      <tr>

        <td>
          ${index + 1}
        </td>

        <td>
          ${escapeFeedbackHTML(question)}
        </td>

        <td class="feedback-good">
          ${goodPercentage.toFixed(2)}%
        </td>

        <td class="feedback-no-good">
          ${noGoodPercentage.toFixed(2)}%
        </td>

      </tr>
    `;
  });

  return `

    <div class="feedback-question-table-wrapper">

      <table class="feedback-question-table">

        <thead>

          <tr>

            <th>S No.</th>

            <th>Question</th>

            <th>Good</th>

            <th>Not Good</th>

          </tr>

        </thead>

        <tbody>

          ${rows}

        </tbody>

      </table>

    </div>

  `;
}

/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeFeedbackHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   CLEAR OUTPUT
========================================================= */

function clearFeedbackReportOutput() {
  document.getElementById("feedbackReportOutput").innerHTML = `
    <div class="feedback-report-message">
      Select Class and Subject to view the report.
    </div>
  `;
}

/* =========================================================
   CLASS CHANGE
========================================================= */

document
  .getElementById("feedbackReportClass")
  .addEventListener("change", function () {
    feedbackReportClass = this.value;

    feedbackReportSubject = "";
    feedbackReportExam = "";

    resetFeedbackReportSubject();
    resetFeedbackReportExam();

    if (feedbackReportClass) {
      populateFeedbackReportSubjects();
    }

    clearFeedbackReportOutput();
  });

/* =========================================================
   SUBJECT CHANGE
========================================================= */

document
  .getElementById("feedbackReportSubject")
  .addEventListener("change", function () {
    feedbackReportSubject = this.value;

    feedbackReportExam = "";

    resetFeedbackReportExam();

    if (feedbackReportSubject) {
      populateFeedbackReportExams();

      /*
        Exam is optional.
        Therefore immediately show
        ALL EXAMS report.
      */

      renderStudentFeedbackReport();
    } else {
      clearFeedbackReportOutput();
    }
  });

/* =========================================================
   EXAM CHANGE
========================================================= */

document
  .getElementById("feedbackReportExam")
  .addEventListener("change", function () {
    feedbackReportExam = this.value;

    renderStudentFeedbackReport();
  });
