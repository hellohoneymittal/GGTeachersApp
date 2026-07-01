//===============================
// GLOBAL VARIABLES
//===============================

let studentList = [];

let currentStudentIndex = -1;

let currentStudentCol = "";

let currentStudentName = "";

let commentThresholdMarks = 0.5;

function performClearStudent() {
  const student = studentList[currentStudentIndex];

  clearDirty();

  clearCurrentStudentControls();

  clearErrors();

  student.data = {};

  student.saved = false;

  renderStudentList();

  updateProgress();
}

function confirmDiscardChanges(callback) {
  if (currentStudentIndex < 0 || !studentList[currentStudentIndex].dirty) {
    callback();
    return;
  }

  SHOW_CONFIRMATION_POPUP(
    `${studentList[currentStudentIndex].name}'s changes are not saved.<br><br>Discard the changes and continue?`,
    callback,
  );
}

function updateCommentVisibility(
  totalMarks,
  maxMarks,
  commentNeeded,
  studentCol,
) {
  console.log(
    `For comments on: ${studentCol} with marks: ${totalMarks} and max marks : ${maxMarks}`,
  );
  const commentDivider = document.getElementById(
    "comment_divider_" + studentCol,
  );

  const commentBox = document.getElementById("comment_" + studentCol);

  const commentErr = document.getElementById("Errcomment_" + studentCol);

  if (!commentDivider || !commentBox || !commentErr) return;

  const hasComment = commentBox.value.trim() !== "";

  console.log(`For comments on: ${studentCol}`);

  if (
    commentNeeded == 1 &&
    (totalMarks < commentThresholdMarks * maxMarks || hasComment)
  ) {
    commentDivider.style.display = "block";
    commentBox.style.display = "block";
    commentErr.style.display = "block";
  } else {
    commentDivider.style.display = "none";
    commentBox.style.display = "none";
    commentErr.style.display = "none";
  }
}

function markDirty() {
  if (currentStudentIndex < 0) return;

  const student = studentList[currentStudentIndex];

  // Already dirty? Don't do unnecessary work.
  if (student.dirty) return;

  student.dirty = true;
  student.saved = false;

  renderStudentList();
  updateProgress();
}

function clearDirty() {
  if (currentStudentIndex < 0) return;

  studentList[currentStudentIndex].dirty = false;
}

function showMarksWindow() {
  const examDetailDiv = document.getElementById("examFormHeading_div");
  const examDetailLabel = document.getElementById("examFormHeading_lbl");

  examDetailDiv.style.display = "block";

  examDetailLabel.innerHTML = `${selectedExamClass} : ${selectedExamSubject} : ${selectedExamDetails.examName}`;

  SHOW_SPECIFIC_DIV("examMarksContainer");

  loadStudents();

  createMarksLayout();

  renderStudentList();

  updateProgress();

  if (studentList.length > 0) {
    selectStudent(0);
  }
}

function loadStudents() {
  studentList = [];

  let studentArray = selectedExamDetails.studentArr;

  studentArray.forEach(function (item, index) {
    let arr = item.split("%");

    studentList.push({
      index: index,
      name: arr[0],
      col: arr[1],

      saved: false,
      dirty: false,

      controls: {},

      data: {},
    });
  });
}

function createMarksLayout() {
  const container = document.getElementById("studentsMarksWindow");

  container.innerHTML = `

<div class="marks-layout">

    <div class="marks-sidebar">

        <input
            id="studentSearch"
            class="gg-name"
            placeholder="Search Student">

        <div id="progressLabel"></div>

        <div class="progress">

            <div id="progressBar"></div>

        </div>

        <div
            id="studentList"
            class="student-list">

        </div>

    </div>

    <div class="marks-main">

        <div id="studentPanel">

        </div>

    </div>

</div>

`;

  attachMarksEvents();
}

function attachMarksEvents() {
  document
    .getElementById("studentSearch")
    .addEventListener("input", filterStudents);

  document
    .getElementById("saveStudentBtn")
    .addEventListener("click", saveStudent);

  document
    .getElementById("clearStudentBtn")
    .addEventListener("click", clearStudent);

  document
    .getElementById("submitAllBtn")
    .addEventListener("click", submitAllStudents);
}

