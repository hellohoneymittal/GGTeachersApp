let financeDataResponse = [];
let financeSelectedStd;
let filteredFinanceData = [];
let studentMapFinance = {};

/*****************************Yearly Admission Payment Methods*********************************************************/
document.addEventListener("input", function (e) {
  if (e.target.classList.contains("payment-input")) {
    const input = e.target;
    const max = Number(input.getAttribute("max"));

    if (Number(input.value) > max) {
      input.value = max; // auto fix
    }
  }
});
async function yearlyAdmissionFinanceClick() {
  const response = await CALL_API("RETRIEVE_STUDENT_SUBMISSIONS", {});

  if (response.status) {
    const modifiedData = transformSheetData(response?.response || []);

    //  RESET (IMPORTANT - warna duplicate items add honge)
    studentMapFinance = {};

    modifiedData.forEach((r) => {
      if (!studentMapFinance[r.studentName]) {
        studentMapFinance[r.studentName] = {
          studentName: r.studentName,
          studentNameDisplay: r.studentNameDisplay,
          className: r.className,
          classNameDisplay: r.classNameDisplay,
          grandTotal: parseFloat(r.grandTotal) || 0,
          amountRecd: 0, // 🔥 start from 0
          open: false,
          items: [],
        };
      }

      //  IMPORTANT: aggregate correct amount
      const existing = parseFloat(
        studentMapFinance[r.studentName].amountRecd || 0,
      );
      const rowAmount = parseFloat(r.amountRecd || 0);

      //  take correct value (since all rows same OR max safe)
      studentMapFinance[r.studentName].amountRecd = Math.max(
        existing,
        rowAmount,
      );

      // push item
      studentMapFinance[r.studentName].items.push({ ...r });
    });

    console.log("FINAL MAP:", studentMapFinance);

    SHOW_SPECIFIC_DIV("yearlyAdmissionKitFinancePopup");
    renderStudentsFinance();
  }
}

function renderStudentsFinance() {
  const q = document.getElementById("studentSearchFinance").value.toLowerCase();

  const container = document.getElementById("studentContainerFinance");

  // 🔥 object → array
  const students = Object.values(studentMapFinance);

  // 🔍 filter
  const filtered = students
    .filter((s) => {
      return s?.studentName?.toLowerCase()?.includes(q);
    })
    .sort((a, b) => {
      const pendingA =
        (parseFloat(a.grandTotal) || 0) - (parseFloat(a.amountRecd) || 0);

      const pendingB =
        (parseFloat(b.grandTotal) || 0) - (parseFloat(b.amountRecd) || 0);

      // 🔥 fully paid (pending <= 0) ko last me bhejo
      if (pendingA <= 0 && pendingB > 0) return 1;
      if (pendingA > 0 && pendingB <= 0) return -1;

      return 0;
    });

  function getPaymentStatusTag(s) {
    const total = parseFloat(s.grandTotal) || 0;
    const paid = parseFloat(s.amountRecd || 0);
    const pending = total - paid;

    console.log("DEBUG:", { total, paid, pending });
    if (pending <= 0)
      return `<span class="delivery-tag delivered">Received</span>`;
    if (paid === 0) return `<span class="delivery-tag pending">Pending</span>`;
    return `<span class="delivery-tag partial">Partially (Pending ₹${pending})</span>`;
  }

  let html = "";

  filtered.forEach((s) => {
    const total = parseFloat(s.grandTotal) || 0;
    const paid = parseFloat(s.amountRecd || 0);
    const pending = total - paid;

    const isDisabled = pending <= 0;

    //  Dynamic mainAmount निकालो items से
    const feeItem = s.items?.find(
      (item) =>
        item.item?.toLowerCase().includes("march") &&
        item.item?.toLowerCase().includes("april"),
    );

    const mainAmount = parseFloat(feeItem?.total || feeItem?.price || 0);

    const secondaryAmount = Math.max(
      pending > mainAmount ? pending - mainAmount : pending,
      0,
    );

    const isMainDisabled = pending < mainAmount;

    // ✅ optional: dynamic label भी
    const feeLabel = feeItem?.item || "Main Fee";

    html += `
    <div class="student-card ${isDisabled ? "disabled-card" : ""}" 
         data-key="${s.studentName}" 
         data-disabled="${isDisabled}"
         >
         
      <div class="student-header" onclick="togglePaymentInput(this)">
        <div class="student-body">
          <div class="student-name">${s.studentName}</div>
          <small>${s.className}( ${CLASS_MAP[s.className]} )</small>
          ${getPaymentStatusTag(s)}
        </div>
        <div class="student-total">₹${s.grandTotal}</div>
      </div>

      ${
        isDisabled
          ? ""
          : `
        <div class="payment-input-container hidden">
        <div>
            <ul class="entry-checkbox-list">

            <li>
              <label class="entry-checkbox-row">
                <input type="checkbox" class="split-check" data-type="main" ${isMainDisabled ? "checked disabled" : ""}>
                <span>
                  ${feeLabel}
                  <small>₹${mainAmount} → Gurukul Main A/C</small>
                </span>
              </label>
            </li>

            <li>
              <label class="entry-checkbox-row">
                <input type="checkbox" class="split-check" data-type="secondary">
                <span>
                  Remaining Amount
                  <small>₹${secondaryAmount} → Gurukul Secondary A/C</small>
                </span>
              </label>
            </li>

          </ul>
        </div>
        <div>
          <input class="payment-input" type="number" placeholder="Enter amount" max="${s.grandTotal}" />
          <button onclick="submitPayment(this)">Submit</button>
        </div>
        </div>
      `
      }
    </div>
  `;
  });

  container.innerHTML = html;
}

