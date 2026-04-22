let selectedStudent = "";
let hostlerChecklistState = {};
let rowItems = [];
const hostlerRequiredDocuments = [
  // Clothing
  {
    label: "Kurta-Pajama with Waistcoat (for special events)",
    category: "Clothing",
    classes: "",
  },
  {
    label: "White Dhoti-Kurta (2 sets)",
    category: "Clothing",
    classes: "",
  },
  {
    label: "Undergarments (6 sets)",
    category: "Clothing",
    classes: "",
  },
  {
    label: "Lower & T-Shirts (6 sets - Gurukul + other colors)",
    category: "Clothing",
    classes: "",
  },
  {
    label: "School Uniform (5 sets)",
    category: "Clothing",
    classes: "",
  },
  {
    label: "Warmers (2 sets)",
    category: "Clothing",
    classes: "",
  },
  {
    label: "Woolen Socks (8 pairs)",
    category: "Clothing",
    classes: "",
  },

  // Footwear
  { label: "Formal Sandals", category: "Footwear", classes: "" },
  { label: "Sports Shoes", category: "Footwear", classes: "" },
  { label: "Hawai Chappal", category: "Footwear", classes: "" },
  { label: "Extra Crocs", category: "Footwear", classes: "" },

  // Personal
  {
    label: "Pillow",
    category: "Personal",
    classes: "",
  },
  { label: "Water Bottles (2)", category: "Personal", classes: "" },
  {
    label: "Extra Spectacles (if applicable)",
    category: "Personal",
    classes: "",
  },

  // Toiletries
  {
    label:
      "Bathroom Kit (Comb, Oil, Cream, Toothbrush x3, Paste, Nail Cutter, Soap, Mirror, Tilak, Washing Soap)",
    category: "Toiletries",
    classes: "",
  },

  // Misc
  { label: "Gamchha (4)", category: "Misc", classes: "" },
  { label: "Kartal", category: "Misc", classes: "I, II, III, IV, V" },
  {
    label: "Mridanga (for boys)",
    category: "Misc",
    classes: "VI, VII, VIII, IX, X",
  },
  { label: "Swimming Costume", category: "Misc", classes: "" },

  // Bags
  { label: "Big Bag (Yatra)", category: "Bags", classes: "" },
  { label: "Small Bag (Yatra)", category: "Bags", classes: "" },
  { label: "Dholak Bag", category: "Bags", classes: "" },
];

const requiredDocuments = [
  {
    label: "Father's Aadhar (2 Copies)",
    classes: "",
  },
  {
    label: "Mother's Aadhar (2 Copies)",
    classes: "",
  },
  {
    label: "Student's Aadhar (2 Copies)",
    classes: "",
  },
  {
    label: "Father's Photo (6 Copies)",
    classes: "",
  },
  {
    label: "Mother's Photo (6 Copies)",
    classes: "",
  },
  {
    label: "Student's Photo (6 Copies)",
    classes: "",
  },

  {
    label: "Original Student TC (Last School)",
    classes: "I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII",
  },
  {
    label:
      "Parent Consent Form for Day Scholar Leaving School Without Guardian",
    classes: "",
  },
  {
    label: "Parent Consent for Hostel Stay",
    classes: "",
  },
];

let currentlyOpenStudent = null;
let studentMap = {};
let studentRowDataResponse = [];

function isPaymentPending(s) {
  return s.items.some(
    (i) => (i.formStatus || "").toLowerCase() === "submitted",
  );
}
function toggleStudent(key) {
  // If clicking same studentName → allow close
  if (currentlyOpenStudent === key) {
    studentMap[key].open = false;
    currentlyOpenStudent = null;
    renderStudents();
    return;
  }

  // If another studentName already open
  if (currentlyOpenStudent !== null && currentlyOpenStudent !== key) {
    SHOW_ERROR_POPUP("Kindly close the active student profile first.");
    return;
  }

  // Otherwise open new one
  studentMap[key].open = true;
  currentlyOpenStudent = key;

  renderStudents();
  handleSelectionChange(key);
}

