import { describe, expect, test, beforeEach } from "bun:test";
import { tokenStorage } from "./token-storage";

const mockStorage = new Map<string, string>();

beforeEach(() => {
  mockStorage.clear();
  // @ts-expect-error - test environment mock
  globalThis.localStorage = {
    getItem: (key: string) => mockStorage.get(key) ?? null,
    setItem: (key: string, value: string) => mockStorage.set(key, value),
    removeItem: (key: string) => mockStorage.delete(key),
  };
});

describe("tokenStorage", () => {
  test("stores access token in memory and localStorage", () => {
    tokenStorage.clear();
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(mockStorage.has("cb_access_token")).toBe(false);

    tokenStorage.setAccessToken("token-123");
    expect(tokenStorage.getAccessToken()).toBe("token-123");
    expect(mockStorage.get("cb_access_token")).toBe("token-123");

    tokenStorage.clear();
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(mockStorage.has("cb_access_token")).toBe(false);
  });

  test("restores access token from localStorage on page reload", () => {
    tokenStorage.clear();
    mockStorage.set("cb_access_token", "persisted-token");
    expect(tokenStorage.getAccessToken()).toBe("persisted-token");
  });
});