function renderStudentList() {
  const list = document.getElementById("studentList");

  list.innerHTML = "";

  studentList.forEach(function (student, index) {
    const row = document.createElement("div");

    row.className = "student-row";

    if (student.saved) {
      row.classList.add("completed");
    }

    if (index === currentStudentIndex) {
      row.classList.add("selected");
    }

    let icon = "⚪";

    if (student.saved) icon = "🟢";

    if (student.dirty) icon = "🟡";

    row.innerHTML = `
        <span class="student-icon">
        ${icon}
        </span>

        <span>
        ${student.name}
        </span>
        `;

    row.addEventListener("click", function () {
      selectStudent(index);
    });

    list.appendChild(row);
  });
}

function updateProgress() {
  let completed = 0;

  studentList.forEach(function (student) {
    if (student.saved) {
      completed++;
    }
  });

  document.getElementById("progressLabel").innerHTML =
    "Completed : " + completed + " / " + studentList.length;

  let percentage = 0;

  if (studentList.length > 0) {
    percentage = (completed * 100) / studentList.length;
  }

  document.getElementById("progressBar").style.width = percentage + "%";

  document.getElementById("submitAllBtn").disabled =
    completed !== studentList.length;
}

function filterStudents() {
  const value = document.getElementById("studentSearch").value.toLowerCase();

  document.querySelectorAll(".student-row").forEach(function (row) {
    row.style.display = row.innerText.toLowerCase().includes(value)
      ? ""
      : "none";
  });
}

function selectStudent(index) {
  confirmDiscardChanges(() => {
    currentStudentIndex = index;
    currentStudentCol = studentList[index].col;
    currentStudentName = studentList[index].name;

    renderStudentList();
    renderStudent();
  });
}

