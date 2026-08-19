import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatRelativeTime, formatAbsoluteTime } from "./formatTime";

describe("formatTime", () => {
  const now = new Date("2024-01-15T12:00:00Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("formatRelativeTime", () => {
    it("formats a past date relative to now", () => {
      const oneHourAgo = new Date("2024-01-15T11:00:00Z");
      expect(formatRelativeTime(oneHourAgo)).toMatch(/1時間前/);
    });

    it("returns a non-empty string for an invalid date", () => {
      expect(formatRelativeTime(new Date("invalid"))).not.toBe("");
    });

    it("returns an empty string when formatting throws", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const throwing = new Date("2024-01-15T11:00:00Z");
      vi.spyOn(throwing, "getTime").mockImplementation(() => {
        throw new Error("boom");
      });
      expect(formatRelativeTime(throwing)).toBe("");
      errorSpy.mockRestore();
    });
  });

  describe("formatAbsoluteTime", () => {
    it("formats a date as yyyy/MM/dd HH:mm", () => {
      const formatted = formatAbsoluteTime(
        new Date("2024-01-15T12:30:00Z")
      );
      expect(formatted).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
    });

    it("falls back to the current date for invalid input", () => {
      const formatted = formatAbsoluteTime(new Date("invalid"));
      expect(formatted).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
    });

    it("returns an empty string when formatting throws", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const throwing = new Date("2024-01-15T11:00:00Z");
      vi.spyOn(throwing, "getTime").mockImplementation(() => {
        throw new Error("boom");
      });
      expect(formatAbsoluteTime(throwing)).toBe("");
      errorSpy.mockRestore();
    });
  });
});
