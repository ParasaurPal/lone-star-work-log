const LABELS = {
  company_name: /^(?:company|employer|business|organization)\s*[:-]\s*(.+)$/i,
  position_title: /^(?:position|job title|role|title)\s*[:-]\s*(.+)$/i,
  job_location: /^(?:job location|work location)\s*[:-]\s*(.+)$/i,
  interview_date_time: /^(?:interview date|interview time|date and time|when)\s*[:-]\s*(.+)$/i,
  contact_info: /^(?:contact|contact person|recruiter|email|phone)\s*[:-]\s*(.+)$/i,
};

export async function extractFromScreenshot({ data = {} } = {}) {
  const text = String(data.text || "").trim();
  if (!text) throw new Error("Paste text copied from your screenshot first.");
  const fields = { company_name: "", position_title: "", job_location: "", company_location: "", interview_date_time: "", contact_info: "", notes: "" };
  const notes = [];
  for (const line of text.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)) {
    let matched = false;
    const location = line.match(/^(?:location|interview location|address)\s*[:-]\s*(.+)$/i);
    if (location) {
      fields[data.kind === "application" ? "job_location" : "company_location"] = location[1].trim();
      matched = true;
    }
    for (const [field, pattern] of Object.entries(LABELS)) {
      if (matched) break;
      const result = line.match(pattern);
      if (!result) continue;
      fields[field] = result[1].trim();
      matched = true;
      break;
    }
    if (!matched) notes.push(line);
  }
  fields.notes = notes.join("\n");
  fields.source_text = text;
  return { fields };
}