function renderStudent() {
  const student = studentList[currentStudentIndex];
  // Reset control references every time the UI is rendered
  student.controls = {};

  const studentName = student.name;
  const studentCol = student.col;
  let marks = 0;
  let wmarks = 0;
  let gmarks = 0;
  let lmarks = 0;

  const panel = document.getElementById("studentPanel");

  panel.innerHTML = "";

  const handwritingNeeded = selectedExamDetails.handwritingNeeded;
  const feedbackNeeded = selectedExamDetails.feedbackNeeded;
  const commentNeeded = selectedExamDetails.commentNeeded;

  const marksArr = selectedExamDetails.maxMarks.split("^");
  const maxMarks = marksArr[0];

  // UI
  const studentDiv = document.createElement("div");
  studentDiv.className = "student gg-exam-row-layout";
  const label = document.createElement("label");
  label.textContent = studentName;
  label.className = "required";

  studentDiv.appendChild(label);

  if (marksArr.length == 1) {
    const input_marks = document.createElement("input");
    student.controls.input_marks = input_marks;
    input_marks.type = "number";
    input_marks.min = 0;
    input_marks.max = maxMarks;
    input_marks.step = 0.1;
    input_marks.name = "marks_" + maxMarks;
    input_marks.required = true;
    input_marks.inputmode = "numeric";
    input_marks.value = ""; // pre-fill value
    input_marks.className = "gg-name-exam";
    input_marks.id = "marks_" + studentCol;
    input_marks.placeholder = "Enter Marks (0 to " + maxMarks + ")";

    if (student.data.input_marks !== undefined) {
      input_marks.value = student.data.input_marks;
      marks = Number(student.data.input_marks);
    }

    studentDiv.appendChild(input_marks);

    const marksErr = document.createElement("div");
    marksErr.className = "error";
    marksErr.id = "Errmarks_" + studentCol;

    studentDiv.appendChild(marksErr);

    input_marks.addEventListener("change", () => {
      markDirty();
      if (validateNumber(input_marks, maxMarks)) {
        let comment_divider = document.getElementById(
          "comment_divider_" + studentCol,
        );
        let commentBox = document.getElementById("comment_" + studentCol);
        let commentErr = document.getElementById("Err" + commentBox.id);

        marks = Number(input_marks.value.trim());

        commentErr.innerHTML = "";

        if (marks >= commentThresholdMarks * maxMarks || commentNeeded != 1) {
          commentBox.value = "";
        }

        updateCommentVisibility(marks, maxMarks, commentNeeded, studentCol);
      }
    });
  } else {
    const writing_input_marks = document.createElement("input");
    student.controls.writing = writing_input_marks;
    writing_input_marks.type = "number";
    writing_input_marks.min = 0;
    writing_input_marks.max = marksArr[1];
    writing_input_marks.step = 0.1;
    writing_input_marks.name = "marks_writing_" + marksArr[1];
    writing_input_marks.required = true;
    writing_input_marks.inputmode = "numeric";
    writing_input_marks.value = ""; // pre-fill value
    writing_input_marks.className = "gg-name-exam";
    writing_input_marks.id = "marks_writing_" + studentCol;
    writing_input_marks.placeholder =
      "Writing Marks (0 to " + marksArr[1] + ")";

    if (student.data.writing !== undefined) {
      writing_input_marks.value = student.data.writing;
      wmarks = Number(student.data.writing);
    }

    studentDiv.appendChild(writing_input_marks);

    const writeMarksErr = document.createElement("div");
    writeMarksErr.className = "error";
    writeMarksErr.id = "Errmarks_writing_" + studentCol;

    studentDiv.appendChild(writeMarksErr);

    writing_input_marks.addEventListener("change", () => {
      markDirty();
      if (validateNumber(writing_input_marks, marksArr[1])) {
        let comment_divider = document.getElementById(
          "comment_divider_" + studentCol,
        );
        let commentBox = document.getElementById("comment_" + studentCol);
        let commentErr = document.getElementById("Err" + commentBox.id);

        wmarks = Number(writing_input_marks.value.trim());

        const total = wmarks + gmarks + lmarks;

        commentErr.innerHTML = "";

        if (total >= commentThresholdMarks * maxMarks || commentNeeded != 1) {
          commentBox.value = "";
        }

        updateCommentVisibility(total, maxMarks, commentNeeded, studentCol);
      }
    });

    let divider = document.createElement("hr");
    divider.className = "divider";
    studentDiv.appendChild(divider);

    const grammar_input_marks = document.createElement("input");
    student.controls.grammar = grammar_input_marks;
    grammar_input_marks.type = "number";
    grammar_input_marks.min = 0;
    grammar_input_marks.max = marksArr[2];
    grammar_input_marks.step = 0.1;
    grammar_input_marks.value = ""; // pre-fill value
    grammar_input_marks.name = "marks_grammar_" + marksArr[2];
    grammar_input_marks.required = true;
    grammar_input_marks.inputmode = "numeric";
    grammar_input_marks.className = "gg-name-exam";
    grammar_input_marks.id = "marks_grammar_" + studentCol;
    grammar_input_marks.placeholder =
      "Grammar Marks (0 to " + marksArr[2] + ")";

    if (student.data.grammar !== undefined) {
      grammar_input_marks.value = student.data.grammar;
      gmarks = Number(student.data.grammar);
    }

    studentDiv.appendChild(grammar_input_marks);

    const gramMarksErr = document.createElement("div");
    gramMarksErr.className = "error";
    gramMarksErr.id = "Errmarks_grammar_" + studentCol;

    studentDiv.appendChild(gramMarksErr);

    grammar_input_marks.addEventListener("change", () => {
      markDirty();
      if (validateNumber(grammar_input_marks, marksArr[2])) {
        let comment_divider = document.getElementById(
          "comment_divider_" + studentCol,
        );
        let commentBox = document.getElementById("comment_" + studentCol);
        let commentErr = document.getElementById("Err" + commentBox.id);

        gmarks = Number(grammar_input_marks.value.trim());

        const total = wmarks + gmarks + lmarks;

        commentErr.innerHTML = "";

        if (total >= commentThresholdMarks * maxMarks || commentNeeded != 1) {
          commentBox.value = "";
        }

        updateCommentVisibility(total, maxMarks, commentNeeded, studentCol);
      }
    });

    divider = document.createElement("hr");
    divider.className = "divider";
    studentDiv.appendChild(divider);

    const literature_input_marks = document.createElement("input");
    student.controls.literature = literature_input_marks;
    literature_input_marks.type = "number";
    literature_input_marks.min = 0;
    literature_input_marks.max = marksArr[3];
    literature_input_marks.step = 0.1;
    literature_input_marks.inputmode = "numeric";
    literature_input_marks.value = ""; // pre-fill value
    literature_input_marks.className = "gg-name-exam";
    literature_input_marks.name = "marks_literature_" + marksArr[3];
    literature_input_marks.required = true;
    literature_input_marks.id = "marks_literature_" + studentCol;
    literature_input_marks.placeholder =
      "Literature Marks (0 to " + marksArr[3] + ")";

    if (student.data.literature !== undefined) {
      literature_input_marks.value = student.data.literature;
      lmarks = Number(student.data.literature);
    }

    studentDiv.appendChild(literature_input_marks);

    const litMarksErr = document.createElement("div");
    litMarksErr.className = "error";
    litMarksErr.id = "Errmarks_literature_" + studentCol;

    studentDiv.appendChild(litMarksErr);

    literature_input_marks.addEventListener("change", () => {
      markDirty();
      if (validateNumber(literature_input_marks, marksArr[3])) {
        let comment_divider = document.getElementById(
          "comment_divider_" + studentCol,
        );
        let commentBox = document.getElementById("comment_" + studentCol);
        let commentErr = document.getElementById("Err" + commentBox.id);
        lmarks = Number(literature_input_marks.value.trim());

        const total = wmarks + gmarks + lmarks;

        commentErr.innerHTML = "";

        if (total >= commentThresholdMarks * maxMarks || commentNeeded != 1) {
          commentBox.value = "";
        }

        updateCommentVisibility(total, maxMarks, commentNeeded, studentCol);
      }
    });
  }

  // Adding comment box
  const commentDivider = document.createElement("hr");
  commentDivider.className = "divider";
  commentDivider.style.display = "none";
  commentDivider.id = "comment_divider_" + studentCol;

  studentDiv.appendChild(commentDivider);

  const comments = document.createElement("textarea");
  student.controls.comment = comments;
  comments.rows = 4;
  comments.required = true;
  comments.id = "comment_" + studentCol;
  comments.style.display = "none";
  comments.placeholder =
    "Please mention areas for improvement as marks < 50%. Comment will be shared with parent and tuition teacher!";
  studentDiv.appendChild(comments);

  comments.value = student.data.comment || "";

  const commentsErr = document.createElement("div");
  commentsErr.className = "error";
  commentsErr.id = "Errcomment_" + studentCol;

  studentDiv.appendChild(commentsErr);

  comments.addEventListener("change", function () {
    markDirty();
    validateTextarea(comments);
  });

  if (handwritingNeeded == 1) {
    divider = document.createElement("hr");
    divider.className = "divider";
    studentDiv.appendChild(divider);

    const handwriting_marks = document.createElement("input");
    student.controls.handwriting = handwriting_marks;
    handwriting_marks.type = "number";
    handwriting_marks.min = 0;
    handwriting_marks.max = 10;
    handwriting_marks.step = 0.1;
    handwriting_marks.inputmode = "numeric";
    handwriting_marks.value = ""; // pre-fill value
    handwriting_marks.name = "marks_handwriting_10";
    handwriting_marks.required = true;
    handwriting_marks.className = "gg-name-exam";
    handwriting_marks.id = "marks_handwriting_" + studentCol;
    handwriting_marks.placeholder = "Handwriting Marks (0 to 10)";

    if (student.data.handwriting !== undefined) {
      handwriting_marks.value = student.data.handwriting;
    }

    studentDiv.appendChild(handwriting_marks);

    const hwMarksErr = document.createElement("div");
    hwMarksErr.className = "error";
    hwMarksErr.id = "Errmarks_handwriting_" + studentCol;

    studentDiv.appendChild(hwMarksErr);

    handwriting_marks.addEventListener("change", () => {
      markDirty();
      validateNumber(handwriting_marks, 10);
    });
  }

  if (feedbackNeeded == 1) {
    divider = document.createElement("hr");
    divider.className = "divider";
    studentDiv.appendChild(divider);

    const checkboxList = document.createElement("div");

    checkboxList.className = "radio-container-student";
    checkboxList.id = "feedbackList_" + studentCol; // optional but useful

    // Append container first
    studentDiv.appendChild(checkboxList);

    const checkboxListHeading = document.createElement("div");
    checkboxListHeading.className = "radio-heading-student";

    checkboxList.appendChild(checkboxListHeading);

    const fblabel = document.createElement("label");
    fblabel.textContent = "Behaviour Feedback";
    fblabel.className = "required";
    checkboxListHeading.appendChild(fblabel);

    const checkboxContent = document.createElement("div");
    student.controls.feedback = checkboxContent;
    checkboxContent.className = "radio-content-without-flex";
    checkboxContent.id = "dynamic-feedback-list";

    feedbackArr.forEach((feedback, index) => {
      const feedbackId = `feedback-${index}-${studentCol}`; // unique id per student

      const option = document.createElement("div");
      option.classList.add("options");

      if (feedback.includes("Not")) {
        option.innerHTML = `
          <input type="checkbox" id="${feedbackId}" name="feedbackList" value="${feedback}" class="custom-checkbox">
          <label for="${feedbackId}" class="custom-label-student-red">${feedback}</label>
        `;
      } else {
        option.innerHTML = `
          <input type="checkbox" id="${feedbackId}" name="feedbackList" value="${feedback}" class="custom-checkbox">
          <label for="${feedbackId}" class="custom-label-student-green">${feedback}</label>
        `;
      }

      checkboxContent.appendChild(option);
    });

    checkboxList.appendChild(checkboxContent);

    const feedbackErr = document.createElement("div");
    feedbackErr.className = "error";
    feedbackErr.id = "Errfeedback_" + studentCol;

    if (student.data.feedback) {
      const selected = student.data.feedback;

      checkboxContent
        .querySelectorAll('input[type="checkbox"]')
        .forEach((cb) => {
          cb.checked = selected.includes(cb.value);
        });
    }

    studentDiv.appendChild(feedbackErr);

    /* ---------- Mutually Exclusive Logic ---------- */

    const checkboxes = checkboxContent.querySelectorAll(
      'input[type="checkbox"]',
    );

    if (checkboxes.length > 1) {
      const firstCheckbox = checkboxes[0];
      const otherCheckboxes = Array.from(checkboxes).slice(1);

      function updateCheckboxState() {
        const firstChecked = firstCheckbox.checked;
        const anyOtherChecked = otherCheckboxes.some((cb) => cb.checked);

        if (firstChecked) {
          // Disable and uncheck all others
          otherCheckboxes.forEach((cb) => {
            cb.checked = false;
            cb.disabled = true;
          });
          firstCheckbox.disabled = false;
        } else if (anyOtherChecked) {
          // Disable first
          firstCheckbox.checked = false;
          firstCheckbox.disabled = true;

          // Keep others enabled
          otherCheckboxes.forEach((cb) => {
            cb.disabled = false;
          });
        } else {
          // Nothing selected -> enable all
          firstCheckbox.disabled = false;
          otherCheckboxes.forEach((cb) => {
            cb.disabled = false;
          });
        }
      }

      student.controls.updateFeedbackState = updateCheckboxState;

      // Listen to all checkboxes
      checkboxes.forEach((cb) => {
        cb.addEventListener("change", () => {
          markDirty();

          updateCheckboxState();
        });
      });

      // Initialize state
      updateCheckboxState();
    }
  }

  panel.appendChild(studentDiv);

  // Restore comment visibility based on restored marks
  if (marksArr.length == 1) {
    updateCommentVisibility(marks, maxMarks, commentNeeded, studentCol);
  } else {
    updateCommentVisibility(
      wmarks + gmarks + lmarks,
      maxMarks,
      commentNeeded,
      studentCol,
    );
  }
}

