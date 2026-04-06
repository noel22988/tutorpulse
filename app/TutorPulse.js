"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";

// ═══════════════════════════════════════════════════════════════
// TUTORPULSE — Intelligent Tutor Scheduling & Fee Management
// Built for Teacher Leon's Bilingual Academy
// ═══════════════════════════════════════════════════════════════

// ── Data Store (in-memory with persistence) ─────────────────
const STORAGE_KEY = "tutorpulse-data";
const BACKUP_PREFIX = "tutorpulse-backup-";
const MAX_BACKUPS = 7;

const createStore = () => {
  return { students: [], lessons: [], payments: [], messages: [], notifications: [], revenueHistory: [], classes: [], blocks: [], paymentLog: [], settings: { tutorName: "", phWarnings: true } };
};

// ── Persistence helpers ─────────────────────────────────────
const loadStore = async () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // Key doesn't exist yet or storage unavailable
  }
  return null;
};

const saveStore = async (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save:", e);
  }
};

const autoBackup = (data) => {
  try {
    if (!window.localStorage) return;
    const now = new Date();
    // Only backup if past 2am
    if (now.getHours() < 2) return;
    const today = now.toISOString().split("T")[0];
    const backupKey = BACKUP_PREFIX + today;
    // Skip if today's backup already exists
    if (window.localStorage.getItem(backupKey)) return;
    window.localStorage.setItem(backupKey, JSON.stringify(data));
    // Clean old backups beyond MAX_BACKUPS
    const allKeys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(BACKUP_PREFIX)) allKeys.push(key);
    }
    allKeys.sort().reverse();
    allKeys.slice(MAX_BACKUPS).forEach(key => window.localStorage.removeItem(key));
  } catch (e) { /* backup is best-effort */ }
};

const listBackups = () => {
  const backups = [];
  try {
    if (!window.localStorage) return backups;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(BACKUP_PREFIX)) {
        const date = key.replace(BACKUP_PREFIX, "");
        const raw = window.localStorage.getItem(key);
        const size = raw ? Math.round(raw.length / 1024) : 0;
        backups.push({ key, date, size });
      }
    }
  } catch (e) {}
  return backups.sort((a, b) => b.date.localeCompare(a.date));
};

const restoreBackup = (key) => {
  try {
    const raw = window.localStorage ? window.localStorage.getItem(key) : null;
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
};

// ── Icons (inline SVG components) ───────────────────────────
const Icon = ({ name, size = 20, color = "currentColor", className = "" }) => {
  const icons = {
    calendar: <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
    dollar: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
    message: <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></>,
    chart: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
    ai: <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    crown: <><path d="M2 20h20M4 20l2-14 4 6 2-8 2 8 4-6 2 14"/></>,
    filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    chevDown: <polyline points="6 9 12 15 18 9"/>,
    chevUp: <polyline points="6 15 12 9 18 15"/>,
    chevRight: <polyline points="9 18 15 12 9 6"/>,
    arrowLeft: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
    repeat: <><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></>,
    download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    phone: <><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></>,
    mapPin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    book: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
    award: <><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ flexShrink: 0 }}>
      {icons[name]}
    </svg>
  );
};

// ── Theme & Styles ──────────────────────────────────────────
const theme = {
  bg: "#0A0E17",
  bgCard: "#111827",
  bgCardHover: "#1A2332",
  bgElevated: "#1E293B",
  bgInput: "#0F172A",
  border: "#1E293B",
  borderLight: "#2D3B4F",
  text: "#F1F5F9",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  accent: "#F59E0B",
  accentLight: "#FBBF24",
  accentDark: "#D97706",
  accentBg: "rgba(245, 158, 11, 0.1)",
  accentBgStrong: "rgba(245, 158, 11, 0.2)",
  success: "#10B981",
  successBg: "rgba(16, 185, 129, 0.1)",
  danger: "#EF4444",
  dangerBg: "rgba(239, 68, 68, 0.1)",
  warning: "#F59E0B",
  warningBg: "rgba(245, 158, 11, 0.1)",
  info: "#3B82F6",
  infoBg: "rgba(59, 130, 246, 0.1)",
  purple: "#8B5CF6",
  purpleBg: "rgba(139, 92, 246, 0.1)",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:wght@400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --bg: ${theme.bg};
    --bg-card: ${theme.bgCard};
    --bg-elevated: ${theme.bgElevated};
    --border: ${theme.border};
    --text: ${theme.text};
    --text-secondary: ${theme.textSecondary};
    --accent: ${theme.accent};
  }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${theme.borderLight}; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: ${theme.textMuted}; }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes glow { 0%, 100% { box-shadow: 0 0 5px rgba(245, 158, 11, 0.3); } 50% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.6); } }

  .fade-in { animation: fadeIn 0.3s ease-out; }
  .slide-up { animation: slideUp 0.4s ease-out; }
  .stagger-1 { animation-delay: 0.05s; animation-fill-mode: both; }
  .stagger-2 { animation-delay: 0.1s; animation-fill-mode: both; }
  .stagger-3 { animation-delay: 0.15s; animation-fill-mode: both; }
  .stagger-4 { animation-delay: 0.2s; animation-fill-mode: both; }

  .glass {
    background: rgba(17, 24, 39, 0.8);
    backdrop-filter: blur(12px);
    border: 1px solid ${theme.border};
  }

  input, textarea, select {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
  }

  textarea { resize: vertical; }
`;

// ── Utility Functions ───────────────────────────────────────
const REFERRAL_OPTIONS = [
  { value: "", label: "— Not specified —" },
  { value: "word_of_mouth", label: "Word of mouth (parent referral)" },
  { value: "former_student", label: "Former student" },
  { value: "tutor_agency", label: "Tutor agency" },
  { value: "social_media", label: "Social media" },
  { value: "school_recommendation", label: "School recommendation" },
  { value: "existing_sibling", label: "Existing sibling" },
  { value: "other", label: "Other" },
];
const SG_HOLIDAYS = [
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-02-17", name: "Chinese New Year" },
  { date: "2026-02-18", name: "Chinese New Year" },
  { date: "2026-03-21", name: "Hari Raya Puasa" },
  { date: "2026-04-03", name: "Good Friday" },
  { date: "2026-05-01", name: "Labour Day" },
  { date: "2026-05-27", name: "Hari Raya Haji" },
  { date: "2026-05-31", name: "Vesak Day" },
  { date: "2026-06-01", name: "Vesak Day (observed)" },
  { date: "2026-08-09", name: "National Day" },
  { date: "2026-08-10", name: "National Day (observed)" },
  { date: "2026-11-08", name: "Deepavali" },
  { date: "2026-11-09", name: "Deepavali (observed)" },
  { date: "2026-12-25", name: "Christmas Day" },
  { date: "2027-01-01", name: "New Year's Day" },
  { date: "2027-02-06", name: "Chinese New Year" },
  { date: "2027-02-07", name: "Chinese New Year" },
  { date: "2027-03-10", name: "Hari Raya Puasa" },
  { date: "2027-03-26", name: "Good Friday" },
  { date: "2027-05-01", name: "Labour Day" },
  { date: "2027-05-17", name: "Hari Raya Haji" },
  { date: "2027-05-20", name: "Vesak Day" },
  { date: "2027-08-09", name: "National Day" },
  { date: "2027-10-28", name: "Deepavali" },
  { date: "2027-12-25", name: "Christmas Day" },
  { date: "2028-01-01", name: "New Year's Day" },
  { date: "2028-01-26", name: "Chinese New Year" },
  { date: "2028-01-27", name: "Chinese New Year" },
  { date: "2028-02-28", name: "Hari Raya Puasa" },
  { date: "2028-04-14", name: "Good Friday" },
  { date: "2028-05-01", name: "Labour Day" },
  { date: "2028-05-06", name: "Hari Raya Haji" },
  { date: "2028-05-18", name: "Vesak Day" },
  { date: "2028-08-09", name: "National Day" },
  { date: "2028-11-15", name: "Deepavali" },
  { date: "2028-12-25", name: "Christmas Day" },
];
const getHoliday = (dateStr) => SG_HOLIDAYS.find(h => h.date === dateStr);

const LEVEL_OPTIONS = [
  { value: "P1", label: "Primary 1" }, { value: "P2", label: "Primary 2" }, { value: "P3", label: "Primary 3" },
  { value: "P4", label: "Primary 4" }, { value: "P5", label: "Primary 5" }, { value: "P6", label: "Primary 6" },
  { value: "Sec 1", label: "Secondary 1" }, { value: "Sec 2", label: "Secondary 2" },
  { value: "Sec 3", label: "Secondary 3" }, { value: "Sec 4", label: "Secondary 4" },
  { value: "Sec 5", label: "Secondary 5" },
  { value: "JC 1", label: "JC 1" }, { value: "JC 2", label: "JC 2" },
  { value: "Other", label: "Other" },
];
const SUBJECT_OPTIONS = [
  { value: "English", label: "English" },
  { value: "Chinese", label: "Chinese" },
  { value: "Mathematics", label: "Mathematics" },
  { value: "Science", label: "Science" },
  { value: "E Math", label: "E Math" },
  { value: "A Math", label: "A Math" },
  { value: "Physics", label: "Physics" },
  { value: "Chemistry", label: "Chemistry" },
  { value: "Biology", label: "Biology" },
  { value: "Combined Science", label: "Combined Science" },
  { value: "Geography", label: "Geography" },
  { value: "History", label: "History" },
  { value: "Literature", label: "Literature" },
  { value: "Combined Humanities", label: "Combined Humanities" },
  { value: "Food and Nutrition", label: "Food and Nutrition" },
  { value: "Design and Technology", label: "Design and Technology" },
  { value: "Other", label: "Other" },
];
const STREAM_OPTIONS = [
  { value: "Foundation", label: "Foundation" },
  { value: "Standard", label: "Standard" },
  { value: "Higher", label: "Higher" },
  { value: "G1", label: "G1" },
  { value: "G2", label: "G2" },
  { value: "G3", label: "G3" },
  { value: "H1", label: "H1" },
  { value: "H2", label: "H2" },
  { value: "H3", label: "H3" },
  { value: "Other", label: "Other" },
];
const formatDate = (d) => {
  const date = new Date(d);
  return date.toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" });
};
const formatTime = (d) => {
  const date = new Date(d);
  return date.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", hour12: true });
};
const formatMonth = (m) => {
  const [y, mo] = m.split("-");
  return new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString("en-SG", { month: "long", year: "numeric" });
};
const genId = () => Math.random().toString(36).substr(2, 9);
const getStatusColor = (s) => {
  const map = { confirmed: theme.success, pending: theme.warning, cancelled: theme.danger, completed: theme.info, paid: theme.success, overdue: theme.danger, active: theme.success, trial: theme.info, paused: theme.textMuted, graduated: theme.purple };
  return map[s] || theme.textSecondary;
};
const getStatusBg = (s) => {
  const map = { confirmed: theme.successBg, pending: theme.warningBg, cancelled: theme.dangerBg, completed: theme.infoBg, paid: theme.successBg, overdue: theme.dangerBg, active: theme.successBg, trial: theme.infoBg, paused: "rgba(100,116,139,0.1)", graduated: "rgba(168,85,247,0.1)" };
  return map[s] || "rgba(148,163,184,0.1)";
};

// ── Reusable Components ─────────────────────────────────────
const Badge = ({ text, color, bg }) => (
  <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase", color: color, background: bg }}>
    {text}
  </span>
);

const Button = ({ children, variant = "primary", size = "md", onClick, style = {}, disabled = false, icon }) => {
  const base = { display: "inline-flex", alignItems: "center", gap: 6, border: "none", borderRadius: 10, cursor: disabled ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, transition: "all 0.2s", opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap" };
  const sizes = { sm: { padding: "6px 12px", fontSize: 12 }, md: { padding: "10px 20px", fontSize: 14 }, lg: { padding: "14px 28px", fontSize: 16 } };
  const variants = {
    primary: { background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`, color: "#0A0E17", boxShadow: "0 2px 12px rgba(245, 158, 11, 0.3)" },
    secondary: { background: theme.bgElevated, color: theme.text, border: `1px solid ${theme.borderLight}` },
    ghost: { background: "transparent", color: theme.textSecondary },
    danger: { background: theme.dangerBg, color: theme.danger },
    success: { background: theme.successBg, color: theme.success },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
};

const Card = ({ children, style = {}, onClick, hover = false }) => (
  <div onClick={onClick} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 20, transition: "all 0.2s", cursor: onClick ? "pointer" : "default", ...style }} onMouseEnter={(e) => { if (hover) { e.currentTarget.style.background = theme.bgCardHover; e.currentTarget.style.borderColor = theme.borderLight; }}} onMouseLeave={(e) => { if (hover) { e.currentTarget.style.background = theme.bgCard; e.currentTarget.style.borderColor = theme.border; }}}>
    {children}
  </div>
);

const Input = ({ label, value, onChange, type = "text", placeholder, style = {}, multiline = false }) => (
  <div style={{ marginBottom: 16, ...style }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</label>}
    {multiline ? (
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ width: "100%", padding: "10px 14px", background: theme.bgInput, border: `1px solid ${theme.border}`, borderRadius: 10, color: theme.text, outline: "none", fontSize: 14 }} />
    ) : (
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "10px 14px", background: theme.bgInput, border: `1px solid ${theme.border}`, borderRadius: 10, color: theme.text, outline: "none", fontSize: 14 }} />
    )}
  </div>
);

const PhoneInput = ({ label, value, onChange, style = {} }) => {
  // Storage format: "65|91234567" (code|number) or legacy "6591234567" / "+65 91234567"
  const parsePhone = (v) => {
    const raw = (v || "");
    // New format with separator
    if (raw.includes("|")) {
      const [c, n] = raw.split("|");
      return { code: c || "65", num: n || "" };
    }
    // Legacy: strip formatting
    const clean = raw.replace(/[\s\-()]/g, "");
    if (!clean) return { code: "65", num: "" };
    if (clean.startsWith("+")) {
      const codes = ["856","855","673","852","853","886","971","966","974","968","973","965","254","234","65","60","62","66","63","84","95","91","86","81","82","61","64","44","33","49","39","34","31","46","41","27","55","52","1"];
      const digits = clean.substring(1);
      for (const c of codes) { if (digits.startsWith(c) && digits.length > c.length) return { code: c, num: digits.substring(c.length) }; }
      return { code: "65", num: digits };
    }
    // Legacy bare digits — only split if long enough to have code + number
    if (clean.length >= 10) {
      const codes3 = ["856","855","673","852","853","886","971","966","974","968","973","965","254","234"];
      const codes2 = ["65","60","62","66","63","84","95","91","86","81","82","61","64","44","33","49","39","34","31","46","41","27","55","52"];
      for (const c of codes3) { if (clean.startsWith(c)) return { code: c, num: clean.substring(c.length) }; }
      for (const c of codes2) { if (clean.startsWith(c)) return { code: c, num: clean.substring(c.length) }; }
    }
    if (clean.length === 8 && /^[689]/.test(clean)) return { code: "65", num: clean };
    return { code: "65", num: clean };
  };
  const { code, num } = parsePhone(value);
  const update = (newCode, newNum) => onChange(newCode + "|" + newNum);
  return (
    <div style={{ marginBottom: 16, ...style }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</label>}
      <div style={{ display: "flex", gap: 6 }}>
        <select value={code} onChange={(e) => update(e.target.value, num)} style={{ width: 82, padding: "10px 4px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 10, color: theme.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>
          <option value="65">🇸🇬 +65</option><option value="60">🇲🇾 +60</option><option value="62">🇮🇩 +62</option><option value="66">🇹🇭 +66</option><option value="63">🇵🇭 +63</option><option value="84">🇻🇳 +84</option><option value="95">🇲🇲 +95</option><option value="856">🇱🇦 +856</option><option value="855">🇰🇭 +855</option><option value="673">🇧🇳 +673</option>
          <option value="91">🇮🇳 +91</option><option value="86">🇨🇳 +86</option><option value="852">🇭🇰 +852</option><option value="853">🇲🇴 +853</option><option value="886">🇹🇼 +886</option><option value="81">🇯🇵 +81</option><option value="82">🇰🇷 +82</option>
          <option value="61">🇦🇺 +61</option><option value="64">🇳🇿 +64</option><option value="44">🇬🇧 +44</option><option value="1">🇺🇸 +1</option><option value="33">🇫🇷 +33</option><option value="49">🇩🇪 +49</option><option value="39">🇮🇹 +39</option><option value="34">🇪🇸 +34</option><option value="31">🇳🇱 +31</option><option value="46">🇸🇪 +46</option><option value="41">🇨🇭 +41</option>
          <option value="971">🇦🇪 +971</option><option value="966">🇸🇦 +966</option><option value="974">🇶🇦 +974</option><option value="968">🇴🇲 +968</option><option value="973">🇧🇭 +973</option><option value="965">🇰🇼 +965</option>
          <option value="27">🇿🇦 +27</option><option value="234">🇳🇬 +234</option><option value="254">🇰🇪 +254</option><option value="55">🇧🇷 +55</option><option value="52">🇲🇽 +52</option>
        </select>
        <input type="tel" value={num} onChange={(e) => { const v = e.target.value.replace(/\D/g, "").substring(0, 12); update(code, v); }} placeholder="Phone number" style={{ flex: 1, padding: "10px 14px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 10, color: theme.text, outline: "none", fontSize: 14 }} />
      </div>
    </div>
  );
};

const Select = ({ label, value, onChange, options, style = {} }) => (
  <div style={{ marginBottom: 16, ...style }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</label>}
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: theme.bgInput, border: `1px solid ${theme.border}`, borderRadius: 10, color: theme.text, outline: "none", fontSize: 14, cursor: "pointer", appearance: "none" }}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Avatar = ({ initials, size = 40, color = theme.accent }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg, ${color}22, ${color}44)`, border: `2px solid ${color}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, color: color, flexShrink: 0, letterSpacing: 0.5 }}>
    {initials}
  </div>
);

const StatCard = ({ icon, label, value, sub, color = theme.accent }) => (
  <Card style={{ flex: 1, minWidth: 150 }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 500, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: theme.text, fontFamily: "'Playfair Display', serif" }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>{sub}</div>}
      </div>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={20} color={color} />
      </div>
    </div>
  </Card>
);

const EmptyState = ({ icon, title, sub }) => (
  <div style={{ textAlign: "center", padding: 40, color: theme.textMuted }}>
    <Icon name={icon} size={48} color={theme.borderLight} />
    <div style={{ fontSize: 16, fontWeight: 600, marginTop: 12, color: theme.textSecondary }}>{title}</div>
    <div style={{ fontSize: 13, marginTop: 4 }}>{sub}</div>
  </div>
);

