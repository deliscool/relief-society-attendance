// Replace this URL with your deployed Google Apps Script Web App URL
export const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL || "";

export interface Config {
  names: string[];
  dates: string[]; // format: "YYYY-MM-DD"
}

export interface Submission {
  timestamp: string;
  name: string;
  dates: string;
}

async function call(params: Record<string, string>): Promise<unknown> {
  if (!SCRIPT_URL) throw new Error("VITE_SCRIPT_URL not set");
  const url = new URL(SCRIPT_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export async function getConfig(): Promise<Config> {
  const data = await call({ action: "getConfig" });
  return data as Config;
}

export async function submitAttendance(name: string, dates: string[]): Promise<void> {
  await call({
    action: "submit",
    name,
    dates: dates.join(","),
    timestamp: new Date().toISOString(),
  });
}

export async function addName(name: string, pin: string): Promise<void> {
  await call({ action: "addName", name, pin });
}

export async function removeName(name: string, pin: string): Promise<void> {
  await call({ action: "removeName", name, pin });
}

export async function addDate(date: string, pin: string): Promise<void> {
  await call({ action: "addDate", date, pin });
}

export async function removeDate(date: string, pin: string): Promise<void> {
  await call({ action: "removeDate", date, pin });
}

export async function getSubmissions(pin: string): Promise<Submission[]> {
  const data = await call({ action: "getSubmissions", pin });
  return data as Submission[];
}

export async function verifyPin(pin: string): Promise<boolean> {
  try {
    const data = await call({ action: "verifyPin", pin }) as { valid: boolean };
    return data.valid === true;
  } catch {
    return false;
  }
}
