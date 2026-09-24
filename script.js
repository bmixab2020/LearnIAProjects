const rowsBody = document.getElementById("rowsBody");
const display = document.getElementById("display");
const addRowBtn = document.getElementById("addRowBtn");
const clearBtn = document.getElementById("clearBtn");
const printBtn = document.getElementById("printBtn");
const sheetTitle = document.getElementById("sheetTitle");
const savedSheets = document.getElementById("savedSheets");
const saveBtn = document.getElementById("saveBtn");
const deleteBtn = document.getElementById("deleteBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const clearStorageBtn = document.getElementById("clearStorageBtn");

const STORAGE_KEY = "expenseSheets";

const ROW_COUNT = 5;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

function formatCurrency(value) {
  return currencyFormatter.format(value);
}

function parseMoney(value) {
  if (typeof value === "number") {
    return value;
  }
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = parseFloat(String(value).replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function attachCurrencyFormatting(input) {
  input.addEventListener("focus", () => {
    const val = parseMoney(input.value);
    input.value = val !== 0 || String(input.value).trim() !== "" ? String(val) : "";
  });
  input.addEventListener("blur", () => {
    if (String(input.value).trim() !== "") {
      input.value = formatCurrency(parseMoney(input.value));
    }
  });
}

function formatCurrencyInputs() {
  document.querySelectorAll(".num-input, .discount-input").forEach((input) => {
    if (String(input.value).trim() !== "") {
      input.value = formatCurrency(parseMoney(input.value));
    }
  });
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
    const amount = parseMoney(row.querySelector(".num-input").value);
    const discount = parseMoney(row.querySelector(".discount-input").value);
    const value = qty * (amount - discount);
    if (op === "+") {
      total += value;
    } else {
      total -= value;
    }
  });

  return total;
}

function getTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    "" +
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes())
  );
}

function pdfFileName() {
  const name = (sheetTitle.value.trim() || "Expense Report")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/ +/g, "_");
  return name + "_" + getTimestamp() + ".pdf";
}

function renderRowTotal(row) {
  const op = row.querySelector(".op-select").value;
  const qty = parseFloat(row.querySelector(".qty-input").value) || 0;
  const amount = parseMoney(row.querySelector(".num-input").value);
  const discount = parseMoney(row.querySelector(".discount-input").value);
  const value = qty * (amount - discount);
  const shown = op === "-" ? -value : value;
  row.querySelector(".total-col").textContent = formatCurrency(shown);
}