function saveStudent() {
  const valid = validateCurrentStudent();

  if (!valid) {
    return;
  }

  studentList[currentStudentIndex].saved = true;
  clearDirty();

  renderStudentList();

  updateProgress();

  moveToNextPendingStudent();
}

function moveToNextPendingStudent() {
  for (let i = currentStudentIndex + 1; i < studentList.length; i++) {
    if (!studentList[i].saved) {
      selectStudent(i);

      return;
    }
  }

  // If there are no pending students after the current one,
  // wrap around to the beginning.

  for (let i = 0; i < currentStudentIndex; i++) {
    if (!studentList[i].saved) {
      selectStudent(i);

      return;
    }
  }

  SHOW_INFO_POPUP("All students have been saved.");
}

function clearStudent() {
  const student = studentList[currentStudentIndex];

  if (student.saved) {
    SHOW_CONFIRMATION_POPUP(
      `This will remove the saved data for <b>${student.name}</b>.<br><br>Do you want to continue?`,
      performClearStudent,
    );

    return;
  }

  performClearStudent();
}

function clearCurrentStudentControls() {
  const student = studentList[currentStudentIndex];

  const c = student.controls;

  // -------------------------
  // Single Marks
  // -------------------------

  if (c.input_marks) {
    c.input_marks.value = "";
  }

  // -------------------------
  // English
  // -------------------------

  if (c.writing) {
    c.writing.value = "";
  }

  if (c.grammar) {
    c.grammar.value = "";
  }

  if (c.literature) {
    c.literature.value = "";
  }

  // -------------------------
  // Handwriting
  // -------------------------

  if (c.handwriting) {
    c.handwriting.value = "";
  }

  // -------------------------
  // Comment
  // -------------------------

  if (c.comment) {
    c.comment.value = "";

    c.comment.style.display = "none";

    const divider = document.getElementById(
      "comment_divider_" + currentStudentCol,
    );

    if (divider) {
      divider.style.display = "none";
    }
  }

  // -------------------------
  // Feedback
  // -------------------------

  if (c.feedback) {
    c.feedback.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.checked = false;
      cb.disabled = false;
    });

    if (c.updateFeedbackState) {
      c.updateFeedbackState();
    }
  }
}

