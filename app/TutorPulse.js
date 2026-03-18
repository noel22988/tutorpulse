"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";

// ═══════════════════════════════════════════════════════════════
// TUTORPULSE — Intelligent Tutor Scheduling & Fee Management
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = "tutorpulse-data";

// ── Premium badge ────────────────────────────────────────────
const PremiumBadge = () => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 3,
    padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 700,
    letterSpacing: 0.4, background: "linear-gradient(135deg, #F59E0B, #D97706)",
    color: "#0A0E17", marginLeft: 6, verticalAlign: "middle", flexShrink: 0
  }}>✦ PREMIUM</span>
);

// ── Data Store ───────────────────────────────────────────────
const createStore = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const students = [
    { id: "s1", name: "Ethan Tan", level: "P5", stream: "华文", parent: "Mrs. Tan", parentPhone: "+65 9123 4567", parentEmail: "tan.mei@email.com", hourlyRate: 70, billingMode: "monthly", status: "active", joinDate: "2025-01-15", notes: "Needs extra help with 作文", avatar: "ET", grades: [] },
    { id: "s2", name: "Chloe Wong", level: "P6", stream: "高级华文", parent: "Mr. Wong", parentPhone: "+65 9234 5678", parentEmail: "wong.kh@email.com", hourlyRate: 80, billingMode: "monthly", status: "active", joinDate: "2024-08-01", notes: "Preparing for PSLE, strong in 阅读理解", avatar: "CW", grades: [] },
    { id: "s3", name: "Ryan Lim", level: "Sec 3", stream: "O-Level Chinese", parent: "Mrs. Lim", parentPhone: "+65 9345 6789", parentEmail: "lim.sy@email.com", hourlyRate: 90, billingMode: "monthly", status: "active", joinDate: "2025-03-01", notes: "Focus on Paper 1 Email Writing", avatar: "RL", grades: [] },
    { id: "s4", name: "Sophie Chen", level: "P5", stream: "华文", parent: "Mrs. Chen", parentPhone: "+65 9456 7890", parentEmail: "chen.jy@email.com", hourlyRate: 70, billingMode: "monthly", status: "active", joinDate: "2024-06-15", notes: "Good progress, encourage more 口试 practice", avatar: "SC", grades: [] },
    { id: "s5", name: "Marcus Lee", level: "Sec 4", stream: "O-Level Chinese", parent: "Mr. Lee", parentPhone: "+65 9567 8901", parentEmail: "lee.wt@email.com", hourlyRate: 90, billingMode: "monthly", status: "active", joinDate: "2024-03-01", notes: "Final year, intensive revision needed", avatar: "ML", grades: [] },
    { id: "s6", name: "Alyssa Ng", level: "P6", stream: "高级华文", parent: "Mrs. Ng", parentPhone: "+65 9678 9012", parentEmail: "ng.lh@email.com", hourlyRate: 80, billingMode: "monthly", status: "trial", joinDate: "2025-02-20", notes: "Trial lesson completed, parents considering", avatar: "AN", grades: [] },
    { id: "s7", name: "Dylan Koh", level: "P5", stream: "华文", parent: "Mr. Koh", parentPhone: "+65 9789 0123", parentEmail: "koh.ah@email.com", hourlyRate: 70, billingMode: "monthly", status: "paused", joinDate: "2024-09-01", notes: "On pause — family holiday till mid-March", avatar: "DK", grades: [] },
    { id: "s8", name: "Isabella Teo", level: "Sec 2", stream: "O-Level Chinese", parent: "Mrs. Teo", parentPhone: "+65 9890 1234", parentEmail: "teo.ml@email.com", hourlyRate: 80, billingMode: "monthly", status: "active", joinDate: "2025-01-10", notes: "Building foundation for upper sec", avatar: "IT", grades: [] },
  ];

  const lessons = [
    { id: "l1", studentId: "s1", date: new Date(y, m, 8, 10, 0).toISOString(), duration: 90, subject: "华文 作文", status: "confirmed", location: "Home Studio", comment: "", homework: "" },
    { id: "l2", studentId: "s2", date: new Date(y, m, 8, 14, 0).toISOString(), duration: 90, subject: "高级华文 阅读理解", status: "confirmed", location: "Home Studio", comment: "", homework: "" },
    { id: "l3", studentId: "s3", date: new Date(y, m, 8, 16, 0).toISOString(), duration: 120, subject: "O-Level Paper 1", status: "confirmed", location: "Online — Zoom", comment: "", homework: "" },
    { id: "l4", studentId: "s4", date: new Date(y, m, 9, 10, 0).toISOString(), duration: 90, subject: "华文 听写 & 口试", status: "confirmed", location: "Home Studio", comment: "", homework: "" },
    { id: "l5", studentId: "s5", date: new Date(y, m, 9, 15, 0).toISOString(), duration: 120, subject: "O-Level Intensive Revision", status: "confirmed", location: "Home Studio", comment: "", homework: "" },
    { id: "l6", studentId: "s1", date: new Date(y, m, 10, 10, 0).toISOString(), duration: 90, subject: "华文 阅读理解", status: "pending", location: "Home Studio", comment: "", homework: "" },
    { id: "l7", studentId: "s8", date: new Date(y, m, 10, 14, 0).toISOString(), duration: 90, subject: "Chinese Foundation", status: "confirmed", location: "Online — Zoom", comment: "", homework: "" },
    { id: "l8", studentId: "s2", date: new Date(y, m, 11, 10, 0).toISOString(), duration: 90, subject: "高级华文 综合练习", status: "confirmed", location: "Home Studio", comment: "", homework: "" },
    { id: "l9", studentId: "s5", date: new Date(y, m, 12, 16, 0).toISOString(), duration: 120, subject: "O-Level Paper 2 Practice", status: "confirmed", location: "Home Studio", comment: "", homework: "" },
    { id: "l10", studentId: "s3", date: new Date(y, m, 13, 16, 0).toISOString(), duration: 120, subject: "O-Level 综合填空", status: "pending", location: "Online — Zoom", comment: "", homework: "" },
    { id: "l11", studentId: "s4", date: new Date(y, m, 14, 10, 0).toISOString(), duration: 90, subject: "华文 造句练习", status: "confirmed", location: "Home Studio", comment: "", homework: "" },
    { id: "l12", studentId: "s6", date: new Date(y, m, 15, 14, 0).toISOString(), duration: 60, subject: "Trial Lesson — 高级华文", status: "pending", location: "Home Studio", comment: "2nd trial", homework: "" },
  ];

  const payments = [
    { id: "p1", studentId: "s1", month: `${y}-${String(m).padStart(2,"0")}`, amount: 280, status: "paid", paidDate: `${y}-${String(m).padStart(2,"0")}-05`, method: "PayNow" },
    { id: "p2", studentId: "s2", month: `${y}-${String(m).padStart(2,"0")}`, amount: 320, status: "paid", paidDate: `${y}-${String(m).padStart(2,"0")}-03`, method: "Bank Transfer" },
    { id: "p3", studentId: "s3", month: `${y}-${String(m).padStart(2,"0")}`, amount: 350, status: "paid", paidDate: `${y}-${String(m).padStart(2,"0")}-10`, method: "PayNow" },
    { id: "p4", studentId: "s4", month: `${y}-${String(m).padStart(2,"0")}`, amount: 280, status: "paid", paidDate: `${y}-${String(m).padStart(2,"0")}-08`, method: "Cash" },
    { id: "p5", studentId: "s5", month: `${y}-${String(m).padStart(2,"0")}`, amount: 350, status: "paid", paidDate: `${y}-${String(m).padStart(2,"0")}-01`, method: "PayNow" },
    { id: "p6", studentId: "s8", month: `${y}-${String(m).padStart(2,"0")}`, amount: 320, status: "paid", paidDate: `${y}-${String(m).padStart(2,"0")}-12`, method: "Bank Transfer" },
    { id: "p7", studentId: "s1", month: `${y}-${String(m+1).padStart(2,"0")}`, amount: 280, status: "pending", paidDate: null, method: null },
    { id: "p8", studentId: "s2", month: `${y}-${String(m+1).padStart(2,"0")}`, amount: 320, status: "pending", paidDate: null, method: null },
    { id: "p9", studentId: "s3", month: `${y}-${String(m+1).padStart(2,"0")}`, amount: 350, status: "overdue", paidDate: null, method: null },
    { id: "p10", studentId: "s4", month: `${y}-${String(m+1).padStart(2,"0")}`, amount: 280, status: "pending", paidDate: null, method: null },
    { id: "p11", studentId: "s5", month: `${y}-${String(m+1).padStart(2,"0")}`, amount: 350, status: "pending", paidDate: null, method: null },
    { id: "p12", studentId: "s8", month: `${y}-${String(m+1).padStart(2,"0")}`, amount: 320, status: "pending", paidDate: null, method: null },
  ];

  const messages = [
    { id: "m1", parentId: "s1", direction: "out", text: "Hi Mrs. Tan, just a reminder that Ethan's fees are due. Please PayNow to UEN 202410124E. Thank you!", date: new Date(y, m, 1, 9, 0).toISOString(), read: true },
    { id: "m2", parentId: "s1", direction: "in", text: "Hi Teacher Leon, noted! Will transfer by this weekend.", date: new Date(y, m, 1, 10, 30).toISOString(), read: true },
    { id: "m3", parentId: "s3", direction: "out", text: "Hi Mrs. Lim, Ryan's fees are now overdue. Kindly arrange payment at your earliest convenience. Thank you!", date: new Date(y, m, 5, 9, 0).toISOString(), read: true },
  ];

  const notifications = [
    { id: "n1", type: "payment", text: "Ryan Lim's fee is overdue", time: "2h ago", read: false },
    { id: "n2", type: "lesson", text: "Ethan Tan's lesson tomorrow at 10:00 AM", time: "3h ago", read: false },
    { id: "n3", type: "trial", text: "Alyssa Ng — 2nd trial lesson on Mar 15", time: "5h ago", read: false },
    { id: "n4", type: "system", text: "Monthly revenue report ready", time: "1d ago", read: true },
  ];

  return {
    students, lessons, payments, messages, notifications,
    revenueHistory: [],
    settings: { tutorName: "Leon", accentColor: "#F59E0B", accentDark: "#D97706" },
    aiHistory: [],
    analyticsToggles: { revenue: true, avgFee: true, completion: true, collection: true, lessonPerStudent: true, attendanceRate: true, revenuePerStream: true, avgDuration: true, paymentTurnaround: true },
  };
};

// ── Persistence ──────────────────────────────────────────────
const loadStore = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
};
const saveStore = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
};

// ── Icons ────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = "currentColor", className = "" }) => {
  const icons = {
    calendar: <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
    dollar: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
    message: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></>,
    chart: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>,</>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
    ai: <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    chevDown: <polyline points="6 9 12 15 18 9"/>,
    chevRight: <polyline points="9 18 15 12 9 6"/>,
    arrowLeft: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
    repeat: <><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></>,
    download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    phone: <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    book: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
    award: <><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>,
    translate: <><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></>,
    palette: <><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12a10 10 0 0010 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></>,
    graduation: <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>,
    barChart: <><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>,
    toggleLeft: <><rect x="1" y="5" width="22" height="14" rx="7" ry="7"/><circle cx="8" cy="12" r="3"/></>,
    toggleRight: <><rect x="1" y="5" width="22" height="14" rx="7" ry="7"/><circle cx="16" cy="12" r="3"/></>,
    history: <><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></>,
    globe: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
    mapPin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ flexShrink: 0 }}>
      {icons[name]}
    </svg>
  );
};

// ── Theme ────────────────────────────────────────────────────
const makeTheme = (accent = "#F59E0B", accentDark = "#D97706") => ({
  bg: "#0A0E17", bgCard: "#111827", bgCardHover: "#1A2332", bgElevated: "#1E293B",
  bgInput: "#0F172A", border: "#1E293B", borderLight: "#2D3B4F",
  text: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
  accent, accentLight: accent, accentDark,
  accentBg: `${accent}1A`, accentBgStrong: `${accent}33`,
  success: "#10B981", successBg: "rgba(16,185,129,0.1)",
  danger: "#EF4444", dangerBg: "rgba(239,68,68,0.1)",
  warning: "#F59E0B", warningBg: "rgba(245,158,11,0.1)",
  info: "#3B82F6", infoBg: "rgba(59,130,246,0.1)",
  purple: "#8B5CF6", purpleBg: "rgba(139,92,246,0.1)",
});

const css = (theme) => `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'DM Sans',sans-serif; background:${theme.bg}; color:${theme.text}; -webkit-font-smoothing:antialiased; }
  ::-webkit-scrollbar { width:6px; height:6px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:${theme.borderLight}; border-radius:3px; }
  input,textarea,select { font-family:'DM Sans',sans-serif; font-size:14px; }
  textarea { resize:vertical; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes glow { 0%,100%{box-shadow:0 0 5px ${theme.accent}4D} 50%{box-shadow:0 0 20px ${theme.accent}99} }
  .fade-in{animation:fadeIn 0.3s ease-out}
  .slide-up{animation:slideUp 0.4s ease-out}
  .stagger-1{animation-delay:.05s;animation-fill-mode:both}
  .stagger-2{animation-delay:.1s;animation-fill-mode:both}
  .stagger-3{animation-delay:.15s;animation-fill-mode:both}
  .stagger-4{animation-delay:.2s;animation-fill-mode:both}
`;

// ── Utilities ────────────────────────────────────────────────
const LEVEL_OPTIONS = [
  {value:"P1",label:"Primary 1"},{value:"P2",label:"Primary 2"},{value:"P3",label:"Primary 3"},
  {value:"P4",label:"Primary 4"},{value:"P5",label:"Primary 5"},{value:"P6",label:"Primary 6"},
  {value:"Sec 1",label:"Secondary 1"},{value:"Sec 2",label:"Secondary 2"},
  {value:"Sec 3",label:"Secondary 3"},{value:"Sec 4",label:"Secondary 4"},
  {value:"Sec 5",label:"Secondary 5"},{value:"JC 1",label:"JC 1"},{value:"other",label:"Other (specify)"},
];
const STREAM_OPTIONS = [
  {value:"小学普华",label:"小学普华"},{value:"小学高华",label:"小学高华"},
  {value:"G1华文",label:"G1华文"},{value:"G2华文",label:"G2华文"},{value:"G3华文",label:"G3华文"},
  {value:"中学高华",label:"中学高华"},{value:"H1华文",label:"H1华文"},{value:"other",label:"Other (specify)"},
];
const DURATION_OPTIONS = [
  {value:"30",label:"30 min"},{value:"45",label:"45 min"},{value:"60",label:"60 min"},
  {value:"90",label:"90 min"},{value:"120",label:"120 min"},{value:"custom",label:"Other"},
];

const formatDate = (d) => new Date(d).toLocaleDateString("en-SG",{weekday:"short",day:"numeric",month:"short"});
const formatTime = (d) => new Date(d).toLocaleTimeString("en-SG",{hour:"2-digit",minute:"2-digit",hour12:true});
const formatMonth = (m) => { const [y,mo]=m.split("-"); return new Date(parseInt(y),parseInt(mo)-1).toLocaleDateString("en-SG",{month:"long",year:"numeric"}); };
const genId = () => Math.random().toString(36).substr(2,9);
const getStatusColor = (s,theme) => ({confirmed:theme.success,pending:theme.warning,cancelled:theme.danger,completed:theme.info,paid:theme.success,overdue:theme.danger,active:theme.success,trial:theme.info,paused:theme.textMuted,graduated:theme.purple}[s]||theme.textSecondary);
const getStatusBg = (s,theme) => ({confirmed:theme.successBg,pending:theme.warningBg,cancelled:theme.dangerBg,completed:theme.infoBg,paid:theme.successBg,overdue:theme.dangerBg,active:theme.successBg,trial:theme.infoBg,paused:"rgba(100,116,139,0.1)",graduated:theme.purpleBg}[s]||"rgba(148,163,184,0.1)");

// Strip markdown formatting from AI text
const stripMarkdown = (text) => {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/`(.+?)`/g, "$1")
    .replace(/_{1,2}(.+?)_{1,2}/g, "$1");
};

// ── Reusable UI Components ───────────────────────────────────
const Badge = ({ text, color, bg }) => (
  <span style={{display:"inline-flex",alignItems:"center",padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:600,letterSpacing:0.3,textTransform:"uppercase",color,background:bg}}>{text}</span>
);

const Button = ({ children, variant="primary", size="md", onClick, style={}, disabled=false, icon }) => {
  const theme = makeTheme();
  const base = {display:"inline-flex",alignItems:"center",gap:6,border:"none",borderRadius:10,cursor:disabled?"default":"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,transition:"all 0.2s",opacity:disabled?0.5:1,whiteSpace:"nowrap"};
  const sizes = {sm:{padding:"6px 12px",fontSize:12},md:{padding:"10px 20px",fontSize:14},lg:{padding:"14px 28px",fontSize:16}};
  const variants = {
    primary:{background:`linear-gradient(135deg,${theme.accent},${theme.accentDark})`,color:"#0A0E17",boxShadow:`0 2px 12px ${theme.accent}4D`},
    secondary:{background:theme.bgElevated,color:theme.text,border:`1px solid ${theme.borderLight}`},
    ghost:{background:"transparent",color:theme.textSecondary},
    danger:{background:theme.dangerBg,color:theme.danger},
    success:{background:theme.successBg,color:theme.success},
  };
  return <button onClick={disabled?undefined:onClick} style={{...base,...sizes[size],...variants[variant],...style}}>{icon&&<Icon name={icon} size={size==="sm"?14:16}/>}{children}</button>;
};

const Card = ({ children, style={}, onClick, hover=false, theme }) => {
  const t = theme || makeTheme();
  return (
    <div onClick={onClick} style={{background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:16,padding:20,transition:"all 0.2s",cursor:onClick?"pointer":"default",...style}}
      onMouseEnter={(e)=>{if(hover){e.currentTarget.style.background=t.bgCardHover;e.currentTarget.style.borderColor=t.borderLight;}}}
      onMouseLeave={(e)=>{if(hover){e.currentTarget.style.background=t.bgCard;e.currentTarget.style.borderColor=t.border;}}}>
      {children}
    </div>
  );
};

const Input = ({ label, value, onChange, type="text", placeholder, style={}, multiline=false, rows=3 }) => {
  const theme = makeTheme();
  return (
    <div style={{marginBottom:16,...style}}>
      {label&&<label style={{display:"block",fontSize:12,fontWeight:600,color:theme.textSecondary,marginBottom:6,letterSpacing:0.5,textTransform:"uppercase"}}>{label}</label>}
      {multiline
        ? <textarea value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{width:"100%",padding:"10px 14px",background:theme.bgInput,border:`1px solid ${theme.border}`,borderRadius:10,color:theme.text,outline:"none",fontSize:14}}/>
        : <input type={type} value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",padding:"10px 14px",background:theme.bgInput,border:`1px solid ${theme.border}`,borderRadius:10,color:theme.text,outline:"none",fontSize:14}}/>
      }
    </div>
  );
};