function renderStudents() {
  const q = document.getElementById("studentSearch").value.toLowerCase();
  const container = document.getElementById("studentContainer");

  container.innerHTML = "";

  const pendingStudents = [];
  const completedStudents = [];
  debugger;
  Object.keys(studentMap)
    .filter((k) => studentMap[k].studentName.toLowerCase().includes(q))
    .forEach((key) => {
      const s = studentMap[key];

      if (isStudentFullyDelivered(s)) {
        completedStudents.push({ key, s });
      } else {
        pendingStudents.push({ key, s });
      }
    });

  const orderedStudents = [...pendingStudents, ...completedStudents];

  orderedStudents.forEach(({ key, s }) => {
    const deliveredClass = isStudentFullyDelivered(s)
      ? "student-delivered"
      : "";

    // 🔥 NEW
    const isSubmitted = isPaymentPending(s);

    container.innerHTML += `
      <div class="student-card ${s.open ? "open" : ""} ${deliveredClass} ${isSubmitted ? "student-disabled" : ""}">

        <div class="student-header"
             onclick="${isSubmitted ? "" : `toggleStudent('${key}')`}">

          <div class="student-body">
            <div class="student-name">
              ${s.studentName}
            </div>
            <small>${s.className} (${CLASS_MAP[s.className]})</small>
            <small class="admin-card-badge ${s.adminCardType}">
              ${s.adminCardType} Card Applicable
            </small>
            ${
              isSubmitted
                ? `<span class="status-tag pending">Payment Pending</span>`
                : ""
            }

          </div>

          <div class="student-total">
            ₹${s.grandTotal}
          </div>

        </div>

        ${!isSubmitted && s.open ? renderStudentBody(key, s) : ""}

      </div>
    `;
  });
}

function renderStudentBody(key, studentName) {
  const categoryMap = {};

  studentName.items.forEach((i) => {
    if (!categoryMap[i.category]) categoryMap[i.category] = [];
    categoryMap[i.category].push(i);
  });

  let html = `<div class="student-body">`;

  Object.keys(categoryMap).forEach((cat) => {
    html += `<div class="category-title">${cat}</div>`;

    categoryMap[cat].forEach((item) => {
      const orderedQty = Number(item.qty || 0);
      const deliveredQty = Number(item.deliveredQty || 0);
      const pendingQty = Math.max(0, orderedQty - deliveredQty);
      const isRequestedDelivered = deliveredQty >= orderedQty;

      let statusTag = "";

      if (pendingQty === 0) {
        statusTag = `<span class="delivery-tag delivered">Delivered</span>`;
      } else if (deliveredQty > 0) {
        statusTag = `<span class="delivery-tag partial">Partial (${pendingQty} pending)</span>`;
      } else {
        statusTag = `<span class="delivery-tag pending">Pending</span>`;
      }

      html += `
      <div class="delivery-row">

        <div class="delivery-left">
         <div class="item-title" data-item="${item.item}">
            ${item.item}
            ${statusTag}
        </div>

          <small>
            Ordered: ${orderedQty} |
            Delivered: ${deliveredQty} |
            Pending: ${pendingQty}
          </small>
        </div>

        <div class="qty-controls">

          <button class="qty-btn minus-btn" disabled
            onclick="updateTeacherQty('${key}','${item.item}',-1)">
            −
          </button>

          <span class="qty-val"
            data-ordered="${pendingQty}"   
            data-qty="${pendingQty}">
            ${pendingQty}
          </span>

          <button class="qty-btn plus-btn" disabled
            onclick="updateTeacherQty('${key}','${item.item}',1)">
            +
          </button>

        </div>

        <input type="checkbox"
          class="delivery-checkbox"
          data-price="${item.price}"
          data-pending="${pendingQty}"
          ${isRequestedDelivered ? "checked disabled" : ""}
          onchange="handleSelectionChange('${key}')">

      </div>
      `;
    });
  });

  html += `
  <div class="selection-summary" id="summary-${key}" style="display:none">
    Selected Total: ₹0
  </div>
  `;

  html += `
  <button class="orange"
    onclick="proceedStudent('${key}')">
    Proceed Delivery
  </button>
  `;

  html += `</div>`;

  return html;
}

