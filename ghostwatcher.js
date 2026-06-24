/*!
 * GhostWatcher — Instagram Follower Tracker
 * ------------------------------------------
 * by Prince Script
 *
 * Open-source Instagram tool to find who doesn't follow you back,
 * browse followers, verified & private accounts, and unfollow
 * safely with human-like rate limiting.
 *
 * Usage:
 *   1. Open instagram.com and log in
 *   2. Open DevTools Console (F12)
 *   3. Paste & run the loader, or use the bookmarklet
 */
(async () => {
  "use strict";

  // ----- Prevent double-injection -----
  if (window.__ghostWatcherRunning__) {
    const old = document.getElementById("__gw_panel__");
    if (old) old.remove();
  }
  window.__ghostWatcherRunning__ = true;

  // ----- Tunable pacing (human-like, avoids rate limits) -----
  const searchCycleDelayMs = 600;
  const searchPauseAfterFiveMs = 3000;
  const searchJitterMs = 400;
  const unfollowDelayMs = 3000;
  const unfollowPauseAfterFiveMs = 15000;
  const unfollowJitterMs = 1500;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const jitter = (max) => (max > 0 ? Math.floor(Math.random() * max) : 0);

  const appId = "936619743392459";
  const headers = { "x-ig-app-id": appId };
  const pageCount = 25;

  const styleId = "__gw_style__";
  const panelId = "__gw_panel__";

  const normalize = (list) =>
    [...new Set((list || []).map((v) => String(v || "").toLowerCase().trim()).filter(Boolean))];

  // =====================================================
  //  STYLES — Instagram-accurate look & feel
  // =====================================================
  function ensureUiStyles() {
    const existing = document.getElementById(styleId);
    if (existing) existing.remove();

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

      #${panelId} {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        max-height: calc(100vh - 40px);
        z-index: 2147483647;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background: #ffffff;
        color: #262626;
        border: 1px solid #dbdbdb;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,.18);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        font-size: 14px;
        animation: gwSlideIn .3s cubic-bezier(.16,1,.3,1);
      }
      @keyframes gwSlideIn {
        from { opacity: 0; transform: translateY(-12px) scale(.98); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      /* ---- Dark mode (matches IG dark) ---- */
      #${panelId}.gw-dark {
        background: #000000;
        color: #f5f5f5;
        border-color: #262626;
      }

      /* ---- Header ---- */
      #${panelId} .gw-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        border-bottom: 1px solid #dbdbdb;
        background: #fff;
      }
      #${panelId}.gw-dark .gw-head { border-color: #262626; background: #000; }

      #${panelId} .gw-brand { display: flex; align-items: center; gap: 9px; min-width: 0; }
      #${panelId} .gw-logo {
        width: 30px; height: 30px; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        border-radius: 9px;
        background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%);
      }
      #${panelId} .gw-logo svg { width: 18px; height: 18px; }
      #${panelId} .gw-titles { min-width: 0; }
      #${panelId} .gw-title {
        font-size: 15px; font-weight: 700; letter-spacing: -.2px;
        line-height: 1.1; white-space: nowrap;
      }
      #${panelId} .gw-sub {
        font-size: 10px; font-weight: 600; color: #8e8e8e;
        text-transform: uppercase; letter-spacing: .5px; margin-top: 1px;
      }
      #${panelId} .gw-head-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
      #${panelId} .gw-icon-btn {
        border: 0; background: transparent; color: #262626;
        width: 30px; height: 30px; border-radius: 8px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-size: 16px; transition: background .15s;
      }
      #${panelId}.gw-dark .gw-icon-btn { color: #f5f5f5; }
      #${panelId} .gw-icon-btn:hover { background: rgba(0,0,0,.06); }
      #${panelId}.gw-dark .gw-icon-btn:hover { background: rgba(255,255,255,.1); }
      #${panelId} .gw-icon-btn:disabled { opacity: .35; cursor: not-allowed; }
      #${panelId} .gw-ico { width: 17px; height: 17px; display: block; }
      /* theme toggle: show moon in light mode, sun in dark mode */
      #${panelId} .gw-theme .gw-ico-sun { display: none; }
      #${panelId}.gw-dark .gw-theme .gw-ico-moon { display: none; }
      #${panelId}.gw-dark .gw-theme .gw-ico-sun { display: block; }

      /* ---- Loading ---- */
      #${panelId} .gw-loading { padding: 28px 18px 24px; }
      #${panelId} .gw-loading.hidden { display: none; }
      #${panelId} .gw-ghost {
        font-size: 40px; text-align: center; margin-bottom: 14px;
        animation: gwFloat 2.4s ease-in-out infinite;
      }
      @keyframes gwFloat {
        0%,100% { transform: translateY(0); opacity: .9; }
        50% { transform: translateY(-8px); opacity: 1; }
      }
      #${panelId} .gw-track {
        height: 4px; border-radius: 999px; overflow: hidden;
        background: #efefef;
      }
      #${panelId}.gw-dark .gw-track { background: #262626; }
      #${panelId} .gw-fill {
        height: 100%; width: 0%; border-radius: 999px;
        background: linear-gradient(90deg, #d6249f, #285AEB);
        transition: width .3s ease;
      }
      #${panelId} .gw-load-text {
        margin-top: 12px; font-size: 13px; color: #8e8e8e; text-align: center;
      }

      /* ---- Body ---- */
      #${panelId} .gw-body {
        display: flex; flex-direction: column; min-height: 0; flex: 1;
      }
      #${panelId} .gw-body.hidden { display: none; }

      /* ---- Stat strip ---- */
      #${panelId} .gw-stats {
        display: grid; grid-template-columns: repeat(3, 1fr);
        border-bottom: 1px solid #dbdbdb;
      }
      #${panelId}.gw-dark .gw-stats { border-color: #262626; }
      #${panelId} .gw-stat {
        text-align: center; padding: 12px 6px;
        border-right: 1px solid #dbdbdb;
      }
      #${panelId}.gw-dark .gw-stat { border-color: #262626; }
      #${panelId} .gw-stat:last-child { border-right: 0; }
      #${panelId} .gw-stat b { display: block; font-size: 17px; font-weight: 700; }
      #${panelId} .gw-stat span { font-size: 11px; color: #8e8e8e; }

      /* ---- Tabs ---- */
      #${panelId} .gw-tabs {
        display: flex; border-bottom: 1px solid #dbdbdb;
      }
      #${panelId}.gw-dark .gw-tabs { border-color: #262626; }
      #${panelId} .gw-tab {
        flex: 1; border: 0; background: transparent; cursor: pointer;
        padding: 11px 4px 9px; font-size: 11px; font-weight: 600;
        color: #8e8e8e; border-bottom: 2px solid transparent;
        transition: color .15s; font-family: inherit;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      #${panelId} .gw-tab.active { color: #262626; border-bottom-color: #262626; }
      #${panelId}.gw-dark .gw-tab.active { color: #f5f5f5; border-bottom-color: #f5f5f5; }

      /* ---- Search ---- */
      #${panelId} .gw-search-wrap { padding: 10px 14px 8px; }
      #${panelId} .gw-search {
        width: 100%; box-sizing: border-box;
        padding: 9px 12px; border-radius: 8px;
        border: 0; background: #efefef; color: #262626;
        font-size: 13px; font-family: inherit; outline: none;
      }
      #${panelId}.gw-dark .gw-search { background: #1a1a1a; color: #f5f5f5; }
      #${panelId} .gw-search::placeholder { color: #8e8e8e; }

      /* ---- Bulk actions ---- */
      #${panelId} .gw-actions { display: flex; gap: 7px; padding: 0 14px 10px; }
      #${panelId} .gw-actions:empty { display: none; }
      #${panelId} .gw-btn {
        flex: 1; border: 1px solid #dbdbdb; background: #fff; color: #262626;
        border-radius: 8px; padding: 8px 6px; font-size: 11px; font-weight: 600;
        cursor: pointer; font-family: inherit; transition: background .15s;
      }
      #${panelId}.gw-dark .gw-btn { background: #000; border-color: #363636; color: #f5f5f5; }
      #${panelId} .gw-btn:hover:not(:disabled) { background: #fafafa; }
      #${panelId}.gw-dark .gw-btn:hover:not(:disabled) { background: #121212; }
      #${panelId} .gw-btn.primary {
        background: #0095f6; border-color: #0095f6; color: #fff;
      }
      #${panelId} .gw-btn.primary:hover:not(:disabled) { background: #1aa0f7; }
      #${panelId} .gw-btn.danger {
        background: #fff; border-color: #ed4956; color: #ed4956;
      }
      #${panelId}.gw-dark .gw-btn.danger { background: #000; }
      #${panelId} .gw-btn.danger:hover:not(:disabled) { background: #fef0f1; }
      #${panelId}.gw-dark .gw-btn.danger:hover:not(:disabled) { background: #2a0e10; }
      #${panelId} .gw-btn:disabled { opacity: .45; cursor: not-allowed; }

      /* ---- List ---- */
      #${panelId} .gw-list {
        overflow-y: auto; flex: 1; min-height: 120px;
        max-height: 360px; padding: 0 6px 8px;
      }
      #${panelId} .gw-list::-webkit-scrollbar { width: 8px; }
      #${panelId} .gw-list::-webkit-scrollbar-thumb {
        background: #c7c7c7; border-radius: 999px;
      }
      #${panelId}.gw-dark .gw-list::-webkit-scrollbar-thumb { background: #363636; }

      #${panelId} .gw-row {
        display: flex; align-items: center; gap: 11px;
        padding: 8px 10px; border-radius: 8px; transition: background .12s;
      }
      #${panelId} .gw-row:hover { background: #fafafa; }
      #${panelId}.gw-dark .gw-row:hover { background: #121212; }

      #${panelId} .gw-avatar {
        width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; font-weight: 700; color: #fff;
        text-transform: uppercase;
      }
      #${panelId} .gw-meta { min-width: 0; flex: 1; }
      #${panelId} .gw-uname-line { display: flex; align-items: center; gap: 4px; min-width: 0; }
      #${panelId} .gw-uname {
        color: inherit; text-decoration: none; font-weight: 600; font-size: 13px;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      #${panelId} .gw-uname:hover { text-decoration: underline; }
      #${panelId} .gw-verified { width: 13px; height: 13px; flex-shrink: 0; }
      #${panelId} .gw-fullname {
        font-size: 12px; color: #8e8e8e; overflow: hidden;
        text-overflow: ellipsis; white-space: nowrap;
      }
      #${panelId} .gw-tag {
        font-size: 10px; color: #8e8e8e; background: #efefef;
        padding: 1px 7px; border-radius: 999px; font-weight: 600; flex-shrink: 0;
      }
      #${panelId}.gw-dark .gw-tag { background: #1a1a1a; }

      #${panelId} .gw-row-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
      #${panelId} .gw-check { width: 16px; height: 16px; accent-color: #0095f6; cursor: pointer; }
      #${panelId} .gw-unf {
        border: 0; background: transparent; color: #0095f6;
        font-size: 12px; font-weight: 600; cursor: pointer; padding: 4px 2px;
        font-family: inherit;
      }
      #${panelId} .gw-unf:hover { color: #00376b; }
      #${panelId} .gw-unf.done { color: #8e8e8e; cursor: default; }
      #${panelId} .gw-unf:disabled { opacity: .5; cursor: not-allowed; }

      #${panelId} .gw-empty {
        text-align: center; padding: 40px 20px; color: #8e8e8e; font-size: 13px;
      }

      /* ---- Footer ---- */
      #${panelId} .gw-footer {
        padding: 10px 14px; border-top: 1px solid #dbdbdb;
        font-size: 11px; color: #8e8e8e;
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
      }
      #${panelId}.gw-dark .gw-footer { border-color: #262626; }
      #${panelId} .gw-footer-status { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      #${panelId} .gw-credit { font-weight: 700; color: #d6249f; white-space: nowrap; }

      /* ---- Tab base (icon + label, used by both layouts) ---- */
      #${panelId} .gw-tab { display: flex; align-items: center; justify-content: center; gap: 6px; }
      #${panelId} .gw-tab-ico { display: none; flex-shrink: 0; }
      #${panelId} .gw-tab-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; }

      /* SidebarTrigger lives in the header, but only matters in fullscreen */
      #${panelId} .gw-sbtrigger { display: none; }
      #${panelId}.gw-fullscreen .gw-sbtrigger { display: flex; }

      /* =====================================================
         FULLSCREEN DASHBOARD — shadcn-style collapsible sidebar
         ===================================================== */
      #${panelId}.gw-fullscreen {
        top: 0; left: 0; right: 0; bottom: 0;
        width: 100vw; height: 100vh; max-height: 100vh;
        border: 0; border-radius: 0; box-shadow: none; animation: none;
      }
      #${panelId}.gw-fullscreen .gw-head { padding: 14px 20px; }

      /* center the loading state when fullscreen */
      #${panelId}.gw-fullscreen .gw-loading:not(.hidden) {
        flex: 1; display: flex; flex-direction: column;
        justify-content: center; align-items: center;
      }
      #${panelId}.gw-fullscreen .gw-track { width: min(420px, 60vw); }

      /* body becomes [sidebar | main] dashboard grid */
      #${panelId}.gw-fullscreen .gw-body {
        --gw-sb: 264px;
        display: grid;
        grid-template-columns: var(--gw-sb) minmax(0, 1fr);
        grid-template-rows: auto auto auto 1fr;
        grid-template-areas:
          "stats   search"
          "tabs    list"
          "actions list"
          "footer  list";
        min-height: 0;
        transition: grid-template-columns .2s ease;
        background:
          linear-gradient(90deg,
            #fafafa 0, #fafafa calc(var(--gw-sb) - 1px),
            #dbdbdb calc(var(--gw-sb) - 1px), #dbdbdb var(--gw-sb),
            transparent var(--gw-sb));
      }
      #${panelId}.gw-fullscreen.gw-dark .gw-body {
        background:
          linear-gradient(90deg,
            #0a0a0a 0, #0a0a0a calc(var(--gw-sb) - 1px),
            #262626 calc(var(--gw-sb) - 1px), #262626 var(--gw-sb),
            transparent var(--gw-sb));
      }

      /* place each child into the grid */
      #${panelId}.gw-fullscreen .gw-stats { grid-area: stats; }
      #${panelId}.gw-fullscreen .gw-tabs {
        grid-area: tabs; flex-direction: column; gap: 2px;
        border-bottom: 0; padding: 8px; overflow-y: auto;
      }
      #${panelId}.gw-fullscreen .gw-actions {
        grid-area: actions; flex-direction: column; gap: 7px; padding: 8px 12px 12px;
      }
      #${panelId}.gw-fullscreen .gw-footer {
        grid-area: footer; align-self: end; flex-direction: column;
        align-items: flex-start; gap: 4px;
      }
      #${panelId}.gw-fullscreen .gw-search-wrap { grid-area: search; padding: 14px 18px; }
      #${panelId}.gw-fullscreen .gw-list {
        grid-area: list; max-height: none; height: 100%;
        display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        grid-auto-rows: max-content; align-content: start;
        gap: 2px 14px; padding: 6px 18px 18px;
      }
      #${panelId}.gw-fullscreen .gw-empty { grid-column: 1 / -1; }

      /* tabs render as a vertical SidebarMenu */
      #${panelId}.gw-fullscreen .gw-tab {
        flex: none; justify-content: flex-start; gap: 11px;
        padding: 9px 12px; border-radius: 8px; border-bottom: 0;
      }
      #${panelId}.gw-fullscreen .gw-tab:hover:not(.active) { background: rgba(0,0,0,.05); }
      #${panelId}.gw-fullscreen.gw-dark .gw-tab:hover:not(.active) { background: rgba(255,255,255,.06); }
      #${panelId}.gw-fullscreen .gw-tab.active {
        background: rgba(0,149,246,.12); color: #0095f6; border-bottom: 0;
      }
      #${panelId}.gw-fullscreen .gw-tab-ico {
        display: inline-flex; justify-content: center; width: 20px; font-size: 15px;
      }

      /* collapsed → "icon" rail (cmd/ctrl+B) */
      #${panelId}.gw-fullscreen.gw-sb-collapsed .gw-body { --gw-sb: 60px; }
      #${panelId}.gw-fullscreen.gw-sb-collapsed .gw-stats,
      #${panelId}.gw-fullscreen.gw-sb-collapsed .gw-actions,
      #${panelId}.gw-fullscreen.gw-sb-collapsed .gw-footer { display: none; }
      #${panelId}.gw-fullscreen.gw-sb-collapsed .gw-tab-label { display: none; }
      #${panelId}.gw-fullscreen.gw-sb-collapsed .gw-tab { justify-content: center; padding: 10px 0; }
      #${panelId}.gw-fullscreen.gw-sb-collapsed .gw-tab-ico { width: auto; }
    `;
    document.head.appendChild(style);
  }

  // =====================================================
  //  PANEL SHELL
  // =====================================================
  function ensurePanelShell() {
    const existing = document.getElementById(panelId);
    if (existing) return existing;

    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    const panel = document.createElement("aside");
    panel.id = panelId;
    if (prefersDark) panel.classList.add("gw-dark");
    panel.innerHTML = `
      <div class="gw-head">
        <button class="gw-icon-btn gw-sbtrigger" title="Toggle sidebar (Ctrl/⌘ B)">☰</button>
        <div class="gw-brand">
          <div class="gw-logo">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C7.6 2 4 5.6 4 10v10.5c0 .6.7 1 1.2.6l1.8-1.4 1.8 1.4c.3.3.8.3 1.2 0l1.8-1.4 1.8 1.4c.3.3.8.3 1.2 0l1.8-1.4 1.8 1.4c.5.4 1.2 0 1.2-.6V10c0-4.4-3.6-8-8-8z" fill="#fff"/>
              <circle cx="9" cy="10" r="1.4" fill="#262626"/>
              <circle cx="15" cy="10" r="1.4" fill="#262626"/>
            </svg>
          </div>
          <div class="gw-titles">
            <div class="gw-title">GhostWatcher</div>
            <div class="gw-sub">by Prince Script</div>
          </div>
        </div>
        <div class="gw-head-actions">
          <button class="gw-icon-btn gw-fs" title="Fullscreen dashboard">⤢</button>
          <button class="gw-icon-btn gw-theme" title="Toggle theme">
            <svg class="gw-ico gw-ico-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            <svg class="gw-ico gw-ico-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
          </button>
          <button class="gw-icon-btn gw-refresh" title="Refresh">↺</button>
          <button class="gw-icon-btn gw-close" title="Close">✕</button>
        </div>
      </div>
      <div class="gw-loading">
        <div class="gw-ghost">👻</div>
        <div class="gw-track"><div class="gw-fill"></div></div>
        <div class="gw-load-text">Preparing…</div>
      </div>
      <div class="gw-body hidden">
        <div class="gw-stats"></div>
        <div class="gw-tabs"></div>
        <div class="gw-search-wrap"><input class="gw-search" placeholder="Search username…" /></div>
        <div class="gw-actions"></div>
        <div class="gw-list"></div>
        <div class="gw-footer">
          <span class="gw-footer-status"></span>
          <span class="gw-credit">Prince Script</span>
        </div>
      </div>
    `;

    // ----- Fullscreen dashboard + collapsible sidebar (shadcn-style) -----
    const fsBtn = panel.querySelector(".gw-fs");
    const toggleFullscreen = (force) => {
      const on = panel.classList.toggle("gw-fullscreen", force);
      if (!on) panel.classList.remove("gw-sb-collapsed");
      fsBtn.textContent = on ? "⤡" : "⤢";
      fsBtn.title = on ? "Exit fullscreen" : "Fullscreen dashboard";
    };
    const toggleSidebar = () => {
      if (panel.classList.contains("gw-fullscreen")) {
        panel.classList.toggle("gw-sb-collapsed");
      }
    };

    // cmd/ctrl+B toggles the sidebar, Esc exits fullscreen — only while in fullscreen
    const onKeydown = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "b" || e.key === "B")) {
        if (panel.classList.contains("gw-fullscreen")) {
          e.preventDefault();
          toggleSidebar();
        }
      } else if (e.key === "Escape" && panel.classList.contains("gw-fullscreen")) {
        toggleFullscreen(false);
      }
    };
    document.addEventListener("keydown", onKeydown);

    panel.querySelector(".gw-close").addEventListener("click", () => {
      document.removeEventListener("keydown", onKeydown);
      panel.remove();
      window.__ghostWatcherRunning__ = false;
    });
    panel.querySelector(".gw-refresh").addEventListener("click", () => doFetch());
    panel.querySelector(".gw-theme").addEventListener("click", () => {
      panel.classList.toggle("gw-dark");
    });
    fsBtn.addEventListener("click", () => toggleFullscreen());
    panel.querySelector(".gw-sbtrigger").addEventListener("click", toggleSidebar);

    document.body.appendChild(panel);
    return panel;
  }

  // =====================================================
  //  PROGRESS
  // =====================================================
  function setFetchProgress(percent, text) {
    ensureUiStyles();
    const panel = ensurePanelShell();
    const loading = panel.querySelector(".gw-loading");
    const body = panel.querySelector(".gw-body");
    if (loading) loading.classList.remove("hidden");
    if (body) body.classList.add("hidden");
    const fill = panel.querySelector(".gw-fill");
    const label = panel.querySelector(".gw-load-text");
    const safe = Math.max(0, Math.min(100, Math.floor(percent)));
    if (fill) fill.style.width = safe + "%";
    if (label) label.textContent = text;
  }

  function removeFetchProgress() {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const loading = panel.querySelector(".gw-loading");
    if (loading) loading.classList.add("hidden");
  }

  // =====================================================
  //  AVATAR COLOR (deterministic from username)
  // =====================================================
  function avatarColor(name) {
    const palette = [
      "#d6249f", "#285AEB", "#fd5949", "#f77737", "#34c759",
      "#5856d6", "#ff2d55", "#00b8d4", "#7e57c2", "#26a69a",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
  }

  const VERIFIED_SVG =
    '<svg class="gw-verified" viewBox="0 0 24 24" fill="#0095f6" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M12 1l2.4 2.1 3.1-.5 1.3 2.9 2.9 1.3-.5 3.1L23 12l-2.1 2.4.5 3.1-2.9 1.3-1.3 2.9-3.1-.5L12 23l-2.4-2.1-3.1.5-1.3-2.9L2.3 17l.5-3.1L1 12l2.1-2.4-.5-3.1 2.9-1.3 1.3-2.9 3.1.5L12 1z"/>' +
    '<path d="M10.3 14.8L7.5 12l1.1-1.1 1.7 1.7 4-4L15.4 9.7l-5.1 5.1z" fill="#fff"/></svg>';

  // =====================================================
  //  RENDER OVERLAY (the main UI)
  // =====================================================
  function renderOverlay(payload) {
    ensureUiStyles();
    const panel = ensurePanelShell();
    const loading = panel.querySelector(".gw-loading");
    const body = panel.querySelector(".gw-body");
    if (loading) loading.classList.add("hidden");
    if (body) body.classList.remove("hidden");

    const followers = normalize(payload.followers);
    const following = normalize(payload.following);
    const followersSet = new Set(followers);
    const notFollowBack = following.filter((u) => !followersSet.has(u)).sort((a, b) => a.localeCompare(b));

    // Maps for metadata
    const usernameToId = new Map(
      (payload.followingRaw || [])
        .filter((u) => u && u.username && (u.id || u.pk))
        .map((u) => [String(u.username).toLowerCase(), String(u.id || u.pk)])
    );
    const fullNameMap = new Map();
    const privateSet = new Set();
    const verifiedSet = new Set();
    [...(payload.followersRaw || []), ...(payload.followingRaw || [])].forEach((u) => {
      if (!u || !u.username) return;
      const key = String(u.username).toLowerCase();
      if (u.full_name) fullNameMap.set(key, u.full_name);
      if (u.is_private) privateSet.add(key);
      if (u.is_verified) verifiedSet.add(key);
    });

    const verifiedUsers = [...verifiedSet].sort((a, b) => a.localeCompare(b));
    const privateUsers = [...privateSet].sort((a, b) => a.localeCompare(b));

    const tabs = [
      { key: "nonFollowers", label: "Don't follow back", icon: "👻", list: notFollowBack },
      { key: "followers", label: "Followers", icon: "👥", list: followers },
      { key: "following", label: "Following", icon: "➡️", list: following },
      { key: "verified", label: "Verified", icon: "✔️", list: verifiedUsers },
      { key: "private", label: "Private", icon: "🔒", list: privateUsers },
    ];

    // Stats
    const statsEl = panel.querySelector(".gw-stats");
    statsEl.innerHTML = `
      <div class="gw-stat"><b>${followers.length.toLocaleString()}</b><span>Followers</span></div>
      <div class="gw-stat"><b>${following.length.toLocaleString()}</b><span>Following</span></div>
      <div class="gw-stat"><b>${notFollowBack.length.toLocaleString()}</b><span>Not back</span></div>
    `;

    const tabsEl = panel.querySelector(".gw-tabs");
    const searchEl = panel.querySelector(".gw-search");
    const actionsEl = panel.querySelector(".gw-actions");
    const listEl = panel.querySelector(".gw-list");
    const footerEl = panel.querySelector(".gw-footer-status");

    const unfollowedSet = new Set();
    const selectedSet = new Set();
    let lastFilteredItems = [];
    let isUnfollowing = false;
    let searchRaf = 0;
    let activeKey = "nonFollowers";

    function getCsrfToken() {
      const m = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);
      return m ? decodeURIComponent(m[1]) : "";
    }

    async function unfollowById(userId, csrfToken) {
      const res = await fetch(
        "https://www.instagram.com/web/friendships/" + userId + "/unfollow/",
        {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "x-csrftoken": csrfToken,
          },
          mode: "cors",
          credentials: "include",
          body: "",
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || (data && data.status && data.status !== "ok")) {
        throw new Error((data && data.message) || "Unfollow failed");
      }
    }

    async function runUnfollow(usernames) {
      const queue = [...new Set(usernames)];
      if (isUnfollowing || queue.length === 0) return;
      const csrfToken = getCsrfToken();
      if (!csrfToken) {
        footerEl.textContent = "Missing csrftoken — refresh Instagram.";
        return;
      }
      const approved = window.confirm(
        "Unfollow " + queue.length + " account(s)?\n\nThis cannot be undone."
      );
      if (!approved) return;

      isUnfollowing = true;
      renderActions();
      let completed = 0, success = 0;
      const failed = [];

      for (const username of queue) {
        const userId = usernameToId.get(username);
        completed += 1;
        if (!userId) {
          failed.push(username);
        } else {
          try {
            await unfollowById(userId, csrfToken);
            unfollowedSet.add(username);
            selectedSet.delete(username);
            success += 1;
          } catch {
            selectedSet.delete(username);
            failed.push(username);
          }
        }
        footerEl.textContent = "Unfollowing " + completed + "/" + queue.length + "…";
        renderList();
        if (completed < queue.length) {
          await sleep(unfollowDelayMs + jitter(unfollowJitterMs));
          if (completed % 5 === 0 && unfollowPauseAfterFiveMs > 0) {
            await sleep(unfollowPauseAfterFiveMs + jitter(unfollowJitterMs));
          }
        }
      }
      isUnfollowing = false;
      renderActions();
      renderList();
      footerEl.textContent = "Done — " + success + " unfollowed, " + failed.length + " failed";
      if (failed.length) console.warn("[GhostWatcher] Failed:", failed);
    }

    function renderTabs() {
      tabsEl.innerHTML = "";
      tabs.forEach((tab) => {
        const btn = document.createElement("button");
        btn.className = "gw-tab" + (tab.key === activeKey ? " active" : "");
        const label = tab.label + " (" + tab.list.length + ")";
        btn.innerHTML =
          '<span class="gw-tab-ico">' + tab.icon + "</span>" +
          '<span class="gw-tab-label">' + label + "</span>";
        btn.title = label;
        btn.addEventListener("click", () => {
          activeKey = tab.key;
          renderTabs();
          renderList();
          renderActions();
        });
        tabsEl.appendChild(btn);
      });
    }

    function renderList() {
      const keyword = String(searchEl.value || "").toLowerCase().trim();
      const selected = tabs.find((t) => t.key === activeKey) || tabs[0];
      const filtered = keyword ? selected.list.filter((u) => u.includes(keyword)) : selected.list;
      lastFilteredItems = filtered;
      const limit = keyword ? filtered.length : Math.min(filtered.length, 200);
      const items = filtered.slice(0, limit);

      listEl.innerHTML = "";
      if (items.length === 0) {
        listEl.innerHTML = '<div class="gw-empty">👻 Nothing here</div>';
        footerEl.textContent = "@" + payload.account;
        return;
      }

      const frag = document.createDocumentFragment();
      items.forEach((username) => {
        const row = document.createElement("div");
        row.className = "gw-row";

        const isPrivate = privateSet.has(username);
        const isVerified = verifiedSet.has(username);
        const fullName = fullNameMap.get(username) || "";
        const canUnfollow = activeKey === "nonFollowers" && usernameToId.has(username);
        const alreadyUnf = unfollowedSet.has(username);
        const checked = selectedSet.has(username) ? "checked" : "";

        let rowActions = "";
        if (canUnfollow) {
          rowActions =
            '<div class="gw-row-actions">' +
            (alreadyUnf
              ? '<span class="gw-unf done">Unfollowed</span>'
              : '<button class="gw-unf" data-unfollow="' + username + '">Unfollow</button>' +
                '<input type="checkbox" class="gw-check" data-select="' + username + '" ' + checked + " />") +
            "</div>";
        } else if (isPrivate) {
          rowActions = '<div class="gw-row-actions"><span class="gw-tag">Private</span></div>';
        }

        row.innerHTML =
          '<div class="gw-avatar" style="background:' + avatarColor(username) + '">' +
            username.charAt(0) +
          "</div>" +
          '<div class="gw-meta">' +
            '<div class="gw-uname-line">' +
              '<a class="gw-uname" href="https://www.instagram.com/' + username + '/" target="_blank" rel="noreferrer">' +
                username +
              "</a>" +
              (isVerified ? VERIFIED_SVG : "") +
            "</div>" +
            (fullName ? '<div class="gw-fullname">' + fullName + "</div>" : "") +
          "</div>" +
          rowActions;

        frag.appendChild(row);
      });
      listEl.appendChild(frag);

      // bind unfollow buttons
      listEl.querySelectorAll("[data-unfollow]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const u = btn.getAttribute("data-unfollow");
          if (u) await runUnfollow([u]);
        });
      });
      // bind checkboxes
      listEl.querySelectorAll("[data-select]").forEach((input) => {
        input.addEventListener("change", (e) => {
          const u = e.target.getAttribute("data-select");
          if (!u) return;
          if (e.target.checked) selectedSet.add(u);
          else selectedSet.delete(u);
          renderActions();
        });
      });

      const selCount = [...selectedSet].filter((u) => usernameToId.has(u) && !unfollowedSet.has(u)).length;
      footerEl.textContent =
        "@" + payload.account + " • " + items.length + "/" + selected.list.length +
        (selCount ? " • " + selCount + " selected" : "") +
        (limit < filtered.length ? " • search to see all" : "");
    }

    function renderActions() {
      if (activeKey !== "nonFollowers") {
        actionsEl.innerHTML = "";
        return;
      }
      const visible = (lastFilteredItems || []).filter((u) => usernameToId.has(u) && !unfollowedSet.has(u));
      const selected = [...selectedSet].filter((u) => usernameToId.has(u) && !unfollowedSet.has(u));

      actionsEl.innerHTML =
        '<button class="gw-btn" data-select-visible>Select all (' + visible.length + ")</button>" +
        '<button class="gw-btn" data-clear>Clear (' + selected.length + ")</button>" +
        '<button class="gw-btn danger" data-unfollow-sel>Unfollow (' + selected.length + ")</button>";

      const selBtn = actionsEl.querySelector("[data-select-visible]");
      const clrBtn = actionsEl.querySelector("[data-clear]");
      const unfBtn = actionsEl.querySelector("[data-unfollow-sel]");

      selBtn.disabled = isUnfollowing || visible.length === 0;
      clrBtn.disabled = isUnfollowing || selected.length === 0;
      unfBtn.disabled = isUnfollowing || selected.length === 0;

      selBtn.addEventListener("click", () => {
        visible.forEach((u) => selectedSet.add(u));
        renderActions();
        renderList();
      });
      clrBtn.addEventListener("click", () => {
        selectedSet.clear();
        renderActions();
        renderList();
      });
      unfBtn.addEventListener("click", async () => {
        await runUnfollow(selected);
      });
    }

    searchEl.addEventListener("input", () => {
      if (searchRaf) cancelAnimationFrame(searchRaf);
      searchRaf = requestAnimationFrame(() => {
        renderList();
        renderActions();
      });
    });

    renderTabs();
    renderList();
    renderActions();
  }

  // =====================================================
  //  FETCH (with retry + pacing)
  // =====================================================
  async function fetchPage(type, params, retries = 3) {
    let attempt = 0, lastError = null;
    while (attempt < retries) {
      try {
        const res = await fetch(
          "https://www.instagram.com/api/v1/friendships/" + type + "/?" + params.toString(),
          { method: "GET", headers, credentials: "include" }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.status !== "ok") {
          throw new Error((data && data.message) || "HTTP " + res.status);
        }
        return data;
      } catch (err) {
        lastError = err;
        attempt += 1;
        if (attempt < retries) await sleep(searchCycleDelayMs * (attempt + 1));
      }
    }
    throw new Error(type + " failed: " + (lastError?.message || "unknown"));
  }

  async function getViewerId() {
    // Try to read the logged-in user's id so we can paginate their own lists
    try {
      if (window._sharedData?.config?.viewerId) return window._sharedData.config.viewerId;
    } catch {}
    try {
      const m = document.cookie.match(/ds_user_id=([^;]+)/);
      if (m) return m[1];
    } catch {}
    return null;
  }

  async function fetchAll(type, userId, phaseStart, phaseEnd) {
    const all = [];
    let maxId = null, cycle = 0, page = 0, count = 0;

    while (true) {
      const params = new URLSearchParams({
        count: String(pageCount),
        search_surface: "follow_list_page",
      });
      if (maxId) params.set("max_id", maxId);

      // Canonical IG endpoint: friendships/{user_id}/followers|following/
      // Falls back to bare type if viewer id couldn't be resolved.
      const data = await fetchPage(
        userId ? userId + "/" + type : type,
        params
      );
      const users = Array.isArray(data.users) ? data.users : [];
      all.push(...users);
      count += users.length;
      page += 1;
      maxId = data.next_max_id || null;
      const hasMore = Boolean(maxId);
      const progress = hasMore ? Math.min(phaseEnd - 2, phaseStart + page * 5) : phaseEnd;
      setFetchProgress(progress, "Loading " + type + " — " + count + " found");
      if (!maxId) break;

      cycle += 1;
      await sleep(searchCycleDelayMs + jitter(searchJitterMs));
      if (cycle % 5 === 0 && searchPauseAfterFiveMs > 0) {
        await sleep(searchPauseAfterFiveMs + jitter(searchJitterMs));
      }
    }
    return all;
  }

  // =====================================================
  //  MAIN
  // =====================================================
  async function doFetch() {
    ensureUiStyles();
    const panel = ensurePanelShell();
    const refreshBtn = panel.querySelector(".gw-refresh");
    const body = panel.querySelector(".gw-body");
    if (refreshBtn) refreshBtn.disabled = true;
    if (body) body.classList.add("hidden");

    try {
      setFetchProgress(3, "Starting…");
      const userId = await getViewerId();

      const followersRaw = await fetchAll("followers", userId, 5, 49);
      await sleep(searchCycleDelayMs + jitter(searchJitterMs));
      setFetchProgress(51, "Followers loaded. Now following…");
      const followingRaw = await fetchAll("following", userId, 53, 98);
      setFetchProgress(100, "Done — rendering…");

      const payload = {
        account:
          window._sharedData?.config?.viewer?.username ||
          (followersRaw[0] && followingRaw[0] ? "you" : "logged in user"),
        followers: normalize(followersRaw.map((u) => u.username)),
        following: normalize(followingRaw.map((u) => u.username)),
        followersRaw,
        followingRaw,
      };

      renderOverlay(payload);
      setTimeout(removeFetchProgress, 1000);
      console.log("[GhostWatcher] Done:", {
        followers: payload.followers.length,
        following: payload.following.length,
      });
      return payload;
    } catch (err) {
      setFetchProgress(100, "Error — see console");
      console.error("[GhostWatcher] Error:", err);
      const status = panel.querySelector(".gw-load-text");
      if (status) status.textContent = "⚠ " + (err.message || "Failed. Are you logged in?");
    } finally {
      if (refreshBtn) refreshBtn.disabled = false;
    }
  }

  return await doFetch();
})();