function renderTotal() {
  const rows = Array.from(rowsBody.querySelectorAll("tr[data-index]"));
  let qtySum = 0;
  let amountSum = 0;
  let discountSum = 0;
  rows.forEach((row) => {
    renderRowTotal(row);
    const op = row.querySelector(".op-select").value;
    const sign = op === "-" ? -1 : 1;
    const qty = parseFloat(row.querySelector(".qty-input").value) || 0;
    const amount = parseMoney(row.querySelector(".num-input").value);
    const discount = parseMoney(row.querySelector(".discount-input").value);
    qtySum += qty;
    amountSum += sign * qty * amount;
    discountSum += sign * qty * discount;
  });
  document.getElementById("qtySum").textContent = qtySum;
  document.getElementById("amountSum").textContent = formatCurrency(amountSum);
  document.getElementById("discountSum").textContent = formatCurrency(discountSum);
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
  input.type = "text";
  input.inputMode = "decimal";
  input.className = "num-input";
  input.placeholder = "0";
  input.addEventListener("input", renderTotal);
  attachCurrencyFormatting(input);
  tdNum.appendChild(input);

  const tdDiscount = document.createElement("td");
  tdDiscount.className = "discount-col";
  const discountInput = document.createElement("input");
  discountInput.type = "text";
  discountInput.inputMode = "decimal";
  discountInput.className = "discount-input";
  discountInput.value = "0";
  discountInput.addEventListener("input", renderTotal);
  attachCurrencyFormatting(discountInput);
  tdDiscount.appendChild(discountInput);

  const tdTotal = document.createElement("td");
  tdTotal.className = "total-col";
  tdTotal.textContent = formatCurrency(0);

  const tdNote = document.createElement("td");
  tdNote.className = "note-col";
  const noteInput = document.createElement("textarea");
  noteInput.className = "note-input";
  noteInput.rows = "1";
  noteInput.addEventListener("input", () => {
    noteInput.style.height = "auto";
    noteInput.style.height = noteInput.scrollHeight + "px";
  });
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
  removeBtn.textContent = "-";
  removeBtn.title = "Remove Row";
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
  tr.appendChild(tdDiscount);
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

clearBtn.addEventListener("click", () => {
  sheetTitle.value = "";
  savedSheets.value = "";
  resetRows();
  renderTotal();
});

const sortableThs = Array.from(document.querySelectorAll(".sheet th[data-sort]"));

let sortDirection = {};

function rowValue(row, key) {
  if (key === "index") {
    return parseInt(row.dataset.index, 10);
  }
  if (key === "qty") {
    return parseFloat(row.querySelector(".qty-input").value) || 0;
  }
  if (key === "discount") {
    return parseMoney(row.querySelector(".discount-input").value);
  }
  if (key === "amount" || key === "total") {
    const op = row.querySelector(".op-select").value;
    const qty = parseFloat(row.querySelector(".qty-input").value) || 0;
    const amount = parseMoney(row.querySelector(".num-input").value);
    const discount = parseMoney(row.querySelector(".discount-input").value);
    const value = qty * (amount - discount);
    return op === "-" ? -value : value;
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
      const amount = raw === "" ? 0 : parseMoney(raw);
      const discount = parseMoney(row.querySelector(".discount-input").value);
      const perItem = amount - discount;
      const signed = op === "-" ? -perItem * qty : perItem * qty;
      const note = row.querySelector(".note-input").value.trim();
      const date = row.querySelector(".date-input").value;
      return {
        index: i + 1,
        op,
        qty,
        amount,
        discount,
        signed,
        note,
        date
      };
    });

  const doc = new jspdf.jsPDF();
  const LEFT = 20;
  const RIGHT = 192;
  const COLS = [20, 34, 48, 72, 90, 112, 136, 192];

  const drawVerticals = (xs, fromY, toY) => {
    xs.forEach((x) => doc.line(x, fromY, x, toY));
  };

  const drawHeader = (y) => {
    doc.setFont("helvetica", "bold");
    doc.text("#", 27, y, { align: "center" });
    doc.text("Qty", 41, y, { align: "center" });
    doc.text("Amount", 60, y, { align: "center" });
    doc.text("Disc", 81, y, { align: "center" });
    doc.text("Total", 101, y, { align: "center" });
    doc.text("Date", 124, y, { align: "center" });
    doc.text("Notes", 164, y, { align: "center" });
    doc.setFont("helvetica", "normal");
  };

  doc.setFontSize(18);
  doc.text(sheetTitle.value.trim() || "Expense Report", 105, 16, {
    align: "center"
  });
  doc.setFontSize(11);

  drawHeader(30);
  doc.line(LEFT, 26, RIGHT, 26);
  doc.line(LEFT, 32, RIGHT, 32);
  drawVerticals(COLS, 26, 32);
  let rowTop = 32;

  const drawRow = (row, y) => {
    doc.text(String(row.index), 32, y, { align: "right" });
    doc.text(String(row.qty), 46, y, { align: "right" });
    doc.text(formatCurrency(row.amount), 70, y, { align: "right" });
    doc.text(formatCurrency(row.discount), 88, y, { align: "right" });
    doc.text(formatCurrency(row.signed), 110, y, { align: "right" });
    doc.text(formatDate(row.date), 134, y, { align: "right" });
  };

  data.forEach((row) => {
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(row.note || "-", RIGHT - 139 - 4);
    doc.setFontSize(11);
    const extra = (noteLines.length - 1) * 5;
    let y = rowTop + 8;
    if (y + extra > 268) {
      doc.line(LEFT, rowTop, RIGHT, rowTop);
      doc.addPage();
      drawHeader(22);
      doc.line(LEFT, 18, RIGHT, 18);
      doc.line(LEFT, 24, RIGHT, 24);
      drawVerticals(COLS, 18, 24);
      rowTop = 24;
      y = rowTop + 8;
    }
    drawRow(row, y);
    doc.setFontSize(9);
    noteLines.forEach((line, li) => {
      doc.text(line, 139, y + li * 5);
    });
    doc.setFontSize(11);
    const bottom = y + 2 + extra;
    doc.line(LEFT, bottom, RIGHT, bottom);
    drawVerticals(COLS, rowTop, bottom);
    rowTop = bottom;
  });

  const qtySum = data.reduce((sum, row) => sum + row.qty, 0);
  const signOf = (op) => (op === "-" ? -1 : 1);
  const amountSum = data.reduce(
    (sum, row) => sum + signOf(row.op) * row.qty * row.amount,
    0
  );
  const discountSum = data.reduce(
    (sum, row) => sum + signOf(row.op) * row.qty * row.discount,
    0
  );
  const total = data.reduce((sum, row) => sum + row.signed, 0);
  let totalY = rowTop + 10;
  if (totalY > 278) {
    doc.addPage();
    totalY = 24;
  }
  doc.line(LEFT, totalY - 4, RIGHT, totalY - 4);
  drawVerticals(COLS, rowTop, totalY - 4);
  doc.setFont("symbol", "normal");
  doc.text("S", 27, totalY, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text(String(qtySum), 46, totalY, { align: "right" });
  doc.text(formatCurrency(amountSum), 70, totalY, { align: "right" });
  doc.text(formatCurrency(discountSum), 88, totalY, { align: "right" });
  doc.text(formatCurrency(total), 110, totalY, { align: "right" });
  doc.line(LEFT, totalY + 2, RIGHT, totalY + 2);
  drawVerticals(COLS, totalY - 4, totalY + 2);

  doc.save(pdfFileName());
});