function updateTeacherQty(studentKey, itemName, delta) {
  const container = document.querySelector(".student-card.open");
  if (!container) return;

  const rows = container.querySelectorAll(".delivery-row");

  rows.forEach((row) => {
    let title = row.querySelector(".item-title")?.innerText.trim();

    title = title.replace(/\s+/g, " ").trim();
    itemName = itemName.replace(/\s+/g, " ").trim();

    if (!title || !title.startsWith(itemName)) return;

    const checkbox = row.querySelector(".delivery-checkbox");
    if (!checkbox.checked) return;

    const qtyEl = row.querySelector(".qty-val");
    const minusBtn = row.querySelector(".minus-btn");
    const plusBtn = row.querySelector(".plus-btn");

    const ordered = Number(qtyEl.dataset.ordered); //  NEW
    const currentQty = Number(qtyEl.dataset.qty || qtyEl.textContent);

    const newQty = Math.max(0, Math.min(ordered, currentQty + delta)); //  UPDATED

    qtyEl.dataset.qty = newQty;
    qtyEl.textContent = newQty;

    if (minusBtn) minusBtn.disabled = newQty <= 0;
    if (plusBtn) plusBtn.disabled = newQty >= ordered; //  UPDATED
  });

  handleSelectionChange(studentKey);
}

function handleSelectionChange(studentKey) {
  const container = document.querySelector(".student-card.open");
  if (!container) return;

  const rows = container.querySelectorAll(".delivery-row");

  let total = 0;

  rows.forEach((row) => {
    const cb = row.querySelector(".delivery-checkbox");
    if (!cb) return;

    const minusBtn = row.querySelector(".minus-btn");
    const plusBtn = row.querySelector(".plus-btn");
    const qtyEl = row.querySelector(".qty-val");

    const itemName = row.querySelector(".item-title").dataset.item;

    const mapItem = studentMap[studentKey].items.find(
      (i) => i.item === itemName,
    );

    const ordered = Number(qtyEl.dataset.ordered || 0); // ✅ UPDATED
    let qty = Number(qtyEl.dataset.qty || 0);
    const pending = Number(cb.dataset.pending || 0);

    // 🚫 Lock row if already delivered
    if (mapItem?.deliveryStatus === "delivered") {
      if (minusBtn) minusBtn.disabled = true;
      if (plusBtn) plusBtn.disabled = true;
      cb.checked = true;
      cb.disabled = true;
      return;
    }

    if (cb.checked) {
      // initialize qty from pending if empty
      if (!qtyEl.dataset.qty) {
        qty = pending;
        qtyEl.dataset.qty = pending;
        qtyEl.textContent = pending;
      }

      qty = Number(qtyEl.dataset.qty);

      if (minusBtn) minusBtn.disabled = qty <= 0;
      if (plusBtn) plusBtn.disabled = qty >= ordered; // ✅ UPDATED

      const price = Number(cb.dataset.price || 0);
      total += price * qty;
    } else {
      // reset when unchecked
      if (minusBtn) minusBtn.disabled = true;
      if (plusBtn) plusBtn.disabled = true;

      qtyEl.dataset.qty = pending;
      qtyEl.textContent = pending;
    }
  });

  const summary = document.getElementById(`summary-${studentKey}`);

  if (summary) {
    summary.innerHTML = `Selected Total: <strong>₹${total}</strong>`;
  }
}

function toggleDelivery(studentKey, itemName, checked) {
  const studentName = studentMap[studentKey];

  studentName.items.forEach((i) => {
    if (i.item === itemName) {
      i.deliveryStatus = checked ? "delivered" : "pending";
    }
  });

  console.log("UPDATED:", studentName);
}

function isStudentFullyDelivered(studentName) {
  return studentName.items.every((item) => item.deliveryStatus === "delivered");
}

function transformSheetData(values) {
  if (!values || values.length <= 1) return [];

  const headers = values[0];

  const toCamelCase = (str) =>
    str.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase());

  // convert headers to camelCase
  const keys = headers.map((h) => toCamelCase(h));

  const result = values.slice(1).map((row, index) => {
    const obj = {};

    keys.forEach((key, i) => {
      obj[key] = row[i] !== undefined ? String(row[i]) : "";
    });

    obj.rowIndex = index + 2;
    return obj;
  });

  return result;
}

