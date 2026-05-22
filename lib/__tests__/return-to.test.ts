import { describe, it, expect } from "@jest/globals";
import {
  validateReturnTo,
  getReturnToFromQuery,
  getReturnToFromCookie,
} from "../return-to";

describe("validateReturnTo", () => {
  it("should accept valid relative paths", () => {
    expect(validateReturnTo("/dashboard")).toBe("/dashboard");
    expect(validateReturnTo("/posts/123")).toBe("/posts/123");
    expect(validateReturnTo("/pricing?plan=pro")).toBe("/pricing?plan=pro");
    expect(validateReturnTo("/dashboard#plans")).toBe("/dashboard#plans");
  });

  it("should reject absolute URLs", () => {
    expect(validateReturnTo("http://evil.com")).toBeNull();
    expect(validateReturnTo("https://evil.com")).toBeNull();
    expect(validateReturnTo("//evil.com")).toBeNull();
  });

  it("should reject encoded protocols", () => {
    expect(validateReturnTo("%2F%2Fevil.com")).toBeNull();
    expect(validateReturnTo("%68%74%74%70://evil.com")).toBeNull();
  });

  it("should reject auth pages to prevent loops", () => {
    expect(validateReturnTo("/login")).toBeNull();
    expect(validateReturnTo("/signup")).toBeNull();
    expect(validateReturnTo("/login?returnTo=/dashboard")).toBeNull();
  });

  it("should reject paths that don't start with /", () => {
    expect(validateReturnTo("dashboard")).toBeNull();
    expect(validateReturnTo("evil.com/path")).toBeNull();
  });

  it("should reject overly long paths", () => {
    const longPath = "/" + "a".repeat(3000);
    expect(validateReturnTo(longPath)).toBeNull();
  });

  it("should handle URL-encoded paths", () => {
    expect(validateReturnTo(encodeURIComponent("/posts/123"))).toBe("/posts/123");
    expect(validateReturnTo(encodeURIComponent("/pricing?plan=pro"))).toBe("/pricing?plan=pro");
  });

  it("should return null for invalid input", () => {
    expect(validateReturnTo(null)).toBeNull();
    expect(validateReturnTo(undefined)).toBeNull();
    expect(validateReturnTo("")).toBeNull();
  });
});

describe("getReturnToFromQuery", () => {
  it("should read returnTo from query params", () => {
    const params = new URLSearchParams("returnTo=%2Fposts%2F123");
    expect(getReturnToFromQuery(params)).toBe("/posts/123");
  });

  it("should fallback to redirect param for backward compat", () => {
    const params = new URLSearchParams("redirect=%2Fdashboard");
    expect(getReturnToFromQuery(params)).toBe("/dashboard");
  });

  it("should use default when no param", () => {
    const params = new URLSearchParams();
    expect(getReturnToFromQuery(params)).toBe("/dashboard");
  });

  it("should reject invalid returnTo and use default", () => {
    const params = new URLSearchParams("returnTo=http://evil.com");
    expect(getReturnToFromQuery(params)).toBe("/dashboard");
  });
});

describe("getReturnToFromCookie", () => {
  it("should read returnTo from cookie", () => {
    const cookie = "talexia_return_to=%2Fposts%2F123; other=cookie";
    expect(getReturnToFromCookie(cookie)).toBe("/posts/123");
  });

  it("should return null when cookie not found", () => {
    const cookie = "other=cookie; another=value";
    expect(getReturnToFromCookie(cookie)).toBeNull();
  });

  it("should return null for invalid returnTo in cookie", () => {
    const cookie = "talexia_return_to=http://evil.com";
    expect(getReturnToFromCookie(cookie)).toBeNull();
  });

  it("should handle null cookie header", () => {
    expect(getReturnToFromCookie(null)).toBeNull();
  });
});




