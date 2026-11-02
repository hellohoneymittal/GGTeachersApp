//===============================
// GLOBAL VARIABLES
//===============================

let studentList = [];

let currentStudentIndex = -1;

let currentStudentCol = "";

let currentStudentName = "";

let commentThresholdMarks = 0.5;

const ratingValues = {
  "Very Good": 1,
  "Ok-Ok": 0,
  "Not Good": -1,
};

const ratingMap = {
  1: "Very Good",
  0: "Ok-Ok",
  "-1": "Not Good",
};

document.addEventListener(
  "wheel",
  function (event) {
    if (document.activeElement.matches('input[type="number"]')) {
      document.activeElement.blur();
    }
  },
  { passive: true },
);

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
  const commentLabel = document.getElementById("comment_label_" + studentCol);

  const commentBox = document.getElementById("comment_" + studentCol);

  const commentErr = document.getElementById("Errcomment_" + studentCol);

  if (!commentDivider || !commentBox || !commentErr || !commentLabel) return;

  const hasComment = commentBox.value.trim() !== "";

  console.log(`For comments on: ${studentCol}`);

  if (
    totalMarks >= 0 &&
    commentNeeded == 1 &&
    (totalMarks < commentThresholdMarks * maxMarks || hasComment)
  ) {
    commentDivider.style.display = "block";
    commentBox.style.display = "block";
    commentErr.style.display = "block";
    commentLabel.style.display = "block";
  } else {
    commentDivider.style.display = "none";
    commentBox.style.display = "none";
    commentErr.style.display = "none";
    commentLabel.style.display = "none";
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
      incomingMarks: arr.length == 3 ? arr[2] : "",
      incomingMarksLoaded: false,
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
    <br/>
    <div class="marks-layout">

      <!-- TOP STUDENT PANEL -->
      <div class="marks-sidebar">

        <div class="student-toolbar">

          <input
            id="studentSearch"
            class="gg-name"
            type="text"
            placeholder="Search Student..."
            autocomplete="off"
          >

          <div>
            <span id="progressLabel">Completed: 0 / 0</span>

            <div class="progress">
              <div id="progressBar"></div>
            </div>
          </div>

        </div>

        <!-- Horizontally scrollable student list -->
        <div
          id="studentList"
          class="student-list"
        ></div>

      </div>

      <!-- MARKS ENTRY PANEL BELOW -->
      <div class="marks-main">

        <div id="studentPanel"></div>

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

  document.getElementById("submitAllBtn").addEventListener("click", () => {
    SHOW_CONFIRMATION_POPUP(
      "Are you sure you want to submit the marks?",
      submitExamMarks,
    );
  });
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
        ${student.name.split("_")[1]}
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
  let student = studentList[currentStudentIndex];
  let incomingMarks = student.incomingMarks;

  let marks = -1;
  let wmarks = -1;
  let gmarks = -1;
  let lmarks = -1;

  if (incomingMarks && !student.incomingMarksLoaded) {
    let marksStringSplit = incomingMarks.split("\nComments\n");
    let marksSplitArr = marksStringSplit[0].split("\n");
    student.data.comment = marksStringSplit[1] || "";
    student.data.feedback = [];

    let i;

    for (i = 0; i < marksSplitArr.length; i++) {
      if (!marksSplitArr[i].includes(" - "))
        student.data.total = Number(marksSplitArr[i]);
      else {
        let splitMarks = Number(marksSplitArr[i].split(" - ")[1]);
        switch (marksSplitArr[i].split(" - ")[0]) {
          case "L":
            student.data.literature = splitMarks;
            break;
          case "W":
            student.data.writing = splitMarks;
            break;
          case "G":
            student.data.grammar = splitMarks;
            break;
          case "H":
            let exam_type = selectedExamDetails.examName;
            student.data.handwriting = exam_type.includes("Class Test")
              ? splitMarks / 1.5
              : exam_type.includes("Unit Test")
                ? splitMarks / 2.5
                : splitMarks / 10;

            break;
        }
      }
    }
    student.incomingMarksLoaded = true;

    student.saved = true;
    clearDirty();

    renderStudentList();

    updateProgress();

    moveToNextPendingStudent(0);
  }

  student = studentList[currentStudentIndex];

  // Reset control references every time the UI is rendered
  student.controls = {};

  const studentName = student.name;
  const studentCol = student.col;
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

  let divider = document.createElement("hr");
  divider.className = "divider";
  studentDiv.appendChild(divider);

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
    input_marks.placeholder = "0 to " + maxMarks;

    if (student.data.total !== undefined) {
      input_marks.value = student.data.total;
      marks = Number(student.data.total);
    }

    // Create label
    const marksLabel = document.createElement("label");
    marksLabel.innerText = "Total Marks";
    marksLabel.className = "required";

    // Add to page
    studentDiv.appendChild(marksLabel);

    studentDiv.appendChild(input_marks);

    const marksErr = document.createElement("div");
    marksErr.className = "error";
    marksErr.id = "Errmarks_" + studentCol;

    studentDiv.appendChild(marksErr);

    input_marks.addEventListener("change", () => {
      markDirty();
      if (validateNumber(input_marks, maxMarks)) {
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
    writing_input_marks.placeholder = "0 to " + marksArr[1];

    if (student.data.writing !== undefined) {
      writing_input_marks.value = student.data.writing;
      wmarks = Number(student.data.writing);
    }

    // Create label
    const marksLabelW = document.createElement("label");
    marksLabelW.innerText = "Writing Section Marks";
    marksLabelW.className = "required";

    // Add to page
    studentDiv.appendChild(marksLabelW);

    studentDiv.appendChild(writing_input_marks);

    const writeMarksErr = document.createElement("div");
    writeMarksErr.className = "error";
    writeMarksErr.id = "Errmarks_writing_" + studentCol;

    studentDiv.appendChild(writeMarksErr);

    writing_input_marks.addEventListener("change", () => {
      markDirty();
      if (validateNumber(writing_input_marks, marksArr[1])) {
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

    divider = document.createElement("hr");
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
    grammar_input_marks.placeholder = "0 to " + marksArr[2];

    if (student.data.grammar !== undefined) {
      grammar_input_marks.value = student.data.grammar;
      gmarks = Number(student.data.grammar);
    }

    // Create label
    const marksLabelG = document.createElement("label");
    marksLabelG.innerText = "Grammar Section Marks";
    marksLabelG.className = "required";

    // Add to page
    studentDiv.appendChild(marksLabelG);

    studentDiv.appendChild(grammar_input_marks);

    const gramMarksErr = document.createElement("div");
    gramMarksErr.className = "error";
    gramMarksErr.id = "Errmarks_grammar_" + studentCol;

    studentDiv.appendChild(gramMarksErr);

    grammar_input_marks.addEventListener("change", () => {
      markDirty();
      if (validateNumber(grammar_input_marks, marksArr[2])) {
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
    literature_input_marks.placeholder = "0 to " + marksArr[3];

    if (student.data.literature !== undefined) {
      literature_input_marks.value = student.data.literature;
      lmarks = Number(student.data.literature);
    }

    // Create label
    const marksLabelL = document.createElement("label");
    marksLabelL.innerText = "Literature Section Marks";
    marksLabelL.className = "required";

    // Add to page
    studentDiv.appendChild(marksLabelL);

    studentDiv.appendChild(literature_input_marks);

    const litMarksErr = document.createElement("div");
    litMarksErr.className = "error";
    litMarksErr.id = "Errmarks_literature_" + studentCol;

    studentDiv.appendChild(litMarksErr);

    literature_input_marks.addEventListener("change", () => {
      markDirty();
      if (validateNumber(literature_input_marks, marksArr[3])) {
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

  // Create label
  const commentsLabel = document.createElement("label");
  commentsLabel.innerText = "Comments for Improvement";
  commentsLabel.className = "required";
  commentsLabel.style.display = "none";
  commentsLabel.id = "comment_label_" + studentCol;

  // Add to page
  studentDiv.appendChild(commentsLabel);
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
    handwriting_marks.placeholder = "0 to 10";

    if (student.data.handwriting !== undefined) {
      handwriting_marks.value = student.data.handwriting;
    }

    // Create label
    const marksLabelH = document.createElement("label");
    marksLabelH.innerText = "Handwriting Marks";
    marksLabelH.className = "required";

    // Add to page
    studentDiv.appendChild(marksLabelH);

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

    const feedbackGrid = document.createElement("div");
    feedbackGrid.className = "feedback-grid-container";
    feedbackGrid.id = "feedbackList_" + studentCol;

    const feedbackHeading = document.createElement("label");
    feedbackHeading.textContent = "Behaviour Feedback";
    feedbackHeading.className = "required";

    feedbackGrid.appendChild(feedbackHeading);

    const table = document.createElement("table");
    table.className = "feedback-grid";

    // Create table header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const headers = ["Behaviour", "Very Good", "Ok-Ok", "Not Good"];

    headers.forEach((heading) => {
      const th = document.createElement("th");
      th.textContent = heading;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    const ratings = ["Very Good", "Ok-Ok", "Not Good"];

    // Restore previously selected feedback
    const savedFeedback = Array.isArray(student.data.feedback)
      ? student.data.feedback
      : [];

    feedbackArr.forEach((feedback, index) => {
      const row = document.createElement("tr");

      // Behaviour name
      const behaviourCell = document.createElement("td");
      behaviourCell.textContent = feedback;
      row.appendChild(behaviourCell);

      // Find previously saved rating for this behaviour
      const savedEntry = savedFeedback.find(
        (entry) =>
          entry.startsWith(feedback + "_") ||
          entry.startsWith(feedback + " - "),
      );

      let savedRating = "";

      if (savedEntry) {
        let savedValue;

        if (savedEntry.startsWith(feedback + "_")) {
          // Format: Respect Teachers_1
          savedValue = savedEntry.substring(feedback.length + 1);
        } else {
          // Format: Respect Teachers - 1
          savedValue = savedEntry.substring(feedback.length + 3);
        }

        // Convert the saved numeric value to the radio button label
        savedRating = ratingMap[savedValue] || savedValue;
      }

      // Create three mutually exclusive radio buttons
      ratings.forEach((rating) => {
        const td = document.createElement("td");
        td.className = "feedback-rating-cell";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = `feedback_${studentCol}_${index}`;
        radio.value = rating;
        radio.className = "feedback-radio";
        radio.checked = savedRating === rating;

        radio.addEventListener("change", () => {
          markDirty();
          const errorDiv = document.getElementById(`Errfeedback_${studentCol}`);

          if (errorDiv) errorDiv.textContent = "";
        });

        td.appendChild(radio);
        row.appendChild(td);
      });

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    feedbackGrid.appendChild(table);

    student.controls.feedback = feedbackGrid;

    const lineBreak = document.createElement("br");
    const feedbackErr = document.createElement("div");
    feedbackErr.className = "error";
    feedbackErr.id = "Errfeedback_" + studentCol;

    studentDiv.appendChild(feedbackGrid);
    studentDiv.appendChild(lineBreak);
    studentDiv.appendChild(feedbackErr);
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

function moveToNextPendingStudent(confirmFlag = 1) {
  for (let i = currentStudentIndex + 1; i < studentList.length; i++) {
    if (!studentList[i].saved) {
      selectStudent(i);

      return;
    }
  }

  // If there are no pending students after the current one,
  // wrap around to the beginning.

  if (confirmFlag == 1) {
    for (let i = 0; i < currentStudentIndex; i++) {
      if (!studentList[i].saved) {
        selectStudent(i);

        return;
      }
    }

    SHOW_CONFIRMATION_POPUP(
      "All students have been saved. Submit response or continue to edit marks?",
      submitExamMarks,
      CLOSE_CONFIRMATION_POPUP,
      "Submit All Marks",
      "Edit Marks",
    );
  }
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

    const label = document.getElementById("comment_label_" + currentStudentCol);

    if (label) {
      label.style.display = "none";
    }
  }

  // -------------------------
  // Feedback
  // -------------------------

  if (c.feedback) {
    c.feedback.querySelectorAll('input[type="radio"]').forEach((radio) => {
      radio.checked = false;
    });
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

  // Keep existing data
  if (!student.data) {
    student.data = {};
  }

  // Reset only values that are calculated during validation
  student.data.total = 0;
  student.data.feedback = [];
  student.data.comment = "";

  /*
   * ==========================
   * MARKS
   * ==========================
   */

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

  /*
   * ==========================
   * FEEDBACK
   * ==========================
   */

  const feedbackList = document.getElementById(`feedbackList_${studentCol}`);

  if (feedbackList) {
    const errorDiv = document.getElementById(`Errfeedback_${studentCol}`);

    const selectedFeedback = [];

    feedbackArr.forEach((feedback, index) => {
      const selected = feedbackList.querySelector(
        `input[name="feedback_${studentCol}_${index}"]:checked`,
      );

      if (selected) {
        selectedFeedback.push(`${feedback}_${ratingValues[selected.value]}`);
      }
    });

    if (selectedFeedback.length !== feedbackArr.length) {
      errorDiv.textContent = "Please select a rating for every behaviour.";
    } else {
      errorDiv.textContent = "";
      student.data.feedback = selectedFeedback;
    }
  }

  /*
   * ==========================
   * COMMENTS
   * ==========================
   */

  panel.querySelectorAll('textarea[id^="comment"]').forEach((comment) => {
    if (comment.style.display == "block") {
      validateTextarea(comment);

      student.data.comment = comment.value.trim();
    } else {
      // Comment isn't required when hidden
      student.data.comment = "";
    }
  });

  /*
   * ==========================
   * CHECK ERRORS
   * ==========================
   */

  panel.querySelectorAll('[id^="Err"]').forEach((err) => {
    if (err.innerHTML.trim() != "") {
      valid_status = false;
    }
  });

  return valid_status;
}

async function submitExamMarks() {
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

  console.log(inputMarksDetails);
  const outputData = await CALL_API_WRITE_CF(
    "SUBMIT_EXAM_MARKS",
    inputMarksDetails,
  );

  if (
    outputData?.status &&
    outputData.data &&
    typeof outputData.data === "string"
  ) {
    console.log(outputData.data);
    if (outputData.data == "ok")
      SHOW_SUCCESS_POPUP("Marks submitted Successfully!", homePageClick);
    else if (outputData.data == "okct")
      SHOW_SUCCESS_POPUP("Marks submitted Successfully!", homePageClick);
    else
      SHOW_ERROR_POPUP(
        "Unable to submit marks for: " +
          selectedExamDetails["examName"] +
          "!!\n\n" +
          outputData.data.split("ERR: ")[1],
      );
  } else
    SHOW_ERROR_POPUP(
      "Unable to submit marks for: " + selectedExamDetails["examName"] + "!!",
    );

  return;
}