async function retrieveStudentSubmissions() {
  const response = await CALL_API("RETRIEVE_STUDENT_SUBMISSIONS", {});
  if (response.status) {
    const modifiedData = transformSheetData(response?.response || []);
    studentRowDataResponse = modifiedData;
    SHOW_SPECIFIC_DIV("yearlyAdmissionKitPopup");
  } else {
    SHOW_ERROR_POPUP("Failed to retrieve student submissions.");
  }

  studentRowDataResponse.forEach((r) => {
    if (!studentMap[r.studentName]) {
      studentMap[r.studentName] = {
        studentName: r.studentName,
        studentNameDisplay: r.studentNameDisplay,
        className: r.className,
        hostler: r.hostler,
        adminCardType: r.adminCardType,
        admissionYear: r.admissionYear,
        grandTotal: r.grandTotal,
        open: false,
        items: [],
      };
    }
    studentMap[r.studentName].items.push({ ...r });
  });

  console.log("STUDENT MAP:", studentMap);
  renderStudents();
}

function updateStudentMapAfterSave(payload) {
  debugger;
  const { studentKey, deliveryItems } = payload;

  const student = studentMap[studentKey];
  if (!student) return;

  deliveryItems.forEach((dItem) => {
    const item = student.items.find((i) => i.rowIndex == dItem.rowIndex);

    if (item) {
      item.deliveredQty =
        Number(item.deliveredQty || 0) + Number(dItem.deliveredNow || 0);

      // ✅ update status based on qty
      if (item.deliveredQty >= Number(item.qty || 0)) {
        item.deliveryStatus = "delivered";
      } else if (item.deliveredQty > 0) {
        item.deliveryStatus = "partial";
      } else {
        item.deliveryStatus = "pending";
      }
    }
  });
}

async function proceedStudent(studentKey) {
  const container = document.querySelector(".student-card.open");
  if (!container) return;

  const selectedCheckboxes = container.querySelectorAll(
    ".delivery-checkbox:checked:not(:disabled)",
  );

  const selectedItems = [];

  selectedCheckboxes.forEach((cb) => {
    const row = cb.closest(".delivery-row");

    const itemName = row.querySelector(".item-title").dataset.item;
    const qtyEl = row.querySelector(".qty-val");

    const deliveredNow = Number(qtyEl.dataset.qty || 0);
    if (deliveredNow <= 0) return;
    rowItems = studentMap[studentKey].items;

    const mapItem = studentMap[studentKey].items.find(
      (i) => i.item === itemName,
    );
    selectedStudent = mapItem;

    if (!mapItem) return;

    const ordered = Number(mapItem.qty);
    const delivered = Number(mapItem.deliveredQty || 0);

    let newDelivered = delivered + deliveredNow;
    if (newDelivered > ordered) newDelivered = ordered;

    let status =
      newDelivered === 0
        ? "pending"
        : newDelivered < ordered
          ? "partial"
          : "delivered";

    selectedItems.push({
      item: itemName,
      rowIndex: mapItem.rowIndex,
      deliveredNow,
      deliveredQty: newDelivered,
      deliveryStatus: status,
    });
  });

  if (selectedItems.length === 0) {
    SHOW_ERROR_POPUP("Please select at least one item.");
    return;
  }

  // 👉 SAVE TEMP (important for next step)
  window.currentDeliverySelection = {
    studentKey,
    items: selectedItems,
  };

  // 👉 SHOW QUESTIONS UI ABOVE
  renderQuestions(studentKey);

  const questionDiv = document.getElementById("StdYearlyEntry");

  // scroll + highlight
  questionDiv.scrollIntoView({ behavior: "smooth" });
}

function shouldShowItem(item, applicationClass = "") {
  if (!item.classes || item.classes.trim() === "") return true;

  const allowedClasses = item.classes.split(",").map((c) => c.trim());
  return allowedClasses.includes(applicationClass);
}

