let selectedClassUT = "";
let selectedSubjectUT = "";
let selectedUT = "";
let apiClassSubjectMap = {}; // global variable
let masterList = [];

function loadClassList() {
  const classSelectUT = document.getElementById("classSelectUT");
  CLASS_LIST.forEach((cls) => {
    classSelectUT.innerHTML += `<option value="${cls}">${cls}</option>`;
  });
}

function onClassChange() {
  selectedClassUT = document.getElementById("classSelectUT").value;
  const subjectSelect = document.getElementById("subjectSelect");

  // Reset dropdown
  subjectSelect.innerHTML = `<option value="">Select Subject</option>`;

  if (!selectedClassUT) return;

  // Decide data source
  const activeClassMap = isEditMode
    ? apiClassSubjectMap // API data (edit mode)
    : SUBJECT_MAP; // Static data (view mode)

  // VIEW MODE → show All Subjects
  if (!isEditMode) {
    subjectSelect.innerHTML += `<option value="ALL_SUBJECTS">All Subjects</option>`;
  }

  const subjects = activeClassMap[selectedClassUT] || [];

  subjects.forEach((sub) => {
    subjectSelect.innerHTML += `<option value="${sub}">${sub}</option>`;
  });
}

async function onSubjectChange() {
  selectedSubjectUT = document.getElementById("subjectSelect").value;

  if (!selectedClassUT || !selectedSubjectUT) return;

  const utSelect = document.getElementById("utSelect");

  utSelect.innerHTML = `<option value="">Select Exam</option>`;

  EXAM_LIST.forEach((exam) => {
    utSelect.innerHTML += `<option value="${exam}">${exam}</option>`;
  });

  if (isEditMode) {
    // EDIT MODE → force ALL + disable
    if (!utSelect.querySelector('option[value="ALL"]')) {
      utSelect.innerHTML += `<option value="ALL">All Exams</option>`;
    }

    utSelect.value = "ALL";
    utSelect.disabled = true;
  } else {
    // VIEW MODE → enabled
    utSelect.disabled = false;
  }
}

function mergeUTIntoAnnual(data) {
  const ut4 = data["Unit Test 4"] || [];
  const ut5 = data["Unit Test 5"] || [];
  const ut6 = data["Unit Test 6"] || [];

  if (!data["Annual"]) {
    data["Annual"] = [];
  }

  data["Annual"] = [...new Set([...data["Annual"], ...ut4, ...ut5, ...ut6])];

  return data;
}

async function getUTList(selectedClassUT, selectedSubjectUT, selectedUT) {
  if (selectedUT !== "ALL") return [];

  const res = await CALL_API_READ(API_TYPE_CONSTANT.GET_ALL_UT_CHAPTERS, {
    className: selectedClassUT,
    subjectName: selectedSubjectUT,
  });

  let data = res?.data?.utResponse;
  masterList = res?.data?.masterList;

  if (isLowerClass(selectedClassUT)) {
    data = mergeUTIntoAnnual(data);
  }

  let utList = [];

  for (let ut in data) {
    utList.push({
      utName: ut,
      chapters: data[ut],
    });
  }

  return utList;
}

