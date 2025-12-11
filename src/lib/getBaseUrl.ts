export function getBaseUrl() {
  if (typeof window === "undefined") {
    return "http://localhost:3002";
  }
  return "";
}
