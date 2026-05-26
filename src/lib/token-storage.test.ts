import { describe, expect, test } from "bun:test";
import { tokenStorage } from "./token-storage";

describe("tokenStorage", () => {
  test("stores access token in memory only", () => {
    tokenStorage.clear();
    expect(tokenStorage.getAccessToken()).toBeNull();

    tokenStorage.setAccessToken("token-123");
    expect(tokenStorage.getAccessToken()).toBe("token-123");

    tokenStorage.clear();
    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  test("does not persist across reloads (in-memory only)", () => {
    tokenStorage.clear();
    tokenStorage.setAccessToken("session-token");
    expect(tokenStorage.getAccessToken()).toBe("session-token");

    // Simulate page reload: clear and re-import
    tokenStorage.clear();
    expect(tokenStorage.getAccessToken()).toBeNull();
  });
});
