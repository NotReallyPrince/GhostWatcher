/*!
 * GhostWatcher Loader — by Prince Script
 * Paste this ONE block into the Instagram DevTools console.
 * It pulls the latest GhostWatcher from GitHub (via jsDelivr) and runs it.
 *
 * Replace notreallyprince with your GitHub username after you upload the repo.
 */
(async () => {
  const url = "https://cdn.jsdelivr.net/gh/notreallyprince/ghostwatcher@main/ghostwatcher.js";
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const code = await res.text();
    // Run in page context
    (0, eval)(code);
  } catch (e) {
    console.error("[GhostWatcher] Loader failed:", e);
    alert("GhostWatcher failed to load. Check the console and your internet connection.");
  }
})();