const rowsBody = document.getElementById("rowsBody");
const display = document.getElementById("display");
const addRowBtn = document.getElementById("addRowBtn");
const clearBtn = document.getElementById("clearBtn");
const printBtn = document.getElementById("printBtn");
const sheetTitle = document.getElementById("sheetTitle");
const savedSheets = document.getElementById("savedSheets");
const saveBtn = document.getElementById("saveBtn");

const STORAGE_KEY = "expenseSheets";

const ROW_COUNT = 5;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

function formatCurrency(value) {
  return currencyFormatter.format(value);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const parts = value.split("-");
  return parts.length === 3 ? parts[1] + "/" + parts[2] + "/" + parts[0] : value;
}

function computeTotal() {
  const rows = Array.from(rowsBody.querySelectorAll("tr[data-index]"));
  let total = 0;

  rows.forEach((row) => {
    const op = row.querySelector(".op-select").value;
    const qty = parseFloat(row.querySelector(".qty-input").value) || 0;
    const amount = parseFloat(row.querySelector(".num-input").value) || 0;
    const value = qty * amount;
    if (op === "+") {
      total += value;
    } else {
      total -= value;
    }
  });

  return total;
}

function renderRowTotal(row) {
  const op = row.querySelector(".op-select").value;
  const qty = parseFloat(row.querySelector(".qty-input").value) || 0;
  const amount = parseFloat(row.querySelector(".num-input").value) || 0;
  const value = qty * amount;
  const shown = op === "-" ? -value : value;
  row.querySelector(".total-col").textContent = formatCurrency(shown);
}

function renderTotal() {
  const rows = Array.from(rowsBody.querySelectorAll("tr[data-index]"));
  rows.forEach(renderRowTotal);
  display.textContent = formatCurrency(computeTotal());
}

function renumber() {
  Array.from(rowsBody.querySelectorAll("tr[data-index]")).forEach((tr, i) => {
    tr.dataset.index = i;
    tr.querySelector(".num-col").textContent = i + 1;
  });
}

function createRow(index) {
  const tr = document.createElement("tr");
  tr.dataset.index = index;

  const tdNumber = document.createElement("td");
  tdNumber.className = "num-col";
  tdNumber.textContent = index + 1;

  const tdOp = document.createElement("td");
  const select = document.createElement("select");
  select.className = "op-select";

  const plus = document.createElement("option");
  plus.value = "+";
  plus.textContent = "+ Add";

  const minus = document.createElement("option");
  minus.value = "-";
  minus.textContent = "- Subtract";

  select.appendChild(plus);
  select.appendChild(minus);
  select.addEventListener("change", renderTotal);
  tdOp.appendChild(select);

  const tdQty = document.createElement("td");
  tdQty.className = "qty-col";
  const qtyInput = document.createElement("input");
  qtyInput.type = "number";
  qtyInput.min = "0";
  qtyInput.step = "1";
  qtyInput.className = "qty-input";
  qtyInput.value = "1";
  qtyInput.addEventListener("input", renderTotal);
  tdQty.appendChild(qtyInput);

  const tdNum = document.createElement("td");
  const input = document.createElement("input");
  input.type = "number";
  input.className = "num-input";
  input.placeholder = "0";
  input.addEventListener("input", renderTotal);
  tdNum.appendChild(input);

  const tdTotal = document.createElement("td");
  tdTotal.className = "total-col";
  tdTotal.textContent = formatCurrency(0);

  const tdNote = document.createElement("td");
  tdNote.className = "note-col";
  const noteInput = document.createElement("input");
  noteInput.type = "text";
  noteInput.className = "note-input";
  noteInput.placeholder = "Note...";
  tdNote.appendChild(noteInput);

  const tdDate = document.createElement("td");
  tdDate.className = "date-col";
  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.className = "date-input";
  const today = new Date();
  dateInput.value = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");
  tdDate.appendChild(dateInput);

  const tdBtn = document.createElement("td");
  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", () => {
    tr.remove();
    renumber();
    renderTotal();
  });
  tdBtn.appendChild(removeBtn);

  tr.appendChild(tdNumber);
  tr.appendChild(tdOp);
  tr.appendChild(tdQty);
  tr.appendChild(tdNum);
  tr.appendChild(tdTotal);
  tr.appendChild(tdDate);
  tr.appendChild(tdNote);
  tr.appendChild(tdBtn);
  rowsBody.appendChild(tr);
}

function resetRows() {
  rowsBody.innerHTML = "";
  for (let i = 0; i < ROW_COUNT; i++) {
    createRow(i);
  }
}

addRowBtn.addEventListener("click", () => {
  createRow(rowsBody.children.length);
  renderTotal();
});

clearBtn.addEventListener("click", resetRows);

const sortableThs = Array.from(document.querySelectorAll(".sheet th[data-sort]"));

let sortDirection = {};

function rowValue(row, key) {
  if (key === "index") {
    return parseInt(row.dataset.index, 10);
  }
  if (key === "qty") {
    return parseFloat(row.querySelector(".qty-input").value) || 0;
  }
  if (key === "amount") {
    const op = row.querySelector(".op-select").value;
    const qty = parseFloat(row.querySelector(".qty-input").value) || 0;
    const value = qty * (parseFloat(row.querySelector(".num-input").value) || 0);
    return op === "-" ? -value : value;
  }
  if (key === "total") {
    return rowValue(row, "amount");
  }
  if (key === "note") {
    return row.querySelector(".note-input").value.trim().toLowerCase();
  }
  return row.querySelector(".date-input").value || "";
}