function clearErrors() {
  document.querySelectorAll(".error").forEach((err) => {
    err.innerHTML = "";
  });
}

function validateCurrentStudent() {
  let valid_status = true;

  const student = studentList[currentStudentIndex];
  const studentCol = student.col;

  // Reset previous data
  student.data = {
    total: 0,
    feedback: [],
    comment: "",
  };

  /* ==========================
     MARKS
  ========================== */

  const panel = document.getElementById("studentPanel");

  panel.querySelectorAll('input[name^="marks_"]').forEach((input_marks) => {
    const maxMarksArr = input_marks.name.split("_");
    const idSplitArr = input_marks.id.split("_");

    validateNumber(input_marks, Number(maxMarksArr[maxMarksArr.length - 1]));

    if (input_marks.value.trim() === "") return;

    const value = Number(input_marks.value.trim());

    if (idSplitArr.length == 2) {
      // Single marks subject
      student.data.total = value;
    } else {
      const key = idSplitArr[1];

      student.data[key] = value;

      if (key != "handwriting") {
        student.data.total += value;
      }
    }
  });

  /* ==========================
     FEEDBACK
  ========================== */

  const feedbackList = document.getElementById(`feedbackList_${studentCol}`);

  if (feedbackList) {
    const checkboxes = feedbackList.querySelectorAll(
      'input[type="checkbox"][name="feedbackList"]',
    );

    const errorDiv = document.getElementById(`Errfeedback_${studentCol}`);

    const checked = [...checkboxes].filter((cb) => cb.checked);

    if (checked.length == 0) {
      errorDiv.innerHTML = "Please tick at least one checkbox!";
    } else {
      errorDiv.innerHTML = "";

      student.data.feedback = checked.map((cb) => cb.value);
    }
  }

  /* ==========================
     COMMENTS
  ========================== */

  panel.querySelectorAll('textarea[id^="comment"]').forEach((comment) => {
    if (comment.style.display == "block") {
      validateTextarea(comment);
    }

    student.data.comment = comment.value.trim();
  });

  /* ==========================
     CHECK ERRORS
  ========================== */

  panel.querySelectorAll('[id^="Err"]').forEach((err) => {
    if (err.innerHTML.trim() != "") {
      valid_status = false;
    }
  });

  return valid_status;
}

