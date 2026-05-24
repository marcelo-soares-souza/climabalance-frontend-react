import { describe, expect, test } from "bun:test";
import { tokenStorage } from "./token-storage";

describe("tokenStorage", () => {
  test("stores access token only in memory", () => {
    tokenStorage.clear();
    expect(tokenStorage.getAccessToken()).toBeNull();

    tokenStorage.setAccessToken("token-123");
    expect(tokenStorage.getAccessToken()).toBe("token-123");

    tokenStorage.clear();
    expect(tokenStorage.getAccessToken()).toBeNull();
  });
});
