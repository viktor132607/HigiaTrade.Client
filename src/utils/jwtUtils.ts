export const decodeJWT = (token: string | null): Record<string, string> | null => {
  if (!token) {
    return null;
  }

  try {
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) {
      return null;
    }

    const payload = tokenParts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const decodedPayload = atob(payload);
    return JSON.parse(decodedPayload) as Record<string, string>;
  } catch (error) {
    console.error("JWT decode failed:", error);
    return null;
  }
};