function updateSortIndicators() {
  sortableThs.forEach((th) => {
    const dir = sortDirection[th.dataset.sort];
    th.classList.remove("sorted-asc", "sorted-desc");
    if (dir) {
      th.classList.add(dir === "asc" ? "sorted-asc" : "sorted-desc");
    }
  });
}

sortableThs.forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    const nextDir = sortDirection[key] === "asc" ? "desc" : "asc";
    sortDirection = {};
    sortDirection[key] = nextDir;

    const rows = Array.from(rowsBody.querySelectorAll("tr[data-index]"));
    rows.sort((a, b) => {
      const va = rowValue(a, key);
      const vb = rowValue(b, key);
      const cmp =
        typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
      return nextDir === "asc" ? cmp : -cmp;
    });
    rows.forEach((row) => rowsBody.appendChild(row));
    renumber();
    renderTotal();
    updateSortIndicators();
  });
});

printBtn.addEventListener("click", () => {
  const rows = Array.from(rowsBody.querySelectorAll("tr[data-index]"));
  const data = rows
    .filter((row) => row.querySelector(".num-input").value.trim() !== "")
    .map((row, i) => {
      const op = row.querySelector(".op-select").value;
      const qty = parseFloat(row.querySelector(".qty-input").value) || 0;
      const raw = row.querySelector(".num-input").value;
      const amount = raw === "" ? 0 : parseFloat(raw);
      const signed = op === "-" ? -amount * qty : amount * qty;
      const note = row.querySelector(".note-input").value.trim();
      const date = row.querySelector(".date-input").value;
      return {
        index: i + 1,
        qty,
        amount,
        signed,
        note: note.length > 40 ? note.slice(0, 40) + "..." : note,
        date
      };
    });

  const doc = new jspdf.jsPDF();
  doc.setFontSize(18);
  doc.text(sheetTitle.value.trim() || "Expense Report", 14, 16);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("#", 12, 28);
  doc.text("Qty", 42, 28, { align: "right" });
  doc.text("Amount", 72, 28, { align: "right" });
  doc.text("Total", 112, 28, { align: "right" });
  doc.text("Date", 118, 28);
  doc.text("Notes", 160, 28);

  doc.setFont("helvetica", "normal");
  let y = 34;
  data.forEach((row) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
      doc.setFont("helvetica", "bold");
      doc.text("#", 12, y);
      doc.text("Qty", 42, y, { align: "right" });
      doc.text("Amount", 72, y, { align: "right" });
      doc.text("Total", 112, y, { align: "right" });
      doc.text("Date", 118, y);
      doc.text("Notes", 160, y);
      doc.setFont("helvetica", "normal");
      y += 6;
    }
    doc.text(String(row.index), 12, y);
    doc.text(String(row.qty), 42, y, { align: "right" });
    doc.text(formatCurrency(row.amount), 72, y, { align: "right" });
    doc.text(formatCurrency(row.signed), 112, y, { align: "right" });
    doc.text(formatDate(row.date), 118, y);
    doc.text(row.note || "-", 160, y);
    y += 7;
  });

  doc.setFont("helvetica", "bold");
  doc.line(12, y - 4, 172, y - 4);
  doc.text("Total:", 12, y + 2);
  doc.text(
    formatCurrency(data.reduce((sum, row) => sum + row.signed, 0)),
    112,
    y + 2,
    { align: "right" }
  );

  doc.save("sheet.pdf");
});

resetRows();
renderTotal();

const now = new Date();
sheetTitle.value =
  "Expense Report for " + now.toLocaleString("en-US", { month: "long" });

function getSavedSheets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function readRowsFromDom() {
  return Array.from(rowsBody.querySelectorAll("tr[data-index]")).map((row) => ({
    op: row.querySelector(".op-select").value,
    qty: row.querySelector(".qty-input").value,
    amount: row.querySelector(".num-input").value,
    note: row.querySelector(".note-input").value,
    date: row.querySelector(".date-input").value
  }));
}

function updateSavedSheetsList(selectedIndex) {
  const sheets = getSavedSheets();
  savedSheets.innerHTML = '<option value="">Load a saved sheet...</option>';
  sheets.forEach((sheet, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = sheet.name;
    if (i === selectedIndex) {
      opt.selected = true;
    }
    savedSheets.appendChild(opt);
  });
}

saveBtn.addEventListener("click", () => {
  const cleanTitle = sheetTitle.value.trim();
  const name = cleanTitle || "Expense Report";
  const sheets = getSavedSheets();
  const data = {
    name,
    title: cleanTitle,
    rows: readRowsFromDom(),
    savedAt: new Date().toISOString()
  };

  const existing = sheets.findIndex((s) => s.name === name);
  if (existing >= 0) {
    sheets[existing] = data;
  } else {
    sheets.push(data);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
  updateSavedSheetsList(sheets.findIndex((s) => s.name === name));
  alert("Sheet saved: " + name);
});

savedSheets.addEventListener("change", () => {
  const idx = Number(savedSheets.value);
  if (savedSheets.value === "") {
    return;
  }
  const sheets = getSavedSheets();
  const sheet = sheets[idx];
  if (!sheet) {
    return;
  }
  sheetTitle.value = sheet.title || "";

  if (!sheet.rows || sheet.rows.length === 0) {
    resetRows();
  } else {
    rowsBody.innerHTML = "";
    sheet.rows.forEach((r, i) => {
      createRow(i);
      const row = rowsBody.children[i];
      row.querySelector(".op-select").value = r.op || "+";
      row.querySelector(".qty-input").value = r.qty || "1";
      row.querySelector(".num-input").value = r.amount || "";
      row.querySelector(".note-input").value = r.note || "";
      row.querySelector(".date-input").value = r.date || "";
    });
  }
  renderTotal();
});

updateSavedSheetsList();