async function submitSyllabus() {
  const selectedClassUT = document
    .getElementById("classSelectUT")
    ?.value?.trim();
  const selectedSubjectUT = document
    .getElementById("subjectSelect")
    ?.value?.trim();
  const selectedUT = document.getElementById("utSelect")?.value?.trim();

  if (!selectedClassUT || !selectedSubjectUT || !selectedUT) {
    return SHOW_ERROR_POPUP("Please select Class, Subject, and Exam.");
  }

  try {
    let chaptersData = [];

    switch (true) {
      /* ---------- CASE 0 ---------- */
      case selectedSubjectUT === "ALL_SUBJECTS" && selectedUT === "ALL": {
        const res = await CALL_API_READ(API_TYPE_CONSTANT.GET_FULL_SYLLABUS, {
          className: selectedClassUT,
        });

        const allData = res.data;

        for (let subjectName in allData) {
          const utMap = allData[subjectName];
          let utList = [];

          for (let utName in utMap) {
            utList.push({
              utName,
              chapters: utMap[utName],
            });
          }

          chaptersData.push({ subject: subjectName, utList });
        }
        break;
      }

      /* ---------- CASE 1 ---------- */
      case selectedSubjectUT === "ALL_SUBJECTS": {
        const res = await CALL_API_READ(
          API_TYPE_CONSTANT.GET_ALL_SUBJECTS_SYLLABUS,
          { className: selectedClassUT, utName: selectedUT },
        );

        const allData = res.data;

        for (let subjectName in allData) {
          chaptersData.push({
            subject: subjectName,
            utList: [
              {
                utName: selectedUT,
                chapters: allData[subjectName],
              },
            ],
          });
        }
        break;
      }

      /* ---------- CASE 2 ---------- */

      case selectedUT === "ALL": {
        let utList = await getUTList(
          selectedClassUT,
          selectedSubjectUT,
          selectedUT,
        );

        chaptersData.push({
          subject: selectedSubjectUT,
          utList: utList,
        });
        break;
      }

      /* ---------- CASE 3 ---------- */
      default: {
        const res = await CALL_API_READ(API_TYPE_CONSTANT.GET_UT_CHAPTERS, {
          className: selectedClassUT,
          subjectName: selectedSubjectUT,
          utName: selectedUT,
        });

        chaptersData.push({
          subject: selectedSubjectUT,
          utList: [
            {
              utName: selectedUT,
              chapters: res.data,
            },
          ],
        });
      }
    }

    /* -------- VIEW MODE -------- */
    if (!isEditMode) {
      SHOW_SPECIFIC_DIV("viewSyllabusContainer");
      const body = document.getElementById("viewSyllabusBody");
      body.innerHTML = buildViewHTML(chaptersData, selectedClassUT);
    } else {
      document.getElementById("editClass").innerText = selectedClassUT;
      document.getElementById("editSubject").innerText = selectedSubjectUT;
      SHOW_SPECIFIC_DIV("editSyllabusContainer");
      renderEditMapping(chaptersData);
    }
  } catch (err) {
    console.error(err);
    SHOW_ERROR_POPUP("Error: " + err.message);
  }
}

function buildViewHTML(data, selectedClassUT) {
  let html = `
    <div style="text-align:center;margin-bottom:12px;">
      <strong>Class:</strong> ${selectedClassUT}
    </div>
    <div class="syllabus-wrapper">
  `;

  /* ---------- CASE 1 & 2 (single subject formats) ---------- */
  if (Array.isArray(data) && data.length && data[0].ut) {
    data.forEach((item) => {
      html += `
            <div class="syllabus-card">
              <h4 class="syllabus-ut-title">${item.ut}</h4>
              <div class="syllabus-ut-items">
                ${item.chapters.map((ch) => `<div>${ch}</div>`).join("")}
              </div>
            </div>
          `;
    });
    html += `</div>`;

    return html;
  }

  /* ---------- CASE 3 & 4 (multi subject formats) ---------- */
  if (Array.isArray(data) && data.length && data[0].subject) {
    data.forEach((subjectItem) => {
      html += `
            <div class="syllabus-card">
              <div class="syllabus-card-header">
                <strong>${subjectItem.subject}</strong>
              </div>
              <div class="syllabus-card-body">
          `;

      (subjectItem.utList || []).forEach((utItem) => {
        html += `
                <h4 class="syllabus-ut-title">${utItem.utName}</h4>
                <div class="syllabus-ut-items">
                  ${utItem.chapters.map((ch) => `<div>${ch}</div>`).join("")}
                </div>
              `;
      });

      html += `</div></div>`;
    });

    return html;
  }

  return html;
}

