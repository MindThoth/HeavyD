import { NextRequest, NextResponse } from "next/server";

const GAS_URL =
  process.env.NEXT_PUBLIC_GAS_ENDPOINT ||
  "https://script.google.com/macros/s/AKfycbxidAdAasl0tFNMk2ILW_44gXAxVVTYPyzfwRBum9XTuZ9wOC5_BjcRKCALJf0IKD2h-g/exec";

/**
 * Proxy form submission to Google Apps Script so the browser gets a same-origin
 * response and can read success/error (Apps Script cannot set CORS headers).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text || "Invalid response from server" };
    }
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxy request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
