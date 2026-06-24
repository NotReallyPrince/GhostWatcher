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

The simplest way is the **install page** — it walks you through every method with one-click copy buttons:

### 👉 [notreallyprince.is-a.dev/GhostWatcher/install.html](https://notreallyprince.is-a.dev/GhostWatcher/install.html)

> ⚠️ The old "fetch + eval" loader snippet **no longer works** — Instagram's Content-Security-Policy blocks loading external scripts at runtime. The methods below embed the script directly, so they run reliably.

There are three ways to launch GhostWatcher — pick whichever suits you.

### Method 1 — Drag to bookmarks bar *(recommended)*

1. Open the [install page](https://notreallyprince.is-a.dev/GhostWatcher/install.html).
2. Show your **bookmarks bar** — `Ctrl/⌘ + Shift + B`.
3. **Drag** the black **GhostWatcher** button onto the bar — *don't click it, drag it.*
4. Open [instagram.com](https://www.instagram.com/) and **log in**, then click your new **GhostWatcher** bookmark.

> 💡 Dragging copies the whole bookmark perfectly. Pasting long bookmark text can get silently truncated — the usual reason a bookmarklet "doesn't work."

### Method 2 — Copy the bookmarklet *(mobile-friendly)*

1. On the [install page](https://notreallyprince.is-a.dev/GhostWatcher/install.html), tap **Copy bookmarklet**.
2. Create a new bookmark (on any page), then **edit** it.
3. Replace its **URL / address** with what you copied, and save.
4. On Instagram (logged in), open that bookmark to run GhostWatcher.

### Method 3 — Paste in the console *(always works)*

1. Open [instagram.com](https://www.instagram.com/) and **log in**.
2. Open the **DevTools Console**:
   - **Windows / Linux:** `F12` or `Ctrl + Shift + J`
   - **Mac:** `⌘ + Option + J`
   - …or right-click the page → **Inspect** → **Console** tab.
3. If your browser warns about pasting, type **`allow pasting`** and press Enter once.
4. On the [install page](https://notreallyprince.is-a.dev/GhostWatcher/install.html), tap **Copy full script**, paste it into the console, and press **Enter**.

The GhostWatcher overlay appears in the top-right. Use the tabs to browse, the search box to filter, the **fullscreen** button (`⤢`) to expand into a full dashboard, and the checkboxes to select accounts to unfollow.

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
- Go **fullscreen** with the `⤢` button for a dashboard layout with a collapsible sidebar (toggle it with `☰` or `Ctrl/⌘ + B`; press `Esc` to exit fullscreen).
- Toggle **light/dark mode** with the sun/moon button, or **refresh** your data with `↺`.

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