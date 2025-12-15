export const CLUB_TIMEZONE = "America/Los_Angeles";

type YMD = { year: number; month: number; day: number };

function dtfYmd(timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function dtfOffset(timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  });
}

function parseYmdInTz(dateUtc: Date, timeZone: string): YMD {
  const parts = dtfYmd(timeZone).formatToParts(dateUtc);
  const year = Number(parts.find((p) => p.type === "year")?.value ?? "NaN");
  const month = Number(parts.find((p) => p.type === "month")?.value ?? "NaN");
  const day = Number(parts.find((p) => p.type === "day")?.value ?? "NaN");
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    throw new Error("parseYmdInTz: failed to parse date parts");
  }
  return { year, month, day };
}

function offsetMinutesForInstant(dateUtc: Date, timeZone: string): number {
  const parts = dtfOffset(timeZone).formatToParts(dateUtc);
  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  const m = tzPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!m) {
    throw new Error(`offsetMinutesForInstant: unsupported offset format "${tzPart}"`);
  }
  const sign = m[1] === "-" ? -1 : 1;
  const hh = Number(m[2]);
  const mm = Number(m[3] ?? "0");
  return sign * (hh * 60 + mm);
}

function utcForTzMidnight(ymd: YMD, timeZone: string): Date {
  const { year, month, day } = ymd;

  const off = offsetMinutesForInstant(new Date(Date.UTC(year, month - 1, day, 8, 0, 0)), timeZone);
  let utcMs = Date.UTC(year, month - 1, day, 0, 0, 0) - off * 60_000;

  const off2 = offsetMinutesForInstant(new Date(utcMs), timeZone);
  if (off2 !== off) {
    utcMs = Date.UTC(year, month - 1, day, 0, 0, 0) - off2 * 60_000;
  }

  return new Date(utcMs);
}

export function clubYmdString(dateUtc: Date): string {
  const { year, month, day } = parseYmdInTz(dateUtc, CLUB_TIMEZONE);
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function startOfClubDayUtc(dateUtc: Date): Date {
  const ymd = parseYmdInTz(dateUtc, CLUB_TIMEZONE);
  return utcForTzMidnight(ymd, CLUB_TIMEZONE);
}

export function isSameClubDay(aUtc: Date, bUtc: Date): boolean {
  return clubYmdString(aUtc) === clubYmdString(bUtc);
}

export function formatClubDate(dateUtc: Date, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: CLUB_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(dateUtc);
}

export function formatClubDateTime(dateUtc: Date, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: CLUB_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateUtc);
}

export function formatClubDateLong(dateUtc: Date, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: CLUB_TIMEZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateUtc);
}

export function formatClubTime(dateUtc: Date, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: CLUB_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(dateUtc);
}

export function formatClubMonthYear(dateUtc: Date, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: CLUB_TIMEZONE,
    month: "short",
    year: "numeric",
  }).format(dateUtc);
}
