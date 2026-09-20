import { describe, expect, it } from "vitest";
import { decodeJWT } from "../jwtUtils";

const makeToken = (payload: Record<string, string>) => {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.signature`;
};

describe("decodeJWT", () => {
  it("decodes a valid JWT payload", () => {
    const token = makeToken({
      sub: "user-123",
      email: "admin@example.com",
      role: "Admin",
    });

    expect(decodeJWT(token)).toEqual({
      sub: "user-123",
      email: "admin@example.com",
      role: "Admin",
    });
  });

  it("returns null for empty or malformed tokens", () => {
    expect(decodeJWT(null)).toBeNull();
    expect(decodeJWT("not-a-jwt")).toBeNull();
  });
});