const Select = ({ label, value, onChange, options, style={} }) => {
  const theme = makeTheme();
  return (
    <div style={{marginBottom:16,...style}}>
      {label&&<label style={{display:"block",fontSize:12,fontWeight:600,color:theme.textSecondary,marginBottom:6,letterSpacing:0.5,textTransform:"uppercase"}}>{label}</label>}
      <select value={value} onChange={(e)=>onChange(e.target.value)} style={{width:"100%",padding:"10px 14px",background:theme.bgInput,border:`1px solid ${theme.border}`,borderRadius:10,color:theme.text,outline:"none",fontSize:14,cursor:"pointer",appearance:"none"}}>
        {options.map((o)=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
};

const Avatar = ({ initials, size=40, color }) => {
  const theme = makeTheme();
  const c = color||theme.accent;
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:`linear-gradient(135deg,${c}22,${c}44)`,border:`2px solid ${c}66`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:700,color:c,flexShrink:0,letterSpacing:0.5}}>
      {initials}
    </div>
  );
};

const Modal = ({ open, onClose, title, children, width=480 }) => {
  const theme = makeTheme();
  if (!open) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div style={{background:theme.bgCard,border:`1px solid ${theme.border}`,borderRadius:20,width:"90%",maxWidth:width,maxHeight:"85vh",overflow:"auto",padding:0}} onClick={(e)=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px",borderBottom:`1px solid ${theme.border}`,position:"sticky",top:0,background:theme.bgCard,zIndex:1,borderRadius:"20px 20px 0 0"}}>
          <h3 style={{fontSize:18,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:theme.textMuted,padding:4}}><Icon name="x" size={20}/></button>
        </div>
        <div style={{padding:24}}>{children}</div>
      </div>
    </div>
  );
};

