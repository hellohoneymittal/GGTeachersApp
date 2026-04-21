let leaveData = {}

function buildFieldValueGrid(formId) {
     const columns = [{
        displayName: "Field", 
        actualName: "field"
      },
      {
        displayName: "Value", 
        actualName: "value"
    }]

    const form = document.getElementById(formId);

    const gridData = [];
    const checkboxMap = {}; // 🔹 group checkbox values

    const elements = form.querySelectorAll("input, textarea");

    elements.forEach(el => {
        /* ---------- NORMAL INPUT / CHECKBOX / TEXTAREA ---------- */
        const label =
            el.previousElementSibling &&
            el.previousElementSibling.tagName === "LABEL"
                ? el.previousElementSibling.innerText
                : el.id;
        
        if (el.tagName === "INPUT" && el.type === "date"){
          gridData.push({
            field: label,
            value: convertDate(el.value)
          });
          return
        }
        
        // 🔹 CHECKBOX (collect first, don't push yet)
        if (el.tagName === "INPUT" && el.type === "checkbox") {

            if (!el.checked) return; // skip unchecked

            let key = el.name || label;

            if (!checkboxMap[key]) {
            checkboxMap[key] = {
                label: label,
                values: []
            };
            }

            checkboxMap[key].values.push(el.value);
            return;
        }

        gridData.push({
            field: label,
            value: el.value
        });
    });

    Object.values(checkboxMap).forEach(group => {

        gridData.push({
            field: "Class-Subject(s)",
            value: group.values.join("\n\n") // ✅ newline separated
        });

    });

    return { gridData, columns };
}

function resetLeaveForm(show_confirmation=0){
   
    document.getElementById("enddate").disabled = true
    const checkboxes = document.querySelectorAll('#classSubject input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = false;
        cb.disabled = true;
        const label = cb.labels[0];
        label.classList.remove("custom-label-radio-content-custom-box");
        label.classList.add("disabled-label");
    });
    document.getElementById("leavesPassBtn").disabled = true
    document.getElementById("leaveReason").disabled = true

    show_confirmation == 1 ? SHOW_CONFIRMATION_POPUP("Do you want to reset form?", resetFormFields) : resetFormFields();
}