async function submitAllStudents() {
  inputMarksDetails = {};

  inputMarksDetails.class = selectedExamClass;
  inputMarksDetails.subject = selectedExamSubject;
  inputMarksDetails.row = selectedExamDetails.row;
  inputMarksDetails.teacher = selectedTeacher;
  inputMarksDetails.handwritingNeeded = selectedExamDetails.handwritingNeeded;
  inputMarksDetails.feedbackNeeded = selectedExamDetails.feedbackNeeded;
  inputMarksDetails.ctReason = "";

  inputMarksDetails.marks = {};

  studentList.forEach((student) => {
    inputMarksDetails.marks[student.col] = {
      ...student.data,
    };
  });

  SHOW_CONFIRMATION_POPUP(
    "Are you sure you want to submit the marks?",
    submitExamMarks,
  );
}

async function submitExamMarks() {
  console.log(inputMarksDetails);
  const outputData = await CALL_API(
    API_TYPE_CONSTANT.SUBMIT_EXAM_MARKS,
    inputMarksDetails,
  );

  if (
    outputData?.status &&
    outputData.response &&
    typeof outputData.response === "string"
  ) {
    console.log(outputData.response);
    if (outputData.response == "ok")
      SHOW_SUCCESS_POPUP("Marks submitted Successfully!", homePageClick);
    else if (outputData.response == "okct")
      SHOW_SUCCESS_POPUP("Response submitted Successfully!", homePageClick);
    else
      SHOW_ERROR_POPUP(
        "Unable to submit marks for: " +
          selectedExamDetails["examName"] +
          "!!\n\n" +
          outputData.response.split("ERR: ")[1],
      );
  } else
    SHOW_ERROR_POPUP(
      "Unable to submit marks for: " + selectedExamDetails["examName"] + "!!",
    );

  return;
}