function groupByCategory(data, applicationClass = "") {
  const grouped = {};

  data.forEach((item) => {
    if (!shouldShowItem(item, applicationClass)) return;

    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }

    grouped[item.category].push(item);
  });

  return grouped;
}
function getStudentPreviewHTML(studentKey, selectedItems, showButtons = true) {
  if (!selectedItems || selectedItems.length === 0) {
    return `<p>No items selected</p>`;
  }

  return `
    <div class="preview-card">
      ${showButtons ? `<h3>Preview (${studentKey})</h3>` : ""}

      ${selectedItems
        .map(
          (item) => `
        <div class="preview-row">
          <div class="item-name">${item.item}</div>
          <div class="item-change">+${item.deliveredNow}</div>
          <div class="item-total">Total: ${item.deliveredQty}</div>
          <div class="item-status ${item.deliveryStatus}">
            Deliver Now
          </div>
        </div>
      `,
        )
        .join("")}

      ${
        showButtons
          ? `
      <div class="button-row">
        <button class="lightOrange" onclick="closePreview()">Cancel</button>
        <button class="orange" onclick="confirmProceed()">Confirm</button>
      </div>`
          : ""
      }
    </div>
  `;
}

function toggleAllDocs(isChecked) {
  document.querySelectorAll('input[name="requriedCheckBox"]').forEach((cb) => {
    cb.checked = isChecked;
  });

  checkAllDocumentsAndQuestions();
}

function updateSelectAllHostlerState() {
  const all = document.querySelectorAll('input[name="hostlerCheckBox"]');
  const checked = document.querySelectorAll(
    'input[name="hostlerCheckBox"]:checked',
  );

  const selectAll = document.getElementById("selectAllHostler");
  if (selectAll) {
    selectAll.checked = all.length === checked.length;
  }
}

function toggleAllHostler(isChecked) {
  document.querySelectorAll('input[name="hostlerCheckBox"]').forEach((cb) => {
    cb.checked = isChecked;

    // trigger your existing handler
    handleHostlerChecklist(cb.dataset.label, isChecked);
  });
}

function renderQuestions(studentKey) {
  const container = document.getElementById("StdYearlyEntry");
  let html = `
  <div class="student-header">
    <h2>${studentKey}</h2>
  </div>
`;

  // =========================
  // ✅ SELECTED ITEMS (TOP)
  // =========================
  html += `
  <div class="entry-mapping-box" style="background:#fff3e0">
    <h4>Selected Items</h4>
    <div class="entry-output">
      ${getStudentPreviewHTML(
        studentKey,
        window.currentDeliverySelection?.items || [],
        false, // ❌ no buttons here
      )}
    </div>
  </div>
`;

  html += `</div></div>`;

  // =========================
  // ✅ REQUIRED DOCUMENTS
  // =========================
  html += `
  <div class="entry-mapping-box">
    <h4>Document Verification</h4>
    <div class="entry-output">
      <p class="entry-subtitle">Please confirm all documents are submitted</p>

      <!-- ✅ SELECT ALL (same flow) -->
      <label class="entry-checkbox-row entry-select-all">
        <input 
          type="checkbox" 
          id="selectAllDocs"
          onchange="toggleAllDocs(this.checked)"
        />
        <span>Select All Documents</span>
      </label>

      <ul class="entry-checkbox-list">
`;
  const isOrangeCard = rowItems?.some(
    (item) => item.adminCardType === "Orange",
  );
  const isHostler = selectedStudent?.hostler === "Y";

  requiredDocuments.forEach((doc) => {
    const isDayScholarConsent =
      doc.label ===
      "Parent Consent Form for Day Scholar Leaving School Without Guardian";

    const isHostelConsent = doc.label === "Parent Consent for Hostel Stay";

    //  Day Scholar Consent → only for NON-hostler + Orange card
    if (isDayScholarConsent && !(!isHostler && isOrangeCard)) {
      return;
    }

    //  Hostel Consent → only for hostler
    if (isHostelConsent && !isHostler) {
      return;
    }

    if (!shouldShowItem(doc, selectedStudent?.classNameDisplay)) return;

    html += `
    <li>
      <label class="entry-checkbox-row">
        <input 
          type="checkbox" 
          name="requriedCheckBox" 
          onchange="checkAllDocumentsAndQuestions(); updateSelectAllDocsState();" 
        />
        <span>${doc.label}</span>
      </label>
    </li>
  `;
  });

  html += `
      </ul>
    </div>
  </div>
`;

  // =========================
  // ✅ HOSTLER SECTION
  // =========================

  if (selectedStudent.hostler.toString().trim() === "Y") {
    html += `
    <div class="entry-mapping-box">
      <h4>Hostler Essentials</h4>
      <p class="entry-subtitle">
        Please ensure all the above items are arranged.
      </p>

      <div class="entry-output">

        <!-- ✅ SELECT ALL -->
        <label class="entry-checkbox-row entry-select-all">
          <input 
            type="checkbox" 
            id="selectAllHostler"
            onchange="toggleAllHostler(this.checked)"
          />
          <span>Select All Hostler Items</span>
        </label>
  `;

    const groupedData = groupByCategory(
      hostlerRequiredDocuments,
      CLASS_MAP[selectedStudent?.className],
    );

    Object.keys(groupedData).forEach((category) => {
      html += `<h4>${category}</h4><ul class="entry-checkbox-list">`;

      groupedData[category].forEach((item) => {
        html += `
        <li>
          <label class="entry-checkbox-row">
            <input 
              type="checkbox"
              name="hostlerCheckBox"
              data-label="${item.label}"
              onchange="handleHostlerChecklist('${item.label}', this.checked); updateSelectAllHostlerState();"
            />
            <span class="entry-checkbox-lbl">${item.label}</span>
          </label>
        </li>
      `;
      });

      html += `</ul>`;
    });

    html += `</div></div>`;
  }
  // =========================
  // ✅ BUTTONS (BACK + NEXT)
  // =========================
  html += `
    <div class="entry-btn-row">
      <button class="entry-back-btn" onclick="goBackToSelection()">
        Back
      </button>

      <button class="entry-next-btn" id="entryNextBtn" onclick="goToMainProcess()">
        Next
      </button>
    </div>
  `;

  // =========================
  // ✅ FINAL RENDER
  // =========================
  container.innerHTML = html;
  SHOW_SPECIFIC_DIV("studentPreviewContainerPopup");
}

