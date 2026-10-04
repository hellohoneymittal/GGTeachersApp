let leaveData = {};

function buildFieldValueGrid(formId) {
  const columns = [
    {
      displayName: "Field",
      actualName: "field",
    },
    {
      displayName: "Value",
      actualName: "value",
    },
  ];

  const form = document.getElementById(formId);

  const gridData = [];
  const checkboxMap = {}; // 🔹 group checkbox values

  const elements = form.querySelectorAll("input, textarea");

  elements.forEach((el) => {
    /* ---------- NORMAL INPUT / CHECKBOX / TEXTAREA ---------- */
    const label =
      el.previousElementSibling && el.previousElementSibling.tagName === "LABEL"
        ? el.previousElementSibling.innerText
        : el.id;

    if (el.tagName === "INPUT" && el.type === "date") {
      gridData.push({
        field: label,
        value: convertDateNew(el.value),
      });

      if (label == "End Date") {
        const startInput = document.getElementById("startdate");
        const endInput = document.getElementById("enddate");
        const reason = document.getElementById("leaveReason");

        const startDate = new Date(startInput.value);
        const endDate = new Date(endInput.value);

        const msPerDay = 1000 * 60 * 60 * 24;
        const diffInDays = Math.round((endDate - startDate) / msPerDay) + 1;

        gridData.push({
          field: "Number of Days",
          value: diffInDays,
        });
      }
      return;
    }

    // 🔹 CHECKBOX (collect first, don't push yet)
    if (el.tagName === "INPUT" && el.type === "checkbox") {
      if (!el.checked) return; // skip unchecked

      let key = el.name || label;

      if (!checkboxMap[key]) {
        checkboxMap[key] = {
          label: label,
          values: [],
        };
      }

      checkboxMap[key].values.push(el.value);
      return;
    }

    gridData.push({
      field: label,
      value: el.value,
    });
  });

  Object.values(checkboxMap).forEach((group) => {
    gridData.push({
      field: "Class-Subject(s)",
      value: group.values.join("\n\n"), // ✅ newline separated
    });
  });

  return { gridData, columns };
}

function resetLeaveForm(show_confirmation = 0) {
  document.getElementById("enddate").disabled = true;
  const checkboxes = document.querySelectorAll(
    '#classSubject input[type="checkbox"]',
  );
  checkboxes.forEach((cb) => {
    cb.checked = false;
    cb.disabled = true;
    const label = cb.labels[0];
    label.classList.remove("custom-label-radio-content-custom-box");
    label.classList.add("disabled-label");
  });
  document.getElementById("leavesPassBtn").disabled = true;
  document.getElementById("leaveReason").disabled = true;

  show_confirmation == 1
    ? SHOW_CONFIRMATION_POPUP("Do you want to reset form?", resetFormFields)
    : resetFormFields();
}

