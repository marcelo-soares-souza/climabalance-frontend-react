import { describe, expect, test } from "bun:test";
import { API_URL, toApiUrl } from "./api";

describe("toApiUrl", () => {
  test("keeps absolute urls unchanged", () => {
    expect(toApiUrl("https://example.com/file.png")).toBe(
      "https://example.com/file.png",
    );
  });

  test("normalizes relative path against configured API base", () => {
    const expected = API_URL
      ? `${API_URL.replace(/\/$/, "")}/api/v1/test`
      : "/api/v1/test";
    expect(toApiUrl("/api/v1/test")).toBe(expected);
  });
});
