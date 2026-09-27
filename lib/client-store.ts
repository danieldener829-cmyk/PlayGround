"use client";
export function getSession() {
  try {
    if (typeof window === "undefined") return null;
    return JSON.parse(localStorage.getItem("hb-user") || "null");
  } catch { return null; }
}
export function setSession(u: any) { localStorage.setItem("hb-user", JSON.stringify(u)); window.dispatchEvent(new Event("hb-auth")); }
export function logout() { localStorage.removeItem("hb-user"); window.dispatchEvent(new Event("hb-auth")); window.location.href = "/"; }