async function openLeavesWindow() {
  const outputData = await CALL_API_READ(
    API_TYPE_CONSTANT.GET_TEACHER_CLASS_SUBJECTS_BY_NAME,
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
      SHOW_INFO_POPUP(`No classes-subjects found for ${selectedTeacher}!`);
      return;
    }

    let start_next_day_window = "13:30";
    let [hs, ms] = start_next_day_window.split(":").map(Number);
    let startMinutes = hs * 60 + ms;
    let now = new Date();
    let currentMinutes = now.getHours() * 60 + now.getMinutes();
    const teacherLeavesDiv = document.getElementById(
      "teacherLeavesHeading_div",
    );
    const teacherLeavesLabel = document.getElementById(
      "teacherLeavesHeading_lbl",
    );
    let nextButton = document.getElementById("leavesPassBtn");
    const startInput = document.getElementById("startdate");
    const endInput = document.getElementById("enddate");
    const startErr = document.getElementById("startdateError");
    const checkboxList = document.getElementById("classSubject");
    const endErr = document.getElementById("enddateError");
    const reasonBox = document.getElementById("leaveReason");
    const reasonBoxErr = document.getElementById("leaveReasonError");
    let disbaled_lable_class = "disabled-label";
    let enabled_lable_class = "custom-label-radio-content-custom-box";

    nextButton.disabled = true;
    endInput.disabled = true;
    checkboxList.innerHTML = "";
    startInput.innerHTML = "";
    endInput.innerHTML = "";

    nextButton.onclick = function () {
      moveNextStep();
    };

    teacherLeavesDiv.style.display = "block";
    teacherLeavesLabel.innerHTML = `${selectedTeacher}`;

    let offset = currentMinutes > startMinutes ? 1 : 0;

    // 🔹 Compute min start date
    let minStart = now;
    minStart.setDate(minStart.getDate() + offset);

    let minStartStr = minStart.toLocaleDateString("en-CA").split("T")[0];

    console.log(currentMinutes + " -> " + startMinutes + " -> " + minStartStr);

    // 🔹 Apply min to start date
    startInput.min = minStartStr;

    // 🔹 Reset checkboxes and reason
    function resetSelections() {
      const checkboxes = document.querySelectorAll(
        '#classSubject input[type="checkbox"]',
      );

      checkboxes.forEach((cb) => {
        cb.checked = false;
        cb.disabled = true;

        const label = cb.labels[0];
        label.classList.remove(enabled_lable_class);
        label.classList.add(disbaled_lable_class);
      });

      reasonBox.disabled = true;
      reasonBox.value = "";
      reasonBoxErr.innerHTML = "";
      nextButton.disabled = true;
    }

    // 🔹 Enable checkboxes and reason
    function enableSelections() {
      const checkboxes = document.querySelectorAll(
        '#classSubject input[type="checkbox"]',
      );

      checkboxes.forEach((cb) => {
        cb.disabled = false;

        const label = cb.labels[0];
        label.classList.remove(disbaled_lable_class);
        label.classList.add(enabled_lable_class);
      });

      reasonBox.disabled = false;
    }

    // 🔹 Validate Start Date
    startInput.addEventListener("change", function () {
      // Start date changed → clear previous selections
      resetSelections();

      if (!startInput.value) {
        startErr.innerText = "";
        endInput.value = "";
        endInput.disabled = true;
        return;
      }

      // Validate start date
      if (startInput.value < minStartStr) {
        startErr.innerText = `Start date must be ${
          offset === 1 ? "tomorrow" : "day after tomorrow"
        } or later`;

        startInput.value = "";
        endInput.value = "";
        endInput.disabled = true;

        return;
      }

      // Valid start date
      startErr.innerText = "";

      // 🔹 End date defaults to Start Date
      endInput.min = startInput.value;
      endInput.value = startInput.value;
      endInput.disabled = false;

      // 🔹 Enable checkboxes + reason immediately
      enableSelections();
    });

    // 🔹 Validate End Date
    endInput.addEventListener("change", function () {
      // End date changed → clear previous selections
      resetSelections();

      if (!endInput.value) {
        endErr.innerText = "";

        // Since end date is empty, don't allow selections
        return;
      }

      if (endInput.value < startInput.value) {
        SHOW_ERROR_POPUP("End date cannot be earlier than start date");

        endInput.value = startInput.value;
        endErr.innerText = "";

        // Start date is still valid, so selections can be enabled
        enableSelections();

        return;
      }

      endErr.innerText = "";

      // Valid date range → enable selections
      enableSelections();
    });

    checkboxList.addEventListener("change", function (e) {
      if (e.target.type === "checkbox") {
        const anyChecked = checkboxList.querySelector(
          'input[type="checkbox"]:checked',
        );

        if (anyChecked) {
          reasonBox.disabled = false;
        } else {
          reasonBox.disabled = true;
          reasonBox.value = ""; // clear when disabled
          reasonBoxErr.innerHTML = "";
          nextButton.disabled = true;
        }
      }
    });

    reasonBox.addEventListener("input", function () {
      // 🔹 Remove only starting & ending spaces
      let text = reasonBox.value.trim().replace(/\s+/g, " ");

      if (text.length >= 15) {
        nextButton.disabled = false;
        reasonBoxErr.innerHTML = "";
      } else {
        nextButton.disabled = true;
        reasonBoxErr.innerHTML = "Please enter a minimum of 15 characters!";
      }
    });

    checkboxList.className = "radio-container-leaves";

    const checkboxContent = document.createElement("div");
    checkboxContent.className = "radio-content-without-flex";
    checkboxContent.id = "dynamic-feedback-list";

    Object.entries(outputData.response.data).forEach(
      ([className, classData]) => {
        classData.subjects.forEach((subj) => {
          const feedbackId = `${className} - ${subj}`;
          const checkboxId = feedbackId.replace(/[^a-zA-Z0-9_-]/g, "_");

          // Get leaves for this particular class
          const leaves = classData.leaves || {};

          const option = document.createElement("div");
          option.classList.add("options");

          option.innerHTML = `
        <input 
          type="checkbox"
          id="${checkboxId}"
          name="classSubjectList"
          value="${feedbackId}"
          class="custom-checkbox"
          disabled
          data-leaves='${JSON.stringify(leaves)}'
        >

        <label 
          for="${checkboxId}"
          class="${disbaled_lable_class}"
        >
          ${feedbackId}
        </label>
      `;

          checkboxContent.appendChild(option);
        });
      },
    );

    checkboxContent.addEventListener("change", function (e) {
      if (e.target.type !== "checkbox") return;

      if (!e.target.checked) return;

      const startDate = startInput.value;
      const endDate = endInput.value || startInput.value;

      // Don't check if dates are not selected
      if (!startDate || !endDate) return;

      // Get leaves stored in checkbox
      const leaves = JSON.parse(e.target.dataset.leaves || "{}");

      let existingLeaves = [];

      Object.entries(leaves).forEach(([date, subjects]) => {
        // Convert DD/MM/YYYY to YYYY-MM-DD
        const [day, month, year] = date.split("/");
        const leaveDate = `${year}-${month}-${day}`;

        // Check whether leave date is within selected range
        if (leaveDate >= startDate && leaveDate <= endDate) {
          existingLeaves.push({
            date: date,
            subjects: subjects,
          });
        }
      });

      // Show popup only if leave exists in the selected range
      if (existingLeaves.some((leave) => leave.subjects.length >= 2)) {
        let message = `2 or more teachers of ${e.target.value.split(" - ")[0]} already on leave on:\n\n\n`;

        existingLeaves
          .filter((leave) => leave.subjects.length >= 2)
          .forEach((leave) => {
            message += `${leave.date}: ${leave.subjects.join(", ")}\n`;
          });

        message +=
          "\n\nDo you want to Continue or Modify your leaves for above day(s)?";

        SHOW_CONFIRMATION_POPUP(
          message,
          CLOSE_CONFIRMATION_POPUP,
          () => {
            resetLeaveForm();
            CLOSE_CONFIRMATION_POPUP();
          },
          "Continue",
          "Modify",
        );
      }
    });

    checkboxList.appendChild(checkboxContent);
  } else {
    SHOW_ERROR_POPUP("Problem in fetching details from Backend!");
    return;
  }

  SHOW_SPECIFIC_DIV("teacherLeavesContainer");
}

