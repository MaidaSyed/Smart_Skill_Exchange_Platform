const LOCALE = "en-GB";

const timeFmt = new Intl.DateTimeFormat(LOCALE, {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const dateFmt = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function normalizeAmPm(s) {
  return String(s).replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase());
}

export function toDate(value) {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split("-").map((x) => Number(x));
    const out = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
    return Number.isNaN(out.getTime()) ? null : out;
  }

  const normalized = raw.includes(" ") && !raw.includes("T") ? raw.replace(" ", "T") : raw;
  const d1 = new Date(normalized);
  if (!Number.isNaN(d1.getTime())) return d1;

  const d2 = new Date(normalized.replace(/\.\d+/, ""));
  if (!Number.isNaN(d2.getTime())) return d2;

  return null;
}

export function buildLocalDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const ds = String(dateStr).slice(0, 10);
  const tm = String(timeStr);

  const mDate = ds.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const mTime = tm.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!mDate || !mTime) return null;

  const y = Number(mDate[1]);
  const mo = Number(mDate[2]);
  const d = Number(mDate[3]);
  const h = Number(mTime[1]);
  const mi = Number(mTime[2]);
  const s = Number(mTime[3] || 0);

  const out = new Date(y, mo - 1, d, h, mi, s, 0);
  return Number.isNaN(out.getTime()) ? null : out;
}

export function formatTimeLocal(value) {
  const d = toDate(value);
  if (!d) return "—";
  return normalizeAmPm(timeFmt.format(d));
}

export function formatDateLocal(value) {
  const d = toDate(value);
  if (!d) return "—";
  return dateFmt.format(d);
}

export function formatDateTimeLocal(value) {
  const d = toDate(value);
  if (!d) return "—";
  return normalizeAmPm(dateTimeFmt.format(d).replace(",", ""));
}

export function formatTimeOfDay(value) {
  if (!value) return "—";
  const raw = String(value).trim();
  const m = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return raw;
  const h24 = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h24) || !Number.isFinite(min)) return raw;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(min).padStart(2, "0")} ${suffix}`;
}

export function formatDateInputValue(value) {
  const d = toDate(value);
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
