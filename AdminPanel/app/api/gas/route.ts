import { NextRequest, NextResponse } from "next/server";

const GAS_URL =
  process.env.GAS_ENDPOINT ||
  process.env.NEXT_PUBLIC_GAS_ENDPOINT ||
  "https://script.google.com/macros/s/AKfycbxidAdAasl0tFNMk2ILW_44gXAxVVTYPyzfwRBum9XTuZ9wOC5_BjcRKCALJf0IKD2h-g/exec";

/**
 * Proxy Admin Panel requests to Google Apps Script so the browser gets a same-origin
 * response. Fixes "Unknown action" / missing success field when calling the script directly.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const qs = searchParams.toString();
    const url = qs ? `${GAS_URL}?${qs}` : GAS_URL;
    const res = await fetch(url, { cache: "no-store", method: "GET" });
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
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}

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
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
