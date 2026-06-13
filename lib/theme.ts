"use client";

// The Diamond accent theme is opt-in (lifetime users only) and stored in
// localStorage so it can be applied before paint. Clear it whenever the user
// signs out or isn't entitled to it, so it doesn't bleed into the login page
// or a different account on the same browser.
export function clearAccentTheme() {
  try {
    localStorage.removeItem("pt:theme");
    document.documentElement.classList.remove("theme-diamond");
  } catch {
    /* ignore */
  }
}