const modalScrollPositions = {};
const Modal = ({ open, onClose, title, children, width = 480 }) => {
  const scrollRef = useRef(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !title) return;
    // Restore scroll
    if (modalScrollPositions[title]) el.scrollTop = modalScrollPositions[title];
    const handler = () => { modalScrollPositions[title] = el.scrollTop; };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  });
  // Reset scroll tracking when modal closes
  useEffect(() => {
    if (!open && title) { delete modalScrollPositions[title]; }
  }, [open, title]);
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div ref={scrollRef} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 20, width: "90%", maxWidth: width, maxHeight: "85vh", overflow: "auto", padding: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${theme.border}`, position: "sticky", top: 0, background: theme.bgCard, zIndex: 1, borderRadius: "20px 20px 0 0" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMuted, padding: 4 }}><Icon name="x" size={20} /></button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
};

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", gap: 2, background: theme.bgInput, borderRadius: 12, padding: 3, marginBottom: 20 }}>
    {tabs.map((t) => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{ flex: 1, padding: "8px 16px", borderRadius: 10, border: "none", background: active === t.id ? theme.bgElevated : "transparent", color: active === t.id ? theme.text : theme.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif" }}>
        {t.label}
      </button>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function TutorPulse() {
  const [store, setStore] = useState(createStore);
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState("home");
  const [showNotif, setShowNotif] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showNewLesson, setShowNewLesson] = useState(false);
  const [prefillStudentId, setPrefillStudentId] = useState(null);
  const [newLessonForStudent, setNewLessonForStudent] = useState(null);
  const [showNewStudent, setShowNewStudent] = useState(false);
  const [showMessageCompose, setShowMessageCompose] = useState(null);
  const [messageTarget, setMessageTarget] = useState("parent");
  const [includeSiblings, setIncludeSiblings] = useState(false); // "parent" or "student"
  const [showAI, setShowAI] = useState(false);
  const [aiSugIdx, setAiSugIdx] = useState(0);
  // Class state
  const [studentsTab, setStudentsTab] = useState("students"); // "students" or "classes"
  const [selectedClass, setSelectedClass] = useState(null);
  const [showNewClass, setShowNewClass] = useState(false);
  const [editingClass, setEditingClass] = useState(false);
  const [classForm, setClassForm] = useState({ name: "", day: "", time: "15:00", duration: "90", location: "Home Studio", subject: "Chinese", stream: "Standard", studentIds: [], notes: "", status: "active" });
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastClassId, setBroadcastClassId] = useState(null);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastRecipients, setBroadcastRecipients] = useState(new Set());
  const [broadcastSentIdx, setBroadcastSentIdx] = useState(-1);
  const broadcastRef = useRef(null);
  const [showBlockTime, setShowBlockTime] = useState(false);
  const [blockForm, setBlockForm] = useState({ date: "", time: "09:00", duration: "60", label: "", allDay: false, recurrence: "none", endDate: "" });
  const [classSchedMode, setClassSchedMode] = useState(false);
  const [classSchedDate, setClassSchedDate] = useState(new Date().toISOString().split("T")[0]);
  const [classSchedEndDate, setClassSchedEndDate] = useState("");
  const [classSchedRecurring, setClassSchedRecurring] = useState(false);
  const [classSchedType, setClassSchedType] = useState("single"); // "single", "weekly", "daily"
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState([]);

  // Load aiHistory from store after store is loaded
  useEffect(() => {
    if (loaded && store.aiHistory && store.aiHistory.length > 0 && aiHistory.length === 0) {
      setAiHistory(store.aiHistory);
    }
  }, [loaded, store.aiHistory]);

  // Save aiHistory to store when it changes
  const updateAiHistory = (newHistory) => {
    setAiHistory(newHistory);
    setStore(s => ({ ...s, aiHistory: newHistory }));
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [studentFilter, setStudentFilter] = useState("all");
  const searchRef = useRef("");
  const [scheduleViewMode, setScheduleViewMode] = useState("today");
  const [schedCalOpen, setSchedCalOpen] = useState(false);
  const [schedNavDate, setSchedNavDate] = useState(new Date()); // nav anchor for today/week/month views
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [monthView, setMonthView] = useState(() => {
    const n = new Date();
    return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0");
  });
  const [onboarded, setOnboarded] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [lessonComment, setLessonComment] = useState("");

  // ── Load persisted data on mount ────────────────────────────
  useEffect(() => {
    loadStore().then((saved) => {
      if (saved) setStore(saved);
      setLoaded(true);
    });
  }, []);

  // ── Save to persistent storage (debounced to avoid typing lag) ──
  const saveTimerRef = useRef(null);
  useEffect(() => {
    if (loaded) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveStore(store), 500);
    }
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [store, loaded]);
  const [adminTab, setAdminTab] = useState("overview");

  const addToast = useCallback((msg, type = "success") => {
    const id = genId();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  const updateLesson = useCallback((id, updates) => {
    setStore((s) => ({ ...s, lessons: s.lessons.map((l) => l.id === id ? { ...l, ...updates } : l) }));
  }, []);

  const updatePayment = useCallback((id, updates) => {
    setStore((s) => ({ ...s, payments: s.payments.map((p) => p.id === id ? { ...p, ...updates } : p) }));
  }, []);

  const addLesson = useCallback((lesson) => {
    setStore((s) => ({ ...s, lessons: [...s.lessons, { ...lesson, id: "l" + genId() }] }));
    addToast("Lesson scheduled successfully");
  }, [addToast]);

  const deleteLesson = useCallback((id) => {
    setStore((s) => ({ ...s, lessons: s.lessons.filter((l) => l.id !== id) }));
    addToast("Lesson deleted");
  }, [addToast]);

  const addStudent = useCallback((student) => {
    setStore((s) => ({ ...s, students: [...s.students, { ...student, id: "s" + genId() }] }));
    addToast("Student added successfully");
  }, [addToast]);

  const updateStudent = useCallback((id, updates) => {
    setStore((s) => ({ ...s, students: s.students.map((st) => st.id === id ? { ...st, ...updates } : st) }));
  }, []);

  const deleteStudent = useCallback((id) => {
    setStore((s) => ({
      ...s,
      students: s.students.filter((st) => st.id !== id),
      lessons: s.lessons.filter((l) => l.studentId !== id),
      payments: s.payments.filter((p) => p.studentId !== id),
      messages: s.messages.filter((m) => m.parentId !== id),
    }));
  }, []);

  const getStudent = useCallback((id) => store.students.find((s) => s.id === id), [store.students]);

  // ── Class CRUD ──────────────────────────────────────────────
  const addClass = useCallback((cls) => { setStore((s) => ({ ...s, classes: [...(s.classes || []), { id: "c" + genId(), ...cls }] })); }, []);
  const updateClass = useCallback((id, updates) => { setStore((s) => ({ ...s, classes: (s.classes || []).map(c => c.id === id ? { ...c, ...updates } : c) })); }, []);
  const deleteClass = useCallback((id) => { setStore((s) => ({ ...s, classes: (s.classes || []).filter(c => c.id !== id) })); }, []);
  const getClass = useCallback((id) => (store.classes || []).find(c => c.id === id), [store.classes]);
  const addBlock = useCallback((block) => { setStore((s) => ({ ...s, blocks: [...(s.blocks || []), { id: "b" + genId(), ...block }] })); }, []);
  const deleteBlock = useCallback((id) => { setStore((s) => ({ ...s, blocks: (s.blocks || []).filter(b => b.id !== id) })); }, []);

  const getStudentClasses = useCallback((studentId) => (store.classes || []).filter(c => (c.studentIds || []).includes(studentId)), [store.classes]);

  // ── Hourly rate → Monthly fee calculator ─────────────────────
  // Sums (hourlyRate × hours) for each non-cancelled lesson in the month
  const calcMonthlyFee = useCallback((studentId, monthStr) => {
    const s = store.students.find((st) => st.id === studentId);
    if (!s) return { sessions: 0, rate: 0, totalHours: 0, total: 0 };
    const [y, mo] = monthStr.split("-").map(Number);
    const lessons = store.lessons.filter((l) => {
      const d = new Date(l.date);
      return l.studentId === studentId && d.getFullYear() === y && d.getMonth() === mo - 1 && (l.status !== "cancelled" || l.collectedButCancelled) && !l.excludeFromBilling;
    });
    const totalMinutes = lessons.reduce((sum, l) => sum + l.duration, 0);
    const totalHours = totalMinutes / 60;
    const total = Math.round(s.hourlyRate * totalHours * 100) / 100;
    return { sessions: lessons.length, rate: s.hourlyRate, totalHours, total };
  }, [store.students, store.lessons]);

  // ── Clock tick — refreshes every 60s so dashboard stays current ──
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-backup: check on load + every 30 min (like WhatsApp 2am backup)
  useEffect(() => {
    if (loaded && store.students.length > 0) autoBackup(store);
    const backupInterval = setInterval(() => {
      if (store.students.length > 0) autoBackup(store);
    }, 30 * 60 * 1000);
    return () => clearInterval(backupInterval);
  }, [loaded]);

  const todayLessons = useMemo(() => {
    return store.lessons.filter((l) => {
      const d = new Date(l.date);
      const endTime = new Date(d.getTime() + l.duration * 60000);
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        && endTime > now && l.status !== "completed" && l.status !== "cancelled";
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [store.lessons, now]);

  const upcomingLessons = useMemo(() => {
    return store.lessons.filter((l) => {
      const d = new Date(l.date);
      const endTime = new Date(d.getTime() + l.duration * 60000);
      return endTime > now && l.status !== "completed" && l.status !== "cancelled";
    }).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 8);
  }, [store.lessons, now]);

  const pendingPayments = useMemo(() => {
    const currentMonth = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    const activeIds = store.students.filter(s => s.status === "active" || s.status === "trial").map(s => s.id);
    // Students with lessons this month who haven't paid
    const studentsWithLessons = new Set();
    store.lessons.forEach(l => {
      const d = new Date(l.date);
      const lMonth = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      if (lMonth === currentMonth && l.status !== "cancelled" && activeIds.includes(l.studentId)) studentsWithLessons.add(l.studentId);
    });
    const paidStudents = new Set(store.payments.filter(p => p.month === currentMonth && p.status === "paid").map(p => p.studentId));
    return Array.from(studentsWithLessons).filter(sid => !paidStudents.has(sid));
  }, [store.students, store.lessons, store.payments, now]);
  const activeStudents = useMemo(() => store.students.filter((s) => s.status === "active"), [store.students]);
  const monthlyRevenue = useMemo(() => store.payments.filter((p) => p.status === "paid" && p.month === "2026-02").reduce((sum, p) => {
    const calc = calcMonthlyFee(p.studentId, p.month);
    return sum + calc.total;
  }, 0), [store.payments, calcMonthlyFee]);
  const unreadNotifs = useMemo(() => store.notifications.filter((n) => !n.read).length, [store.notifications]);

  // ── AI Assistant ────────────────────────────────────────────
  const [aiConversation, setAiConversation] = useState([]);

  const callAI = useCallback(async (prompt, isFollowUp = false) => {
    setAiLoading(true);
    if (!isFollowUp) {
      setAiResult("");
      setAiConversation([]);
    }
    try {
      const tutorName = store.settings?.tutorName || "the tutor";
      const currentMonth = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
      // Build rich context with actual data
      const studentDetails = store.students.map(s => {
        const lessons = store.lessons.filter(l => l.studentId === s.id);
        const monthLessons = lessons.filter(l => { const d = new Date(l.date); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") === currentMonth && (l.status !== "cancelled" || l.collectedButCancelled) && !l.excludeFromBilling; });
        const totalHours = monthLessons.reduce((sum, l) => sum + l.duration, 0) / 60;
        const fee = Math.round(s.hourlyRate * totalHours * 100) / 100;
        const paid = store.payments.find(p => p.studentId === s.id && p.month === currentMonth && p.status === "paid");
        return s.name + " (" + s.level + " " + (s.subject || "") + " " + s.stream + ", $" + s.hourlyRate + "/hr, " + monthLessons.length + " lessons this month, " + totalHours + "h, fee: $" + fee + ", " + (paid ? "PAID" : "UNPAID") + ", status: " + s.status + ")";
      }).join("; ");
      const totalRevenue = store.students.filter(s => s.status === "active").reduce((sum, s) => {
        const calc = calcMonthlyFee(s.id, currentMonth);
        return sum + calc.total;
      }, 0);
      const context = `You are TutorPulse AI, an assistant for ${tutorName} who runs a tuition business. Current month: ${now.toLocaleDateString("en-SG", { month: "long", year: "numeric" })}. Total active students: ${activeStudents.length}. Projected monthly revenue: $${totalRevenue.toFixed(2)}. Unpaid this month: ${pendingPayments.length}. Student details: ${studentDetails}. Respond concisely and helpfully. Do not use markdown formatting like ** or # or *.`;
      const messages = isFollowUp ? [...aiConversation, { role: "user", content: prompt }] : [{ role: "user", content: prompt }];
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: context,
          messages: messages,
        }),
      });
      const data = await response.json();
      const text = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
      const result = text || "I couldn't generate a response. Please try again.";
      setAiResult(result);
      const updatedConvo = [...messages, { role: "assistant", content: result }];
      setAiConversation(updatedConvo);
      // Save to history — store full thread
      if (!isFollowUp) {
        updateAiHistory([{ q: prompt, a: result, conversation: updatedConvo, time: new Date().toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" }) }, ...aiHistory].slice(0, 20));
      } else {
        // Update the latest history entry with the extended conversation
        const updated = [...aiHistory];
        if (updated.length > 0) {
          updated[0] = { ...updated[0], conversation: updatedConvo, a: result };
        }
        updateAiHistory(updated);
      }
    } catch (err) {
      setAiResult("AI is temporarily unavailable. Please try again later.");
    }
    setAiLoading(false);
  }, [activeStudents.length, pendingPayments.length, store.students, store.lessons, store.payments, store.settings, aiConversation, aiHistory, now, calcMonthlyFee]);

  // ── Navigation ─────────────────────────────────────────────
  const navItems = [
    { id: "home", icon: "home", label: "Home" },
    { id: "schedule", icon: "calendar", label: "Schedule" },
    { id: "students", icon: "users", label: "Students" },
    { id: "payments", icon: "dollar", label: "Fees" },
    { id: "admin", icon: "chart", label: "Admin" },
  ];

  // ═══════════════════════════════════════════════════════════
  // PAGE: HOME DASHBOARD
  // ═══════════════════════════════════════════════════════════
  const HomePage = () => (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: theme.textMuted, fontWeight: 500, marginBottom: 4 }}>
          {now.toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Playfair Display', serif", lineHeight: 1.2 }}>
          Hi, {store.settings?.tutorName || "there"}
        </h1>
      </div>

      {/* Stats Row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, overflowX: "auto", paddingBottom: 4, alignItems: "stretch" }}>
        <div onClick={() => setPage("students")} style={{ flex: "0 0 150px", cursor: "pointer", display: "flex" }}><StatCard icon="users" label="Active Students" value={activeStudents.length} sub={`${store.students.filter(s => s.status === "trial").length} on trial`} /></div>
        <div onClick={() => setPage("schedule")} style={{ flex: "0 0 150px", cursor: "pointer", display: "flex" }}><StatCard icon="calendar" label="Today's Lessons" value={todayLessons.length} sub={(() => { const tmr = new Date(now); tmr.setDate(tmr.getDate() + 1); const tmrCount = store.lessons.filter(l => { const d = new Date(l.date); return d.getDate() === tmr.getDate() && d.getMonth() === tmr.getMonth() && d.getFullYear() === tmr.getFullYear() && l.status !== "cancelled"; }).length; return tmrCount + " tomorrow"; })()} color={theme.info} /></div>
        <div onClick={() => setPage("payments")} style={{ flex: "0 0 150px", cursor: "pointer", display: "flex" }}><StatCard icon="dollar" label="This Month" value={`$${store.students.filter(s => s.status === "active").reduce((sum, s) => sum + calcMonthlyFee(s.id, now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0")).total, 0).toLocaleString()}`} sub={(() => {
          const cm = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
          let count = 0;
          pendingPayments.forEach(sid => {
            const s = getStudent(sid);
            if (s && s.paymentMode === "per_lesson") {
              count += store.lessons.filter(l => { const d = new Date(l.date); return l.studentId === sid && d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") === cm && (l.status !== "cancelled" || l.collectedButCancelled) && !l.excludeFromBilling && !store.payments.find(p => p.studentId === sid && p.month === cm && p.lessonId === l.id && p.status === "paid"); }).length;
            } else { count++; }
          });
          return count + " unpaid";
        })()} color={theme.success} /></div>
      </div>

      {/* Today's Schedule */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Today's Schedule</h2>
          <Button variant="ghost" size="sm" onClick={() => setPage("schedule")}>View all →</Button>
        </div>
        {todayLessons.length === 0 ? (
          <Card><EmptyState icon="calendar" title="No lessons today" sub="Enjoy your day off!" /></Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {todayLessons.map((lesson, i) => {
              const student = getStudent(lesson.studentId);
              return (
                <Card key={lesson.id} hover onClick={() => { setSelectedLesson(lesson); setLessonComment(lesson.comment || ""); }} style={{ padding: 16 }} className={`slide-up stagger-${i + 1}`}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 4, height: 48, borderRadius: 2, background: getStatusColor(lesson.status), flexShrink: 0 }} />
                    <Avatar initials={student ? student.avatar : "?"} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{student ? student.name : "Unknown"}</div>
                      <div style={{ fontSize: 12, color: theme.textSecondary }}>{lesson.subject}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: theme.accent }}>{formatTime(lesson.date)}</div>
                      <div style={{ fontSize: 11, color: theme.textMuted }}>{lesson.duration} min · {lesson.location}</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Backup Reminder */}
      {(() => {
        if ((store.settings || {}).backupReminder === false) return null;
        const lastExport = localStorage.getItem("tutorpulse-last-export");
        const snoozed = localStorage.getItem("tutorpulse-backup-snoozed");
        const daysSince = lastExport ? Math.floor((Date.now() - new Date(lastExport).getTime()) / 86400000) : null;
        const snoozeDays = snoozed ? Math.floor((Date.now() - new Date(snoozed).getTime()) / 86400000) : 999;
        const shouldShow = store.students.length > 0 && (daysSince === null || daysSince >= 7) && snoozeDays >= 7;
        return shouldShow ? (
          <Card style={{ marginBottom: 16, padding: 14, borderColor: theme.accent + "44", background: theme.accentBg }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Icon name="download" size={18} color={theme.accent} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: theme.accent }}>Save a copy to your phone</div>
                <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>Your data is safe in the app. This protects you if you switch phones or clear your browser.</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => {
                const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = "TutorPulse-Backup-" + new Date().toISOString().split("T")[0] + ".json"; a.click(); URL.revokeObjectURL(url);
                localStorage.setItem("tutorpulse-last-export", new Date().toISOString());
                addToast("Backup downloaded");
              }} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid " + theme.accent, background: "transparent", color: theme.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Download copy</button>
              <button onClick={() => { localStorage.setItem("tutorpulse-backup-snoozed", new Date().toISOString()); addToast("Reminder snoozed"); }} style={{ background: "none", border: "none", color: theme.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Remind me next week</button>
            </div>
          </Card>
        ) : null;
      })()}

      {/* Getting Started Checklist */}
      {(() => {
        if (localStorage.getItem("tutorpulse-checklist-dismissed")) return null;
        const items = [
          { label: "Set your name", done: !!(store.settings || {}).tutorName, action: () => setPage("admin") },
          { label: "Add your first student", done: store.students.length > 0, action: () => setShowNewStudent(true) },
          { label: "Schedule your first lesson", done: store.lessons.length > 0, action: () => setShowNewLesson(true) },
          { label: "Record your first payment", done: store.payments.length > 0, action: () => setPage("payments") },
          { label: "Try the AI Assistant", done: aiHistory.length > 0, action: () => setShowAI(true) },
        ];
        const completed = items.filter(i => i.done).length;
        if (completed === items.length) { if (!localStorage.getItem("tutorpulse-checklist-done")) localStorage.setItem("tutorpulse-checklist-done", "true"); return null; }
        return (
          <Card style={{ marginBottom: 16, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Getting Started</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: theme.textMuted }}>{completed}/{items.length}</span>
                <button onClick={() => { localStorage.setItem("tutorpulse-checklist-dismissed", "true"); addToast("Checklist hidden"); }} style={{ background: "none", border: "none", color: theme.textMuted, fontSize: 14, cursor: "pointer" }}>x</button>
              </div>
            </div>
            <div style={{ height: 4, background: theme.bgInput, borderRadius: 2, marginBottom: 10, overflow: "hidden" }}><div style={{ height: "100%", width: (completed / items.length * 100) + "%", background: theme.accent, borderRadius: 2, transition: "width 0.3s" }} /></div>
            {items.map((item, i) => (
              <div key={i} onClick={item.done ? undefined : item.action} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: item.done ? "default" : "pointer", borderTop: i > 0 ? "1px solid " + theme.border : "none" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid " + (item.done ? theme.accent : theme.borderLight), background: item.done ? theme.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{item.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0A0E17" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}</div>
                <span style={{ flex: 1, fontSize: 13, color: item.done ? theme.textMuted : theme.textSecondary, textDecoration: item.done ? "line-through" : "none" }}>{item.label}</span>
                {!item.done && <Icon name="chevRight" size={14} color={theme.textMuted} />}
              </div>
            ))}
          </Card>
        );
      })()}

      {/* Quick Actions */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Playfair Display', serif", marginBottom: 12 }}>Quick Actions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Card hover onClick={() => setShowNewLesson(true)} style={{ padding: 16, textAlign: "center" }}>
            <Icon name="plus" size={24} color={theme.accent} />
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>New Lesson</div>
          </Card>
          <Card hover onClick={() => setShowNewStudent(true)} style={{ padding: 16, textAlign: "center" }}>
            <Icon name="users" size={24} color={theme.info} />
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>Add Student</div>
          </Card>
          <Card hover onClick={() => setShowAI(true)} style={{ padding: 16, textAlign: "center" }}>
            <Icon name="ai" size={24} color={theme.purple} />
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>AI Assistant</div>
          </Card>
          <Card hover onClick={() => setShowMessageCompose("bulk")} style={{ padding: 16, textAlign: "center" }}>
            <Icon name="send" size={24} color={theme.success} />
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>Fee Reminder</div>
          </Card>
          <Card hover onClick={() => { setBroadcastClassId(null); setBroadcastRecipients(new Set()); setBroadcastSentIdx(-1); setBroadcastMsg(""); setShowBroadcast(true); }} style={{ padding: 16, textAlign: "center" }}>
            <Icon name="message" size={24} color={theme.warning} />
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>Broadcast</div>
          </Card>
          <Card hover onClick={() => { setStudentsTab("classes"); setShowNewClass(true); setPage("students"); }} style={{ padding: 16, textAlign: "center" }}>
            <Icon name="users" size={24} color={theme.purple} />
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>Add Class</div>
          </Card>
        </div>
      </div>

      {/* Alerts */}
      {pendingPayments.filter(p => p.status === "overdue").length > 0 && (
        <Card style={{ padding: 16, borderColor: `${theme.danger}44`, background: theme.dangerBg, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="bell" size={18} color={theme.danger} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: theme.danger }}>Overdue Payments</div>
              <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                {pendingPayments.filter(p => p.status === "overdue").map(p => getStudent(p.studentId)?.name).filter(Boolean).join(", ")} — March fees overdue
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // PAGE: SCHEDULE / CALENDAR
  // ═══════════════════════════════════════════════════════════
  const SchedulePage = () => {
    const viewMode = scheduleViewMode; const setViewMode = setScheduleViewMode;
    const [selectedDay, setSelectedDay] = useState(null);
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

    const getLessonsForDay = (day) => {
      if (!day) return [];
      return store.lessons.filter((l) => { const d = new Date(l.date); return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year; }).sort((a, b) => new Date(a.date) - new Date(b.date));
    };
    const getBlocksForDay = (y, m, d) => (store.blocks || []).filter(b => { const bd = new Date(b.date); return bd.getDate() === d && bd.getMonth() === m && bd.getFullYear() === y; });
    const getDateStr = (dt) => dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");

    // Nav helpers
    const navDate = schedNavDate;
    const navPrev = () => {
      if (viewMode === "today") setSchedNavDate(new Date(navDate.getFullYear(), navDate.getMonth(), navDate.getDate() - 1));
      else if (viewMode === "week") setSchedNavDate(new Date(navDate.getFullYear(), navDate.getMonth(), navDate.getDate() - 7));
      else if (viewMode === "month") { setSchedNavDate(new Date(navDate.getFullYear(), navDate.getMonth() - 1, 1)); setCalendarDate(new Date(navDate.getFullYear(), navDate.getMonth() - 1, 1)); }
    };
    const navNext = () => {
      if (viewMode === "today") setSchedNavDate(new Date(navDate.getFullYear(), navDate.getMonth(), navDate.getDate() + 1));
      else if (viewMode === "week") setSchedNavDate(new Date(navDate.getFullYear(), navDate.getMonth(), navDate.getDate() + 7));
      else if (viewMode === "month") { setSchedNavDate(new Date(navDate.getFullYear(), navDate.getMonth() + 1, 1)); setCalendarDate(new Date(navDate.getFullYear(), navDate.getMonth() + 1, 1)); }
    };
    const navToday = () => { setSchedNavDate(new Date()); setCalendarDate(new Date()); };

    // Week helpers
    const weekStart = new Date(navDate); const dow = weekStart.getDay(); weekStart.setDate(weekStart.getDate() - (dow === 0 ? 6 : dow - 1)); weekStart.setHours(0,0,0,0);
    const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });

    // View date label
    const navLabel = viewMode === "today" ? navDate.toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long" })
      : viewMode === "week" ? weekDays[0].toLocaleDateString("en-SG", { day: "numeric", month: "short" }) + " \u2013 " + weekDays[6].toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })
      : navDate.toLocaleDateString("en-SG", { month: "long", year: "numeric" });

    // Get lessons/blocks for a date
    const getItemsForDate = (dt) => {
      const lessons = store.lessons.filter(l => { const d = new Date(l.date); return d.getDate() === dt.getDate() && d.getMonth() === dt.getMonth() && d.getFullYear() === dt.getFullYear(); }).sort((a, b) => new Date(a.date) - new Date(b.date));
      const blocks = getBlocksForDay(dt.getFullYear(), dt.getMonth(), dt.getDate());
      return [...lessons.map(l => ({ type: "lesson", data: l, time: new Date(l.date).getTime() })), ...blocks.map(b => ({ type: "block", data: b, time: new Date(b.date).getTime() }))].sort((a, b) => a.time - b.time);
    };

    const renderLessonCard = (lesson) => {
      const student = getStudent(lesson.studentId);
      return (
        <Card key={lesson.id} hover onClick={() => { setSelectedLesson(lesson); setLessonComment(lesson.comment || ""); }} style={{ padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar initials={student ? student.avatar : "?"} size={28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{student ? student.name : "Unknown"}</div>
              <div style={{ fontSize: 11, color: theme.textSecondary }}>{lesson.subject}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{formatTime(lesson.date)}</div>
              <div style={{ fontSize: 10, color: theme.textMuted }}>{lesson.duration} min</div>
            </div>
            <Badge text={lesson.status} color={getStatusColor(lesson.status)} bg={getStatusBg(lesson.status)} />
          </div>
        </Card>
      );
    };

    const renderBlockCard = (block) => (
      <Card key={block.id} style={{ padding: 12, borderLeft: "3px solid " + theme.textMuted, opacity: 0.8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: theme.bgInput, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="x" size={14} color={theme.textMuted} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.textMuted }}>{block.label || "Busy"}</div>
            <div style={{ fontSize: 11, color: theme.textMuted }}>{block.allDay ? "All day" : formatTime(block.date) + " \u00b7 " + block.duration + " min"}</div>
          </div>
          <button onClick={() => { if (window.confirm("Remove this block?")) deleteBlock(block.id); }} style={{ background: "none", border: "none", color: theme.danger, fontSize: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Remove</button>
        </div>
      </Card>
    );

    const renderDaySection = (dt, items) => {
      const dateStr = getDateStr(dt);
      const holiday = getHoliday(dateStr);
      const isToday = dt.getDate() === now.getDate() && dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
      return (
        <div key={dateStr} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: isToday ? theme.accent : theme.text }}>{dt.toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" })}</div>
            {isToday && <Badge text="today" color={theme.accent} bg={theme.accentBg} />}
            {holiday && <span style={{ fontSize: 10, color: theme.warning, fontWeight: 600 }}>{holiday.name}</span>}
          </div>
          {items.length === 0 ? (
            <div style={{ fontSize: 12, color: theme.textMuted, padding: "4px 0" }}>No lessons</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {items.map(item => item.type === "lesson" ? renderLessonCard(item.data) : renderBlockCard(item.data))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="fade-in">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Schedule</h1>
          <div style={{ display: "flex", gap: 6 }}>
            <Button size="sm" variant="secondary" onClick={() => { setBlockForm({ date: new Date().toISOString().split("T")[0], time: "09:00", duration: "60", label: "", allDay: false, recurrence: "none", endDate: "" }); setShowBlockTime(true); }}>Unavailable</Button>
            <Button size="sm" icon="plus" onClick={() => setShowNewLesson(true)}>New Lesson</Button>
          </div>
        </div>

        {/* Collapsible Calendar */}
        <Card style={{ marginBottom: 12, padding: schedCalOpen ? 14 : 10 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <button onClick={() => setCalendarDate(new Date(year, month - 1, 1))} style={{ padding: "4px 8px", background: "none", border: "none", color: theme.textMuted, fontSize: 16, cursor: "pointer" }}>&lt;</button>
              <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, cursor: "pointer" }} onClick={() => setSchedCalOpen(!schedCalOpen)}>{new Date(year, month).toLocaleDateString("en-SG", { month: "long", year: "numeric" })}</div>
              <button onClick={() => setCalendarDate(new Date(year, month + 1, 1))} style={{ padding: "4px 8px", background: "none", border: "none", color: theme.textMuted, fontSize: 16, cursor: "pointer" }}>&gt;</button>
            </div>
            <button onClick={() => setSchedCalOpen(!schedCalOpen)} style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}><Icon name={schedCalOpen ? "chevUp" : "chevDown"} size={16} color={theme.textMuted} /></button>
          </div>
          {schedCalOpen && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                <button onClick={() => { navToday(); setCalendarDate(new Date()); }} style={{ padding: "4px 12px", borderRadius: 6, background: theme.accentBg, border: "1px solid " + theme.accent + "44", color: theme.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Today</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center" }}>
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (<div key={i} style={{ fontSize: 10, fontWeight: 600, color: theme.textMuted, padding: "4px 0" }}>{d}</div>))}
                {calendarDays.map((day, i) => {
                  const lessons = getLessonsForDay(day);
                  const blocks = day ? getBlocksForDay(year, month, day) : [];
                  const isToday = day && day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                  const isSelected = day && day === selectedDay;
                  const dateStr = day ? year + "-" + String(month + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0") : "";
                  const holiday = day ? getHoliday(dateStr) : null;
                  return (
                    <div key={i} onClick={() => { if (day) setSelectedDay(selectedDay === day ? null : day); }} style={{ padding: "4px 2px", minHeight: 40, borderRadius: 6, background: isSelected ? theme.accent + "22" : isToday ? theme.accentBg : "transparent", border: isSelected ? "1px solid " + theme.accent : isToday ? "1px solid " + theme.accent + "44" : "1px solid transparent", cursor: day ? "pointer" : "default" }}>
                      {day && (<>
                        <div style={{ fontSize: 12, fontWeight: isToday || isSelected ? 700 : 400, color: isSelected ? theme.accent : isToday ? theme.accent : theme.text }}>{day}</div>
                        <div style={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap", marginTop: 1 }}>
                          {holiday && <div style={{ width: 5, height: 5, borderRadius: 3, background: theme.warning }} />}
                          {lessons.slice(0, 3).map((l, j) => (<div key={j} style={{ width: 5, height: 5, borderRadius: 3, background: getStatusColor(l.status) }} />))}
                          {blocks.length > 0 && <div style={{ width: 5, height: 5, borderRadius: 3, background: theme.textMuted }} />}
                        </div>
                      </>)}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8, fontSize: 10, color: theme.textMuted, flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 6, height: 6, borderRadius: 3, background: theme.warning }} />PH</span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 6, height: 6, borderRadius: 3, background: theme.success }} />Confirmed</span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 6, height: 6, borderRadius: 3, background: theme.info }} />Completed</span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 6, height: 6, borderRadius: 3, background: theme.danger }} />Cancelled</span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 6, height: 6, borderRadius: 3, background: theme.textMuted }} />Blocked</span>
              </div>
              {/* Selected day lessons inline */}
              {selectedDay && (() => {
                const dayItems = getItemsForDate(new Date(year, month, selectedDay));
                const dateStr = year + "-" + String(month + 1).padStart(2, "0") + "-" + String(selectedDay).padStart(2, "0");
                const holiday = getHoliday(dateStr);
                return (
                  <div style={{ marginTop: 12, borderTop: "1px solid " + theme.border, paddingTop: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.textSecondary, marginBottom: 8 }}>
                      {new Date(year, month, selectedDay).toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long" })}
                      {holiday && <span style={{ fontSize: 10, color: theme.warning, marginLeft: 8 }}>{holiday.name}</span>}
                    </div>
                    {dayItems.length === 0 ? (
                      <div style={{ fontSize: 12, color: theme.textMuted }}>No lessons on this day</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {dayItems.map(item => item.type === "lesson" ? renderLessonCard(item.data) : renderBlockCard(item.data))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </Card>

        {/* Tab bar */}
        <TabBar tabs={[{ id: "today", label: "Today" }, { id: "week", label: "This Week" }, { id: "month", label: "This Month" }]} active={viewMode} onChange={(v) => { setViewMode(v); setSelectedDay(null); setSchedNavDate(new Date()); }} />

        {/* Nav label with arrows */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
          <button onClick={navPrev} style={{ padding: "4px 8px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 6, color: theme.text, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>&lt;</button>
          <div style={{ fontSize: 13, color: theme.textSecondary, fontWeight: 600 }}>{navLabel}</div>
          <button onClick={navNext} style={{ padding: "4px 8px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 6, color: theme.text, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>&gt;</button>
        </div>

        {/* Today view */}
        {viewMode === "today" && (() => {
          const items = getItemsForDate(navDate);
          const dateStr = getDateStr(navDate);
          const holiday = getHoliday(dateStr);
          return (
            <div>
              {holiday && <div style={{ fontSize: 12, color: theme.warning, padding: "6px 10px", background: "rgba(245,158,11,0.1)", borderRadius: 8, marginBottom: 10 }}>{holiday.name}</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.length === 0 ? (<EmptyState icon="calendar" title="No lessons" sub="Enjoy your day!" />) : items.map(item => item.type === "lesson" ? renderLessonCard(item.data) : renderBlockCard(item.data))}
              </div>
            </div>
          );
        })()}

        {/* Week view */}
        {viewMode === "week" && (
          <div>{weekDays.map(dt => renderDaySection(dt, getItemsForDate(dt)))}</div>
        )}

        {/* Month view */}
        {viewMode === "month" && (() => {
          const mYear = navDate.getFullYear(); const mMonth = navDate.getMonth();
          const dim = new Date(mYear, mMonth + 1, 0).getDate();
          const days = Array.from({ length: dim }, (_, i) => new Date(mYear, mMonth, i + 1));
          const daysWithItems = days.filter(dt => getItemsForDate(dt).length > 0);
          return (
            <div>
              {daysWithItems.length === 0 ? (<EmptyState icon="calendar" title="No lessons this month" sub="Schedule a lesson to get started" />) : daysWithItems.map(dt => renderDaySection(dt, getItemsForDate(dt)))}
            </div>
          );
        })()}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // PAGE: STUDENTS
  // ═══════════════════════════════════════════════════════════
  const StudentsPage = () => {
    const filter = studentFilter; const setFilter = setStudentFilter;
    const [localSearch, setLocalSearch] = useState(searchRef.current);
    const filtered = filter === "all" ? store.students : store.students.filter((s) => s.status === filter);
    const searched = (localSearch ? filtered.filter((s) => s.name.toLowerCase().includes(localSearch.toLowerCase()) || s.level.toLowerCase().includes(localSearch.toLowerCase())) : filtered).sort((a, b) => a.name.localeCompare(b.name));
    return (
      <div>
        <div style={{ position: "relative", marginBottom: 16 }}>
          <input key="student-search" value={localSearch} onChange={(e) => { setLocalSearch(e.target.value); searchRef.current = e.target.value; }} placeholder="Search students..." style={{ width: "100%", padding: "10px 14px 10px 36px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 10, color: theme.text, outline: "none", fontSize: 14 }} />
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><Icon name="search" size={16} color={theme.textMuted} /></div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
          {["all", "active", "trial", "paused", "graduated"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid " + (filter === f ? theme.accent : theme.border), background: filter === f ? theme.accentBg : "transparent", color: filter === f ? theme.accent : theme.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" }}>
              {f} ({f === "all" ? store.students.length : store.students.filter(s => s.status === f).length})
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {searched.map((student) => (
            <Card key={student.id} hover onClick={() => setSelectedStudent(student)} style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar initials={student.avatar} size={40} color={getStatusColor(student.status)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{student.name}</span>
                    <Badge text={student.status} color={getStatusColor(student.status)} bg={getStatusBg(student.status)} />
                  </div>
                  <div style={{ fontSize: 12, color: theme.textSecondary }}>{student.level} {(student.subjects || []).length > 0 ? student.subjects.map(s => s.subject + (s.stream ? " (" + s.stream + ")" : "")).join(", ") : (student.subject || "")}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <div style={{ textAlign: "right" }}><div style={{ fontWeight: 700, color: theme.accent }}>{"$"}{student.hourlyRate}</div><div style={{ fontSize: 11, color: theme.textMuted }}>/ hr</div></div>
                  <div style={{ display: "flex", gap: 3 }}>
                    {student.parentPhone && (<button onClick={(e) => { e.stopPropagation(); setMessageTarget("parent"); setIncludeSiblings(false); setShowMessageCompose(student.id); }} style={{ padding: "3px 7px", borderRadius: 6, border: "none", background: "rgba(37, 211, 102, 0.1)", color: "#25D366", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 2 }}><svg width="9" height="9" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Parent</button>)}
                    {student.studentPhone && (<button onClick={(e) => { e.stopPropagation(); setMessageTarget("student"); setShowMessageCompose(student.id); }} style={{ padding: "3px 7px", borderRadius: 6, border: "none", background: "rgba(37, 211, 102, 0.1)", color: "#25D366", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 2 }}><svg width="9" height="9" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Student</button>)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // CLASSES VIEW + STUDENTS PAGE WRAPPER
  // ═══════════════════════════════════════════════════════════
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const ClassesView = () => {
    const classes = (store.classes || []).filter(c => c.status !== "archived");
    return (
      <div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {classes.length === 0 ? (
            <Card style={{ padding: 30, textAlign: "center" }}>
              <Icon name="users" size={32} color={theme.textMuted} />
              <div style={{ fontWeight: 600, color: theme.textSecondary, marginTop: 8 }}>No classes yet</div>
              <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>Create a class to group students and schedule lessons together</div>
            </Card>
          ) : classes.map(cls => {
            const members = (cls.studentIds || []).map(id => getStudent(id)).filter(Boolean);
            return (
              <Card key={cls.id} hover onClick={() => setSelectedClass(cls)} style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.accentBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="users" size={18} color={theme.accent} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{cls.name}</span>
                      <Badge text={cls.status || "active"} color={getStatusColor(cls.status || "active")} bg={getStatusBg(cls.status || "active")} />
                    </div>
                    <div style={{ fontSize: 12, color: theme.textSecondary }}>
                      {cls.day !== undefined && cls.day !== "" ? dayNamesShort[cls.day] + " " + (cls.time || "") : ""}{cls.subject ? ((cls.day !== undefined && cls.day !== "" ? " · " : "") + cls.subject + (cls.stream ? " (" + cls.stream + ")" : "")) : ""}
                    </div>
                    <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{members.length} student{members.length !== 1 ? "s" : ""}{cls.duration ? " · " + cls.duration + " min" : ""}{cls.location ? " · " + cls.location : ""}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setBroadcastClassId(cls.id); setBroadcastRecipients(new Set()); setBroadcastSentIdx(-1); setBroadcastMsg(""); setShowBroadcast(true); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid " + theme.border, background: theme.bgElevated, color: theme.accent, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Broadcast</button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const StudentsPageWrapper = () => (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Students</h1>
        {studentsTab === "students" ? (
          <Button size="sm" icon="plus" onClick={() => setShowNewStudent(true)}>Add Student</Button>
        ) : (
          <Button size="sm" icon="plus" onClick={() => setShowNewClass(true)}>Add Class</Button>
        )}
      </div>
      <TabBar tabs={[{ id: "students", label: "Students (" + store.students.length + ")" }, { id: "classes", label: "Classes (" + (store.classes || []).length + ")" }]} active={studentsTab} onChange={setStudentsTab} />
      {studentsTab === "students" ? <StudentsPage /> : <ClassesView />}
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // PAGE: PAYMENTS / FEES
  // ═══════════════════════════════════════════════════════════
  const PaymentsPage = () => {
    // monthView is at parent level to survive re-renders
    // Generate available months: current + any month that has lessons
    const availableMonths = useMemo(() => {
      const months = new Set();
      const currentMonth = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
      months.add(currentMonth);
      // Add months from existing payments
      store.payments.forEach(p => months.add(p.month));
      // Add months from lessons
      store.lessons.forEach(l => {
        const d = new Date(l.date);
        months.add(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
      });
      return Array.from(months).sort().reverse();
    }, [store.payments, store.lessons, now]);

    // Auto-generate payment entries for active students who have lessons this month
    const monthPayments = useMemo(() => {
      const activeIds = store.students.filter(s => s.status === "active" || s.status === "trial").map(s => s.id);
      const studentsWithLessons = new Set();
      store.lessons.forEach(l => {
        const d = new Date(l.date);
        const lMonth = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
        if (lMonth === monthView && l.status !== "cancelled" && activeIds.includes(l.studentId)) {
          studentsWithLessons.add(l.studentId);
        }
      });
      store.payments.filter(p => p.month === monthView).forEach(p => studentsWithLessons.add(p.studentId));

      const entries = [];
      Array.from(studentsWithLessons).forEach(sid => {
        const s = getStudent(sid);
        const isPerLesson = s && s.paymentMode === "per_lesson";

        if (isPerLesson) {
          // One entry per lesson
          const lessons = store.lessons.filter(l => {
            const d = new Date(l.date);
            const lMonth = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
            return l.studentId === sid && lMonth === monthView && (l.status !== "cancelled" || l.collectedButCancelled) && !l.excludeFromBilling;
          }).sort((a, b) => new Date(a.date) - new Date(b.date));
          lessons.forEach(l => {
            const hours = l.duration / 60;
            const amount = Math.round((s.hourlyRate || 0) * hours * 100) / 100;
            const paidRecord = store.payments.find(p => p.studentId === sid && p.month === monthView && p.lessonId === l.id);
            const isCBC = l.status === "cancelled" && l.collectedButCancelled;
            entries.push({
              id: paidRecord ? paidRecord.id : "auto-" + l.id + "-" + monthView,
              studentId: sid, month: monthView, lessonId: l.id,
              amount: amount, sessions: 1, rate: s.hourlyRate, totalHours: hours,
              status: isCBC ? "paid" : (paidRecord ? paidRecord.status : "pending"),
              paidDate: paidRecord ? paidRecord.paidDate : null, method: paidRecord ? paidRecord.method : null,
              isPerLesson: true, lessonDate: l.date, lessonSubject: l.subject, isCBC: isCBC,
            });
          });
        } else {
          // Monthly — single aggregated entry
          const existing = store.payments.find(p => p.studentId === sid && p.month === monthView && !p.lessonId);
          const calc = calcMonthlyFee(sid, monthView);
          if (existing) {
            entries.push({ ...existing, amount: calc.total, sessions: calc.sessions, rate: calc.rate, totalHours: calc.totalHours });
          } else {
            entries.push({ id: "auto-" + sid + "-" + monthView, studentId: sid, month: monthView, amount: calc.total, sessions: calc.sessions, rate: calc.rate, totalHours: calc.totalHours, status: "pending", paidDate: null, method: null });
          }
        }
      });
      // Mark pending entries as overdue if month has passed
      const currentMonth = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
      if (monthView < currentMonth) {
        entries.forEach(e => { if (e.status === "pending") e.status = "overdue"; });
      }
      return entries;
    }, [store.students, store.lessons, store.payments, monthView, calcMonthlyFee, getStudent, now]);

    const filtered = (paymentFilter === "all" ? monthPayments : monthPayments.filter(p => p.status === paymentFilter)).sort((a, b) => { const na = (getStudent(a.studentId) || {}).name || ""; const nb = (getStudent(b.studentId) || {}).name || ""; return na.localeCompare(nb); });
    const totalDue = monthPayments.reduce((s, p) => s + p.amount, 0);
    const totalPaid = monthPayments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
    const totalPending = monthPayments.filter((p) => p.status !== "paid").reduce((s, p) => s + p.amount, 0);

    const markPaid = (payment) => {
      const findKey = payment.lessonId
        ? (p => p.studentId === payment.studentId && p.month === payment.month && p.lessonId === payment.lessonId)
        : (p => p.studentId === payment.studentId && p.month === payment.month && !p.lessonId);
      const existing = store.payments.find(findKey);
      if (existing) {
        updatePayment(existing.id, { status: "paid", paidDate: now.toISOString().split("T")[0], method: "PayNow" });
      } else {
        const record = { id: "p" + genId(), studentId: payment.studentId, month: payment.month, amount: payment.amount, status: "paid", paidDate: now.toISOString().split("T")[0], method: "PayNow" };
        if (payment.lessonId) record.lessonId = payment.lessonId;
        setStore((s) => ({ ...s, payments: [...s.payments, record] }));
      }
      addToast("Payment recorded — " + ((getStudent(payment.studentId) || {}).name || "Student") + ", " + payment.month + ", $" + (payment.amount || 0).toFixed(2));
      setStore(s => ({ ...s, paymentLog: [...(s.paymentLog || []), { id: "pl" + genId(), studentId: payment.studentId, month: payment.month, amount: payment.amount || 0, method: "PayNow", recordedAt: new Date().toISOString() }] }));
    };

    const markUnpaid = (payment) => {
      const findKey = payment.lessonId
        ? (p => p.studentId === payment.studentId && p.month === payment.month && p.lessonId === payment.lessonId)
        : (p => p.studentId === payment.studentId && p.month === payment.month && !p.lessonId);
      const existing = store.payments.find(findKey);
      if (existing) {
        updatePayment(existing.id, { status: "pending", paidDate: null, method: null });
      }
      addToast("Payment reverted to pending");
    };

    return (
      <div className="fade-in">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Fee Collection</h1>
        </div>

        {/* Month Selector */}
        {(() => {
          const quickMonths = [];
          for (let i = -1; i < 2; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            quickMonths.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
          }
          const isQuick = quickMonths.includes(monthView);
          const viewParts = monthView.split("-").map(Number);
          return (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
              {quickMonths.map((m) => (
                <button key={m} onClick={() => setMonthView(m)} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid " + (monthView === m ? theme.accent : theme.border), background: monthView === m ? theme.accentBg : "transparent", color: monthView === m ? theme.accent : theme.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
                  {formatMonth(m)}
                </button>
              ))}
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <select value={isQuick ? "" : String(viewParts[1])} onChange={(e) => { if (e.target.value) { const m = (viewParts[0] || now.getFullYear()) + "-" + e.target.value.padStart(2, "0"); setMonthView(m); } }} style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid " + (!isQuick ? theme.accent : theme.border), background: !isQuick ? theme.accentBg : theme.bgInput, color: !isQuick ? theme.accent : theme.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", appearance: "none" }}>
                  <option value="">Mth</option>
                  {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                    <option key={i} value={String(i + 1)}>{m}</option>
                  ))}
                </select>
                <select value={isQuick ? "" : String(viewParts[0])} onChange={(e) => { if (e.target.value) { const mo = viewParts[1] || (now.getMonth() + 1); setMonthView(e.target.value + "-" + String(mo).padStart(2, "0")); } }} style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid " + (!isQuick ? theme.accent : theme.border), background: !isQuick ? theme.accentBg : theme.bgInput, color: !isQuick ? theme.accent : theme.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", appearance: "none" }}>
                  <option value="">Year</option>
                  {[2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          );
        })()}

        {/* Summary Bar */}
        <Card style={{ marginBottom: 16, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, marginBottom: 2 }}>TOTAL</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>${totalDue.toLocaleString()}</div>
            </div>
            <div style={{ width: 1, background: theme.border }} />
            <div>
              <div style={{ fontSize: 11, color: theme.success, fontWeight: 600, marginBottom: 2 }}>COLLECTED</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: theme.success }}>${totalPaid.toLocaleString()}</div>
            </div>
            <div style={{ width: 1, background: theme.border }} />
            <div>
              <div style={{ fontSize: 11, color: theme.warning, fontWeight: 600, marginBottom: 2 }}>OUTSTANDING</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: theme.warning }}>${totalPending.toLocaleString()}</div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ marginTop: 12, height: 6, background: theme.bgInput, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: totalDue > 0 ? `${(totalPaid / totalDue) * 100}%` : 0, background: `linear-gradient(90deg, ${theme.success}, ${theme.accentLight})`, borderRadius: 3, transition: "width 0.5s ease" }} />
          </div>
        </Card>

        {/* Filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
          {["all", "paid", "pending", "overdue"].map((f) => (
            <button key={f} onClick={() => setPaymentFilter(f)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${paymentFilter === f ? theme.accent : theme.border}`, background: paymentFilter === f ? theme.accentBg : "transparent", color: paymentFilter === f ? theme.accent : theme.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", fontFamily: "'DM Sans', sans-serif" }}>
              {f}
            </button>
          ))}
        </div>

        {/* Payment List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((payment) => {
            const student = getStudent(payment.studentId);
            return (
              <Card key={payment.id || payment.studentId + payment.month} style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar initials={student ? student.avatar : "?"} size={36} color={getStatusColor(payment.status)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{student ? student.name : "Unknown"}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <Badge text={payment.isCBC ? "CBC" : payment.status} color={payment.isCBC ? theme.warning : getStatusColor(payment.status)} bg={payment.isCBC ? theme.warningBg : getStatusBg(payment.status)} />
                      {payment.isPerLesson ? (
                        <span style={{ fontSize: 11, color: theme.textMuted }}>{new Date(payment.lessonDate).toLocaleDateString("en-SG", { day: "numeric", month: "short" })} · {payment.lessonSubject}{payment.isCBC ? " (cancelled)" : ""} · {payment.totalHours}h × ${payment.rate}/hr</span>
                      ) : (
                        <span style={{ fontSize: 11, color: theme.textMuted }}>{payment.sessions} sessions · {payment.totalHours}h × ${payment.rate}/hr</span>
                      )}
                      {payment.paidDate && <span style={{ fontSize: 11, color: theme.textMuted }}>· Paid {payment.paidDate}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>${payment.amount.toFixed(2)}</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                      {payment.status !== "paid" ? (
                        <>
                          <button onClick={() => markPaid(payment)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: theme.successBg, color: theme.success, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Mark Paid</button>
                          <button onClick={() => setShowMessageCompose(payment.studentId)} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "rgba(37, 211, 102, 0.1)", color: "#25D366", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            <span style={{ fontSize: 10, fontWeight: 600 }}>WA</span>
                          </button>
                        </>
                      ) : (
                        <button onClick={() => markUnpaid(payment)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: theme.bgElevated, color: theme.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Undo</button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          {filtered.length === 0 && <EmptyState icon="dollar" title="No fees for this month" sub="Schedule lessons to see fee entries here" />}
          {(store.paymentLog || []).length > 0 && (
          <Card style={{ marginTop: 16, padding: 14 }}>
            <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>PAYMENT LOG ({(store.paymentLog || []).filter(pl => pl.month === monthView).length})</div>
            <div style={{ maxHeight: 150, overflow: "auto", fontSize: 11 }}>
              {(store.paymentLog || []).filter(pl => pl.month === monthView).sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt)).map(pl => {
                const s = getStudent(pl.studentId);
                return (
                  <div key={pl.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid " + theme.border }}>
                    <Icon name="check" size={10} color={theme.success} />
                    <span style={{ flex: 1, color: theme.textSecondary }}>{s ? s.name : "Unknown"}</span>
                    <span style={{ color: theme.success, fontWeight: 600 }}>{"$"}{pl.amount.toFixed(2)}</span>
                    <span style={{ color: theme.textMuted, fontSize: 10 }}>{new Date(pl.recordedAt).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}</span>
                  </div>
                );
              })}
              {(store.paymentLog || []).filter(pl => pl.month === monthView).length === 0 && <div style={{ color: theme.textMuted, padding: 4 }}>No payments recorded this month</div>}
            </div>
          </Card>
        )}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // PAGE: MESSAGES
  // ═══════════════════════════════════════════════════════════
  const MessagesPage = () => {
    const [newMsg, setNewMsg] = useState("");
    const [selectedParent, setSelectedParent] = useState(null);

    const parentThreads = useMemo(() => {
      const threads = {};
      store.messages.forEach((m) => {
        if (!threads[m.parentId]) threads[m.parentId] = [];
        threads[m.parentId].push(m);
      });
      return threads;
    }, [store.messages]);

    return (
      <div className="fade-in">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Messages</h1>
          <Button size="sm" icon="send" onClick={() => setShowMessageCompose("bulk")}>Compose</Button>
        </div>

        {selectedParent ? (
          <div>
            <button onClick={() => setSelectedParent(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: theme.textSecondary, cursor: "pointer", marginBottom: 16, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
              <Icon name="arrowLeft" size={16} /> Back to threads
            </button>
            <Card style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <Avatar initials={getStudent(selectedParent)?.avatar || "?"} size={36} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{getStudent(selectedParent)?.parent}</div>
                  <div style={{ fontSize: 12, color: theme.textSecondary }}>{getStudent(selectedParent)?.parentPhone}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 300, overflow: "auto", marginBottom: 16 }}>
                {(parentThreads[selectedParent] || []).map((msg) => (
                  <div key={msg.id} style={{ display: "flex", justifyContent: msg.direction === "out" ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: msg.direction === "out" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: msg.direction === "out" ? theme.accentBg : theme.bgElevated, border: `1px solid ${msg.direction === "out" ? theme.accent + "44" : theme.border}`, fontSize: 13 }}>
                      {msg.text}
                      <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 4, textAlign: "right" }}>{formatTime(msg.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Type a message..." style={{ flex: 1, padding: "10px 14px", background: theme.bgInput, border: `1px solid ${theme.border}`, borderRadius: 10, color: theme.text, outline: "none", fontSize: 13 }} onKeyDown={(e) => {
                  if (e.key === "Enter" && newMsg.trim()) {
                    setStore((s) => ({ ...s, messages: [...s.messages, { id: "m" + genId(), parentId: selectedParent, direction: "out", text: newMsg, date: new Date().toISOString(), read: true }] }));
                    setNewMsg("");
                    addToast("Message logged");
                  }
                }} />
                <Button size="sm" icon="send" onClick={() => {
                  if (newMsg.trim()) {
                    setStore((s) => ({ ...s, messages: [...s.messages, { id: "m" + genId(), parentId: selectedParent, direction: "out", text: newMsg, date: new Date().toISOString(), read: true }] }));
                    setNewMsg("");
                    addToast("Message logged");
                  }
                }}>Log</Button>
                <button onClick={() => {
                  if (newMsg.trim()) {
                    const parentStudent = getStudent(selectedParent);
                    if (parentStudent) {
                      setStore((s) => ({ ...s, messages: [...s.messages, { id: "m" + genId(), parentId: selectedParent, direction: "out", text: newMsg, date: new Date().toISOString(), read: true }] }));
                      openWhatsApp(parentStudent.parentPhone, newMsg);
                      setNewMsg("");
                      addToast("WhatsApp opened");
                    }
                  }
                }} style={{ padding: "6px 12px", borderRadius: 10, border: "none", background: "#25D366", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WA
                </button>
              </div>
            </Card>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(parentThreads).map(([parentId, msgs]) => {
              const student = getStudent(parentId);
              const lastMsg = msgs[msgs.length - 1];
              return (
                <Card key={parentId} hover onClick={() => setSelectedParent(parentId)} style={{ padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar initials={student ? student.avatar : "?"} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{student ? student.parent : "Unknown"}</div>
                      <div style={{ fontSize: 12, color: theme.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {lastMsg.direction === "out" ? "You: " : ""}{lastMsg.text.substring(0, 60)}...
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>{lastMsg.date.split("T")[0]}</div>
                  </div>
                </Card>
              );
            })}
            {Object.keys(parentThreads).length === 0 && <EmptyState icon="message" title="No messages yet" sub="Start a conversation with a parent" />}
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // PAGE: ADMIN CONSOLE
  // ═══════════════════════════════════════════════════════════
  const AdminPage = () => {
    const currentMonthStr = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    const totalMonthly = store.students.filter(s => s.status === "active").reduce((sum, s) => sum + calcMonthlyFee(s.id, currentMonthStr).total, 0);
    const avgFee = activeStudents.length > 0 ? Math.round(totalMonthly / activeStudents.length) : 0;
    const completionRate = (() => {
      const monthLessons = store.lessons.filter(l => { const d = new Date(l.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
      if (monthLessons.length === 0) return 0;
      const nonCancelled = monthLessons.filter(l => l.status !== "cancelled").length;
      return Math.round(nonCancelled / monthLessons.length * 100);
    })();
    const lastMonthStr = now.getMonth() === 0 ? (now.getFullYear() - 1) + "-12" : now.getFullYear() + "-" + String(now.getMonth()).padStart(2, "0");
    const collectionRate = (() => {
      const [ly, lm] = lastMonthStr.split("-").map(Number);
      let totalDue = 0, totalPaid = 0;
      store.students.filter(s => s.status === "active" || s.status === "trial").forEach(s => {
        const calc = calcMonthlyFee(s.id, lastMonthStr);
        if (calc.total > 0) {
          totalDue += calc.total;
          const paid = store.payments.filter(p => p.studentId === s.id && p.month === lastMonthStr && p.status === "paid");
          if (paid.length > 0) totalPaid += paid.reduce((sum, p) => sum + (p.amount || 0), 0);
        }
      });
      return totalDue > 0 ? Math.round(totalPaid / totalDue * 100) : 0;
    })();

    const revenueData = (() => {
      const data = [];
      const now = new Date();
      const history = store.revenueHistory || [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
        const label = d.toLocaleDateString("en-SG", { month: "short" });
        // Manual override takes priority, otherwise auto-calculate from lessons
        const manualEntry = history.find(h => h.month === key);
        if (manualEntry) {
          data.push({ month: label, amount: manualEntry.amount });
        } else if (i === 0) {
          data.push({ month: label, amount: totalMonthly });
        } else {
          // Auto-calculate from actual lesson data
          let monthTotal = 0;
          store.students.forEach(s => {
            const calc = calcMonthlyFee(s.id, key);
            monthTotal += calc.total;
          });
          data.push({ month: label, amount: monthTotal });
        }
      }
      return data;
    })();
    const maxRevenue = Math.max(...revenueData.map(d => d.amount), 1);

    return (
      <div className="fade-in">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Admin Console</h1>
        </div>

        <TabBar tabs={[{ id: "overview", label: "Overview" }, { id: "analytics", label: "Analytics" }, { id: "manage", label: "Manage" }]} active={adminTab} onChange={setAdminTab} />

        {adminTab === "overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <StatCard icon="dollar" label={now.toLocaleDateString("en-SG", { month: "short" }) + " Rev"} value={`$${totalMonthly.toLocaleString()}`} color={theme.success} />
              <StatCard icon="users" label="Avg / Student" value={`$${avgFee}`} color={theme.info} />
              <StatCard icon="check" label="Completion" value={`${completionRate}%`} color={theme.accent} />
              <StatCard icon="dollar" label="Collection" value={`${collectionRate}%`} sub="Last month" color={theme.purple} />
            </div>
            <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 20, padding: "8px 12px", background: theme.bgInput, borderRadius: 8, lineHeight: 1.8 }}>
              <strong>Rev</strong> = total fees from active students this month<br/>
              <strong>Avg</strong> = revenue ÷ active students<br/>
              <strong>Completion</strong> = non-cancelled lessons ÷ total lessons this month<br/>
              <strong>Collection</strong> = % of last month's fees collected
            </div>

            {/* Revenue Chart */}
            <Card style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, fontFamily: "'Playfair Display', serif" }}>Revenue Trend</h3>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140, paddingBottom: 24, position: "relative" }}>
                {revenueData.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 10, color: theme.textMuted, fontWeight: 600 }}>${(d.amount / 1000).toFixed(1)}k</div>
                    <div style={{ width: "100%", borderRadius: 6, background: i === revenueData.length - 1 ? `linear-gradient(180deg, ${theme.accent}, ${theme.accentDark})` : theme.bgElevated, height: `${(d.amount / maxRevenue) * 100}px`, transition: "height 0.5s ease", minHeight: 4 }} />
                    <div style={{ fontSize: 11, color: theme.textSecondary, fontWeight: 500 }}>{d.month}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Students by Level */}
            <Card style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, fontFamily: "'Playfair Display', serif" }}>Students by Level</h3>
              {(() => {
                const colors = [theme.accent, theme.info, theme.purple, theme.success, theme.warning, theme.danger, theme.textSecondary, theme.accentLight];
                const levels = {};
                store.students.filter(s => s.status === "active" || s.status === "trial").forEach(s => { levels[s.level] = (levels[s.level] || 0) + 1; });
                const sorted = Object.entries(levels).sort((a, b) => b[1] - a[1]);
                return sorted.map(([level, count], i) => (
                  <div key={level} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderTop: i > 0 ? "1px solid " + theme.border : "none" }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: colors[i % colors.length] }} />
                    <span style={{ flex: 1, fontSize: 13, color: theme.textSecondary }}>{level}</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{count}</span>
                  </div>
                ));
              })()}
            </Card>

            {/* Student breakdown by stream */}
            <Card>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, fontFamily: "'Playfair Display', serif" }}>Students by Stream</h3>
              {(() => {
                const colors = [theme.accent, theme.info, theme.purple, theme.success, theme.warning, theme.danger, theme.textSecondary];
                const streams = {};
                store.students.forEach((s) => { streams[s.stream] = (streams[s.stream] || 0) + 1; });
                return Object.entries(streams).map(([stream, count], i) => (
                  <div key={stream} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i > 0 ? "1px solid " + theme.border : "none" }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: colors[i % colors.length] }} />
                    <span style={{ flex: 1, fontSize: 13, color: theme.textSecondary }}>{stream}</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{count}</span>
                  </div>
                ));
              })()}
            </Card>
            <Card style={{ marginTop: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, fontFamily: "'Playfair Display', serif" }}>How Students Find You</h3>
              {(() => {
                const sources = {};
                store.students.forEach(s => { if (s.referralSource) sources[s.referralSource] = (sources[s.referralSource] || 0) + 1; });
                const sorted = Object.entries(sources).sort((a, b) => b[1] - a[1]);
                if (sorted.length < 1) return <div style={{ fontSize: 12, color: theme.textMuted }}>Add referral sources to your students to see this breakdown.</div>;
                const max = sorted[0][1];
                return sorted.map(([src, count]) => {
                  const label = (REFERRAL_OPTIONS.find(r => r.value === src) || {}).label || src;
                  return (<div key={src} style={{ marginBottom: 8 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: theme.textSecondary, marginBottom: 2 }}><span>{label}</span><span style={{ fontWeight: 700 }}>{count}</span></div><div style={{ height: 6, background: theme.bgInput, borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: (count / max * 100) + "%", background: theme.accent, borderRadius: 3 }} /></div></div>);
                });
              })()}
            </Card>
          </>
        )}

        {adminTab === "analytics" && (() => {
          const allWidgets = [
            { id: "revenue_forecast", label: "Revenue Forecast", render: () => (
              <Card style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>Revenue Forecast</h3>
                <p style={{ fontSize: 13, color: theme.textSecondary }}>Projected {now.toLocaleDateString("en-SG", { month: "long" })} revenue: <strong style={{ color: theme.success }}>${totalMonthly.toLocaleString()}</strong></p>
              </Card>
            )},
            { id: "cancellation", label: "Cancellation Rate", render: () => {
              const monthLessons = store.lessons.filter(l => { const d = new Date(l.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
              const cancelled = monthLessons.filter(l => l.status === "cancelled").length;
              return (<Card style={{ marginBottom: 12 }}><h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>Cancellation Rate</h3><p style={{ fontSize: 13, color: theme.textSecondary }}>Cancelled: <strong style={{ color: theme.warning }}>{cancelled}</strong> / {monthLessons.length} lessons ({monthLessons.length > 0 ? Math.round(cancelled / monthLessons.length * 100) : 0}%)</p></Card>);
            }},
            { id: "student_overview", label: "Student Overview", render: () => (
              <Card style={{ marginBottom: 12 }}><h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>Student Overview</h3><p style={{ fontSize: 13, color: theme.textSecondary }}><strong style={{ color: theme.success }}>{activeStudents.length}</strong> active · <strong style={{ color: theme.info }}>{store.students.filter(s => s.status === "trial").length}</strong> trial · <strong style={{ color: theme.textMuted }}>{store.students.filter(s => s.status === "paused").length}</strong> paused · <strong style={{ color: theme.purple }}>{store.students.filter(s => s.status === "graduated").length}</strong> graduated</p></Card>
            )},
            { id: "weekly_hours", label: "Weekly Hours", render: () => {
              const weekStart = new Date(now); const dayOfWeek = weekStart.getDay(); weekStart.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); weekStart.setHours(0,0,0,0);
              const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6); weekEnd.setHours(23,59,59,999);
              const weekLessons = store.lessons.filter(l => { const d = new Date(l.date); return d >= weekStart && d <= weekEnd && l.status !== "cancelled"; });
              const weekHours = weekLessons.reduce((s, l) => s + l.duration, 0) / 60;
              return (<Card style={{ marginBottom: 12 }}><h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>This Week</h3><p style={{ fontSize: 13, color: theme.textSecondary }}><strong style={{ color: theme.accent }}>{weekLessons.length}</strong> lessons · <strong style={{ color: theme.accent }}>{weekHours.toFixed(1)}</strong> hours taught</p></Card>);
            }},
            { id: "avg_hours_student", label: "Avg Hours / Student", render: () => {
              const monthLessons = store.lessons.filter(l => { const d = new Date(l.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && l.status !== "cancelled"; });
              const totalH = monthLessons.reduce((s, l) => s + l.duration, 0) / 60;
              const avg = activeStudents.length > 0 ? (totalH / activeStudents.length).toFixed(1) : "0";
              return (<Card style={{ marginBottom: 12 }}><h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>Avg Hours / Student</h3><p style={{ fontSize: 13, color: theme.textSecondary }}><strong style={{ color: theme.info }}>{avg}</strong> hours this month across {activeStudents.length} students</p></Card>);
            }},
            { id: "revenue_by_month", label: "Revenue by Month", render: () => (
              <Card style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, fontFamily: "'Playfair Display', serif" }}>Revenue Trend</h3>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140, paddingBottom: 24, position: "relative" }}>
                  {revenueData.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ fontSize: 10, color: theme.textMuted, fontWeight: 600 }}>${(d.amount / 1000).toFixed(1)}k</div>
                      <div style={{ width: "100%", borderRadius: 6, background: i === revenueData.length - 1 ? "linear-gradient(180deg, " + theme.accent + ", " + theme.accentDark + ")" : theme.bgElevated, height: (d.amount / maxRevenue) * 100 + "px", transition: "height 0.5s ease", minHeight: 4 }} />
                      <div style={{ fontSize: 11, color: theme.textSecondary, fontWeight: 500 }}>{d.month}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )},
          ];
          const enabledWidgets = store.settings?.analyticsWidgets || allWidgets.map(w => w.id);
          const toggleWidget = (id) => {
            const current = store.settings?.analyticsWidgets || allWidgets.map(w => w.id);
            const updated = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
            setStore(s => ({ ...s, settings: { ...(s.settings || {}), analyticsWidgets: updated } }));
          };
          return (
            <>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {allWidgets.map(w => (
                  <button key={w.id} onClick={() => toggleWidget(w.id)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid " + (enabledWidgets.includes(w.id) ? theme.accent + "66" : theme.border), background: enabledWidgets.includes(w.id) ? theme.accentBg : "transparent", color: enabledWidgets.includes(w.id) ? theme.accent : theme.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{w.label}</button>
                ))}
              </div>
              {allWidgets.filter(w => enabledWidgets.includes(w.id)).map(w => <div key={w.id}>{w.render()}</div>)}
            </>
          );
        })()}

        {adminTab === "manage" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Profile Settings — FIRST */}
            <Card style={{ padding: 14 }}>
              <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 10, letterSpacing: 0.5 }}>PROFILE</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: theme.textSecondary, flexShrink: 0, width: 100 }}>Display Name</span>
                <input type="text" defaultValue={store.settings?.tutorName || ""} onBlur={(e) => { const val = e.target.value.trim(); if (val !== (store.settings?.tutorName || "")) { setStore((s) => ({ ...s, settings: { ...(s.settings || {}), tutorName: val } })); addToast("Name updated"); } }} placeholder="Your name" style={{ flex: 1, padding: "8px 12px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 8, color: theme.text, outline: "none", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }} />
              </div>
              <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 8, marginTop: 14, letterSpacing: 0.5 }}>PAYMENT DETAILS</div>
              <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8 }}>Choose how parents pay you. This appears in all invoice templates.</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {["phone", "uen"].map((mode) => (
                  <button key={mode} onClick={() => setStore((s) => ({ ...s, settings: { ...(s.settings || {}), paymentMode: mode } }))} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid " + ((store.settings?.paymentMode || "phone") === mode ? theme.accent : theme.border), background: (store.settings?.paymentMode || "phone") === mode ? theme.accentBg : "transparent", color: (store.settings?.paymentMode || "phone") === mode ? theme.accent : theme.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    {mode === "phone" ? "PayNow (Phone)" : "PayNow (UEN)"}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: theme.textSecondary, flexShrink: 0, width: 100 }}>{(store.settings?.paymentMode || "phone") === "phone" ? "Phone No." : "UEN"}</span>
                <input type="text" defaultValue={store.settings?.paymentInfo || ""} key={(store.settings?.paymentMode || "phone")} onBlur={(e) => { const val = e.target.value.trim(); setStore((s) => ({ ...s, settings: { ...(s.settings || {}), paymentInfo: val } })); if (val) addToast("Payment details saved"); }} placeholder={(store.settings?.paymentMode || "phone") === "phone" ? "e.g. 9123 4567" : "e.g. 202410124E"} style={{ flex: 1, padding: "8px 12px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 8, color: theme.text, outline: "none", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }} />
              </div>
            </Card>

            {/* Preferences */}
            <Card style={{ marginTop: 16, padding: 14 }}>
              <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 10, letterSpacing: 0.5 }}>PREFERENCES</div>
              {[
                { key: "phWarnings", label: "Warn when scheduling on public holidays", defaultVal: true },
                { key: "backupReminder", label: "Weekly backup reminder on dashboard", defaultVal: true },
              ].map(pref => (
                <div key={pref.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid " + theme.border }}>
                  <span style={{ fontSize: 13, color: theme.textSecondary }}>{pref.label}</span>
                  <button onClick={() => { const current = (store.settings || {})[pref.key]; const newVal = current === undefined ? !pref.defaultVal : !current; setStore(s => ({ ...s, settings: { ...(s.settings || {}), [pref.key]: newVal } })); }} style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: ((store.settings || {})[pref.key] !== undefined ? (store.settings || {})[pref.key] : pref.defaultVal) ? theme.accent : theme.bgInput, cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: ((store.settings || {})[pref.key] !== undefined ? (store.settings || {})[pref.key] : pref.defaultVal) ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                  </button>
                </div>
              ))}
            </Card>

            {/* Export / Import */}
            <Card style={{ marginTop: 16, padding: 14 }}>
              <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 10, letterSpacing: 0.5 }}>EXPORT</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                <Button size="sm" variant="secondary" icon="download" onClick={() => {
                  try {
                    const wb = XLSX.utils.book_new();
                    // Summary tab — all students overview
                    const summaryData = store.students.map(s => {
                      const lessons = store.lessons.filter(l => l.studentId === s.id);
                      const completed = lessons.filter(l => l.status === "completed").length;
                      const totalHours = lessons.filter(l => l.status !== "cancelled").reduce((sum, l) => sum + l.duration, 0) / 60;
                      const subjectList = (s.subjects || []).map(e => e.subject + (e.stream ? " (" + e.stream + ")" : "") + (e.grade ? " [" + e.grade + "]" : "")).join(", ") || (s.subject || "");
                      return { Name: s.name, Level: s.level, Subjects: subjectList, Status: s.status, "Hourly Rate": s.hourlyRate, Parent: s.parent, Phone: s.parentPhone, Email: s.parentEmail, Address: s.address || "", "Total Lessons": lessons.length, Completed: completed, "Total Hours": Math.round(totalHours * 100) / 100, "Total Fees": Math.round(s.hourlyRate * totalHours * 100) / 100, "Join Date": s.joinDate, Notes: s.notes || "" };
                    });
                    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
                    summaryWs["!cols"] = [{ wch: 20 }, { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 18 }, { wch: 14 }, { wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 30 }];
                    XLSX.utils.book_append_sheet(wb, summaryWs, "All Students");
                    // One tab per student with their lessons
                    store.students.forEach(s => {
                      const lessons = store.lessons.filter(l => l.studentId === s.id).sort((a, b) => new Date(a.date) - new Date(b.date));
                      const lessonData = lessons.map(l => {
                        const d = new Date(l.date);
                        return { Date: d.toLocaleDateString("en-SG"), Time: d.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", hour12: true }), Duration: l.duration + " min", Subject: l.subject, Status: l.status, Location: l.location, "Fee ($)": Math.round(s.hourlyRate * l.duration / 60 * 100) / 100, Feedback: l.comment || "" };
                      });
                      if (lessonData.length === 0) lessonData.push({ Date: "", Time: "", Duration: "", Subject: "No lessons", Status: "", Location: "", "Fee ($)": "", Feedback: "" });
                      const ws = XLSX.utils.json_to_sheet(lessonData);
                      ws["!cols"] = [{ wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 24 }, { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 40 }];
                      // Sanitize sheet name (max 31 chars, no special chars)
                      const sheetName = s.name.replace(/[\\/*?[\]:]/g, "").substring(0, 31);
                      XLSX.utils.book_append_sheet(wb, ws, sheetName);
                    });
                    XLSX.writeFile(wb, "TutorPulse-Export-" + new Date().toISOString().split("T")[0] + ".xlsx");
                    addToast("Excel exported (" + store.students.length + " students)");
                  } catch (err) {
                    addToast("Export failed: " + err.message, "error");
                  }
                }}>Export Excel</Button>
                <Button size="sm" variant="secondary" icon="download" onClick={() => {
                  const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "tutorpulse-backup-" + new Date().toISOString().split("T")[0] + ".json"; a.click(); URL.revokeObjectURL(url);
                  addToast("Backup downloaded");
                }}>Full Backup</Button>
              </div>
              <div style={{ fontSize: 11, color: theme.textMuted }}>Excel file has a summary tab + one tab per student with all their lessons and fees. Full Backup is for restoring data.</div>
            </Card>

            {/* IRAS Annual Income Report */}
            <Card style={{ padding: 14 }}>
              <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>ANNUAL INCOME REPORT</div>
              <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 10 }}>Generate a year-on-year income summary for IRAS tax filing.</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[now.getFullYear(), now.getFullYear() - 1].map(year => (
                  <Button key={year} size="sm" variant="secondary" icon="download" onClick={() => {
                    try {
                      const wb = XLSX.utils.book_new();
                      const monthlyData = [];
                      let yearTotal = 0;
                      for (let m = 1; m <= 12; m++) {
                        const key = year + "-" + String(m).padStart(2, "0");
                        const monthLabel = new Date(year, m - 1, 1).toLocaleDateString("en-SG", { month: "long", year: "numeric" });
                        let monthRevenue = 0;
                        let lessonCount = 0;
                        let totalHours = 0;
                        store.students.forEach(s => {
                          const calc = calcMonthlyFee(s.id, key);
                          monthRevenue += calc.total;
                          lessonCount += calc.sessions;
                          totalHours += calc.totalHours;
                        });
                        const paid = store.payments.filter(p => p.month === key && p.status === "paid").reduce((sum, p) => sum + (p.amount || 0), 0);
                        yearTotal += monthRevenue;
                        monthlyData.push({ Month: monthLabel, Lessons: lessonCount, "Total Hours": Math.round(totalHours * 100) / 100, "Revenue (Billed)": Math.round(monthRevenue * 100) / 100, "Collected": Math.round(paid * 100) / 100, "Outstanding": Math.round((monthRevenue - paid) * 100) / 100 });
                      }
                      monthlyData.push({ Month: "TOTAL " + year, Lessons: monthlyData.reduce((s, r) => s + r.Lessons, 0), "Total Hours": Math.round(monthlyData.reduce((s, r) => s + r["Total Hours"], 0) * 100) / 100, "Revenue (Billed)": Math.round(yearTotal * 100) / 100, "Collected": Math.round(monthlyData.reduce((s, r) => s + r["Collected"], 0) * 100) / 100, "Outstanding": Math.round(monthlyData.reduce((s, r) => s + r["Outstanding"], 0) * 100) / 100 });
                      // Student breakdown
                      const studentData = [];
                      store.students.forEach(s => {
                        let sTotal = 0, sLessons = 0, sHours = 0;
                        for (let m = 1; m <= 12; m++) {
                          const calc = calcMonthlyFee(s.id, year + "-" + String(m).padStart(2, "0"));
                          sTotal += calc.total; sLessons += calc.sessions; sHours += calc.totalHours;
                        }
                        if (sLessons > 0) studentData.push({ Student: s.name, Level: s.level, Subject: (s.subjects || []).map(e => e.subject).join(", ") || s.subject || "", Lessons: sLessons, "Total Hours": Math.round(sHours * 100) / 100, "Total Revenue": Math.round(sTotal * 100) / 100, "Rate/hr": s.hourlyRate });
                      });
                      studentData.sort((a, b) => b["Total Revenue"] - a["Total Revenue"]);
                      const ws1 = XLSX.utils.json_to_sheet(monthlyData);
                      ws1["!cols"] = [{ wch: 22 }, { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 14 }];
                      const ws2 = XLSX.utils.json_to_sheet(studentData);
                      ws2["!cols"] = [{ wch: 20 }, { wch: 10 }, { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 10 }];
                      XLSX.utils.book_append_sheet(wb, ws1, "Monthly Summary");
                      XLSX.utils.book_append_sheet(wb, ws2, "By Student");
                      XLSX.writeFile(wb, "TutorPulse-Income-" + year + ".xlsx");
                      addToast("Income report for " + year + " downloaded");
                    } catch (err) { addToast("Export failed: " + err.message, "error"); }
                  }}>{year} Report</Button>
                ))}
              </div>
            </Card>

            {/* My Data Export */}
            <Card style={{ padding: 14 }}>
              <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 4, letterSpacing: 0.5 }}>MY DATA</div>
              <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 10 }}>Your data belongs to you. Export it anytime.</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button size="sm" variant="secondary" icon="download" onClick={() => {
                  const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "TutorPulse-Export-" + new Date().toISOString().split("T")[0] + ".json"; a.click(); URL.revokeObjectURL(url);
                  localStorage.setItem("tutorpulse-last-export", new Date().toISOString());
                  addToast("JSON export downloaded");
                }}>JSON</Button>
                <Button size="sm" variant="secondary" icon="download" onClick={() => {
                  try {
                    const wb = XLSX.utils.book_new();
                    const sData = store.students.map(s => ({ Name: s.name, Level: s.level, Subject: (s.subjects || []).map(e => e.subject).join(", "), Stream: (s.subjects || []).map(e => e.stream).join(", "), "Hourly Rate": s.hourlyRate, Status: s.status, Parent: s.parent, Phone: s.parentPhone, School: (s.schools || []).length > 0 ? s.schools[s.schools.length-1].name : "", "Join Date": s.joinDate }));
                    const lData = store.lessons.map(l => { const s = getStudent(l.studentId); return { Date: new Date(l.date).toLocaleDateString("en-SG"), Time: new Date(l.date).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" }), Student: s ? s.name : "Unknown", Subject: l.subject, Duration: l.duration, Location: l.location, Status: l.status }; });
                    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sData), "Students");
                    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lData), "Lessons");
                    XLSX.writeFile(wb, "TutorPulse-Export-" + new Date().toISOString().split("T")[0] + ".xlsx");
                    localStorage.setItem("tutorpulse-last-export", new Date().toISOString());
                    addToast("Spreadsheet export downloaded");
                  } catch (err) { addToast("Export failed: " + err.message, "error"); }
                }}>Spreadsheet</Button>
                <Button size="sm" variant="secondary" icon="download" onClick={() => {
                  const cm = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
                  const active = store.students.filter(s => s.status === "active" || s.status === "trial");
                  let html = "<html><head><title>TutorPulse Summary</title><style>body{font-family:sans-serif;max-width:700px;margin:auto;padding:20px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:12px}th{background:#f5f5f5}</style></head><body>";
                  html += "<h2>TutorPulse Summary</h2><p>Exported: " + new Date().toLocaleDateString("en-SG") + "</p>";
                  html += "<p>Active students: " + active.length + " | Lessons this month: " + store.lessons.filter(l => { const d = new Date(l.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length + "</p>";
                  html += "<table><tr><th>Student</th><th>Level</th><th>Subject</th><th>Rate</th><th>Status</th></tr>";
                  active.forEach(s => { html += "<tr><td>" + s.name + "</td><td>" + s.level + "</td><td>" + (s.subject || "") + "</td><td>$" + s.hourlyRate + "</td><td>" + s.status + "</td></tr>"; });
                  html += "</table></body></html>";
                  const w = window.open("", "_blank"); w.document.write(html); w.document.close(); w.print();
                  localStorage.setItem("tutorpulse-last-export", new Date().toISOString());
                }}>PDF Summary</Button>
              </div>
              <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 6 }}>This export is for your records only. It does not delete or change any data.</div>
            </Card>

            <Card style={{ padding: 14 }}>
              <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 10, letterSpacing: 0.5 }}>IMPORT</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <Button size="sm" variant="secondary" icon="download" onClick={() => {
                  try {
                    const wb = XLSX.utils.book_new();
                    // Template with example row
                    const data = [
                      { Name: "John Tan", Level: "Sec 3", Subject: "Chinese", "Subject Detail": "", Stream: "G3", "Stream Detail": "", "Starting Grade": "B3", Status: "active", "Payment Mode": "monthly", "Hourly Rate": 70, Parent: "Mrs. Tan", Phone: "+65 91234567", Email: "tan@email.com", Address: "123 Tampines St 11", "Join Date": "2025-01-15", Notes: "Example — delete these rows" },
                      { Name: "John Tan", Level: "Sec 3", Subject: "Combined Science", "Subject Detail": "Physics/Chemistry", Stream: "Standard", "Stream Detail": "", "Starting Grade": "C5", Status: "active", "Payment Mode": "monthly", "Hourly Rate": 70, Parent: "Mrs. Tan", Phone: "+65 91234567", Email: "tan@email.com", Address: "123 Tampines St 11", "Join Date": "2025-01-15", Notes: "Same student, 2nd subject" },
                      { Name: "Jane Lim", Level: "Sec 2", Subject: "Other", "Subject Detail": "Art", Stream: "Other", "Stream Detail": "IP", "Starting Grade": "", Status: "active", "Payment Mode": "per_lesson", "Hourly Rate": 80, Parent: "Mr. Lim", Phone: "+65 92345678", Email: "lim@email.com", Address: "", "Join Date": "2025-03-01", Notes: "Use Subject/Stream Detail for custom values" },
                    ];
                    const ws = XLSX.utils.json_to_sheet(data);
                    ws["!cols"] = [{ wch: 20 }, { wch: 10 }, { wch: 20 }, { wch: 22 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 24 }, { wch: 28 }, { wch: 12 }, { wch: 30 }];
                    // Reference data
                    const levels = ["P1","P2","P3","P4","P5","P6","Sec 1","Sec 2","Sec 3","Sec 4","Sec 5","JC 1","JC 2","Other"];
                    const subjects = ["English","Chinese","Mathematics","Science","E Math","A Math","Physics","Chemistry","Biology","Combined Science","Geography","History","Literature","Combined Humanities","Food and Nutrition","Design and Technology","Other"];
                    const streams = ["Foundation","Standard","Higher","G1","G2","G3","H1","H2","H3","Other"];
                    const statuses = ["active","trial","paused","graduated"];
                    const payModes = ["monthly","per_lesson"];
                    const maxLen = Math.max(levels.length, subjects.length, streams.length, statuses.length);
                    const refData = [];
                    for (let i = 0; i < maxLen; i++) {
                      refData.push({ "Valid Levels": levels[i] || "", "Valid Subjects": subjects[i] || "", "Valid Streams": streams[i] || "", "Valid Statuses": statuses[i] || "", "Valid Payment Modes": payModes[i] || "" });
                    }
                    const refWs = XLSX.utils.json_to_sheet(refData);
                    refWs["!cols"] = [{ wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 20 }];
                    XLSX.utils.book_append_sheet(wb, ws, "Students");
                    XLSX.utils.book_append_sheet(wb, refWs, "Valid Values");
                    XLSX.writeFile(wb, "tutorpulse-student-template.xlsx");
                    addToast("Template downloaded");
                  } catch (err) { addToast("Template download failed", "error"); }
                }}>Download Template</Button>
                <Button size="sm" variant="secondary" icon="repeat" onClick={() => {
                  const input = document.createElement("input"); input.type = "file"; input.accept = ".csv,.xlsx,.xls";
                  input.onchange = (e) => {
                    const file = e.target.files[0]; if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        let rows = [];
                        if (file.name.endsWith(".csv")) {
                          // CSV parse
                          const lines = ev.target.result.split("\n").filter(l => l.trim());
                          if (lines.length < 2) { addToast("File is empty", "error"); return; }
                          for (let i = 1; i < lines.length; i++) {
                            const cols = lines[i].match(/(".*?"|[^,]+)/g) || [];
                            const clean = (s) => (s || "").replace(/^"|"$/g, "").replace(/""/g, '"').trim();
                            if (cols.length >= 1 && clean(cols[0])) rows.push(cols.map(clean));
                          }
                        } else {
                          // Excel parse
                          const data = new Uint8Array(ev.target.result);
                          const wb = XLSX.read(data, { type: "array" });
                          const ws = wb.Sheets[wb.SheetNames[0]];
                          const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });
                          for (let i = 1; i < jsonData.length; i++) {
                            const r = jsonData[i];
                            if (r && r.length >= 1 && String(r[0] || "").trim()) rows.push(r.map(c => String(c || "").trim()));
                          }
                        }
                        // Columns: Name(0), Level(1), Subject(2), Subject Detail(3), Stream(4), Stream Detail(5), Starting Grade(6), Status(7), Payment Mode(8), Hourly Rate(9), Parent(10), Phone(11), Email(12), Address(13), Join Date(14), Notes(15)
                        const studentMap = {};
                        rows.forEach(cols => {
                          const name = cols[0] || "";
                          if (!name) return;
                          let subject = cols[2] || "Chinese";
                          const subjectDetail = cols[3] || "";
                          let stream = cols[4] || "Standard";
                          const streamDetail = cols[5] || "";
                          const grade = cols[6] || "";
                          // Resolve: if subject is "Other", use detail; if Combined, append detail
                          if (subject === "Other" && subjectDetail) subject = subjectDetail;
                          else if ((subject === "Combined Science" || subject === "Combined Humanities") && subjectDetail) subject = subject + " (" + subjectDetail + ")";
                          if (stream === "Other" && streamDetail) stream = streamDetail;
                          if (!studentMap[name]) {
                            studentMap[name] = {
                              name, level: cols[1] || "Sec 1",
                              subjects: [],
                              status: (cols[7] || "active").toLowerCase(),
                              paymentMode: (cols[8] || "monthly").toLowerCase(),
                              hourlyRate: parseFloat(cols[9]) || 70,
                              parent: cols[10] || "", parentPhone: cols[11] || "", parentEmail: cols[12] || "",
                              address: cols[13] || "",
                              joinDate: cols[14] || new Date().toISOString().split("T")[0],
                              notes: cols[15] || "",
                            };
                          }
                          studentMap[name].subjects.push({ subject, subjectOther: subjectDetail, stream, streamOther: streamDetail, grade });
                        });
                        const newStudents = Object.values(studentMap).map(s => ({
                          id: "s" + genId(),
                          name: s.name, level: s.level,
                          subjects: s.subjects,
                          subject: s.subjects[0].subject, stream: s.subjects[0].stream,
                          status: s.status, paymentMode: s.paymentMode || "monthly", hourlyRate: s.hourlyRate,
                          parent: s.parent, parentPhone: s.parentPhone, parentEmail: s.parentEmail,
                          address: s.address || "",
                          joinDate: s.joinDate, notes: s.notes,
                          avatar: s.name.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2),
                          gradeCurrent: s.subjects[0]?.grade || "", gradeStart: s.subjects[0]?.grade || "", gradeHistory: [],
                        }));
                        if (newStudents.length > 0 && window.confirm("Import " + newStudents.length + " students? This adds to your existing list.")) {
                          setStore((s) => ({ ...s, students: [...s.students, ...newStudents] }));
                          addToast(newStudents.length + " students imported");
                        } else if (newStudents.length === 0) { addToast("No valid rows found", "error"); }
                      } catch (err) { addToast("Failed to read file: " + err.message, "error"); }
                    };
                    if (file.name.endsWith(".csv")) { reader.readAsText(file); } else { reader.readAsArrayBuffer(file); }
                  };
                  input.click();
                }}>Import Students</Button>
                <Button size="sm" variant="secondary" icon="repeat" onClick={() => {
                  const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
                  input.onchange = (e) => {
                    const file = e.target.files[0]; if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const data = JSON.parse(ev.target.result);
                        if (data.students && data.lessons) {
                          if (window.confirm("Replace ALL data with this backup?")) { setStore(data); saveStore(data); addToast("Backup restored"); }
                        } else { addToast("Invalid backup file", "error"); }
                      } catch (err) { addToast("Failed to read file", "error"); }
                    };
                    reader.readAsText(file);
                  };
                  input.click();
                }}>Restore Backup</Button>
              </div>
              <div style={{ padding: 12, background: theme.bgInput, borderRadius: 10, border: "1px solid " + theme.border }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 6 }}>How to import students</div>
                <div style={{ fontSize: 11, color: theme.textMuted, lineHeight: 1.8, whiteSpace: "pre-line" }}>
                  {"1. Download the template above (.xlsx)\n2. Open in Excel or Google Sheets\n3. Level, Subject, Stream and Status columns — see Valid Values tab\n4. For multiple subjects per student, add separate rows\n5. Delete the example row, fill in your students\n6. Save and tap \"Import Students\"\n7. Accepts both .xlsx and .csv files"}
                </div>
              </div>
            </Card>

            {/* Auto-Backups */}
            <Card style={{ padding: 14 }}>
              <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>AUTO-BACKUPS</div>
              <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 10 }}>Your data is automatically backed up daily at 2:00 AM. Last {MAX_BACKUPS} days are kept. We still recommend downloading a Full Backup periodically for safekeeping.</div>
              {(() => {
                const backups = listBackups();
                return backups.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {backups.map(b => (
                      <div key={b.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: theme.bgInput, borderRadius: 8, border: "1px solid " + theme.border }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{new Date(b.date + "T00:00:00").toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</div>
                          <div style={{ fontSize: 10, color: theme.textMuted }}>{b.size} KB</div>
                        </div>
                        <button onClick={() => {
                          if (window.confirm("Restore data from " + b.date + "? This will replace ALL current data.")) {
                            const data = restoreBackup(b.key);
                            if (data) { setStore(data); saveStore(data); addToast("Restored backup from " + b.date); }
                            else { addToast("Failed to restore backup", "error"); }
                          }
                        }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid " + theme.border, background: theme.bgElevated, color: theme.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Restore</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: theme.textMuted, padding: 8 }}>No auto-backups yet. Backups are created automatically when you use the app.</div>
                );
              })()}
            </Card>

            {/* Revenue History Editor */}
            <Card style={{ padding: 14 }}>
              <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>PAST REVENUE (for chart)</div>
              <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 10 }}>Enter your actual monthly revenue for the past months. These appear on the Revenue Trend chart.</div>
              {(() => {
                const history = store.revenueHistory || [];
                const months = [];
                const now = new Date();
                for (let i = 5; i >= 1; i--) {
                  const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                  const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
                  const label = d.toLocaleDateString("en-SG", { month: "short", year: "numeric" });
                  const existing = history.find(h => h.month === key);
                  months.push({ key, label, amount: existing ? existing.amount : "" });
                }
                return months.map((m) => (
                  <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: theme.textSecondary, width: 70, flexShrink: 0 }}>{m.label}</span>
                    <span style={{ fontSize: 13, color: theme.textMuted }}>$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      defaultValue={m.amount}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setStore((s) => {
                          const hist = (s.revenueHistory || []).filter(h => h.month !== m.key);
                          if (val > 0) hist.push({ month: m.key, amount: val });
                          return { ...s, revenueHistory: hist };
                        });
                      }}
                      style={{ flex: 1, padding: "6px 10px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 8, color: theme.text, outline: "none", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}
                    />
                  </div>
                ));
              })()}
            </Card>

            {/* Data Reset */}
            <Card style={{ padding: 14, borderColor: theme.danger + "44" }}>
              <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 8 }}>DANGER ZONE</div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button size="sm" variant="danger" icon="trash" onClick={() => {
                  if (window.confirm("Clear ALL data? This will remove all students, lessons, payments and messages. This cannot be undone.")) {
                    const emptyStore = { students: [], lessons: [], payments: [], messages: [], notifications: [], revenueHistory: [], settings: store.settings || { tutorName: "" } };
                    setStore(emptyStore);
                    saveStore(emptyStore);
                    addToast("All data cleared");
                  }
                }}>Clear All Data</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // MODALS
  // ═══════════════════════════════════════════════════════════

  // ── Student Detail state (at parent level to prevent remount) ──
  const [editingStudent, setEditingStudent] = useState(false);
  const [studentEditForm, setStudentEditForm] = useState({});

  // ── Lesson Detail (inline — not a sub-component, to prevent textarea remount) ──
  const lessonDetailStudent = selectedLesson ? getStudent(selectedLesson.studentId) : null;
  const [editingLesson, setEditingLesson] = useState(false);
  const [cancellingLesson, setCancellingLesson] = useState(false);
  const [lessonEdit, setLessonEdit] = useState({});
  const [deletedLesson, setDeletedLesson] = useState(null);
  const [returnToStudentId, setReturnToStudentId] = useState(null);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds] = useState(new Set());
  const [bulkDeleteCount, setBulkDeleteCount] = useState(0);
  const toggleBulkId = (id) => {
    const ids = bulkDeleteIdsRef.current;
    if (ids.includes(id)) {
      bulkDeleteIdsRef.current = ids.filter(x => x !== id);
    } else {
      bulkDeleteIdsRef.current = [...ids, id];
    }
    setBulkDeleteCount(bulkDeleteIdsRef.current.length);
  };

  const startLessonEdit = () => {
    if (!selectedLesson) return;
    const d = new Date(selectedLesson.date);
    setLessonEdit({
      date: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"),
      time: String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"),
      duration: String(selectedLesson.duration),
      customDuration: String(selectedLesson.duration),
      subject: selectedLesson.subject,
      location: selectedLesson.location,
    });
    setEditingLesson(true);
  };

  const saveLessonEdit = () => {
    const dateTime = new Date(lessonEdit.date + "T" + lessonEdit.time + ":00");
    const dur = lessonEdit.duration === "other" ? (parseInt(lessonEdit.customDuration) || selectedLesson.duration) : parseInt(lessonEdit.duration);
    const updates = { date: dateTime.toISOString(), duration: dur, subject: lessonEdit.subject, location: lessonEdit.location };
    updateLesson(selectedLesson.id, updates);
    setSelectedLesson({ ...selectedLesson, ...updates });
    setEditingLesson(false);
    addToast("Lesson updated");
  };

  const le = (k, v) => setLessonEdit((f) => ({ ...f, [k]: v }));

  const handleDeleteLesson = () => {
    if (!selectedLesson) return;
    const toDelete = { ...selectedLesson };
    const returnTo = returnToStudentId;
    setStore((s) => ({ ...s, lessons: s.lessons.filter((l) => l.id !== toDelete.id) }));
    setSelectedLesson(null);
    setDeletedLesson(toDelete);
    // Return to student profile if we came from there
    if (returnTo) {
      const student = store.students.find(s => s.id === returnTo);
      if (student) setSelectedStudent(student);
      setReturnToStudentId(null);
    }
    const undoId = genId();
    setToasts((t) => [...t, { id: undoId, msg: "Lesson deleted", type: "undo", undoData: toDelete }]);
    setTimeout(() => { setToasts((t) => t.filter((x) => x.id !== undoId)); setDeletedLesson(null); }, 5000);
  };

  const undoDeleteLesson = (lesson) => {
    setStore((s) => ({ ...s, lessons: [...s.lessons, lesson] }));
    setDeletedLesson(null);
    addToast("Lesson restored");
  };

  // (Lesson detail modal is rendered inline in the main return)

  // ── New Lesson Modal (with Recurring) ───────────────────────
  // ── New Lesson form state (at parent level to prevent remount reset) ──
  const [lessonForm, setLessonForm] = useState({ studentId: "", date: "", time: "10:00", duration: "90", customDuration: "", subject: "", location: "Home Studio" });
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurDay, setRecurDay] = useState("1");
  const [recurTime, setRecurTime] = useState("10:00");
  const [recurStartDate, setRecurStartDate] = useState("");
  const [recurEndDate, setRecurEndDate] = useState("");
  const [previewDates, setPreviewDates] = useState([]);
  const updateLessonForm = (k, v) => setLessonForm((f) => ({ ...f, [k]: v }));

  // Sync prefill
  useEffect(() => {
    if (prefillStudentId && showNewLesson) {
      const s = getStudent(prefillStudentId);
      const subs = s && s.subjects && s.subjects.length > 0 ? s.subjects : (s ? [{ subject: s.subject || "", stream: s.stream || "" }] : []);
      const firstSubj = subs.length > 0 ? subs[0].subject + (subs[0].stream ? " (" + subs[0].stream + ")" : "") : "";
      setLessonForm((f) => ({ ...f, studentId: prefillStudentId, subject: firstSubj }));
    }
  }, [prefillStudentId, showNewLesson]);

  // Generate preview dates
  useEffect(() => {
    if (!isRecurring || !recurStartDate || !recurEndDate) { setPreviewDates([]); return; }
    const dates = [];
    const dayNum = parseInt(recurDay);
    const end = new Date(recurEndDate + "T23:59:59");
    let cursor = new Date(recurStartDate + "T00:00:00");
    while (cursor.getDay() !== dayNum) cursor.setDate(cursor.getDate() + 1);
    while (cursor <= end) { dates.push(new Date(cursor)); cursor.setDate(cursor.getDate() + 7); }
    setPreviewDates(dates);
  }, [isRecurring, recurDay, recurStartDate, recurEndDate]);

  // (New lesson modal is rendered inline in the main return)

  // ── New Student Modal ──────────────────────────────────────
  // ── New Student form state (at parent level to prevent remount reset) ──
  const [newStudentForm, setNewStudentForm] = useState({ name: "", level: "P5", levelOther: "", subjects: [{ subject: "Chinese", subjectOther: "", stream: "Standard", streamOther: "" }], parent: "", parentPhone: "", parentEmail: "", hourlyRate: "70", address: "", gradeCurrent: "", notes: "" });
  const updateNewStudentForm = (k, v) => setNewStudentForm((f) => ({ ...f, [k]: v }));

  // (New student modal is rendered inline in the main return)

  // ── Student Detail Modal (with Edit Mode) ───────────────────
  // (Student detail modal is rendered inline in the main return)

  // ── WhatsApp Helpers ─────────────────────────────────────────
  const formatPhoneForWA = (phone) => {
    // Handle new "65|91234567" format
    if ((phone || "").includes("|")) {
      const [c, n] = phone.split("|");
      return (c || "") + (n || "").replace(/\D/g, "");
    }
    // Legacy: strip all non-digits, ensure country code
    let digits = (phone || "").replace(/[^0-9]/g, "");
    if (digits.length === 8 && /^[689]/.test(digits)) digits = "65" + digits;
    if (digits.startsWith("0")) digits = "65" + digits.substring(1);
    return digits;
  };

  const formatPhoneDisplay = (phone) => {
    // Handle new "65|91234567" format
    if ((phone || "").includes("|")) {
      const [c, n] = phone.split("|");
      if (!n) return "";
      return "+" + (c || "65") + " " + n;
    }
    const digits = formatPhoneForWA(phone);
    if (!digits || digits.length < 4) return phone || "";
    const codes3 = ["856","855","673","852","853","886","971","966","974","968","973","965","254","234"];
    const codes2 = ["65","60","62","66","63","84","95","91","86","81","82","61","64","44","33","49","39","34","31","46","41","27","55","52"];
    for (const c of codes3) { if (digits.startsWith(c)) return "+" + c + " " + digits.substring(c.length); }
    for (const c of codes2) { if (digits.startsWith(c)) return "+" + c + " " + digits.substring(c.length); }
    if (digits.startsWith("1") && digits.length === 11) return "+1 " + digits.substring(1);
    return "+" + digits;
  };

  const openWhatsApp = (phone, message) => {
    const waNumber = formatPhoneForWA(phone);
    const encoded = encodeURIComponent(message);
    const url = "https://wa.me/" + waNumber + "?text=" + encoded;
    window.open(url, "_blank");
  };

  // ── Message Compose Modal (WhatsApp + Templates + Fee Breakdown) ──
  // ── Message Compose state (at parent level to prevent remount) ──
  const [msgText, setMsgText] = useState("");
  const [msgGenerating, setMsgGenerating] = useState(false);
  const [msgActiveTemplate, setMsgActiveTemplate] = useState(null);
  const [invoiceMonth, setInvoiceMonth] = useState(() => {
    // Default to previous month
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  });
  const [bulkSentIndex, setBulkSentIndex] = useState(-1);
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [bulkPreviewIdx, setBulkPreviewIdx] = useState(null);
  const msgTextRef = useRef(null);
  const msgTextVersion = useRef(0);
  const setMsgTextAndSync = (text) => { msgTextVersion.current += 1; setMsgText(text); };
  useEffect(() => { if (msgTextRef.current && msgTextVersion.current > 0) { msgTextRef.current.value = msgText; } }, [msgText]);
  const getMsgText = () => { const refVal = msgTextRef.current ? msgTextRef.current.value : ""; return refVal || msgText; };

  const MessageComposeModal = () => {
    const generating = msgGenerating; const setGenerating = setMsgGenerating;
    const activeTemplate = msgActiveTemplate; const setActiveTemplate = setMsgActiveTemplate;
    const isBulk = showMessageCompose === "bulk";
    const student = !isBulk ? getStudent(showMessageCompose) : null;

    // Detect siblings (same parent phone)
    const siblings = useMemo(() => {
      if (!student || !student.parentPhone || isBulk) return [];
      const phone = formatPhoneForWA(student.parentPhone);
      if (!phone || phone.length < 6) return [];
      return store.students.filter(s => s.id !== student.id && formatPhoneForWA(s.parentPhone) === phone);
    }, [student, isBulk, store.students]);

    // Compute bulk recipients early (before other hooks that might reference it)
    const bulkRecipients = useMemo(() => {
      if (!isBulk) return [];
      const currentMonth = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
      return pendingPayments.map((sid) => {
        try {
          const s = getStudent(sid);
          if (!s) return null;
          const calc = calcMonthlyFee(sid, currentMonth);
          return { studentId: sid, studentName: s.name || "Unknown", parentName: s.parent || "Parent", phone: s.parentPhone || "", amount: calc.total || 0, sessions: calc.sessions || 0, totalHours: calc.totalHours || 0, rate: s.hourlyRate || 0 };
        } catch (e) { return null; }
      }).filter(Boolean);
    }, [isBulk, pendingPayments, getStudent, calcMonthlyFee, now]);

    // bulkSelected starts empty — user picks who to send to

    // ── Build lesson & fee data for a given student ──────────
    const buildStudentInvoice = useCallback((sid) => {
      const s = getStudent(sid);
      if (!s) return null;
      // Use invoiceMonth (YYYY-MM format) instead of current month
      const [invYear, invMonth] = invoiceMonth.split("-").map(Number);
      const monthDate = new Date(invYear, invMonth - 1, 1);
      const monthName = monthDate.toLocaleDateString("en-SG", { month: "long", year: "numeric" });

      const monthLessons = store.lessons.filter((l) => {
        const d = new Date(l.date);
        return l.studentId === sid && d.getMonth() === invMonth - 1 && d.getFullYear() === invYear && (l.status !== "cancelled" || l.collectedButCancelled) && !l.excludeFromBilling;
      }).sort((a, b) => new Date(a.date) - new Date(b.date));

      const totalSessions = monthLessons.length;
      const hourlyRate = s.hourlyRate;
      const totalMinutes = monthLessons.reduce((sum, l) => sum + l.duration, 0);
      const totalHours = totalMinutes / 60;
      const totalFee = Math.round(hourlyRate * totalHours * 100) / 100;

      const lessonLines = monthLessons.map((l) => {
        const d = new Date(l.date);
        const dayStr = d.toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" });
        const timeStr = d.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", hour12: true });
        return "  " + dayStr + ", " + timeStr + " (" + l.duration + " min) \u2014 " + l.subject;
      });

      const cancelledLessons = store.lessons.filter((l) => {
        const d = new Date(l.date);
        return l.studentId === sid && d.getMonth() === invMonth - 1 && d.getFullYear() === invYear && l.status === "cancelled";
      });

      const payment = store.payments.find((p) => p.studentId === sid && p.month === invoiceMonth);

      return {
        student: s, monthName, monthLessons, totalSessions, hourlyRate, totalMinutes, totalHours, lessonLines, cancelledLessons, payment,
        paymentStatus: payment ? payment.status : "pending",
        totalFee: totalFee,
        adjustment: 0,
        finalAmount: totalFee,
      };
    }, [store.lessons, store.payments, getStudent, invoiceMonth]);

    // Build combined invoice for student + siblings
    const buildAllInvoices = useCallback((sid) => {
      const invoices = [buildStudentInvoice(sid)];
      if (includeSiblings && siblings.length > 0) {
        siblings.forEach(sib => {
          const inv = buildStudentInvoice(sib.id);
          if (inv) invoices.push(inv);
        });
      }
      return invoices.filter(Boolean);
    }, [buildStudentInvoice, includeSiblings, siblings]);

    // ── Template generators ──────────────────────────────────
    const tName = store.settings?.tutorName || "Your Tutor";
    const payMode = store.settings?.paymentMode || "phone";
    const payDetail = store.settings?.paymentInfo || "";
    const payInfo = payDetail ? ("PayNow to " + (payMode === "uen" ? "UEN " : "") + payDetail) : "PayNow";
    const templateDefs = useMemo(() => [
      {
        id: "invoice", label: "\uD83E\uDDFE Fee Invoice + AI Summary", isPro: true, icon: "dollar",
        desc: "AI progress summary + lesson dates + fee breakdown",
        async: true,
        generate: (sid) => {
          const invoices = buildAllInvoices(sid);
          if (invoices.length === 0) return "";
          const first = invoices[0];
          let msg = "Hi " + first.student.parent + ",\n\n";
          let grandTotal = 0;
          invoices.forEach((inv, i) => {
            if (invoices.length > 1) msg += "\u2014\u2014\u2014 " + inv.student.name + " \u2014\u2014\u2014\n\n";
            msg += "Here is " + inv.student.name + "'s tuition summary for *" + inv.monthName + "*:\n\n";
            msg += "[AI_SUMMARY_" + i + "]\n\n";
            msg += "\uD83D\uDCDA *Lessons (" + inv.totalSessions + " sessions, " + inv.totalHours + "h):*\n";
            inv.monthLessons.forEach((l) => { const d = new Date(l.date); msg += "  \u2022 " + d.toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" }) + ", " + d.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", hour12: true }) + " \u2014 " + l.subject + " (" + l.duration + " min)\n"; });
            msg += "\n";
            if (inv.cancelledLessons.length > 0) msg += "\u274C *Cancelled:* " + inv.cancelledLessons.length + " session(s) excluded\n\n";
            msg += "\uD83D\uDCB0 *Fee:* " + inv.totalHours + "h \u00D7 $" + inv.hourlyRate + "/hr = *$" + inv.finalAmount.toFixed(2) + "*\n\n";
            grandTotal += inv.finalAmount;
          });
          if (invoices.length > 1) msg += "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\uD83D\uDCB0 *Combined Total: $" + grandTotal.toFixed(2) + "*\n\n";
          msg += "\uD83D\uDCB3 *Payment:* " + payInfo + "\nPlease pay by the 10th. Thank you! \uD83D\uDE4F\n\n\u2014 " + tName;
          return msg;
        },
        buildAIPrompt: (sid) => {
          const invoices = buildAllInvoices(sid);
          const prompts = [];
          invoices.forEach((inv, i) => {
            const feedbackNotes = inv.monthLessons.filter(l => l.comment).map(l => l.subject + ": " + l.comment);
            if (feedbackNotes.length > 0) {
              prompts.push({ placeholder: "[AI_SUMMARY_" + i + "]", prompt: "You are " + (store.settings?.tutorName || "a tutor") + ". Based on these session feedback notes for " + inv.student.name + " (" + inv.student.level + " " + (inv.student.stream || "") + ") this month, write a factual 2-3 sentence summary for their parent. State what was covered, how the student performed, and specific areas to work on. Be direct and concise. Notes:\n" + feedbackNotes.join("\n") + "\n\nJust the summary paragraph, no greeting or sign-off. Keep under 60 words." });
            } else {
              prompts.push({ placeholder: "[AI_SUMMARY_" + i + "]", prompt: null });
            }
          });
          return prompts;
        },
      },
      {
        id: "invoice_simple", label: "\uD83D\uDCCB Simple Invoice", icon: "dollar",
        desc: "Lesson dates + fee breakdown (no AI summary)",
        generate: (sid) => {
          const invoices = buildAllInvoices(sid);
          if (invoices.length === 0) return "";
          const first = invoices[0];
          let msg = "Hi " + first.student.parent + ",\n\n";
          let grandTotal = 0;
          invoices.forEach((inv, i) => {
            if (invoices.length > 1) msg += "\u2014\u2014\u2014 " + inv.student.name + " \u2014\u2014\u2014\n\n";
            msg += "Here is " + inv.student.name + "'s tuition summary for *" + inv.monthName + "*:\n\n";
            msg += "\uD83D\uDCDA *Lessons (" + inv.totalSessions + " sessions, " + inv.totalHours + "h):*\n";
            inv.monthLessons.forEach((l) => {
              const d = new Date(l.date);
              const dayStr = d.toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" });
              const timeStr = d.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", hour12: true });
              msg += "  \u2022 " + dayStr + ", " + timeStr + " \u2014 " + l.subject + " (" + l.duration + " min)\n";
            });
            msg += "\n";
            if (inv.cancelledLessons.length > 0) {
              msg += "\u274C *Cancelled:* " + inv.cancelledLessons.length + " session(s) excluded\n\n";
            }
            msg += "\uD83D\uDCB0 *Fee:* " + inv.totalHours + "h \u00D7 $" + inv.hourlyRate + "/hr = *$" + inv.finalAmount.toFixed(2) + "*\n\n";
            grandTotal += inv.finalAmount;
          });
          if (invoices.length > 1) {
            msg += "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n";
            msg += "\uD83D\uDCB0 *Combined Total: $" + grandTotal.toFixed(2) + "*\n\n";
          }
          msg += "\uD83D\uDCB3 *Payment:* " + payInfo + "\nPlease pay by the 10th. Thank you! \uD83D\uDE4F\n\n\u2014 " + tName;
          return msg;
        },
      },
      {
        id: "reminder", label: "\uD83D\uDD14 Payment Reminder", icon: "bell",
        desc: "Quick reminder with sessions count and amount",
        generate: (sid) => {
          const invoices = buildAllInvoices(sid);
          if (invoices.length === 0) return "";
          const first = invoices[0];
          let msg = "Hi " + first.student.parent + ",\n\n";
          let grandTotal = 0;
          invoices.forEach(inv => {
            msg += "Friendly reminder that " + inv.student.name + "'s *" + inv.monthName + "* tuition fee is due:\n";
            msg += "\uD83D\uDCDA " + inv.totalSessions + " lessons (" + inv.totalHours + "h) = *$" + inv.finalAmount.toFixed(2) + "*\n\n";
            grandTotal += inv.finalAmount;
          });
          if (invoices.length > 1) msg += "\uD83D\uDCB0 *Combined Total: $" + grandTotal.toFixed(2) + "*\n\n";
          msg += "\uD83D\uDCB3 " + payInfo + "\n\nIgnore this if already paid! Thank you \uD83D\uDE4F\n\u2014 " + tName;
          return msg;
        },
      },
      {
        id: "overdue", label: "\u26A0\uFE0F Overdue Notice", icon: "clock",
        desc: "Polite follow-up for overdue payments",
        generate: (sid) => {
          const invoices = buildAllInvoices(sid);
          if (invoices.length === 0) return "";
          const first = invoices[0];
          let msg = "Hi " + first.student.parent + ",\n\n";
          msg += "I hope all is well! I noticed the following tuition fee(s) are still outstanding:\n\n";
          let grandTotal = 0;
          invoices.forEach(inv => {
            msg += "*" + inv.student.name + "* \u2014 " + inv.monthName + "\n";
            msg += "  " + inv.totalSessions + " sessions (" + inv.totalHours + "h) = *$" + inv.finalAmount.toFixed(2) + "*\n\n";
            grandTotal += inv.finalAmount;
          });
          if (invoices.length > 1) msg += "\uD83D\uDCB0 *Combined Total: $" + grandTotal.toFixed(2) + "*\n\n";
          msg += "Kindly arrange payment via " + payInfo + " at your earliest convenience.\n\nThank you for your understanding \uD83D\uDE4F\n\u2014 " + tName;
          return msg;
        },
      },
      {
        id: "schedule", label: "\uD83D\uDCC5 Upcoming Schedule", icon: "calendar",
        desc: "Share upcoming lesson dates and topics",
        generate: (sid) => {
          const invoices = buildAllInvoices(sid);
          if (invoices.length === 0) return "";
          const first = invoices[0];
          const allSids = invoices.map(inv => inv.student.id);
          const upcoming = store.lessons.filter((l) => allSids.includes(l.studentId) && new Date(l.date) >= new Date() && l.status !== "cancelled").sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 8);
          let msg = "Hi " + first.student.parent + ",\n\n";
          msg += invoices.length > 1 ? "Here is the upcoming schedule:\n\n" : "Here is " + first.student.name + "'s upcoming schedule:\n\n";
          if (upcoming.length > 0) {
            upcoming.forEach((l) => {
              const d = new Date(l.date);
              const dayStr = d.toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" });
              const timeStr = d.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", hour12: true });
              msg += "\uD83D\uDCD6 " + dayStr + " at " + timeStr + (allSids.length > 1 ? " \u2014 " + ((getStudent(l.studentId) || {}).name || "") : "") + "\n   " + l.subject + " (" + l.duration + " min, " + l.location + ")\n\n";
            });
          } else {
            msg += "(No upcoming lessons scheduled yet)\n\n";
          }
          msg += "Let me know if any changes are needed.\n\nThank you! \uD83D\uDE4F\n\u2014 " + tName;
          return msg;
        },
      },
      {
        id: "homework", label: "\uD83D\uDCDD Homework Summary", icon: "edit",
        desc: "Homework from selected month's lesson records",
        generate: (sid) => {
          const invoices = buildAllInvoices(sid);
          if (invoices.length === 0) return "";
          const first = invoices[0];
          const [iy, im] = invoiceMonth.split("-").map(Number);
          const mName = new Date(iy, im - 1, 1).toLocaleDateString("en-SG", { month: "long", year: "numeric" });
          let msg = "Hi " + first.student.parent + ",\n\n";
          invoices.forEach(inv => {
            if (invoices.length > 1) msg += "\u2014\u2014\u2014 " + inv.student.name + " \u2014\u2014\u2014\n";
            msg += "Homework for " + inv.student.name + " \u2014 *" + mName + "*:\n\n";
            const lessons = store.lessons.filter(l => { const d = new Date(l.date); return l.studentId === inv.student.id && d.getMonth() === im - 1 && d.getFullYear() === iy && l.homework; }).sort((a, b) => new Date(a.date) - new Date(b.date));
            if (lessons.length > 0) { lessons.forEach(l => { const d = new Date(l.date); msg += "\uD83D\uDCCC " + d.toLocaleDateString("en-SG", { day: "numeric", month: "short" }) + ": " + l.homework + "\n"; }); }
            else { msg += "(No homework recorded)\n"; }
            msg += "\n";
          });
          msg += "Please ensure all homework is completed before the next session.\n\nThank you! \uD83D\uDE4F\n\u2014 " + tName;
          return msg;
        },
      },
      {
        id: "progress", label: "\uD83D\uDCC8 Progress Summary", isPro: true, icon: "check",
        desc: "AI-generated progress summary from session feedback",
        async: true,
        generate: (sid) => {
          const invoices = buildAllInvoices(sid);
          if (invoices.length === 0) return "";
          const first = invoices[0];
          let msg = "Hi " + first.student.parent + ",\n\n";
          invoices.forEach((inv, i) => {
            if (invoices.length > 1) msg += "\u2014\u2014\u2014 " + inv.student.name + " \u2014\u2014\u2014\n";
            msg += "Progress update for " + inv.student.name + ":\n\n";
            msg += "[AI_PROGRESS_" + i + "]\n\n";
          });
          msg += "Thank you for your continued support! \uD83D\uDE4F\n\u2014 " + tName;
          return msg;
        },
        buildAIPrompt: (sid) => {
          // Returns array of { placeholder, prompt, studentId } for each student
          const invoices = buildAllInvoices(sid);
          const prompts = [];
          const [iy, im] = invoiceMonth.split("-").map(Number);
          invoices.forEach((inv, i) => {
            const feedbacks = store.lessons.filter(l => { const d = new Date(l.date); return l.studentId === inv.student.id && d.getMonth() === im - 1 && d.getFullYear() === iy && l.comment; }).map(l => l.subject + ": " + l.comment);
            if (feedbacks.length > 0) {
              prompts.push({ placeholder: "[AI_PROGRESS_" + i + "]", prompt: "You are " + tName + ". Based on these session notes for " + inv.student.name + " (" + inv.student.level + " " + (inv.student.subject || "") + "), write a factual 2-3 sentence summary. State what was covered, how the student performed, and specific areas to work on. Be direct and concise. Under 60 words. Just the summary.\nNotes:\n" + feedbacks.join("\n") });
            } else {
              prompts.push({ placeholder: "[AI_PROGRESS_" + i + "]", prompt: null });
            }
          });
          return prompts;
        },
      },
      {
        id: "discipline", label: "\u26A0\uFE0F Discipline Note", icon: "bell",
        desc: "Report a behaviour or discipline concern",
        generate: (sid) => {
          const s = getStudent(sid);
          if (!s) return "";
          let msg = "Hi " + s.parent + ",\n\n";
          msg += "I would like to bring something to your attention regarding " + s.name + "'s recent behaviour during lessons.\n\n";
          msg += "[Please describe the concern here]\n\n";
          msg += "I believe that with your support, we can work together to help " + s.name + " stay focused and make better progress.\n\n";
          msg += "Would you be available for a brief discussion? Thank you for your understanding.\n\n\u2014 " + tName;
          return msg;
        },
      },
      {
        id: "termination", label: "\uD83D\uDED1 Termination Notice", icon: "x",
        desc: "Formal notice to end tuition arrangement",
        generate: (sid) => {
          const s = getStudent(sid);
          if (!s) return "";
          let msg = "Hi " + s.parent + ",\n\n";
          msg += "Thank you for entrusting " + s.name + "'s education with me. After careful consideration, I would like to inform you that our tuition arrangement will come to an end.\n\n";
          msg += "Last lesson date: [please specify]\n\n";
          msg += "It has been a pleasure working with " + s.name + " and I wish them all the best in their future studies.\n\n";
          msg += "Please feel free to reach out if you need any recommendations for other tutors.\n\nBest regards,\n" + tName;
          return msg;
        },
      },
      {
        id: "ai_custom", label: "\u2728 AI Custom Draft", isPro: true, icon: "ai",
        desc: "AI writes a custom message based on your instructions",
        async: true,
        generate: () => "",
      },
    ], [buildStudentInvoice, store.lessons, getStudent]);

    // Build list of recipients for bulk mode
    const personalizeMessage = (template, recipient) => {
      return template
        .replace(/\[Student Name\]/gi, recipient.studentName)
        .replace(/\[Parent Name\]/gi, recipient.parentName)
        .replace(/\[Amount\]/gi, "$" + recipient.amount)
        .replace(/\[Student\]/gi, recipient.studentName)
        .replace(/\[Name\]/gi, recipient.studentName);
    };

    const applyTemplate = async (tplId) => {
      setMsgActiveTemplate(tplId);
      const tpl = templateDefs.find((t) => t.id === tplId);
      if (!tpl) return;

      // AI Custom Draft — show prompt input
      if (tplId === "ai_custom") { setMsgText(""); setMsgActiveTemplate("ai_custom"); return; }

      const targetSid = isBulk && bulkRecipients.length > 0 ? bulkRecipients[0].studentId : showMessageCompose;
      let msg = tpl.generate(targetSid);

      // If template has AI, fetch it
      if (tpl.buildAIPrompt) {
        const aiResult = tpl.buildAIPrompt(targetSid);
        // Handle array of prompts (progress with siblings) vs single prompt string
        if (Array.isArray(aiResult)) {
          // Multiple AI prompts (one per student)
          let loadingMsg = msg;
          aiResult.forEach(p => { loadingMsg = loadingMsg.replace(p.placeholder, "\u23F3 _Generating..._"); });
          setMsgText(loadingMsg);
          setMsgGenerating(true);
          try {
            for (const p of aiResult) {
              if (p.prompt) {
                const response = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: p.prompt }] }) });
                const data = await response.json();
                const summary = (data.content || []).filter(c => c.type === "text").map(c => c.text).join("\n").trim();
                msg = msg.replace(p.placeholder, summary ? (p.placeholder.includes("SUMMARY") ? "\uD83D\uDCCA *Monthly Progress:*\n" + summary : summary) : "(No feedback recorded)");
              } else {
                msg = msg.replace(p.placeholder, "(No session feedback recorded this month)");
              }
            }
          } catch (err) {
            aiResult.forEach(p => { msg = msg.replace(p.placeholder, "(AI unavailable)"); });
          }
          setMsgGenerating(false);
        } else {
          // No AI prompts — strip any remaining placeholders
          msg = msg.replace(/\[AI_SUMMARY_\d+\]\n?\n?/g, "").replace(/\[AI_PROGRESS_\d+\]\n?\n?/g, "");
        }
      }

      setMsgText(msg);
    };

    const generateAIMessage = async () => {
      setMsgGenerating(true);
      setMsgActiveTemplate("ai");
      try {
        let aiContext = "";
        if (!isBulk && student) {
          const inv = buildStudentInvoice(showMessageCompose);
          if (inv) {
            aiContext = "Student: " + inv.student.name + ", Level: " + inv.student.level + " " + inv.student.stream +
              ", Parent: " + inv.student.parent + ", Fee: $" + inv.totalFee +
              ", Sessions: " + inv.totalSessions + " (" + inv.totalMinutes + " min)" +
              ", Cancelled: " + inv.cancelledLessons.length + ", Due: $" + inv.finalAmount +
              ", Lessons: " + inv.lessonLines.join("; ");
          }
        }
        const prompt = isBulk
          ? "Generate a polite WhatsApp fee collection message with [Student Name] and [Amount] placeholders. Sign off as " + tName + ". Under 100 words. Just the message."
          : "Generate a polite WhatsApp fee message using this data: " + aiContext + ". Include lesson dates, session feedback notes if available, fee breakdown, total due. Sign off as " + tName + ". Just the message, no preamble.";
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
        });
        const data = await response.json();
        const text = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
        setMsgText(text || "Unable to generate. Try a template instead.");
      } catch (err) {
        setMsgText("AI unavailable. Try using a template instead.");
      }
      setMsgGenerating(false);
    };

    const WAIcon = ({ size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366" style={{ flexShrink: 0 }}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    );

    return (
      <Modal open={!!showMessageCompose} onClose={() => { setShowMessageCompose(null); setMsgText(""); setBulkSentIndex(-1); setBulkSelected(new Set()); setBulkPreviewIdx(null); setMsgActiveTemplate(null); setMessageTarget("parent"); setIncludeSiblings(false); }} title={isBulk ? "Fee Reminders via WhatsApp" : "WhatsApp " + (student ? (messageTarget === "student" ? student.name : student.parent) : "")} width={540}>

        {/* Single: parent card */}
        {!isBulk && student && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, background: theme.bgElevated, borderRadius: 12, marginBottom: 16, border: "1px solid " + theme.border }}>
            <Avatar initials={student.avatar} size={40} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{messageTarget === "student" ? student.name : student.parent}</div>
              <div style={{ fontSize: 12, color: theme.textSecondary }}>{formatPhoneDisplay(messageTarget === "student" ? student.studentPhone : student.parentPhone)} · {messageTarget === "student" ? "Student" : student.name} (${student.hourlyRate}/hr)</div>
            </div>
            {student.studentPhone && student.parentPhone && (
              <button onClick={() => setMessageTarget(messageTarget === "parent" ? "student" : "parent")} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid " + theme.border, background: theme.bgInput, color: theme.accent, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                → {messageTarget === "parent" ? "Student" : "Parent"}
              </button>
            )}
          </div>
        )}
        {/* Sibling detection */}
        {!isBulk && student && siblings.length > 0 && (
          <div style={{ marginBottom: 12, padding: 10, background: theme.bgElevated, borderRadius: 10, border: "1px solid " + theme.border }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={includeSiblings} onChange={() => setIncludeSiblings(!includeSiblings)} style={{ accentColor: theme.accent, cursor: "pointer" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: includeSiblings ? theme.accent : theme.textSecondary }}>Include sibling{siblings.length > 1 ? "s" : ""}: {siblings.map(s => s.name).join(", ")}</div>
                <div style={{ fontSize: 10, color: theme.textMuted }}>Combine into one message to {student.parent}</div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk: recipients with checkboxes */}
        {isBulk && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, letterSpacing: 0.5 }}>RECIPIENTS ({bulkSelected.size}/{bulkRecipients.length})</div>
              <button onClick={() => { bulkSelected.size === bulkRecipients.length ? setBulkSelected(new Set()) : setBulkSelected(new Set(bulkRecipients.map((_, i) => i))); }} style={{ background: "none", border: "none", color: theme.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{bulkSelected.size === bulkRecipients.length ? "Deselect All" : "Select All"}</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 140, overflow: "auto" }}>
              {bulkRecipients.map((r, idx) => (
                <div key={r.studentId + idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 10, background: bulkPreviewIdx === idx ? theme.accentBg : (idx <= bulkSentIndex ? theme.successBg : theme.bgElevated), border: "1px solid " + (bulkPreviewIdx === idx ? theme.accent + "66" : idx <= bulkSentIndex ? theme.success + "44" : theme.border), cursor: "pointer", transition: "all 0.2s" }}>
                  <input type="checkbox" checked={bulkSelected.has(idx)} onChange={(e) => { e.stopPropagation(); const s = new Set(bulkSelected); s.has(idx) ? s.delete(idx) : s.add(idx); setBulkSelected(s); }} style={{ accentColor: theme.accent, cursor: "pointer", flexShrink: 0 }} />
                  <div onClick={() => { setBulkPreviewIdx(bulkPreviewIdx === idx ? null : idx); if (activeTemplate && bulkPreviewIdx !== idx) { const tpl = templateDefs.find(t => t.id === activeTemplate); if (tpl && !tpl.async) { const msg = tpl.generate(r.studentId); setMsgText(msg); } } }} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <Avatar initials={r.studentName.split(" ").map(w => w[0]).join("").substring(0, 2)} size={24} color={idx <= bulkSentIndex ? theme.success : theme.accent} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: idx <= bulkSentIndex ? theme.success : theme.text }}>{r.parentName}</span>
                    <span style={{ fontSize: 11, color: theme.textMuted }}>{r.studentName} · ${r.amount}</span>
                  </div>
                  {idx <= bulkSentIndex && <Icon name="check" size={14} color={theme.success} />}
                </div>
              ))}
            </div>
            {bulkPreviewIdx !== null && <div style={{ fontSize: 10, color: theme.accent, marginTop: 4 }}>Previewing message for {bulkRecipients[bulkPreviewIdx]?.parentName}</div>}
          </div>
        )}

        {/* ── TEMPLATE SELECTOR ─────────────────────────────── */}
        <div style={{ marginBottom: 14 }}>
          {/* Invoice month picker */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, letterSpacing: 0.5 }}>INVOICE FOR</span>
            <select value={invoiceMonth.split("-")[1]} onChange={(e) => setInvoiceMonth(invoiceMonth.split("-")[0] + "-" + e.target.value)} style={{ padding: "4px 8px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 6, color: theme.text, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>
              {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m, i) => (
                <option key={m} value={m}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i]}</option>
              ))}
            </select>
            <select value={invoiceMonth.split("-")[0]} onChange={(e) => setInvoiceMonth(e.target.value + "-" + invoiceMonth.split("-")[1])} style={{ padding: "4px 8px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 6, color: theme.text, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>
              {[2025, 2026, 2027, 2028].map(y => (<option key={y} value={y}>{y}</option>))}
            </select>
          </div>
          <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>CHOOSE TEMPLATE</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {templateDefs.map((tpl) => (
              <button key={tpl.id} onClick={() => applyTemplate(tpl.id)} style={{ textAlign: "left", padding: "10px 12px", borderRadius: 10, border: "1px solid " + (activeTemplate === tpl.id ? theme.accent + "88" : theme.border), background: activeTemplate === tpl.id ? theme.accentBg : theme.bgElevated, cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif" }} onMouseEnter={(e) => { if (activeTemplate !== tpl.id) e.currentTarget.style.borderColor = theme.borderLight; }} onMouseLeave={(e) => { if (activeTemplate !== tpl.id) e.currentTarget.style.borderColor = theme.border; }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: activeTemplate === tpl.id ? theme.accent : theme.text, marginBottom: 2 }}>{tpl.label}{tpl.isPro && <span style={{ marginLeft: 6, padding: "1px 5px", borderRadius: 4, background: theme.purple + "22", color: theme.purple, fontSize: 8, fontWeight: 700, letterSpacing: 0.5, verticalAlign: "middle" }}>PRO</span>}</div>
                <div style={{ fontSize: 10, color: theme.textMuted, lineHeight: 1.3 }}>{tpl.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── AI CUSTOM PROMPT INPUT ─────────────────────────── */}
        {activeTemplate === "ai_custom" && (
          <div style={{ marginBottom: 14, padding: 12, background: theme.bgElevated, borderRadius: 12, border: "1px solid " + theme.purple + "44" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.purple, marginBottom: 6, letterSpacing: 0.5 }}>WHAT SHOULD THE AI WRITE? <span style={{ padding: "1px 5px", borderRadius: 4, background: theme.purple + "22", color: theme.purple, fontSize: 8, fontWeight: 700 }}>PRO</span></label>
            <textarea id="ai-custom-prompt" placeholder="e.g. Write a thank you message to the parent for their support this term..." rows={3} style={{ width: "100%", padding: "10px 14px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 10, color: theme.text, outline: "none", fontSize: 13, fontFamily: "'DM Sans', sans-serif", resize: "vertical" }} />
            <button onClick={async () => {
              const customPrompt = document.getElementById("ai-custom-prompt")?.value;
              if (!customPrompt?.trim()) { addToast("Please describe what you want", "error"); return; }
              setMsgGenerating(true);
              try {
                let context = "";
                if (!isBulk && student) {
                  const inv = buildStudentInvoice(showMessageCompose);
                  if (inv) context = "Student: " + inv.student.name + ", Level: " + inv.student.level + ", Parent: " + inv.student.parent + ", Lessons this month: " + inv.totalSessions + ", Fee: $" + inv.totalFee;
                }
                const fullPrompt = "You are " + tName + ", a tutor. " + (context ? "Context: " + context + ". " : "") + "Write a WhatsApp message based on this request: " + customPrompt + "\n\nKeep it warm and professional. Just the message, no preamble.";
                const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: fullPrompt }] }) });
                const data = await res.json();
                const text = (data.content || []).filter(c => c.type === "text").map(c => c.text).join("\n");
                setMsgText(text || "AI couldn't generate. Try again.");
              } catch (err) { setMsgText("AI unavailable. Please try again."); }
              setMsgGenerating(false);
            }} disabled={msgGenerating} style={{ marginTop: 8, padding: "8px 16px", borderRadius: 8, border: "none", background: theme.purple, color: "white", fontSize: 12, fontWeight: 700, cursor: msgGenerating ? "wait" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: msgGenerating ? 0.6 : 1 }}>
              {msgGenerating ? "\u23F3 Generating..." : "\u2728 Generate Message"}
            </button>
          </div>
        )}

        {/* ── MESSAGE EDITOR ────────────────────────────────── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: 0.5, textTransform: "uppercase" }}>
              Message {activeTemplate && activeTemplate !== "ai" ? "— " + (templateDefs.find(t => t.id === activeTemplate) || {}).label : ""}
            </label>
            {getMsgText() && <span style={{ fontSize: 10, color: theme.textMuted }}>{getMsgText().length} chars</span>}
          </div>
          <textarea ref={msgTextRef} key={"msg-" + showMessageCompose} defaultValue={msgText} onBlur={(e) => { setMsgText(e.target.value); }} placeholder="Select a template above, or type your own..." rows={10} style={{ width: "100%", padding: "12px 14px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 10, color: theme.text, outline: "none", fontSize: 12, fontFamily: "'DM Sans', sans-serif", resize: "vertical", lineHeight: 1.6 }} />
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {["Chinese (中文)", "Malay", "Tamil"].map((lang) => (
              <button key={lang} onClick={async () => {
                const currentTxt = getMsgText();
                if (!currentTxt) return;
                setMsgGenerating(true);
                try {
                  const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: "Translate this message to " + lang.split(" (")[0] + ". Keep emoji and formatting. Just the translation, no preamble:\n\n" + currentTxt }] }) });
                  const data = await res.json();
                  const text = (data.content || []).filter(c => c.type === "text").map(c => c.text).join("\n");
                  if (text) { setMsgText(text); addToast("Translated to " + lang.split(" (")[0]); }
                } catch (err) { addToast("Translation failed", "error"); }
                setMsgGenerating(false);
              }} disabled={msgGenerating || !getMsgText()} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid " + theme.border, background: theme.bgElevated, color: theme.textSecondary, fontSize: 11, fontWeight: 600, cursor: msgGenerating || !getMsgText() ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: getMsgText() ? 1 : 0.4 }}>
                Translate → {lang}
              </button>
            ))}
          </div>
        </div>

        {/* ── SEND BUTTONS ──────────────────────────────────── */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {isBulk ? (
            (() => {
              const selectedList = bulkRecipients.filter((_, i) => bulkSelected.has(i));
              const sentCount = bulkSentIndex + 1;
              return selectedList.length === 0 ? (
                <div style={{ fontSize: 13, color: theme.textMuted }}>Select at least one recipient above</div>
              ) : sentCount < selectedList.length ? (
                <>
                  <button onClick={() => {
                    const txt = getMsgText();
                    if (!txt.trim() && !activeTemplate) { addToast("Select a template or type a message", "error"); return; }
                    if (selectedList.length === 0) { addToast("Select at least one recipient", "error"); return; }
                    const nextIdx = bulkSentIndex + 1;
                    const recipient = selectedList[nextIdx];
                    let personalMsg = txt;
                    if (activeTemplate && activeTemplate !== "ai") {
                      const tpl = templateDefs.find((t) => t.id === activeTemplate);
                      if (tpl) {
                        personalMsg = tpl.generate(recipient.studentId);
                        personalMsg = personalMsg.replace(/\[AI_SUMMARY_\d+\]\n?\n?/g, "").replace(/\[AI_PROGRESS_\d+\]\n?\n?/g, "");
                      }
                    } else {
                      personalMsg = personalizeMessage(txt, recipient);
                    }
                    setStore((s) => ({ ...s, messages: [...s.messages, { id: "m" + genId(), parentId: recipient.studentId, direction: "out", text: personalMsg, date: new Date().toISOString(), read: true }] }));
                    openWhatsApp(recipient.phone, personalMsg);
                    setBulkSentIndex(nextIdx);
                    if (nextIdx < selectedList.length - 1 && activeTemplate && activeTemplate !== "ai") {
                      const tpl = templateDefs.find((t) => t.id === activeTemplate);
                      if (tpl) {
                        let nextMsg = tpl.generate(selectedList[nextIdx + 1].studentId);
                        nextMsg = nextMsg.replace(/\[AI_SUMMARY_\d+\]\n?\n?/g, "").replace(/\[AI_PROGRESS_\d+\]\n?\n?/g, "");
                        setMsgText(nextMsg);
                      }
                    }
                    if (nextIdx === selectedList.length - 1) addToast("All " + selectedList.length + " messages opened!");
                  }} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, border: "none", background: "#25D366", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 2px 12px rgba(37, 211, 102, 0.3)" }}>
                    <WAIcon />
                    {bulkSentIndex === -1 ? "Send to " + selectedList[0]?.parentName + " (1/" + selectedList.length + ")" : "Next: " + selectedList[bulkSentIndex + 1]?.parentName + " (" + (bulkSentIndex + 2) + "/" + selectedList.length + ")"}
                  </button>
                  {bulkSentIndex > -1 && (
                    <div style={{ fontSize: 12, color: theme.success, display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="check" size={14} color={theme.success} /> {sentCount}/{selectedList.length} sent
                    </div>
                  )}
                </>
              ) : (
                <Button variant="success" icon="check" onClick={() => { setShowMessageCompose(null); setMsgText(""); setBulkSentIndex(-1); setBulkSelected(new Set()); setBulkPreviewIdx(null); setMsgActiveTemplate(null); }}>All Done!</Button>
              );
            })()
          ) : (
            <button onClick={() => {
              const txt = getMsgText();
              if (!txt.trim()) { addToast("Select a template or type a message", "error"); return; }
              if (!student) { addToast("Student not found", "error"); return; }
              setStore((s) => ({ ...s, messages: [...s.messages, { id: "m" + genId(), parentId: showMessageCompose, direction: "out", text: txt, date: new Date().toISOString(), read: true }] }));
              openWhatsApp(messageTarget === "student" ? student.studentPhone : student.parentPhone, txt);
              addToast("WhatsApp opened for " + (student.parent || "parent"));
              setShowMessageCompose(null); setMsgText(""); setMsgActiveTemplate(null);
            }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "14px 20px", borderRadius: 12, border: "none", background: "#25D366", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 2px 12px rgba(37, 211, 102, 0.3)", whiteSpace: "nowrap", flex: 1, lineHeight: 1, minHeight: 48 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><WAIcon /> Send via WhatsApp</span>
            </button>
          )}
          <Button variant="secondary" onClick={() => { setShowMessageCompose(null); setMsgText(""); setBulkSentIndex(-1); setBulkSelected(new Set()); setBulkPreviewIdx(null); setMsgActiveTemplate(null); }} style={{ flex: "0 0 auto" }}>Cancel</Button>
        </div>
        {!isBulk && student && (
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 8, textAlign: "center" }}>Opens WhatsApp with {messageTarget === "student" ? student.name : student.parent}'s number ({formatPhoneDisplay(messageTarget === "student" ? student.studentPhone : student.parentPhone)}) pre-filled</div>
        )}
      </Modal>
    );
  };

  // ── AI Assistant Modal ─────────────────────────────────────
  const AIAssistantModal = () => {
    const [prompt, setPrompt] = useState("");
    return (
      <Modal open={showAI} onClose={() => { setShowAI(false); setAiResult(""); }} title="TutorPulse AI" width={540}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, background: theme.purpleBg, borderRadius: 12, marginBottom: 16, border: `1px solid ${theme.purple}33` }}>
          <Icon name="ai" size={24} color={theme.purple} />
          <div style={{ flex: 1, fontSize: 13, color: theme.textSecondary }}>AI assistant powered by Claude — ask about scheduling, fees, lesson plans, or student progress.</div>
          <span style={{ padding: "2px 6px", borderRadius: 4, background: theme.success + "22", color: theme.success, fontSize: 8, fontWeight: 700, letterSpacing: 0.5, whiteSpace: "nowrap" }}>5/mo FREE</span>
        </div>

        {aiLoading && (
          <div style={{ textAlign: "center", padding: 30 }}>
            <div style={{ display: "inline-block", width: 32, height: 32, borderRadius: "50%", border: `3px solid ${theme.border}`, borderTopColor: theme.accent, animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ marginTop: 12, fontSize: 13, color: theme.textSecondary }}>Thinking...</div>
          </div>
        )}

        {aiConversation.length > 0 && (
          <div style={{ marginBottom: 16, maxHeight: 400, overflow: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {aiConversation.map((msg, i) => (
              <div key={i} style={{ padding: 12, borderRadius: 12, fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", background: msg.role === "user" ? theme.accentBg : theme.bgElevated, border: "1px solid " + (msg.role === "user" ? theme.accent + "44" : theme.border), color: msg.role === "user" ? theme.accent : theme.textSecondary, alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "95%" }}>
                {msg.role === "user" ? (
                  <div style={{ fontSize: 10, color: theme.textMuted, marginBottom: 4, fontWeight: 600 }}>YOU</div>
                ) : (
                  <div style={{ fontSize: 10, color: theme.purple, marginBottom: 4, fontWeight: 600 }}>AI</div>
                )}
                {msg.content.replace(/\*\*/g, "").replace(/\*/g, "").replace(/#{1,3}\s/g, "").replace(/`/g, "")}
              </div>
            ))}
          </div>
        )}
        {aiResult && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <Button size="sm" variant="secondary" icon="repeat" onClick={() => { setAiResult(""); setAiConversation([]); setPrompt(""); }}>New Question</Button>
          </div>
        )}

        {!aiResult && !aiLoading && (() => {
          const suggestions = ["How much did I earn last month?", "Which students have not paid yet?", "How many hours did I teach this week?", "Who are my highest earning students?", "Summarise my schedule for this week", "Which student has the most lessons this month?", "What is my projected income this month?", "Are there any scheduling clashes coming up?"];
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, justifyContent: "center" }}>
              <button onClick={() => setAiSugIdx((aiSugIdx - 1 + suggestions.length) % suggestions.length)} style={{ background: "none", border: "none", color: theme.textMuted, fontSize: 16, cursor: "pointer", padding: "4px" }}>&lt;</button>
              <div onClick={() => { setPrompt(suggestions[aiSugIdx]); }} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid " + theme.accent + "44", background: theme.accentBg, color: theme.accent, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "center", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{suggestions[aiSugIdx]}</div>
              <button onClick={() => setAiSugIdx((aiSugIdx + 1) % suggestions.length)} style={{ background: "none", border: "none", color: theme.textMuted, fontSize: 16, cursor: "pointer", padding: "4px" }}>&gt;</button>
            </div>
          );
        })()}

        <div style={{ display: "flex", gap: 8 }}>
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={aiResult ? "Follow up or ask for more detail..." : "Ask TutorPulse AI anything..."} style={{ flex: 1, padding: "10px 14px", background: theme.bgInput, border: `1px solid ${theme.border}`, borderRadius: 10, color: theme.text, outline: "none", fontSize: 13 }} onKeyDown={(e) => { if (e.key === "Enter" && prompt.trim()) { if (aiResult) { callAI(prompt, true); } else { callAI(prompt); } setPrompt(""); } }} />
          <Button size="sm" icon="send" onClick={() => { if (prompt.trim()) { if (aiResult) { callAI(prompt, true); } else { callAI(prompt); } setPrompt(""); } }} disabled={aiLoading || !prompt.trim()}>{aiResult ? "Reply" : "Ask"}</Button>
        </div>

        {/* AI History */}
        {aiHistory.length > 0 && !aiResult && (
          <div style={{ marginTop: 16, borderTop: "1px solid " + theme.border, paddingTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, letterSpacing: 0.5 }}>HISTORY ({aiHistory.length})</div>
              <button onClick={() => { updateAiHistory([]); addToast("History cleared"); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: theme.danger, fontFamily: "'DM Sans', sans-serif" }}>Clear All</button>
            </div>
            <div style={{ maxHeight: 250, overflow: "auto" }}>
              {aiHistory.map((h, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: i < aiHistory.length - 1 ? "1px solid " + theme.border : "none", cursor: "pointer" }} onClick={() => {
                  // Restore the full conversation thread
                  setAiResult(h.a);
                  if (h.conversation) setAiConversation(h.conversation);
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, marginBottom: 2 }}>{h.q}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>{h.time} · {(h.conversation ? Math.floor(h.conversation.length / 2) + " messages" : "")} · {h.a.substring(0, 50)}...</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    );
  };

  // ── Notifications Panel ────────────────────────────────────
  const NotificationsPanel = () => (
    <Modal open={showNotif} onClose={() => setShowNotif(false)} title="Notifications" width={380}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {store.notifications.map((n) => (
          <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 12, background: n.read ? "transparent" : theme.accentBg, borderRadius: 10, border: `1px solid ${n.read ? theme.border : theme.accent + "33"}` }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: n.read ? "transparent" : theme.accent, marginTop: 6, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, lineHeight: 1.4 }}>{n.text}</div>
              <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{n.time}</div>
            </div>
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm" style={{ marginTop: 12, width: "100%" }} onClick={() => { setStore((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) })); addToast("All notifications marked as read"); }}>
        Mark all as read
      </Button>
    </Modal>
  );

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  const pages = { home: HomePage, schedule: SchedulePage, students: StudentsPageWrapper, payments: PaymentsPage, admin: AdminPage };
  const PageComponent = pages[page];

  // Loading screen while persistence loads
  if (!loaded) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <style>{css}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, " + theme.accent + ", " + theme.accentDark + ")", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, color: theme.bg, margin: "0 auto 16px", animation: "glow 2s ease infinite" }}>TP</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>TutorPulse</div>
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>Loading your data...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: theme.bg, position: "relative", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{css}</style>

      {/* Top Bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10, 14, 23, 0.9)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: theme.bg }}>
            TP
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>TutorPulse</div>
            <div style={{ fontSize: 9, color: theme.textMuted, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>智教通</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setShowAI(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: theme.purple }}>
            <Icon name="ai" size={22} color={theme.purple} />
          </button>
          <button onClick={() => setShowNotif(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, position: "relative" }}>
            <Icon name="bell" size={22} color={theme.textSecondary} />
            {unreadNotifs > 0 && (
              <span style={{ position: "absolute", top: 0, right: 0, width: 16, height: 16, borderRadius: 8, background: theme.danger, color: "white", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadNotifs}</span>
            )}
          </button>
        </div>
      </div>

      {/* Page Content */}
      <div style={{ padding: "20px 16px 100px" }}>
        <PageComponent />
      </div>

      {/* Bottom Navigation */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "8px 12px 12px", background: "rgba(10, 14, 23, 0.95)", backdropFilter: "blur(16px)", borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-around", zIndex: 100 }}>
        {navItems.map((item) => (
          <button key={item.id} onClick={() => setPage(item.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 12px", background: "none", border: "none", cursor: "pointer", transition: "all 0.2s", borderRadius: 12 }}>
            <Icon name={item.icon} size={20} color={page === item.id ? theme.accent : theme.textMuted} />
            <span style={{ fontSize: 10, fontWeight: page === item.id ? 700 : 500, color: page === item.id ? theme.accent : theme.textMuted, letterSpacing: 0.3 }}>
              {item.label}
            </span>
            {page === item.id && <div style={{ width: 4, height: 4, borderRadius: 2, background: theme.accent, marginTop: -1 }} />}
          </button>
        ))}
      </div>

      {/* Toasts */}
      <div style={{ position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", zIndex: 2000, display: "flex", flexDirection: "column", gap: 8, width: "90%", maxWidth: 400 }}>
        {toasts.map((toast) => (
          <div key={toast.id} className="slide-up" style={{ padding: "12px 16px", borderRadius: 12, background: toast.type === "error" ? theme.dangerBg : theme.type === "undo" ? theme.warningBg : theme.successBg, border: `1px solid ${toast.type === "error" ? theme.danger + "44" : toast.type === "undo" ? theme.warning + "44" : theme.success + "44"}`, color: toast.type === "error" ? theme.danger : toast.type === "undo" ? theme.warning : theme.success, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, backdropFilter: "blur(8px)" }}>
            <Icon name={toast.type === "error" ? "x" : toast.type === "undo" ? "repeat" : "check"} size={16} />
            <span style={{ flex: 1 }}>{toast.msg}</span>
            {toast.type === "undo" && toast.undoData && (
              <button onClick={() => { undoDeleteLesson(toast.undoData); setToasts((t) => t.filter((x) => x.id !== toast.id)); }} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid " + theme.warning, background: "transparent", color: theme.warning, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Undo</button>
            )}
          </div>
        ))}
      </div>

      {/* Lesson Detail Modal — rendered inline to prevent textarea remount */}
      {selectedLesson && (
        <Modal open={!!selectedLesson} onClose={() => { 
          const returnTo = returnToStudentId;
          setSelectedLesson(null); setEditingLesson(false); setCancellingLesson(false);
          if (returnTo) { const student = store.students.find(s => s.id === returnTo); if (student) setSelectedStudent(student); setReturnToStudentId(null); }
        }} title={editingLesson ? "Edit Lesson" : "Lesson Details"}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <Avatar initials={lessonDetailStudent ? lessonDetailStudent.avatar : "?"} size={48} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{lessonDetailStudent ? lessonDetailStudent.name : "Unknown"}</div>
              <div style={{ color: theme.textSecondary, fontSize: 13 }}>{lessonDetailStudent ? lessonDetailStudent.level + " · " + lessonDetailStudent.stream : ""}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <Badge text={selectedLesson.status} color={getStatusColor(selectedLesson.status)} bg={getStatusBg(selectedLesson.status)} />
              {!editingLesson && (
                <button onClick={startLessonEdit} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <Icon name="edit" size={16} color={theme.accent} />
                </button>
              )}
            </div>
          </div>
          {!editingLesson ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div style={{ padding: 12, background: theme.bgInput, borderRadius: 10 }}><div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, marginBottom: 2 }}>DATE</div><div style={{ fontSize: 14, fontWeight: 600 }}>{formatDate(selectedLesson.date)}</div></div>
                <div style={{ padding: 12, background: theme.bgInput, borderRadius: 10 }}><div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, marginBottom: 2 }}>TIME</div><div style={{ fontSize: 14, fontWeight: 600 }}>{formatTime(selectedLesson.date)}</div></div>
                <div style={{ padding: 12, background: theme.bgInput, borderRadius: 10 }}><div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, marginBottom: 2 }}>DURATION</div><div style={{ fontSize: 14, fontWeight: 600 }}>{selectedLesson.duration} min</div></div>
                <div style={{ padding: 12, background: theme.bgInput, borderRadius: 10 }}><div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, marginBottom: 2 }}>LOCATION</div><div style={{ fontSize: 14, fontWeight: 600 }}>{selectedLesson.location}</div></div>
              </div>
              <div style={{ padding: 12, background: theme.bgInput, borderRadius: 10, marginBottom: 16 }}><div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, marginBottom: 2 }}>SUBJECT</div><div style={{ fontSize: 14, fontWeight: 600 }}>{(selectedLesson.subject || "").split(" — ")[0]}</div>{(selectedLesson.subject || "").includes(" — ") && <><div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, marginTop: 8, marginBottom: 2 }}>TOPIC / FOCUS</div><div style={{ fontSize: 14, fontWeight: 600 }}>{(selectedLesson.subject || "").split(" — ").slice(1).join(" — ")}</div></>}</div>
              {selectedLesson.status === "cancelled" && selectedLesson.cancelReason && (
                <div style={{ padding: 10, background: theme.dangerBg, borderRadius: 10, marginBottom: 16, border: "1px solid " + theme.danger + "22" }}>
                  <div style={{ fontSize: 11, color: theme.danger, fontWeight: 600, marginBottom: 2 }}>CANCELLATION REASON</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{selectedLesson.cancelReason}{selectedLesson.cancelReason === "Other" && selectedLesson.cancelNote ? ": " + selectedLesson.cancelNote : ""}</div>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Input label="Date" type="date" value={lessonEdit.date} onChange={(v) => le("date", v)} />
                <Input label="Time" type="time" value={lessonEdit.time} onChange={(v) => le("time", v)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Select label="Duration" value={["30","45","60","90","120"].includes(lessonEdit.duration) ? lessonEdit.duration : "other"} onChange={(v) => le("duration", v)} options={[{ value: "30", label: "30 min" }, { value: "45", label: "45 min" }, { value: "60", label: "60 min" }, { value: "90", label: "90 min" }, { value: "120", label: "120 min" }, { value: "other", label: "Other" }]} />
                <Select label="Location" value={lessonEdit.location} onChange={(v) => le("location", v)} options={[{ value: "Home Studio", label: "Home Studio" }, { value: "Online — Zoom", label: "Online — Zoom" }, { value: "Student's Home", label: "Student's Home" }]} />
              </div>
              {(!["30","45","60","90","120"].includes(lessonEdit.duration)) && (
                <Input label="Custom Duration (min)" type="number" value={lessonEdit.duration} onChange={(v) => le("duration", v)} placeholder="e.g. 75" />
              )}
              {/* Subject: show selector for multi-subject students, read-only for single */}
              {(() => {
                const s = lessonDetailStudent;
                if (!s) return <Input label="Subject / Topic" value={lessonEdit.subject} onChange={(v) => le("subject", v)} />;
                const subs = s.subjects && s.subjects.length > 0 ? s.subjects : [{ subject: s.subject || s.stream || "Lesson", stream: s.subjects ? "" : (s.subject ? s.stream || "" : "") }];
                // Extract current subject part (before " — " topic separator)
                const currentSubj = (lessonEdit.subject || "").split(" — ")[0];
                const currentTopic = (lessonEdit.subject || "").includes(" — ") ? (lessonEdit.subject || "").split(" — ").slice(1).join(" — ") : "";
                return subs.length > 1 ? (
                  <>
                    <Select label="Subject" value={currentSubj} onChange={(v) => le("subject", currentTopic ? v + " — " + currentTopic : v)} options={subs.map(e => ({ value: e.subject + (e.stream ? " (" + e.stream + ")" : ""), label: e.subject + (e.stream ? " — " + e.stream : "") }))} />
                    <Input label="Topic / Focus" value={currentTopic} onChange={(v) => le("subject", currentSubj + (v ? " — " + v : ""))} placeholder="e.g. Algebra revision" />
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>Subject</label>
                      <div style={{ padding: "10px 14px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 10, color: theme.text, fontSize: 14 }}>{subs[0].subject}{subs[0].stream ? " — " + subs[0].stream : ""}</div>
                    </div>
                    <Input label="Topic / Focus" value={currentTopic} onChange={(v) => { const subPart = subs[0].subject + (subs[0].stream ? " (" + subs[0].stream + ")" : ""); le("subject", subPart + (v ? " — " + v : "")); }} placeholder="e.g. 作文 练习" />
                  </>
                );
              })()}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <Button size="sm" icon="check" onClick={saveLessonEdit}>Save Changes</Button>
                <Button size="sm" variant="secondary" onClick={() => setEditingLesson(false)}>Cancel</Button>
              </div>
            </>
          )}
          {/* Session Feedback — uncontrolled to prevent re-render on every keystroke */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>Session Feedback / Notes</label>
            <textarea key={selectedLesson.id + "-fb"} defaultValue={selectedLesson.comment || ""} onBlur={(e) => {
              const val = e.target.value;
              if (val !== (selectedLesson.comment || "")) {
                updateLesson(selectedLesson.id, { comment: val });
                setSelectedLesson({ ...selectedLesson, comment: val });
                addToast("Feedback saved");
              }
            }} placeholder="Add feedback for this session..." rows={3} style={{ width: "100%", padding: "10px 14px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 10, color: theme.text, outline: "none", fontSize: 13, fontFamily: "'DM Sans', sans-serif", resize: "vertical" }} />
            <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="eye" size={11} color={theme.textMuted} /> Appears in Fee Invoice to parents.
            </div>
          </div>
          {/* Homework — separate from feedback, not included in AI invoice summary */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>Homework</label>
            <textarea key={selectedLesson.id + "-hw"} defaultValue={selectedLesson.homework || ""} onBlur={(e) => {
              const val = e.target.value;
              if (val !== (selectedLesson.homework || "")) {
                updateLesson(selectedLesson.id, { homework: val });
                setSelectedLesson({ ...selectedLesson, homework: val });
                addToast("Homework saved");
              }
            }} placeholder="Homework assigned (not shown in invoice)..." rows={2} style={{ width: "100%", padding: "10px 14px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 10, color: theme.text, outline: "none", fontSize: 13, fontFamily: "'DM Sans', sans-serif", resize: "vertical" }} />
            <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 6 }}>For your own records. Not included in AI-generated invoices.</div>
          </div>
          {/* Billing toggles */}
          {selectedLesson.status === "cancelled" ? (
            <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: theme.bgInput, borderRadius: 10, border: "1px solid " + theme.border }}>
              <button onClick={() => { const newVal = !selectedLesson.collectedButCancelled; updateLesson(selectedLesson.id, { collectedButCancelled: newVal }); setSelectedLesson({ ...selectedLesson, collectedButCancelled: newVal }); addToast(newVal ? "Marked as collected" : "Unmarked"); }} style={{ width: 40, height: 22, borderRadius: 11, border: "none", background: selectedLesson.collectedButCancelled ? theme.warning : theme.borderLight, cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                <div style={{ width: 18, height: 18, borderRadius: 9, background: "white", position: "absolute", top: 2, left: selectedLesson.collectedButCancelled ? 20 : 2, transition: "left 0.2s" }} />
              </button>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: selectedLesson.collectedButCancelled ? theme.warning : theme.textSecondary }}>Collected but Cancelled</div>
                <div style={{ fontSize: 11, color: theme.textMuted }}>Payment received but lesson didn't happen. Use "Waive Fee" on a future lesson to offset.</div>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 20, padding: "10px 14px", background: theme.bgInput, borderRadius: 10, border: "1px solid " + theme.border }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: selectedLesson.waiveFee ? 10 : 0 }}>
                <button onClick={() => {
                  const newVal = !selectedLesson.waiveFee;
                  const updates = { waiveFee: newVal, excludeFromBilling: newVal };
                  if (!newVal) { updates.waiveReason = ""; updates.waiveNote = ""; }
                  else if (!selectedLesson.waiveReason) { updates.waiveReason = "Trial"; }
                  updateLesson(selectedLesson.id, updates);
                  setSelectedLesson({ ...selectedLesson, ...updates });
                  addToast(newVal ? "Fee waived for this lesson" : "Fee reinstated");
                }} style={{ width: 40, height: 22, borderRadius: 11, border: "none", background: selectedLesson.waiveFee ? theme.purple : theme.borderLight, cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 9, background: "white", position: "absolute", top: 2, left: selectedLesson.waiveFee ? 20 : 2, transition: "left 0.2s" }} />
                </button>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: selectedLesson.waiveFee ? theme.purple : theme.textSecondary }}>Waive Fee</div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>Lesson recorded but not charged</div>
                </div>
              </div>
              {selectedLesson.waiveFee && (
                <div style={{ paddingLeft: 50 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                    {["Trial", "Makeup", "Goodwill", "Offset", "Other"].map(r => (
                      <button key={r} onClick={() => {
                        updateLesson(selectedLesson.id, { waiveReason: r, waiveNote: r !== "Other" ? "" : (selectedLesson.waiveNote || "") });
                        setSelectedLesson({ ...selectedLesson, waiveReason: r, waiveNote: r !== "Other" ? "" : (selectedLesson.waiveNote || "") });
                      }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid " + ((selectedLesson.waiveReason || "Trial") === r ? theme.purple : theme.border), background: (selectedLesson.waiveReason || "Trial") === r ? theme.purple + "22" : "transparent", color: (selectedLesson.waiveReason || "Trial") === r ? theme.purple : theme.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{r}</button>
                    ))}
                  </div>
                  {(selectedLesson.waiveReason === "Other") && (
                    <input defaultValue={selectedLesson.waiveNote || ""} onBlur={(e) => { updateLesson(selectedLesson.id, { waiveNote: e.target.value }); setSelectedLesson({ ...selectedLesson, waiveNote: e.target.value }); }} placeholder="Reason for waiver..." style={{ width: "100%", padding: "6px 10px", background: theme.bgElevated, border: "1px solid " + theme.border, borderRadius: 6, color: theme.text, outline: "none", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} />
                  )}
                </div>
              )}
            </div>
          )}
          {/* Actions — always show edit + delete, even for completed/cancelled */}
          {!editingLesson && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(selectedLesson.status === "confirmed" || selectedLesson.status === "pending") && (
                <Button size="sm" variant="success" icon="check" onClick={() => { updateLesson(selectedLesson.id, { status: "completed" }); setSelectedLesson({ ...selectedLesson, status: "completed" }); addToast("Lesson marked as completed"); }}>Completed</Button>
              )}
              {selectedLesson.status === "pending" && (
                <Button size="sm" icon="check" onClick={() => { updateLesson(selectedLesson.id, { status: "confirmed" }); setSelectedLesson({ ...selectedLesson, status: "confirmed" }); addToast("Lesson confirmed"); }} style={{ background: theme.infoBg, color: theme.info, border: "none", borderRadius: 10, cursor: "pointer" }}>Confirm</Button>
              )}
              {selectedLesson.status !== "cancelled" && selectedLesson.status !== "completed" && !cancellingLesson && (
                <Button size="sm" variant="danger" icon="x" onClick={() => setCancellingLesson(true)}>Cancel</Button>
              )}
              {cancellingLesson && (
                <div style={{ width: "100%", padding: 12, background: theme.dangerBg, borderRadius: 10, border: "1px solid " + theme.danger + "33" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: theme.danger, marginBottom: 8 }}>Reason for cancellation:</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    {["Student MC", "Student No-Show", "Tutor Unavailable", "Holiday", "Rescheduled", "Other"].map(r => (
                      <button key={r} onClick={() => {
                        if (r === "Other") {
                          const reason = prompt("Cancellation reason:");
                          if (reason !== null) {
                            updateLesson(selectedLesson.id, { status: "cancelled", cancelReason: "Other", cancelNote: reason });
                            setSelectedLesson({ ...selectedLesson, status: "cancelled", cancelReason: "Other", cancelNote: reason });
                            setCancellingLesson(false);
                            addToast("Lesson cancelled — " + reason);
                          }
                        } else {
                          updateLesson(selectedLesson.id, { status: "cancelled", cancelReason: r, cancelNote: "" });
                          setSelectedLesson({ ...selectedLesson, status: "cancelled", cancelReason: r, cancelNote: "" });
                          setCancellingLesson(false);
                          addToast("Lesson cancelled — " + r);
                        }
                      }} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid " + theme.danger + "44", background: "transparent", color: theme.text, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{r}</button>
                    ))}
                  </div>
                  <button onClick={() => setCancellingLesson(false)} style={{ background: "none", border: "none", color: theme.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>← Back</button>
                </div>
              )}
              {(selectedLesson.status === "cancelled" || selectedLesson.status === "completed") && (
                <Button size="sm" variant="secondary" icon="repeat" onClick={() => { updateLesson(selectedLesson.id, { status: "confirmed" }); setSelectedLesson({ ...selectedLesson, status: "confirmed" }); addToast("Lesson reverted to confirmed"); }}>Revert to Confirmed</Button>
              )}
              <Button size="sm" variant="secondary" icon="edit" onClick={startLessonEdit}>Edit Lesson</Button>
              <Button size="sm" variant="ghost" icon="message" onClick={() => { setSelectedLesson(null); setMessageTarget("parent"); setIncludeSiblings(false); if (lessonDetailStudent) setShowMessageCompose(selectedLesson.studentId); }}>Message Parent</Button>
              {lessonDetailStudent && lessonDetailStudent.studentPhone && (
                <Button size="sm" variant="ghost" icon="message" onClick={() => { setSelectedLesson(null); setMessageTarget("student"); setShowMessageCompose(selectedLesson.studentId); }} style={{ color: "#25D366" }}>Message Student</Button>
              )}
              <Button size="sm" variant="ghost" icon="trash" onClick={handleDeleteLesson} style={{ color: theme.danger }}>Delete</Button>
            </div>
          )}
        </Modal>
      )}
      {/* New Lesson Modal — inline */}
      {showNewLesson && (() => {
        const sortedStudents = [...store.students].sort((a, b) => a.name.localeCompare(b.name));
        const DURATION_OPTIONS = [{ value: "30", label: "30 min" }, { value: "45", label: "45 min" }, { value: "60", label: "60 min" }, { value: "90", label: "90 min" }, { value: "120", label: "120 min" }, { value: "other", label: "Other" }];
        const actualDuration = lessonForm.duration === "other" ? (parseInt(lessonForm.customDuration) || 60) : parseInt(lessonForm.duration);
        return (
          <Modal open={showNewLesson} onClose={() => { setShowNewLesson(false); setPrefillStudentId(null); }} title="Schedule Lesson" width={500}>
            {prefillStudentId ? (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>Student</label>
                <div style={{ padding: "10px 14px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 10, color: theme.text, fontSize: 14 }}>{(() => { const s = getStudent(prefillStudentId); return s ? s.name + " (" + s.level + ")" : ""; })()}</div>
              </div>
            ) : (
              <Select label="Student" value={lessonForm.studentId} onChange={(v) => updateLessonForm("studentId", v)} options={sortedStudents.map((s) => ({ value: s.id, label: s.name + " (" + s.level + ")" }))} />
            )}
            <div style={{ display: "flex", gap: 2, background: theme.bgInput, borderRadius: 12, padding: 3, marginBottom: 16 }}>
              <button onClick={() => setIsRecurring(false)} style={{ flex: 1, padding: "8px 16px", borderRadius: 10, border: "none", background: !isRecurring ? theme.bgElevated : "transparent", color: !isRecurring ? theme.text : theme.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Single Lesson</button>
              <button onClick={() => setIsRecurring(true)} style={{ flex: 1, padding: "8px 16px", borderRadius: 10, border: "none", background: isRecurring ? theme.bgElevated : "transparent", color: isRecurring ? theme.text : theme.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Recurring Weekly</button>
            </div>
            {!isRecurring ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Input label="Date" type="date" value={lessonForm.date} onChange={(v) => updateLessonForm("date", v)} />
                {lessonForm.date && (store.settings || {}).phWarnings !== false && getHoliday(lessonForm.date) && (<div style={{ fontSize: 11, color: theme.warning, padding: "4px 8px", background: "rgba(245,158,11,0.1)", borderRadius: 6, marginTop: -8, marginBottom: 8 }}>This date is {getHoliday(lessonForm.date).name}. Lessons can still be scheduled.</div>)}
                <Input label="Time" type="time" value={lessonForm.time} onChange={(v) => updateLessonForm("time", v)} />
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Select label="Day of Week" value={recurDay} onChange={setRecurDay} options={dayNames.map((d, i) => ({ value: String(i), label: d }))} />
                  <Input label="Time" type="time" value={recurTime} onChange={setRecurTime} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input label="Starting from" type="date" value={recurStartDate} onChange={setRecurStartDate} />
                  <Input label="Ending on" type="date" value={recurEndDate} onChange={setRecurEndDate} />
                </div>
                {previewDates.length > 0 && (
                  <div style={{ marginBottom: 16, padding: 12, background: theme.bgInput, borderRadius: 10, border: "1px solid " + theme.border }}>
                    <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, marginBottom: 6 }}>PREVIEW — {previewDates.length} LESSONS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{previewDates.map((d, i) => (<span key={i} style={{ padding: "4px 10px", borderRadius: 8, background: theme.bgElevated, border: "1px solid " + theme.border, fontSize: 12, color: theme.textSecondary }}>{d.toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" })}</span>))}</div>
                  </div>
                )}
              </>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select label="Duration" value={lessonForm.duration} onChange={(v) => updateLessonForm("duration", v)} options={DURATION_OPTIONS} />
              <Select label="Location" value={lessonForm.location} onChange={(v) => updateLessonForm("location", v)} options={[{ value: "Home Studio", label: "Home Studio" }, { value: "Online — Zoom", label: "Online — Zoom" }, { value: "Student's Home", label: "Student's Home" }]} />
            </div>
            {lessonForm.duration === "other" && (<Input label="Custom Duration (min)" type="number" value={lessonForm.customDuration} onChange={(v) => updateLessonForm("customDuration", v)} placeholder="e.g. 75" />)}
            {/* Subject selector from student's enrolled subjects */}
            {(() => {
              const sid = prefillStudentId || lessonForm.studentId;
              const s = sid ? getStudent(sid) : null;
              if (!s) return null;
              const subs = s.subjects && s.subjects.length > 0 ? s.subjects : [{ subject: s.subject || s.stream || "Lesson", stream: s.subjects ? "" : (s.subject ? s.stream || "" : "") }];
              const displaySub = (e) => e.subject + (e.stream ? " (" + e.stream + ")" : "");
              const displayLabel = (e) => e.subject + (e.stream ? " — " + e.stream : "");
              return subs.length > 1 ? (
                <Select label="Subject" value={lessonForm.subject} onChange={(v) => updateLessonForm("subject", v)} options={subs.map(e => ({ value: displaySub(e), label: displayLabel(e) }))} />
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>Subject</label>
                  <div style={{ padding: "10px 14px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 10, color: theme.text, fontSize: 14 }}>{displayLabel(subs[0])}</div>
                </div>
              );
            })()}
            <Input label="Topic / Focus" value={lessonForm.topic || ""} onChange={(v) => updateLessonForm("topic", v)} placeholder="e.g. 作文 练习, Algebra revision" />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Button onClick={() => {
                const sid = prefillStudentId || lessonForm.studentId;
                if (!sid) { addToast("Please select a student", "error"); return; }
                const s = getStudent(sid);
                const subs = s && s.subjects && s.subjects.length > 0 ? s.subjects : (s ? [{ subject: s.subject || "Lesson", stream: s.stream || "" }] : [{ subject: "Lesson", stream: "" }]);
                const subj = lessonForm.subject || (subs[0].subject + (subs[0].stream ? " (" + subs[0].stream + ")" : ""));
                const fullSubject = lessonForm.topic ? subj + " — " + lessonForm.topic : subj;
                // Clash detection helper
                const checkClash = (dateISO, dur) => {
                  const newStart = new Date(dateISO).getTime(); const newEnd = newStart + dur * 60000;
                  const nd = new Date(dateISO);
                  const newDateStr = nd.getFullYear() + "-" + String(nd.getMonth() + 1).padStart(2, "0") + "-" + String(nd.getDate()).padStart(2, "0");
                  const clashes = [];
                  store.lessons.filter(l => l.status !== "cancelled").forEach(l => {
                    const lDate = new Date(l.date);
                    const lDateStr = lDate.getFullYear() + "-" + String(lDate.getMonth() + 1).padStart(2, "0") + "-" + String(lDate.getDate()).padStart(2, "0");
                    if (lDateStr !== newDateStr) return;
                    const lStart = lDate.getTime(); const lEnd = lStart + (parseInt(l.duration) || 60) * 60000;
                    if (newStart < lEnd && newEnd > lStart) {
                      const n = getStudent(l.studentId);
                      const isSameStudent = l.studentId === sid;
                      clashes.push((isSameStudent ? "⚠️ Same student: " : "🕐 Tutor busy: ") + (n ? n.name : "?") + " at " + lDate.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" }));
                    }
                  });
                  // Check blocks
                  (store.blocks || []).forEach(b => {
                    const bDate = new Date(b.date);
                    const bDateStr = bDate.getFullYear() + "-" + String(bDate.getMonth() + 1).padStart(2, "0") + "-" + String(bDate.getDate()).padStart(2, "0");
                    if (bDateStr !== newDateStr) return;
                    if (b.allDay) { clashes.push("Blocked: " + (b.label || "Busy") + " (all day)"); return; }
                    const bStart = bDate.getTime(); const bEnd = bStart + (parseInt(b.duration) || 60) * 60000;
                    if (newStart < bEnd && newEnd > bStart) clashes.push("Blocked: " + (b.label || "Busy") + " at " + bDate.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" }));
                  });
                  return clashes;
                };
                if (isRecurring) {
                  if (previewDates.length === 0) { addToast("Set start and end dates", "error"); return; }
                  const h = parseInt(recurTime.split(":")[0]), m = parseInt(recurTime.split(":")[1]);
                  let allClashes = [];
                  previewDates.forEach(d => { const dt = new Date(d); dt.setHours(h, m, 0, 0); allClashes = allClashes.concat(checkClash(dt.toISOString(), actualDuration)); });
                  if (allClashes.length > 0 && !window.confirm("⚠️ " + allClashes.length + " clash(es):\n" + allClashes.slice(0, 5).join("\n") + (allClashes.length > 5 ? "\n+" + (allClashes.length - 5) + " more" : "") + "\n\nSchedule anyway?")) return;
                  previewDates.forEach((d) => { const dt = new Date(d); dt.setHours(h, m, 0, 0); addLesson({ studentId: sid, date: dt.toISOString(), duration: actualDuration, subject: fullSubject, status: "confirmed", location: lessonForm.location, comment: "" }); });
                  addToast(previewDates.length + " lessons scheduled!");
                } else {
                  if (!lessonForm.date) { addToast("Please select a date", "error"); return; }
                  const dt = new Date(lessonForm.date + "T" + lessonForm.time + ":00");
                  const clashes = checkClash(dt.toISOString(), actualDuration);
                  if (clashes.length > 0 && !window.confirm("⚠️ Time clash:\n" + clashes.join("\n") + "\n\nSchedule anyway?")) return;
                  addLesson({ studentId: sid, date: dt.toISOString(), duration: actualDuration, subject: fullSubject, status: "pending", location: lessonForm.location, comment: "" });
                }
                setLessonForm({ studentId: "", date: "", time: "10:00", duration: "90", customDuration: "", subject: "", location: "Home Studio" });
                setShowNewLesson(false); setPrefillStudentId(null);
              }}>{isRecurring ? "Schedule " + previewDates.length + " Lessons" : "Schedule Lesson"}</Button>
              <Button variant="secondary" onClick={() => { setShowNewLesson(false); setPrefillStudentId(null); }}>Cancel</Button>
            </div>
          </Modal>
        );
      })()}
      {/* New Student Modal — inline to prevent form reset on clock tick */}
      {showNewStudent && (
        <Modal open={showNewStudent} onClose={() => setShowNewStudent(false)} title="Add New Student">
          <Input label="Student Name" value={newStudentForm.name} onChange={(v) => updateNewStudentForm("name", v)} placeholder="Full name" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select label="Level" value={newStudentForm.level} onChange={(v) => updateNewStudentForm("level", v)} options={LEVEL_OPTIONS} />
          </div>
          {newStudentForm.level === "Other" && (<Input label="Level Name" value={newStudentForm.levelOther || ""} onChange={(v) => updateNewStudentForm("levelOther", v)} placeholder="e.g. IP Year 3" />)}

          {/* Multi-subject entries */}
          <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>SUBJECTS</div>
          {(newStudentForm.subjects || [{ subject: "Chinese", subjectOther: "", stream: "Standard", streamOther: "" }]).map((entry, idx) => (
            <div key={idx} style={{ padding: 12, background: theme.bgElevated, borderRadius: 10, border: "1px solid " + theme.border, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600 }}>SUBJECT {(newStudentForm.subjects || [{}]).length > 1 ? idx + 1 : ""}</div>
                {(newStudentForm.subjects || []).length > 1 && (<button onClick={() => { const subs = [...(newStudentForm.subjects || [])]; subs.splice(idx, 1); updateNewStudentForm("subjects", subs); }} style={{ background: "none", border: "none", color: theme.danger, fontSize: 12, cursor: "pointer" }}>Remove</button>)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Select label="Subject" value={entry.subject} onChange={(v) => { const subs = [...(newStudentForm.subjects || [{ subject: "Chinese", subjectOther: "", stream: "Standard", streamOther: "" }])]; subs[idx] = { ...subs[idx], subject: v }; updateNewStudentForm("subjects", subs); }} options={SUBJECT_OPTIONS} />
                <Select label="Stream" value={entry.stream} onChange={(v) => { const subs = [...(newStudentForm.subjects || [{ subject: "Chinese", subjectOther: "", stream: "Standard", streamOther: "" }])]; subs[idx] = { ...subs[idx], stream: v }; updateNewStudentForm("subjects", subs); }} options={STREAM_OPTIONS} />
              </div>
              {(entry.subject === "Combined Science" || entry.subject === "Combined Humanities" || entry.subject === "Other") && (
                <Input label={entry.subject === "Other" ? "Subject Name" : "Combination"} value={entry.subjectOther || ""} onChange={(v) => { const subs = [...(newStudentForm.subjects || [])]; subs[idx] = { ...subs[idx], subjectOther: v }; updateNewStudentForm("subjects", subs); }} placeholder={entry.subject === "Other" ? "e.g. Art" : "e.g. Physics/Chemistry"} />
              )}
              {entry.stream === "Other" && (
                <Input label="Stream Name" value={entry.streamOther || ""} onChange={(v) => { const subs = [...(newStudentForm.subjects || [])]; subs[idx] = { ...subs[idx], streamOther: v }; updateNewStudentForm("subjects", subs); }} placeholder="e.g. IP, IB" />
              )}
              <Input label="Current Grade" value={entry.grade || ""} onChange={(v) => { const subs = [...(newStudentForm.subjects || [])]; subs[idx] = { ...subs[idx], grade: v }; updateNewStudentForm("subjects", subs); }} placeholder="e.g. A2, B3, C5" />
            </div>
          ))}
          <button onClick={() => { const subs = [...(newStudentForm.subjects || [{ subject: "Chinese", subjectOther: "", stream: "Standard", streamOther: "" }]), { subject: "English", subjectOther: "", stream: "Standard", streamOther: "" }]; updateNewStudentForm("subjects", subs); }} style={{ padding: "6px 12px", borderRadius: 8, border: "1px dashed " + theme.border, background: "transparent", color: theme.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: 12, width: "100%" }}>+ Add Another Subject</button>
          <Input label="Parent Name" value={newStudentForm.parent} onChange={(v) => updateNewStudentForm("parent", v)} placeholder="Parent/Guardian name" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <PhoneInput label="Parent Phone" value={newStudentForm.parentPhone} onChange={(v) => updateNewStudentForm("parentPhone", v)} />
          </div>
          <Input label="Parent Email" value={newStudentForm.parentEmail} onChange={(v) => updateNewStudentForm("parentEmail", v)} placeholder="email@example.com" />
          <PhoneInput label="Student Phone (optional)" value={newStudentForm.studentPhone || ""} onChange={(v) => updateNewStudentForm("studentPhone", v)} />
          <Input label="Student Email (optional)" value={newStudentForm.studentEmail || ""} onChange={(v) => updateNewStudentForm("studentEmail", v)} placeholder="student@example.com" />
          <Input label="Address" value={newStudentForm.address} onChange={(v) => updateNewStudentForm("address", v)} placeholder="Student's home address" />
          <Input label="Hourly Rate ($)" type="number" value={newStudentForm.hourlyRate} onChange={(v) => updateNewStudentForm("hourlyRate", v)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select label="Status" value={newStudentForm.status || "trial"} onChange={(v) => updateNewStudentForm("status", v)} options={[{ value: "active", label: "Active" }, { value: "trial", label: "Trial" }, { value: "paused", label: "Paused" }]} />
            <Input label="School" value={newStudentForm.school || ""} onChange={(v) => updateNewStudentForm("school", v)} placeholder="e.g. Anderson Secondary" />
          </div>
          <Select label="How did this student find you?" value={newStudentForm.referralSource || ""} onChange={(v) => updateNewStudentForm("referralSource", v)} options={REFERRAL_OPTIONS} />
          <Input label="Notes" value={newStudentForm.notes} onChange={(v) => updateNewStudentForm("notes", v)} multiline placeholder="Any notes about the student..." />
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={() => {
              if (!newStudentForm.name) { addToast("Please enter student name", "error"); return; }
              const initials = newStudentForm.name.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2);
              const subjects = (newStudentForm.subjects || [{ subject: "Chinese", subjectOther: "", stream: "Standard", streamOther: "", grade: "" }]).map(e => ({
                subject: e.subject === "Other" ? (e.subjectOther || "Other") : (["Combined Science", "Combined Humanities"].includes(e.subject) && e.subjectOther ? e.subject + " (" + e.subjectOther + ")" : e.subject),
                stream: e.stream === "Other" ? (e.streamOther || "Other") : e.stream,
                grade: e.grade || "",
              }));
              const firstGrade = subjects[0]?.grade || "";
              // For backward compat, also set subject/stream to first entry
              addStudent({ name: newStudentForm.name, level: newStudentForm.level === "Other" ? (newStudentForm.levelOther || "Other") : newStudentForm.level, subjects: subjects, subject: subjects[0].subject, stream: subjects[0].stream, parent: newStudentForm.parent, parentPhone: newStudentForm.parentPhone, parentEmail: newStudentForm.parentEmail, studentPhone: newStudentForm.studentPhone || "", studentEmail: newStudentForm.studentEmail || "", hourlyRate: parseFloat(newStudentForm.hourlyRate) || 70, address: newStudentForm.address, gradeCurrent: firstGrade, gradeStart: firstGrade, gradeHistory: [], status: newStudentForm.status || "trial", referralSource: newStudentForm.referralSource || "", schools: newStudentForm.school ? [{ name: newStudentForm.school, from: new Date().getFullYear().toString() }] : [], joinDate: new Date().toISOString().split("T")[0], notes: newStudentForm.notes, avatar: initials });
              setNewStudentForm({ name: "", level: "P5", levelOther: "", subjects: [{ subject: "Chinese", subjectOther: "", stream: "Standard", streamOther: "" }], parent: "", parentPhone: "", parentEmail: "", hourlyRate: "70", address: "", gradeCurrent: "", notes: "" });
              setShowNewStudent(false);
            }}>Add Student</Button>
            <Button variant="secondary" onClick={() => setShowNewStudent(false)}>Cancel</Button>
          </div>
        </Modal>
      )}
      {/* Student Detail Modal — rendered inline to prevent scroll reset */}
      {selectedStudent && (() => {
        const studentLessons = store.lessons.filter((l) => l.studentId === selectedStudent.id).sort((a, b) => new Date(a.date) - new Date(b.date));
        const startEdit = () => {
          setStudentEditForm({ name: selectedStudent.name, level: selectedStudent.level, levelOther: selectedStudent.levelOther || "", subjects: selectedStudent.subjects || [{ subject: selectedStudent.subject || "Chinese", subjectOther: "", stream: selectedStudent.stream || "Standard", streamOther: "" }], subject: selectedStudent.subject, stream: selectedStudent.stream, parent: selectedStudent.parent, parentPhone: selectedStudent.parentPhone, parentEmail: selectedStudent.parentEmail, studentPhone: selectedStudent.studentPhone || "", studentEmail: selectedStudent.studentEmail || "", hourlyRate: String(selectedStudent.hourlyRate), address: selectedStudent.address || "", notes: selectedStudent.notes || "", status: selectedStudent.status, paymentMode: selectedStudent.paymentMode || "monthly", gradeStart: selectedStudent.gradeStart || "", gradeCurrent: selectedStudent.gradeCurrent || "", gradeHistory: selectedStudent.gradeHistory || [], schools: selectedStudent.schools || [], referralSource: selectedStudent.referralSource || "" });
          setEditingStudent(true);
        };
        const saveEdit = () => {
          const resolvedSubs = (studentEditForm.subjects || []).map(e => ({
            subject: e.subject === "Other" ? (e.subjectOther || "Other") : (["Combined Science", "Combined Humanities"].includes(e.subject) && e.subjectOther ? e.subject + " (" + e.subjectOther + ")" : e.subject),
            stream: e.stream === "Other" ? (e.streamOther || "Other") : e.stream,
            grade: e.gradeCurrent || e.grade || "",
            gradeStart: e.gradeStart || e.grade || "",
            gradeCurrent: e.gradeCurrent || e.grade || "",
            assessments: (e.assessments || []).filter(a => a.label || a.grade),
          }));
          const u = { name: studentEditForm.name, level: studentEditForm.level === "Other" ? (studentEditForm.levelOther || "Other") : studentEditForm.level, subjects: resolvedSubs, subject: resolvedSubs[0]?.subject || "", stream: resolvedSubs[0]?.stream || "", parent: studentEditForm.parent, parentPhone: studentEditForm.parentPhone, parentEmail: studentEditForm.parentEmail, studentPhone: studentEditForm.studentPhone || "", studentEmail: studentEditForm.studentEmail || "", hourlyRate: parseFloat(studentEditForm.hourlyRate) || selectedStudent.hourlyRate, address: studentEditForm.address, notes: studentEditForm.notes, status: studentEditForm.status, paymentMode: studentEditForm.paymentMode || "monthly", gradeCurrent: resolvedSubs[0]?.gradeCurrent || "", gradeStart: resolvedSubs[0]?.gradeStart || "", schools: studentEditForm.schools || [], referralSource: studentEditForm.referralSource || "", avatar: studentEditForm.name.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2) };
          updateStudent(selectedStudent.id, u); setSelectedStudent({ ...selectedStudent, ...u }); setEditingStudent(false); addToast("Student updated");
        };
        const uf = (k, v) => setStudentEditForm((f) => ({ ...f, [k]: v }));
        return (
          <Modal open={!!selectedStudent} onClose={() => { setSelectedStudent(null); setEditingStudent(false); setBulkDeleteMode(false); }} title={editingStudent ? "Edit Student" : "Student Profile"} width={520}>
            {!editingStudent ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid " + theme.border }}>
                  <Avatar initials={selectedStudent.avatar} size={56} color={getStatusColor(selectedStudent.status)} />
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 18, fontFamily: "'Playfair Display', serif" }}>{selectedStudent.name}</div><div style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>{selectedStudent.level} · {(selectedStudent.subjects || []).map(e => e.subject + (e.stream ? " (" + e.stream + ")" : "")).join(", ") || (selectedStudent.subject || "") + (selectedStudent.stream ? " · " + selectedStudent.stream : "")}</div><Badge text={selectedStudent.status} color={getStatusColor(selectedStudent.status)} bg={getStatusBg(selectedStudent.status)} /></div>
                  <div style={{ textAlign: "right" }}><div style={{ fontSize: 24, fontWeight: 700, color: theme.accent, fontFamily: "'Playfair Display', serif" }}>${selectedStudent.hourlyRate}</div><div style={{ fontSize: 11, color: theme.textMuted }}>per hour</div></div>
                </div>
                <Card style={{ marginBottom: 12, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}><div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, letterSpacing: 0.5 }}>PARENT / GUARDIAN</div><button onClick={startEdit} style={{ background: "none", border: "none", cursor: "pointer", color: theme.accent, fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 3 }}><Icon name="edit" size={12} color={theme.accent} /> Edit</button></div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{selectedStudent.parent}</div>
                  <div style={{ fontSize: 13, color: theme.textSecondary }}>{formatPhoneDisplay(selectedStudent.parentPhone)}</div>
                  <div style={{ fontSize: 13, color: theme.textSecondary }}>{selectedStudent.parentEmail}</div>
                  {selectedStudent.studentPhone && <div style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>Student: {formatPhoneDisplay(selectedStudent.studentPhone)}</div>}
                  {selectedStudent.address && <div style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>{selectedStudent.address}</div>}
                  {(selectedStudent.schools || []).length > 0 && <div style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>{selectedStudent.schools[selectedStudent.schools.length - 1].name}</div>}
                </Card>
                {selectedStudent.notes && (<Card style={{ marginBottom: 12, padding: 14, borderLeft: "3px solid " + theme.accent }}><div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, marginBottom: 4, letterSpacing: 0.5 }}>NOTES</div><div style={{ fontSize: 13, color: theme.textSecondary }}>{selectedStudent.notes}</div></Card>)}
                {/* Class membership */}
                {(() => {
                  const studentClasses = getStudentClasses(selectedStudent.id);
                  return studentClasses.length > 0 && (
                    <Card style={{ marginBottom: 12, padding: 14 }}>
                      <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>CLASSES</div>
                      {studentClasses.map(c => (
                        <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                          <Icon name="users" size={14} color={theme.accent} />
                          <span style={{ fontSize: 13, color: theme.textSecondary }}>{c.name}</span>
                          {c.day !== undefined && c.day !== "" && <span style={{ fontSize: 11, color: theme.textMuted }}>· {dayNamesShort[c.day]} {c.time}</span>}
                        </div>
                      ))}
                    </Card>
                  );
                })()}
                {/* Grade Tracking — per subject */}
                <Card style={{ marginBottom: 12, padding: 14 }}>
                  <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, letterSpacing: 0.5, marginBottom: 10 }}>GRADE TRACKING</div>
                  {(selectedStudent.subjects || [{ subject: selectedStudent.subject || "Subject", stream: selectedStudent.stream || "", grade: selectedStudent.gradeCurrent || "" }]).map((sub, si) => (
                    <div key={si} style={{ marginBottom: si < (selectedStudent.subjects || []).length - 1 ? 12 : 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, marginBottom: 6 }}>{sub.subject}{sub.stream ? " (" + sub.stream + ")" : ""}</div>
                      <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
                        <div style={{ flex: 1, padding: 8, background: theme.bgInput, borderRadius: 8, textAlign: "center" }}>
                          <div style={{ fontSize: 9, color: theme.textMuted, fontWeight: 600, marginBottom: 2 }}>STARTING</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: theme.textSecondary }}>{sub.gradeStart || sub.grade || "—"}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", color: theme.textMuted, fontSize: 12 }}>→</div>
                        <div style={{ flex: 1, padding: 8, background: theme.bgInput, borderRadius: 8, textAlign: "center" }}>
                          <div style={{ fontSize: 9, color: theme.textMuted, fontWeight: 600, marginBottom: 2 }}>CURRENT</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: theme.accent }}>{sub.gradeCurrent || sub.grade || "—"}</div>
                        </div>
                      </div>
                      {sub.assessments && sub.assessments.length > 0 && (
                        <div style={{ paddingLeft: 4 }}>
                          {sub.assessments.map((a, ai) => (
                            <div key={ai} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: theme.textSecondary, padding: "2px 0" }}>
                              <span>{a.label}</span><span style={{ fontWeight: 600 }}>{a.grade}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 8 }}>Edit grades via Edit Details</div>
                </Card>
              </>
            ) : (
              <>
                <Input label="Student Name" value={studentEditForm.name} onChange={(v) => uf("name", v)} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><Select label="Level" value={studentEditForm.level} onChange={(v) => uf("level", v)} options={LEVEL_OPTIONS} /></div>
                {studentEditForm.level === "Other" && (<Input label="Level Name" value={studentEditForm.levelOther || ""} onChange={(v) => uf("levelOther", v)} placeholder="e.g. IP Year 3" />)}
                <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 6, marginTop: 8, letterSpacing: 0.5 }}>SUBJECTS</div>
                {(studentEditForm.subjects || [{ subject: studentEditForm.subject || "Chinese", subjectOther: "", stream: studentEditForm.stream || "Standard", streamOther: "" }]).map((entry, idx) => (
                  <div key={idx} style={{ padding: 10, background: theme.bgInput, borderRadius: 8, border: "1px solid " + theme.border, marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ fontSize: 10, color: theme.textMuted, fontWeight: 600 }}>SUBJECT {(studentEditForm.subjects || [{}]).length > 1 ? idx + 1 : ""}</div>
                      {(studentEditForm.subjects || []).length > 1 && (<button onClick={() => { const subs = [...(studentEditForm.subjects || [])]; subs.splice(idx, 1); uf("subjects", subs); }} style={{ background: "none", border: "none", color: theme.danger, fontSize: 11, cursor: "pointer" }}>Remove</button>)}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <Select label="Subject" value={entry.subject} onChange={(v) => { const subs = [...(studentEditForm.subjects || [{ subject: "Chinese", subjectOther: "", stream: "Standard", streamOther: "" }])]; subs[idx] = { ...subs[idx], subject: v }; uf("subjects", subs); }} options={SUBJECT_OPTIONS} />
                      <Select label="Stream" value={entry.stream} onChange={(v) => { const subs = [...(studentEditForm.subjects || [{ subject: "Chinese", subjectOther: "", stream: "Standard", streamOther: "" }])]; subs[idx] = { ...subs[idx], stream: v }; uf("subjects", subs); }} options={STREAM_OPTIONS} />
                    </div>
                    {(entry.subject === "Combined Science" || entry.subject === "Combined Humanities" || entry.subject === "Other") && (<Input label={entry.subject === "Other" ? "Subject Name" : "Combination"} value={entry.subjectOther || ""} onChange={(v) => { const subs = [...(studentEditForm.subjects || [])]; subs[idx] = { ...subs[idx], subjectOther: v }; uf("subjects", subs); }} />)}
                    {entry.stream === "Other" && (<Input label="Stream Name" value={entry.streamOther || ""} onChange={(v) => { const subs = [...(studentEditForm.subjects || [])]; subs[idx] = { ...subs[idx], streamOther: v }; uf("subjects", subs); }} />)}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <Input label="Starting Grade" value={entry.gradeStart || ""} onChange={(v) => { const subs = [...(studentEditForm.subjects || [])]; subs[idx] = { ...subs[idx], gradeStart: v }; uf("subjects", subs); }} placeholder="e.g. C5" />
                      <Input label="Current Grade" value={entry.gradeCurrent || ""} onChange={(v) => { const subs = [...(studentEditForm.subjects || [])]; subs[idx] = { ...subs[idx], gradeCurrent: v, grade: v }; uf("subjects", subs); }} placeholder="e.g. A2" />
                    </div>
                    {(entry.assessments || []).map((a, ai) => (
                      <div key={ai} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                        <input defaultValue={a.label} onBlur={(e) => { const subs = [...(studentEditForm.subjects || [])]; const asms = [...(subs[idx].assessments || [])]; asms[ai] = { ...asms[ai], label: e.target.value }; subs[idx] = { ...subs[idx], assessments: asms }; uf("subjects", subs); }} placeholder="e.g. WA1, CA1, SA1" style={{ flex: 1, padding: "5px 8px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 6, color: theme.text, outline: "none", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }} />
                        <input defaultValue={a.grade} onBlur={(e) => { const subs = [...(studentEditForm.subjects || [])]; const asms = [...(subs[idx].assessments || [])]; asms[ai] = { ...asms[ai], grade: e.target.value }; subs[idx] = { ...subs[idx], assessments: asms }; uf("subjects", subs); }} placeholder="Grade" style={{ width: 50, padding: "5px 8px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 6, color: theme.text, outline: "none", fontSize: 11, fontFamily: "'DM Sans', sans-serif", textAlign: "center" }} />
                        <button onClick={() => { const subs = [...(studentEditForm.subjects || [])]; const asms = (subs[idx].assessments || []).filter((_, j) => j !== ai); subs[idx] = { ...subs[idx], assessments: asms }; uf("subjects", subs); }} style={{ background: "none", border: "none", color: theme.danger, fontSize: 13, cursor: "pointer" }}>×</button>
                      </div>
                    ))}
                    <button onClick={() => { const subs = [...(studentEditForm.subjects || [])]; const asms = [...(subs[idx].assessments || []), { label: "", grade: "" }]; subs[idx] = { ...subs[idx], assessments: asms }; uf("subjects", subs); }} style={{ padding: "3px 8px", borderRadius: 4, border: "1px dashed " + theme.border, background: "transparent", color: theme.textMuted, fontSize: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>+ Add Assessment</button>
                  </div>
                ))}
                <button onClick={() => { const subs = [...(studentEditForm.subjects || [{ subject: "Chinese", subjectOther: "", stream: "Standard", streamOther: "" }]), { subject: "English", subjectOther: "", stream: "Standard", streamOther: "" }]; uf("subjects", subs); }} style={{ padding: "5px 10px", borderRadius: 6, border: "1px dashed " + theme.border, background: "transparent", color: theme.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: 10, width: "100%" }}>+ Add Subject</button>
                <Input label="Parent Name" value={studentEditForm.parent} onChange={(v) => uf("parent", v)} />
                <PhoneInput label="Parent Phone" value={studentEditForm.parentPhone} onChange={(v) => uf("parentPhone", v)} />
                <Input label="Parent Email" value={studentEditForm.parentEmail} onChange={(v) => uf("parentEmail", v)} />
                <PhoneInput label="Student Phone (optional)" value={studentEditForm.studentPhone || ""} onChange={(v) => uf("studentPhone", v)} />
                <Input label="Student Email (optional)" value={studentEditForm.studentEmail || ""} onChange={(v) => uf("studentEmail", v)} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><Input label="Hourly Rate ($)" type="number" value={studentEditForm.hourlyRate} onChange={(v) => uf("hourlyRate", v)} /><Select label="Status" value={studentEditForm.status} onChange={(v) => uf("status", v)} options={[{ value: "active", label: "Active" }, { value: "trial", label: "Trial" }, { value: "paused", label: "Paused" }, { value: "graduated", label: "Graduated" }]} /></div>
                <Select label="Payment Mode" value={studentEditForm.paymentMode || "monthly"} onChange={(v) => uf("paymentMode", v)} options={[{ value: "monthly", label: "Monthly" }, { value: "per_lesson", label: "Per Lesson" }]} />
                <Input label="Address" value={studentEditForm.address} onChange={(v) => uf("address", v)} />
                <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>SCHOOL HISTORY</div>
                {(studentEditForm.schools || []).map((sch, si) => (
                  <div key={si} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, padding: "4px 8px", background: theme.bgInput, borderRadius: 8 }}>
                    <span style={{ flex: 1, fontSize: 12, color: si === (studentEditForm.schools || []).length - 1 ? theme.text : theme.textMuted }}>{sch.name} (from {sch.from})</span>
                    {si === (studentEditForm.schools || []).length - 1 && <Badge text="current" color={theme.success} bg={theme.successBg} />}
                    <button onClick={() => { const s = [...(studentEditForm.schools || [])]; s.splice(si, 1); uf("schools", s); }} style={{ background: "none", border: "none", color: theme.danger, fontSize: 11, cursor: "pointer" }}>remove</button>
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 8, marginBottom: 12 }}>
                  <Input label="" value={studentEditForm._newSchool || ""} onChange={(v) => uf("_newSchool", v)} placeholder="School name" />
                  <Input label="" value={studentEditForm._newSchoolYear || new Date().getFullYear().toString()} onChange={(v) => uf("_newSchoolYear", v)} placeholder="Year" />
                  <button onClick={() => { if (!studentEditForm._newSchool) return; uf("schools", [...(studentEditForm.schools || []), { name: studentEditForm._newSchool, from: studentEditForm._newSchoolYear || new Date().getFullYear().toString() }]); uf("_newSchool", ""); }} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid " + theme.border, background: theme.bgElevated, color: theme.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>Add</button>
                </div>
                <Select label="How did this student find you?" value={studentEditForm.referralSource || ""} onChange={(v) => uf("referralSource", v)} options={REFERRAL_OPTIONS} />
                <Input label="Notes" value={studentEditForm.notes} onChange={(v) => uf("notes", v)} multiline />
                {/* Grade Tracking */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}><Button size="sm" icon="check" onClick={saveEdit}>Save Changes</Button><Button size="sm" variant="secondary" onClick={() => setEditingStudent(false)}>Cancel</Button></div>
              </>
            )}
            {/* Lessons */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, letterSpacing: 0.5 }}>LESSONS ({studentLessons.length})</div>
                {studentLessons.length > 0 && (<button onClick={() => { setBulkDeleteMode(!bulkDeleteMode); setBulkDeleteIds(new Set()); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, color: bulkDeleteMode ? theme.accent : theme.textMuted, fontFamily: "'DM Sans', sans-serif" }}>{bulkDeleteMode ? "Done" : "Bulk Delete"}</button>)}
              </div>
              {bulkDeleteMode && (
                <div id="bulk-bar" style={{ display: bulkDeleteIds.size > 0 ? "flex" : "none", gap: 8, alignItems: "center", marginBottom: 10, padding: "8px 12px", background: theme.dangerBg, borderRadius: 10, border: "1px solid " + theme.danger + "44", position: "sticky", top: 0, zIndex: 2 }}>
                  <span id="bulk-count" style={{ fontSize: 12, color: theme.danger, fontWeight: 600, flex: 1 }}>{bulkDeleteIds.size} selected</span>
                  <button onClick={() => { setBulkDeleteIds(new Set(studentLessons.map(l => l.id))); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: theme.textSecondary, fontFamily: "'DM Sans', sans-serif" }}>Select All</button>
                  <button onClick={() => { const ids = Array.from(bulkDeleteIds); if (window.confirm("Delete " + ids.length + " lessons?")) { setStore((s) => ({ ...s, lessons: s.lessons.filter(l => !ids.includes(l.id)) })); addToast(ids.length + " lessons deleted"); setBulkDeleteIds(new Set()); setBulkDeleteMode(false); } }} style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: theme.danger, color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Delete</button>
                </div>
              )}
              {studentLessons.length === 0 && <div style={{ fontSize: 13, color: theme.textMuted, padding: "8px 0" }}>No lessons yet</div>}
              {studentLessons.map((l) => (
                <div key={l.id} style={{ padding: "10px 0", borderBottom: "1px solid " + theme.border, cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start" }} onClick={(e) => {
                  if (bulkDeleteMode) {
                    const s = new Set(bulkDeleteIds); if (s.has(l.id)) s.delete(l.id); else s.add(l.id); setBulkDeleteIds(s);
                  } else { setReturnToStudentId(selectedStudent.id); setSelectedStudent(null); setSelectedLesson(l); setLessonComment(l.comment || ""); }
                }}>
                  {bulkDeleteMode && (<div style={{ width: 22, height: 22, borderRadius: 6, border: "2px solid " + (bulkDeleteIds.has(l.id) ? theme.danger : theme.borderLight), background: bulkDeleteIds.has(l.id) ? theme.danger : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 4 }}>{bulkDeleteIds.has(l.id) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}</div>)}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{l.subject}{l.waiveFee && <span style={{ fontSize: 10, color: theme.purple, marginLeft: 6 }}>WAIVED{l.waiveReason ? " · " + l.waiveReason : ""}{l.waiveReason === "Other" && l.waiveNote ? ": " + l.waiveNote : ""}</span>}{l.collectedButCancelled && <span style={{ fontSize: 10, color: theme.warning, marginLeft: 6 }}>CBC</span>}{l.status === "cancelled" && l.cancelReason && <span style={{ fontSize: 10, color: theme.danger, marginLeft: 6 }}>{l.cancelReason}{l.cancelReason === "Other" && l.cancelNote ? ": " + l.cancelNote : ""}</span>}{l.excludeFromBilling && !l.waiveFee && <span style={{ fontSize: 10, color: theme.danger, marginLeft: 6 }}>EXCL</span>}</div><div style={{ fontSize: 11, color: theme.textMuted }}>{formatDate(l.date)} · {formatTime(l.date)} · {l.duration} min</div></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Badge text={l.status} color={getStatusColor(l.status)} bg={getStatusBg(l.status)} />{!bulkDeleteMode && <Icon name="chevRight" size={14} color={theme.textMuted} />}</div>
                    </div>
                    {l.comment && (<div style={{ fontSize: 11, color: theme.textSecondary, paddingLeft: 8, borderLeft: "2px solid " + theme.borderLight }}>{l.comment}</div>)}
                    {!bulkDeleteMode && (l.status === "confirmed" || l.status === "pending") && (
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <button onClick={(e) => { e.stopPropagation(); updateLesson(l.id, { status: "completed" }); addToast(l.subject + " marked completed"); }} style={{ padding: "3px 10px", borderRadius: 6, border: "none", background: theme.successBg, color: theme.success, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 4 }}><Icon name="check" size={11} color={theme.success} /> Completed</button>
                        <button onClick={(e) => { e.stopPropagation(); updateLesson(l.id, { status: "cancelled" }); addToast(l.subject + " cancelled"); }} style={{ padding: "3px 10px", borderRadius: 6, border: "none", background: theme.dangerBg, color: theme.danger, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 4 }}><Icon name="x" size={11} color={theme.danger} /> Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {!editingStudent && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button size="sm" icon="edit" variant="secondary" onClick={startEdit}>Edit Details</Button>
                <Button size="sm" icon="calendar" onClick={() => { setPrefillStudentId(selectedStudent.id); setSelectedStudent(null); setShowNewLesson(true); }}>Schedule Lesson</Button>
                <Button size="sm" variant="ghost" icon="message" onClick={() => { setSelectedStudent(null); setMessageTarget("parent"); setIncludeSiblings(false); setShowMessageCompose(selectedStudent.id); }}>Message Parent</Button>
                {selectedStudent.studentPhone && (
                  <Button size="sm" variant="ghost" icon="message" onClick={() => { setSelectedStudent(null); setMessageTarget("student"); setShowMessageCompose(selectedStudent.id); }} style={{ color: "#25D366" }}>Message Student</Button>
                )}
                <Button size="sm" variant="ghost" icon="trash" onClick={() => {
                  if (window.confirm("Delete " + selectedStudent.name + " and all their lessons? This cannot be undone.")) {
                    deleteStudent(selectedStudent.id);
                    setSelectedStudent(null);
                    addToast("Student deleted");
                  }
                }} style={{ color: theme.danger }}>Delete Student</Button>
              </div>
            )}
          </Modal>
        );
      })()}
      {showMessageCompose && <MessageComposeModal key="msg-compose" />}
      <AIAssistantModal />
      <NotificationsPanel />

      {/* ── Add/Edit Class Modal ──────────────────────────────── */}
      {(showNewClass || editingClass) && (() => {
        const isEdit = !!editingClass;
        const uc = (k, v) => setClassForm(f => ({ ...f, [k]: v }));
        const sortedStudents = [...store.students].filter(s => s.status === "active" || s.status === "trial").sort((a, b) => a.name.localeCompare(b.name));
        const toggleStudent = (sid) => {
          const ids = [...(classForm.studentIds || [])];
          const idx = ids.indexOf(sid);
          if (idx >= 0) ids.splice(idx, 1); else ids.push(sid);
          uc("studentIds", ids);
        };
        return (
          <Modal open={true} onClose={() => { setShowNewClass(false); setEditingClass(false); setClassForm({ name: "", day: "", time: "15:00", duration: "90", location: "Home Studio", subject: "Chinese", stream: "Standard", studentIds: [], notes: "", status: "active" }); }} title={isEdit ? "Edit Class" : "Add New Class"} width={540}>
            <Input label="Class Name" value={classForm.name} onChange={(v) => uc("name", v)} placeholder="e.g. Sec 3 Chinese Mon 3pm" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select label="Day" value={String(classForm.day ?? "")} onChange={(v) => uc("day", v)} options={[{ value: "", label: "— No fixed day —" }, ...dayNames.map((d, i) => ({ value: String(i), label: d }))]} />
              <Input label="Time" type="time" value={classForm.time} onChange={(v) => uc("time", v)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select label="Duration" value={String(classForm.duration)} onChange={(v) => uc("duration", v)} options={[{ value: "30", label: "30 min" }, { value: "45", label: "45 min" }, { value: "60", label: "60 min" }, { value: "90", label: "90 min" }, { value: "120", label: "120 min" }]} />
              <Select label="Location" value={classForm.location} onChange={(v) => uc("location", v)} options={[{ value: "Home Studio", label: "Home Studio" }, { value: "Online — Zoom", label: "Online — Zoom" }, { value: "Student's Home", label: "Student's Home" }]} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select label="Subject" value={classForm.subject} onChange={(v) => uc("subject", v)} options={SUBJECT_OPTIONS} />
              <Select label="Stream" value={classForm.stream} onChange={(v) => uc("stream", v)} options={STREAM_OPTIONS} />
            </div>
            {isEdit && <Select label="Status" value={classForm.status} onChange={(v) => uc("status", v)} options={[{ value: "active", label: "Active" }, { value: "paused", label: "Paused" }]} />}
            <Input label="Notes" value={classForm.notes || ""} onChange={(v) => uc("notes", v)} multiline placeholder="Any notes about this class..." />
            <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>STUDENTS ({(classForm.studentIds || []).length})</div>
            <div style={{ maxHeight: 180, overflow: "auto", marginBottom: 16, border: "1px solid " + theme.border, borderRadius: 10, padding: 4 }}>
              {sortedStudents.map(s => (
                <div key={s.id} onClick={() => toggleStudent(s.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", borderRadius: 8, cursor: "pointer", background: (classForm.studentIds || []).includes(s.id) ? theme.accentBg : "transparent" }}>
                  <input type="checkbox" checked={(classForm.studentIds || []).includes(s.id)} readOnly style={{ accentColor: theme.accent, cursor: "pointer" }} />
                  <Avatar initials={s.avatar} size={24} color={theme.accent} />
                  <div style={{ flex: 1, fontSize: 13 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>{s.level}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button onClick={() => {
                if (!classForm.name) { addToast("Please enter a class name", "error"); return; }
                const data = { ...classForm, day: classForm.day !== "" ? Number(classForm.day) : undefined, duration: parseInt(classForm.duration) || 90 };
                if (isEdit) { updateClass(editingClass.id, data); setSelectedClass({ ...editingClass, ...data }); addToast("Class updated"); }
                else { addClass(data); addToast("Class created"); }
                setShowNewClass(false); setEditingClass(false); setClassForm({ name: "", day: "", time: "15:00", duration: "90", location: "Home Studio", subject: "Chinese", stream: "Standard", studentIds: [], notes: "", status: "active" });
              }}>{isEdit ? "Save Changes" : "Create Class"}</Button>
              <Button variant="secondary" onClick={() => { setShowNewClass(false); setEditingClass(false); setClassForm({ name: "", day: "", time: "15:00", duration: "90", location: "Home Studio", subject: "Chinese", stream: "Standard", studentIds: [], notes: "", status: "active" }); }}>Cancel</Button>
            </div>
          </Modal>
        );
      })()}

      {/* ── Class Detail Modal ────────────────────────────────── */}
      {selectedClass && (() => {
        const cls = getClass(selectedClass.id) || selectedClass;
        const members = (cls.studentIds || []).map(id => getStudent(id)).filter(Boolean);
        // Using parent-level classSchedMode/Date/EndDate/Recurring state
        return (
          <Modal open={true} onClose={() => { setSelectedClass(null); }} title={cls.name} width={540}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              <Badge text={cls.status || "active"} color={getStatusColor(cls.status || "active")} bg={getStatusBg(cls.status || "active")} />
              {cls.day !== undefined && cls.day !== "" && <span style={{ fontSize: 12, color: theme.textSecondary }}>{dayNames[cls.day]} {cls.time}</span>}
              {cls.duration && <span style={{ fontSize: 12, color: theme.textMuted }}>· {cls.duration} min</span>}
              {cls.location && <span style={{ fontSize: 12, color: theme.textMuted }}>· {cls.location}</span>}
            </div>
            {cls.subject && <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 12 }}>{cls.subject}{cls.stream ? " (" + cls.stream + ")" : ""}</div>}
            {cls.notes && <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 12, padding: 10, background: theme.bgInput, borderRadius: 8 }}>{cls.notes}</div>}
            <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>MEMBERS ({members.length})</div>
            <div style={{ marginBottom: 16 }}>
              {members.map(s => (
                <div key={s.id} onClick={() => { setSelectedClass(null); setSelectedStudent(s); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: "pointer", borderTop: "1px solid " + theme.border }}>
                  <Avatar initials={s.avatar} size={28} color={getStatusColor(s.status)} />
                  <div style={{ flex: 1 }}><span style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</span></div>
                  <span style={{ fontSize: 11, color: theme.textMuted }}>{s.level}</span>
                </div>
              ))}
              {members.length === 0 && <div style={{ fontSize: 12, color: theme.textMuted, padding: 8 }}>No students in this class</div>}
            </div>

            {/* Schedule for class */}
            {!classSchedMode ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button size="sm" icon="calendar" onClick={() => { setClassSchedMode(true); setClassSchedType("single"); setClassSchedEndDate(""); }}>Schedule Class</Button>
                <Button size="sm" variant="ghost" icon="message" onClick={() => { setBroadcastClassId(cls.id); setBroadcastRecipients(new Set()); setBroadcastSentIdx(-1); setBroadcastMsg(""); setShowBroadcast(true); setSelectedClass(null); }}>Broadcast</Button>
                <Button size="sm" variant="secondary" icon="edit" onClick={() => { setClassForm({ ...cls, day: cls.day !== undefined ? String(cls.day) : "", duration: String(cls.duration || 90) }); setEditingClass(cls); setSelectedClass(null); }}>Edit</Button>
                <Button size="sm" variant="ghost" icon="trash" onClick={() => { if (window.confirm("Delete class \"" + cls.name + "\"? Students won't be deleted.")) { deleteClass(cls.id); setSelectedClass(null); addToast("Class deleted"); } }} style={{ color: theme.danger }}>Delete</Button>
              </div>
            ) : (
              <Card style={{ padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: theme.accent, marginBottom: 10 }}>Schedule lessons for {members.length} students</div>
                <div style={{ display: "flex", gap: 2, background: theme.bgInput, borderRadius: 10, padding: 3, marginBottom: 12 }}>
                  {["single", "weekly", "daily"].map(t => (
                    <button key={t} onClick={() => setClassSchedType(t)} style={{ flex: 1, padding: "6px", borderRadius: 8, border: "none", background: classSchedType === t ? theme.bgElevated : "transparent", color: classSchedType === t ? theme.text : theme.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textTransform: "capitalize" }}>{t}</button>
                  ))}
                </div>
                {classSchedType === "single" ? (
                  <Input label="Date" type="date" value={classSchedDate} onChange={setClassSchedDate} />
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Input label="From" type="date" value={classSchedDate} onChange={setClassSchedDate} />
                    <Input label="To (required)" type="date" value={classSchedEndDate} onChange={setClassSchedEndDate} />
                  </div>
                )}
                {classSchedType !== "single" && classSchedEndDate && (() => {
                  const dates = [];
                  const start = new Date(classSchedDate + "T00:00:00");
                  const end = new Date(classSchedEndDate + "T00:00:00");
                  const d = new Date(start);
                  while (d <= end) {
                    if (classSchedType === "daily" || (classSchedType === "weekly" && cls.day !== undefined && cls.day !== "" && d.getDay() === Number(cls.day))) dates.push(new Date(d));
                    d.setDate(d.getDate() + 1);
                  }
                  return dates.length > 0 ? (
                    <div style={{ marginBottom: 12, padding: 10, background: theme.bgInput, borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, marginBottom: 4 }}>PREVIEW — {dates.length} sessions × {members.length} students = {dates.length * members.length} lessons</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{dates.slice(0, 14).map((dt, i) => (<span key={i} style={{ padding: "2px 8px", borderRadius: 6, background: theme.bgElevated, fontSize: 11, color: theme.textSecondary }}>{dt.toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" })}</span>))}{dates.length > 14 && <span style={{ fontSize: 11, color: theme.textMuted }}>+{dates.length - 14} more</span>}</div>
                    </div>
                  ) : <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 12 }}>{classSchedType === "weekly" && (cls.day === undefined || cls.day === "") ? "Set a day of week in class settings first" : "No matching dates in range"}</div>;
                })()}
                <div style={{ display: "flex", gap: 8 }}>
                  <Button size="sm" onClick={() => {
                    if (members.length === 0) { addToast("No students in class", "error"); return; }
                    if (classSchedType !== "single" && !classSchedEndDate) { addToast("Please set an end date", "error"); return; }
                    const time = cls.time || "15:00";
                    const dur = cls.duration || 90;
                    const subj = (cls.subject || "Lesson") + (cls.stream ? " (" + cls.stream + ")" : "");
                    let dates = [];
                    if (classSchedType === "single") { dates = [classSchedDate]; }
                    else { const start = new Date(classSchedDate + "T00:00:00"); const end = new Date(classSchedEndDate + "T00:00:00"); const d = new Date(start); while (d <= end) { if (classSchedType === "daily" || (classSchedType === "weekly" && cls.day !== undefined && d.getDay() === Number(cls.day))) dates.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")); d.setDate(d.getDate() + 1); } }
                    if (dates.length === 0) { addToast("No dates to schedule", "error"); return; }
                    const clashes = [];
                    dates.forEach(dateStr => { const ls = new Date(dateStr + "T" + time + ":00").getTime(); const le = ls + dur * 60000; store.lessons.filter(l => { if (l.status === "cancelled") return false; const ld = new Date(l.date); const lDateStr = ld.getFullYear() + "-" + String(ld.getMonth() + 1).padStart(2, "0") + "-" + String(ld.getDate()).padStart(2, "0"); return lDateStr === dateStr; }).forEach(l => { const s2 = new Date(l.date).getTime(); const e2 = s2 + (parseInt(l.duration) || 60) * 60000; if (ls < e2 && le > s2) { const n = getStudent(l.studentId); clashes.push(new Date(dateStr).toLocaleDateString("en-SG", { day: "numeric", month: "short" }) + " clashes with " + (n ? n.name : "?") + " at " + new Date(l.date).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })); } }); });
                    const total = dates.length * members.length;
                    let msg = "Create " + total + " lessons (" + dates.length + " dates \u00D7 " + members.length + " students)?";
                    if (clashes.length > 0) msg = "\u26A0\uFE0F " + clashes.length + " time clash(es):\n" + clashes.slice(0, 5).join("\n") + (clashes.length > 5 ? "\n+" + (clashes.length - 5) + " more" : "") + "\n\nProceed anyway?";
                    if (!window.confirm(msg)) return;
                    const newLessons = [];
                    dates.forEach(dateStr => { members.forEach(s => { const dt = new Date(dateStr + "T" + time + ":00"); newLessons.push({ id: "l" + genId(), studentId: s.id, date: dt.toISOString(), duration: dur, subject: subj, location: cls.location || "Home Studio", status: "confirmed", classId: cls.id }); }); });
                    setStore(prev => ({ ...prev, lessons: [...prev.lessons, ...newLessons] }));
                    addToast(total + " lessons created");
                    setClassSchedMode(false);
                  }}>Create Lessons</Button>
                  <Button size="sm" variant="secondary" onClick={() => setClassSchedMode(false)}>Cancel</Button>
                </div>
              </Card>
            )}
          </Modal>
        );
      })()}

      {/* ── Broadcast Modal ───────────────────────────────────── */}
      {showBroadcast && (() => {
        const allClasses = (store.classes || []).filter(c => c.status !== "archived");
        const cls = broadcastClassId ? (allClasses.find(c => c.id === broadcastClassId) || null) : null;
        const recipients = cls ? (cls.studentIds || []).map(sid => { const s = getStudent(sid); return s ? { studentId: sid, name: s.name, parent: s.parent || "", phone: s.parentPhone || "" } : null; }).filter(Boolean) : [];
        const selectedList = recipients.filter((_, i) => broadcastRecipients.has(i));
        const getBroadcastText = () => (broadcastRef.current ? broadcastRef.current.value : broadcastMsg);
        return (
          <Modal open={true} onClose={() => { setShowBroadcast(false); setBroadcastClassId(null); setBroadcastMsg(""); setBroadcastRecipients(new Set()); setBroadcastSentIdx(-1); }} title="Broadcast Message" width={540}>
            <Select label="Class" value={broadcastClassId || ""} onChange={(v) => { setBroadcastClassId(v || null); setBroadcastRecipients(new Set()); setBroadcastSentIdx(-1); }} options={[{ value: "", label: "— Select a class —" }, ...allClasses.map(c => ({ value: c.id, label: c.name + " (" + (c.studentIds || []).length + " students)" }))]} />
            {cls && recipients.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, letterSpacing: 0.5 }}>RECIPIENTS ({broadcastRecipients.size}/{recipients.length})</div>
                  <button onClick={() => { broadcastRecipients.size === recipients.length ? setBroadcastRecipients(new Set()) : setBroadcastRecipients(new Set(recipients.map((_, i) => i))); }} style={{ background: "none", border: "none", color: theme.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{broadcastRecipients.size === recipients.length ? "Deselect All" : "Select All"}</button>
                </div>
                <div style={{ maxHeight: 120, overflow: "auto", marginBottom: 12, display: "flex", flexDirection: "column", gap: 3 }}>
                  {recipients.map((r, idx) => (
                    <div key={r.studentId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", borderRadius: 8, background: idx <= broadcastSentIdx ? theme.successBg : theme.bgElevated, border: "1px solid " + (idx <= broadcastSentIdx ? theme.success + "44" : theme.border), cursor: "pointer" }} onClick={() => { const s = new Set(broadcastRecipients); s.has(idx) ? s.delete(idx) : s.add(idx); setBroadcastRecipients(s); }}>
                      <input type="checkbox" checked={broadcastRecipients.has(idx)} readOnly style={{ accentColor: theme.accent, cursor: "pointer" }} />
                      <span style={{ fontSize: 12, fontWeight: 500, flex: 1 }}>{r.parent || r.name}</span>
                      <span style={{ fontSize: 10, color: theme.textMuted }}>{r.name}</span>
                      {idx <= broadcastSentIdx && <Icon name="check" size={12} color={theme.success} />}
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>Message</label>
                  <textarea ref={broadcastRef} defaultValue={broadcastMsg} onBlur={(e) => setBroadcastMsg(e.target.value)} placeholder="Type your broadcast message..." rows={4} style={{ width: "100%", padding: "10px 14px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 10, color: theme.text, outline: "none", fontSize: 14, fontFamily: "'DM Sans', sans-serif", resize: "vertical" }} />
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {selectedList.length === 0 ? (
                    <div style={{ fontSize: 13, color: theme.textMuted }}>Select recipients above</div>
                  ) : broadcastSentIdx < selectedList.length - 1 ? (
                    <button onClick={() => {
                      const txt = getBroadcastText();
                      if (!txt.trim()) { addToast("Please type a message", "error"); return; }
                      const nextIdx = broadcastSentIdx + 1;
                      const r = selectedList[nextIdx];
                      openWhatsApp(r.phone, txt);
                      setBroadcastSentIdx(nextIdx);
                      if (nextIdx === selectedList.length - 1) addToast("All " + selectedList.length + " messages sent!");
                    }} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12, border: "none", background: "#25D366", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 2px 12px rgba(37, 211, 102, 0.3)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" style={{ flexShrink: 0 }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      {broadcastSentIdx === -1 ? "Send to " + (selectedList[0]?.parent || selectedList[0]?.name) + " (1/" + selectedList.length + ")" : "Next: " + (selectedList[broadcastSentIdx + 1]?.parent || selectedList[broadcastSentIdx + 1]?.name) + " (" + (broadcastSentIdx + 2) + "/" + selectedList.length + ")"}
                    </button>
                  ) : (
                    <Button variant="success" icon="check" onClick={() => { setShowBroadcast(false); setBroadcastClassId(null); setBroadcastMsg(""); setBroadcastRecipients(new Set()); setBroadcastSentIdx(-1); }}>All Done!</Button>
                  )}
                  {broadcastSentIdx > -1 && broadcastSentIdx < selectedList.length - 1 && (
                    <div style={{ fontSize: 12, color: theme.success, display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="check" size={14} color={theme.success} /> {broadcastSentIdx + 1}/{selectedList.length}
                    </div>
                  )}
                </div>
              </>
            )}
          </Modal>
        );
      })()}


      {showBlockTime && (
        <Modal open={true} onClose={() => setShowBlockTime(false)} title="Mark Unavailable" width={440}>
          <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 12 }}>Block out time for appointments, rest, or personal commitments.</div>
          <Input label="Date" type="date" value={blockForm.date} onChange={(v) => setBlockForm(f => ({ ...f, date: v }))} />
          {blockForm.date && (store.settings || {}).phWarnings !== false && getHoliday(blockForm.date) && (<div style={{ fontSize: 11, color: theme.warning, padding: "4px 8px", background: "rgba(245,158,11,0.1)", borderRadius: 6, marginTop: -8, marginBottom: 8 }}>Public holiday ({getHoliday(blockForm.date).name})</div>)}
          <div style={{ display: "flex", gap: 2, background: theme.bgInput, borderRadius: 10, padding: 3, marginBottom: 12 }}>
            <button onClick={() => setBlockForm(f => ({ ...f, allDay: false }))} style={{ flex: 1, padding: "6px", borderRadius: 8, border: "none", background: !blockForm.allDay ? theme.bgElevated : "transparent", color: !blockForm.allDay ? theme.text : theme.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Specific Time</button>
            <button onClick={() => setBlockForm(f => ({ ...f, allDay: true }))} style={{ flex: 1, padding: "6px", borderRadius: 8, border: "none", background: blockForm.allDay ? theme.bgElevated : "transparent", color: blockForm.allDay ? theme.text : theme.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>All Day</button>
          </div>
          {!blockForm.allDay && (<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><Input label="Time" type="time" value={blockForm.time} onChange={(v) => setBlockForm(f => ({ ...f, time: v }))} /><Select label="Duration" value={blockForm.duration} onChange={(v) => setBlockForm(f => ({ ...f, duration: v }))} options={[{ value: "30", label: "30 min" }, { value: "60", label: "60 min" }, { value: "90", label: "90 min" }, { value: "120", label: "120 min" }, { value: "180", label: "3 hours" }, { value: "240", label: "4 hours" }]} /></div>)}
          <Input label="Label (optional)" value={blockForm.label} onChange={(v) => setBlockForm(f => ({ ...f, label: v }))} placeholder="e.g. Dentist, Family dinner" />
          <Select label="Recurrence" value={blockForm.recurrence} onChange={(v) => setBlockForm(f => ({ ...f, recurrence: v }))} options={[{ value: "none", label: "Just this date" }, { value: "weekly", label: "Weekly" }, { value: "daily", label: "Daily" }]} />
          {blockForm.recurrence !== "none" && <Input label="Until" type="date" value={blockForm.endDate} onChange={(v) => setBlockForm(f => ({ ...f, endDate: v }))} />}
          <Button onClick={() => {
            if (!blockForm.date) { addToast("Select a date", "error"); return; }
            if (blockForm.recurrence !== "none" && !blockForm.endDate) { addToast("Set an end date", "error"); return; }
            const dates = [];
            if (blockForm.recurrence === "none") { dates.push(blockForm.date); }
            else { const s = new Date(blockForm.date + "T00:00:00"); const e = new Date(blockForm.endDate + "T00:00:00"); const td = s.getDay(); const d = new Date(s); while (d <= e) { if (blockForm.recurrence === "daily" || d.getDay() === td) dates.push(d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0")); d.setDate(d.getDate()+1); } }
            dates.forEach(ds => { const dt = blockForm.allDay ? new Date(ds + "T00:00:00") : new Date(ds + "T" + blockForm.time + ":00"); addBlock({ date: dt.toISOString(), duration: blockForm.allDay ? 1440 : parseInt(blockForm.duration) || 60, label: blockForm.label || "Busy", allDay: blockForm.allDay }); });
            addToast(dates.length + " block(s) created"); setShowBlockTime(false);
          }}>Block Time</Button>
        </Modal>
      )}
      <AIAssistantModal />
      <NotificationsPanel />
    </div>
  );
}