function downloadSyllabusText() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  // Font ko yahan call karein agar global register nahi ho raha
  const fontBase64 = FONT_HINDI;
  pdf.addFileToVFS("NotoSansDevanagari-Regular.ttf", fontBase64);
  pdf.addFont(
    "NotoSansDevanagari-Regular.ttf",
    "NotoSansDevanagari-Regular",
    "normal",
  );

  console.log(pdf.getFontList());

  // IMPORTANT: always use devanagari font everywhere
  const FONT = "NotoSansDevanagari-Regular";

  pdf.setFont(FONT, "normal");

  const margin = 15;
  const pageHeight = pdf.internal.pageSize.height;
  const pageWidth = pdf.internal.pageSize.width;
  let y = margin;

  const container = document.getElementById("viewSyllabusBody");

  /* ---------- HEADER ---------- */

  const selectedClassUT =
    document.getElementById("classSelectUT")?.value?.trim() || "Class";

  const selectedSubjectUT =
    document.getElementById("subjectSelect")?.value?.trim() || "Subject";

  const selectedUT =
    document.getElementById("utSelect")?.value?.trim() || "All";

  const headerText = `Class: ${selectedClassUT}\nSubject: ${selectedSubjectUT}\nExam: ${selectedUT}`;

  pdf.setFontSize(14);
  pdf.setFont(FONT, "normal");

  const headerLines = pdf.splitTextToSize(headerText, pageWidth - 2 * margin);
  pdf.text(headerLines, margin, y);
  y += headerLines.length * 7 + 12;

  /* ---------- CONTENT ---------- */

  const cards = container.querySelectorAll(".syllabus-card");

  cards.forEach((card) => {
    const subjectName = card.querySelector(
      ".syllabus-card-header strong",
    )?.innerText;

    if (subjectName) {
      if (y > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }

      pdf.setFontSize(14);
      pdf.setFont(FONT, "normal");
      pdf.text(subjectName, margin, y);
      y += 7;
    }

    const utTitles = card.querySelectorAll(".syllabus-ut-title");

    utTitles.forEach((ut) => {
      const utName = ut.innerText;
      const items = ut.nextElementSibling?.children || [];

      pdf.setFontSize(12);
      pdf.setFont(FONT, "normal");

      if (y > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }

      pdf.text(utName, margin + 2, y);
      y += 6;

      pdf.setFontSize(11);
      pdf.setFont(FONT, "normal");

      Array.from(items).forEach((item) => {
        const lines = pdf.splitTextToSize(
          "• " + item.innerText,
          pageWidth - 2 * margin,
        );

        if (y + lines.length * 5 > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }

        pdf.text(lines, margin + 4, y);
        y += lines.length * 5 + 2;
      });

      y += 4;
    });

    y += 6;
  });

  /* ---------- FILE NAME ---------- */

  const today = new Date();
  const dateStr = today
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
    .replace(" ", "");

  const fileName = `${selectedClassUT}_${selectedSubjectUT}_${selectedUT}_${dateStr}.pdf`;

  pdf.save(fileName);
}

function downloadSyllabus() {
  const element = document.getElementById("viewSyllabusBody");

  //  ADD PDF MODE
  element.classList.add("pdf-mode");

  const selectedClassUT =
    document.getElementById("classSelectUT")?.value || "Class";
  const selectedSubjectUT =
    document.getElementById("subjectSelect")?.value || "Subject";
  const selectedUT = document.getElementById("utSelect")?.value || "All";

  const today = new Date();
  const dateStr = today
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
    .replace(" ", "");

  const fileName = `${selectedClassUT}_${selectedSubjectUT}_${selectedUT}_${dateStr}.pdf`;

  const opt = {
    margin: [8, 8, 8, 8],
    filename: fileName,
    image: { type: "jpeg", quality: 1 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      scrollY: 0,
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    },
    pagebreak: {
      mode: ["css", "legacy"],
    },
  };

  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      element.classList.remove("pdf-mode");
    });
}

// Back button function
function goBackToSelection() {
  const chapterContainer = document.getElementById("chapterContainer");

  if (chapterContainer) chapterContainer.style.display = "none";
}