const TabBar = ({ tabs, active, onChange }) => {
  const theme = makeTheme();
  return (
    <div style={{display:"flex",gap:2,background:theme.bgInput,borderRadius:12,padding:3,marginBottom:20}}>
      {tabs.map((t)=>(
        <button key={t.id} onClick={()=>onChange(t.id)} style={{flex:1,padding:"8px 16px",borderRadius:10,border:"none",background:active===t.id?theme.bgElevated:"transparent",color:active===t.id?theme.text:theme.textMuted,fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif"}}>
          {t.label}
        </button>
      ))}
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, color, description }) => {
  const theme = makeTheme();
  const c = color||theme.accent;
  return (
    <Card style={{flex:1,minWidth:150}} theme={theme}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:12,color:theme.textMuted,fontWeight:500,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>{label}</div>
          <div style={{fontSize:28,fontWeight:700,color:theme.text,fontFamily:"'Playfair Display',serif"}}>{value}</div>
          {sub&&<div style={{fontSize:12,color:theme.textSecondary,marginTop:4}}>{sub}</div>}
          {description&&<div style={{fontSize:11,color:theme.textMuted,marginTop:6,lineHeight:1.4}}>{description}</div>}
        </div>
        <div style={{width:42,height:42,borderRadius:12,background:`${c}22`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Icon name={icon} size={20} color={c}/>
        </div>
      </div>
    </Card>
  );
};

const EmptyState = ({ icon, title, sub }) => {
  const theme = makeTheme();
  return (
    <div style={{textAlign:"center",padding:40,color:theme.textMuted}}>
      <Icon name={icon} size={48} color={theme.borderLight}/>
      <div style={{fontSize:16,fontWeight:600,marginTop:12,color:theme.textSecondary}}>{title}</div>
      <div style={{fontSize:13,marginTop:4}}>{sub}</div>
    </div>
  );
};

const WAIcon = ({ size=18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366" style={{flexShrink:0}}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function TutorPulse() {
  const [store, setStore] = useState(() => loadStore() || createStore());
  const [loaded, setLoaded] = useState(true);
  const [page, setPage] = useState("home");
  const [showNotif, setShowNotif] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showNewLesson, setShowNewLesson] = useState(false);
  const [prefillStudentId, setPrefillStudentId] = useState(null);
  const [showNewStudent, setShowNewStudent] = useState(false);
  const [showMessageCompose, setShowMessageCompose] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [toasts, setToasts] = useState([]);
  const [adminTab, setAdminTab] = useState("overview");
  const [editingStudent, setEditingStudent] = useState(false);
  const [studentEditForm, setStudentEditForm] = useState({});
  const [editingLesson, setEditingLesson] = useState(false);
  const [lessonEdit, setLessonEdit] = useState({});
  const [returnToStudentId, setReturnToStudentId] = useState(null);
  const [scheduleTab, setScheduleTab] = useState("today");
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [newStudentForm, setNewStudentForm] = useState({name:"",level:"P5",levelCustom:"",stream:"小学普华",streamCustom:"",parent:"",parentPhone:"",parentEmail:"",hourlyRate:"70",billingMode:"monthly",address:"",notes:""});
  const bulkDeleteIdsRef = useRef([]);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [bulkDeleteCount, setBulkDeleteCount] = useState(0);

  const theme = useMemo(() => makeTheme(
    store.settings?.accentColor || "#F59E0B",
    store.settings?.accentDark || "#D97706"
  ), [store.settings?.accentColor, store.settings?.accentDark]);

  // ── Persist ───────────────────────────────────────────────
  const saveTimerRef = useRef(null);
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveStore(store), 500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [store]);

  // ── Clock (separate from store, so it doesn't cause page remounts) ──
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(i);
  }, []);

  // ── Toast ────────────────────────────────────────────────
  const addToast = useCallback((msg, type="success") => {
    const id = genId();
    setToasts((t) => [...t, {id, msg, type}]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  // ── Store mutators ───────────────────────────────────────
  const updateLesson = useCallback((id, updates) => setStore((s) => ({...s, lessons: s.lessons.map((l) => l.id===id ? {...l,...updates} : l)})), []);
  const updatePayment = useCallback((id, updates) => setStore((s) => ({...s, payments: s.payments.map((p) => p.id===id ? {...p,...updates} : p)})), []);
  const addLesson = useCallback((lesson) => { setStore((s) => ({...s, lessons: [...s.lessons, {...lesson, id:"l"+genId()}]})); addToast("Lesson scheduled"); }, [addToast]);
  const deleteLesson = useCallback((id) => { setStore((s) => ({...s, lessons: s.lessons.filter((l) => l.id!==id)})); }, []);
  const addStudent = useCallback((student) => { setStore((s) => ({...s, students: [...s.students, {...student, id:"s"+genId()}]})); addToast("Student added"); }, [addToast]);
  const updateStudent = useCallback((id, updates) => setStore((s) => ({...s, students: s.students.map((st) => st.id===id ? {...st,...updates} : st)})), []);
  const deleteStudent = useCallback((id) => setStore((s) => ({...s, students:s.students.filter(st=>st.id!==id), lessons:s.lessons.filter(l=>l.studentId!==id), payments:s.payments.filter(p=>p.studentId!==id), messages:s.messages.filter(m=>m.parentId!==id)})), []);
  const getStudent = useCallback((id) => store.students.find((s) => s.id===id), [store.students]);

  // ── Fee calculator (respects excludeFromBilling + billing mode) ──
  const calcMonthlyFee = useCallback((studentId, monthStr) => {
    const s = store.students.find(st => st.id===studentId);
    if (!s) return {sessions:0, rate:0, totalHours:0, total:0};
    const [y,mo] = monthStr.split("-").map(Number);
    const lessons = store.lessons.filter((l) => {
      const d = new Date(l.date);
      return l.studentId===studentId && d.getFullYear()===y && d.getMonth()===mo-1 && l.status!=="cancelled" && !l.excludeFromBilling;
    });
    const totalMinutes = lessons.reduce((sum,l) => sum+l.duration, 0);
    const totalHours = totalMinutes/60;
    const total = Math.round(s.hourlyRate * totalHours * 100) / 100;
    return {sessions:lessons.length, rate:s.hourlyRate, totalHours, total};
  }, [store.students, store.lessons]);

  // ── Derived data ─────────────────────────────────────────
  const todayLessons = useMemo(() => {
    return store.lessons.filter((l) => {
      const d = new Date(l.date);
      return d.getDate()===now.getDate() && d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear() && l.status!=="cancelled";
    }).sort((a,b) => new Date(a.date)-new Date(b.date));
  }, [store.lessons, now]);

  const upcomingLessons = useMemo(() => {
    return store.lessons.filter((l) => {
      const d = new Date(l.date);
      const end = new Date(d.getTime() + l.duration*60000);
      return end>now && l.status!=="completed" && l.status!=="cancelled";
    }).sort((a,b) => new Date(a.date)-new Date(b.date)).slice(0,8);
  }, [store.lessons, now]);

  const tomorrowLessons = useMemo(() => {
    const tom = new Date(now); tom.setDate(tom.getDate()+1);
    return store.lessons.filter((l) => {
      const d = new Date(l.date);
      return d.getDate()===tom.getDate() && d.getMonth()===tom.getMonth() && d.getFullYear()===tom.getFullYear() && l.status!=="cancelled";
    }).sort((a,b) => new Date(a.date)-new Date(b.date));
  }, [store.lessons, now]);

  const activeStudents = useMemo(() => store.students.filter((s) => s.status==="active"), [store.students]);

  const currentMonthStr = useMemo(() => now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0"), [now]);

  const pendingPayments = useMemo(() => {
    const activeIds = store.students.filter(s=>s.status==="active"||s.status==="trial").map(s=>s.id);
    const studentsWithLessons = new Set();
    store.lessons.forEach(l => {
      const d = new Date(l.date);
      const lm = d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
      if (lm===currentMonthStr && l.status!=="cancelled" && activeIds.includes(l.studentId)) studentsWithLessons.add(l.studentId);
    });
    const paidStudents = new Set(store.payments.filter(p=>p.month===currentMonthStr&&p.status==="paid").map(p=>p.studentId));
    return Array.from(studentsWithLessons).filter(sid=>!paidStudents.has(sid));
  }, [store.students, store.lessons, store.payments, currentMonthStr]);

  const overduePayments = useMemo(() => {
    return store.payments.filter(p => p.status==="overdue");
  }, [store.payments]);

  const monthlyRevenue = useMemo(() => {
    return store.students.filter(s=>s.status==="active").reduce((sum,s) => sum+calcMonthlyFee(s.id, currentMonthStr).total, 0);
  }, [store.students, calcMonthlyFee, currentMonthStr]);

  const unreadNotifs = useMemo(() => store.notifications.filter(n=>!n.read).length, [store.notifications]);

  // ── Helpers ──────────────────────────────────────────────
  const formatPhoneForWA = (phone) => {
    let d = phone.replace(/[^0-9]/g,"");
    if (d.length===8 && /^[689]/.test(d)) d="65"+d;
    if (d.startsWith("0")) d="65"+d.substring(1);
    return d;
  };
  const openWhatsApp = (phone, message) => window.open("https://wa.me/"+formatPhoneForWA(phone)+"?text="+encodeURIComponent(message),"_blank");

  // ── AI call ───────────────────────────────────────────────
  const callAI = useCallback(async (prompt, systemPrompt) => {
    const sys = systemPrompt || `You are TutorPulse AI, an assistant for Teacher ${store.settings?.tutorName||"Leon"} who runs a Chinese language tutoring business in Singapore. Current data: ${activeStudents.length} active students, ${pendingPayments.length} pending payments, monthly revenue $${monthlyRevenue}. Students: ${store.students.map(s=>s.name+" ("+s.level+" "+s.stream+")").join(", ")}. Respond concisely. Do NOT use markdown formatting — no asterisks, no bold, no headers. Plain text only.`;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:sys,messages:[{role:"user",content:prompt}]})
    });
    const data = await response.json();
    return (data.content||[]).filter(c=>c.type==="text").map(c=>c.text).join("\n");
  }, [store.settings, activeStudents.length, pendingPayments.length, monthlyRevenue, store.students]);

  // ── Translate ─────────────────────────────────────────────
  const translateMessage = useCallback(async (text, targetLang, setFn, setLoading) => {
    setLoading(true);
    try {
      const result = await callAI(`Translate the following message to ${targetLang}. Keep the same tone and structure. Return only the translated text, no explanation:\n\n${text}`);
      setFn(stripMarkdown(result));
    } catch { addToast("Translation failed","error"); }
    setLoading(false);
  }, [callAI, addToast]);

  // ═══════════════════════════════════════════════════════
  // PAGE: HOME
  // ═══════════════════════════════════════════════════════
  const HomePage = useCallback(() => (
    <div className="fade-in">
      <div style={{marginBottom:28}}>
        <div style={{fontSize:13,color:theme.textMuted,fontWeight:500,marginBottom:4}}>
          {now.toLocaleDateString("en-SG",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
        </div>
        <h1 style={{fontSize:28,fontWeight:700,fontFamily:"'Playfair Display',serif",lineHeight:1.2}}>
          Hi, {store.settings?.tutorName||"there"} 👋
        </h1>
      </div>

      {/* Stats */}
      <div style={{display:"flex",gap:12,marginBottom:24,overflowX:"auto",paddingBottom:4}}>
        <div onClick={()=>setPage("students")} style={{flex:1,minWidth:150,cursor:"pointer"}}>
          <StatCard icon="users" label="Active Students" value={activeStudents.length} sub={`${store.students.filter(s=>s.status==="trial").length} on trial`}/>
        </div>
        <div onClick={()=>setPage("schedule")} style={{flex:1,minWidth:150,cursor:"pointer"}}>
          <StatCard icon="calendar" label="Today" value={todayLessons.length} sub={`${tomorrowLessons.length} tomorrow`} color={theme.info}/>
        </div>
        <div onClick={()=>setPage("payments")} style={{flex:1,minWidth:150,cursor:"pointer"}}>
          <StatCard icon="dollar" label="This Month" value={`$${monthlyRevenue.toLocaleString()}`} sub={`${pendingPayments.length} unpaid`} color={theme.success}/>
        </div>
      </div>

      {/* Overdue alert */}
      {overduePayments.length>0&&(
        <Card style={{padding:14,borderColor:`${theme.danger}44`,background:theme.dangerBg,marginBottom:16}} theme={theme}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Icon name="bell" size={18} color={theme.danger}/>
            <div>
              <div style={{fontWeight:600,fontSize:14,color:theme.danger}}>Overdue Payments</div>
              <div style={{fontSize:12,color:theme.textSecondary,marginTop:2}}>
                {overduePayments.map(p=>getStudent(p.studentId)?.name).filter(Boolean).join(", ")} — fees overdue
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Today's Schedule */}
      <div style={{marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <h2 style={{fontSize:18,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>Today's Schedule</h2>
          <Button variant="ghost" size="sm" onClick={()=>setPage("schedule")}>View all →</Button>
        </div>
        {todayLessons.length===0
          ? <Card theme={theme}><EmptyState icon="calendar" title="No lessons today" sub="Enjoy your day off!"/></Card>
          : <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {todayLessons.map((lesson,i)=>{
                const student=getStudent(lesson.studentId);
                return (
                  <Card key={lesson.id} hover onClick={()=>{setSelectedLesson(lesson);setEditingLesson(false);}} style={{padding:16}} className={`slide-up stagger-${i+1}`} theme={theme}>
                    <div style={{display:"flex",alignItems:"center",gap:14}}>
                      <div style={{width:4,height:48,borderRadius:2,background:getStatusColor(lesson.status,theme),flexShrink:0}}/>
                      <Avatar initials={student?student.avatar:"?"} size={36} color={getStatusColor(lesson.status,theme)}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:600,fontSize:14,marginBottom:2}}>{student?student.name:"Unknown"}</div>
                        <div style={{fontSize:12,color:theme.textSecondary}}>{lesson.subject}</div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontWeight:600,fontSize:14,color:theme.accent}}>{formatTime(lesson.date)}</div>
                        <div style={{fontSize:11,color:theme.textMuted}}>{lesson.duration} min · {lesson.location}</div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
        }
      </div>

      {/* Tomorrow preview */}
      {tomorrowLessons.length>0&&(
        <div style={{marginBottom:24}}>
          <h2 style={{fontSize:16,fontWeight:700,fontFamily:"'Playfair Display',serif",marginBottom:10,color:theme.textSecondary}}>Tomorrow</h2>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {tomorrowLessons.map((lesson)=>{
              const student=getStudent(lesson.studentId);
              return (
                <Card key={lesson.id} style={{padding:12,background:theme.bgElevated}} theme={theme}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <Avatar initials={student?student.avatar:"?"} size={28} color={theme.textMuted}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600}}>{student?student.name:"Unknown"}</div>
                      <div style={{fontSize:11,color:theme.textMuted}}>{formatTime(lesson.date)} · {lesson.duration} min</div>
                    </div>
                    <Badge text={lesson.status} color={getStatusColor(lesson.status,theme)} bg={getStatusBg(lesson.status,theme)}/>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:18,fontWeight:700,fontFamily:"'Playfair Display',serif",marginBottom:12}}>Quick Actions</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Card hover onClick={()=>setShowNewLesson(true)} style={{padding:16,textAlign:"center"}} theme={theme}><Icon name="plus" size={24} color={theme.accent}/><div style={{fontSize:13,fontWeight:600,marginTop:6}}>New Lesson</div></Card>
          <Card hover onClick={()=>setShowNewStudent(true)} style={{padding:16,textAlign:"center"}} theme={theme}><Icon name="users" size={24} color={theme.info}/><div style={{fontSize:13,fontWeight:600,marginTop:6}}>Add Student</div></Card>
          <Card hover onClick={()=>setShowAI(true)} style={{padding:16,textAlign:"center"}} theme={theme}><Icon name="ai" size={24} color={theme.purple}/><div style={{fontSize:13,fontWeight:600,marginTop:6}}>AI Assistant<PremiumBadge/></div></Card>
          <Card hover onClick={()=>setShowMessageCompose("bulk")} style={{padding:16,textAlign:"center"}} theme={theme}><Icon name="send" size={24} color={theme.success}/><div style={{fontSize:13,fontWeight:600,marginTop:6}}>Fee Reminder</div></Card>
        </div>
      </div>
    </div>
  ), [store, now, theme, activeStudents, todayLessons, tomorrowLessons, monthlyRevenue, pendingPayments, overduePayments, getStudent]);

  // ═══════════════════════════════════════════════════════
  // PAGE: SCHEDULE
  // ═══════════════════════════════════════════════════════
  const SchedulePage = useCallback(() => {
    const year=calendarDate.getFullYear(), month=calendarDate.getMonth();
    const daysInMonth=new Date(year,month+1,0).getDate();
    const firstDay=new Date(year,month,1).getDay();
    const calendarDays=[];
    for(let i=0;i<firstDay;i++) calendarDays.push(null);
    for(let i=1;i<=daysInMonth;i++) calendarDays.push(i);

    const getLessonsForDay=(day)=>{
      if(!day) return [];
      return store.lessons.filter(l=>{const d=new Date(l.date);return d.getDate()===day&&d.getMonth()===month&&d.getFullYear()===year;}).sort((a,b)=>new Date(a.date)-new Date(b.date));
    };

    const monthLessons=store.lessons.filter(l=>{const d=new Date(l.date);return d.getMonth()===month&&d.getFullYear()===year;}).sort((a,b)=>new Date(a.date)-new Date(b.date));
    const todayAllLessons=store.lessons.filter(l=>{const d=new Date(l.date);return d.getDate()===now.getDate()&&d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).sort((a,b)=>new Date(a.date)-new Date(b.date));
    const selectedDayLessons=selectedCalendarDay?getLessonsForDay(selectedCalendarDay):[];

    const renderLessonCard=(lesson)=>{
      const student=getStudent(lesson.studentId);
      return (
        <Card key={lesson.id} hover onClick={()=>{setSelectedLesson(lesson);setEditingLesson(false);}} style={{padding:14}} theme={theme}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{minWidth:54,textAlign:"center"}}>
              <div style={{fontSize:11,color:theme.textMuted,fontWeight:500}}>{formatDate(lesson.date).split(",")[0]}</div>
              <div style={{fontSize:18,fontWeight:700,color:theme.accent}}>{new Date(lesson.date).getDate()}</div>
            </div>
            <div style={{width:1,height:40,background:theme.border}}/>
            <Avatar initials={student?student.avatar:"?"} size={32}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:13}}>{student?student.name:"Unknown"}</div>
              <div style={{fontSize:12,color:theme.textSecondary}}>{lesson.subject}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:13,fontWeight:600}}>{formatTime(lesson.date)}</div>
              <Badge text={lesson.status} color={getStatusColor(lesson.status,theme)} bg={getStatusBg(lesson.status,theme)}/>
            </div>
          </div>
        </Card>
      );
    };

    return (
      <div className="fade-in">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <h1 style={{fontSize:24,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>Schedule</h1>
          <Button size="sm" icon="plus" onClick={()=>setShowNewLesson(true)}>New Lesson</Button>
        </div>
        <TabBar tabs={[{id:"today",label:"Today"},{id:"month",label:"This Month"},{id:"calendar",label:"Calendar"}]} active={scheduleTab} onChange={setScheduleTab}/>

        {scheduleTab==="today"&&(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {todayAllLessons.length===0?<EmptyState icon="calendar" title="No lessons today" sub="Enjoy your day off!"/>:todayAllLessons.map(renderLessonCard)}
          </div>
        )}
        {scheduleTab==="month"&&(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {monthLessons.length===0?<EmptyState icon="calendar" title="No lessons this month" sub="Schedule a lesson to get started"/>:monthLessons.map(renderLessonCard)}
          </div>
        )}
        {scheduleTab==="calendar"&&(
          <>
            <Card theme={theme}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:16}}>
                <select value={month} onChange={(e)=>{setCalendarDate(new Date(year,parseInt(e.target.value),1));setSelectedCalendarDay(null);}} style={{padding:"6px 10px",background:theme.bgInput,border:"1px solid "+theme.border,borderRadius:8,color:theme.text,fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",appearance:"none",textAlign:"center"}}>
                  {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((mm,i)=><option key={i} value={i}>{mm}</option>)}
                </select>
                <select value={year} onChange={(e)=>{setCalendarDate(new Date(parseInt(e.target.value),month,1));setSelectedCalendarDay(null);}} style={{padding:"6px 10px",background:theme.bgInput,border:"1px solid "+theme.border,borderRadius:8,color:theme.text,fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",appearance:"none",textAlign:"center"}}>
                  {[2025,2026,2027,2028,2029,2030].map((yy)=><option key={yy} value={yy}>{yy}</option>)}
                </select>
                <button onClick={()=>{setCalendarDate(new Date());setSelectedCalendarDay(null);}} style={{padding:"6px 10px",background:theme.accentBg,border:"1px solid "+theme.accent+"44",borderRadius:8,color:theme.accent,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Today</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,textAlign:"center"}}>
                {["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{fontSize:11,fontWeight:600,color:theme.textMuted,padding:"8px 0"}}>{d}</div>)}
                {calendarDays.map((day,i)=>{
                  const lessons=getLessonsForDay(day);
                  const isToday=day&&day===now.getDate()&&month===now.getMonth()&&year===now.getFullYear();
                  const isSel=day&&day===selectedCalendarDay;
                  // Status-coloured dots, one per lesson (no cap)
                  const statusDots=lessons.map(l=>getStatusColor(l.status,theme));
                  return (
                    <div key={i} onClick={()=>{if(day) setSelectedCalendarDay(selectedCalendarDay===day?null:day);}} style={{padding:"4px 2px",minHeight:52,borderRadius:8,background:isSel?theme.accent+"22":isToday?theme.accentBg:"transparent",border:isSel?"1px solid "+theme.accent:isToday?"1px solid "+theme.accent+"44":"1px solid transparent",cursor:day?"pointer":"default"}}>
                      {day&&(
                        <>
                          <div style={{fontSize:13,fontWeight:isToday||isSel?700:400,color:isSel?theme.accent:isToday?theme.accent:theme.text,marginBottom:2}}>{day}</div>
                          {statusDots.length>0&&(
                            <div style={{display:"flex",gap:2,justifyContent:"center",flexWrap:"wrap",padding:"0 2px"}}>
                              {statusDots.map((color,j)=><div key={j} style={{width:6,height:6,borderRadius:3,background:color,flexShrink:0}}/>)}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
            {selectedCalendarDay&&(
              <div style={{marginTop:12}}>
                <div style={{fontSize:13,fontWeight:600,color:theme.textSecondary,marginBottom:8}}>
                  {new Date(year,month,selectedCalendarDay).toLocaleDateString("en-SG",{weekday:"long",day:"numeric",month:"long"})} — {selectedDayLessons.length} lesson{selectedDayLessons.length!==1?"s":""}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {selectedDayLessons.length===0
                    ?<Card style={{padding:14}} theme={theme}><div style={{fontSize:13,color:theme.textMuted,textAlign:"center"}}>No lessons on this day</div></Card>
                    :selectedDayLessons.map(renderLessonCard)
                  }
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }, [store.lessons, now, theme, calendarDate, scheduleTab, selectedCalendarDay, getStudent]);

  // ═══════════════════════════════════════════════════════
  // PAGE: STUDENTS
  // ═══════════════════════════════════════════════════════
  const StudentsPage = useCallback(() => {
    const [filter, setFilter] = useState("all");
    const [localSearch, setLocalSearch] = useState("");
    const filtered=filter==="all"?store.students:store.students.filter(s=>s.status===filter);
    const searched=(localSearch?filtered.filter(s=>s.name.toLowerCase().includes(localSearch.toLowerCase())||s.level.toLowerCase().includes(localSearch.toLowerCase())):filtered).sort((a,b)=>a.name.localeCompare(b.name));

    return (
      <div className="fade-in">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <h1 style={{fontSize:24,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>Students</h1>
          <Button size="sm" icon="plus" onClick={()=>setShowNewStudent(true)}>Add</Button>
        </div>
        <div style={{position:"relative",marginBottom:16}}>
          <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}><Icon name="search" size={16} color={theme.textMuted}/></div>
          <input value={localSearch} onChange={(e)=>setLocalSearch(e.target.value)} placeholder="Search students..." style={{width:"100%",padding:"10px 14px 10px 36px",background:theme.bgInput,border:`1px solid ${theme.border}`,borderRadius:10,color:theme.text,outline:"none",fontSize:14}}/>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto"}}>
          {["all","active","trial","paused","graduated"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${filter===f?theme.accent:theme.border}`,background:filter===f?theme.accentBg:"transparent",color:filter===f?theme.accent:theme.textSecondary,fontSize:12,fontWeight:600,cursor:"pointer",textTransform:"capitalize",whiteSpace:"nowrap",fontFamily:"'DM Sans',sans-serif"}}>
              {f} ({f==="all"?store.students.length:store.students.filter(s=>s.status===f).length})
            </button>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {searched.map(student=>(
            <Card key={student.id} hover onClick={()=>{setSelectedStudent(student);setEditingStudent(false);}} style={{padding:14}} theme={theme}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <Avatar initials={student.avatar} size={40} color={getStatusColor(student.status,theme)}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2,flexWrap:"wrap"}}>
                    <span style={{fontWeight:600,fontSize:14}}>{student.name}</span>
                    <Badge text={student.status} color={getStatusColor(student.status,theme)} bg={getStatusBg(student.status,theme)}/>
                    {student.billingMode==="per-lesson"&&<Badge text="Per Lesson" color={theme.purple} bg={theme.purpleBg}/>}
                  </div>
                  <div style={{fontSize:12,color:theme.textSecondary}}>{student.level} · {student.stream}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:700,color:theme.accent}}>${student.hourlyRate}</div>
                  <div style={{fontSize:11,color:theme.textMuted}}>/ hr</div>
                </div>
              </div>
            </Card>
          ))}
          {searched.length===0&&<EmptyState icon="users" title="No students found" sub="Try a different search or filter"/>}
        </div>
      </div>
    );
  }, [store.students, theme]);

  // ═══════════════════════════════════════════════════════
  // PAGE: PAYMENTS
  // ═══════════════════════════════════════════════════════
  const PaymentsPage = useCallback(() => {
    const [monthView, setMonthView] = useState(currentMonthStr);
    const quickMonths=useMemo(()=>{
      const arr=[];
      for(let i=-1;i<=1;i++){
        const d=new Date(now.getFullYear(),now.getMonth()+i,1);
        arr.push(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"));
      }
      return arr;
    },[]);

    const monthPayments=useMemo(()=>{
      const activeIds=store.students.filter(s=>s.status==="active"||s.status==="trial").map(s=>s.id);
      const studentsWithLessons=new Set();
      store.lessons.forEach(l=>{
        const d=new Date(l.date);
        const lm=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
        if(lm===monthView&&l.status!=="cancelled"&&activeIds.includes(l.studentId)) studentsWithLessons.add(l.studentId);
      });
      store.payments.filter(p=>p.month===monthView).forEach(p=>studentsWithLessons.add(p.studentId));
      return Array.from(studentsWithLessons).map(sid=>{
        const existing=store.payments.find(p=>p.studentId===sid&&p.month===monthView);
        const calc=calcMonthlyFee(sid,monthView);
        const student=getStudent(sid);
        const billingMode=student?.billingMode||"monthly";
        if(existing) return {...existing,amount:calc.total,sessions:calc.sessions,rate:calc.rate,totalHours:calc.totalHours,billingMode};
        return {id:"auto-"+sid+"-"+monthView,studentId:sid,month:monthView,amount:calc.total,sessions:calc.sessions,rate:calc.rate,totalHours:calc.totalHours,status:"pending",paidDate:null,method:null,billingMode};
      });
    },[monthView, store.students, store.lessons, store.payments, calcMonthlyFee, getStudent]);

    const filtered=paymentFilter==="all"?monthPayments:monthPayments.filter(p=>p.status===paymentFilter);
    const totalDue=monthPayments.reduce((s,p)=>s+p.amount,0);
    const totalPaid=monthPayments.filter(p=>p.status==="paid").reduce((s,p)=>s+p.amount,0);
    const totalPending=monthPayments.filter(p=>p.status!=="paid").reduce((s,p)=>s+p.amount,0);

    const markPaid=(payment)=>{
      const existing=store.payments.find(p=>p.studentId===payment.studentId&&p.month===payment.month);
      if(existing) updatePayment(existing.id,{status:"paid",paidDate:now.toISOString().split("T")[0],method:"PayNow"});
      else setStore(s=>({...s,payments:[...s.payments,{id:"p"+genId(),studentId:payment.studentId,month:payment.month,amount:payment.amount,status:"paid",paidDate:now.toISOString().split("T")[0],method:"PayNow"}]}));
      addToast("Payment marked as paid");
    };
    const markUnpaid=(payment)=>{
      const existing=store.payments.find(p=>p.studentId===payment.studentId&&p.month===payment.month);
      if(existing) updatePayment(existing.id,{status:"pending",paidDate:null,method:null});
      addToast("Reverted to pending");
    };

    return (
      <div className="fade-in">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <h1 style={{fontSize:24,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>Fee Collection</h1>
        </div>
        {/* Month selector */}
        <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
          {quickMonths.map(m=>(
            <button key={m} onClick={()=>setMonthView(m)} style={{padding:"8px 16px",borderRadius:10,border:"1px solid "+(monthView===m?theme.accent:theme.border),background:monthView===m?theme.accentBg:"transparent",color:monthView===m?theme.accent:theme.textSecondary,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>
              {formatMonth(m)}
            </button>
          ))}
          <div style={{display:"flex",gap:4}}>
            <select value={monthView.split("-")[1]||""} onChange={e=>{if(e.target.value){setMonthView(monthView.split("-")[0]+"-"+e.target.value);}}} style={{padding:"6px 8px",borderRadius:8,border:"1px solid "+theme.border,background:theme.bgInput,color:theme.text,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",appearance:"none"}}>
              {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m,i)=><option key={m} value={m}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i]}</option>)}
            </select>
            <select value={monthView.split("-")[0]||""} onChange={e=>{if(e.target.value){setMonthView(e.target.value+"-"+monthView.split("-")[1]);}}} style={{padding:"6px 8px",borderRadius:8,border:"1px solid "+theme.border,background:theme.bgInput,color:theme.text,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",appearance:"none"}}>
              {[2025,2026,2027,2028,2029,2030].map(yy=><option key={yy} value={String(yy)}>{yy}</option>)}
            </select>
          </div>
        </div>
        {/* Summary */}
        <Card style={{marginBottom:16,padding:16}} theme={theme}>
          <div style={{display:"flex",justifyContent:"space-around",textAlign:"center"}}>
            <div><div style={{fontSize:11,color:theme.textMuted,fontWeight:600,marginBottom:2}}>TOTAL</div><div style={{fontSize:20,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>${totalDue.toLocaleString()}</div></div>
            <div style={{width:1,background:theme.border}}/>
            <div><div style={{fontSize:11,color:theme.success,fontWeight:600,marginBottom:2}}>COLLECTED</div><div style={{fontSize:20,fontWeight:700,color:theme.success}}>${totalPaid.toLocaleString()}</div></div>
            <div style={{width:1,background:theme.border}}/>
            <div><div style={{fontSize:11,color:theme.warning,fontWeight:600,marginBottom:2}}>PENDING</div><div style={{fontSize:20,fontWeight:700,color:theme.warning}}>${totalPending.toLocaleString()}</div></div>
          </div>
          <div style={{marginTop:12,height:6,background:theme.bgInput,borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",width:totalDue>0?`${(totalPaid/totalDue)*100}%`:"0%",background:`linear-gradient(90deg,${theme.success},${theme.accentLight})`,borderRadius:3,transition:"width 0.5s ease"}}/>
          </div>
        </Card>
        {/* Filter */}
        <div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto"}}>
          {["all","paid","pending","overdue"].map(f=>(
            <button key={f} onClick={()=>setPaymentFilter(f)} style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${paymentFilter===f?theme.accent:theme.border}`,background:paymentFilter===f?theme.accentBg:"transparent",color:paymentFilter===f?theme.accent:theme.textSecondary,fontSize:12,fontWeight:600,cursor:"pointer",textTransform:"capitalize",fontFamily:"'DM Sans',sans-serif"}}>
              {f}
            </button>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {filtered.map(payment=>{
            const student=getStudent(payment.studentId);
            return (
              <Card key={payment.id||payment.studentId+payment.month} style={{padding:14}} theme={theme}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <Avatar initials={student?student.avatar:"?"} size={36} color={getStatusColor(payment.status,theme)}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:14,marginBottom:2}}>{student?student.name:"Unknown"}</div>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      <Badge text={payment.status} color={getStatusColor(payment.status,theme)} bg={getStatusBg(payment.status,theme)}/>
                      {payment.billingMode==="per-lesson"&&<Badge text="Per Lesson" color={theme.purple} bg={theme.purpleBg}/>}
                      <span style={{fontSize:11,color:theme.textMuted}}>{payment.sessions} sessions · {payment.totalHours}h × ${payment.rate}/hr</span>
                      {payment.paidDate&&<span style={{fontSize:11,color:theme.textMuted}}>· Paid {payment.paidDate}</span>}
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontWeight:700,fontSize:16}}>${payment.amount.toFixed(2)}</div>
                    <div style={{display:"flex",gap:4,marginTop:4}}>
                      {payment.status!=="paid"?(
                        <>
                          <button onClick={()=>markPaid(payment)} style={{padding:"4px 10px",borderRadius:6,border:"none",background:theme.successBg,color:theme.success,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Mark Paid</button>
                          <button onClick={()=>setShowMessageCompose(payment.studentId)} style={{padding:"4px 8px",borderRadius:6,border:"none",background:"rgba(37,211,102,0.1)",color:"#25D366",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>
                            <WAIcon size={12}/><span style={{fontSize:10,fontWeight:600}}>WA</span>
                          </button>
                        </>
                      ):(
                        <button onClick={()=>markUnpaid(payment)} style={{padding:"4px 10px",borderRadius:6,border:"none",background:theme.bgElevated,color:theme.textMuted,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Undo</button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          {filtered.length===0&&<EmptyState icon="dollar" title="No fees for this period" sub="Schedule lessons to see fee entries"/>}
        </div>
      </div>
    );
  }, [store, now, theme, currentMonthStr, paymentFilter, getStudent, calcMonthlyFee, updatePayment, addToast]);

  // ═══════════════════════════════════════════════════════
  // PAGE: MESSAGES
  // ═══════════════════════════════════════════════════════
  const MessagesPage = useCallback(() => {
    const [selectedParent, setSelectedParent] = useState(null);
    const [newMsg, setNewMsg] = useState("");

    const parentThreads=useMemo(()=>{
      const t={};
      store.messages.forEach(m=>{if(!t[m.parentId])t[m.parentId]=[];t[m.parentId].push(m);});
      return t;
    },[store.messages]);

    const sendMsg=()=>{
      if(!newMsg.trim()) return;
      setStore(s=>({...s,messages:[...s.messages,{id:"m"+genId(),parentId:selectedParent,direction:"out",text:newMsg,date:new Date().toISOString(),read:true}]}));
      setNewMsg("");
      addToast("Message logged");
    };

    return (
      <div className="fade-in">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <h1 style={{fontSize:24,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>Messages</h1>
          <Button size="sm" icon="send" onClick={()=>setShowMessageCompose("bulk")}>Compose</Button>
        </div>
        {selectedParent?(
          <div>
            <button onClick={()=>setSelectedParent(null)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:theme.textSecondary,cursor:"pointer",marginBottom:16,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>
              <Icon name="arrowLeft" size={16}/> Back to threads
            </button>
            <Card style={{marginBottom:12}} theme={theme}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <Avatar initials={getStudent(selectedParent)?.avatar||"?"} size={36}/>
                <div>
                  <div style={{fontWeight:600,fontSize:14}}>{getStudent(selectedParent)?.parent}</div>
                  <div style={{fontSize:12,color:theme.textSecondary}}>{getStudent(selectedParent)?.parentPhone}</div>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10,maxHeight:300,overflow:"auto",marginBottom:16}}>
                {(parentThreads[selectedParent]||[]).map(msg=>(
                  <div key={msg.id} style={{display:"flex",justifyContent:msg.direction==="out"?"flex-end":"flex-start"}}>
                    <div style={{maxWidth:"80%",padding:"10px 14px",borderRadius:msg.direction==="out"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:msg.direction==="out"?theme.accentBg:theme.bgElevated,border:`1px solid ${msg.direction==="out"?theme.accent+"44":theme.border}`,fontSize:13}}>
                      {msg.text}
                      <div style={{fontSize:10,color:theme.textMuted,marginTop:4,textAlign:"right"}}>{formatTime(msg.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:8}}>
                <input value={newMsg} onChange={e=>setNewMsg(e.target.value)} placeholder="Type a message..." style={{flex:1,padding:"10px 14px",background:theme.bgInput,border:`1px solid ${theme.border}`,borderRadius:10,color:theme.text,outline:"none",fontSize:13}} onKeyDown={e=>{if(e.key==="Enter") sendMsg();}}/>
                <Button size="sm" icon="send" onClick={sendMsg}>Log</Button>
                <button onClick={()=>{
                  const st=getStudent(selectedParent);
                  if(st&&newMsg.trim()){
                    setStore(s=>({...s,messages:[...s.messages,{id:"m"+genId(),parentId:selectedParent,direction:"out",text:newMsg,date:new Date().toISOString(),read:true}]}));
                    openWhatsApp(st.parentPhone,newMsg);
                    setNewMsg("");
                  }
                }} style={{padding:"6px 12px",borderRadius:10,border:"none",background:"#25D366",color:"white",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:12,whiteSpace:"nowrap"}}>
                  <WAIcon size={14}/> WA
                </button>
              </div>
            </Card>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {Object.entries(parentThreads).map(([parentId,msgs])=>{
              const student=getStudent(parentId);
              const lastMsg=msgs[msgs.length-1];
              return (
                <Card key={parentId} hover onClick={()=>setSelectedParent(parentId)} style={{padding:14}} theme={theme}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <Avatar initials={student?student.avatar:"?"} size={40}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:14,marginBottom:2}}>{student?student.parent:"Unknown"}</div>
                      <div style={{fontSize:12,color:theme.textSecondary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {lastMsg.direction==="out"?"You: ":""}{lastMsg.text.substring(0,60)}...
                      </div>
                    </div>
                    <div style={{fontSize:11,color:theme.textMuted}}>{lastMsg.date.split("T")[0]}</div>
                  </div>
                </Card>
              );
            })}
            {Object.keys(parentThreads).length===0&&<EmptyState icon="message" title="No messages yet" sub="Compose a message to get started"/>}
          </div>
        )}
      </div>
    );
  }, [store.messages, store.students, theme, getStudent, openWhatsApp, addToast]);

  // ═══════════════════════════════════════════════════════
  // PAGE: ADMIN
  // ═══════════════════════════════════════════════════════
  const AdminPage = useCallback(() => {
    const toggles=store.analyticsToggles||{};
    const setToggle=(key)=>setStore(s=>({...s,analyticsToggles:{...(s.analyticsToggles||{}), [key]:!(s.analyticsToggles||{})[key]}}));

    const totalMonthly=store.students.filter(s=>s.status==="active").reduce((sum,s)=>sum+calcMonthlyFee(s.id,currentMonthStr).total,0);
    const avgFee=activeStudents.length>0?Math.round(totalMonthly/activeStudents.length):0;
    const completionRate=store.lessons.length>0?Math.round(store.lessons.filter(l=>l.status==="confirmed"||l.status==="completed").length/store.lessons.length*100):0;
    const lastMonthStr=now.getMonth()===0?(now.getFullYear()-1)+"-12":now.getFullYear()+"-"+String(now.getMonth()).padStart(2,"0");
    const lastMonthPayments=store.payments.filter(p=>p.month===lastMonthStr);
    const collectionRate=lastMonthPayments.length>0?Math.round(lastMonthPayments.filter(p=>p.status==="paid").length/lastMonthPayments.length*100):0;

    // Per-student lessons this month
    const lessonPerStudent=activeStudents.map(s=>({name:s.name,count:store.lessons.filter(l=>{const d=new Date(l.date);return l.studentId===s.id&&d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()&&l.status!=="cancelled";}).length}));
    // Attendance (completed / (completed+cancelled))
    const totalLessons=store.lessons.filter(l=>l.status==="completed"||l.status==="cancelled").length;
    const attendanceRate=totalLessons>0?Math.round(store.lessons.filter(l=>l.status==="completed").length/totalLessons*100):0;
    // Revenue per stream
    const revenuePerStream={};
    store.students.filter(s=>s.status==="active").forEach(s=>{
      if(!revenuePerStream[s.stream]) revenuePerStream[s.stream]=0;
      revenuePerStream[s.stream]+=calcMonthlyFee(s.id,currentMonthStr).total;
    });
    // Avg duration
    const avgDuration=store.lessons.length>0?Math.round(store.lessons.reduce((sum,l)=>sum+l.duration,0)/store.lessons.length):0;
    // Payment turnaround (days between lesson month start and paid date)
    const paidWithDate=store.payments.filter(p=>p.status==="paid"&&p.paidDate&&p.month);
    const avgTurnaround=paidWithDate.length>0?Math.round(paidWithDate.reduce((sum,p)=>{
      const monthStart=new Date(p.month+"-01");
      const paid=new Date(p.paidDate);
      return sum+(paid-monthStart)/(1000*60*60*24);
    },0)/paidWithDate.length):0;

    const revenueData=useMemo(()=>{
      const data=[];
      const hist=store.revenueHistory||[];
      for(let i=5;i>=1;i--){
        const d=new Date(now.getFullYear(),now.getMonth()-i,1);
        const key=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
        const label=d.toLocaleDateString("en-SG",{month:"short"});
        const entry=hist.find(h=>h.month===key);
        data.push({month:label,amount:entry?entry.amount:0});
      }
      data.push({month:now.toLocaleDateString("en-SG",{month:"short"}),amount:totalMonthly});
      return data;
    },[store.revenueHistory,totalMonthly,now]);
    const maxRevenue=Math.max(...revenueData.map(d=>d.amount),1);

    return (
      <div className="fade-in">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <h1 style={{fontSize:24,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>Admin Console</h1>
        </div>
        <TabBar tabs={[{id:"overview",label:"Overview"},{id:"analytics",label:"Analytics"},{id:"manage",label:"Manage"}]} active={adminTab} onChange={setAdminTab}/>

        {adminTab==="overview"&&(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              <StatCard icon="dollar" label={now.toLocaleDateString("en-SG",{month:"short"})+" Revenue"} value={`$${totalMonthly.toLocaleString()}`} color={theme.success} description="Total fees from all active students this month"/>
              <StatCard icon="users" label="Avg per Student" value={`$${avgFee}`} color={theme.info} description="Average monthly fee per active student"/>
              <StatCard icon="check" label="Schedule Rate" value={`${completionRate}%`} color={theme.accent} description="Lessons confirmed or completed vs total scheduled"/>
              <StatCard icon="dollar" label="Collection Rate" value={`${collectionRate}%`} sub="Last month" color={theme.purple} description="Percentage of last month's invoices that were paid"/>
            </div>
            <Card style={{marginBottom:16}} theme={theme}>
              <h3 style={{fontSize:15,fontWeight:700,marginBottom:16,fontFamily:"'Playfair Display',serif"}}>Revenue Trend</h3>
              <div style={{display:"flex",alignItems:"flex-end",gap:8,height:140,paddingBottom:24,position:"relative"}}>
                {revenueData.map((d,i)=>(
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <div style={{fontSize:10,color:theme.textMuted,fontWeight:600}}>${(d.amount/1000).toFixed(1)}k</div>
                    <div style={{width:"100%",borderRadius:6,background:i===revenueData.length-1?`linear-gradient(180deg,${theme.accent},${theme.accentDark})`:theme.bgElevated,height:`${(d.amount/maxRevenue)*100}px`,transition:"height 0.5s ease",minHeight:4}}/>
                    <div style={{fontSize:11,color:theme.textSecondary,fontWeight:500}}>{d.month}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card theme={theme}>
              <h3 style={{fontSize:15,fontWeight:700,marginBottom:12,fontFamily:"'Playfair Display',serif"}}>Students by Stream</h3>
              {(()=>{
                const colors=[theme.accent,theme.info,theme.purple,theme.success,theme.warning,theme.danger];
                const streams={};
                store.students.forEach(s=>{streams[s.stream]=(streams[s.stream]||0)+1;});
                return Object.entries(streams).map(([stream,count],i)=>(
                  <div key={stream} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderTop:i>0?"1px solid "+theme.border:"none"}}>
                    <div style={{width:10,height:10,borderRadius:3,background:colors[i%colors.length]}}/>
                    <span style={{flex:1,fontSize:13,color:theme.textSecondary}}>{stream}</span>
                    <span style={{fontWeight:700,fontSize:14}}>{count}</span>
                  </div>
                ));
              })()}
            </Card>
          </>
        )}

        {adminTab==="analytics"&&(
          <>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,padding:"10px 14px",background:theme.bgElevated,borderRadius:12,border:"1px solid "+theme.border}}>
              <Icon name="toggleRight" size={16} color={theme.accent}/>
              <span style={{fontSize:12,color:theme.textSecondary}}>Toggle widgets on/off to customise your analytics view.</span>
            </div>

            {[
              {key:"lessonPerStudent",title:"Lessons Per Student (This Month)",icon:"calendar",prem:false,render:()=>(
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {lessonPerStudent.map(s=>(
                    <div key={s.name} style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:12,color:theme.textSecondary,width:100,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</span>
                      <div style={{flex:1,height:16,background:theme.bgInput,borderRadius:4,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.min(s.count/8*100,100)}%`,background:`linear-gradient(90deg,${theme.accent},${theme.accentDark})`,borderRadius:4,transition:"width 0.5s"}}/>
                      </div>
                      <span style={{fontSize:12,fontWeight:700,color:theme.text,width:20,textAlign:"right"}}>{s.count}</span>
                    </div>
                  ))}
                </div>
              )},
              {key:"attendanceRate",title:"Attendance Rate",icon:"check",prem:false,render:()=>(
                <div style={{display:"flex",alignItems:"center",gap:16}}>
                  <div style={{fontSize:40,fontWeight:700,color:attendanceRate>=80?theme.success:theme.warning,fontFamily:"'Playfair Display',serif"}}>{attendanceRate}%</div>
                  <div style={{fontSize:12,color:theme.textSecondary}}>Based on {totalLessons} completed/cancelled lessons. A healthy rate is above 85%.</div>
                </div>
              )},
              {key:"revenuePerStream",title:"Revenue by Stream",icon:"dollar",prem:false,render:()=>(
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {Object.entries(revenuePerStream).map(([stream,rev],i)=>(
                    <div key={stream} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"6px 0",borderTop:i>0?"1px solid "+theme.border:"none"}}>
                      <span style={{color:theme.textSecondary}}>{stream}</span>
                      <span style={{fontWeight:700,color:theme.accent}}>${rev.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )},
              {key:"avgDuration",title:"Average Lesson Duration",icon:"clock",prem:false,render:()=>(
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{fontSize:40,fontWeight:700,fontFamily:"'Playfair Display',serif",color:theme.info}}>{avgDuration}<span style={{fontSize:16}}> min</span></div>
                  <div style={{fontSize:12,color:theme.textSecondary}}>Average across all {store.lessons.length} lessons.</div>
                </div>
              )},
              {key:"paymentTurnaround",title:"Avg Payment Turnaround",icon:"clock",prem:true,render:()=>(
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{fontSize:40,fontWeight:700,fontFamily:"'Playfair Display',serif",color:theme.purple}}>{avgTurnaround}<span style={{fontSize:16}}> days</span></div>
                  <div style={{fontSize:12,color:theme.textSecondary}}>Average days from month start to payment received across {paidWithDate.length} payments.</div>
                </div>
              )},
            ].map(widget=>(
              <Card key={widget.key} style={{marginBottom:12}} theme={theme}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:toggles[widget.key]?12:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <Icon name={widget.icon} size={16} color={theme.accent}/>
                    <span style={{fontSize:14,fontWeight:700}}>{widget.title}</span>
                    {widget.prem&&<PremiumBadge/>}
                  </div>
                  <button onClick={()=>setToggle(widget.key)} style={{background:"none",border:"none",cursor:"pointer",padding:4}}>
                    <Icon name={toggles[widget.key]?"toggleRight":"toggleLeft"} size={22} color={toggles[widget.key]?theme.accent:theme.textMuted}/>
                  </button>
                </div>
                {toggles[widget.key]&&widget.render()}
              </Card>
            ))}
          </>
        )}

        {adminTab==="manage"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {/* Profile Settings — FIRST */}
            <Card style={{padding:14}} theme={theme}>
              <div style={{fontSize:12,color:theme.textMuted,fontWeight:600,marginBottom:10,letterSpacing:0.5}}>PROFILE</div>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
                <span style={{fontSize:13,color:theme.textSecondary,flexShrink:0,width:100}}>Display Name</span>
                <input type="text" defaultValue={store.settings?.tutorName||""} onBlur={e=>{
                  const val=e.target.value.trim();
                  if(val!==(store.settings?.tutorName||"")) {setStore(s=>({...s,settings:{...(s.settings||{}),tutorName:val}}));addToast("Name updated");}
                }} placeholder="Your name" style={{flex:1,padding:"8px 12px",background:theme.bgInput,border:"1px solid "+theme.border,borderRadius:8,color:theme.text,outline:"none",fontSize:14,fontFamily:"'DM Sans',sans-serif"}}/>
              </div>
              <div style={{fontSize:11,color:theme.textMuted}}>Shown on the dashboard greeting.</div>
            </Card>

            {/* Accent Colour */}
            <Card style={{padding:14}} theme={theme}>
              <div style={{fontSize:12,color:theme.textMuted,fontWeight:600,marginBottom:10,letterSpacing:0.5}}>
                ACCENT COLOUR <PremiumBadge/>
              </div>
              <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                {["#F59E0B","#3B82F6","#10B981","#8B5CF6","#EF4444","#EC4899","#06B6D4","#F97316"].map(color=>(
                  <div key={color} onClick={()=>{setStore(s=>({...s,settings:{...(s.settings||{}),accentColor:color,accentDark:color}}));addToast("Colour updated");}} style={{width:32,height:32,borderRadius:8,background:color,cursor:"pointer",border:(store.settings?.accentColor||"#F59E0B")===color?"3px solid white":"3px solid transparent",boxShadow:(store.settings?.accentColor||"#F59E0B")===color?"0 0 0 2px "+color:"none",transition:"all 0.2s"}}/>
                ))}
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <input type="color" value={store.settings?.accentColor||"#F59E0B"} onChange={e=>setStore(s=>({...s,settings:{...(s.settings||{}),accentColor:e.target.value,accentDark:e.target.value}}))} style={{width:32,height:32,borderRadius:8,border:"none",cursor:"pointer",padding:0,background:"none"}}/>
                  <span style={{fontSize:11,color:theme.textMuted}}>Custom</span>
                </div>
              </div>
            </Card>

            {/* Export / Import */}
            <Card style={{padding:14}} theme={theme}>
              <div style={{fontSize:12,color:theme.textMuted,fontWeight:600,marginBottom:10,letterSpacing:0.5}}>EXPORT</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                <Button size="sm" variant="secondary" icon="download" onClick={()=>{
                  try {
                    const wb=XLSX.utils.book_new();
                    const summaryData=store.students.map(s=>{
                      const lessons=store.lessons.filter(l=>l.studentId===s.id);
                      const totalHours=lessons.filter(l=>l.status!=="cancelled"&&!l.excludeFromBilling).reduce((sum,l)=>sum+l.duration,0)/60;
                      return {Name:s.name,Level:s.level,Stream:s.stream,Status:s.status,"Billing Mode":s.billingMode||"monthly","Hourly Rate":s.hourlyRate,Parent:s.parent,Phone:s.parentPhone,Email:s.parentEmail,"Total Lessons":lessons.length,"Total Hours":Math.round(totalHours*100)/100,"Total Fees":Math.round(s.hourlyRate*totalHours*100)/100,"Join Date":s.joinDate,Notes:s.notes||""};
                    });
                    const ws=XLSX.utils.json_to_sheet(summaryData);
                    XLSX.utils.book_append_sheet(wb,ws,"All Students");
                    store.students.forEach(s=>{
                      const lessons=store.lessons.filter(l=>l.studentId===s.id).sort((a,b)=>new Date(a.date)-new Date(b.date));
                      const data=lessons.map(l=>{const d=new Date(l.date);return {Date:d.toLocaleDateString("en-SG"),Time:d.toLocaleTimeString("en-SG",{hour:"2-digit",minute:"2-digit",hour12:true}),Duration:l.duration+" min",Subject:l.subject,Status:l.status,Location:l.location,"Billed":l.excludeFromBilling?"No":"Yes","Fee ($)":Math.round(s.hourlyRate*l.duration/60*100)/100,Feedback:l.comment||"",Homework:l.homework||""};});
                      if(data.length===0) data.push({Date:"",Time:"",Duration:"",Subject:"No lessons",Status:"",Location:"","Billed":"","Fee ($)":"",Feedback:"",Homework:""});
                      const ws=XLSX.utils.json_to_sheet(data);
                      XLSX.utils.book_append_sheet(wb,ws,s.name.replace(/[\\/*?[\]:]/g,"").substring(0,31));
                    });
                    XLSX.writeFile(wb,"TutorPulse-"+new Date().toISOString().split("T")[0]+".xlsx");
                    addToast("Excel exported");
                  } catch(err){addToast("Export failed","error");}
                }}>Export Excel</Button>
                <Button size="sm" variant="secondary" icon="download" onClick={()=>{
                  const blob=new Blob([JSON.stringify(store,null,2)],{type:"application/json"});
                  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="tutorpulse-backup-"+new Date().toISOString().split("T")[0]+".json";a.click();URL.revokeObjectURL(url);
                  addToast("Backup downloaded");
                }}>Full Backup</Button>
              </div>
            </Card>

            <Card style={{padding:14}} theme={theme}>
              <div style={{fontSize:12,color:theme.textMuted,fontWeight:600,marginBottom:10,letterSpacing:0.5}}>IMPORT</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                <Button size="sm" variant="secondary" icon="repeat" onClick={()=>{
                  const input=document.createElement("input");input.type="file";input.accept=".json";
                  input.onchange=e=>{
                    const file=e.target.files[0];if(!file) return;
                    const reader=new FileReader();
                    reader.onload=ev=>{
                      try{
                        const data=JSON.parse(ev.target.result);
                        if(data.students&&data.lessons){if(window.confirm("Replace ALL data with this backup?")){setStore(data);saveStore(data);addToast("Backup restored");}}
                        else addToast("Invalid backup file","error");
                      }catch{addToast("Failed to read file","error");}
                    };
                    reader.readAsText(file);
                  };
                  input.click();
                }}>Restore Backup</Button>
              </div>
            </Card>

            {/* Past Revenue */}
            <Card style={{padding:14}} theme={theme}>
              <div style={{fontSize:12,color:theme.textMuted,fontWeight:600,marginBottom:8,letterSpacing:0.5}}>PAST REVENUE (for chart)</div>
              <div style={{fontSize:11,color:theme.textMuted,marginBottom:10}}>Enter actual monthly revenue for past months to populate the Revenue Trend chart.</div>
              {(()=>{
                const hist=store.revenueHistory||[];
                const months=[];
                for(let i=5;i>=1;i--){
                  const d=new Date(now.getFullYear(),now.getMonth()-i,1);
                  const key=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
                  const label=d.toLocaleDateString("en-SG",{month:"short",year:"numeric"});
                  const existing=hist.find(h=>h.month===key);
                  months.push({key,label,amount:existing?existing.amount:""});
                }
                return months.map(m=>(
                  <div key={m.key} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <span style={{fontSize:12,color:theme.textSecondary,width:70,flexShrink:0}}>{m.label}</span>
                    <span style={{fontSize:13,color:theme.textMuted}}>$</span>
                    <input type="number" step="0.01" placeholder="0" defaultValue={m.amount} onBlur={e=>{
                      const val=parseFloat(e.target.value)||0;
                      setStore(s=>{const hist=(s.revenueHistory||[]).filter(h=>h.month!==m.key);if(val>0) hist.push({month:m.key,amount:val});return{...s,revenueHistory:hist};});
                    }} style={{flex:1,padding:"6px 10px",background:theme.bgInput,border:"1px solid "+theme.border,borderRadius:8,color:theme.text,outline:"none",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}/>
                  </div>
                ));
              })()}
            </Card>

            {/* Student List — overview at bottom */}
            <Card style={{padding:14}} theme={theme}>
              <div style={{fontSize:12,color:theme.textMuted,fontWeight:600,marginBottom:10,letterSpacing:0.5}}>STUDENT LIST ({store.students.length} total)</div>
              <div style={{fontSize:11,color:theme.textMuted,marginBottom:10}}>Quick overview. Full management available in the Students tab.</div>
              {store.students.map(student=>(
                <div key={student.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:"1px solid "+theme.border}}>
                  <Avatar initials={student.avatar} size={28} color={getStatusColor(student.status,theme)}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600}}>{student.name}</div>
                    <div style={{fontSize:11,color:theme.textSecondary}}>{student.level} · {student.billingMode==="per-lesson"?"Per Lesson":"Monthly"}</div>
                  </div>
                  <Badge text={student.status} color={getStatusColor(student.status,theme)} bg={getStatusBg(student.status,theme)}/>
                </div>
              ))}
            </Card>

            {/* Danger Zone */}
            <Card style={{padding:14,borderColor:theme.danger+"44"}} theme={theme}>
              <div style={{fontSize:12,color:theme.textMuted,fontWeight:600,marginBottom:8}}>DANGER ZONE</div>
              <div style={{display:"flex",gap:8}}>
                <Button size="sm" variant="danger" icon="trash" onClick={()=>{
                  if(window.confirm("Clear ALL data? This cannot be undone.")){
                    const e={students:[],lessons:[],payments:[],messages:[],notifications:[],revenueHistory:[],settings:store.settings,aiHistory:[],analyticsToggles:{}};
                    setStore(e);saveStore(e);addToast("All data cleared");
                  }
                }}>Clear All Data</Button>
                <Button size="sm" variant="secondary" icon="repeat" onClick={()=>{
                  if(window.confirm("Load sample data? Replaces current data.")){
                    const fresh=createStore();setStore(fresh);saveStore(fresh);addToast("Sample data loaded");
                  }
                }}>Load Sample</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }, [store, theme, adminTab, now, activeStudents, currentMonthStr, calcMonthlyFee, addToast]);

  // ═══════════════════════════════════════════════════════
  // LESSON DETAIL MODAL
  // ═══════════════════════════════════════════════════════
  const lessonDetailStudent = selectedLesson ? getStudent(selectedLesson.studentId) : null;
  const startLessonEdit = () => {
    if (!selectedLesson) return;
    const d = new Date(selectedLesson.date);
    setLessonEdit({
      date: d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"),
      time: String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"),
      duration: String(selectedLesson.duration),
      customDuration: "",
      subject: selectedLesson.subject,
      location: selectedLesson.location,
    });
    setEditingLesson(true);
  };
  const saveLessonEdit = () => {
    const dur = lessonEdit.duration==="custom" ? parseInt(lessonEdit.customDuration)||90 : parseInt(lessonEdit.duration);
    const dateTime = new Date(lessonEdit.date+"T"+lessonEdit.time+":00");
    const updates = {date:dateTime.toISOString(), duration:dur, subject:lessonEdit.subject, location:lessonEdit.location};
    updateLesson(selectedLesson.id, updates);
    setSelectedLesson({...selectedLesson,...updates});
    setEditingLesson(false);
    addToast("Lesson updated");
  };
  const le = (k,v) => setLessonEdit(f=>({...f,[k]:v}));

  const handleDeleteLesson = () => {
    if (!selectedLesson) return;
    const toDelete = {...selectedLesson};
    const returnTo = returnToStudentId;
    setStore(s=>({...s,lessons:s.lessons.filter(l=>l.id!==toDelete.id)}));
    setSelectedLesson(null); setEditingLesson(false);
    if (returnTo) { const st=store.students.find(s=>s.id===returnTo); if(st) setSelectedStudent(st); setReturnToStudentId(null); }
    const undoId = genId();
    setToasts(t=>[...t,{id:undoId,msg:"Lesson deleted",type:"undo",undoData:toDelete}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==undoId)),5000);
  };

  // ═══════════════════════════════════════════════════════
  // NEW LESSON MODAL
  // ═══════════════════════════════════════════════════════
  const NewLessonModal = useCallback(() => {
    const sortedStudents=[...store.students].sort((a,b)=>a.name.localeCompare(b.name));
    const defaultSid=prefillStudentId||sortedStudents[0]?.id||"";
    const [form,setForm]=useState({studentId:defaultSid,date:"",time:"10:00",duration:"90",customDuration:"",subject:"",location:"Home Studio"});
    const [isRecurring,setIsRecurring]=useState(false);
    const [recurDay,setRecurDay]=useState("1");
    const [recurTime,setRecurTime]=useState("10:00");
    const [recurStart,setRecurStart]=useState("");
    const [recurEnd,setRecurEnd]=useState("");
    const [preview,setPreview]=useState([]);
    const uf=(k,v)=>setForm(f=>({...f,[k]:v}));

    useEffect(()=>{if(prefillStudentId) setForm(f=>({...f,studentId:prefillStudentId}));},[]);

    useEffect(()=>{
      if(!isRecurring||!recurStart||!recurEnd){setPreview([]);return;}
      const dates=[];const dayNum=parseInt(recurDay);const end=new Date(recurEnd+"T23:59:59");
      let cursor=new Date(recurStart+"T00:00:00");
      while(cursor.getDay()!==dayNum) cursor.setDate(cursor.getDate()+1);
      while(cursor<=end){dates.push(new Date(cursor));cursor.setDate(cursor.getDate()+7);}
      setPreview(dates);
    },[isRecurring,recurDay,recurStart,recurEnd]);

    const dayNames=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

    return (
      <Modal open={showNewLesson} onClose={()=>{setShowNewLesson(false);setPrefillStudentId(null);}} title="Schedule Lesson" width={500}>
        {prefillStudentId?(
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:theme.textSecondary,marginBottom:6,letterSpacing:0.5,textTransform:"uppercase"}}>Student</label>
            <div style={{padding:"10px 14px",background:theme.bgInput,border:"1px solid "+theme.border,borderRadius:10,color:theme.text,fontSize:14}}>{(()=>{const s=getStudent(prefillStudentId);return s?s.name+" ("+s.level+")":"";})()}</div>
          </div>
        ):(
          <Select label="Student" value={form.studentId} onChange={v=>uf("studentId",v)} options={sortedStudents.map(s=>({value:s.id,label:s.name+" ("+s.level+")"}))}/>
        )}
        <div style={{display:"flex",gap:2,background:theme.bgInput,borderRadius:12,padding:3,marginBottom:16}}>
          <button onClick={()=>setIsRecurring(false)} style={{flex:1,padding:"8px 16px",borderRadius:10,border:"none",background:!isRecurring?theme.bgElevated:"transparent",color:!isRecurring?theme.text:theme.textMuted,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Single</button>
          <button onClick={()=>setIsRecurring(true)} style={{flex:1,padding:"8px 16px",borderRadius:10,border:"none",background:isRecurring?theme.bgElevated:"transparent",color:isRecurring?theme.text:theme.textMuted,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Recurring Weekly</button>
        </div>
        {!isRecurring?(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Date" type="date" value={form.date} onChange={v=>uf("date",v)}/>
            <Input label="Time" type="time" value={form.time} onChange={v=>uf("time",v)}/>
          </div>
        ):(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Select label="Day of Week" value={recurDay} onChange={setRecurDay} options={dayNames.map((d,i)=>({value:String(i),label:d}))}/>
              <Input label="Time" type="time" value={recurTime} onChange={setRecurTime}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Input label="Starting from" type="date" value={recurStart} onChange={setRecurStart}/>
              <Input label="Ending on" type="date" value={recurEnd} onChange={setRecurEnd}/>
            </div>
            {preview.length>0&&(
              <div style={{marginBottom:16,padding:12,background:theme.bgInput,borderRadius:10,border:"1px solid "+theme.border}}>
                <div style={{fontSize:11,color:theme.textMuted,fontWeight:600,marginBottom:6}}>PREVIEW — {preview.length} LESSONS</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {preview.map((d,i)=><span key={i} style={{padding:"4px 10px",borderRadius:8,background:theme.bgElevated,border:"1px solid "+theme.border,fontSize:12,color:theme.textSecondary}}>{d.toLocaleDateString("en-SG",{weekday:"short",day:"numeric",month:"short"})}</span>)}
                </div>
              </div>
            )}
          </>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            <Select label="Duration" value={form.duration} onChange={v=>uf("duration",v)} options={DURATION_OPTIONS}/>
            {form.duration==="custom"&&<Input label="Custom (minutes)" type="number" value={form.customDuration} onChange={v=>uf("customDuration",v)} placeholder="e.g. 75"/>}
          </div>
          <Select label="Location" value={form.location} onChange={v=>uf("location",v)} options={[{value:"Home Studio",label:"Home Studio"},{value:"Online — Zoom",label:"Online — Zoom"},{value:"Student's Home",label:"Student's Home"}]}/>
        </div>
        <Input label="Subject / Topic" value={form.subject} onChange={v=>uf("subject",v)} placeholder="e.g. 华文 作文 练习"/>
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <Button onClick={()=>{
            if(!form.studentId){addToast("Please select a student","error");return;}
            const subj=form.subject||"Chinese Lesson";
            const dur=form.duration==="custom"?parseInt(form.customDuration)||90:parseInt(form.duration);
            if(isRecurring){
              if(preview.length===0){addToast("Set both start and end dates","error");return;}
              const [h,mi]=recurTime.split(":").map(Number);
              preview.forEach(d=>{const dt=new Date(d);dt.setHours(h,mi,0,0);addLesson({studentId:form.studentId,date:dt.toISOString(),duration:dur,subject:subj,status:"confirmed",location:form.location,comment:"",homework:""});});
              addToast(preview.length+" lessons scheduled!");
            } else {
              if(!form.date){addToast("Please select a date","error");return;}
              addLesson({studentId:form.studentId,date:new Date(form.date+"T"+form.time+":00").toISOString(),duration:dur,subject:subj,status:"pending",location:form.location,comment:"",homework:""});
            }
            setShowNewLesson(false);setPrefillStudentId(null);
          }}>{isRecurring?`Schedule ${preview.length} Lessons`:"Schedule Lesson"}</Button>
          <Button variant="secondary" onClick={()=>{setShowNewLesson(false);setPrefillStudentId(null);}}>Cancel</Button>
        </div>
      </Modal>
    );
  }, [store.students, prefillStudentId, showNewLesson, theme, getStudent, addLesson, addToast]);

  // ═══════════════════════════════════════════════════════
  // MESSAGE COMPOSE MODAL
  // ═══════════════════════════════════════════════════════
  const MessageComposeModal = useCallback(() => {
    const [msgText,setMsgText]=useState("");
    const [generating,setGenerating]=useState(false);
    const [translating,setTranslating]=useState(false);
    const [activeTemplate,setActiveTemplate]=useState(null);
    const [bulkSentIndex,setBulkSentIndex]=useState(-1);
    const [customAIPrompt,setCustomAIPrompt]=useState("");
    const isBulk=showMessageCompose==="bulk";
    const student=!isBulk?getStudent(showMessageCompose):null;

    const buildInvoiceData=useCallback((sid)=>{
      const s=getStudent(sid);if(!s) return null;
      const mn=now.getMonth(),my=now.getFullYear();
      const monthName=now.toLocaleDateString("en-SG",{month:"long",year:"numeric"});
      const monthLessons=store.lessons.filter(l=>{const d=new Date(l.date);return l.studentId===sid&&d.getMonth()===mn&&d.getFullYear()===my&&l.status!=="cancelled"&&!l.excludeFromBilling;}).sort((a,b)=>new Date(a.date)-new Date(b.date));
      const cancelledLessons=store.lessons.filter(l=>{const d=new Date(l.date);return l.studentId===sid&&d.getMonth()===mn&&d.getFullYear()===my&&l.status==="cancelled";});
      const homeworkLessons=store.lessons.filter(l=>{const d=new Date(l.date);return l.studentId===sid&&d.getMonth()===mn&&d.getFullYear()===my&&l.homework&&l.homework.trim();}).sort((a,b)=>new Date(a.date)-new Date(b.date));
      const totalMinutes=monthLessons.reduce((sum,l)=>sum+l.duration,0);
      const totalHours=totalMinutes/60;
      const totalFee=Math.round(s.hourlyRate*totalHours*100)/100;
      return {student:s,monthName,monthLessons,cancelledLessons,homeworkLessons,totalSessions:monthLessons.length,hourlyRate:s.hourlyRate,totalHours,totalFee,totalMinutes};
    },[store.lessons,now,getStudent]);

    const buildLessonBlock=(inv)=>{
      let block=`📚 *Lessons (${inv.totalSessions} sessions, ${inv.totalHours}h):*\n`;
      inv.monthLessons.forEach(l=>{
        const d=new Date(l.date);
        block+="  • "+d.toLocaleDateString("en-SG",{weekday:"short",day:"numeric",month:"short"})+", "+d.toLocaleTimeString("en-SG",{hour:"2-digit",minute:"2-digit",hour12:true})+" — "+l.subject+" ("+l.duration+" min)\n";
      });
      if(inv.cancelledLessons.length>0) block+=`\n❌ *Cancelled:* ${inv.cancelledLessons.length} session(s) excluded\n`;
      return block;
    };

    const buildFeeBlock=(inv)=>`💰 *Fee Breakdown:*\n  ${inv.totalHours}h × $${inv.hourlyRate}/hr\n  ──────────\n  *Total Due: $${inv.totalFee.toFixed(2)}*\n\n💳 *Payment:* PayNow to UEN 202410124E\nPlease pay by the 10th. Thank you! 🙏\n\n— Teacher ${store.settings?.tutorName||"Leon"}`;

    const templates=[
      {id:"invoice_ai",label:"🧾 Fee Invoice + AI Summary",desc:"AI progress summary + lesson dates + fee breakdown",isPremium:true,
        generate:async(sid)=>{
          const inv=buildInvoiceData(sid);if(!inv) return "";
          let msg=`Hi ${inv.student.parent},\n\nHere is ${inv.student.name}'s tuition summary for *${inv.monthName}*:\n\n`;
          const feedbackNotes=inv.monthLessons.filter(l=>l.comment).map(l=>l.subject+": "+l.comment);
          if(feedbackNotes.length>0){
            setGenerating(true);
            try{
              const aiPrompt=`You are Teacher ${store.settings?.tutorName||"Leon"}, a Chinese tutor in Singapore. Write a concise 2-3 sentence progress summary for ${inv.student.name}'s parent based on these session notes:\n${feedbackNotes.join("\n")}\nPlain text only, no markdown, no asterisks. Under 60 words.`;
              const summary=await callAI(aiPrompt);
              if(summary) msg+=`📊 *Monthly Progress:*\n${stripMarkdown(summary)}\n\n`;
            }catch{} finally{setGenerating(false);}
          }
          msg+=buildLessonBlock(inv)+"\n"+buildFeeBlock(inv);
          return msg;
        }
      },
      {id:"invoice_simple",label:"📋 Simple Invoice",desc:"Lesson dates + fee breakdown",isPremium:false,
        generate:async(sid)=>{const inv=buildInvoiceData(sid);if(!inv) return "";return `Hi ${inv.student.parent},\n\nHere is ${inv.student.name}'s tuition summary for *${inv.monthName}*:\n\n${buildLessonBlock(inv)}\n${buildFeeBlock(inv)}`;}
      },
      {id:"reminder",label:"🔔 Payment Reminder",desc:"Quick reminder with amount",isPremium:false,
        generate:async(sid)=>{const inv=buildInvoiceData(sid);if(!inv) return "";return `Hi ${inv.student.parent},\n\nFriendly reminder that ${inv.student.name}'s *${inv.monthName}* tuition fee is due:\n\n📚 ${inv.totalSessions} lessons (${inv.totalHours}h total)\n💰 *Amount: $${inv.totalFee.toFixed(2)}*\n💳 PayNow to UEN 202410124E\n\nIgnore if already paid! Thank you 🙏\n— Teacher ${store.settings?.tutorName||"Leon"}`;}
      },
      {id:"overdue",label:"⚠️ Overdue Notice",desc:"Polite follow-up for overdue payments",isPremium:false,
        generate:async(sid)=>{const inv=buildInvoiceData(sid);if(!inv) return "";return `Hi ${inv.student.parent},\n\nI hope all is well! I noticed ${inv.student.name}'s *${inv.monthName}* tuition fee is still outstanding.\n\n*Details:*\n  ${inv.totalSessions} sessions (${inv.totalHours}h) — ${inv.student.level} ${inv.student.stream}\n  *Amount due: $${inv.totalFee.toFixed(2)}*\n\nKindly arrange payment via PayNow to UEN 202410124E.\n\nThank you 🙏\n— Teacher ${store.settings?.tutorName||"Leon"}`;}
      },
      {id:"homework",label:"📝 Homework Summary",desc:"Homework issued this month from lesson records",isPremium:false,
        generate:async(sid)=>{
          const inv=buildInvoiceData(sid);if(!inv) return "";
          let msg=`Hi ${inv.student.parent},\n\nHere is ${inv.student.name}'s homework summary for *${inv.monthName}*:\n\n`;
          if(inv.homeworkLessons.length>0){
            inv.homeworkLessons.forEach(l=>{
              const d=new Date(l.date);
              msg+="📖 "+d.toLocaleDateString("en-SG",{weekday:"short",day:"numeric",month:"short"})+" — "+l.subject+"\n   "+l.homework+"\n\n";
            });
          } else {
            msg+="No homework was recorded this month.\n\n";
          }
          msg+=`Please ensure ${inv.student.name} completes the above before the next lesson. Thank you! 🙏\n— Teacher ${store.settings?.tutorName||"Leon"}`;
          return msg;
        }
      },
      {id:"progress",label:"📈 Progress Summary",desc:"Overall progress and areas to improve",isPremium:true,
        generate:async(sid)=>{
          const inv=buildInvoiceData(sid);if(!inv) return "";
          const feedbackNotes=inv.monthLessons.filter(l=>l.comment).map(l=>l.subject+": "+l.comment);
          if(feedbackNotes.length===0) return `Hi ${inv.student.parent},\n\nNo session feedback notes were recorded this month for ${inv.student.name}.\n\n— Teacher ${store.settings?.tutorName||"Leon"}`;
          setGenerating(true);
          let summary="";
          try{
            const aiPrompt=`You are Teacher ${store.settings?.tutorName||"Leon"}, a Chinese tutor in Singapore. Write a detailed 4-5 sentence progress summary for ${inv.student.name} (${inv.student.level} ${inv.student.stream}) for their parent. Cover: what was worked on, strengths observed, areas needing improvement, and what to focus on next. Based on these notes:\n${feedbackNotes.join("\n")}\nPlain text only, no markdown, no asterisks.`;
            summary=await callAI(aiPrompt);
          }catch{}finally{setGenerating(false);}
          return `Hi ${inv.student.parent},\n\nHere is ${inv.student.name}'s progress update for *${inv.monthName}*:\n\n${stripMarkdown(summary)||"Unable to generate summary."}\n\nPlease feel free to reach out if you have any questions.\n\n— Teacher ${store.settings?.tutorName||"Leon"}`;
        }
      },
      {id:"discipline",label:"⚠️ Discipline / Conduct Issue",desc:"Notify parent of behavioural concerns",isPremium:false,
        generate:async(sid)=>{
          const inv=buildInvoiceData(sid);if(!inv) return "";
          return `Hi ${inv.student.parent},\n\nI hope this message finds you well. I wanted to bring something to your attention regarding ${inv.student.name}'s conduct during recent lessons.\n\n[Please describe the specific issue here — e.g., difficulty focusing, incomplete work, disruptive behaviour, etc.]\n\nI believe with your support at home, we can help ${inv.student.name} improve. I would welcome a quick chat if that would be helpful.\n\nThank you for your understanding 🙏\n— Teacher ${store.settings?.tutorName||"Leon"}`;
        }
      },
      {id:"termination",label:"🚪 Termination Notice",desc:"End tutoring arrangement professionally",isPremium:false,
        generate:async(sid)=>{
          const inv=buildInvoiceData(sid);if(!inv) return "";
          return `Hi ${inv.student.parent},\n\nThank you for entrusting me with ${inv.student.name}'s Chinese education. After careful consideration, I would like to inform you that I will be concluding our tutoring arrangement.\n\n*Last lesson date:* [Please specify date]\n*Outstanding fees:* $${inv.totalFee.toFixed(2)} for ${inv.monthName}\n\nIt has been a pleasure working with ${inv.student.name}. I wish them all the best in their studies ahead.\n\nKindly arrange settlement of any outstanding fees via PayNow to UEN 202410124E.\n\nWarm regards,\nTeacher ${store.settings?.tutorName||"Leon"}`;
        }
      },
    ];

    const bulkRecipients=useMemo(()=>{
      if(!isBulk) return [];
      return pendingPayments.map(sid=>{const s=getStudent(sid);if(!s) return null;return {studentId:sid,studentName:s.name,parentName:s.parent,phone:s.parentPhone,amount:calcMonthlyFee(sid,currentMonthStr).total};}).filter(Boolean);
    },[isBulk,pendingPayments,getStudent,calcMonthlyFee,currentMonthStr]);

    const applyTemplate=async(tplId)=>{
      setActiveTemplate(tplId);
      const tpl=templates.find(t=>t.id===tplId);
      if(!tpl) return;
      const targetSid=isBulk&&bulkRecipients.length>0?bulkRecipients[0].studentId:showMessageCompose;
      const msg=await tpl.generate(targetSid);
      setMsgText(msg);
    };

    const runCustomAI=async()=>{
      if(!customAIPrompt.trim()) return;
      setGenerating(true);
      const targetSid=isBulk&&bulkRecipients.length>0?bulkRecipients[0].studentId:showMessageCompose;
      const s=getStudent(targetSid);
      const context=s?`Student: ${s.name}, Level: ${s.level} ${s.stream}, Parent: ${s.parent}.`:"";
      try{
        const result=await callAI(`You are Teacher ${store.settings?.tutorName||"Leon"}, a Chinese tutor in Singapore. ${context}\n\nWrite a WhatsApp message to the parent based on this instruction: ${customAIPrompt}\n\nPlain text only, no markdown formatting, no asterisks.`);
        setMsgText(stripMarkdown(result));
        setActiveTemplate("custom_ai");
      }catch{addToast("AI unavailable","error");}
      setGenerating(false);
    };

    const TRANSLATE_LANGS=["Chinese (Simplified)","Chinese (Traditional)","Malay","Tamil","Japanese","Korean"];

    return (
      <Modal open={!!showMessageCompose} onClose={()=>{setShowMessageCompose(null);setMsgText("");setBulkSentIndex(-1);setActiveTemplate(null);}} title={isBulk?"Fee Reminders":"Message "+( student?student.parent:"")} width={560}>
        {/* Recipient */}
        {!isBulk&&student&&(
          <div style={{display:"flex",alignItems:"center",gap:12,padding:14,background:theme.bgElevated,borderRadius:12,marginBottom:16,border:"1px solid "+theme.border}}>
            <Avatar initials={student.avatar} size={40}/>
            <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14}}>{student.parent}</div><div style={{fontSize:12,color:theme.textSecondary}}>{student.parentPhone} · {student.name} (${student.hourlyRate}/hr)</div></div>
          </div>
        )}
        {isBulk&&bulkRecipients.length>0&&(
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,color:theme.textMuted,fontWeight:600,marginBottom:8}}>RECIPIENTS ({bulkRecipients.length})</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:100,overflow:"auto"}}>
              {bulkRecipients.map((r,idx)=>(
                <div key={r.studentId} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 12px",borderRadius:10,background:idx<=bulkSentIndex?theme.successBg:theme.bgElevated,border:"1px solid "+(idx<=bulkSentIndex?theme.success+"44":theme.border)}}>
                  <Avatar initials={r.studentName.split(" ").map(w=>w[0]).join("").substring(0,2)} size={24} color={idx<=bulkSentIndex?theme.success:theme.accent}/>
                  <span style={{fontSize:12,fontWeight:600,flex:1}}>{r.parentName}</span>
                  <span style={{fontSize:11,color:theme.textMuted}}>{r.studentName} · ${r.amount.toFixed(0)}</span>
                  {idx<=bulkSentIndex&&<Icon name="check" size={14} color={theme.success}/>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Templates */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,color:theme.textMuted,fontWeight:600,marginBottom:8,letterSpacing:0.5}}>CHOOSE TEMPLATE</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {templates.map(tpl=>(
              <button key={tpl.id} onClick={()=>applyTemplate(tpl.id)} disabled={generating} style={{textAlign:"left",padding:"10px 12px",borderRadius:10,border:"1px solid "+(activeTemplate===tpl.id?theme.accent+"88":theme.border),background:activeTemplate===tpl.id?theme.accentBg:theme.bgElevated,cursor:generating?"wait":"pointer",fontFamily:"'DM Sans',sans-serif",opacity:generating?0.7:1}}>
                <div style={{fontSize:12,fontWeight:700,color:activeTemplate===tpl.id?theme.accent:theme.text,marginBottom:2,display:"flex",alignItems:"center",flexWrap:"wrap",gap:4}}>
                  {tpl.label}{tpl.isPremium&&<PremiumBadge/>}
                </div>
                <div style={{fontSize:10,color:theme.textMuted,lineHeight:1.3}}>{tpl.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom AI prompt — Premium */}
        <div style={{marginBottom:14,padding:12,background:theme.purpleBg,borderRadius:12,border:"1px solid "+theme.purple+"33"}}>
          <div style={{fontSize:12,fontWeight:700,color:theme.purple,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
            <Icon name="ai" size={14} color={theme.purple}/> AI Custom Draft <PremiumBadge/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <input value={customAIPrompt} onChange={e=>setCustomAIPrompt(e.target.value)} placeholder="e.g. Tell parent Marcus needs to focus more on Paper 2..." style={{flex:1,padding:"8px 12px",background:theme.bgInput,border:"1px solid "+theme.border,borderRadius:8,color:theme.text,outline:"none",fontSize:12,fontFamily:"'DM Sans',sans-serif"}} onKeyDown={e=>{if(e.key==="Enter") runCustomAI();}}/>
            <button onClick={runCustomAI} disabled={generating||!customAIPrompt.trim()} style={{padding:"8px 14px",borderRadius:8,border:"none",background:theme.purple,color:"white",fontSize:12,fontWeight:600,cursor:generating||!customAIPrompt.trim()?"default":"pointer",fontFamily:"'DM Sans',sans-serif",opacity:generating||!customAIPrompt.trim()?0.5:1}}>
              {generating?"...":"Ask AI"}
            </button>
          </div>
        </div>

        {/* Message editor */}
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <label style={{fontSize:12,fontWeight:600,color:theme.textSecondary,letterSpacing:0.5,textTransform:"uppercase"}}>Message</label>
            {msgText&&<span style={{fontSize:10,color:theme.textMuted}}>{msgText.length} chars</span>}
          </div>
          <textarea value={msgText} onChange={e=>{setMsgText(e.target.value);if(activeTemplate) setActiveTemplate(null);}} placeholder="Select a template above, or type your own..." rows={8} style={{width:"100%",padding:"12px 14px",background:theme.bgInput,border:"1px solid "+theme.border,borderRadius:10,color:theme.text,outline:"none",fontSize:12,fontFamily:"'DM Sans',sans-serif",resize:"vertical",lineHeight:1.6}}/>
        </div>

        {/* Translate */}
        {msgText&&(
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:theme.textMuted,fontWeight:600,marginBottom:6,letterSpacing:0.5}}>TRANSLATE MESSAGE <PremiumBadge/></div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {TRANSLATE_LANGS.map(lang=>(
                <button key={lang} onClick={()=>translateMessage(msgText,lang,setMsgText,setTranslating)} disabled={translating} style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+theme.border,background:theme.bgElevated,color:theme.textSecondary,fontSize:11,fontWeight:600,cursor:translating?"wait":"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:4,opacity:translating?0.5:1}}>
                  <Icon name="globe" size={11} color={theme.textMuted}/>{lang}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Send buttons */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:12}}>
          {isBulk?(
            bulkSentIndex<bulkRecipients.length-1?(
              <button onClick={async()=>{
                if(!msgText.trim()){addToast("Select a template or type a message","error");return;}
                const nextIdx=bulkSentIndex+1;const recipient=bulkRecipients[nextIdx];
                let personalMsg=msgText;
                const tpl=templates.find(t=>t.id===activeTemplate);
                if(tpl&&activeTemplate!=="custom_ai"){personalMsg=await tpl.generate(recipient.studentId);}
                setStore(s=>({...s,messages:[...s.messages,{id:"m"+genId(),parentId:recipient.studentId,direction:"out",text:personalMsg,date:new Date().toISOString(),read:true}]}));
                openWhatsApp(recipient.phone,personalMsg);
                setBulkSentIndex(nextIdx);
                if(nextIdx===bulkRecipients.length-1) addToast("All "+bulkRecipients.length+" messages sent!");
              }} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"12px 24px",borderRadius:12,border:"none",background:"#25D366",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:"0 2px 12px rgba(37,211,102,0.3)"}}>
                <WAIcon/>{bulkSentIndex===-1?"Send to "+bulkRecipients[0].parentName+" (1/"+bulkRecipients.length+")":"Next: "+bulkRecipients[bulkSentIndex+1].parentName+" ("+(bulkSentIndex+2)+"/"+bulkRecipients.length+")"}
              </button>
            ):(
              <Button variant="success" icon="check" onClick={()=>{setShowMessageCompose(null);setMsgText("");setBulkSentIndex(-1);setActiveTemplate(null);}}>All Done!</Button>
            )
          ):(
            <button onClick={()=>{
              if(!msgText.trim()){addToast("Type a message first","error");return;}
              setStore(s=>({...s,messages:[...s.messages,{id:"m"+genId(),parentId:showMessageCompose,direction:"out",text:msgText,date:new Date().toISOString(),read:true}]}));
              openWhatsApp(student.parentPhone,msgText);
              addToast("WhatsApp opened");
              setShowMessageCompose(null);setMsgText("");setActiveTemplate(null);
            }} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"12px 24px",borderRadius:12,border:"none",background:"#25D366",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:"0 2px 12px rgba(37,211,102,0.3)"}}>
              <WAIcon/> Send via WhatsApp
            </button>
          )}
          <Button variant="secondary" onClick={()=>{setShowMessageCompose(null);setMsgText("");setBulkSentIndex(-1);setActiveTemplate(null);}}>Cancel</Button>
        </div>
        {/* Info text at bottom */}
        {!isBulk&&student&&(
          <div style={{fontSize:11,color:theme.textMuted,textAlign:"center",padding:"8px 0",borderTop:"1px solid "+theme.border}}>
            Opens WhatsApp with {student.parent}'s number (+{formatPhoneForWA(student.parentPhone)}) pre-filled
          </div>
        )}
      </Modal>
    );
  }, [showMessageCompose, store, theme, now, getStudent, pendingPayments, calcMonthlyFee, currentMonthStr, callAI, openWhatsApp, addToast, translateMessage]);

  // ═══════════════════════════════════════════════════════
  // AI ASSISTANT MODAL
  // ═══════════════════════════════════════════════════════
  const AIAssistantModal = useCallback(() => {
    const [prompt,setPrompt]=useState("");
    const [loading,setLoading]=useState(false);
    const [historyView,setHistoryView]=useState(false);
    const aiHistory=store.aiHistory||[];

    const suggestions=[
      "What's my projected revenue for this month?",
      "Which student needs the most attention?",
      "Suggest a lesson plan for P6 高级华文 阅读理解",
      "How can I improve my collection rate?",
      "Write a mid-term summary for all active students",
    ];

    const ask=async(q)=>{
      if(!q.trim()) return;
      setLoading(true);setHistoryView(false);
      try{
        const result=await callAI(q);
        const clean=stripMarkdown(result);
        setStore(s=>({...s,aiHistory:[...(s.aiHistory||[]),{id:genId(),question:q,answer:clean,date:new Date().toISOString()}]}));
        setPrompt("");
      }catch{
        setStore(s=>({...s,aiHistory:[...(s.aiHistory||[]),{id:genId(),question:q,answer:"AI is temporarily unavailable. Please try again.",date:new Date().toISOString()}]}));
      }
      setLoading(false);
    };

    const latestEntry=aiHistory[aiHistory.length-1];

    return (
      <Modal open={showAI} onClose={()=>setShowAI(false)} title={<span>TutorPulse AI <PremiumBadge/></span>} width={540}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:14,background:theme.purpleBg,borderRadius:12,marginBottom:16,border:`1px solid ${theme.purple}33`}}>
          <Icon name="ai" size={24} color={theme.purple}/>
          <div style={{fontSize:13,color:theme.textSecondary}}>Ask anything about your students, schedule, fees, or lesson planning. Responses are in plain text.</div>
        </div>

        {/* Tab: current / history */}
        <div style={{display:"flex",gap:2,background:theme.bgInput,borderRadius:12,padding:3,marginBottom:16}}>
          <button onClick={()=>setHistoryView(false)} style={{flex:1,padding:"8px",borderRadius:10,border:"none",background:!historyView?theme.bgElevated:"transparent",color:!historyView?theme.text:theme.textMuted,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Chat</button>
          <button onClick={()=>setHistoryView(true)} style={{flex:1,padding:"8px",borderRadius:10,border:"none",background:historyView?theme.bgElevated:"transparent",color:historyView?theme.text:theme.textMuted,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <Icon name="history" size={14}/> History ({aiHistory.length})
          </button>
        </div>

        {historyView?(
          <div>
            {aiHistory.length===0?(
              <EmptyState icon="history" title="No history yet" sub="Ask a question to get started"/>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:10,maxHeight:320,overflow:"auto"}}>
                {[...aiHistory].reverse().map(entry=>(
                  <div key={entry.id} style={{padding:12,background:theme.bgElevated,borderRadius:12,border:"1px solid "+theme.border}}>
                    <div style={{fontSize:12,fontWeight:700,color:theme.accent,marginBottom:4}}>{entry.question}</div>
                    <div style={{fontSize:12,color:theme.textSecondary,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{entry.answer}</div>
                    <div style={{fontSize:10,color:theme.textMuted,marginTop:6}}>{new Date(entry.date).toLocaleDateString("en-SG",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
                  </div>
                ))}
              </div>
            )}
            {aiHistory.length>0&&(
              <button onClick={()=>{if(window.confirm("Clear all AI history?")) setStore(s=>({...s,aiHistory:[]}));}} style={{marginTop:12,width:"100%",padding:"8px",borderRadius:10,border:"1px solid "+theme.border,background:"transparent",color:theme.danger,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                Clear History
              </button>
            )}
          </div>
        ):(
          <>
            {/* Suggestions */}
            {!latestEntry&&!loading&&(
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,color:theme.textMuted,fontWeight:600,marginBottom:8,letterSpacing:0.5}}>SUGGESTIONS</div>
                {suggestions.map((s,i)=>(
                  <button key={i} onClick={()=>{setPrompt(s);ask(s);}} style={{display:"block",width:"100%",textAlign:"left",padding:"10px 14px",borderRadius:10,border:`1px solid ${theme.border}`,background:"transparent",color:theme.textSecondary,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",marginBottom:6}} onMouseEnter={e=>e.currentTarget.style.background=theme.bgElevated} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Loading */}
            {loading&&(
              <div style={{textAlign:"center",padding:24}}>
                <div style={{display:"inline-block",width:28,height:28,borderRadius:"50%",border:`3px solid ${theme.border}`,borderTopColor:theme.accent,animation:"spin 1s linear infinite"}}/>
                <div style={{marginTop:10,fontSize:13,color:theme.textSecondary}}>Thinking...</div>
              </div>
            )}

            {/* Latest answer */}
            {!loading&&latestEntry&&(
              <div style={{marginBottom:16}}>
                <div style={{padding:14,background:theme.bgElevated,borderRadius:12,marginBottom:8,fontSize:12,fontWeight:700,color:theme.accent}}>{latestEntry.question}</div>
                <div style={{padding:14,background:theme.bgElevated,borderRadius:12,fontSize:13,lineHeight:1.7,color:theme.textSecondary,whiteSpace:"pre-wrap",maxHeight:220,overflow:"auto",border:`1px solid ${theme.border}`}}>
                  {latestEntry.answer}
                </div>
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  <button onClick={()=>{setStore(s=>({...s,aiHistory:(s.aiHistory||[]).filter(e=>e.id!==latestEntry.id)}));}} style={{padding:"6px 14px",borderRadius:8,border:"1px solid "+theme.border,background:"transparent",color:theme.textMuted,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                    Clear This
                  </button>
                  <button onClick={()=>setStore(s=>({...s,aiHistory:[]}))} style={{padding:"6px 14px",borderRadius:8,border:"1px solid "+theme.border,background:"transparent",color:theme.textMuted,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <div style={{display:"flex",gap:8}}>
              <input value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Ask TutorPulse AI anything..." style={{flex:1,padding:"10px 14px",background:theme.bgInput,border:`1px solid ${theme.border}`,borderRadius:10,color:theme.text,outline:"none",fontSize:13}} onKeyDown={e=>{if(e.key==="Enter"&&prompt.trim()) ask(prompt);}}/>
              <Button size="sm" icon="send" onClick={()=>ask(prompt)} disabled={loading||!prompt.trim()}>Ask</Button>
            </div>
          </>
        )}
      </Modal>
    );
  }, [showAI, store.aiHistory, store.settings, theme, callAI, activeStudents, pendingPayments, monthlyRevenue]);

  // ═══════════════════════════════════════════════════════
  // STUDENT DETAIL MODAL
  // ═══════════════════════════════════════════════════════
  const StudentDetailModal = useCallback(() => {
    if (!selectedStudent) return null;
    const studentLessons=store.lessons.filter(l=>l.studentId===selectedStudent.id).sort((a,b)=>new Date(a.date)-new Date(b.date));
    const grades=selectedStudent.grades||[];

    const startEdit=()=>{
      setStudentEditForm({name:selectedStudent.name,level:selectedStudent.level,levelCustom:selectedStudent.levelCustom||"",stream:selectedStudent.stream,streamCustom:selectedStudent.streamCustom||"",parent:selectedStudent.parent,parentPhone:selectedStudent.parentPhone,parentEmail:selectedStudent.parentEmail,hourlyRate:String(selectedStudent.hourlyRate),billingMode:selectedStudent.billingMode||"monthly",address:selectedStudent.address||"",notes:selectedStudent.notes||"",status:selectedStudent.status});
      setEditingStudent(true);
    };
    const saveEdit=()=>{
      const u={
        name:studentEditForm.name,
        level:studentEditForm.level==="other"?studentEditForm.levelCustom:studentEditForm.level,
        levelCustom:studentEditForm.level==="other"?studentEditForm.levelCustom:"",
        stream:studentEditForm.stream==="other"?studentEditForm.streamCustom:studentEditForm.stream,
        streamCustom:studentEditForm.stream==="other"?studentEditForm.streamCustom:"",
        parent:studentEditForm.parent,parentPhone:studentEditForm.parentPhone,parentEmail:studentEditForm.parentEmail,
        hourlyRate:parseFloat(studentEditForm.hourlyRate)||selectedStudent.hourlyRate,
        billingMode:studentEditForm.billingMode,
        address:studentEditForm.address,notes:studentEditForm.notes,status:studentEditForm.status,
        avatar:studentEditForm.name.split(" ").map(w=>w[0]).join("").toUpperCase().substring(0,2)
      };
      updateStudent(selectedStudent.id,u);setSelectedStudent({...selectedStudent,...u});setEditingStudent(false);addToast("Student updated");
    };
    const uf=(k,v)=>setStudentEditForm(f=>({...f,[k]:v}));

    // Grade tracking
    const addGradeEntry=()=>{
      const newGrades=[...(selectedStudent.grades||[]),{id:genId(),subject:"",date:new Date().toISOString().split("T")[0],grade:"",type:"Assessment",notes:""}];
      updateStudent(selectedStudent.id,{grades:newGrades});
      setSelectedStudent({...selectedStudent,grades:newGrades});
    };
    const updateGrade=(id,updates)=>{
      const newGrades=(selectedStudent.grades||[]).map(g=>g.id===id?{...g,...updates}:g);
      updateStudent(selectedStudent.id,{grades:newGrades});
      setSelectedStudent({...selectedStudent,grades:newGrades});
    };
    const removeGrade=(id)=>{
      const newGrades=(selectedStudent.grades||[]).filter(g=>g.id!==id);
      updateStudent(selectedStudent.id,{grades:newGrades});
      setSelectedStudent({...selectedStudent,grades:newGrades});
    };

    return (
      <Modal open={!!selectedStudent} onClose={()=>{setSelectedStudent(null);setEditingStudent(false);setBulkDeleteMode(false);}} title={editingStudent?"Edit Student":"Student Profile"} width={540}>
        {!editingStudent?(
          <>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20,paddingBottom:16,borderBottom:"1px solid "+theme.border}}>
              <Avatar initials={selectedStudent.avatar} size={56} color={getStatusColor(selectedStudent.status,theme)}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:18,fontFamily:"'Playfair Display',serif"}}>{selectedStudent.name}</div>
                <div style={{color:theme.textSecondary,fontSize:13,marginTop:2}}>{selectedStudent.level} · {selectedStudent.stream}</div>
                <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
                  <Badge text={selectedStudent.status} color={getStatusColor(selectedStudent.status,theme)} bg={getStatusBg(selectedStudent.status,theme)}/>
                  {selectedStudent.billingMode==="per-lesson"&&<Badge text="Per Lesson" color={theme.purple} bg={theme.purpleBg}/>}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:24,fontWeight:700,color:theme.accent,fontFamily:"'Playfair Display',serif"}}>${selectedStudent.hourlyRate}</div>
                <div style={{fontSize:11,color:theme.textMuted}}>per hour</div>
              </div>
            </div>

            <Card style={{marginBottom:12,padding:14}} theme={theme}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:11,color:theme.textMuted,fontWeight:600,letterSpacing:0.5}}>PARENT / GUARDIAN</div>
                <button onClick={startEdit} style={{background:"none",border:"none",cursor:"pointer",color:theme.accent,fontSize:11,fontWeight:600,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:3}}><Icon name="edit" size={12} color={theme.accent}/>Edit</button>
              </div>
              <div style={{fontWeight:600,marginBottom:4}}>{selectedStudent.parent}</div>
              <div style={{fontSize:13,color:theme.textSecondary}}>{selectedStudent.parentPhone}</div>
              <div style={{fontSize:13,color:theme.textSecondary}}>{selectedStudent.parentEmail}</div>
            </Card>

            {selectedStudent.notes&&(
              <Card style={{marginBottom:12,padding:14,borderLeft:"3px solid "+theme.accent}} theme={theme}>
                <div style={{fontSize:11,color:theme.textMuted,fontWeight:600,marginBottom:4,letterSpacing:0.5}}>NOTES</div>
                <div style={{fontSize:13,color:theme.textSecondary}}>{selectedStudent.notes}</div>
              </Card>
            )}

            {/* Grade Tracking */}
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:12,color:theme.textMuted,fontWeight:600,letterSpacing:0.5}}>GRADE TRACKING <PremiumBadge/></div>
                <button onClick={addGradeEntry} style={{background:"none",border:"none",cursor:"pointer",color:theme.accent,fontSize:11,fontWeight:600,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:3}}><Icon name="plus" size={12} color={theme.accent}/>Add Entry</button>
              </div>
              {grades.length===0?(
                <div style={{fontSize:12,color:theme.textMuted,padding:"8px 0"}}>No grade records yet. Click "Add Entry" to track assessments.</div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {grades.map(g=>(
                    <div key={g.id} style={{padding:12,background:theme.bgElevated,borderRadius:10,border:"1px solid "+theme.border}}>
                      <div style={{display:"flex",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                        <input defaultValue={g.subject} onBlur={e=>updateGrade(g.id,{subject:e.target.value})} placeholder="Subject (e.g. 华文 CA1)" style={{flex:2,minWidth:100,padding:"5px 8px",background:theme.bgInput,border:"1px solid "+theme.border,borderRadius:6,color:theme.text,fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
                        <select defaultValue={g.type} onChange={e=>updateGrade(g.id,{type:e.target.value})} style={{flex:1,minWidth:90,padding:"5px 8px",background:theme.bgInput,border:"1px solid "+theme.border,borderRadius:6,color:theme.text,fontSize:12,fontFamily:"'DM Sans',sans-serif",appearance:"none",outline:"none"}}>
                          {["Starting Grade","CA1","SA1","CA2","SA2","Mid-Year","End-Year","PSLE","O-Level","Trial","Other"].map(t=><option key={t} value={t}>{t}</option>)}
                        </select>
                        <input type="date" defaultValue={g.date} onBlur={e=>updateGrade(g.id,{date:e.target.value})} style={{flex:1,minWidth:110,padding:"5px 8px",background:theme.bgInput,border:"1px solid "+theme.border,borderRadius:6,color:theme.text,fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
                        <input defaultValue={g.grade} onBlur={e=>updateGrade(g.id,{grade:e.target.value})} placeholder="Grade/Score" style={{flex:1,minWidth:80,padding:"5px 8px",background:theme.bgInput,border:"1px solid "+theme.border,borderRadius:6,color:theme.accent,fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
                        <button onClick={()=>removeGrade(g.id)} style={{background:"none",border:"none",cursor:"pointer",padding:"4px",color:theme.danger}}><Icon name="trash" size={14} color={theme.danger}/></button>
                      </div>
                      <input defaultValue={g.notes} onBlur={e=>updateGrade(g.id,{notes:e.target.value})} placeholder="Notes (optional)..." style={{width:"100%",padding:"5px 8px",background:theme.bgInput,border:"1px solid "+theme.border,borderRadius:6,color:theme.textSecondary,fontSize:11,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lessons */}
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:12,color:theme.textMuted,fontWeight:600,letterSpacing:0.5}}>LESSONS ({studentLessons.length})</div>
                {studentLessons.length>0&&(
                  <button onClick={()=>{setBulkDeleteMode(!bulkDeleteMode);bulkDeleteIdsRef.current=[];setBulkDeleteCount(0);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,fontWeight:600,color:bulkDeleteMode?theme.accent:theme.textMuted,fontFamily:"'DM Sans',sans-serif"}}>
                    {bulkDeleteMode?"Done":"Bulk Delete"}
                  </button>
                )}
              </div>
              {bulkDeleteMode&&bulkDeleteCount>0&&(
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10,padding:"8px 12px",background:theme.dangerBg,borderRadius:10,border:"1px solid "+theme.danger+"44"}}>
                  <span style={{fontSize:12,color:theme.danger,fontWeight:600,flex:1}}>{bulkDeleteCount} selected</span>
                  <button onClick={()=>{const ids=[...bulkDeleteIdsRef.current];if(ids.length===0) return;setStore(s=>({...s,lessons:s.lessons.filter(l=>!ids.includes(l.id))}));addToast(ids.length+" lessons deleted");bulkDeleteIdsRef.current=[];setBulkDeleteCount(0);setBulkDeleteMode(false);}} style={{padding:"4px 12px",borderRadius:6,border:"none",background:theme.danger,color:"white",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Delete</button>
                </div>
              )}
              {studentLessons.length===0&&<div style={{fontSize:13,color:theme.textMuted,padding:"8px 0"}}>No lessons yet</div>}
              {studentLessons.map(l=>(
                <div key={l.id} style={{padding:"10px 0",borderBottom:"1px solid "+theme.border,cursor:"pointer",display:"flex",gap:10,alignItems:"flex-start"}} onClick={e=>{
                  if(bulkDeleteMode){
                    const ids=bulkDeleteIdsRef.current;const isSel=ids.includes(l.id);
                    bulkDeleteIdsRef.current=isSel?ids.filter(x=>x!==l.id):[...ids,l.id];
                    setBulkDeleteCount(bulkDeleteIdsRef.current.length);
                  } else {
                    setReturnToStudentId(selectedStudent.id);setSelectedStudent(null);setSelectedLesson(l);setEditingLesson(false);
                  }
                }}>
                  {bulkDeleteMode&&(
                    <div style={{width:20,height:20,borderRadius:5,border:"2px solid "+(bulkDeleteIdsRef.current.includes(l.id)?theme.danger:theme.borderLight),background:bulkDeleteIdsRef.current.includes(l.id)?theme.danger:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:4}}>
                      {bulkDeleteIdsRef.current.includes(l.id)&&<Icon name="check" size={12} color="white"/>}
                    </div>
                  )}
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:500}}>{l.subject}</div>
                        <div style={{fontSize:11,color:theme.textMuted}}>{formatDate(l.date)} · {formatTime(l.date)} · {l.duration} min{l.excludeFromBilling?" · Excluded from billing":""}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <Badge text={l.status} color={getStatusColor(l.status,theme)} bg={getStatusBg(l.status,theme)}/>
                        {!bulkDeleteMode&&<Icon name="chevRight" size={14} color={theme.textMuted}/>}
                      </div>
                    </div>
                    {l.comment&&<div style={{fontSize:11,color:theme.textSecondary,paddingLeft:8,borderLeft:"2px solid "+theme.borderLight,marginBottom:4}}>{l.comment}</div>}
                    {l.homework&&<div style={{fontSize:11,color:theme.info,paddingLeft:8,borderLeft:"2px solid "+theme.info+"44"}}>HW: {l.homework}</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        ):(
          <>
            <Input label="Student Name" value={studentEditForm.name} onChange={v=>uf("name",v)}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <Select label="Level" value={LEVEL_OPTIONS.find(o=>o.value===studentEditForm.level)?studentEditForm.level:"other"} onChange={v=>uf("level",v)} options={LEVEL_OPTIONS}/>
                {(studentEditForm.level==="other"||!LEVEL_OPTIONS.find(o=>o.value===studentEditForm.level))&&<Input placeholder="Specify level" value={studentEditForm.levelCustom} onChange={v=>uf("levelCustom",v)}/>}
              </div>
              <div>
                <Select label="Stream" value={STREAM_OPTIONS.find(o=>o.value===studentEditForm.stream)?studentEditForm.stream:"other"} onChange={v=>uf("stream",v)} options={STREAM_OPTIONS}/>
                {(studentEditForm.stream==="other"||!STREAM_OPTIONS.find(o=>o.value===studentEditForm.stream))&&<Input placeholder="Specify stream" value={studentEditForm.streamCustom} onChange={v=>uf("streamCustom",v)}/>}
              </div>
            </div>
            <Input label="Parent Name" value={studentEditForm.parent} onChange={v=>uf("parent",v)}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Input label="Phone" value={studentEditForm.parentPhone} onChange={v=>uf("parentPhone",v)}/>
              <Input label="Email" value={studentEditForm.parentEmail} onChange={v=>uf("parentEmail",v)}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Input label="Hourly Rate ($)" type="number" value={studentEditForm.hourlyRate} onChange={v=>uf("hourlyRate",v)}/>
              <Select label="Billing Mode" value={studentEditForm.billingMode||"monthly"} onChange={v=>uf("billingMode",v)} options={[{value:"monthly",label:"Monthly"},{value:"per-lesson",label:"Per Lesson"}]}/>
            </div>
            <Select label="Status" value={studentEditForm.status} onChange={v=>uf("status",v)} options={[{value:"active",label:"Active"},{value:"trial",label:"Trial"},{value:"paused",label:"Paused"},{value:"graduated",label:"Graduated"}]}/>
            <Input label="Address" value={studentEditForm.address} onChange={v=>uf("address",v)}/>
            <Input label="Notes" value={studentEditForm.notes} onChange={v=>uf("notes",v)} multiline/>
            <div style={{display:"flex",gap:8,marginBottom:16}}><Button size="sm" icon="check" onClick={saveEdit}>Save Changes</Button><Button size="sm" variant="secondary" onClick={()=>setEditingStudent(false)}>Cancel</Button></div>
          </>
        )}

        {!editingStudent&&(
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <Button size="sm" icon="edit" variant="secondary" onClick={startEdit}>Edit</Button>
            <Button size="sm" icon="calendar" onClick={()=>{setPrefillStudentId(selectedStudent.id);setSelectedStudent(null);setShowNewLesson(true);}}>Schedule Lesson</Button>
            <Button size="sm" variant="ghost" icon="message" onClick={()=>{setSelectedStudent(null);setShowMessageCompose(selectedStudent.id);}}>Message Parent</Button>
            {selectedStudent.status!=="graduated"&&(
              <Button size="sm" variant="secondary" icon="graduation" onClick={()=>{updateStudent(selectedStudent.id,{status:"graduated"});setSelectedStudent({...selectedStudent,status:"graduated"});addToast(selectedStudent.name+" marked as graduated");}}>Graduate</Button>
            )}
            <Button size="sm" variant="ghost" icon="trash" onClick={()=>{if(window.confirm("Delete "+selectedStudent.name+" and all their data?")){deleteStudent(selectedStudent.id);setSelectedStudent(null);addToast("Student deleted");}}} style={{color:theme.danger}}>Delete</Button>
          </div>
        )}
      </Modal>
    );
  }, [selectedStudent, store.lessons, theme, editingStudent, studentEditForm, bulkDeleteMode, bulkDeleteCount, getStudent, updateStudent, deleteStudent, addToast]);

  // ═══════════════════════════════════════════════════════
  // LESSON DETAIL MODAL (inline)
  // ═══════════════════════════════════════════════════════
  const LessonDetailModal = useCallback(() => {
    if (!selectedLesson) return null;
    return (
      <Modal open={!!selectedLesson} onClose={()=>{const rt=returnToStudentId;setSelectedLesson(null);setEditingLesson(false);if(rt){const st=store.students.find(s=>s.id===rt);if(st) setSelectedStudent(st);setReturnToStudentId(null);}}} title={editingLesson?"Edit Lesson":"Lesson Details"}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <Avatar initials={lessonDetailStudent?lessonDetailStudent.avatar:"?"} size={48}/>
          <div>
            <div style={{fontWeight:700,fontSize:16}}>{lessonDetailStudent?lessonDetailStudent.name:"Unknown"}</div>
            <div style={{color:theme.textSecondary,fontSize:13}}>{lessonDetailStudent?lessonDetailStudent.level+" · "+lessonDetailStudent.stream:""}</div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
            <Badge text={selectedLesson.status} color={getStatusColor(selectedLesson.status,theme)} bg={getStatusBg(selectedLesson.status,theme)}/>
            {!editingLesson&&<button onClick={startLessonEdit} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Icon name="edit" size={16} color={theme.accent}/></button>}
          </div>
        </div>

        {!editingLesson?(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              <div style={{padding:12,background:theme.bgInput,borderRadius:10}}><div style={{fontSize:11,color:theme.textMuted,fontWeight:600,marginBottom:2}}>DATE</div><div style={{fontSize:14,fontWeight:600}}>{formatDate(selectedLesson.date)}</div></div>
              <div style={{padding:12,background:theme.bgInput,borderRadius:10}}><div style={{fontSize:11,color:theme.textMuted,fontWeight:600,marginBottom:2}}>TIME</div><div style={{fontSize:14,fontWeight:600}}>{formatTime(selectedLesson.date)}</div></div>
              <div style={{padding:12,background:theme.bgInput,borderRadius:10}}><div style={{fontSize:11,color:theme.textMuted,fontWeight:600,marginBottom:2}}>DURATION</div><div style={{fontSize:14,fontWeight:600}}>{selectedLesson.duration} min</div></div>
              <div style={{padding:12,background:theme.bgInput,borderRadius:10}}><div style={{fontSize:11,color:theme.textMuted,fontWeight:600,marginBottom:2}}>LOCATION</div><div style={{fontSize:14,fontWeight:600}}>{selectedLesson.location}</div></div>
            </div>
            <div style={{padding:12,background:theme.bgInput,borderRadius:10,marginBottom:16}}><div style={{fontSize:11,color:theme.textMuted,fontWeight:600,marginBottom:2}}>SUBJECT</div><div style={{fontSize:14,fontWeight:600}}>{selectedLesson.subject}</div></div>
          </>
        ):(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Input label="Date" type="date" value={lessonEdit.date} onChange={v=>le("date",v)}/>
              <Input label="Time" type="time" value={lessonEdit.time} onChange={v=>le("time",v)}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <Select label="Duration" value={lessonEdit.duration} onChange={v=>le("duration",v)} options={DURATION_OPTIONS}/>
                {lessonEdit.duration==="custom"&&<Input label="Custom (minutes)" type="number" value={lessonEdit.customDuration||""} onChange={v=>le("customDuration",v)} placeholder="e.g. 75"/>}
              </div>
              <Select label="Location" value={lessonEdit.location} onChange={v=>le("location",v)} options={[{value:"Home Studio",label:"Home Studio"},{value:"Online — Zoom",label:"Online — Zoom"},{value:"Student's Home",label:"Student's Home"}]}/>
            </div>
            <Input label="Subject / Topic" value={lessonEdit.subject} onChange={v=>le("subject",v)}/>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <Button size="sm" icon="check" onClick={saveLessonEdit}>Save Changes</Button>
              <Button size="sm" variant="secondary" onClick={()=>setEditingLesson(false)}>Cancel</Button>
            </div>
          </>
        )}

        {/* Feedback */}
        <div style={{marginBottom:16}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:theme.textSecondary,marginBottom:6,letterSpacing:0.5,textTransform:"uppercase"}}>Session Feedback / Notes</label>
          <textarea key={selectedLesson.id+"-fb"} defaultValue={selectedLesson.comment||""} onBlur={e=>{const val=e.target.value;if(val!==(selectedLesson.comment||"")){updateLesson(selectedLesson.id,{comment:val});setSelectedLesson({...selectedLesson,comment:val});addToast("Feedback saved");}}} placeholder="Add feedback for this session..." rows={3} style={{width:"100%",padding:"10px 14px",background:theme.bgInput,border:"1px solid "+theme.border,borderRadius:10,color:theme.text,outline:"none",fontSize:13,fontFamily:"'DM Sans',sans-serif",resize:"vertical"}}/>
          <div style={{fontSize:11,color:theme.textMuted,marginTop:4,display:"flex",alignItems:"center",gap:4}}><Icon name="eye" size={11} color={theme.textMuted}/>Appears in AI-generated fee invoice to parents.</div>
        </div>

        {/* Homework */}
        <div style={{marginBottom:16}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:theme.textSecondary,marginBottom:6,letterSpacing:0.5,textTransform:"uppercase"}}>Homework Assigned</label>
          <textarea key={selectedLesson.id+"-hw"} defaultValue={selectedLesson.homework||""} onBlur={e=>{const val=e.target.value;if(val!==(selectedLesson.homework||"")){updateLesson(selectedLesson.id,{homework:val});setSelectedLesson({...selectedLesson,homework:val});addToast("Homework saved");}}} placeholder="Homework assigned this session..." rows={2} style={{width:"100%",padding:"10px 14px",background:theme.bgInput,border:"1px solid "+theme.border,borderRadius:10,color:theme.text,outline:"none",fontSize:13,fontFamily:"'DM Sans',sans-serif",resize:"vertical"}}/>
          <div style={{fontSize:11,color:theme.textMuted,marginTop:4}}>Appears in Homework Summary template. Not in fee invoices.</div>
        </div>

        {/* Exclude from billing */}
        <div style={{marginBottom:20,display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:theme.bgInput,borderRadius:10,border:"1px solid "+theme.border}}>
          <button onClick={()=>{const v=!selectedLesson.excludeFromBilling;updateLesson(selectedLesson.id,{excludeFromBilling:v});setSelectedLesson({...selectedLesson,excludeFromBilling:v});addToast(v?"Excluded from billing":"Included in billing");}} style={{width:40,height:22,borderRadius:11,border:"none",background:selectedLesson.excludeFromBilling?theme.danger:theme.borderLight,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
            <div style={{width:18,height:18,borderRadius:9,background:"white",position:"absolute",top:2,left:selectedLesson.excludeFromBilling?20:2,transition:"left 0.2s"}}/>
          </button>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:selectedLesson.excludeFromBilling?theme.danger:theme.textSecondary}}>Exclude from billing</div>
            <div style={{fontSize:11,color:theme.textMuted}}>Toggle for intro/agency/waived sessions — also excluded from AI invoice</div>
          </div>
        </div>

        {/* Actions */}
        {!editingLesson&&(
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {(selectedLesson.status==="confirmed"||selectedLesson.status==="pending")&&<Button size="sm" variant="success" icon="check" onClick={()=>{updateLesson(selectedLesson.id,{status:"completed"});setSelectedLesson({...selectedLesson,status:"completed"});addToast("Marked completed");}}>Completed</Button>}
            {selectedLesson.status==="pending"&&<Button size="sm" icon="check" onClick={()=>{updateLesson(selectedLesson.id,{status:"confirmed"});setSelectedLesson({...selectedLesson,status:"confirmed"});addToast("Confirmed");}} style={{background:theme.infoBg,color:theme.info,border:"none",borderRadius:10,cursor:"pointer"}}>Confirm</Button>}
            {selectedLesson.status!=="cancelled"&&selectedLesson.status!=="completed"&&<Button size="sm" variant="danger" icon="x" onClick={()=>{updateLesson(selectedLesson.id,{status:"cancelled"});setSelectedLesson({...selectedLesson,status:"cancelled"});addToast("Lesson cancelled");}}>Cancel</Button>}
            {(selectedLesson.status==="cancelled"||selectedLesson.status==="completed")&&<Button size="sm" variant="secondary" icon="repeat" onClick={()=>{updateLesson(selectedLesson.id,{status:"confirmed"});setSelectedLesson({...selectedLesson,status:"confirmed"});addToast("Reverted to confirmed");}}>Revert</Button>}
            <Button size="sm" variant="ghost" icon="message" onClick={()=>{setSelectedLesson(null);if(lessonDetailStudent) setShowMessageCompose(selectedLesson.studentId);}}>Message Parent</Button>
            <Button size="sm" variant="ghost" icon="trash" onClick={handleDeleteLesson} style={{color:theme.danger}}>Delete</Button>
          </div>
        )}
      </Modal>
    );
  }, [selectedLesson, lessonDetailStudent, editingLesson, lessonEdit, theme, returnToStudentId, store.students, updateLesson, addToast, startLessonEdit, saveLessonEdit, le, handleDeleteLesson]);

  // ═══════════════════════════════════════════════════════
  // NEW STUDENT MODAL (inline to prevent reset)
  // ═══════════════════════════════════════════════════════
  const NewStudentModal = useCallback(() => {
    if (!showNewStudent) return null;
    const uf=(k,v)=>setNewStudentForm(f=>({...f,[k]:v}));
    return (
      <Modal open={showNewStudent} onClose={()=>setShowNewStudent(false)} title="Add New Student">
        <Input label="Student Name" value={newStudentForm.name} onChange={v=>uf("name",v)} placeholder="Full name"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            <Select label="Level" value={newStudentForm.level} onChange={v=>uf("level",v)} options={LEVEL_OPTIONS}/>
            {newStudentForm.level==="other"&&<Input placeholder="Specify level" value={newStudentForm.levelCustom} onChange={v=>uf("levelCustom",v)}/>}
          </div>
          <div>
            <Select label="Stream" value={newStudentForm.stream} onChange={v=>uf("stream",v)} options={STREAM_OPTIONS}/>
            {newStudentForm.stream==="other"&&<Input placeholder="Specify stream" value={newStudentForm.streamCustom} onChange={v=>uf("streamCustom",v)}/>}
          </div>
        </div>
        <Input label="Parent Name" value={newStudentForm.parent} onChange={v=>uf("parent",v)} placeholder="Parent/Guardian name"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Input label="Phone" value={newStudentForm.parentPhone} onChange={v=>uf("parentPhone",v)} placeholder="+65 9XXX XXXX"/>
          <Input label="Email" value={newStudentForm.parentEmail} onChange={v=>uf("parentEmail",v)} placeholder="email@example.com"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Input label="Hourly Rate ($)" type="number" value={newStudentForm.hourlyRate} onChange={v=>uf("hourlyRate",v)}/>
          <Select label="Billing Mode" value={newStudentForm.billingMode} onChange={v=>uf("billingMode",v)} options={[{value:"monthly",label:"Monthly"},{value:"per-lesson",label:"Per Lesson"}]}/>
        </div>
        <Input label="Address" value={newStudentForm.address} onChange={v=>uf("address",v)} placeholder="Student's home address"/>
        <Input label="Notes" value={newStudentForm.notes} onChange={v=>uf("notes",v)} multiline placeholder="Any notes about the student..."/>
        <div style={{display:"flex",gap:8}}>
          <Button onClick={()=>{
            if(!newStudentForm.name){addToast("Please enter student name","error");return;}
            const finalLevel=newStudentForm.level==="other"?newStudentForm.levelCustom:newStudentForm.level;
            const finalStream=newStudentForm.stream==="other"?newStudentForm.streamCustom:newStudentForm.stream;
            const initials=newStudentForm.name.split(" ").map(w=>w[0]).join("").toUpperCase().substring(0,2);
            addStudent({name:newStudentForm.name,level:finalLevel,stream:finalStream,parent:newStudentForm.parent,parentPhone:newStudentForm.parentPhone,parentEmail:newStudentForm.parentEmail,hourlyRate:parseFloat(newStudentForm.hourlyRate)||70,billingMode:newStudentForm.billingMode,address:newStudentForm.address,status:"trial",joinDate:new Date().toISOString().split("T")[0],notes:newStudentForm.notes,avatar:initials,grades:[]});
            setNewStudentForm({name:"",level:"P5",levelCustom:"",stream:"小学普华",streamCustom:"",parent:"",parentPhone:"",parentEmail:"",hourlyRate:"70",billingMode:"monthly",address:"",notes:""});
            setShowNewStudent(false);
          }}>Add Student</Button>
          <Button variant="secondary" onClick={()=>setShowNewStudent(false)}>Cancel</Button>
        </div>
      </Modal>
    );
  }, [showNewStudent, newStudentForm, addStudent, addToast]);

  // ═══════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════
  const NotificationsPanel = useCallback(() => (
    <Modal open={showNotif} onClose={()=>setShowNotif(false)} title="Notifications" width={380}>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {store.notifications.map(n=>(
          <div key={n.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:12,background:n.read?"transparent":theme.accentBg,borderRadius:10,border:`1px solid ${n.read?theme.border:theme.accent+"33"}`}}>
            <div style={{width:8,height:8,borderRadius:4,background:n.read?"transparent":theme.accent,marginTop:6,flexShrink:0}}/>
            <div><div style={{fontSize:13,fontWeight:n.read?400:600,lineHeight:1.4}}>{n.text}</div><div style={{fontSize:11,color:theme.textMuted,marginTop:2}}>{n.time}</div></div>
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm" style={{marginTop:12,width:"100%"}} onClick={()=>{setStore(s=>({...s,notifications:s.notifications.map(n=>({...n,read:true}))}));addToast("All marked as read");}}>Mark all as read</Button>
    </Modal>
  ), [showNotif, store.notifications, theme, addToast]);

  // ═══════════════════════════════════════════════════════
  // NAV + RENDER
  // ═══════════════════════════════════════════════════════
  const navItems=[
    {id:"home",icon:"home",label:"Home"},
    {id:"schedule",icon:"calendar",label:"Schedule"},
    {id:"students",icon:"users",label:"Students"},
    {id:"payments",icon:"dollar",label:"Fees"},
    {id:"admin",icon:"chart",label:"Admin"},
  ];

  // Render pages inline (not as <Component/>) to prevent remounts when now ticks
  const renderPage = () => {
    if (page==="home") return HomePage();
    if (page==="schedule") return SchedulePage();
    if (page==="students") return StudentsPage();
    if (page==="payments") return PaymentsPage();
    if (page==="admin") return AdminPage();
    return null;
  };

  return (
    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:theme.bg,position:"relative",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{css(theme)}</style>

      {/* Top Bar */}
      <div style={{position:"sticky",top:0,zIndex:100,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(10,14,23,0.9)",backdropFilter:"blur(12px)",borderBottom:`1px solid ${theme.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${theme.accent},${theme.accentDark})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:theme.bg}}>TP</div>
          <div>
            <div style={{fontSize:15,fontWeight:700,letterSpacing:-0.3}}>TutorPulse</div>
            <div style={{fontSize:9,color:theme.textMuted,fontWeight:600,letterSpacing:1.5,textTransform:"uppercase"}}>智教通</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={()=>setShowAI(true)} style={{background:"none",border:"none",cursor:"pointer",padding:4,color:theme.purple}}><Icon name="ai" size={22} color={theme.purple}/></button>
          <button onClick={()=>setShowNotif(true)} style={{background:"none",border:"none",cursor:"pointer",padding:4,position:"relative"}}>
            <Icon name="bell" size={22} color={theme.textSecondary}/>
            {unreadNotifs>0&&<span style={{position:"absolute",top:0,right:0,width:16,height:16,borderRadius:8,background:theme.danger,color:"white",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{unreadNotifs}</span>}
          </button>
        </div>
      </div>

      {/* Page */}
      <div style={{padding:"20px 16px 100px"}}>{renderPage()}</div>

      {/* Bottom Nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,padding:"8px 12px 12px",background:"rgba(10,14,23,0.95)",backdropFilter:"blur(16px)",borderTop:`1px solid ${theme.border}`,display:"flex",justifyContent:"space-around",zIndex:100}}>
        {navItems.map(item=>(
          <button key={item.id} onClick={()=>setPage(item.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 12px",background:"none",border:"none",cursor:"pointer",transition:"all 0.2s",borderRadius:12}}>
            <Icon name={item.icon} size={20} color={page===item.id?theme.accent:theme.textMuted}/>
            <span style={{fontSize:10,fontWeight:page===item.id?700:500,color:page===item.id?theme.accent:theme.textMuted,letterSpacing:0.3}}>{item.label}</span>
            {page===item.id&&<div style={{width:4,height:4,borderRadius:2,background:theme.accent,marginTop:-1}}/>}
          </button>
        ))}
      </div>

      {/* Toasts */}
      <div style={{position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",zIndex:2000,display:"flex",flexDirection:"column",gap:8,width:"90%",maxWidth:400}}>
        {toasts.map(toast=>(
          <div key={toast.id} className="slide-up" style={{padding:"12px 16px",borderRadius:12,background:toast.type==="error"?theme.dangerBg:toast.type==="undo"?theme.warningBg:theme.successBg,border:`1px solid ${toast.type==="error"?theme.danger+"44":toast.type==="undo"?theme.warning+"44":theme.success+"44"}`,color:toast.type==="error"?theme.danger:toast.type==="undo"?theme.warning:theme.success,fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:8,backdropFilter:"blur(8px)"}}>
            <Icon name={toast.type==="error"?"x":toast.type==="undo"?"repeat":"check"} size={16}/>
            <span style={{flex:1}}>{toast.msg}</span>
            {toast.type==="undo"&&toast.undoData&&(
              <button onClick={()=>{setStore(s=>({...s,lessons:[...s.lessons,toast.undoData]}));setToasts(t=>t.filter(x=>x.id!==toast.id));addToast("Lesson restored");}} style={{padding:"4px 12px",borderRadius:6,border:"1px solid "+theme.warning,background:"transparent",color:theme.warning,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Undo</button>
            )}
          </div>
        ))}
      </div>

      {/* Modals */}
      <LessonDetailModal/>
      <NewLessonModal/>
      <NewStudentModal/>
      <StudentDetailModal/>
      {showMessageCompose&&<MessageComposeModal/>}
      <AIAssistantModal/>
      <NotificationsPanel/>
    </div>
  );
}

