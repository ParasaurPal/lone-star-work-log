import { jsPDF } from "jspdf";

const INK = [27, 27, 24];
const MUTED = [110, 106, 96];
const RULE = [206, 201, 188];
const ACCENT = [176, 69, 27];

const COLUMNS = [
  { key: "date_applied", label: "Date of Contact", width: 0.11 },
  { key: "company_name", label: "Business / Company Name", width: 0.22 },
  { key: "application_method", label: "Contact Method", width: 0.12 },
  { key: "position_title", label: "Position Applied For", width: 0.2 },
  { key: "contact_info", label: "Contact Person / Details", width: 0.2 },
  { key: "status", label: "Result / Status", width: 0.15 },
];

function weekRange(weekEnding) {
  if (!weekEnding) return "—";
  const end = new Date(`${weekEnding}T00:00:00`);
  if (Number.isNaN(end.getTime())) return String(weekEnding);
  const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
  const format = (date) =>
    date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
  return `${format(start)} – ${format(end)}`;
}

function longDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

/** Builds an audit-ready TWC work search log and returns the jsPDF document. */
export function buildTwcPdf({ entries = [], filedWeeks = [], claimant = {}, rangeLabel = "", goal = 5 }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 42;
  const usable = pageWidth - margin * 2;
  const bottomLimit = pageHeight - 78;
  let y = margin;

  const widths = COLUMNS.map((column) => column.width * usable);

  const drawTitle = (continuation) => {
    doc.setTextColor(...ACCENT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("LONESTAR WORKLOG  ·  TWC WORK SEARCH RECORD", margin, y + 8);

    doc.setTextColor(...INK);
    doc.setFontSize(continuation ? 13 : 17);
    doc.text("TEXAS WORKFORCE COMMISSION — WORK SEARCH LOG", margin, y + (continuation ? 28 : 32));

    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.8);
    doc.line(margin, y + (continuation ? 38 : 44), pageWidth - margin, y + (continuation ? 38 : 44));

    if (!continuation) {
      let metaY = y + 60;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text("Claimant", margin, metaY);
      doc.text("Reporting period", margin + 200, metaY);
      doc.text("Contacts recorded", margin + 400, metaY);
      doc.text("Generated", margin + 540, metaY);

      doc.setTextColor(...INK);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(claimant.name || "—", margin, metaY + 15);
      doc.text(rangeLabel || "All weeks", margin + 200, metaY + 15);
      doc.text(String(entries.length), margin + 400, metaY + 15);
      doc.text(new Date().toLocaleDateString("en-US"), margin + 540, metaY + 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text(claimant.email || "", margin, metaY + 30);
      doc.text(
        `${entries.length} contact${entries.length === 1 ? "" : "s"} · TWC minimum ${goal} per week`,
        margin + 200,
        metaY + 30,
      );
      return metaY + 48;
    }
    return y + 52;
  };

  const drawTableHead = () => {
    doc.setFillColor(241, 238, 228);
    doc.rect(margin, y, usable, 24, "F");
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    let x = margin + 6;
    COLUMNS.forEach((column, index) => {
      doc.text(column.label.toUpperCase(), x, y + 15.5);
      x += widths[index];
    });
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.7);
    doc.line(margin, y + 24, pageWidth - margin, y + 24);
    y += 24;
  };

  const newPage = () => {
    doc.addPage();
    y = margin;
    y = drawTitle(true);
    drawTableHead();
  };

  y = drawTitle(false);
  drawTableHead();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  entries.forEach((entry, rowIndex) => {
    const cells = COLUMNS.map((column, index) => {
      const raw =
        column.key === "date_applied" ? longDate(entry.date_applied) : entry[column.key] || "—";
      return doc.splitTextToSize(String(raw), widths[index] - 12);
    });
    const lines = Math.max(...cells.map((cell) => cell.length));
    const rowHeight = Math.max(24, lines * 11 + 12);

    if (y + rowHeight > bottomLimit) newPage();

    if (rowIndex % 2 === 1) {
      doc.setFillColor(250, 248, 243);
      doc.rect(margin, y, usable, rowHeight, "F");
    }

    let x = margin + 6;
    cells.forEach((cell, index) => {
      doc.setTextColor(...INK);
      cell.forEach((line, lineIndex) => {
        doc.text(line, x, y + 15 + lineIndex * 11);
      });
      x += widths[index];
    });

    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.4);
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
    y += rowHeight;
  });

  if (entries.length === 0) {
    doc.setTextColor(...MUTED);
    doc.text("No work search contacts were logged for this period.", margin + 6, y + 20);
    y += 40;
  }

  // filing record
  if (filedWeeks.length > 0) {
    if (y + 46 + filedWeeks.length * 16 > bottomLimit) newPage();
    y += 26;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text("TWC FILING RECORD", margin, y);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.7);
    doc.line(margin, y + 6, pageWidth - margin, y + 6);
    y += 20;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    filedWeeks.forEach((week) => {
      const parts = [`Week of ${weekRange(week.week_ending)}`, `filed ${longDate(week.filed_date)}`];
      if (week.confirmation_number) parts.push(`confirmation ${week.confirmation_number}`);
      doc.text(parts.join("   ·   "), margin + 6, y);
      y += 16;
    });
  }

  // certification block
  if (y + 150 > bottomLimit) newPage();
  y += 28;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.8);
  doc.rect(margin, y, usable, 116);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  doc.text("CERTIFICATION", margin + 14, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const statement = doc.splitTextToSize(
    "I certify that the information recorded in this work search log is true and correct to the best of my knowledge. I understand that the Texas Workforce Commission may request this record and that providing false information may result in denial or recovery of benefits.",
    usable - 28,
  );
  doc.text(statement, margin + 14, y + 36);

  const lineY = y + 88;
  doc.setDrawColor(...MUTED);
  doc.line(margin + 14, lineY, margin + 250, lineY);
  doc.line(margin + 320, lineY, margin + 470, lineY);
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text("Claimant signature", margin + 14, lineY + 11);
  doc.text("Date", margin + 320, lineY + 11);

  // footers
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.6);
    doc.line(margin, pageHeight - 46, pageWidth - margin, pageHeight - 46);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      "TWC Work Search Log · Retain a copy for your records · Texas Workforce Commission",
      margin,
      pageHeight - 32,
    );
    doc.text(`Page ${page} of ${total}`, pageWidth - margin, pageHeight - 32, { align: "right" });
  }

  return doc;
}

export function downloadTwcPdf(options, filename = "twc-work-search-log.pdf") {
  const doc = buildTwcPdf(options);
  doc.save(filename);
}