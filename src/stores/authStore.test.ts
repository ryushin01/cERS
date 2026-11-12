import { afterEach, describe, expect, it } from "vitest";

import { AUTH_STORAGE_KEY, readAccessToken } from "./authStore";

describe("readAccessToken", () => {
  afterEach(() => sessionStorage.clear());

  it("세션에 저장된 토큰을 읽는다", () => {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ accessToken: "token" }));
    expect(readAccessToken()).toBe("token");
  });

  it("저장된 값이 없으면 빈 문자열", () => {
    expect(readAccessToken()).toBe("");
  });

  it("값이 손상되었거나 형식이 다르면 던지지 않고 빈 문자열", () => {
    sessionStorage.setItem(AUTH_STORAGE_KEY, "{broken");
    expect(readAccessToken()).toBe("");
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ accessToken: 1 }));
    expect(readAccessToken()).toBe("");
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify("token"));
    expect(readAccessToken()).toBe("");
  });
});
