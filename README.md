# 👻 GhostWatcher

**by Prince Script**

A clean, open-source Instagram tool that finds who **doesn't follow you back**, lets you browse your **followers, following, verified, and private** accounts, and **unfollow** people safely — all inside a sleek overlay styled to match Instagram.

No data leaves your browser. Everything runs locally in your own logged-in session. No login, no password, no third-party servers.

---

## ✨ Features

- 🔍 **Don't-follow-back finder** — instantly see who you follow that doesn't follow you back
- 👥 Browse **Followers**, **Following**, **Verified**, and **Private** accounts in tabs
- ✅ **Bulk select + unfollow** with one click
- 🐢 **Human-like pacing** — randomized delays and pauses to avoid rate limits and action blocks
- 🌗 **Light & dark mode** (auto-detects your system theme)
- 🎨 Native **Instagram look & feel** — avatars, verified badges, the works
- 🔒 100% client-side — your session, your data, nothing leaves your browser

---

## 🚀 How to use

### Option A — Quick paste (easiest)

1. Open [instagram.com](https://www.instagram.com/) and **log in**.
2. Open the **DevTools Console**:
   - **Windows / Linux:** press `F12` or `Ctrl + Shift + J`
   - **Mac:** press `⌘ + Option + J`
   - …or right-click anywhere on the page → **Inspect** → **Console** tab.
3. Paste the snippet below and press **Enter**:

```js
(async()=>{const url="https://cdn.jsdelivr.net/gh/notreallyprince/ghostwatcher@main/ghostwatcher.js";try{const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);const c=await r.text();(0,eval)(c)}catch(e){console.error("[GhostWatcher] Loader failed:",e);alert("GhostWatcher failed to load. Check console.")}})();
```

4. The GhostWatcher overlay appears in the top-right. Use the tabs to browse, the search box to filter, and the checkboxes to select accounts to unfollow.

> 💡 If your browser warns you about pasting code into the console, type **`allow pasting`** and press Enter once, then paste the snippet.

### Option B — One-click bookmarklet

Run GhostWatcher with a single click, every time:

1. Show your browser's **bookmarks bar** (`Ctrl/⌘ + Shift + B`).
2. Right-click the bar → **Add page** / **Add bookmark**.
3. Name it **GhostWatcher**.
4. In the **URL** field, paste the entire line from [`bookmarklet.txt`](./bookmarklet.txt).
5. Save. Now, whenever you're on Instagram (logged in), just click the **GhostWatcher** bookmark.

---

## 🖥 The interface

| Tab | Shows |
|-----|-------|
| **Don't follow back** | People you follow who don't follow you — the unfollow controls live here |
| **Followers** | Everyone who follows you |
| **Following** | Everyone you follow |
| **Verified** | Verified (blue-tick) accounts across your lists |
| **Private** | Private accounts across your lists |

- **Search** any list with the search box.
- **Select all / Clear / Unfollow** buttons appear on the *Don't follow back* tab for bulk actions.
- Toggle **light/dark mode** with the ◐ button, or **refresh** your data with ↺.

---

## ⚙️ Adjusting the speed

GhostWatcher paces itself to stay safe. If you want it slower (safer) or faster, the timing values are at the top of `ghostwatcher.js`:

| Setting | What it controls |
|---------|------------------|
| `searchCycleDelayMs` | delay between loading each page of followers/following |
| `searchPauseAfterFiveMs` | a longer pause every 5 pages |
| `unfollowDelayMs` | delay between each unfollow |
| `unfollowPauseAfterFiveMs` | a longer pause every 5 unfollows |

Higher numbers = slower and safer. The defaults are intentionally conservative.

---

## ⚠️ Disclaimer

GhostWatcher uses Instagram's own internal web endpoints from **your** authenticated session. Automating actions can violate Instagram's Terms of Service and may result in **temporary action blocks** on your account.

Use responsibly, keep unfollow volumes low, and use at your own risk. This project is provided for **educational purposes only**. The author is not responsible for any consequences to your account.

---

## 📄 License

Released under the [MIT License](./LICENSE) — free to use, modify, and share. Please keep the credit.

**Made with 👻 by Prince Script**