function resetSyllabusForm() {
  ["classSelectUT", "subjectSelect", "utSelect"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
}

async function proceedToMainScreen(type) {
  debugger;
  let pwd = "";
  mode = type;
  if (type === "edit") {
    pwd = loginData?.password;
  } else {
  }

  const title = document.getElementById("syllabusTitle");

  if (mode === "view") {
    title.textContent = "View Exam Syllabus";
    loadClassList(); //for view mode
    openSyllabusPopup();
  } else {
    if (pwd?.length < 6) {
      return SHOW_ERROR_POPUP("Please enter password or correct password");
    }
    const response = await CALL_API_READ("CHECK_PASSWORD", {
      password: pwd,
      roleName: "UT Syllabus App Role",
    });

    if (response?.status) {
      title.textContent = "Edit Exam Syllabus";
      isEditMode = true;
      apiClassSubjectMap = response?.data?.classes || {};
      if (response?.data?.role["UT Syllabus App Role"] === "Admin") {
        isAbleToEditAnnual = true;
      }

      loadClassListFromApi(); // for edit mode
      openSyllabusPopup();
    } else {
      SHOW_ERROR_POPUP("Wrong password");
    }
  }
}

function permissionChanged() {
  const selected = document.querySelector(
    'input[name="permission"]:checked',
  ).value;

  const passwordBox = document.getElementById("passwordBox");

  if (selected === "edit") {
    passwordBox.style.display = "block";
  } else {
    passwordBox.style.display = "none";
  }
}

function resetSelections() {
  document.getElementById("classSelectUT").selectedIndex = 0;
  document.getElementById("subjectSelect").selectedIndex = 0;
  document.getElementById("utSelect").selectedIndex = 0;
  //document.getElementById("radioView").checked = true;
  //document.getElementById("passwordBox").style.display = "none";
  //document.getElementById("editPassword").value = "";
  const utSelect = document.getElementById("utSelect");
  utSelect.disabled = false;
  isEditMode = false;
}

function backToEditViewSyllabus() {
  resetSyllabusForm();
  SHOW_SPECIFIC_DIV("viewSyllabusPopup");
}

let isEditMode = false;
let isAbleToEditAnnual = false;
let finalResult = {};
let chapters = [];
let originalMapping = {};

/* ---------------- MODE ---------------- */

function isHighUT(ut) {
  return ["Unit Test 4", "Unit Test 5", "Unit Test 6"].includes(ut);
}

function updateAnnualHeaderState() {
  const allAnnual = chapters.map(
    (_, i) => document.getElementById(`annual-${i}`)?.checked,
  );

  const headerChk = document.getElementById("annual-select-all");

  if (!headerChk) return;

  const allChecked = allAnnual.every(Boolean);
  const noneChecked = allAnnual.every((v) => !v);

  headerChk.checked = allChecked;

  // Optional: indeterminate state
  headerChk.indeterminate = !allChecked && !noneChecked;
}

function backToMainPopup() {
  SHOW_SPECIFIC_DIV("menuPopup");
  resetSelections();
}

function openSyllabusPopup() {
  SHOW_SPECIFIC_DIV("viewSyllabusPopup");
}

function loadClassListFromApi() {
  const classSelectUT = document.getElementById("classSelectUT");
  classSelectUT.innerHTML = `<option value="">Select Class</option>`;

  const classList = Object.keys(apiClassSubjectMap);

  classList.forEach((cls) => {
    classSelectUT.innerHTML += `<option value="${cls}">${cls}</option>`;
  });
}

/* ---------------- BULK APPLY ---------------- */

function applyBulk() {
  let val = document.getElementById("masterSelect").value;
  if (!val) return;

  chapters.forEach((c, i) => {
    let chk = document.getElementById(`multi-${i}`);

    if (chk.checked) {
      let sel = document.getElementById(`sel-${i}`);
      let annualChk = document.getElementById(`annual-${i}`);

      //  set UT
      sel.value = val;

      // apply SAME logic
      if (isLowerClassAndHighUT(val)) {
        if (annualChk) annualChk.checked = true;
      } else if (isLowerClass(selectedClassUT)) {
        if (annualChk) annualChk.checked = false;
      }

      updateRowColor(i);

      // uncheck multi after apply
      chk.checked = false;
    }
  });

  //  important: header sync
  updateAnnualHeaderState();
  saveState();
  refreshMapping();

  document.getElementById("masterSelect").value = "";
}

/* ---------------- RESET ---------------- */

function resetUT() {
  let ut = document.getElementById("resetSelect").value;

  chapters.forEach((c, i) => {
    let sel = document.getElementById(`sel-${i}`);
    if (sel.value === ut) {
      sel.value = "";
      let row = document.getElementById("row-" + i);
      row.classList.remove("ut1", "ut2", "ut3", "ut4", "ut5", "ut6", "locked");
      document.getElementById(`multi-${i}`).disabled = false;
    }
  });

  saveState();
  refreshMapping();

  document.getElementById("resetSelect").value = "";
}

/* ---------------- COLORS ---------------- */

function updateRowColor(idx) {
  const row = document.getElementById("row-" + idx);
  const val = document.getElementById(`sel-${idx}`).value;

  row.classList.remove("ut1", "ut2", "ut3", "ut4", "ut5", "ut6");

  if (val === "Unit Test 1") row.classList.add("ut1");
  if (val === "Unit Test 2") row.classList.add("ut2");
  if (val === "Unit Test 3") row.classList.add("ut3");
  if (val === "Unit Test 4") row.classList.add("ut4");
  if (val === "Unit Test 5") row.classList.add("ut5");
  if (val === "Unit Test 6") row.classList.add("ut6");
}

/* ---------------- LIVE MAPPING ---------------- */

function refreshMapping() {
  let result = {
    "Unit Test 1": [],
    "Unit Test 2": [],
    "Unit Test 3": [],
    "Half Yearly": [],
    "Unit Test 4": [],
    "Unit Test 5": [],
    "Unit Test 6": [],
    Annual: [],
  };

  /* -------- COLLECT DATA -------- */

  chapters.forEach((c, i) => {
    let test = document.getElementById(`sel-${i}`).value;
    let annual = document.getElementById(`annual-${i}`).checked;

    if (test) result[test].push(c);

    if (annual) result["Annual"].push(c);

    // Half yearly logic
    if (
      test === "Unit Test 1" ||
      test === "Unit Test 2" ||
      test === "Unit Test 3"
    ) {
      result["Half Yearly"].push(c);
    }
  });

  /* -------- FINAL RESULT -------- */

  finalResult = {
    className: document.getElementById("classSelectUT")?.value || "",
    subject: document.getElementById("subjectSelect")?.value || "",
    mapping: result,
  };

  /* -------- ALWAYS SHOW ALL UT -------- */

  let html = "";

  Object.keys(result).forEach((k) => {
    html += `<h4>${k}</h4>`;

    if (result[k].length) {
      html += "<ul>";
      result[k].forEach((v) => {
        html += `<li>${v}</li>`;
      });
      html += "</ul>";
    } else {
      // 👇 empty UT still visible
      html += `<ul><li class="empty"> — No Chapters — </li></ul>`;
    }
  });

  document.getElementById("output").innerHTML = html;
}
/* ---------------- STATE ---------------- */

function saveState() {
  let state = [];
  chapters.forEach((c, i) => {
    state.push({
      test: document.getElementById(`sel-${i}`).value,
      annual: document.getElementById(`annual-${i}`).checked,
    });
  });
  localStorage.setItem("syllabus_state", JSON.stringify(state));
}

function loadState() {
  let state = JSON.parse(localStorage.getItem("syllabus_state") || "[]");

  state.forEach((s, i) => {
    if (!s) return;

    document.getElementById(`sel-${i}`).value = s.test;
    document.getElementById(`annual-${i}`).checked = s.annual;

    updateRowColor(i);

    if (s.test) {
      document.getElementById(`multi-${i}`).disabled = true;
      document.getElementById(`row-${i}`).classList.add("locked");
    }
  });

  refreshMapping();
}

function renderEditMapping(mappingData) {
  /* ===== NORMALIZE STRUCTURE ===== */
  let flatData = [];

  mappingData.forEach((sub) => {
    if (sub.utList) {
      sub.utList.forEach((utItem) => {
        flatData.push({
          ut: utItem.utName,
          chapters: utItem.chapters,
        });
      });
    } else {
      flatData.push(sub);
    }
  });

  mappingData = flatData;
  originalMapping = JSON.parse(JSON.stringify(mappingData));

  const chapterList = document.getElementById("chapterList");
  chapterList.innerHTML = "";

  /* ===== HEADER ===== */
  const header = document.createElement("div");
  header.className = "row header-row";

  header.innerHTML = `
      <div class="multiHeader">Select</div>
      <div class="chapterHeader">Ch Name</div>
      <div class="testHeader">Change UT</div>
      <div class="annualHeader">Annual
       <input type="checkbox" id="annual-select-all" 
      ${!isAbleToEditAnnual ? "disabled" : ""}>
      </div>
  `;

  chapterList.appendChild(header);

  /* ADD: Header checkbox event */
  const annualSelectAll = document.getElementById("annual-select-all");

  if (annualSelectAll) {
    annualSelectAll.addEventListener("change", function () {
      const isChecked = this.checked;

      chapters.forEach((_, i) => {
        const annualChk = document.getElementById(`annual-${i}`);
        if (annualChk && !annualChk.disabled) {
          annualChk.checked = isChecked;
        }
      });

      saveState();
      refreshMapping();
    });
  }

  /* =============================== */

  const uniqueChapters = masterList;
  chapters = uniqueChapters;

  let counter = 0;

  uniqueChapters.forEach((ch) => {
    const idx = counter;

    const row = document.createElement("div");
    row.className = "row";
    row.id = "row-" + idx;

    row.innerHTML = `
      <div class="multi">
        <input type="checkbox" id="multi-${idx}">
      </div>

      <div class="chapter">${ch}</div>

      <div class="test">
        <select id="sel-${idx}">
          <option value="">Select</option>
          <option>Unit Test 1</option>
          <option>Unit Test 2</option>
          <option>Unit Test 3</option>
          <option>Unit Test 4</option>
          <option>Unit Test 5</option>
          <option>Unit Test 6</option>
        </select>
      </div>

      <div class="annual">
        <input type="checkbox"
          id="annual-${idx}"
          ${!isAbleToEditAnnual ? "disabled" : ""}>
      </div>
    `;

    chapterList.appendChild(row);

    /* ---------- PRESELECT ---------- */

    mappingData.forEach((item) => {
      if (item.ut && item.chapters.includes(ch)) {
        if (item.ut.startsWith("Unit Test")) {
          document.getElementById(`sel-${idx}`).value = item.ut;
          updateRowColor(idx);
        }

        if (item.ut === "Annual") {
          document.getElementById(`annual-${idx}`).checked = true;
        }
      }
    });

    /* ---------- EVENTS ---------- */

    document.getElementById(`sel-${idx}`).addEventListener("change", () => {
      const chk = document.getElementById(`multi-${idx}`);
      if (chk) chk.checked = false;

      const selectedUT = document.getElementById(`sel-${idx}`).value;
      const annualChk = document.getElementById(`annual-${idx}`);

      // clean usage (no global)
      if (isLowerClassAndHighUT(selectedUT)) {
        if (annualChk) annualChk.checked = true;
      } else if (isLowerClass(selectedClassUT)) {
        if (annualChk) annualChk.checked = false;
      }

      updateRowColor(idx);
      updateAnnualHeaderState();
      saveState();
      refreshMapping();
    });

    document.getElementById(`annual-${idx}`).addEventListener("change", () => {
      updateAnnualHeaderState(); //  already added
      saveState();
      refreshMapping();
    });

    /* row click toggle */
    row.addEventListener("click", function (e) {
      if (e.target.tagName === "SELECT" || e.target.type === "checkbox") return;

      const chk = this.querySelector('.multi input[type="checkbox"]');

      if (chk) {
        chk.checked = !chk.checked;
      }
    });

    counter++;
  });

  updateAnnualHeaderState();

  refreshMapping();
}

function isLowerClassAndHighUT(selectedUT) {
  return (
    isLowerClass(selectedClassUT) &&
    ["Unit Test 4", "Unit Test 5", "Unit Test 6"].includes(selectedUT)
  );
}

function getChangedMapping(originalArray, updatedObject) {
  // convert original array → object
  const originalObject = {};
  originalArray.forEach((item) => {
    originalObject[item.ut] = item.chapters || [];
  });

  let changed = {}; // IMPORTANT change

  Object.keys(updatedObject).forEach((ut) => {
    const oldChapters = originalObject[ut] || [];
    const newChapters = updatedObject[ut] || [];

    const oldSet = new Set(oldChapters);
    const newSet = new Set(newChapters);

    const isDifferent =
      oldSet.size !== newSet.size || [...newSet].some((ch) => !oldSet.has(ch));

    if (isDifferent) {
      changed[ut] = newChapters; // object assignment
    }
  });

  return changed;
}

function validateMapping(mapping) {
  let assignedChapters = new Set();

  for (const ut in mapping) {
    const chaptersArr = mapping[ut];

    if (
      ut !== "Annual" &&
      Array.isArray(chaptersArr) &&
      chaptersArr.length === 0
    ) {
      SHOW_ERROR_POPUP(`${ut} is empty. Please assign chapters before saving.`);
      return false;
    }

    if (Array.isArray(chaptersArr)) {
      chaptersArr.forEach((ch) => assignedChapters.add(ch));
    }
  }

  // 🔥 Total original chapters
  const totalChapters = chapters.length;

  if (assignedChapters.size !== totalChapters) {
    SHOW_ERROR_POPUP("Please assign all chapters first before submitting.");
    return false;
  }

  return true;
}

async function SAVE_SYLLABUS_MAPPING() {
  if (!validateMapping(finalResult.mapping)) {
    return;
  }
  const payload = {
    className: finalResult.className,
    subject: finalResult.subject,
    mapping: finalResult.mapping,
  };

  const result = await CALL_API("SAVE_SYLLABUS_MAPPING", payload);
  if (result?.data?.status) {
    SHOW_SUCCESS_POPUP("Syllabus mapping saved successfully!");
    backToEditViewSyllabus();
  } else {
    SHOW_ERROR_POPUP("Failed to save syllabus mapping. Please try again.");
  }
}