async function openLeavesWindow() {
  const outputData = await CALL_API(
    API_TYPE_CONSTANT.GET_TEACHER_CLASS_SUBJECTS_BY_NAME,
    selectedTeacher,
  );

  if (outputData?.status && outputData.response) {
    if (typeof outputData.response === "string" && outputData.response.includes("ERR")) {
      SHOW_ERROR_POPUP(outputData.response.split("ERR: ")[1]);
      return;
    }

    if (Object.keys(outputData.response.data).length == 0) {
      SHOW_INFO_POPUP(`No classes-subjects found for ${selectedTeacher}!`);
      return;
    }

    let start_next_day_window = "19:00"
    let [hs, ms] = start_next_day_window.split(":").map(Number);
    let startMinutes = hs * 60 + ms;
    let now = new Date();
    let currentMinutes = now.getHours() * 60 + now.getMinutes();
    const teacherLeavesDiv = document.getElementById("teacherLeavesHeading_div");
    const teacherLeavesLabel = document.getElementById("teacherLeavesHeading_lbl");
    let nextButton = document.getElementById("leavesPassBtn")
    const startInput = document.getElementById("startdate");
    const endInput = document.getElementById("enddate");
    const startErr = document.getElementById("startdateError");
    const checkboxList = document.getElementById("classSubject");
    const endErr = document.getElementById("enddateError");
    const reasonBox = document.getElementById("leaveReason")
    const reasonBoxErr = document.getElementById("leaveReasonError")
    let disbaled_lable_class = "disabled-label"
    let enabled_lable_class = "custom-label-radio-content-custom-box"

    nextButton.disabled = true
    endInput.disabled = true
    checkboxList.innerHTML = ""
    startInput.innerHTML = ""
    endInput.innerHTML = ""

    nextButton.onclick = function(){
      moveNextStep()
    } 

    teacherLeavesDiv.style.display = "block";
    teacherLeavesLabel.innerHTML = `${selectedTeacher}`;

    let offset = currentMinutes > startMinutes ? 2 : 1;

    // 🔹 Compute min start date
    let minStart = now;
    minStart.setDate(minStart.getDate() + offset);

    let minStartStr = minStart.toLocaleDateString('en-CA').split("T")[0];

    // 🔹 Apply min to start date
    startInput.min = minStartStr;

    // 🔹 Validate start date
    startInput.addEventListener("change", function(){

        const checkboxes = document.querySelectorAll('#classSubject input[type="checkbox"]');

        if(startInput.value < minStartStr){
            startErr.innerText = `Start date must be ${offset === 1 ? "tomorrow" : "day after tomorrow"} or later`;
            startInput.value = "";
        } else {
            startErr.innerText = "";
            // 🔹 Set end date min = selected start date
            endInput.min = startInput.value;
            endInput.disabled = false
            endInput.value = ""
            checkboxes.forEach(cb => {
                const label = cb.labels[0];
                label.classList.remove(disbaled_lable_class);
                label.classList.add(enabled_lable_class);
                cb.disabled = false; // enable only if date selected
            });
        }

        if(startInput.value == ""){
            endInput.disabled = true;  
            endInput.value = ""
            checkboxes.forEach(cb => {
                const label = cb.labels[0];
                label.classList.remove(enabled_lable_class);
                label.classList.add(disbaled_lable_class);
                cb.checked = false;
                cb.disabled = true; // enable only if date selected
                reasonBox.disabled = true;
                reasonBox.value = ""; // clear when disabled
                reasonBoxErr.innerHTML = ""
                nextButton.disabled = true
            });
        }
    });

    // 🔹 Validate end date
    endInput.addEventListener("change", function(){

        if(!endInput.value){
            endErr.innerText = "";
            return
        }

        if(endInput.value < startInput.value){
        SHOW_ERROR_POPUP("End date cannot be earlier than start date");
        endInput.value = "";
        } else {
        endErr.innerText = "";
        }

    });

    checkboxList.addEventListener("change", function(e){

        if(e.target.type === "checkbox"){
            const anyChecked = checkboxList.querySelector('input[type="checkbox"]:checked');

            if(anyChecked){
                reasonBox.disabled = false;
            } else {
                reasonBox.disabled = true;
                reasonBox.value = ""; // clear when disabled
                reasonBoxErr.innerHTML = ""
                nextButton.disabled = true
            }
        }

    });

    reasonBox.addEventListener("input", function (){

    // 🔹 Remove only starting & ending spaces
    let text = reasonBox.value.trim().replace(/\s+/g, " ");

    if(text.length >= 15){
        nextButton.disabled = false;
        reasonBoxErr.innerHTML = ""
    } else {
        nextButton.disabled = true;
        reasonBoxErr.innerHTML = "Please enter a minimum of 15 characters!"
    }
    });

    checkboxList.className = "radio-container-leaves";

    const checkboxContent = document.createElement("div");
    checkboxContent.className = "radio-content-without-flex";
    checkboxContent.id = "dynamic-feedback-list";

    Object.entries(outputData.response.data).forEach(([className, subjects]) => {
        // 🔹 Subjects
        subjects.forEach((subj) => {
            const feedbackId = `${className} - ${subj}`;

            const option = document.createElement("div");
            option.classList.add("options");

            option.innerHTML = `
            <input type="checkbox" id="${feedbackId}" name="classSubjectList" value="${feedbackId}" class="custom-checkbox" disabled>
            <label for="${feedbackId}" class=${disbaled_lable_class}>${feedbackId}</label>
            `;
           
            checkboxContent.appendChild(option);
        });
    });

    checkboxList.appendChild(checkboxContent);
   }
  else{
    SHOW_ERROR_POPUP("Problem in fetching details from Backend!");
    return;
  }

  SHOW_SPECIFIC_DIV("teacherLeavesContainer");
}

function moveNextStep(){
    const startInput = document.getElementById("startdate");
    const endInput = document.getElementById("enddate");
    const reasonBox = document.getElementById("leaveReason")

    endInput.value = endInput.value ? endInput.value : startInput.value

    let result = buildFieldValueGrid("teacherLeavesForm")

    leaveData["start"] = startInput.value
    leaveData["end"] = endInput.value ? endInput.value : startInput.value
    leaveData["reason"] = reasonBox.value.trim()
    leaveData["classSubject"] = Array.from(document.querySelectorAll('#classSubject input[type="checkbox"]:checked')).map(cb => cb.value).join(",");;
    leaveData["teacher"] = selectedTeacher

    console.log(leaveData)

    SHOW_CONFIRMATION_GRID_POPUP(result.gridData,result.columns,() => SHOW_CONFIRMATION_POPUP("Are you sure to proceed!",submitLeaves),"Submit","Edit","Verify Details!");
}

async function submitLeaves(){
    const outputData = await CALL_API(
        API_TYPE_CONSTANT.SUBMIT_TEACHER_LEAVES,
        leaveData,
    );

    if (outputData?.status && outputData.response && typeof outputData.response === "string") {
        console.log(outputData.response);
        if (outputData.response == "ok")
            SHOW_SUCCESS_POPUP("Leaves submitted Successfully for " + selectedTeacher + "!", () => {SHOW_SPECIFIC_DIV('menuPopup')});
        else
            SHOW_ERROR_POPUP("Unable to submit leaves for: " + selectedTeacher + "!!\n\n" + outputData.response.split("ERR: ")[1]);
    } 
    else
      SHOW_ERROR_POPUP("Unable to submit marks for: " + selectedExamDetails["examName"] + "!!");

    return;
}