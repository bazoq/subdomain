import { describe, expect, it } from "vitest";
import { PK_OFFSET, hoursForDate, isOpenAt, pkDateTime, pkParts, toMinutes } from "@/modules/restaurant/hours";
import type { OpeningHours } from "@/lib/tenant-settings";

/** Build a Date from a Pakistan-local wall-clock time. */
function pk(ymd: string, hhmm: string): Date {
  return new Date(`${ymd}T${hhmm}:00${PK_OFFSET}`);
}

// 2026-09-27 is a Sunday (day 0); 2026-09-28 Monday (1).
const SUN = "2026-09-27";
const MON = "2026-09-28";

describe("toMinutes", () => {
  it("parses HH:MM and H:MM", () => {
    expect(toMinutes("00:00")).toBe(0);
    expect(toMinutes("9:05")).toBe(545);
    expect(toMinutes("23:59")).toBe(1439);
    expect(toMinutes(" 24:00 ")).toBe(1440);
  });
  it("rejects malformed values", () => {
    for (const bad of ["", "25:00", "12:60", "1200", "12:0", "ab:cd", "12:00:00", "-1:00"]) {
      expect(toMinutes(bad), bad).toBeNull();
    }
  });
});

describe("pkParts", () => {
  it("evaluates in Asia/Karachi regardless of the process time zone", () => {
    // 2026-09-27T20:30:00Z is 01:30 on Monday 28 Sep in Pakistan (UTC+5).
    expect(pkParts(new Date("2026-09-27T20:30:00Z"))).toEqual({ day: 1, minutes: 90, ymd: MON });
    expect(pkParts(pk(SUN, "00:00"))).toEqual({ day: 0, minutes: 0, ymd: SUN });
    expect(pkParts(pk(SUN, "23:59"))).toEqual({ day: 0, minutes: 1439, ymd: SUN });
  });
  it("handles midnight (no '24' hour leak)", () => {
    expect(pkParts(pk(MON, "00:00")).minutes).toBe(0);
  });
});

describe("isOpenAt", () => {
  const regular: OpeningHours = [
    { day: 0, open: "12:00", close: "23:00", closed: false },
    { day: 1, open: "10:00", close: "22:00", closed: false },
    { day: 2, open: "10:00", close: "22:00", closed: true },
  ];

  it("returns null when no hours are configured", () => {
    expect(isOpenAt([], pk(SUN, "12:00"))).toBeNull();
  });

  it("is open inside the window, closed outside it, closing time exclusive", () => {
    expect(isOpenAt(regular, pk(SUN, "12:00"))).toBe(true);
    expect(isOpenAt(regular, pk(SUN, "22:59"))).toBe(true);
    expect(isOpenAt(regular, pk(SUN, "23:00"))).toBe(false);
    expect(isOpenAt(regular, pk(SUN, "11:59"))).toBe(false);
    expect(isOpenAt(regular, pk(MON, "09:59"))).toBe(false);
    expect(isOpenAt(regular, pk(MON, "10:00"))).toBe(true);
  });

  it("is closed on a day marked closed and on days with no entry", () => {
    expect(isOpenAt(regular, pk("2026-09-29", "12:00"))).toBe(false); // Tuesday, closed flag
    expect(isOpenAt(regular, pk("2026-09-30", "12:00"))).toBe(false); // Wednesday, no entry
  });

  it("treats open == close as open all day", () => {
    const allDay: OpeningHours = [{ day: 0, open: "00:00", close: "00:00", closed: false }];
    expect(isOpenAt(allDay, pk(SUN, "00:00"))).toBe(true);
    expect(isOpenAt(allDay, pk(SUN, "13:37"))).toBe(true);
    expect(isOpenAt(allDay, pk(SUN, "23:59"))).toBe(true);
    expect(isOpenAt(allDay, pk(MON, "00:00"))).toBe(false); // next day, no entry
  });

  it("handles overnight windows: the window belongs to the day it starts", () => {
    const late: OpeningHours = [
      { day: 0, open: "18:00", close: "02:00", closed: false }, // Sunday 18:00 → Monday 02:00
      { day: 1, open: "18:00", close: "22:00", closed: false },
    ];
    expect(isOpenAt(late, pk(SUN, "17:59"))).toBe(false);
    expect(isOpenAt(late, pk(SUN, "18:00"))).toBe(true);
    expect(isOpenAt(late, pk(SUN, "23:30"))).toBe(true);
    expect(isOpenAt(late, pk(MON, "01:59"))).toBe(true); // previous day's overnight window
    expect(isOpenAt(late, pk(MON, "02:00"))).toBe(false);
    expect(isOpenAt(late, pk(MON, "12:00"))).toBe(false); // Monday itself opens at 18:00
    expect(isOpenAt(late, pk(MON, "19:00"))).toBe(true);
  });

  it("ignores rows with malformed times instead of throwing", () => {
    const broken: OpeningHours = [{ day: 0, open: "noon", close: "22:00", closed: false }];
    expect(isOpenAt(broken, pk(SUN, "13:00"))).toBe(false);
  });
});

describe("hoursForDate", () => {
  it("returns the row for the Pakistan-local weekday", () => {
    const hours: OpeningHours = [{ day: 1, open: "10:00", close: "22:00", closed: false }];
    expect(hoursForDate(hours, new Date("2026-09-27T20:30:00Z"))?.day).toBe(1); // Monday in PK
    expect(hoursForDate(hours, pk(SUN, "12:00"))).toBeUndefined();
  });
});

describe("pkDateTime", () => {
  it("interprets the wall clock in Pakistan time", () => {
    expect(pkDateTime(SUN, "09:05")?.toISOString()).toBe("2026-09-27T04:05:00.000Z");
    expect(pkDateTime(SUN, "9:05")?.toISOString()).toBe("2026-09-27T04:05:00.000Z");
    expect(pkDateTime(MON, "00:00")?.toISOString()).toBe("2026-09-27T19:00:00.000Z");
  });
  it("returns null for malformed input", () => {
    for (const [d, t] of [
      ["2026-9-27", "12:00"],
      ["27-09-2026", "12:00"],
      [SUN, "25:00"],
      [SUN, "1200"],
      ["2026-13-45", "12:00"],
      ["", ""],
    ]) {
      expect(pkDateTime(d, t), `${d} ${t}`).toBeNull();
    }
  });
});