function handleHostlerChecklist(item, isChecked) {
  hostlerChecklistState[item] = isChecked;

  checkAllDocumentsAndQuestions();
}

function updateSelectAllDocsState() {
  const all = document.querySelectorAll('input[name="requriedCheckBox"]');
  const checked = document.querySelectorAll(
    'input[name="requriedCheckBox"]:checked',
  );

  const selectAll = document.getElementById("selectAllDocs");
  if (selectAll) {
    selectAll.checked = all.length === checked.length;
  }
}

function goBackToSelection() {
  const qDiv = document.getElementById("StdYearlyEntry");
  const previewDiv = document.getElementById("studentPreviewContainer");

  if (qDiv) qDiv.innerHTML = "";
  if (previewDiv) previewDiv.innerHTML = "";

  SHOW_SPECIFIC_DIV("yearlyAdmissionKitPopup");
}

async function goToMainProcess() {
  const data = window.currentDeliverySelection;
  if (!data) {
    SHOW_ERROR_POPUP("No selection found");
    return;
  }

  const { studentKey, items } = data;

  // =========================
  // ✅ DELIVERY ITEMS
  // =========================
  const deliveryItems = items.map((i) => ({
    item: i.item,
    rowIndex: i.rowIndex,
    deliveredNow: i.deliveredNow,
    deliveredQty: i.deliveredQty,
    deliveryStatus: i.deliveryStatus,
  }));

  // =========================
  // ✅ REQUIRED DOCUMENTS
  // =========================
  const documentCheckboxes = document.querySelectorAll(
    'input[name="requriedCheckBox"]',
  );

  const documents = [];

  documentCheckboxes.forEach((cb, index) => {
    documents.push({
      label: requiredDocuments[index]?.label || `Doc ${index + 1}`,
      checked: cb.checked,
      status: cb.checked ? "done" : "pending",
    });
  });

  // =========================
  // ✅ HOSTLER CHECKLIST
  // =========================
  const hostlerCheckboxes = document.querySelectorAll(
    'input[name="hostlerCheckBox"]',
  );

  const hostlerItems = [];

  hostlerCheckboxes.forEach((cb) => {
    hostlerItems.push({
      label: cb.dataset.label,
      checked: cb.checked,
      status: cb.checked ? "done" : "pending",
    });
  });

  // =========================
  //  FINAL PAYLOAD
  // =========================
  const payload = {
    studentKey,
    deliveryItems,
    documents,
    hostlerItems,
    selectedTeacher,
  };

  const response = await CALL_API("PROCESS_STUDENT_ITEM_DELIVERY", payload);

  updateStudentMapAfterSave(payload);

  // close current student
  if (studentMap[studentKey]) {
    studentMap[studentKey].open = false;
  }

  currentlyOpenStudent = null;

  //clear selection (important)
  window.currentDeliverySelection = null;

  SHOW_SPECIFIC_DIV("yearlyAdmissionKitPopup");
  //re-render
  renderStudents();

  // popup last me
  SHOW_SUCCESS_POPUP("Record successfully processed!");
}

