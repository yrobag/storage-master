// Utility functions for JSON formatting and validation

export function isJSON(str: string): boolean {
  try {
    JSON.parse(str);

    return str.includes("{") || str.includes("[");
  } catch {
    return false;
  }
}

export function prettyPrintJSON(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}