// Toggle the payment input box on clicking the card header, only if payment pending or partial
function old_togglePaymentInput(headerElem) {
  const card = headerElem.parentElement;

  if (card.dataset.disabled === "true") return;

  const inputContainer = card.querySelector(".payment-input-container");

  // close all
  document
    .querySelectorAll(".payment-input-container")
    .forEach((el) => el.classList.add("hidden"));

  inputContainer.classList.remove("hidden");

  financeSelectedStd = card.dataset.key;
}

function togglePaymentInput(headerElem) {
  const card = headerElem.parentElement;

  if (card.dataset.disabled === "true") return;

  const inputContainer = card.querySelector(".payment-input-container");

  const isAlreadyOpen = !inputContainer.classList.contains("hidden");

  // close all
  document
    .querySelectorAll(".payment-input-container")
    .forEach((el) => el.classList.add("hidden"));

  // 👉 agar already open tha → bas close hi rehne do
  if (isAlreadyOpen) {
    financeSelectedStd = null;
    return;
  }

  // 👉 warna open karo
  inputContainer.classList.remove("hidden");

  financeSelectedStd = card.dataset.key;
}

// On clicking submit button, log student and payment amount
async function submitPayment(button) {
  const card = button.closest(".student-card");
  const input = card.querySelector(".payment-input");

  const amount = Number(input.value);

  if (!amount || amount <= 0) {
    alert("Enter valid amount");
    return;
  }

  const studentKey = card.dataset.key;
  const studentObj = studentMapFinance[studentKey];

  const payload = {
    studentKey: studentKey,
    amount: amount,
    items: studentObj.items,
    doneBy: selectedTeacher,
  };

  const response = await CALL_API(
    "SAVE_STUDENT_PAYMENT_YEARLY_ADMISSION_KIT",
    payload,
  );

  if (response?.status) {
    const oldRecd = parseFloat(studentObj.amountRecd || 0);
    const newRecd = oldRecd + amount;

    studentMapFinance[studentKey].amountRecd = newRecd;

    studentMapFinance[studentKey].items.forEach((item) => {
      item.amountRecd = newRecd;
    });

    console.log("UPDATED STUDENT:", studentMapFinance[studentKey]);

    input.value = "";
    renderStudentsFinance();
  }

  // close input
  card.querySelector(".payment-input-container").classList.add("hidden");
}
