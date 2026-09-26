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

  const submitButton = document.getElementById("submitAllFeedbacksBtn");

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

  return `G: ${goodQuestions.join(", ")}\nNG: ${notGoodQuestions.join(", ")}`;
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

    SHOW_SUCCESS_POPUP("Feedback submitted successfully.", openStudentFeedback);
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