// Validation
function checkAllDocumentsAndQuestions() {
  const nextBtn = document.getElementById("entryNextBtn");
  if (!nextBtn) return;

  // ✅ Always enabled
  nextBtn.disabled = false;
}

function handleSearchInput() {
  const input = document.getElementById("studentSearch");
  const clearBtn = document.querySelector(".search-clear");
  clearBtn.style.display = input.value ? "block" : "none";

  renderStudents();
}

function clearSearch() {
  const input = document.getElementById("studentSearch");
  input.value = "";
  document.querySelector(".search-clear").style.display = "none";
  renderStudents();
}

function backFromYearlyAdmissionKit() {
  document.getElementById("passworTxtBox").value = "";

  // clear UI
  const container = document.getElementById("studentContainer");
  if (container) container.innerHTML = "";

  // reset globals
  studentMap = {};
  rowItems = [];
  studentRowDataResponse = [];
  currentlyOpenStudent = null;

  // optional UI reset
  const search = document.getElementById("studentSearch");
  if (search) search.value = "";

  SHOW_SPECIFIC_DIV("menuPopup");
}

function renderStudentPreview(studentKey, selectedItems) {
  const container = document.getElementById("studentPreviewContainer");

  if (!container) return;

  if (!selectedItems || selectedItems.length === 0) {
    container.innerHTML = "";
    return;
  }

  const html = `
    <div class="preview-card">
      <h3>Preview (${studentKey})</h3>

      ${selectedItems
        .map(
          (item) => `
        <div class="preview-row">
          <div class="item-name">${item.item}</div>
          <div class="item-change">+${item.deliveredNow}</div>
          <div class="item-total">Total: ${item.deliveredQty}</div>
          <div class="item-status ${item.deliveryStatus}">
            ${item.deliveryStatus}
          </div>
        </div>
      `,
        )
        .join("")}

      <div class="button-row">
        <button class="lightOrange" onclick="closePreview()">Cancel</button>
        <button class="orange" onclick="confirmProceed()">Confirm</button>
      </div>
    </div>
  `;

  container.innerHTML = html;
  SHOW_SPECIFIC_DIV("studentPreviewContainerPopup");
  // store globally for confirm
  window.__previewData = { studentKey, selectedItems };
}

async function confirmProceed() {
  const { studentKey, selectedItems } = window.__previewData;

  closePreview();

  const payload = {
    studentName: studentKey,
    items: selectedItems,
  };

  const response = await CALL_API("PROCESS_STUDENT_ITEM_DELIVERY", payload);

  if (!response.status) {
    SHOW_ERROR_POPUP("Delivery failed");
    return;
  }

  // same update logic (reuse your code)
  selectedItems.forEach((item) => {
    const mapItem = studentMap[studentKey].items.find(
      (i) => i.item === item.item,
    );

    if (!mapItem) return;

    mapItem.deliveredQty = item.deliveredQty;
    mapItem.deliveryStatus = item.deliveryStatus;

    const rowItem = studentRowDataResponse.find(
      (r) => r.studentName === studentKey && r.item === item.item,
    );

    if (rowItem) {
      rowItem.deliveredQty = item.deliveredQty;
      rowItem.deliveryStatus = item.deliveryStatus;
    }
  });

  studentMap[studentKey].open = false;
  currentlyOpenStudent = null;

  SHOW_SUCCESS_POPUP("Record successfully processed!");
  renderStudents();
}

function closePreview() {
  SHOW_SPECIFIC_DIV("yearlyAdmissionKitPopup");
}
