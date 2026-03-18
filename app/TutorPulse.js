"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";

// ═══════════════════════════════════════════════════════════════
// TUTORPULSE — Intelligent Tutor Scheduling & Fee Management
// Built for Teacher Leon's Bilingual Academy
// ═══════════════════════════════════════════════════════════════

// ── Data Store (in-memory with persistence) ─────────────────
const STORAGE_KEY = "tutorpulse-data";

const createStore = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const students = [
    { id: "s1", name: "Ethan Tan", level: "P5", stream: "华文", parent: "Mrs. Tan", parentPhone: "+65 9123 4567", parentEmail: "tan.mei@email.com", hourlyRate: 70, status: "active", joinDate: "2025-01-15", notes: "Needs extra help with 作文", avatar: "ET" },
    { id: "s2", name: "Chloe Wong", level: "P6", stream: "高级华文", parent: "Mr. Wong", parentPhone: "+65 9234 5678", parentEmail: "wong.kh@email.com", hourlyRate: 80, status: "active", joinDate: "2024-08-01", notes: "Preparing for PSLE, strong in 阅读理解", avatar: "CW" },
    { id: "s3", name: "Ryan Lim", level: "Sec 3", stream: "O-Level Chinese", parent: "Mrs. Lim", parentPhone: "+65 9345 6789", parentEmail: "lim.sy@email.com", hourlyRate: 90, status: "active", joinDate: "2025-03-01", notes: "Focus on Paper 1 Email Writing", avatar: "RL" },
    { id: "s4", name: "Sophie Chen", level: "P5", stream: "华文", parent: "Mrs. Chen", parentPhone: "+65 9456 7890", parentEmail: "chen.jy@email.com", hourlyRate: 70, status: "active", joinDate: "2024-06-15", notes: "Good progress, encourage more 口试 practice", avatar: "SC" },
    { id: "s5", name: "Marcus Lee", level: "Sec 4", stream: "O-Level Chinese", parent: "Mr. Lee", parentPhone: "+65 9567 8901", parentEmail: "lee.wt@email.com", hourlyRate: 90, status: "active", joinDate: "2024-03-01", notes: "Final year, intensive revision needed", avatar: "ML" },
    { id: "s6", name: "Alyssa Ng", level: "P6", stream: "高级华文", parent: "Mrs. Ng", parentPhone: "+65 9678 9012", parentEmail: "ng.lh@email.com", hourlyRate: 80, status: "trial", joinDate: "2025-02-20", notes: "Trial lesson completed, parents considering", avatar: "AN" },
    { id: "s7", name: "Dylan Koh", level: "P5", stream: "华文", parent: "Mr. Koh", parentPhone: "+65 9789 0123", parentEmail: "koh.ah@email.com", hourlyRate: 70, status: "paused", joinDate: "2024-09-01", notes: "On pause — family holiday till mid-March", avatar: "DK" },
    { id: "s8", name: "Isabella Teo", level: "Sec 2", stream: "O-Level Chinese", parent: "Mrs. Teo", parentPhone: "+65 9890 1234", parentEmail: "teo.ml@email.com", hourlyRate: 80, status: "active", joinDate: "2025-01-10", notes: "Building foundation for upper sec", avatar: "IT" },
  ];

  const lessons = [
    { id: "l1", studentId: "s1", date: new Date(y, m, 8, 10, 0).toISOString(), duration: 90, subject: "华文 作文", status: "confirmed", location: "Home Studio", comment: "" },
    { id: "l2", studentId: "s2", date: new Date(y, m, 8, 14, 0).toISOString(), duration: 90, subject: "高级华文 阅读理解", status: "confirmed", location: "Home Studio", comment: "" },
    { id: "l3", studentId: "s3", date: new Date(y, m, 8, 16, 0).toISOString(), duration: 120, subject: "O-Level Paper 1", status: "confirmed", location: "Online — Zoom", comment: "" },
    { id: "l4", studentId: "s4", date: new Date(y, m, 9, 10, 0).toISOString(), duration: 90, subject: "华文 听写 & 口试", status: "confirmed", location: "Home Studio", comment: "" },
    { id: "l5", studentId: "s5", date: new Date(y, m, 9, 15, 0).toISOString(), duration: 120, subject: "O-Level Intensive Revision", status: "confirmed", location: "Home Studio", comment: "" },
    { id: "l6", studentId: "s1", date: new Date(y, m, 10, 10, 0).toISOString(), duration: 90, subject: "华文 阅读理解", status: "pending", location: "Home Studio", comment: "" },
    { id: "l7", studentId: "s8", date: new Date(y, m, 10, 14, 0).toISOString(), duration: 90, subject: "Chinese Foundation", status: "confirmed", location: "Online — Zoom", comment: "" },
    { id: "l8", studentId: "s2", date: new Date(y, m, 11, 10, 0).toISOString(), duration: 90, subject: "高级华文 综合练习", status: "confirmed", location: "Home Studio", comment: "" },
    { id: "l9", studentId: "s5", date: new Date(y, m, 12, 16, 0).toISOString(), duration: 120, subject: "O-Level Paper 2 Practice", status: "confirmed", location: "Home Studio", comment: "" },
    { id: "l10", studentId: "s3", date: new Date(y, m, 13, 16, 0).toISOString(), duration: 120, subject: "O-Level 综合填空", status: "pending", location: "Online — Zoom", comment: "" },
    { id: "l11", studentId: "s4", date: new Date(y, m, 14, 10, 0).toISOString(), duration: 90, subject: "华文 造句练习", status: "confirmed", location: "Home Studio", comment: "" },
    { id: "l12", studentId: "s6", date: new Date(y, m, 15, 14, 0).toISOString(), duration: 60, subject: "Trial Lesson — 高级华文", status: "pending", location: "Home Studio", comment: "2nd trial" },
  ];

  const payments = [
    { id: "p1", studentId: "s1", month: "2026-02", amount: 280, status: "paid", paidDate: "2026-02-05", method: "PayNow" },
    { id: "p2", studentId: "s2", month: "2026-02", amount: 320, status: "paid", paidDate: "2026-02-03", method: "Bank Transfer" },
    { id: "p3", studentId: "s3", month: "2026-02", amount: 350, status: "paid", paidDate: "2026-02-10", method: "PayNow" },
    { id: "p4", studentId: "s4", month: "2026-02", amount: 280, status: "paid", paidDate: "2026-02-08", method: "Cash" },
    { id: "p5", studentId: "s5", month: "2026-02", amount: 350, status: "paid", paidDate: "2026-02-01", method: "PayNow" },
    { id: "p6", studentId: "s8", month: "2026-02", amount: 320, status: "paid", paidDate: "2026-02-12", method: "Bank Transfer" },
    { id: "p7", studentId: "s1", month: "2026-03", amount: 280, status: "pending", paidDate: null, method: null },
    { id: "p8", studentId: "s2", month: "2026-03", amount: 320, status: "pending", paidDate: null, method: null },
    { id: "p9", studentId: "s3", month: "2026-03", amount: 350, status: "overdue", paidDate: null, method: null },
    { id: "p10", studentId: "s4", month: "2026-03", amount: 280, status: "pending", paidDate: null, method: null },
    { id: "p11", studentId: "s5", month: "2026-03", amount: 350, status: "pending", paidDate: null, method: null },
    { id: "p12", studentId: "s8", month: "2026-03", amount: 320, status: "pending", paidDate: null, method: null },
  ];

  const messages = [
    { id: "m1", parentId: "s1", direction: "out", text: "Hi Mrs. Tan, just a reminder that Ethan's March fees are due. Please PayNow to UEN 202410124E. Thank you! 🙏", date: "2026-03-01T09:00:00", read: true },
    { id: "m2", parentId: "s1", direction: "in", text: "Hi Teacher Leon, noted! Will transfer by this weekend.", date: "2026-03-01T10:30:00", read: true },
    { id: "m3", parentId: "s3", direction: "out", text: "Hi Mrs. Lim, Ryan's February fees ($350) are now overdue. Kindly arrange payment at your earliest convenience. Thank you!", date: "2026-03-05T09:00:00", read: true },
  ];

  const notifications = [
    { id: "n1", type: "payment", text: "Ryan Lim's March fee is overdue", time: "2h ago", read: false },
    { id: "n2", type: "lesson", text: "Ethan Tan's lesson tomorrow at 10:00 AM", time: "3h ago", read: false },
    { id: "n3", type: "trial", text: "Alyssa Ng — 2nd trial lesson on Mar 15", time: "5h ago", read: false },
    { id: "n4", type: "system", text: "Monthly revenue report ready", time: "1d ago", read: true },
  ];

  const revenueHistory = [];
  const settings = { tutorName: "Leon" };

  return { students, lessons, payments, messages, notifications, revenueHistory, settings };
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
const LEVEL_OPTIONS = [
  { value: "P1", label: "Primary 1" }, { value: "P2", label: "Primary 2" }, { value: "P3", label: "Primary 3" },
  { value: "P4", label: "Primary 4" }, { value: "P5", label: "Primary 5" }, { value: "P6", label: "Primary 6" },
  { value: "Sec 1", label: "Secondary 1" }, { value: "Sec 2", label: "Secondary 2" },
  { value: "Sec 3", label: "Secondary 3" }, { value: "Sec 4", label: "Secondary 4" },
  { value: "Sec 5", label: "Secondary 5" },
  { value: "JC 1", label: "JC 1" },
];
const STREAM_OPTIONS = [
  { value: "小学普华", label: "小学普华" },
  { value: "小学高华", label: "小学高华" },
  { value: "G1华文", label: "G1华文" },
  { value: "G2华文", label: "G2华文" },
  { value: "G3华文", label: "G3华文" },
  { value: "中学高华", label: "中学高华" },
  { value: "H1华文", label: "H1华文" },
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
  const map = { confirmed: theme.success, pending: theme.warning, cancelled: theme.danger, completed: theme.info, paid: theme.success, overdue: theme.danger, active: theme.success, trial: theme.info, paused: theme.textMuted };
  return map[s] || theme.textSecondary;
};
const getStatusBg = (s) => {
  const map = { confirmed: theme.successBg, pending: theme.warningBg, cancelled: theme.dangerBg, completed: theme.infoBg, paid: theme.successBg, overdue: theme.dangerBg, active: theme.successBg, trial: theme.infoBg, paused: "rgba(100,116,139,0.1)" };
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

const Modal = ({ open, onClose, title, children, width = 480 }) => {
  const modalRef = useRef(null);
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div ref={modalRef} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 20, width: "90%", maxWidth: width, maxHeight: "85vh", overflow: "auto", padding: 0 }} onClick={(e) => e.stopPropagation()}>
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
  const [showAI, setShowAI] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [paymentFilter, setPaymentFilter] = useState("all");
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

  // ── Hourly rate → Monthly fee calculator ─────────────────────
  // Sums (hourlyRate × hours) for each non-cancelled lesson in the month
  const calcMonthlyFee = useCallback((studentId, monthStr) => {
    const s = store.students.find((st) => st.id === studentId);
    if (!s) return { sessions: 0, rate: 0, totalHours: 0, total: 0 };
    const [y, mo] = monthStr.split("-").map(Number);
    const lessons = store.lessons.filter((l) => {
      const d = new Date(l.date);
      return l.studentId === studentId && d.getFullYear() === y && d.getMonth() === mo - 1 && l.status !== "cancelled" && !l.excludeFromBilling;
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
  const callAI = useCallback(async (prompt) => {
    setAiLoading(true);
    setAiResult("");
    try {
      const context = `You are TutorPulse AI, an assistant for Teacher Leon who runs a Chinese language tutoring business in Singapore. Current data: ${activeStudents.length} active students, ${pendingPayments.length} pending payments, monthly revenue $${monthlyRevenue}. Students: ${store.students.map(s => s.name + " (" + s.level + " " + s.stream + ")").join(", ")}. Respond concisely and helpfully.`;
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: context,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      const text = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
      setAiResult(text || "I couldn't generate a response. Please try again.");
    } catch (err) {
      setAiResult("AI is temporarily unavailable. Please try again later.");
    }
    setAiLoading(false);
  }, [activeStudents.length, pendingPayments.length, monthlyRevenue, store.students]);

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
      <div style={{ display: "flex", gap: 12, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
        <div onClick={() => setPage("students")} style={{ flex: 1, minWidth: 150, cursor: "pointer" }}><StatCard icon="users" label="Active Students" value={activeStudents.length} sub={`${store.students.filter(s => s.status === "trial").length} on trial`} /></div>
        <div onClick={() => setPage("schedule")} style={{ flex: 1, minWidth: 150, cursor: "pointer" }}><StatCard icon="calendar" label="Today's Lessons" value={todayLessons.length} sub={`${upcomingLessons.length} upcoming`} color={theme.info} /></div>
        <div onClick={() => setPage("payments")} style={{ flex: 1, minWidth: 150, cursor: "pointer" }}><StatCard icon="dollar" label="This Month" value={`$${store.students.filter(s => s.status === "active").reduce((sum, s) => sum + calcMonthlyFee(s.id, now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0")).total, 0).toLocaleString()}`} sub={`${pendingPayments.length} pending`} color={theme.success} /></div>
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
    const [viewMode, setViewMode] = useState("today");
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
      return store.lessons.filter((l) => {
        const d = new Date(l.date);
        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
      }).sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const monthLessons = store.lessons.filter((l) => {
      const d = new Date(l.date);
      return d.getMonth() === month && d.getFullYear() === year;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    const todayAllLessons = store.lessons.filter((l) => {
      const d = new Date(l.date);
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    const selectedDayLessons = selectedDay ? getLessonsForDay(selectedDay) : [];

    const renderLessonCard = (lesson) => {
      const student = getStudent(lesson.studentId);
      return (
        <Card key={lesson.id} hover onClick={() => { setSelectedLesson(lesson); setLessonComment(lesson.comment || ""); }} style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ minWidth: 54, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 500 }}>{formatDate(lesson.date).split(",")[0]}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: theme.accent }}>{new Date(lesson.date).getDate()}</div>
            </div>
            <div style={{ width: 1, height: 40, background: theme.border }} />
            <Avatar initials={student ? student.avatar : "?"} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{student ? student.name : "Unknown"}</div>
              <div style={{ fontSize: 12, color: theme.textSecondary }}>{lesson.subject}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{formatTime(lesson.date)}</div>
              <Badge text={lesson.status} color={getStatusColor(lesson.status)} bg={getStatusBg(lesson.status)} />
            </div>
          </div>
        </Card>
      );
    };

    return (
      <div className="fade-in">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Schedule</h1>
          <Button size="sm" icon="plus" onClick={() => setShowNewLesson(true)}>New Lesson</Button>
        </div>

        <TabBar tabs={[{ id: "today", label: "Today" }, { id: "month", label: "This Month" }, { id: "calendar", label: "Calendar" }]} active={viewMode} onChange={(v) => { setViewMode(v); setSelectedDay(null); }} />

        {viewMode === "today" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {todayAllLessons.length === 0 ? (
              <EmptyState icon="calendar" title="No lessons today" sub="Enjoy your day off!" />
            ) : todayAllLessons.map(renderLessonCard)}
          </div>
        )}

        {viewMode === "month" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {monthLessons.length === 0 ? (
              <EmptyState icon="calendar" title="No lessons this month" sub="Schedule a lesson to get started" />
            ) : monthLessons.map(renderLessonCard)}
          </div>
        )}

        {viewMode === "calendar" && (
          <>
            <Card>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
                <select value={month} onChange={(e) => { setCalendarDate(new Date(year, parseInt(e.target.value), 1)); setSelectedDay(null); }} style={{ padding: "6px 10px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 8, color: theme.text, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", appearance: "none", textAlign: "center" }}>
                  {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
                <select value={year} onChange={(e) => { setCalendarDate(new Date(parseInt(e.target.value), month, 1)); setSelectedDay(null); }} style={{ padding: "6px 10px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 8, color: theme.text, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", appearance: "none", textAlign: "center" }}>
                  {[2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <button onClick={() => { setCalendarDate(new Date()); setSelectedDay(null); }} style={{ padding: "6px 10px", background: theme.accentBg, border: "1px solid " + theme.accent + "44", borderRadius: 8, color: theme.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Today</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center" }}>
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, padding: "8px 0" }}>{d}</div>
                ))}
                {calendarDays.map((day, i) => {
                  const lessons = getLessonsForDay(day);
                  const isToday = day && day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                  const isSelected = day && day === selectedDay;
                  return (
                    <div key={i} onClick={() => { if (day) setSelectedDay(selectedDay === day ? null : day); }} style={{ padding: "6px 2px", minHeight: 48, borderRadius: 8, background: isSelected ? theme.accent + "22" : isToday ? theme.accentBg : "transparent", border: isSelected ? "1px solid " + theme.accent : isToday ? "1px solid " + theme.accent + "44" : "1px solid transparent", cursor: day ? "pointer" : "default" }}>
                      {day && (
                        <>
                          <div style={{ fontSize: 13, fontWeight: isToday || isSelected ? 700 : 400, color: isSelected ? theme.accent : isToday ? theme.accent : theme.text, marginBottom: 2 }}>{day}</div>
                          {lessons.length > 0 && (
                            <div style={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                              {lessons.slice(0, 3).map((l, j) => (
                                <div key={j} style={{ width: 6, height: 6, borderRadius: 3, background: getStatusColor(l.status) }} />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
            {/* Selected day lessons */}
            {selectedDay && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: theme.textSecondary, marginBottom: 8 }}>
                  {new Date(year, month, selectedDay).toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long" })} — {selectedDayLessons.length} lesson{selectedDayLessons.length !== 1 ? "s" : ""}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedDayLessons.length === 0 ? (
                    <Card style={{ padding: 14 }}><div style={{ fontSize: 13, color: theme.textMuted, textAlign: "center" }}>No lessons on this day</div></Card>
                  ) : selectedDayLessons.map(renderLessonCard)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // PAGE: STUDENTS
  // ═══════════════════════════════════════════════════════════
  const StudentsPage = () => {
    const [filter, setFilter] = useState("all");
    const filtered = filter === "all" ? store.students : store.students.filter((s) => s.status === filter);
    const searched = (searchQuery ? filtered.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.level.toLowerCase().includes(searchQuery.toLowerCase())) : filtered).sort((a, b) => a.name.localeCompare(b.name));

    return (
      <div className="fade-in">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Students</h1>
          <Button size="sm" icon="plus" onClick={() => setShowNewStudent(true)}>Add Student</Button>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <Icon name="search" size={16} color={theme.textMuted} className="" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search students..." style={{ width: "100%", padding: "10px 14px 10px 36px", background: theme.bgInput, border: `1px solid ${theme.border}`, borderRadius: 10, color: theme.text, outline: "none", fontSize: 14 }} />
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <Icon name="search" size={16} color={theme.textMuted} />
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
          {["all", "active", "trial", "paused"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${filter === f ? theme.accent : theme.border}`, background: filter === f ? theme.accentBg : "transparent", color: filter === f ? theme.accent : theme.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" }}>
              {f} {f === "all" ? `(${store.students.length})` : `(${store.students.filter(s => s.status === f).length})`}
            </button>
          ))}
        </div>

        {/* Student cards */}
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
                  <div style={{ fontSize: 12, color: theme.textSecondary }}>{student.level} · {student.stream}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: theme.accent }}>${student.hourlyRate}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>/ hr</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // PAGE: PAYMENTS / FEES
  // ═══════════════════════════════════════════════════════════
  const PaymentsPage = () => {
    const [monthView, setMonthView] = useState(() => {
      return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    });
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
      // Students who have non-cancelled lessons in this month
      const studentsWithLessons = new Set();
      store.lessons.forEach(l => {
        const d = new Date(l.date);
        const lMonth = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
        if (lMonth === monthView && l.status !== "cancelled" && activeIds.includes(l.studentId)) {
          studentsWithLessons.add(l.studentId);
        }
      });
      // Also include students with existing payment records for this month
      store.payments.filter(p => p.month === monthView).forEach(p => studentsWithLessons.add(p.studentId));

      return Array.from(studentsWithLessons).map(sid => {
        const existing = store.payments.find(p => p.studentId === sid && p.month === monthView);
        const calc = calcMonthlyFee(sid, monthView);
        if (existing) {
          return { ...existing, amount: calc.total, sessions: calc.sessions, rate: calc.rate, totalHours: calc.totalHours };
        }
        // Auto-generated pending entry
        return { id: "auto-" + sid + "-" + monthView, studentId: sid, month: monthView, amount: calc.total, sessions: calc.sessions, rate: calc.rate, totalHours: calc.totalHours, status: "pending", paidDate: null, method: null };
      });
    }, [store.students, store.lessons, store.payments, monthView, calcMonthlyFee]);

    const filtered = paymentFilter === "all" ? monthPayments : monthPayments.filter(p => p.status === paymentFilter);
    const totalDue = monthPayments.reduce((s, p) => s + p.amount, 0);
    const totalPaid = monthPayments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
    const totalPending = monthPayments.filter((p) => p.status !== "paid").reduce((s, p) => s + p.amount, 0);

    const markPaid = (payment) => {
      const existing = store.payments.find(p => p.studentId === payment.studentId && p.month === payment.month);
      if (existing) {
        updatePayment(existing.id, { status: "paid", paidDate: now.toISOString().split("T")[0], method: "PayNow" });
      } else {
        // Create a real payment record from the auto-generated one
        setStore((s) => ({ ...s, payments: [...s.payments, { id: "p" + genId(), studentId: payment.studentId, month: payment.month, amount: payment.amount, status: "paid", paidDate: now.toISOString().split("T")[0], method: "PayNow" }] }));
      }
      addToast("Payment marked as paid");
    };

    const markUnpaid = (payment) => {
      const existing = store.payments.find(p => p.studentId === payment.studentId && p.month === payment.month);
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
          for (let i = 0; i < 3; i++) {
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
              <div style={{ fontSize: 11, color: theme.warning, fontWeight: 600, marginBottom: 2 }}>PENDING</div>
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
                      <Badge text={payment.status} color={getStatusColor(payment.status)} bg={getStatusBg(payment.status)} />
                      <span style={{ fontSize: 11, color: theme.textMuted }}>{payment.sessions} sessions · {payment.totalHours}h × ${payment.rate}/hr</span>
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
    const completionRate = store.lessons.length > 0 ? Math.round(store.lessons.filter(l => l.status === "confirmed" || l.status === "completed").length / store.lessons.length * 100) : 0;
    const lastMonthStr = now.getMonth() === 0 ? (now.getFullYear() - 1) + "-12" : now.getFullYear() + "-" + String(now.getMonth()).padStart(2, "0");
    const collectionRate = store.payments.filter(p => p.month === lastMonthStr).length > 0 ? Math.round(store.payments.filter(p => p.month === lastMonthStr && p.status === "paid").length / store.payments.filter(p => p.month === lastMonthStr).length * 100) : 0;

    const revenueData = (() => {
      const data = [];
      const now = new Date();
      const history = store.revenueHistory || [];
      for (let i = 5; i >= 1; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
        const label = d.toLocaleDateString("en-SG", { month: "short" });
        const entry = history.find(h => h.month === key);
        data.push({ month: label, amount: entry ? entry.amount : 0 });
      }
      data.push({ month: now.toLocaleDateString("en-SG", { month: "short" }), amount: totalMonthly });
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              <StatCard icon="dollar" label={now.toLocaleDateString("en-SG", { month: "short" }) + " Rev"} value={`$${totalMonthly.toLocaleString()}`} color={theme.success} />
              <StatCard icon="users" label="Avg / Student" value={`$${avgFee}`} color={theme.info} />
              <StatCard icon="check" label="Completion" value={`${completionRate}%`} color={theme.accent} />
              <StatCard icon="dollar" label="Collection" value={`${collectionRate}%`} sub="Last month" color={theme.purple} />
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
          </>
        )}

        {adminTab === "analytics" && (
          <>
            <Card style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>Revenue Forecast</h3>
              <p style={{ fontSize: 13, color: theme.textSecondary }}>Projected March revenue based on scheduled sessions: <strong style={{ color: theme.success }}>${totalMonthly.toLocaleString()}</strong></p>
            </Card>
            <Card style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>Cancellation Rate</h3>
              <p style={{ fontSize: 13, color: theme.textSecondary }}>Cancelled lessons this month: <strong style={{ color: theme.warning }}>{store.lessons.filter(l => { const d = new Date(l.date); return d.getMonth() === new Date().getMonth() && l.status === "cancelled"; }).length}</strong> out of {store.lessons.filter(l => { const d = new Date(l.date); return d.getMonth() === new Date().getMonth(); }).length} total</p>
            </Card>
            <Card style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>Student Overview</h3>
              <p style={{ fontSize: 13, color: theme.textSecondary }}><strong style={{ color: theme.success }}>{activeStudents.length}</strong> active · <strong style={{ color: theme.info }}>{store.students.filter(s => s.status === "trial").length}</strong> on trial · <strong style={{ color: theme.textMuted }}>{store.students.filter(s => s.status === "paused").length}</strong> paused</p>
            </Card>
            <Card>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>Session Rates</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {activeStudents.map((s) => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: theme.textSecondary }}>
                    <span>{s.name} ({s.level})</span>
                    <span style={{ fontWeight: 600, color: theme.text }}>${s.hourlyRate}/hr</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {adminTab === "manage" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {store.students.map((student) => (
              <Card key={student.id} style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar initials={student.avatar} size={36} color={getStatusColor(student.status)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{student.name}</div>
                    <div style={{ fontSize: 12, color: theme.textSecondary }}>{student.level} · ${student.hourlyRate}/hr</div>
                  </div>
                  <Badge text={student.status} color={getStatusColor(student.status)} bg={getStatusBg(student.status)} />
                </div>
              </Card>
            ))}

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
                      return { Name: s.name, Level: s.level, Stream: s.stream, Status: s.status, "Hourly Rate": s.hourlyRate, Parent: s.parent, Phone: s.parentPhone, Email: s.parentEmail, "Total Lessons": lessons.length, Completed: completed, "Total Hours": Math.round(totalHours * 100) / 100, "Total Fees": Math.round(s.hourlyRate * totalHours * 100) / 100, "Join Date": s.joinDate, Notes: s.notes || "" };
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

            <Card style={{ padding: 14 }}>
              <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 10, letterSpacing: 0.5 }}>IMPORT</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <Button size="sm" variant="secondary" icon="download" onClick={() => {
                  try {
                    const wb = XLSX.utils.book_new();
                    // Template with example row
                    const data = [
                      { Name: "John Tan", Level: "P5", Stream: "小学普华", Status: "active", "Hourly Rate": 70, Parent: "Mrs. Tan", Phone: "+65 91234567", Email: "tan@email.com", "Join Date": "2025-01-15", Notes: "Example — delete this row" },
                    ];
                    const ws = XLSX.utils.json_to_sheet(data);
                    ws["!cols"] = [{ wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 24 }, { wch: 12 }, { wch: 30 }];
                    // Add data validation dropdowns
                    const levelList = '"P1,P2,P3,P4,P5,P6,Sec 1,Sec 2,Sec 3,Sec 4,Sec 5,JC 1"';
                    const streamList = '"小学普华,小学高华,G1华文,G2华文,G3华文,中学高华,H1华文"';
                    const statusList = '"active,trial,paused"';
                    // Apply validation to rows 2-100 (B=Level, C=Stream, D=Status)
                    if (!ws["!dataValidation"]) ws["!dataValidation"] = [];
                    for (let r = 1; r <= 100; r++) {
                      ws["!dataValidation"].push({ sqref: "B" + (r + 1), type: "list", formula1: levelList });
                      ws["!dataValidation"].push({ sqref: "C" + (r + 1), type: "list", formula1: streamList });
                      ws["!dataValidation"].push({ sqref: "D" + (r + 1), type: "list", formula1: statusList });
                    }
                    // Also add a reference sheet with all valid values
                    const refData = [];
                    const levels = ["P1","P2","P3","P4","P5","P6","Sec 1","Sec 2","Sec 3","Sec 4","Sec 5","JC 1"];
                    const streams = ["小学普华","小学高华","G1华文","G2华文","G3华文","中学高华","H1华文"];
                    const statuses = ["active","trial","paused"];
                    const maxLen = Math.max(levels.length, streams.length, statuses.length);
                    for (let i = 0; i < maxLen; i++) {
                      refData.push({ "Valid Levels": levels[i] || "", "Valid Streams": streams[i] || "", "Valid Statuses": statuses[i] || "" });
                    }
                    const refWs = XLSX.utils.json_to_sheet(refData);
                    refWs["!cols"] = [{ wch: 14 }, { wch: 14 }, { wch: 14 }];
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
                        const newStudents = rows.map(cols => {
                          const name = cols[0] || "";
                          if (!name) return null;
                          return { id: "s" + genId(), name, level: cols[1] || "P5", stream: cols[2] || "小学普华", status: cols[3] || "active", hourlyRate: parseFloat(cols[4]) || 70, parent: cols[5] || "", parentPhone: cols[6] || "", parentEmail: cols[7] || "", joinDate: cols[8] || new Date().toISOString().split("T")[0], notes: cols[9] || "", avatar: name.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2) };
                        }).filter(Boolean);
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
                <div style={{ fontSize: 11, color: theme.textMuted, lineHeight: 1.6 }}>
                  1. Download the template above (.xlsx){"\n"}
                  2. Open in Excel or Google Sheets{"\n"}
                  3. Level, Stream and Status columns have dropdown menus{"\n"}
                  4. See "Valid Values" tab for all options{"\n"}
                  5. Delete the example row, fill in your students{"\n"}
                  6. Save and tap "Import Students"{"\n"}
                  7. Accepts both .xlsx and .csv files
                </div>
              </div>
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

            {/* Profile Settings */}
            <Card style={{ padding: 14 }}>
              <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 10, letterSpacing: 0.5 }}>PROFILE</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: theme.textSecondary, flexShrink: 0 }}>Display Name</span>
                <input
                  type="text"
                  defaultValue={store.settings?.tutorName || ""}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val !== (store.settings?.tutorName || "")) {
                      setStore((s) => ({ ...s, settings: { ...(s.settings || {}), tutorName: val } }));
                      addToast("Name updated");
                    }
                  }}
                  placeholder="Your name"
                  style={{ flex: 1, padding: "8px 12px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 8, color: theme.text, outline: "none", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>
              <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 6 }}>Shown on the dashboard greeting and invoice messages.</div>
            </Card>

            {/* Data Reset */}
            <Card style={{ padding: 14, borderColor: theme.danger + "44" }}>
              <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 8 }}>DANGER ZONE</div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button size="sm" variant="danger" icon="trash" onClick={() => {
                  if (window.confirm("Clear ALL data? This will remove all students, lessons, payments and messages. This cannot be undone.")) {
                    const emptyStore = { students: [], lessons: [], payments: [], messages: [], notifications: [], revenueHistory: [] };
                    setStore(emptyStore);
                    saveStore(emptyStore);
                    addToast("All data cleared");
                  }
                }}>Clear All Data</Button>
                <Button size="sm" variant="secondary" icon="repeat" onClick={() => {
                  if (window.confirm("Load sample data? This replaces your current data with demo data.")) {
                    const fresh = createStore();
                    setStore(fresh);
                    saveStore(fresh);
                    addToast("Sample data loaded");
                  }
                }}>Load Sample Data</Button>
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
  const [lessonEdit, setLessonEdit] = useState({});
  const [deletedLesson, setDeletedLesson] = useState(null);
  const [returnToStudentId, setReturnToStudentId] = useState(null);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const bulkDeleteIdsRef = useRef([]);
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
      subject: selectedLesson.subject,
      location: selectedLesson.location,
    });
    setEditingLesson(true);
  };

  const saveLessonEdit = () => {
    const dateTime = new Date(lessonEdit.date + "T" + lessonEdit.time + ":00");
    const updates = { date: dateTime.toISOString(), duration: parseInt(lessonEdit.duration), subject: lessonEdit.subject, location: lessonEdit.location };
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
  const NewLessonModal = () => {
    const sortedStudents = [...store.students].sort((a, b) => a.name.localeCompare(b.name));
    const defaultStudentId = prefillStudentId || sortedStudents[0]?.id || "";
    const [form, setForm] = useState({ studentId: defaultStudentId, date: "", time: "10:00", duration: "90", subject: "", location: "Home Studio" });
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurDay, setRecurDay] = useState("1");
    const [recurTime, setRecurTime] = useState("10:00");
    const [recurStartDate, setRecurStartDate] = useState("");
    const [recurEndDate, setRecurEndDate] = useState("");
    const [previewDates, setPreviewDates] = useState([]);
    const updateForm = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    // Sync prefillStudentId when it changes
    useEffect(() => {
      if (prefillStudentId) setForm((f) => ({ ...f, studentId: prefillStudentId }));
    }, [prefillStudentId]);

    // Generate preview dates between start and end
    useEffect(() => {
      if (!isRecurring || !recurStartDate || !recurEndDate) { setPreviewDates([]); return; }
      const dates = [];
      const dayNum = parseInt(recurDay);
      const end = new Date(recurEndDate + "T23:59:59");
      let cursor = new Date(recurStartDate + "T00:00:00");
      // Find first occurrence of the selected day on or after start
      while (cursor.getDay() !== dayNum) {
        cursor.setDate(cursor.getDate() + 1);
      }
      while (cursor <= end) {
        dates.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 7);
      }
      setPreviewDates(dates);
    }, [isRecurring, recurDay, recurStartDate, recurEndDate]);

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return (
      <Modal open={showNewLesson} onClose={() => { setShowNewLesson(false); setPrefillStudentId(null); }} title="Schedule Lesson" width={500}>
        {prefillStudentId ? (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>Student</label>
            <div style={{ padding: "10px 14px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 10, color: theme.text, fontSize: 14 }}>{(() => { const s = getStudent(prefillStudentId); return s ? s.name + " (" + s.level + ")" : ""; })()}</div>
          </div>
        ) : (
          <Select label="Student" value={form.studentId} onChange={(v) => updateForm("studentId", v)} options={sortedStudents.map((s) => ({ value: s.id, label: s.name + " (" + s.level + ")" }))} />
        )}

        {/* Toggle: Single vs Recurring */}
        <div style={{ display: "flex", gap: 2, background: theme.bgInput, borderRadius: 12, padding: 3, marginBottom: 16 }}>
          <button onClick={() => setIsRecurring(false)} style={{ flex: 1, padding: "8px 16px", borderRadius: 10, border: "none", background: !isRecurring ? theme.bgElevated : "transparent", color: !isRecurring ? theme.text : theme.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Single Lesson
          </button>
          <button onClick={() => setIsRecurring(true)} style={{ flex: 1, padding: "8px 16px", borderRadius: 10, border: "none", background: isRecurring ? theme.bgElevated : "transparent", color: isRecurring ? theme.text : theme.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Recurring Weekly
          </button>
        </div>

        {!isRecurring ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Date" type="date" value={form.date} onChange={(v) => updateForm("date", v)} />
              <Input label="Time" type="time" value={form.time} onChange={(v) => updateForm("time", v)} />
            </div>
          </>
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
                <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>PREVIEW — {previewDates.length} LESSONS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {previewDates.map((d, i) => (
                    <span key={i} style={{ padding: "4px 10px", borderRadius: 8, background: theme.bgElevated, border: "1px solid " + theme.border, fontSize: 12, color: theme.textSecondary }}>
                      {d.toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Select label="Duration" value={form.duration} onChange={(v) => updateForm("duration", v)} options={[{ value: "30", label: "30 min" }, { value: "60", label: "60 min" }, { value: "90", label: "90 min" }, { value: "120", label: "120 min" }]} />
          <Select label="Location" value={form.location} onChange={(v) => updateForm("location", v)} options={[{ value: "Home Studio", label: "Home Studio" }, { value: "Online — Zoom", label: "Online — Zoom" }, { value: "Student's Home", label: "Student's Home" }]} />
        </div>
        <Input label="Subject / Topic" value={form.subject} onChange={(v) => updateForm("subject", v)} placeholder="e.g., 华文 作文 练习" />

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Button onClick={() => {
            if (!form.studentId) { addToast("Please select a student", "error"); return; }
            const subj = form.subject || "Chinese Lesson";
            if (isRecurring) {
              if (previewDates.length === 0) { addToast("Please set both start and end dates", "error"); return; }
              const hours = parseInt(recurTime.split(":")[0]);
              const mins = parseInt(recurTime.split(":")[1]);
              let count = 0;
              previewDates.forEach((d) => {
                const dateTime = new Date(d);
                dateTime.setHours(hours, mins, 0, 0);
                addLesson({ studentId: form.studentId, date: dateTime.toISOString(), duration: parseInt(form.duration), subject: subj, status: "confirmed", location: form.location, comment: "" });
                count++;
              });
              addToast(count + " recurring lessons scheduled!");
            } else {
              if (!form.date) { addToast("Please select a date", "error"); return; }
              const dateTime = new Date(form.date + "T" + form.time + ":00");
              addLesson({ studentId: form.studentId, date: dateTime.toISOString(), duration: parseInt(form.duration), subject: subj, status: "pending", location: form.location, comment: "" });
            }
            setShowNewLesson(false);
            setPrefillStudentId(null);
          }}>
            {isRecurring ? "Schedule " + previewDates.length + " Lessons" : "Schedule Lesson"}
          </Button>
          <Button variant="secondary" onClick={() => { setShowNewLesson(false); setPrefillStudentId(null); }}>Cancel</Button>
        </div>
      </Modal>
    );
  };

  // ── New Student Modal ──────────────────────────────────────
  // ── New Student form state (at parent level to prevent remount reset) ──
  const [newStudentForm, setNewStudentForm] = useState({ name: "", level: "P5", stream: "小学普华", parent: "", parentPhone: "", parentEmail: "", hourlyRate: "70", address: "", notes: "" });
  const updateNewStudentForm = (k, v) => setNewStudentForm((f) => ({ ...f, [k]: v }));

  // (New student modal is rendered inline in the main return)

  // ── Student Detail Modal (with Edit Mode) ───────────────────
  // (Student detail modal is rendered inline in the main return)

  // ── WhatsApp Helpers ─────────────────────────────────────────
  const formatPhoneForWA = (phone) => {
    // Strip all non-digits, ensure country code
    let digits = phone.replace(/[^0-9]/g, "");
    // If starts with 9/8/6 and is 8 digits, prepend SG country code
    if (digits.length === 8 && /^[689]/.test(digits)) digits = "65" + digits;
    // If starts with 0, replace with 65
    if (digits.startsWith("0")) digits = "65" + digits.substring(1);
    return digits;
  };

  const openWhatsApp = (phone, message) => {
    const waNumber = formatPhoneForWA(phone);
    const encoded = encodeURIComponent(message);
    const url = "https://wa.me/" + waNumber + "?text=" + encoded;
    window.open(url, "_blank");
  };

  // ── Message Compose Modal (WhatsApp + Templates + Fee Breakdown) ──
  const MessageComposeModal = () => {
    const [msgText, setMsgText] = useState("");
    const [generating, setGenerating] = useState(false);
    const [bulkSentIndex, setBulkSentIndex] = useState(-1);
    const [activeTemplate, setActiveTemplate] = useState(null);
    const isBulk = showMessageCompose === "bulk";
    const student = !isBulk ? getStudent(showMessageCompose) : null;

    // ── Build lesson & fee data for a given student ──────────
    const buildStudentInvoice = useCallback((sid) => {
      const s = getStudent(sid);
      if (!s) return null;
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const monthName = now.toLocaleDateString("en-SG", { month: "long", year: "numeric" });

      const monthLessons = store.lessons.filter((l) => {
        const d = new Date(l.date);
        return l.studentId === sid && d.getMonth() === currentMonth && d.getFullYear() === currentYear && l.status !== "cancelled";
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
        return l.studentId === sid && d.getMonth() === currentMonth && d.getFullYear() === currentYear && l.status === "cancelled";
      });

      const payment = store.payments.find((p) => p.studentId === sid && p.month === currentYear + "-" + String(currentMonth + 1).padStart(2, "0"));

      return {
        student: s, monthName, monthLessons, totalSessions, hourlyRate, totalMinutes, totalHours, lessonLines, cancelledLessons, payment,
        paymentStatus: payment ? payment.status : "pending",
        totalFee: totalFee,
        adjustment: 0,
        finalAmount: totalFee,
      };
    }, [store.lessons, store.payments, getStudent]);

    // ── Template generators ──────────────────────────────────
    const templateDefs = useMemo(() => [
      {
        id: "invoice", label: "\uD83E\uDDFE Fee Invoice + AI Summary", icon: "dollar",
        desc: "AI progress summary + lesson dates + fee breakdown",
        async: true,
        generate: (sid) => {
          // Returns the static parts; AI summary is injected by applyTemplate
          const inv = buildStudentInvoice(sid);
          if (!inv) return "";
          let msg = "Hi " + inv.student.parent + ",\n\n";
          msg += "Here is " + inv.student.name + "'s tuition summary for *" + inv.monthName + "*:\n\n";
          // AI progress summary placeholder
          msg += "[AI_SUMMARY_PLACEHOLDER]\n\n";
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
          msg += "\uD83D\uDCB0 *Fee Breakdown:*\n";
          msg += "  " + inv.totalHours + "h \u00D7 $" + inv.hourlyRate + "/hr\n";
          msg += "  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n";
          msg += "  *Total Due: $" + inv.finalAmount.toFixed(2) + "*\n\n";
          msg += "\uD83D\uDCB3 *Payment:* PayNow to UEN 202410124E\nPlease pay by the 10th. Thank you! \uD83D\uDE4F\n\n\u2014 Teacher Leon";
          return msg;
        },
        buildAIPrompt: (sid) => {
          const inv = buildStudentInvoice(sid);
          if (!inv) return null;
          const feedbackNotes = inv.monthLessons.filter(l => l.comment).map(l => l.subject + ": " + l.comment);
          if (feedbackNotes.length === 0) return null;
          return "You are Teacher Leon, a Chinese language tutor in Singapore. Based on these session feedback notes for " + inv.student.name + " (" + inv.student.level + " " + inv.student.stream + ") this month, write a concise 2-3 sentence progress summary for their parent. Be warm, specific, and mention areas of improvement and what to continue working on. Notes:\n" + feedbackNotes.join("\n") + "\n\nJust the summary paragraph, no greeting or sign-off. Keep under 60 words.";
        },
      },
      {
        id: "invoice_simple", label: "\uD83D\uDCCB Simple Invoice", icon: "dollar",
        desc: "Lesson dates + fee breakdown (no AI summary)",
        generate: (sid) => {
          const inv = buildStudentInvoice(sid);
          if (!inv) return "";
          let msg = "Hi " + inv.student.parent + ",\n\n";
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
          msg += "\uD83D\uDCB0 *Fee Breakdown:*\n";
          msg += "  " + inv.totalHours + "h \u00D7 $" + inv.hourlyRate + "/hr\n";
          msg += "  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n";
          msg += "  *Total Due: $" + inv.finalAmount.toFixed(2) + "*\n\n";
          msg += "\uD83D\uDCB3 *Payment:* PayNow to UEN 202410124E\nPlease pay by the 10th. Thank you! \uD83D\uDE4F\n\n\u2014 Teacher Leon";
          return msg;
        },
      },
      {
        id: "reminder", label: "\uD83D\uDD14 Payment Reminder", icon: "bell",
        desc: "Quick reminder with sessions count and amount",
        generate: (sid) => {
          const inv = buildStudentInvoice(sid);
          if (!inv) return "";
          let msg = "Hi " + inv.student.parent + ",\n\n";
          msg += "Friendly reminder that " + inv.student.name + "'s *" + inv.monthName + "* tuition fee is due:\n\n";
          msg += "\uD83D\uDCDA " + inv.totalSessions + " lessons (" + inv.totalHours + "h total)\n";
          msg += "\uD83D\uDCB0 *Amount: $" + inv.finalAmount.toFixed(2) + "*\n";
          msg += "\uD83D\uDCB3 PayNow to UEN 202410124E\n\n";
          msg += "Ignore this if already paid! Thank you \uD83D\uDE4F\n\u2014 Teacher Leon";
          return msg;
        },
      },
      {
        id: "overdue", label: "\u26A0\uFE0F Overdue Notice", icon: "clock",
        desc: "Polite follow-up for overdue payments",
        generate: (sid) => {
          const inv = buildStudentInvoice(sid);
          if (!inv) return "";
          let msg = "Hi " + inv.student.parent + ",\n\n";
          msg += "I hope all is well! I noticed " + inv.student.name + "'s *" + inv.monthName + "* tuition fee is still outstanding.\n\n";
          msg += "*Details:*\n";
          msg += "  " + inv.totalSessions + " sessions (" + inv.totalHours + "h) \u2014 " + inv.student.level + " " + inv.student.stream + "\n";
          msg += "  *Amount due: $" + inv.finalAmount.toFixed(2) + "*\n\n";
          msg += "Kindly arrange payment via PayNow to UEN 202410124E at your earliest convenience.\n\nThank you for your understanding \uD83D\uDE4F\n\u2014 Teacher Leon";
          return msg;
        },
      },
      {
        id: "schedule", label: "\uD83D\uDCC5 Upcoming Schedule", icon: "calendar",
        desc: "Share upcoming lesson dates and topics",
        generate: (sid) => {
          const inv = buildStudentInvoice(sid);
          if (!inv) return "";
          const upcoming = store.lessons.filter((l) => l.studentId === sid && new Date(l.date) >= new Date() && l.status !== "cancelled").sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 6);
          let msg = "Hi " + inv.student.parent + ",\n\n";
          msg += "Here is " + inv.student.name + "'s upcoming schedule:\n\n";
          if (upcoming.length > 0) {
            upcoming.forEach((l) => {
              const d = new Date(l.date);
              const dayStr = d.toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" });
              const timeStr = d.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", hour12: true });
              msg += "\uD83D\uDCD6 " + dayStr + " at " + timeStr + "\n   " + l.subject + " (" + l.duration + " min, " + l.location + ")\n\n";
            });
          } else {
            msg += "(No upcoming lessons scheduled yet)\n\n";
          }
          msg += "Let me know if any changes are needed.\n\nThank you! \uD83D\uDE4F\n\u2014 Teacher Leon";
          return msg;
        },
      },
    ], [buildStudentInvoice, store.lessons]);

    // Build list of recipients for bulk mode
    const bulkRecipients = useMemo(() => {
      if (!isBulk) return [];
      return pendingPayments.map((p) => {
        const s = getStudent(p.studentId);
        if (!s) return null;
        return { paymentId: p.id, studentId: p.studentId, studentName: s.name, parentName: s.parent, phone: s.parentPhone, amount: p.amount };
      }).filter(Boolean);
    }, [isBulk, pendingPayments, getStudent]);

    const personalizeMessage = (template, recipient) => {
      return template
        .replace(/\[Student Name\]/gi, recipient.studentName)
        .replace(/\[Parent Name\]/gi, recipient.parentName)
        .replace(/\[Amount\]/gi, "$" + recipient.amount)
        .replace(/\[Student\]/gi, recipient.studentName)
        .replace(/\[Name\]/gi, recipient.studentName);
    };

    const applyTemplate = async (tplId) => {
      setActiveTemplate(tplId);
      const tpl = templateDefs.find((t) => t.id === tplId);
      if (!tpl) return;

      const targetSid = isBulk && bulkRecipients.length > 0 ? bulkRecipients[0].studentId : showMessageCompose;
      let msg = tpl.generate(targetSid);

      // If template has AI summary, fetch it
      if (tpl.buildAIPrompt) {
        const aiPrompt = tpl.buildAIPrompt(targetSid);
        if (aiPrompt) {
          // Show message with placeholder while loading
          setMsgText(msg.replace("[AI_SUMMARY_PLACEHOLDER]", "\u23F3 _Generating AI progress summary..._"));
          setGenerating(true);
          try {
            const response = await fetch("/api/ai", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: aiPrompt }] }),
            });
            const data = await response.json();
            const summary = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n").trim();
            if (summary) {
              msg = msg.replace("[AI_SUMMARY_PLACEHOLDER]", "\uD83D\uDCCA *Monthly Progress:*\n" + summary);
            } else {
              msg = msg.replace("[AI_SUMMARY_PLACEHOLDER]", "");
            }
          } catch (err) {
            msg = msg.replace("[AI_SUMMARY_PLACEHOLDER]", "");
          }
          setGenerating(false);
        } else {
          // No feedback notes to summarize — remove placeholder
          msg = msg.replace("[AI_SUMMARY_PLACEHOLDER]\n\n", "");
        }
      }

      setMsgText(msg);
    };

    const generateAIMessage = async () => {
      setGenerating(true);
      setActiveTemplate("ai");
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
          ? "Generate a polite WhatsApp fee collection message for March 2026 with [Student Name] and [Amount] placeholders. Payment via PayNow to UEN 202410124E. Sign off as Teacher Leon. Under 100 words. Just the message."
          : "Generate a polite WhatsApp fee message using this data: " + aiContext + ". Include lesson dates, session feedback notes if available, fee breakdown, total due. Payment via PayNow to UEN 202410124E. Sign off as Teacher Leon. Just the message, no preamble.";
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
      setGenerating(false);
    };

    const WAIcon = ({ size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366" style={{ flexShrink: 0 }}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    );

    return (
      <Modal open={!!showMessageCompose} onClose={() => { setShowMessageCompose(null); setMsgText(""); setBulkSentIndex(-1); setActiveTemplate(null); }} title={isBulk ? "Fee Reminders via WhatsApp" : "WhatsApp " + (student ? student.parent : "")} width={540}>

        {/* WhatsApp banner */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: "rgba(37, 211, 102, 0.08)", borderRadius: 12, marginBottom: 16, border: "1px solid rgba(37, 211, 102, 0.2)" }}>
          <WAIcon />
          <div style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 1.5 }}>
            {isBulk ? "Each message is auto-personalized per student with their actual lesson dates and fees." : "Opens WhatsApp with " + (student ? student.parent + "'s number pre-filled." : "the parent's number.")}
          </div>
        </div>

        {/* Single: parent card */}
        {!isBulk && student && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, background: theme.bgElevated, borderRadius: 12, marginBottom: 16, border: "1px solid " + theme.border }}>
            <Avatar initials={student.avatar} size={40} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{student.parent}</div>
              <div style={{ fontSize: 12, color: theme.textSecondary }}>{student.parentPhone} · {student.name} (${student.hourlyRate}/hr)</div>
            </div>
          </div>
        )}

        {/* Bulk: recipients */}
        {isBulk && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>RECIPIENTS ({bulkRecipients.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 110, overflow: "auto" }}>
              {bulkRecipients.map((r, idx) => (
                <div key={r.paymentId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 12px", borderRadius: 10, background: idx <= bulkSentIndex ? theme.successBg : theme.bgElevated, border: "1px solid " + (idx <= bulkSentIndex ? theme.success + "44" : theme.border), transition: "all 0.3s" }}>
                  <Avatar initials={r.studentName.split(" ").map(w => w[0]).join("").substring(0, 2)} size={26} color={idx <= bulkSentIndex ? theme.success : theme.accent} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: idx <= bulkSentIndex ? theme.success : theme.text }}>{r.parentName}</span>
                    <span style={{ fontSize: 11, color: theme.textMuted, marginLeft: 6 }}>{r.studentName} · ${r.amount}</span>
                  </div>
                  {idx <= bulkSentIndex && <Icon name="check" size={14} color={theme.success} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TEMPLATE SELECTOR ─────────────────────────────── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>CHOOSE TEMPLATE</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {templateDefs.map((tpl) => (
              <button key={tpl.id} onClick={() => applyTemplate(tpl.id)} style={{ textAlign: "left", padding: "10px 12px", borderRadius: 10, border: "1px solid " + (activeTemplate === tpl.id ? theme.accent + "88" : theme.border), background: activeTemplate === tpl.id ? theme.accentBg : theme.bgElevated, cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif" }} onMouseEnter={(e) => { if (activeTemplate !== tpl.id) e.currentTarget.style.borderColor = theme.borderLight; }} onMouseLeave={(e) => { if (activeTemplate !== tpl.id) e.currentTarget.style.borderColor = theme.border; }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: activeTemplate === tpl.id ? theme.accent : theme.text, marginBottom: 2 }}>{tpl.label}</div>
                <div style={{ fontSize: 10, color: theme.textMuted, lineHeight: 1.3 }}>{tpl.desc}</div>
              </button>
            ))}
            {/* AI option */}
            <button onClick={generateAIMessage} disabled={generating} style={{ textAlign: "left", padding: "10px 12px", borderRadius: 10, border: "1px solid " + (activeTemplate === "ai" ? theme.purple + "88" : theme.border), background: activeTemplate === "ai" ? theme.purpleBg : theme.bgElevated, cursor: generating ? "wait" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: generating ? 0.6 : 1, gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: activeTemplate === "ai" ? theme.purple : theme.text, marginBottom: 2 }}>{generating ? "\u23F3 Generating..." : "\u2728 AI Custom Draft"}</div>
              <div style={{ fontSize: 10, color: theme.textMuted, lineHeight: 1.3 }}>Let AI write a unique message using actual lesson & fee data</div>
            </button>
          </div>
        </div>

        {/* ── MESSAGE EDITOR ────────────────────────────────── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: 0.5, textTransform: "uppercase" }}>
              Message {activeTemplate && activeTemplate !== "ai" ? "— " + (templateDefs.find(t => t.id === activeTemplate) || {}).label : ""}
            </label>
            {msgText && <span style={{ fontSize: 10, color: theme.textMuted }}>{msgText.length} chars</span>}
          </div>
          <textarea value={msgText} onChange={(e) => { setMsgText(e.target.value); if (activeTemplate) setActiveTemplate(null); }} placeholder="Select a template above, or type your own..." rows={10} style={{ width: "100%", padding: "12px 14px", background: theme.bgInput, border: "1px solid " + theme.border, borderRadius: 10, color: theme.text, outline: "none", fontSize: 12, fontFamily: "'DM Sans', sans-serif", resize: "vertical", lineHeight: 1.6 }} />
          {isBulk && activeTemplate && activeTemplate !== "ai" && (
            <div style={{ marginTop: 6, padding: 8, background: theme.infoBg, borderRadius: 8, border: "1px solid " + theme.info + "33" }}>
              <div style={{ fontSize: 11, color: theme.info, fontWeight: 500 }}>\u2139\uFE0F Each parent receives their own message generated from their student's actual lesson & fee data.</div>
            </div>
          )}
        </div>

        {/* ── SEND BUTTONS ──────────────────────────────────── */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {isBulk ? (
            <>
              {bulkSentIndex < bulkRecipients.length - 1 ? (
                <button onClick={() => {
                  if (!msgText.trim() && !activeTemplate) { addToast("Select a template or type a message", "error"); return; }
                  const nextIdx = bulkSentIndex + 1;
                  const recipient = bulkRecipients[nextIdx];
                  let personalMsg = msgText;
                  if (activeTemplate && activeTemplate !== "ai") {
                    const tpl = templateDefs.find((t) => t.id === activeTemplate);
                    if (tpl) {
                      personalMsg = tpl.generate(recipient.studentId);
                      // Strip AI placeholder for bulk (AI summary only in single mode)
                      personalMsg = personalMsg.replace("[AI_SUMMARY_PLACEHOLDER]\n\n", "").replace("[AI_SUMMARY_PLACEHOLDER]", "");
                    }
                  } else {
                    personalMsg = personalizeMessage(msgText, recipient);
                  }
                  setStore((s) => ({ ...s, messages: [...s.messages, { id: "m" + genId(), parentId: recipient.studentId, direction: "out", text: personalMsg, date: new Date().toISOString(), read: true }] }));
                  openWhatsApp(recipient.phone, personalMsg);
                  setBulkSentIndex(nextIdx);
                  if (nextIdx < bulkRecipients.length - 1 && activeTemplate && activeTemplate !== "ai") {
                    const tpl = templateDefs.find((t) => t.id === activeTemplate);
                    if (tpl) {
                      let nextMsg = tpl.generate(bulkRecipients[nextIdx + 1].studentId);
                      nextMsg = nextMsg.replace("[AI_SUMMARY_PLACEHOLDER]\n\n", "").replace("[AI_SUMMARY_PLACEHOLDER]", "");
                      setMsgText(nextMsg);
                    }
                  }
                  if (nextIdx === bulkRecipients.length - 1) addToast("All " + bulkRecipients.length + " messages opened!");
                }} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, border: "none", background: "#25D366", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 2px 12px rgba(37, 211, 102, 0.3)" }}>
                  <WAIcon />
                  {bulkSentIndex === -1 ? "Send to " + bulkRecipients[0].parentName + " (1/" + bulkRecipients.length + ")" : "Next: " + bulkRecipients[bulkSentIndex + 1].parentName + " (" + (bulkSentIndex + 2) + "/" + bulkRecipients.length + ")"}
                </button>
              ) : (
                <Button variant="success" icon="check" onClick={() => { setShowMessageCompose(null); setMsgText(""); setBulkSentIndex(-1); setActiveTemplate(null); }}>All Done!</Button>
              )}
              {bulkSentIndex > -1 && bulkSentIndex < bulkRecipients.length - 1 && (
                <div style={{ fontSize: 12, color: theme.success, display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon name="check" size={14} color={theme.success} /> {bulkSentIndex + 1}/{bulkRecipients.length} sent
                </div>
              )}
            </>
          ) : (
            <button onClick={() => {
              if (!msgText.trim()) { addToast("Select a template or type a message", "error"); return; }
              setStore((s) => ({ ...s, messages: [...s.messages, { id: "m" + genId(), parentId: showMessageCompose, direction: "out", text: msgText, date: new Date().toISOString(), read: true }] }));
              openWhatsApp(student.parentPhone, msgText);
              addToast("WhatsApp opened for " + student.parent);
              setShowMessageCompose(null); setMsgText(""); setActiveTemplate(null);
            }} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, border: "none", background: "#25D366", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 2px 12px rgba(37, 211, 102, 0.3)" }}>
              <WAIcon /> Send via WhatsApp
            </button>
          )}
          <Button variant="secondary" onClick={() => { setShowMessageCompose(null); setMsgText(""); setBulkSentIndex(-1); setActiveTemplate(null); }}>Cancel</Button>
        </div>
      </Modal>
    );
  };

  // ── AI Assistant Modal ─────────────────────────────────────
  const AIAssistantModal = () => {
    const [prompt, setPrompt] = useState("");
    const suggestions = [
      "Draft a progress report for [student]'s parents",
      "What's my projected revenue for March?",
      "Suggest a lesson plan for P6 高级华文 阅读理解",
      "Write a mid-term assessment summary for all students",
      "How can I improve my cancellation rate?",
    ];

    return (
      <Modal open={showAI} onClose={() => { setShowAI(false); setAiResult(""); }} title="TutorPulse AI" width={540}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, background: theme.purpleBg, borderRadius: 12, marginBottom: 16, border: `1px solid ${theme.purple}33` }}>
          <Icon name="ai" size={24} color={theme.purple} />
          <div style={{ fontSize: 13, color: theme.textSecondary }}>AI assistant powered by Claude — ask about scheduling, fees, lesson plans, or student progress.</div>
        </div>

        {!aiResult && !aiLoading && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>SUGGESTIONS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => { setPrompt(s); callAI(s); }} style={{ textAlign: "left", padding: "10px 14px", borderRadius: 10, border: `1px solid ${theme.border}`, background: "transparent", color: theme.textSecondary, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = theme.bgElevated; e.currentTarget.style.borderColor = theme.borderLight; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = theme.border; }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {aiLoading && (
          <div style={{ textAlign: "center", padding: 30 }}>
            <div style={{ display: "inline-block", width: 32, height: 32, borderRadius: "50%", border: `3px solid ${theme.border}`, borderTopColor: theme.accent, animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ marginTop: 12, fontSize: 13, color: theme.textSecondary }}>Thinking...</div>
          </div>
        )}

        {aiResult && (
          <div style={{ padding: 16, background: theme.bgElevated, borderRadius: 12, marginBottom: 16, fontSize: 13, lineHeight: 1.7, color: theme.textSecondary, whiteSpace: "pre-wrap", maxHeight: 300, overflow: "auto", border: `1px solid ${theme.border}` }}>
            {aiResult}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask TutorPulse AI anything..." style={{ flex: 1, padding: "10px 14px", background: theme.bgInput, border: `1px solid ${theme.border}`, borderRadius: 10, color: theme.text, outline: "none", fontSize: 13 }} onKeyDown={(e) => { if (e.key === "Enter" && prompt.trim()) callAI(prompt); }} />
          <Button size="sm" icon="send" onClick={() => { if (prompt.trim()) callAI(prompt); }} disabled={aiLoading || !prompt.trim()}>Ask</Button>
        </div>
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
  const pages = { home: HomePage, schedule: SchedulePage, students: StudentsPage, payments: PaymentsPage, admin: AdminPage };
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
          setSelectedLesson(null); setEditingLesson(false);
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
              <div style={{ padding: 12, background: theme.bgInput, borderRadius: 10, marginBottom: 16 }}><div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, marginBottom: 2 }}>SUBJECT</div><div style={{ fontSize: 14, fontWeight: 600 }}>{selectedLesson.subject}</div></div>
            </>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Input label="Date" type="date" value={lessonEdit.date} onChange={(v) => le("date", v)} />
                <Input label="Time" type="time" value={lessonEdit.time} onChange={(v) => le("time", v)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Select label="Duration" value={lessonEdit.duration} onChange={(v) => le("duration", v)} options={[{ value: "30", label: "30 min" }, { value: "60", label: "60 min" }, { value: "90", label: "90 min" }, { value: "120", label: "120 min" }, { value: "150", label: "150 min" }, { value: "180", label: "180 min" }]} />
                <Select label="Location" value={lessonEdit.location} onChange={(v) => le("location", v)} options={[{ value: "Home Studio", label: "Home Studio" }, { value: "Online — Zoom", label: "Online — Zoom" }, { value: "Student's Home", label: "Student's Home" }]} />
              </div>
              <Input label="Subject / Topic" value={lessonEdit.subject} onChange={(v) => le("subject", v)} />
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
          {/* Exclude from billing toggle */}
          <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: theme.bgInput, borderRadius: 10, border: "1px solid " + theme.border }}>
            <button onClick={() => { const newVal = !selectedLesson.excludeFromBilling; updateLesson(selectedLesson.id, { excludeFromBilling: newVal }); setSelectedLesson({ ...selectedLesson, excludeFromBilling: newVal }); addToast(newVal ? "Excluded from billing" : "Included in billing"); }} style={{ width: 40, height: 22, borderRadius: 11, border: "none", background: selectedLesson.excludeFromBilling ? theme.danger : theme.borderLight, cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
              <div style={{ width: 18, height: 18, borderRadius: 9, background: "white", position: "absolute", top: 2, left: selectedLesson.excludeFromBilling ? 20 : 2, transition: "left 0.2s" }} />
            </button>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: selectedLesson.excludeFromBilling ? theme.danger : theme.textSecondary }}>Exclude from billing</div>
              <div style={{ fontSize: 11, color: theme.textMuted }}>Toggle on for agency intro lessons or waived sessions</div>
            </div>
          </div>
          {/* Actions — always show edit + delete, even for completed/cancelled */}
          {!editingLesson && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(selectedLesson.status === "confirmed" || selectedLesson.status === "pending") && (
                <Button size="sm" variant="success" icon="check" onClick={() => { updateLesson(selectedLesson.id, { status: "completed" }); setSelectedLesson({ ...selectedLesson, status: "completed" }); addToast("Lesson marked as completed"); }}>Completed</Button>
              )}
              {selectedLesson.status === "pending" && (
                <Button size="sm" icon="check" onClick={() => { updateLesson(selectedLesson.id, { status: "confirmed" }); setSelectedLesson({ ...selectedLesson, status: "confirmed" }); addToast("Lesson confirmed"); }} style={{ background: theme.infoBg, color: theme.info, border: "none", borderRadius: 10, cursor: "pointer" }}>Confirm</Button>
              )}
              {selectedLesson.status !== "cancelled" && selectedLesson.status !== "completed" && (
                <Button size="sm" variant="danger" icon="x" onClick={() => { updateLesson(selectedLesson.id, { status: "cancelled" }); setSelectedLesson({ ...selectedLesson, status: "cancelled" }); addToast("Lesson cancelled"); }}>Cancel</Button>
              )}
              {(selectedLesson.status === "cancelled" || selectedLesson.status === "completed") && (
                <Button size="sm" variant="secondary" icon="repeat" onClick={() => { updateLesson(selectedLesson.id, { status: "confirmed" }); setSelectedLesson({ ...selectedLesson, status: "confirmed" }); addToast("Lesson reverted to confirmed"); }}>Revert to Confirmed</Button>
              )}
              <Button size="sm" variant="secondary" icon="edit" onClick={startLessonEdit}>Edit Lesson</Button>
              <Button size="sm" variant="ghost" icon="message" onClick={() => { setSelectedLesson(null); if (lessonDetailStudent) setShowMessageCompose(selectedLesson.studentId); }}>Message Parent</Button>
              <Button size="sm" variant="ghost" icon="trash" onClick={handleDeleteLesson} style={{ color: theme.danger }}>Delete</Button>
            </div>
          )}
        </Modal>
      )}
      <NewLessonModal />
      {/* New Student Modal — inline to prevent form reset on clock tick */}
      {showNewStudent && (
        <Modal open={showNewStudent} onClose={() => setShowNewStudent(false)} title="Add New Student">
          <Input label="Student Name" value={newStudentForm.name} onChange={(v) => updateNewStudentForm("name", v)} placeholder="Full name" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select label="Level" value={newStudentForm.level} onChange={(v) => updateNewStudentForm("level", v)} options={LEVEL_OPTIONS} />
            <Select label="Stream" value={newStudentForm.stream} onChange={(v) => updateNewStudentForm("stream", v)} options={STREAM_OPTIONS} />
          </div>
          <Input label="Parent Name" value={newStudentForm.parent} onChange={(v) => updateNewStudentForm("parent", v)} placeholder="Parent/Guardian name" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Phone" value={newStudentForm.parentPhone} onChange={(v) => updateNewStudentForm("parentPhone", v)} placeholder="+65 9XXX XXXX" />
            <Input label="Email" value={newStudentForm.parentEmail} onChange={(v) => updateNewStudentForm("parentEmail", v)} placeholder="email@example.com" />
          </div>
          <Input label="Address" value={newStudentForm.address} onChange={(v) => updateNewStudentForm("address", v)} placeholder="Student's home address" />
          <Input label="Hourly Rate ($)" type="number" value={newStudentForm.hourlyRate} onChange={(v) => updateNewStudentForm("hourlyRate", v)} />
          <Input label="Notes" value={newStudentForm.notes} onChange={(v) => updateNewStudentForm("notes", v)} multiline placeholder="Any notes about the student..." />
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={() => {
              if (!newStudentForm.name) { addToast("Please enter student name", "error"); return; }
              const initials = newStudentForm.name.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2);
              addStudent({ name: newStudentForm.name, level: newStudentForm.level, stream: newStudentForm.stream, parent: newStudentForm.parent, parentPhone: newStudentForm.parentPhone, parentEmail: newStudentForm.parentEmail, hourlyRate: parseFloat(newStudentForm.hourlyRate) || 70, address: newStudentForm.address, status: "trial", joinDate: new Date().toISOString().split("T")[0], notes: newStudentForm.notes, avatar: initials });
              setNewStudentForm({ name: "", level: "P5", stream: "小学普华", parent: "", parentPhone: "", parentEmail: "", hourlyRate: "70", address: "", notes: "" });
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
          setStudentEditForm({ name: selectedStudent.name, level: selectedStudent.level, stream: selectedStudent.stream, parent: selectedStudent.parent, parentPhone: selectedStudent.parentPhone, parentEmail: selectedStudent.parentEmail, hourlyRate: String(selectedStudent.hourlyRate), address: selectedStudent.address || "", notes: selectedStudent.notes || "", status: selectedStudent.status });
          setEditingStudent(true);
        };
        const saveEdit = () => {
          const u = { name: studentEditForm.name, level: studentEditForm.level, stream: studentEditForm.stream, parent: studentEditForm.parent, parentPhone: studentEditForm.parentPhone, parentEmail: studentEditForm.parentEmail, hourlyRate: parseFloat(studentEditForm.hourlyRate) || selectedStudent.hourlyRate, address: studentEditForm.address, notes: studentEditForm.notes, status: studentEditForm.status, avatar: studentEditForm.name.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2) };
          updateStudent(selectedStudent.id, u); setSelectedStudent({ ...selectedStudent, ...u }); setEditingStudent(false); addToast("Student updated");
        };
        const uf = (k, v) => setStudentEditForm((f) => ({ ...f, [k]: v }));
        return (
          <Modal open={!!selectedStudent} onClose={() => { setSelectedStudent(null); setEditingStudent(false); setBulkDeleteMode(false); }} title={editingStudent ? "Edit Student" : "Student Profile"} width={520}>
            {!editingStudent ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid " + theme.border }}>
                  <Avatar initials={selectedStudent.avatar} size={56} color={getStatusColor(selectedStudent.status)} />
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 18, fontFamily: "'Playfair Display', serif" }}>{selectedStudent.name}</div><div style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>{selectedStudent.level} · {selectedStudent.stream}</div><Badge text={selectedStudent.status} color={getStatusColor(selectedStudent.status)} bg={getStatusBg(selectedStudent.status)} /></div>
                  <div style={{ textAlign: "right" }}><div style={{ fontSize: 24, fontWeight: 700, color: theme.accent, fontFamily: "'Playfair Display', serif" }}>${selectedStudent.hourlyRate}</div><div style={{ fontSize: 11, color: theme.textMuted }}>per hour</div></div>
                </div>
                <Card style={{ marginBottom: 12, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}><div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, letterSpacing: 0.5 }}>PARENT / GUARDIAN</div><button onClick={startEdit} style={{ background: "none", border: "none", cursor: "pointer", color: theme.accent, fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 3 }}><Icon name="edit" size={12} color={theme.accent} /> Edit</button></div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{selectedStudent.parent}</div>
                  <div style={{ fontSize: 13, color: theme.textSecondary }}>{selectedStudent.parentPhone}</div>
                  <div style={{ fontSize: 13, color: theme.textSecondary }}>{selectedStudent.parentEmail}</div>
                </Card>
                {selectedStudent.notes && (<Card style={{ marginBottom: 12, padding: 14, borderLeft: "3px solid " + theme.accent }}><div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, marginBottom: 4, letterSpacing: 0.5 }}>NOTES</div><div style={{ fontSize: 13, color: theme.textSecondary }}>{selectedStudent.notes}</div></Card>)}
              </>
            ) : (
              <>
                <Input label="Student Name" value={studentEditForm.name} onChange={(v) => uf("name", v)} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><Select label="Level" value={studentEditForm.level} onChange={(v) => uf("level", v)} options={LEVEL_OPTIONS} /><Select label="Stream" value={studentEditForm.stream} onChange={(v) => uf("stream", v)} options={STREAM_OPTIONS} /></div>
                <Input label="Parent Name" value={studentEditForm.parent} onChange={(v) => uf("parent", v)} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><Input label="Phone" value={studentEditForm.parentPhone} onChange={(v) => uf("parentPhone", v)} /><Input label="Email" value={studentEditForm.parentEmail} onChange={(v) => uf("parentEmail", v)} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><Input label="Hourly Rate ($)" type="number" value={studentEditForm.hourlyRate} onChange={(v) => uf("hourlyRate", v)} /><Select label="Status" value={studentEditForm.status} onChange={(v) => uf("status", v)} options={[{ value: "active", label: "Active" }, { value: "trial", label: "Trial" }, { value: "paused", label: "Paused" }]} /></div>
                <Input label="Address" value={studentEditForm.address} onChange={(v) => uf("address", v)} />
                <Input label="Notes" value={studentEditForm.notes} onChange={(v) => uf("notes", v)} multiline />
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}><Button size="sm" icon="check" onClick={saveEdit}>Save Changes</Button><Button size="sm" variant="secondary" onClick={() => setEditingStudent(false)}>Cancel</Button></div>
              </>
            )}
            {/* Lessons */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, letterSpacing: 0.5 }}>LESSONS ({studentLessons.length})</div>
                {studentLessons.length > 0 && (<button onClick={() => { setBulkDeleteMode(!bulkDeleteMode); bulkDeleteIdsRef.current = []; setBulkDeleteCount(0); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, color: bulkDeleteMode ? theme.accent : theme.textMuted, fontFamily: "'DM Sans', sans-serif" }}>{bulkDeleteMode ? "Done" : "Bulk Delete"}</button>)}
              </div>
              {bulkDeleteMode && (
                <div id="bulk-bar" style={{ display: bulkDeleteCount > 0 ? "flex" : "none", gap: 8, alignItems: "center", marginBottom: 10, padding: "8px 12px", background: theme.dangerBg, borderRadius: 10, border: "1px solid " + theme.danger + "44", position: "sticky", top: 0, zIndex: 2 }}>
                  <span id="bulk-count" style={{ fontSize: 12, color: theme.danger, fontWeight: 600, flex: 1 }}>{bulkDeleteCount} selected</span>
                  <button onClick={() => { bulkDeleteIdsRef.current = studentLessons.map(l => l.id); setBulkDeleteCount(studentLessons.length); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: theme.textSecondary, fontFamily: "'DM Sans', sans-serif" }}>Select All</button>
                  <button onClick={() => { const ids = bulkDeleteIdsRef.current; if (window.confirm("Delete " + ids.length + " lessons?")) { setStore((s) => ({ ...s, lessons: s.lessons.filter(l => !ids.includes(l.id)) })); addToast(ids.length + " lessons deleted"); bulkDeleteIdsRef.current = []; setBulkDeleteCount(0); setBulkDeleteMode(false); } }} style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: theme.danger, color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Delete</button>
                </div>
              )}
              {studentLessons.length === 0 && <div style={{ fontSize: 13, color: theme.textMuted, padding: "8px 0" }}>No lessons yet</div>}
              {studentLessons.map((l) => (
                <div key={l.id} style={{ padding: "10px 0", borderBottom: "1px solid " + theme.border, cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start" }} onClick={(e) => {
                  if (bulkDeleteMode) {
                    const ids = bulkDeleteIdsRef.current; const isSelected = ids.includes(l.id);
                    bulkDeleteIdsRef.current = isSelected ? ids.filter(x => x !== l.id) : [...ids, l.id];
                    const cb = e.currentTarget.querySelector("[data-cb]");
                    if (cb) { const now = !isSelected; cb.style.borderColor = now ? theme.danger : theme.borderLight; cb.style.background = now ? theme.danger : "transparent"; cb.innerHTML = now ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''; }
                    const countEl = document.getElementById("bulk-count"); const count = bulkDeleteIdsRef.current.length; if (countEl) countEl.textContent = count + " selected"; const bar = document.getElementById("bulk-bar"); if (bar) bar.style.display = count > 0 ? "flex" : "none";
                  } else { setReturnToStudentId(selectedStudent.id); setSelectedStudent(null); setSelectedLesson(l); setLessonComment(l.comment || ""); }
                }}>
                  {bulkDeleteMode && (<div data-cb="1" style={{ width: 22, height: 22, borderRadius: 6, border: "2px solid " + theme.borderLight, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 4 }}></div>)}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{l.subject}</div><div style={{ fontSize: 11, color: theme.textMuted }}>{formatDate(l.date)} · {formatTime(l.date)} · {l.duration} min</div></div>
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
                <Button size="sm" variant="ghost" icon="message" onClick={() => { setSelectedStudent(null); setShowMessageCompose(selectedStudent.id); }}>Message Parent</Button>
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
      {showMessageCompose && <MessageComposeModal />}
      <AIAssistantModal />
      <NotificationsPanel />
    </div>
  );
}
