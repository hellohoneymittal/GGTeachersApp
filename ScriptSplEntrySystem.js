let splPendingStdEntryList = {};
let splSelectedStdEntry = [];
let splKeyFiltersDataStdEntry = {};
const CLASS_NAME_HINDI_MAP = {
  "Pre Nursery": "प्री नर्सरी",
  Nursery: "नर्सरी",
  KG: "केजी",
  UKG: "यूकेजी",
  I: "पहली",
  II: "दूसरी",
  III: "तीसरी",
  IV: "चौथी",
  V: "पाँचवीं",
  VI: "छठी",
  VII: "सातवीं",
  VIII: "आठवीं",
  IX: "नौवीं",
  X: "दसवीं",
  XI: "ग्यारहवीं",
  XII: "बारहवीं",
};

CREATE_MULTI_SELECT_DROPDOWN_WITH_CATEGORY_WITH_KEYFILTER({
  containerId: "splStdEntry-dynamic-dropdown-container",
  title: "Select",
  options: [],
  callback: () => {},
  controls: {},
  keyFilters: {},
});

function PROCESS_DAILY_ENTRY_DATA(specialEntryData, allStudentsData, roleData) {
  const today = new Date();
  const presentMap = new Map(); // s_key → original key
  const exitSet = new Set();

  function isSameDay(d1, d2) {
    return (
      d1 &&
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  // =============================
  // 1. PRESENT (FROM allStudentsData)
  // =============================
  Object.keys(allStudentsData).forEach((key) => {
    const obj = allStudentsData[key];

    const tKey = `s_${key}`;
    presentMap.set(tKey, key);
  });

  // =============================
  // 2. EXIT
  // =============================
  for (let i = 1; i < specialEntryData.length; i++) {
    const row = specialEntryData[i];
    const rowDate = PARSE_IST_DATE(row[0]);
    if (!isSameDay(rowDate, today)) continue;

    (row[2]?.split("\n") || []).forEach((s) => {
      const name = s.trim();
      if (name) exitSet.add(name); // must match s_key format
    });
  }

  // =============================
  // 3. PENDING
  // =============================
  const pending = Array.from(presentMap.keys()).filter(
    (student) => !exitSet.has(student),
  );

  // =============================
  // 4. FILTER + MAP
  // =============================
  const filteredWithObj = pending
    .map((student) => {
      const originalKey = presentMap.get(student);
      return {
        name: student, // s_key
        obj: allStudentsData[originalKey],
      };
    })
    .filter(({ obj }) => {
      if (!obj) return false;

      if (roleData === "Admin") return true;
      if (roleData === "H Admin") return obj.hostler === "Y";
      if (roleData === "NH Admin") return obj.hostler === "N";

      return false;
    });

  // =============================
  // 5. CATEGORY (Hindi Keys)
  // =============================
  const ALL_CLASS_NAME =
    "Pre Nursery, Nursery, KG, UKG, I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII";

  const categorized = {};

  ALL_CLASS_NAME.split(",").forEach((c) => {
    const cls = c.trim();
    const clsHindi = CLASS_NAME_HINDI_MAP[cls] || cls;

    categorized[clsHindi] = [];
  });

  // =============================
  // FINAL DATA PUSH
  // =============================
  filteredWithObj.forEach(({ name, obj }) => {
    const cls = obj.studentOrgClassName;
    if (!cls) return;

    const clsHindi = CLASS_NAME_HINDI_MAP[cls] || cls;
    if (!categorized[clsHindi]) return;

    const engName = name; // already s_key
    const hindiName = obj.studentHindiName || obj.studentName;
    const modifiedHindiName = `s_${hindiName}`;

    categorized[clsHindi].push({
      value: modifiedHindiName,
      englishValue: engName,
      class: cls,
      enableTime: obj.lastClassTime || "",
      tutionTeacher: obj.tutionTeacher || "",
    });
  });

  // =============================
  // REMOVE EMPTY CLASSES
  // =============================
  Object.keys(categorized).forEach((cls) => {
    if (!categorized[cls].length) delete categorized[cls];
  });

  console.log("categorized defined ", categorized);
  return categorized;
}

function splPopulateMultiSelectDropdownEntry() {
  document.getElementById("specialEntryDuration").value = "";
  UPDATE_MULTI_SELECT_DROPDOWN_WITH_CATEGORY_WITH_KEYFILTER(
    "splStdEntry-dynamic-dropdown-container",
    splPendingStdEntryList,
    (data) => {
      console.log(data);
      splSelectedStdEntry = data.map((item) =>
        typeof item === "object" ? item.englishValue : item,
      );
    },
    {
      showSelectAll: false,
      showFilters: true,
      showCategoryView: false,
    },
    {},
  );
}

async function splStudentEntryBtnClick() {
  const output = await CALL_API("GET_STD_ENTRY_RAW_DATA", {});
  const role = loginData?.role?.["Special Student Entry Role"];

  splPendingStdEntryList = PROCESS_DAILY_ENTRY_DATA(
    output?.response?.specialEntryData,
    output?.response?.allStudentsData,
    role,
  );

  splPopulateMultiSelectDropdownEntry();
  SHOW_SPECIFIC_DIV("splStdEntryPopup");
  SET_DIV_TITLE("splStdEntryPopup", "Special Entry System");
}

async function splStdEntrySubClick() {
  try {
    /* textbox entries bhi add karo */
    const manualInputs = document.querySelectorAll(".manual-student-input");

    manualInputs.forEach((input) => {
      let val = input.value.trim();

      if (val === "") return; // blank skip
      if (val.length < 3) return; // min 3 chars
      val = `s_${val}`;
      if (!splSelectedStdEntry.includes(val)) {
        splSelectedStdEntry.push(val);
      }
    });

    if (!splSelectedStdEntry.length) {
      SHOW_ERROR_POPUP("Please select students");
      return;
    }

    const studentListStrEntry = splSelectedStdEntry.join("\n");

    const teacherName = selectedTeacher || "";

    // Reason textarea value
    const reason =
      document.getElementById("specialEntryReason")?.value.trim() || "";

    if (!reason || reason.length < 20) {
      SHOW_ERROR_POPUP("Please enter a reason with at least 20 characters.");
      return;
    }

    const duration =
      document.getElementById("specialEntryDuration").value || "";

    if (!duration) {
      SHOW_ERROR_POPUP("Please select duration.");
      return;
    }
    const payload = {
      studentList: studentListStrEntry,
      teacherName: teacherName,
      reason: reason,
      duration: duration,
    };

    console.log("Sending:", payload);

    const res = await CALL_API("SAVE_SPECIAL_ENTRY", payload);

    if (res?.status) {
      resetSplEntryForm();
      SHOW_SUCCESS_POPUP("Saved successfully ✅");
    } else {
      SHOW_ERROR_POPUP("Error saving data ❌");
    }
  } catch (err) {
    console.error(err);
    SHOW_ERROR_POPUP("Something went wrong");
  }
}

function resetSplEntryForm() {
  splRemoveSelectedDataFromPendingEntry();
  splSelectedStdEntry = [];
  splPopulateMultiSelectDropdownEntry();
  document.getElementById("specialEntryReason").value = "";

  /* textbox reset -> sirf ek textbox */
  document.getElementById("multiStudentBox").innerHTML = `
        <div class="add-more-input-row">
          <input
            type="text"
            class="manual-student-input"
            placeholder="Enter Name"
          />
        </div>
      `;
}

function splRemoveSelectedDataFromPendingEntry() {
  // selected ka unique set banao (fast lookup)
  const selectedSet = new Set(
    splSelectedStdEntry.map((s) =>
      typeof s === "object" ? s.englishValue : s,
    ),
  );

  Object.keys(splPendingStdEntryList).forEach((cls) => {
    splPendingStdEntryList[cls] = splPendingStdEntryList[cls].filter(
      (student) => {
        const key =
          typeof student === "object" ? student.englishValue : student;

        return !selectedSet.has(key);
      },
    );

    if (splPendingStdEntryList[cls].length === 0) {
      delete splPendingStdEntryList[cls];
    }
  });
}

function splStdEntryBackBtnClick() {
  SHOW_SPECIFIC_DIV("menuPopup");
}

async function splStdEntryPopupRefClick() {
  await splStudentEntryBtnClick();
}

function SHOW_ADD_MORE_BOX() {
  document.getElementById("addMoreRow").style.display = "flex";
}

function ADD_MORE_ROW() {
  const box = document.getElementById("multiStudentBox");

  // all existing inputs check
  const allInputs = box.querySelectorAll(".manual-student-input");

  for (let i = 0; i < allInputs.length; i++) {
    const val = allInputs[i].value.trim();

    if (val === "") {
      alert(`Please entry name in ${i + 1} first.`);
      allInputs[i].focus();
      return;
    }
  }

  // if all filled then add new row
  const row = document.createElement("div");
  row.className = "add-more-input-row";

  row.innerHTML = `
    <input
      type="text"
      class="manual-student-input"
      placeholder="Enter Name"
    />
  `;

  box.appendChild(row);

  // focus new row
  row.querySelector(".manual-student-input").focus();
}

function ADD_ALL_MANUAL_STUDENTS() {
  const inputs = document.querySelectorAll(".manual-student-input");

  const container = document.getElementById(
    "splStdEntry-dynamic-dropdown-container",
  );

  inputs.forEach((input) => {
    const val = input.value.trim();

    if (val) {
      const row = document.createElement("div");

      row.innerHTML = `
        <label style="display:block;padding:8px 0;">
          <input type="checkbox" checked>
          ${val}
        </label>
      `;

      container.prepend(row);
    }
  });

  // reset again one row only
  document.getElementById("multiStudentBox").innerHTML = `
    <div class="add-more-input-row">
      <input
        type="text"
        class="manual-student-input"
        placeholder="Enter Student Name / ID"
      />
    </div>
  `;
}