resetRows();
renderTotal();

const now = new Date();
sheetTitle.placeholder = "Sheet Name";

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
    discount: row.querySelector(".discount-input").value,
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

function normalizeSheets(data) {
  if (!Array.isArray(data)) {
    return [];
  }
  return data
    .filter((s) => s && typeof s === "object" && s.name)
    .map((s) => ({
      name: String(s.name),
      title: typeof s.title === "string" ? s.title : String(s.name),
      rows: Array.isArray(s.rows) ? s.rows : [],
      savedAt: s.savedAt || new Date().toISOString()
    }));
}

exportBtn.addEventListener("click", () => {
  const sheets = getSavedSheets();
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp =
    "" +
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes());
  const blob = new Blob([JSON.stringify(sheets, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "expense-sheets_" + stamp + ".json";
  a.click();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener("click", () => {
  sheetTitle.value = "";
  savedSheets.value = "";
  resetRows();
  renderTotal();
  importFile.click();
});

importFile.addEventListener("change", () => {
  const file = importFile.files[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = normalizeSheets(JSON.parse(reader.result));
      if (imported.length === 0) {
        alert("No saved sheets found in the file.");
        return;
      }
      const sheets = getSavedSheets();
      let added = 0;
      let updated = 0;
      imported.forEach((sheet) => {
        const idx = sheets.findIndex((s) => s.name === sheet.name);
        if (idx >= 0) {
          sheets[idx] = sheet;
          updated++;
        } else {
          sheets.push(sheet);
          added++;
        }
});
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
      updateSavedSheetsList();
      alert(
        "Imported from " +
          file.name +
          ": " +
          added +
          " added, " +
          updated +
          " updated."
      );
    } catch (error) {
      alert("Invalid file. Could not import.");
    }
  };
  reader.readAsText(file);
  importFile.value = "";
});

clearStorageBtn.addEventListener("click", () => {
  const sheets = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  if (sheets.length === 0) {
    alert("No saved data to clear.");
    return;
  }
  const ok = confirm(
    "Clear all saved sheets from local storage? This cannot be undone."
  );
  if (!ok) {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
  sheetTitle.value = "";
  savedSheets.value = "";
  resetRows();
  renderTotal();
  updateSavedSheetsList();
  alert("Local storage cleared.");
});

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
    const ok = confirm(
      'A sheet named "' + name + '" already exists. Update it?'
    );
    if (!ok) {
      return;
    }
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
      row.querySelector(".discount-input").value = r.discount || "0";
      row.querySelector(".note-input").value = r.note || "";
      row.querySelector(".date-input").value = r.date || "";
    });
    formatCurrencyInputs();
  }
  renderTotal();
});

updateSavedSheetsList();

deleteBtn.addEventListener("click", () => {
  if (savedSheets.value === "") {
    alert("No saved sheet is selected to delete.");
    return;
  }
  const idx = Number(savedSheets.value);
  const sheets = getSavedSheets();
  const sheet = sheets[idx];
  if (!sheet) {
    return;
  }
  const ok = confirm(
    'Delete sheet "' + sheet.name + '"? This cannot be undone.'
  );
  if (!ok) {
    return;
  }
  sheets.splice(idx, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
  sheetTitle.value = "";
  savedSheets.value = "";
  resetRows();
  renderTotal();
  updateSavedSheetsList();
  alert("Sheet deleted: " + sheet.name);
});