export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000/api";

export async function readApiJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    if (contentType.includes("application/json")) {
      const errorData = await response.json().catch(() => null);
      message =
        errorData?.message ||
        errorData?.title ||
        errorData?.error ||
        message;
    } else {
      const text = await response.text().catch(() => "");
      if (text) {
        message = text;
      }
    }

    throw new Error(message);
  }

  if (!contentType.includes("application/json")) {
    return null as T;
  }

  return response.json() as Promise<T>;
}