function moveNextStep() {
  const startInput = document.getElementById("startdate");
  const endInput = document.getElementById("enddate");
  const reasonBox = document.getElementById("leaveReason");

  endInput.value = endInput.value ? endInput.value : startInput.value;

  let result = buildFieldValueGrid("teacherLeavesForm");

  leaveData["start"] = startInput.value;
  leaveData["end"] = endInput.value ? endInput.value : startInput.value;
  leaveData["reason"] = reasonBox.value.trim();
  leaveData["classSubject"] = Array.from(
    document.querySelectorAll('#classSubject input[type="checkbox"]:checked'),
  )
    .map((cb) => cb.value)
    .join(",");
  leaveData["teacher"] = selectedTeacher;

  console.log(leaveData);

  SHOW_CONFIRMATION_GRID_POPUP(
    result.gridData,
    result.columns,
    submitLeaves,
    "Submit",
    "Edit",
    "Verify Details!",
  );
}

async function submitLeaves() {
  const outputData = await CALL_API(
    API_TYPE_CONSTANT.SUBMIT_TEACHER_LEAVES,
    leaveData,
  );

  if (
    outputData?.status &&
    outputData.response &&
    typeof outputData.response === "string"
  ) {
    console.log(outputData.response);
    if (outputData.response == "ok") {
      checkLeavesAndSendWhatsapp();
      SHOW_SUCCESS_POPUP(
        "Leaves submitted Successfully for " + selectedTeacher + "!",
        () => {
          SHOW_SPECIFIC_DIV("menuPopup");
        },
      );
    } else
      SHOW_ERROR_POPUP(
        "Unable to submit leaves for: " +
          selectedTeacher +
          "!!\n\n" +
          outputData.response.split("ERR: ")[1],
      );
  } else
    SHOW_ERROR_POPUP("Unable to submit leaves for: " + selectedTeacher + "!!");

  return;
}

function checkLeavesAndSendWhatsapp() {
  const checkedCheckboxes = document.querySelectorAll(
    '#classSubject input[type="checkbox"]:checked',
  );

  const startDate = new Date(leaveData.start + "T00:00:00");
  const endDate = new Date(leaveData.end + "T00:00:00");

  const whatsappLeaves = {};

  checkedCheckboxes.forEach((cb) => {
    const classSubject = cb.value;

    const leaves = JSON.parse(cb.dataset.leaves || "{}");

    Object.entries(leaves).forEach(([date, subjects]) => {
      const [day, month, year] = date.split("/");

      const leaveDate = new Date(`${year}-${month}-${day}T00:00:00`);

      if (leaveDate >= startDate && leaveDate <= endDate) {
        const totalLeaves = subjects.length + 1;

        if (totalLeaves >= 3) {
          if (!whatsappLeaves[date]) {
            whatsappLeaves[date] = [];
          }

          if (!whatsappLeaves[date].includes(classSubject)) {
            whatsappLeaves[date].push(classSubject);
          }
        }
      }
    });
  });

  let whatsappMessage =
    "Hare Krishna. Dandwat Pranaam!\n\nFollowing classes have more than 2 teachers on leaves on the below date(s):\n\n";

  Object.entries(whatsappLeaves).forEach(([date, classes]) => {
    whatsappMessage += `${date}:\n`;

    classes.forEach((classSubject) => {
      whatsappMessage += `• ${classSubject.split(" - ")[0]}\n`;
    });

    whatsappMessage += "\n\nYour servant";
  });

  if (whatsappMessage) {
    CALL_API_WITHOUT_LOADING("SEND_ADMIN_WHATSAPP", {
      msg: whatsappMessage,
      group: "GG exam & curriculam dept",
    });
    console.log(whatsappMessage);
  }
}
