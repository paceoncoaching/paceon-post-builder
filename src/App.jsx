import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Trash2, ArrowUp, ArrowDown, Repeat, Image as ImageIcon, Video,
  Download, Save, FolderOpen, Sparkles, MessageSquare, Layers,
  Bookmark, X, Copy, Eye, EyeOff, Move, Palette, FileText,
  ChevronDown, ChevronUp, Tag,
} from 'lucide-react';

/* =========================================================================
   PaceOn Workout Post Builder
   Brand: PaceOn — Evidence-driven performance coaching
   Colours: #ffffff, #6a714b, #c85103, #000000
   Fonts: League Spartan (display), Roboto (body)
   ========================================================================= */

const BRAND = {
  white: '#ffffff',
  olive: '#6a714b',
  orange: '#c85103',
  black: '#000000',
  paper: '#f5f3ee',
  ink: '#1a1a1a',
  muted: '#8a8a85',
  line: '#e3e0d8',
  panel: '#fafaf7',
};

// Cycling zones (Coggan 7-zone)
const ZONES_CYCLING = [
  { id: 1, name: 'Z1 Recovery',     low: 0,   high: 55,  color: '#cfd1c4' },
  { id: 2, name: 'Z2 Endurance',    low: 56,  high: 75,  color: '#9da38a' },
  { id: 3, name: 'Z3 Tempo',        low: 76,  high: 90,  color: '#6a714b' },
  { id: 4, name: 'Z4 Threshold',    low: 91,  high: 105, color: '#c85103' },
  { id: 5, name: 'Z5 VO2 Max',      low: 106, high: 120, color: '#a13d00' },
  { id: 6, name: 'Z6 Anaerobic',    low: 121, high: 150, color: '#7a2d00' },
  { id: 7, name: 'Z7 Neuromuscular',low: 151, high: 999, color: '#4a1c00' },
];

const ZONES_RUNNING = [
  { id: 1, name: 'Z1 Recovery',  low: 0,   high: 80,  color: '#cfd1c4' },
  { id: 2, name: 'Z2 Easy',      low: 81,  high: 89,  color: '#9da38a' },
  { id: 3, name: 'Z3 Steady',    low: 90,  high: 94,  color: '#6a714b' },
  { id: 4, name: 'Z4 Threshold', low: 95,  high: 105, color: '#c85103' },
  { id: 5, name: 'Z5 VO2/Speed', low: 106, high: 999, color: '#a13d00' },
];

// Style presets — sensible defaults for each annotation type, fully overridable
const ANNOTATION_PRESETS = {
  coach:    { label: "Coach's Tip",    bg: '#ffffff', text: '#1a1a1a', accent: '#c85103', accentBar: true,  arrowStyle: 'solid' },
  science:  { label: 'Science Note',   bg: '#ffffff', text: '#1a1a1a', accent: '#6a714b', accentBar: true,  arrowStyle: 'solid' },
  mistake:  { label: 'Common Mistake', bg: '#fff4ef', text: '#1a1a1a', accent: '#7a2d00', accentBar: true,  arrowStyle: 'solid' },
  cue:      { label: 'Execution Cue',  bg: '#1a1a1a', text: '#ffffff', accent: '#c85103', accentBar: true,  arrowStyle: 'dashed' },
};

const ARROW_STYLES = {
  solid:  { label: 'Solid',  dash: [] },
  dashed: { label: 'Dashed', dash: [12, 8] },
  dotted: { label: 'Dotted', dash: [2, 6] },
};

const ARROW_HEADS = {
  filled: { label: 'Filled' },
  open:   { label: 'Open' },
  none:   { label: 'None' },
};

const FORMATS = {
  story:    { label: 'Story 9:16', w: 1080, h: 1920 },
  square:   { label: 'Post 1:1',   w: 1080, h: 1080 },
  portrait: { label: 'Post 4:5',   w: 1080, h: 1350 },
};

const LAYOUTS = {
  graphLed:       { label: 'Graph-led' },
  descriptionLed: { label: 'Description-led' },
  athleteSpot:    { label: 'Athlete spotlight' },
};

const GRAPH_STYLES = {
  stepped:  { label: 'Stepped' },
  block:    { label: 'Block' },
  gradient: { label: 'Gradient' },
  outlined: { label: 'Outlined' },
};

// Default position offsets (all in -1..1 range, 0 = layout default)
const DEFAULT_POSITIONS = {
  titleY: 0,           // shift title block up/down
  graphY: 0,           // shift graph up/down (independent of title)
  graphHeight: 0,      // grow/shrink graph
  descriptionY: 0,     // shift description block up/down
  metricsY: 0,         // shift metrics row up/down
};

// Robust unique ID — uses crypto.randomUUID where available, falls back to
// timestamp + counter + random to guarantee uniqueness even in older runtimes.
let _ridCounter = 0;
function rid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  _ridCounter = (_ridCounter + 1) % 1000000;
  const t = Date.now().toString(36);
  const c = _ridCounter.toString(36).padStart(4, '0');
  const r = Math.random().toString(36).slice(2).padStart(8, '0').slice(0, 8);
  return `${t}-${c}-${r}`;
}
function seg(label, duration, low, high) {
  return {
    id: rid(), type: 'segment', label, duration,
    intensityLow: low, intensityHigh: high,
    labelConfig: { show: 'auto', offsetX: 0, offsetY: 0, color: null, subColor: null, size: 1.0, showIntensity: true, showTime: true },
  };
}

const PRESETS = {
  cycling: [
    {
      name: 'Sweet Spot 2×20',
      title: 'Sweet Spot 2×20',
      segments: [
        seg('Warm Up', 15, 50, 65),
        { id: rid(), type: 'repeat', count: 2, children: [
          seg('Sweet Spot', 20, 88, 94),
          seg('Recovery', 5, 50, 60),
        ]},
        seg('Cool Down', 10, 50, 60),
      ],
      description: 'Two sustained efforts in the sweet spot zone — high enough to drive aerobic adaptation, low enough to repeat. Hold steady power, smooth cadence (88–95), focus on relaxed shoulders.',
    },
    {
      name: 'VO2 4×4',
      title: 'VO2 Max 4×4',
      segments: [
        seg('Warm Up', 15, 50, 65),
        { id: rid(), type: 'repeat', count: 4, children: [
          seg('VO2 Effort', 4, 110, 118),
          seg('Recovery', 4, 50, 60),
        ]},
        seg('Cool Down', 10, 50, 60),
      ],
      description: 'Classic VO2 max stimulus. Four-minute efforts at maximal sustainable intensity drive central adaptations. Pace the first 30s — most athletes go out too hard and pay for it in efforts 3 and 4.',
    },
    {
      name: 'Zone 2 + Spikes',
      title: 'Zone 2 with Spikes',
      segments: [
        seg('Warm Up', 30, 50, 65),
        seg('Zone 2', 24, 70, 76),
        seg('Recovery', 2, 45, 55),
        { id: rid(), type: 'repeat', count: 3, children: [
          seg('Spike', 0.5, 120, 125),
          seg('Zone 2', 4.5, 70, 76),
        ]},
        seg('Recovery', 2, 45, 55),
        seg('Cool Down', 30, 50, 65),
      ],
      description: 'Aerobic endurance work combined with brief, high-intensity spikes to further stimulate aerobic adaptations. The goal is to maintain smooth, economical power output while managing fatigue and heart-rate drift.',
    },
    {
      name: 'Threshold 3×10',
      title: 'Threshold 3×10',
      segments: [
        seg('Warm Up', 15, 50, 65),
        { id: rid(), type: 'repeat', count: 3, children: [
          seg('Threshold', 10, 95, 102),
          seg('Recovery', 5, 50, 60),
        ]},
        seg('Cool Down', 10, 50, 60),
      ],
      description: 'Three ten-minute threshold efforts target the lactate steady state. Treat each interval as the same effort — discipline pacing on the first one, finish strong on the third.',
    },
  ],
  running: [
    {
      name: 'Easy Aerobic 60min',
      title: 'Aerobic Base 60min',
      segments: [seg('Easy', 60, 70, 80)],
      description: 'A foundational aerobic run. Conversational throughout. The goal is time on feet at low intensity — building mitochondrial density and capillarisation without accumulated fatigue.',
    },
    {
      name: 'Threshold 4×1km',
      title: 'Threshold 4×1km',
      segments: [
        seg('Warm Up', 15, 70, 80),
        { id: rid(), type: 'repeat', count: 4, children: [
          seg('1km @ Threshold', 4, 98, 102),
          seg('Recovery Jog', 2, 65, 75),
        ]},
        seg('Cool Down', 10, 65, 75),
      ],
      description: 'Four kilometre repeats at threshold pace develop lactate clearance. Aim for even splits — the test of pacing is whether your fourth rep matches your first.',
    },
    {
      name: 'VO2 5×3min',
      title: 'VO2 5×3min',
      segments: [
        seg('Warm Up', 15, 70, 80),
        { id: rid(), type: 'repeat', count: 5, children: [
          seg('Hard', 3, 108, 115),
          seg('Jog Recovery', 2, 60, 70),
        ]},
        seg('Cool Down', 10, 65, 75),
      ],
      description: 'Three-minute efforts at VO2 max stimulus. Recoveries are deliberately incomplete to keep aerobic system loaded. Hold form when fatigued — short, sharp arm drive, quick turnover.',
    },
  ],
};

// ---------- Helpers ----------
function flattenSegments(segments) {
  const flat = [];
  for (const s of segments) {
    if (s.type === 'repeat') {
      for (let i = 0; i < s.count; i++) {
        for (const child of s.children) flat.push({ ...child, _repeatId: s.id, _repeatIdx: i });
      }
    } else {
      flat.push(s);
    }
  }
  return flat;
}

function getZoneFor(intensityMid, sport) {
  const zones = sport === 'cycling' ? ZONES_CYCLING : ZONES_RUNNING;
  return zones.find(z => intensityMid >= z.low && intensityMid <= z.high) || zones[0];
}

function calculateMetrics(flatSegs, sport) {
  if (!flatSegs.length) return { totalMin: 0, ifLow: 0, ifHigh: 0, tssLow: 0, tssHigh: 0 };
  const totalMin = flatSegs.reduce((s, x) => s + x.duration, 0);
  const ifCalc = (useHigh) => {
    let weighted = 0;
    for (const s of flatSegs) {
      const i = useHigh ? s.intensityHigh : s.intensityLow;
      weighted += Math.pow(i / 100, 4) * s.duration;
    }
    return Math.pow(weighted / totalMin, 0.25);
  };
  const ifLow = ifCalc(false);
  const ifHigh = ifCalc(true);
  const hours = totalMin / 60;
  return { totalMin, ifLow, ifHigh, tssLow: hours * Math.pow(ifLow, 2) * 100, tssHigh: hours * Math.pow(ifHigh, 2) * 100 };
}

/* Layer manual overrides on top of calculated metrics. The project may carry
   `metricOverrides: { ifLow, ifHigh, tssLow, tssHigh }` where any defined
   numeric value replaces the calculated one. Empty/missing values fall back
   to the calculated number. Each metric is overridden independently — you can
   override TSS without touching IF.
   The hint values (`ifAuto`, etc) are also returned so the UI can show the
   computed value next to the override field. */
function applyMetricOverrides(calc, overrides) {
  const o = overrides || {};
  const pick = (k) => (typeof o[k] === 'number' && !Number.isNaN(o[k])) ? o[k] : calc[k];
  return {
    totalMin: calc.totalMin,
    ifLow:  pick('ifLow'),
    ifHigh: pick('ifHigh'),
    tssLow:  pick('tssLow'),
    tssHigh: pick('tssHigh'),
    // Pass through the auto-calculated values so the UI can show "auto: X.YZ"
    ifLowAuto: calc.ifLow,
    ifHighAuto: calc.ifHigh,
    tssLowAuto: calc.tssLow,
    tssHighAuto: calc.tssHigh,
    overridden: {
      ifLow:  typeof o.ifLow  === 'number',
      ifHigh: typeof o.ifHigh === 'number',
      tssLow: typeof o.tssLow === 'number',
      tssHigh: typeof o.tssHigh === 'number',
    },
  };
}

/* Format a duration (stored as decimal minutes) for display.
   - < 1min → "30s", "45s"
   - whole minutes < 60 → "5min", "20min"
   - mixed minutes/seconds → "1m 30s", "4m 30s"
   - >= 60min → "1h", "1h 30min"
   Designed to read naturally for both whole-minute steady-state work and
   sub-minute intervals (e.g. 15s, 30s spikes). */
function fmtDuration(min) {
  if (!min || min <= 0) return '0s';
  // Round to nearest second for stable display
  const totalSec = Math.round(min * 60);
  if (totalSec < 60) return `${totalSec}s`;
  if (totalSec < 3600) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec - m * 60;
    if (s === 0) return `${m}min`;
    return `${m}m ${s}s`;
  }
  const h = Math.floor(totalSec / 3600);
  const remM = Math.round((totalSec - h * 3600) / 60);
  if (remM === 0) return `${h}h`;
  return `${h}h ${remM}min`;
}

// Force any focused text input/textarea to blur, which fires its onBlur handler
// and commits any debounced edit before the caller proceeds. Call this at the
// start of any operation that reads or mutates project state in response to a
// click — add/save/load/preset/etc — to prevent races between debounced commits
// and other state updates.
function flushPendingEdits() {
  if (typeof document === 'undefined') return;
  const el = document.activeElement;
  if (el && typeof el.blur === 'function' &&
      (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
    el.blur();
  }
}

function autoDraftDescription(title, segments, sport) {
  const flat = flattenSegments(segments);
  if (!flat.length) return '';
  const { totalMin } = calculateMetrics(flat, sport);
  const zones = new Set(flat.map(s => getZoneFor((s.intensityLow + s.intensityHigh) / 2, sport).name.split(' ')[0]));
  const zoneList = Array.from(zones).join(', ');
  const intensityWord = zones.has('Z5') || zones.has('Z6') || zones.has('Z7')
    ? 'high-intensity stimulus'
    : zones.has('Z4') ? 'threshold work'
    : zones.has('Z3') ? 'tempo development'
    : 'aerobic conditioning';
  return `${title || 'This session'} delivers ${intensityWord} across ${zoneList} over ${fmtDuration(totalMin)}. The goal is to execute each interval with intent — controlled effort, smooth ${sport === 'cycling' ? 'cadence' : 'form'}, and consistent output from first to last.`;
}

function autoDraftCaption(title, segments, sport, description, metricOverrides) {
  const flat = flattenSegments(segments);
  const calc = calculateMetrics(flat, sport);
  const m = applyMetricOverrides(calc, metricOverrides);
  const ifText = m.ifLow === m.ifHigh ? m.ifLow.toFixed(2) : `${m.ifLow.toFixed(2)}–${m.ifHigh.toFixed(2)}`;
  const tssText = m.tssLow === m.tssHigh ? `${Math.round(m.tssLow)}` : `${Math.round(m.tssLow)}–${Math.round(m.tssHigh)}`;
  const tags = sport === 'cycling'
    ? '#cycling #ftp #sweetspot #vo2max #endurance #triathlon #cyclingtraining #pacelife'
    : '#running #threshold #vo2max #endurancerunning #marathon #triathlon #pacelife';
  return `${title || "This week's key session"}\n\n${description}\n\n— Duration: ${fmtDuration(m.totalMin)}\n— IF: ${ifText}\n— TSS: ${tssText}\n\nPaceOn — evidence-driven coaching for athletes balancing ambition with life.\n\n#paceon ${tags}`;
}

/* Auto-draft a detailed plan from the workout structure. Walks the segments tree
   and produces a hierarchical text breakdown — repeats become "N × ROUND" with
   their child steps indented underneath. The renderer (drawDetailedPlan) reads
   leading spaces to indent visually with bullets. */
function autoDraftDetailedPlan(segments, sport) {
  const unit = sport === 'cycling' ? '% FTP' : '% TP';
  const segLine = (s) => {
    const intensity = s.intensityLow === s.intensityHigh
      ? `${s.intensityLow}${unit}`
      : `${s.intensityLow}–${s.intensityHigh}${unit}`;
    const zone = getZoneFor((s.intensityLow + s.intensityHigh) / 2, sport);
    const zoneTag = ` (${zone.name.split(' ')[0]})`;
    return `${s.label} — ${fmtDuration(s.duration)} @ ${intensity}${zoneTag}`;
  };

  const out = [];
  segments.forEach(s => {
    if (s.type === 'repeat') {
      out.push(`**Repeat ${s.count}×**`);
      s.children.forEach(c => out.push('- ' + segLine(c)));
      out.push(''); // blank line between blocks
    } else {
      out.push(segLine(s));
    }
  });
  // Trim trailing blank lines
  while (out.length && out[out.length - 1] === '') out.pop();
  return out.join('\n');
}

// Migrate older annotations to include style fields with defaults
function migrateAnnotation(a) {
  const preset = ANNOTATION_PRESETS[a.style] || ANNOTATION_PRESETS.coach;
  return {
    bgColor: preset.bg,
    textColor: preset.text,
    accentColor: preset.accent,
    accentBar: preset.accentBar,
    arrowColor: preset.accent,
    arrowStyle: preset.arrowStyle || 'solid',
    arrowHead: 'filled',
    arrowWidth: 2,
    bubbleOpacity: 0.96,
    showLabel: true,
    customLabel: '',
    bubbleWidth: 0.4, // fraction of canvas width
    ...a,
  };
}

// Per-segment label defaults. `show: 'auto'` defers to the global rule
// (skip if segment too narrow). 'always' forces the label to render with a
// leader line if needed; 'never' suppresses it.
const DEFAULT_LABEL_CONFIG = {
  show: 'auto',          // 'auto' | 'always' | 'never'
  offsetX: 0,            // horizontal nudge in canvas units (px at 1080 wide)
  offsetY: 0,            // vertical nudge (negative = up)
  color: null,           // override intensity colour (null = white)
  subColor: null,        // override time colour (null = muted white)
  size: 1.0,             // text size multiplier (0.6 to 2.0)
  showIntensity: true,
  showTime: true,
};

function migrateSegment(s) {
  if (s.type === 'repeat') {
    return { ...s, children: (s.children || []).map(migrateSegment) };
  }
  return {
    ...s,
    labelConfig: { ...DEFAULT_LABEL_CONFIG, ...(s.labelConfig || {}) },
  };
}

function migrateProject(p) {
  return {
    detailedPlan: '',
    showGraphLabels: false,
    metricOverrides: {},
    ...p,
    segments: (p.segments || []).map(migrateSegment),
    positions: { ...DEFAULT_POSITIONS, ...(p.positions || {}) },
    annotations: (p.annotations || []).map(migrateAnnotation),
  };
}

// ---------- Canvas drawing ----------
function drawCanvas(ctx, opts) {
  const { project, format, sport, mediaEl, mediaType, hoverAnno, currentPage = 1 } = opts;
  const W = format.w, H = format.h;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = BRAND.black;
  ctx.fillRect(0, 0, W, H);

  if (mediaEl) {
    const mw = mediaType === 'video' ? mediaEl.videoWidth : mediaEl.naturalWidth;
    const mh = mediaType === 'video' ? mediaEl.videoHeight : mediaEl.naturalHeight;
    if (mw && mh) {
      const scale = Math.max(W / mw, H / mh);
      const dw = mw * scale, dh = mh * scale;
      const dx = (W - dw) / 2, dy = (H - dh) / 2;
      try { ctx.drawImage(mediaEl, dx, dy, dw, dh); } catch (e) {}
    }
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1c1d18');
    g.addColorStop(1, '#0a0a08');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  const t = project.background.tint;
  if (t > 0) {
    ctx.fillStyle = `rgba(0,0,0,${t})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (project.background.gradient) {
    const gt = project.background.gradientTop;
    const gb = project.background.gradientBottom;
    if (gt > 0) {
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.45);
      g.addColorStop(0, `rgba(0,0,0,${gt})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H * 0.45);
    }
    if (gb > 0) {
      const g = ctx.createLinearGradient(0, H * 0.55, 0, H);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(0,0,0,${gb})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, H * 0.55, W, H * 0.45);
    }
  }

  const pad = Math.round(W * 0.06);
  const pos = project.positions || DEFAULT_POSITIONS;
  drawLogo(ctx, project, W, H, pad);

  // Title + graph share identical positioning across both pages so the carousel
  // transition feels seamless. The `positions` offsets apply to both.
  const titleSize = Math.round(W * 0.072);
  const baseTitleY = pad + Math.round(W * 0.13);
  const titleY = baseTitleY + Math.round(pos.titleY * H);

  // Page indicator + kicker
  const kickSize = Math.round(W * 0.022);
  ctx.font = `600 ${kickSize}px "League Spartan", system-ui, sans-serif`;
  ctx.fillStyle = BRAND.orange;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  const kickerText = currentPage === 1
    ? `KEY SESSION  /  ${sport === 'cycling' ? 'CYCLING' : 'RUNNING'}`
    : `SESSION DETAIL  /  ${sport === 'cycling' ? 'CYCLING' : 'RUNNING'}`;
  ctx.fillText(kickerText, pad, titleY - kickSize - 12);

  // Title (same position, same content on both pages)
  ctx.font = `700 ${titleSize}px "League Spartan", system-ui, sans-serif`;
  ctx.fillStyle = BRAND.white;
  const titleLines = wrapText(ctx, (project.title || 'Workout Title').toUpperCase(), W - pad * 2, 2);
  let cy = titleY;
  titleLines.forEach(line => {
    ctx.fillText(line, pad, cy);
    cy += titleSize * 1.05;
  });

  // Graph — same position and height on both pages
  const flat = flattenSegments(project.segments);
  let baseGraphHeight;
  if (project.layout === 'graphLed') baseGraphHeight = Math.round(H * 0.32);
  else if (project.layout === 'descriptionLed') baseGraphHeight = Math.round(H * 0.22);
  else baseGraphHeight = Math.round(H * 0.20);
  const graphHeight = Math.max(120, Math.round(baseGraphHeight + pos.graphHeight * H));
  const baseGraphTop = cy + Math.round(W * 0.06);
  const graphTop = baseGraphTop + Math.round(pos.graphY * H);
  const graphRect = { x: pad, y: graphTop, w: W - pad * 2, h: graphHeight };
  drawGraph(ctx, graphRect, flat, sport, project.graphStyle, !!project.showGraphLabels);

  // Annotations only on page 2 (the detail page)
  if (currentPage === 2) {
    drawAnnotations(ctx, project.annotations, flat, graphRect, W, hoverAnno);
  }

  // Body content differs by page
  const baseBodyTop = graphTop + graphHeight + Math.round(W * 0.06);
  const bodyTop = baseBodyTop + Math.round(pos.descriptionY * H);
  if (currentPage === 1) {
    drawDescription(ctx, project.description, pad, bodyTop, W - pad * 2, W);
  } else {
    drawDetailedPlan(ctx, project.detailedPlan, pad, bodyTop, W - pad * 2, W, H);
  }

  // Metrics row + footer wordmark on both pages
  const metricsOffset = Math.round(pos.metricsY * H);
  drawCalculations(ctx, project, flat, sport, pad, H, W, metricsOffset);

  // Page indicator dots — above the metrics row, subtle
  drawPageIndicator(ctx, currentPage, W, H, pad, metricsOffset);
}

function drawPageIndicator(ctx, currentPage, W, H, pad, metricsOffset = 0) {
  const cx = W / 2;
  // Sit above the metrics block (which has height roughly W * 0.12 from the bottom)
  const totalBlockH = Math.round(W * 0.07) + Math.round(W * 0.025) + Math.round(W * 0.026);
  const y = H - pad - totalBlockH - Math.round(W * 0.025) + metricsOffset;
  const r = Math.round(W * 0.008);
  const gap = r * 3;
  for (let p = 1; p <= 2; p++) {
    const x = cx + (p === 1 ? -gap / 2 : gap / 2);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = p === currentPage ? BRAND.orange : 'rgba(255,255,255,0.35)';
    ctx.fill();
  }
}

function wrapText(ctx, text, maxWidth, maxLines) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    } else {
      current = test;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

function wrapTextAll(ctx, text, maxWidth) {
  const paragraphs = text.split('\n');
  const lines = [];
  for (const p of paragraphs) {
    const words = p.split(' ');
    let current = '';
    for (const word of words) {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function drawLogo(ctx, project, W, H, pad) {
  const logo = project.logo;
  const logoSize = Math.round(W * 0.075);
  const x = pad;
  const y = pad;
  if (logo.image) {
    const aspect = logo.image.naturalWidth / logo.image.naturalHeight;
    const logoH = logoSize;
    const logoW = logoH * aspect;
    try { ctx.drawImage(logo.image, x, y, logoW, logoH); } catch (e) {}
  } else {
    // Fallback wordmark if image hasn't loaded yet
    ctx.fillStyle = BRAND.white;
    ctx.font = `800 ${Math.round(W * 0.05)}px "League Spartan", system-ui, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText('PACE', x, y);
    ctx.fillStyle = BRAND.orange;
    ctx.fillText('ON', x + ctx.measureText('PACE').width, y);
  }
}

function drawGraph(ctx, rect, flatSegs, sport, style, showLabels = false) {
  const { x, y, w, h } = rect;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 8);
  ctx.stroke();

  if (!flatSegs.length) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `400 ${Math.round(w * 0.025)}px Roboto, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Add segments to build the session graph', x + w / 2, y + h / 2);
    return;
  }

  const totalMin = flatSegs.reduce((s, x) => s + x.duration, 0);
  const maxIntensity = Math.max(140, ...flatSegs.map(s => s.intensityHigh));
  const minPx = 1;
  const axisPad = Math.round(h * 0.12);
  // Reserve headroom for above-bar labels. If any segments are forced to 'always'
  // show labels but are too narrow for inline placement, leader mode kicks in
  // and the labels stack higher — give them more room.
  const baseLabelSize = Math.round(w * 0.018);
  const minWidthForInline = Math.max(38, baseLabelSize * 3.5);
  const hasLeaderLabels = showLabels && flatSegs.some(s => {
    const cfg = s.labelConfig;
    if (!cfg || cfg.show !== 'always') return false;
    const segW = (s.duration / Math.max(1, flatSegs.reduce((a, x) => a + x.duration, 0))) * (w - 16);
    return segW < minWidthForInline;
  });
  const labelPad = showLabels ? Math.round(h * (hasLeaderLabels ? 0.32 : 0.18)) : 0;
  const innerY = y + 8 + labelPad;
  const innerH = h - axisPad - 8 - labelPad;
  const innerX = x + 8;
  const innerW = w - 16;

  const zones = sport === 'cycling' ? ZONES_CYCLING : ZONES_RUNNING;
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  zones.forEach(z => {
    if (z.high < 250 && z.high <= maxIntensity) {
      const yLine = innerY + innerH - (z.high / maxIntensity) * innerH;
      ctx.beginPath();
      ctx.moveTo(innerX, yLine);
      ctx.lineTo(innerX + innerW, yLine);
      ctx.stroke();
    }
  });
  ctx.setLineDash([]);

  // First pass: draw the bars and capture label-anchor positions
  const labelAnchors = [];
  let cx = innerX;
  flatSegs.forEach((s) => {
    const segW = Math.max(minPx, (s.duration / totalMin) * innerW);
    const mid = (s.intensityLow + s.intensityHigh) / 2;
    const zone = getZoneFor(mid, sport);
    const lowH = (s.intensityLow / maxIntensity) * innerH;
    const highH = (s.intensityHigh / maxIntensity) * innerH;
    const useH = (mid / maxIntensity) * innerH;

    const drawX = cx + (style === 'block' ? 2 : 0);
    const drawW = segW - (style === 'block' ? 4 : 0);
    const isRange = (s.intensityHigh - s.intensityLow) > 5;

    if (style === 'gradient') {
      const grd = ctx.createLinearGradient(0, innerY + innerH - useH, 0, innerY + innerH);
      grd.addColorStop(0, zone.color);
      grd.addColorStop(1, shade(zone.color, -25));
      ctx.fillStyle = grd;
      ctx.fillRect(drawX, innerY + innerH - useH, drawW, useH);
    } else if (style === 'outlined') {
      ctx.strokeStyle = zone.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(drawX, innerY + innerH - useH, drawW, useH);
    } else if (isRange) {
      ctx.fillStyle = zone.color;
      ctx.fillRect(drawX, innerY + innerH - lowH, drawW, lowH);
      ctx.fillStyle = hexA(zone.color, 0.45);
      ctx.fillRect(drawX, innerY + innerH - highH, drawW, highH - lowH);
    } else {
      ctx.fillStyle = zone.color;
      ctx.fillRect(drawX, innerY + innerH - useH, drawW, useH);
    }

    if (style !== 'outlined') {
      ctx.fillStyle = hexA(shade(zone.color, 30), 0.7);
      ctx.fillRect(drawX, innerY + innerH - highH, drawW, 2);
    }

    labelAnchors.push({ centreX: cx + segW / 2, segW, segment: s, topY: innerY + innerH - highH });
    cx += segW;
  });

  // Y-axis reference
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = `500 ${Math.round(w * 0.018)}px Roboto, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const unit = sport === 'cycling' ? '% FTP' : '% TP';
  [50, 100, Math.round(maxIntensity / 50) * 50].forEach(level => {
    if (level > maxIntensity) return;
    const yL = innerY + innerH - (level / maxIntensity) * innerH;
    ctx.fillText(`${level}${level === 100 ? unit : ''}`, innerX + 4, yL);
  });

  // Time axis
  ctx.font = `500 ${Math.round(w * 0.02)}px Roboto, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('0:00', innerX, innerY + innerH + 6);
  ctx.textAlign = 'right';
  ctx.fillText(fmtDuration(totalMin), innerX + innerW, innerY + innerH + 6);

  // Per-segment / per-repeat-block labels.
  //
  // Each "label unit" represents either:
  //   (a) a single non-repeat segment, labelled in the current per-segment style
  //   (b) an entire repeat block (all iterations × all children), labelled
  //       once at the centre of the block with a summary like "3 × 30s @ 120%"
  //
  // The labelConfig that controls a repeat-block label is the FIRST child segment's
  // labelConfig — show/hide, colour, size etc all come from there. This keeps the
  // UI simple: if you want to hide labels for a repeat block, set the first child
  // to Hide; if you want to force-show with a custom colour, set it on the first
  // child. Future enhancement could move labelConfig onto the repeat itself.
  if (showLabels) {
    const baseLabelSize = Math.round(w * 0.018);
    const baseSubSize = Math.round(w * 0.014);
    const minWidthForInline = Math.max(38, baseLabelSize * 3.5);
    const leaderRowGap = baseLabelSize * 2.6;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // Build label units by walking the labelAnchors array and grouping consecutive
    // anchors that share the same _repeatId.
    const labelUnits = [];
    let i = 0;
    while (i < labelAnchors.length) {
      const a = labelAnchors[i];
      const repeatId = a.segment._repeatId;
      if (!repeatId) {
        // Standalone segment — one unit
        labelUnits.push({
          kind: 'segment',
          anchor: a,
          // The unit's centre and width are just the bar's own
          centreX: a.centreX,
          unitW: a.segW,
          topY: a.topY,
          cfg: a.segment.labelConfig || DEFAULT_LABEL_CONFIG,
        });
        i++;
      } else {
        // Repeat block — gather all consecutive anchors with the same _repeatId
        const groupAnchors = [];
        const startI = i;
        while (i < labelAnchors.length && labelAnchors[i].segment._repeatId === repeatId) {
          groupAnchors.push(labelAnchors[i]);
          i++;
        }
        // Compute the unit's bounding centre + total span
        const firstAnchor = groupAnchors[0];
        const lastAnchor = groupAnchors[groupAnchors.length - 1];
        const leftEdge = firstAnchor.centreX - firstAnchor.segW / 2;
        const rightEdge = lastAnchor.centreX + lastAnchor.segW / 2;
        const unitCentreX = (leftEdge + rightEdge) / 2;
        const unitW = rightEdge - leftEdge;

        // Use the highest top (smallest y) across all bars in the group so the
        // label sits above the tallest bar in the block.
        const topY = Math.min(...groupAnchors.map(a => a.topY));

        // Labelling config from the first child's labelConfig.
        // (If the user hides the first child, the whole repeat label is hidden too.)
        const cfg = firstAnchor.segment.labelConfig || DEFAULT_LABEL_CONFIG;

        // Determine count and child structure from the group itself
        // groupAnchors length = count × children-per-iteration.
        // Find children count by counting until the first child appears again.
        let childrenPerIter = 1;
        for (let k = 1; k < groupAnchors.length; k++) {
          if (groupAnchors[k].segment._repeatIdx !== groupAnchors[0].segment._repeatIdx) {
            childrenPerIter = k;
            break;
          }
        }
        const count = Math.round(groupAnchors.length / childrenPerIter);
        const childSegs = groupAnchors.slice(0, childrenPerIter).map(a => a.segment);

        labelUnits.push({
          kind: 'repeat',
          centreX: unitCentreX,
          unitW,
          topY,
          cfg,
          count,
          childSegs,
        });
      }
    }

    // Classify placement (inline vs leader vs skip) for each unit
    const placements = labelUnits.map((u) => {
      const cfg = u.cfg;
      if (cfg.show === 'never') return { skip: true, unit: u, cfg };
      if (cfg.show === 'always') {
        return {
          mode: u.unitW < minWidthForInline ? 'leader' : 'inline',
          unit: u, cfg,
        };
      }
      // 'auto' — inline only if wide enough
      if (u.unitW < minWidthForInline) return { skip: true, unit: u, cfg };
      return { mode: 'inline', unit: u, cfg };
    });

    // Anti-overlap pass for inline labels (skip auto-mode if too close to previous)
    let lastInlineEndX = -Infinity;
    placements.forEach((p) => {
      if (p.skip || p.mode !== 'inline') return;
      const cfg = p.cfg;
      if (cfg.show === 'auto' && p.unit.centreX - lastInlineEndX < minWidthForInline * 0.45) {
        p.skip = true;
        return;
      }
      lastInlineEndX = p.unit.centreX + p.unit.unitW / 2;
    });

    // Stagger leader-mode labels onto two rows
    let leaderRowIdx = 0;
    placements.forEach((p) => {
      if (p.skip || p.mode !== 'leader') return;
      p.row = leaderRowIdx % 2;
      leaderRowIdx++;
    });

    // Helpers to build the text for each unit kind
    const unitText = (u) => {
      if (u.kind === 'segment') {
        const s = u.anchor.segment;
        const intensity = s.intensityLow === s.intensityHigh
          ? `${s.intensityLow}%`
          : `${s.intensityLow}–${s.intensityHigh}%`;
        return { primary: intensity, secondary: fmtDuration(s.duration) };
      }
      // Repeat unit
      if (u.childSegs.length === 1) {
        const c = u.childSegs[0];
        const intensity = c.intensityLow === c.intensityHigh
          ? `${c.intensityLow}%`
          : `${c.intensityLow}–${c.intensityHigh}%`;
        return {
          primary: `Repeat ${u.count}× ${fmtDuration(c.duration)}`,
          secondary: `@ ${intensity}`,
        };
      }
      // Multi-child repeat — summarise as Repeat N× with each child described.
      const briefs = u.childSegs.map(c => {
        const intensity = c.intensityLow === c.intensityHigh
          ? `${c.intensityLow}%`
          : `${c.intensityLow}–${c.intensityHigh}%`;
        return `${fmtDuration(c.duration)} @ ${intensity}`;
      });
      return {
        primary: `Repeat ${u.count}×`,
        secondary: briefs.length <= 2 ? briefs.join(' / ') : `${briefs[0]} + ${briefs.length - 1} more`,
      };
    };

    // Render each placement
    placements.forEach((p) => {
      if (p.skip) return;
      const cfg = p.cfg;
      const { centreX, topY } = p.unit;
      const sizeMul = Math.max(0.6, Math.min(2.0, cfg.size || 1.0));
      const labelSize = Math.round(baseLabelSize * sizeMul);
      const subSize = Math.round(baseSubSize * sizeMul);

      const showI = cfg.showIntensity !== false;
      const showT = cfg.showTime !== false;
      if (!showI && !showT) return;

      const intensityColor = cfg.color || BRAND.white;
      const timeColor = cfg.subColor || 'rgba(255,255,255,0.6)';

      const { primary, secondary } = unitText(p.unit);

      // For repeat units, "primary" = count × duration, "secondary" = intensity.
      // For segment units, "primary" = intensity, "secondary" = time.
      // The showIntensity / showTime checkboxes apply to the corresponding line:
      //   - segment: showI=primary, showT=secondary
      //   - repeat:  showI=secondary (intensity is the second line), showT=primary
      let topLine, bottomLine, topShown, bottomShown, topColor, bottomColor;
      if (p.unit.kind === 'segment') {
        topLine    = secondary; topShown    = showT; topColor    = timeColor;       // time on top
        bottomLine = primary;   bottomShown = showI; bottomColor = intensityColor;  // intensity below
      } else {
        topLine    = primary;   topShown    = showT; topColor    = timeColor;       // count × dur on top (time-ish)
        bottomLine = secondary; bottomShown = showI; bottomColor = intensityColor;  // @ intensity below
      }

      let labelX = centreX + (cfg.offsetX || 0);
      const leaderLift = p.mode === 'leader' ? leaderRowGap * (1 + (p.row || 0) * 0.9) : 0;
      let labelY = topY - 6 - leaderLift + (cfg.offsetY || 0);

      if (p.mode === 'leader') {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centreX, topY - 2);
        ctx.lineTo(labelX, labelY + 4);
        ctx.stroke();
      }

      // Bottom line first (it sits at labelY)
      if (bottomShown) {
        ctx.font = `700 ${labelSize}px "League Spartan", system-ui, sans-serif`;
        ctx.fillStyle = bottomColor;
        ctx.fillText(bottomLine, labelX, labelY);
      }
      if (topShown) {
        ctx.font = `500 ${subSize}px Roboto, system-ui, sans-serif`;
        ctx.fillStyle = topColor;
        const topY2 = bottomShown ? labelY - labelSize - 2 : labelY;
        ctx.fillText(topLine, labelX, topY2);
      }
    });
  }
}

/* Compute the bounding box (in graph-rect coordinates) of all flat segments
   that belong to a given repeat-block id. Used for annotation arrows that
   target a whole repeat block rather than a single segment. */
function getRepeatBlockBounds(repeatId, flatSegs, graphRect) {
  const totalMin = flatSegs.reduce((s, x) => s + x.duration, 0) || 1;
  let acc = 0;
  let firstFrac = null;
  let lastFrac = null;
  let maxIntensity = 0;
  for (const s of flatSegs) {
    const startFrac = acc / totalMin;
    const endFrac = (acc + s.duration) / totalMin;
    if (s._repeatId === repeatId) {
      if (firstFrac === null) firstFrac = startFrac;
      lastFrac = endFrac;
      maxIntensity = Math.max(maxIntensity, s.intensityHigh);
    }
    acc += s.duration;
  }
  if (firstFrac === null) return null;
  const x = graphRect.x + 8 + ((firstFrac + lastFrac) / 2) * (graphRect.w - 16);
  // Point arrow at the top of the tallest bar in the block (approximate)
  const y = graphRect.y + graphRect.h * 0.3;
  return { x, y };
}

function drawAnnotations(ctx, annotations, flatSegs, graphRect, W, hoverAnno) {
  if (!annotations.length) return;
  const totalMin = flatSegs.reduce((s, x) => s + x.duration, 0) || 1;

  annotations.forEach(a => {
    if (!a.visible) return;
    let targetX, targetY;
    if (a.targetMode === 'repeat' && a.targetRepeatId) {
      const bounds = getRepeatBlockBounds(a.targetRepeatId, flatSegs, graphRect);
      if (bounds) {
        targetX = bounds.x;
        targetY = bounds.y;
      } else {
        // Repeat no longer exists — fall back to free position
        targetX = graphRect.x + (a.arrowPos?.x || 0.5) * graphRect.w;
        targetY = graphRect.y + (a.arrowPos?.y || 0.5) * graphRect.h;
      }
    } else if (a.targetMode === 'segment' && a.targetIndex != null && flatSegs[a.targetIndex]) {
      let acc = 0;
      for (let i = 0; i < a.targetIndex; i++) acc += flatSegs[i].duration;
      const startFrac = acc / totalMin;
      const endFrac = (acc + flatSegs[a.targetIndex].duration) / totalMin;
      targetX = graphRect.x + 8 + ((startFrac + endFrac) / 2) * (graphRect.w - 16);
      targetY = graphRect.y + graphRect.h * 0.4;
    } else {
      targetX = graphRect.x + (a.arrowPos?.x || 0.5) * graphRect.w;
      targetY = graphRect.y + (a.arrowPos?.y || 0.5) * graphRect.h;
    }

    const noteX = graphRect.x + (a.notePos?.x ?? 0.7) * graphRect.w;
    const noteY = graphRect.y + (a.notePos?.y ?? -0.3) * graphRect.h;

    // Arrow
    const arrowStyle = ARROW_STYLES[a.arrowStyle] || ARROW_STYLES.solid;
    ctx.strokeStyle = a.arrowColor || a.accentColor || BRAND.orange;
    ctx.lineWidth = a.arrowWidth || 2;
    ctx.setLineDash(arrowStyle.dash);
    ctx.beginPath();
    ctx.moveTo(noteX, noteY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrow head
    const angle = Math.atan2(targetY - noteY, targetX - noteX);
    const ah = 14 + (a.arrowWidth || 2) * 1.5;
    const headType = a.arrowHead || 'filled';
    if (headType !== 'none') {
      ctx.fillStyle = a.arrowColor || a.accentColor || BRAND.orange;
      ctx.strokeStyle = a.arrowColor || a.accentColor || BRAND.orange;
      ctx.lineWidth = a.arrowWidth || 2;
      ctx.beginPath();
      ctx.moveTo(targetX, targetY);
      ctx.lineTo(targetX - ah * Math.cos(angle - 0.4), targetY - ah * Math.sin(angle - 0.4));
      ctx.lineTo(targetX - ah * Math.cos(angle + 0.4), targetY - ah * Math.sin(angle + 0.4));
      ctx.closePath();
      if (headType === 'filled') ctx.fill();
      else ctx.stroke();
    }

    // Bubble dimensions
    const bubbleW = Math.min(W * (a.bubbleWidth || 0.4), W - 40);
    const padB = 14;
    const labelSize = Math.round(W * 0.018);
    const bodySize = Math.round(W * 0.022);
    const bodyLineHeight = bodySize * 1.3;
    const family = 'Roboto, system-ui, sans-serif';

    // Pre-wrap the rich-text body so we can size the bubble correctly
    const bodyMaxWidth = bubbleW - padB * 2 - 4;
    const parsedLines = (a.text || '').split('\n').map(line => parseRichLine(line, Math.round(W * 0.025)));
    const bodyVisualLines = [];
    for (const p of parsedLines) {
      if (p.kind === 'blank') {
        bodyVisualLines.push({ runs: [], indent: 0, isBulletStart: false, isBlank: true });
        continue;
      }
      const bulletGutter = p.kind === 'bullet' ? Math.round(bodySize * 0.9) : 0;
      const wrapWidth = bodyMaxWidth - p.indentPx - bulletGutter;
      const wrapped = wrapStyledRuns(ctx, p.runs, wrapWidth, bodySize, family);
      wrapped.forEach((runs, idx) => {
        bodyVisualLines.push({
          runs,
          indent: p.indentPx + bulletGutter,
          isBulletStart: p.kind === 'bullet' && idx === 0,
          bulletIndent: p.indentPx,
          isBlank: false,
        });
      });
    }

    const labelLine = a.showLabel !== false;
    const labelText = a.customLabel || (ANNOTATION_PRESETS[a.style] || ANNOTATION_PRESETS.coach).label;
    let bodyContentH = 0;
    for (const v of bodyVisualLines) bodyContentH += v.isBlank ? bodyLineHeight * 0.5 : bodyLineHeight;
    const bubbleH = padB * 2 + (labelLine ? labelSize + 8 : 0) + bodyContentH;

    // Bubble background
    const bgColor = a.bgColor || '#ffffff';
    const opacity = a.bubbleOpacity ?? 0.96;
    ctx.fillStyle = hexA(bgColor, opacity);
    roundRect(ctx, noteX - bubbleW / 2, noteY - bubbleH / 2, bubbleW, bubbleH, 6);
    ctx.fill();

    // Accent bar
    if (a.accentBar !== false) {
      ctx.fillStyle = a.accentColor || BRAND.orange;
      ctx.fillRect(noteX - bubbleW / 2, noteY - bubbleH / 2, 4, bubbleH);
    }

    // Label
    if (labelLine) {
      ctx.fillStyle = a.accentColor || BRAND.orange;
      ctx.font = `700 ${labelSize}px "League Spartan", system-ui, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(labelText.toUpperCase(), noteX - bubbleW / 2 + padB + 4, noteY - bubbleH / 2 + padB);
    }

    // Body — rich text rendering with bullets, bold, italic
    let ly = noteY - bubbleH / 2 + padB + (labelLine ? labelSize + 8 : 0);
    const bodyX = noteX - bubbleW / 2 + padB + 4;
    const bodyColor = a.textColor || BRAND.ink;
    for (const v of bodyVisualLines) {
      if (v.isBlank) {
        ly += bodyLineHeight * 0.5;
        continue;
      }
      if (v.isBulletStart) {
        ctx.font = `700 ${bodySize}px ${family}`;
        ctx.fillStyle = a.accentColor || BRAND.orange;
        ctx.fillText('•', bodyX + v.bulletIndent, ly);
      }
      drawStyledLine(ctx, v.runs, bodyX + v.indent, ly, bodySize, family, bodyColor);
      ly += bodyLineHeight;
    }

    // Hover indicator
    if (hoverAnno === a.id) {
      ctx.strokeStyle = a.accentColor || BRAND.orange;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      roundRect(ctx, noteX - bubbleW / 2 - 4, noteY - bubbleH / 2 - 4, bubbleW + 8, bubbleH + 8, 8);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });
}

/* Rich-text rendering helpers
   ---------------------------------------------------------------
   Both the description and detailed plan canvas renderers support a small
   markdown-like subset:
     - **bold**           → bold inline
     - *italic* or _italic_ → italic inline
     - lines starting with "- " or "* " (after optional leading spaces) → bullet
     - leading spaces (in pairs) → indent depth for nested bullets
     - unwrapped continuation lines stay aligned with the parent line, NO bullet

   The previous implementation accidentally drew an orange dot on every
   wrapped continuation line because indent > 0 was treated as "this is a
   child item". The new pipeline tracks bullet-vs-continuation explicitly.
*/

// Parse a single source line into { kind, indentPx, runs } where runs is an
// array of styled text fragments. indentStep is the pixel cost per indent level.
function parseRichLine(rawLine, indentStep) {
  const leadingSpaces = rawLine.length - rawLine.trimStart().length;
  const indentDepth = Math.floor(leadingSpaces / 2);
  const content = rawLine.trim();
  const indentPx = indentDepth * indentStep;

  if (!content) return { kind: 'blank', indentPx: 0, runs: [] };

  // Detect bullet marker
  const bulletMatch = content.match(/^[-*]\s+(.*)$/);
  if (bulletMatch) {
    return {
      kind: 'bullet',
      indentPx,
      runs: parseInlineRuns(bulletMatch[1]),
    };
  }
  return {
    kind: 'text',
    indentPx,
    runs: parseInlineRuns(content),
  };
}

// Parse a single line's text content into styled runs. Handles **bold**,
// *italic* / _italic_. Runs are emitted in order; nested formatting isn't
// supported (intentional — keeps parser simple, satisfies the use case).
function parseInlineRuns(text) {
  const runs = [];
  let i = 0;
  let buf = '';
  let bold = false;
  let italic = false;

  const flush = () => {
    if (buf) {
      runs.push({ text: buf, bold, italic });
      buf = '';
    }
  };

  while (i < text.length) {
    // ** for bold (longest match first so we don't trip on single *)
    if (text[i] === '*' && text[i + 1] === '*') {
      flush();
      bold = !bold;
      i += 2;
      continue;
    }
    // * or _ for italic
    if (text[i] === '*' || text[i] === '_') {
      flush();
      italic = !italic;
      i++;
      continue;
    }
    buf += text[i];
    i++;
  }
  flush();
  return runs.length ? runs : [{ text: '', bold: false, italic: false }];
}

// Measure the width of a styled run with the given base size and font family.
function measureRun(ctx, run, size, family) {
  const weight = run.bold ? 700 : 400;
  const style = run.italic ? 'italic' : 'normal';
  ctx.font = `${style} ${weight} ${size}px ${family}`;
  return ctx.measureText(run.text).width;
}

// Wrap an array of styled runs to a max width, returning lines (each line is
// an array of styled run fragments). Splits runs at word boundaries and
// preserves styling across the split. The font family is needed for
// measurement.
function wrapStyledRuns(ctx, runs, maxWidth, size, family) {
  const lines = [];
  let currentLine = [];
  let currentWidth = 0;

  const pushLine = () => {
    if (currentLine.length) lines.push(currentLine);
    currentLine = [];
    currentWidth = 0;
  };

  for (const run of runs) {
    if (!run.text) continue;
    // Split run into words (preserving spaces between them)
    const tokens = run.text.split(/(\s+)/).filter(t => t.length > 0);
    for (const token of tokens) {
      const tokenWidth = measureRun(ctx, { ...run, text: token }, size, family);
      const isWhitespace = /^\s+$/.test(token);

      // Skip leading whitespace at the start of a wrapped line
      if (isWhitespace && currentWidth === 0) continue;

      if (currentWidth + tokenWidth > maxWidth && currentWidth > 0) {
        pushLine();
        if (isWhitespace) continue; // don't start a new line with whitespace
      }
      // Append to current line; merge with previous fragment if same style
      const last = currentLine[currentLine.length - 1];
      if (last && last.bold === run.bold && last.italic === run.italic) {
        last.text += token;
      } else {
        currentLine.push({ text: token, bold: run.bold, italic: run.italic });
      }
      currentWidth += tokenWidth;
    }
  }
  pushLine();
  return lines;
}

// Render a single visual line (array of styled runs) at (x, y).
function drawStyledLine(ctx, runs, x, y, size, family, color) {
  let cx = x;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  for (const run of runs) {
    const weight = run.bold ? 700 : 400;
    const style = run.italic ? 'italic' : 'normal';
    ctx.font = `${style} ${weight} ${size}px ${family}`;
    ctx.fillText(run.text, cx, y);
    cx += ctx.measureText(run.text).width;
  }
}

/* Render a block of rich text (description or plan) with proper handling of
   wrapping, bullets, indentation, and inline formatting. */
function drawRichText(ctx, text, opts) {
  const {
    x, y, maxWidth, size, lineHeight, indentStep, color, bulletColor,
    family = 'Roboto, system-ui, sans-serif',
    maxLines = Infinity,
  } = opts;

  if (!text) return { lastY: y, overflowed: false };

  const parsed = text.split('\n').map(line => parseRichLine(line, indentStep));

  // Build visual lines by wrapping each parsed source line
  const visual = []; // { runs, indent, isBulletStart, isBlank }
  for (const p of parsed) {
    if (p.kind === 'blank') {
      visual.push({ runs: [], indent: 0, isBulletStart: false, isBlank: true });
      continue;
    }
    // For bullets, the first visual line gets the bullet marker; continuations
    // align to where the bullet text started (indent + bulletGutter).
    const bulletGutter = p.kind === 'bullet' ? Math.round(size * 0.9) : 0;
    const wrapWidth = maxWidth - p.indentPx - bulletGutter;
    const wrappedLines = wrapStyledRuns(ctx, p.runs, wrapWidth, size, family);
    wrappedLines.forEach((runs, idx) => {
      visual.push({
        runs,
        indent: p.indentPx + bulletGutter,
        isBulletStart: p.kind === 'bullet' && idx === 0,
        bulletIndent: p.indentPx, // where to place the bullet glyph
        isBlank: false,
      });
    });
  }

  let cy = y;
  let drawn = 0;
  for (const v of visual) {
    if (drawn >= maxLines) {
      return { lastY: cy, overflowed: true };
    }
    if (v.isBlank) {
      cy += lineHeight * 0.5;
      drawn++;
      continue;
    }
    if (v.isBulletStart) {
      // Bullet glyph sits in the gutter between bulletIndent and indent
      ctx.font = `700 ${size}px ${family}`;
      ctx.fillStyle = bulletColor;
      ctx.fillText('•', x + v.bulletIndent, cy);
    }
    drawStyledLine(ctx, v.runs, x + v.indent, cy, size, family, color);
    cy += lineHeight;
    drawn++;
  }

  return { lastY: cy, overflowed: false };
}

function drawDescription(ctx, text, x, y, w, W) {
  if (!text) return;
  const size = Math.round(W * 0.028);
  drawRichText(ctx, text, {
    x, y, maxWidth: w, size,
    lineHeight: size * 1.4,
    indentStep: Math.round(W * 0.03),
    color: 'rgba(255,255,255,0.92)',
    bulletColor: BRAND.orange,
    maxLines: 8,
  });
}

/* Detailed plan — page 2 body. Smaller type than description, more lines fit,
   supports manual line breaks. Bullets only appear on lines that start with
   "- " or "* " — wrapped continuations align with the parent text but do NOT
   get a bullet. */
function drawDetailedPlan(ctx, text, x, y, w, W, H) {
  if (!text) return;
  const size = Math.round(W * 0.022);
  const lineHeight = size * 1.45;

  // Available height: from y down to roughly the start of the metrics row
  const maxBottom = H - Math.round(W * 0.16);
  const maxLines = Math.max(1, Math.floor((maxBottom - y) / lineHeight));

  const result = drawRichText(ctx, text, {
    x, y, maxWidth: w, size, lineHeight,
    indentStep: Math.round(W * 0.025),
    color: 'rgba(255,255,255,0.94)',
    bulletColor: BRAND.orange,
    maxLines,
  });

  if (result.overflowed) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = `500 ${Math.round(W * 0.018)}px Roboto, system-ui, sans-serif`;
    ctx.fillText('…', x, result.lastY);
  }
}

function drawCalculations(ctx, project, flatSegs, sport, pad, H, W, yOffset = 0) {
  if (!flatSegs.length) return;
  const calc = calculateMetrics(flatSegs, sport);
  const m = applyMetricOverrides(calc, project.metricOverrides);
  const pillH = Math.round(W * 0.07);
  const pillSize = Math.round(W * 0.022);
  const labelSize = Math.round(W * 0.016);
  // Wordmark sits BELOW the metrics row; reserve space for it
  const wordmarkSize = Math.round(W * 0.026);
  const wordmarkGap = Math.round(W * 0.025);
  const totalBlockH = pillH + wordmarkGap + wordmarkSize;
  const y = H - pad - totalBlockH + yOffset;

  const fmtIF = (v) => v.toFixed(2);
  const fmtTSS = (v) => `${Math.round(v)}`;

  // Build items with both range and override-aware single-value display:
  // if the user has overridden BOTH low and high to the same value, show it
  // as a single number rather than a range like "75–75".
  const ifRange = (m.ifLow === m.ifHigh) ? fmtIF(m.ifLow) : `${fmtIF(m.ifLow)}–${fmtIF(m.ifHigh)}`;
  const tssRange = (m.tssLow === m.tssHigh) ? fmtTSS(m.tssLow) : `${fmtTSS(m.tssLow)}–${fmtTSS(m.tssHigh)}`;

  const items = [
    { label: 'DURATION', value: fmtDuration(m.totalMin) },
    { label: sport === 'cycling' ? 'IF' : 'rIF', value: ifRange },
    { label: sport === 'cycling' ? 'TSS' : 'rTSS', value: tssRange },
  ];

  // First pass: measure each pill's width
  const pillWidths = items.map(item => {
    ctx.font = `700 ${pillSize}px "League Spartan", system-ui, sans-serif`;
    const valW = ctx.measureText(item.value).width;
    ctx.font = `600 ${labelSize}px "League Spartan", system-ui, sans-serif`;
    const labW = ctx.measureText(item.label).width;
    return Math.max(valW, labW) + 36;
  });
  const gap = 12;
  const totalW = pillWidths.reduce((sum, w) => sum + w, 0) + gap * (items.length - 1);
  // Centre the row horizontally
  let cx = Math.round((W - totalW) / 2);

  items.forEach((item, idx) => {
    const pillW = pillWidths[idx];
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    roundRect(ctx, cx, y, pillW, pillH, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    roundRect(ctx, cx, y, pillW, pillH, 4);
    ctx.stroke();

    ctx.fillStyle = BRAND.orange;
    ctx.font = `600 ${labelSize}px "League Spartan", system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(item.label, cx + 14, y + 10);

    ctx.fillStyle = BRAND.white;
    ctx.font = `700 ${pillSize}px "League Spartan", system-ui, sans-serif`;
    ctx.fillText(item.value, cx + 14, y + 10 + labelSize + 4);

    cx += pillW + gap;
  });

  // Wordmark — centred under the metrics row, larger and brighter than before
  ctx.font = `700 ${wordmarkSize}px "League Spartan", system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('paceon.com.au', W / 2, y + pillH + wordmarkGap);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function shade(hex, percent) {
  const n = parseInt(hex.slice(1), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (n >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const B = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return '#' + ((R << 16) | (G << 8) | B).toString(16).padStart(6, '0');
}

function hexA(hex, alpha) {
  if (!hex || !hex.startsWith('#')) return `rgba(0,0,0,${alpha})`;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 0xff},${n & 0xff},${alpha})`;
}

// ---------- Main App ----------
const DEFAULT_PROJECT = {
  sport: 'cycling',
  format: 'story',
  layout: 'graphLed',
  graphStyle: 'stepped',
  title: '',
  segments: [],
  description: '',
  detailedPlan: '',
  caption: '',
  annotations: [],
  showGraphLabels: false,
  metricOverrides: {},
  background: { tint: 0.55, gradient: true, gradientTop: 0.4, gradientBottom: 0.7 },
  // logo state stripped of `image` — image lives in a ref, never in saved JSON
  logo: { variant: 'white', hasCustom: false },
  videoLoopLength: 10,
  positions: { ...DEFAULT_POSITIONS },
};

export default function App() {
  const [project, setProject] = useState(DEFAULT_PROJECT);
  const [activeTab, setActiveTab] = useState('build');
  const [savedProjects, setSavedProjects] = useState([]);
  const [exportStatus, setExportStatus] = useState('');
  const [hoverAnno, setHoverAnno] = useState(null);
  const [draggingAnno, setDraggingAnno] = useState(null);
  const [bgFile, setBgFile] = useState(null);

  // Responsive layout — mobile when viewport is narrow
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 900
  );
  const [zoomed, setZoomed] = useState(false); // mobile fullscreen canvas
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false); // collapsible toggles in mobile header
  const [currentPage, setCurrentPage] = useState(1); // 1 = overview (description), 2 = detail (plan + annotations)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lock body scroll when zoom modal is open so background doesn't scroll
  useEffect(() => {
    if (zoomed) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [zoomed]);

  // Logo images — kept in refs, separate from project state to survive save/load
  const bundledLogos = useRef({ white: null, black: null });
  const customLogo = useRef(null);
  const [logosReady, setLogosReady] = useState(false);

  const canvasRef = useRef(null);
  const mediaRef = useRef(null);
  const animRef = useRef(null);
  const recorderRef = useRef(null);

  const format = FORMATS[project.format];
  const flat = useMemo(() => flattenSegments(project.segments), [project.segments]);
  const metrics = useMemo(() => {
    const calc = calculateMetrics(flat, project.sport);
    return applyMetricOverrides(calc, project.metricOverrides);
  }, [flat, project.sport, project.metricOverrides]);

  // Resolve which logo image to draw (computed each render, never stored)
  const activeLogoImage = useMemo(() => {
    if (project.logo.hasCustom && customLogo.current) return customLogo.current;
    return project.logo.variant === 'white' ? bundledLogos.current.white : bundledLogos.current.black;
  }, [project.logo.variant, project.logo.hasCustom, logosReady]);

  // Load bundled logos once on mount
  useEffect(() => {
    const loadLogo = (path) => new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = path;
    });
    Promise.all([loadLogo('/logos/paceon-white.svg'), loadLogo('/logos/paceon-black.svg')])
      .then(([white, black]) => {
        bundledLogos.current = { white, black };
        setLogosReady(true);
      });

    try {
      const saved = JSON.parse(localStorage.getItem('paceon:projects') || '{}');
      setSavedProjects(Object.keys(saved));
    } catch (e) {}
  }, []);

  // Background media handling
  useEffect(() => {
    if (!bgFile) {
      mediaRef.current = null;
      return;
    }
    if (bgFile.type === 'image') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { mediaRef.current = img; };
      img.src = bgFile.url;
    } else {
      const v = document.createElement('video');
      v.src = bgFile.url;
      v.loop = true;
      v.muted = true;
      v.playsInline = true;
      v.crossOrigin = 'anonymous';
      v.play().catch(() => {});
      mediaRef.current = v;
    }
  }, [bgFile]);

  // Render loop — uses activeLogoImage as a transient prop
  useEffect(() => {
    let mounted = true;
    const render = () => {
      if (!mounted) return;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const projectWithLogoImage = { ...project, logo: { ...project.logo, image: activeLogoImage } };
        drawCanvas(ctx, {
          project: projectWithLogoImage,
          format, sport: project.sport,
          mediaEl: mediaRef.current, mediaType: bgFile?.type || null, hoverAnno,
          currentPage,
        });
      }
      animRef.current = requestAnimationFrame(render);
    };
    render();
    return () => { mounted = false; if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [project, format, bgFile, hoverAnno, activeLogoImage, currentPage]);

  const getGraphRect = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0, w: 0, h: 0 };
    const W = format.w, H = format.h;
    const pad = Math.round(W * 0.06);
    const titleSize = Math.round(W * 0.072);
    const pos = project.positions || DEFAULT_POSITIONS;
    const baseTitleY = pad + Math.round(W * 0.13);
    const titleY = baseTitleY + Math.round(pos.titleY * H);
    const ctx = c.getContext('2d');
    ctx.font = `700 ${titleSize}px "League Spartan", system-ui, sans-serif`;
    const titleLines = wrapText(ctx, (project.title || 'Workout Title').toUpperCase(), W - pad * 2, 2);
    const titleEnd = titleY + titleLines.length * titleSize * 1.05;
    let baseGraphHeight;
    if (project.layout === 'graphLed') baseGraphHeight = Math.round(H * 0.32);
    else if (project.layout === 'descriptionLed') baseGraphHeight = Math.round(H * 0.22);
    else baseGraphHeight = Math.round(H * 0.20);
    const graphHeight = Math.max(120, Math.round(baseGraphHeight + pos.graphHeight * H));
    const graphTop = titleEnd + Math.round(W * 0.06) + Math.round(pos.graphY * H);
    return { x: pad, y: graphTop, w: W - pad * 2, h: graphHeight };
  }, [format, project.title, project.layout, project.positions]);

  // Generic pointer handler — accepts clientX/clientY so it works for both mouse and touch
  const handlePointerStart = (clientX, clientY) => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const sx = c.width / rect.width;
    const sy = c.height / rect.height;
    const x = (clientX - rect.left) * sx;
    const y = (clientY - rect.top) * sy;
    const graphRect = getGraphRect();

    for (const a of project.annotations) {
      if (!a.visible) continue;
      const noteX = graphRect.x + (a.notePos?.x ?? 0.7) * graphRect.w;
      const noteY = graphRect.y + (a.notePos?.y ?? -0.3) * graphRect.h;
      const totalMin = flat.reduce((s, x) => s + x.duration, 0) || 1;
      let targetX, targetY;
      if (a.targetMode === 'repeat' && a.targetRepeatId) {
        const bounds = getRepeatBlockBounds(a.targetRepeatId, flat, graphRect);
        if (bounds) { targetX = bounds.x; targetY = bounds.y; }
        else {
          targetX = graphRect.x + (a.arrowPos?.x || 0.5) * graphRect.w;
          targetY = graphRect.y + (a.arrowPos?.y || 0.5) * graphRect.h;
        }
      } else if (a.targetMode === 'segment' && a.targetIndex != null && flat[a.targetIndex]) {
        let acc = 0;
        for (let i = 0; i < a.targetIndex; i++) acc += flat[i].duration;
        const startFrac = acc / totalMin;
        const endFrac = (acc + flat[a.targetIndex].duration) / totalMin;
        targetX = graphRect.x + 8 + ((startFrac + endFrac) / 2) * (graphRect.w - 16);
        targetY = graphRect.y + graphRect.h * 0.4;
      } else {
        targetX = graphRect.x + (a.arrowPos?.x || 0.5) * graphRect.w;
        targetY = graphRect.y + (a.arrowPos?.y || 0.5) * graphRect.h;
      }

      const bubbleW = Math.min(format.w * (a.bubbleWidth || 0.4), format.w - 40);
      const bubbleH = 220;
      if (Math.abs(x - noteX) < bubbleW / 2 && Math.abs(y - noteY) < bubbleH / 2) {
        setDraggingAnno({ id: a.id, mode: 'note' });
        return true;
      }
      // Free-position arrows are draggable; segment- or repeat-anchored ones are not
      if (a.targetMode !== 'segment' && a.targetMode !== 'repeat' &&
          Math.hypot(x - targetX, y - targetY) < 30) {
        setDraggingAnno({ id: a.id, mode: 'arrow' });
        return true;
      }
    }
    return false;
  };

  const handlePointerMove = (clientX, clientY) => {
    if (!draggingAnno) return;
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const sx = c.width / rect.width;
    const sy = c.height / rect.height;
    const x = (clientX - rect.left) * sx;
    const y = (clientY - rect.top) * sy;
    const graphRect = getGraphRect();

    setProject(p => ({
      ...p,
      annotations: p.annotations.map(a => {
        if (a.id !== draggingAnno.id) return a;
        if (draggingAnno.mode === 'note') {
          return { ...a, notePos: { x: (x - graphRect.x) / graphRect.w, y: (y - graphRect.y) / graphRect.h } };
        }
        return { ...a, arrowPos: { x: (x - graphRect.x) / graphRect.w, y: (y - graphRect.y) / graphRect.h }, targetMode: 'free' };
      }),
    }));
  };

  const handlePointerEnd = () => setDraggingAnno(null);

  // Mouse wrappers
  const handleCanvasMouseDown = (e) => handlePointerStart(e.clientX, e.clientY);
  const handleCanvasMouseMove = (e) => handlePointerMove(e.clientX, e.clientY);
  const handleCanvasMouseUp = () => handlePointerEnd();

  // Touch wrappers — preventDefault on touchmove during a drag stops the page from scrolling
  const handleCanvasTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const grabbed = handlePointerStart(t.clientX, t.clientY);
    // Only swallow the gesture if we actually started a drag — otherwise let
    // taps propagate to the tap-to-zoom handler on the wrapper element.
    if (grabbed && e.cancelable) e.preventDefault();
  };
  const handleCanvasTouchMove = (e) => {
    if (!draggingAnno || e.touches.length !== 1) return;
    if (e.cancelable) e.preventDefault();
    const t = e.touches[0];
    handlePointerMove(t.clientX, t.clientY);
  };
  const handleCanvasTouchEnd = () => handlePointerEnd();

  // Operations
  const updateProject = (patch) => setProject(p => ({ ...p, ...patch }));

  const addSegment = () => setProject(p => ({ ...p, segments: [...p.segments, seg('Segment', 5, 60, 70)] }));

  const addRepeat = () => setProject(p => ({
    ...p,
    segments: [...p.segments, { id: rid(), type: 'repeat', count: 3, children: [seg('Work', 1, 100, 110), seg('Rest', 2, 50, 60)] }],
  }));

  const updateSegment = (id, patch) => {
    const update = (list) => list.map(s => {
      if (s.id === id) return { ...s, ...patch };
      if (s.type === 'repeat') return { ...s, children: update(s.children) };
      return s;
    });
    setProject(p => ({ ...p, segments: update(p.segments) }));
  };

  // Patch a single field on a segment's labelConfig without overwriting the others.
  const updateSegmentLabelConfig = (id, configPatch) => {
    const update = (list) => list.map(s => {
      if (s.id === id) {
        const current = s.labelConfig || { ...DEFAULT_LABEL_CONFIG };
        return { ...s, labelConfig: { ...current, ...configPatch } };
      }
      if (s.type === 'repeat') return { ...s, children: update(s.children) };
      return s;
    });
    setProject(p => ({ ...p, segments: update(p.segments) }));
  };

  // Bulk action — set the `show` mode on every segment in the workout to
  // 'always' / 'never' / 'auto'. Used by Style tab quick actions.
  const setAllLabelsShow = (mode) => {
    const update = (list) => list.map(s => {
      if (s.type === 'repeat') return { ...s, children: update(s.children) };
      const current = s.labelConfig || { ...DEFAULT_LABEL_CONFIG };
      return { ...s, labelConfig: { ...current, show: mode } };
    });
    setProject(p => ({ ...p, segments: update(p.segments) }));
  };

  const removeSegment = (id) => {
    const filter = (list) => list.filter(s => s.id !== id).map(s => s.type === 'repeat' ? { ...s, children: filter(s.children) } : s);
    setProject(p => ({ ...p, segments: filter(p.segments) }));
  };

  const moveSegment = (id, dir) => {
    setProject(p => {
      const move = (list) => {
        const idx = list.findIndex(s => s.id === id);
        if (idx === -1) return list.map(s => s.type === 'repeat' ? { ...s, children: move(s.children) } : s);
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= list.length) return list;
        const out = [...list];
        [out[idx], out[newIdx]] = [out[newIdx], out[idx]];
        return out;
      };
      return { ...p, segments: move(p.segments) };
    });
  };

  function rebuildIds(s) {
    s.id = rid();
    if (s.children) s.children = s.children.map(rebuildIds);
    return s;
  }

  const loadPreset = (preset) => {
    flushPendingEdits();
    setProject(p => ({
      ...p,
      title: preset.title,
      segments: JSON.parse(JSON.stringify(preset.segments)).map(rebuildIds),
      description: preset.description,
      annotations: [],
    }));
  };

  // Wipe everything back to a blank canvas, with confirmation since this is
  // destructive. Preserves user-level preferences (sport, format, layout,
  // background) since those are usually carried across sessions; resets only
  // the workout content (title, segments, descriptions, captions, annotations).
  const clearProject = () => {
    if (!confirm('Clear the current workout? This wipes the title, segments, descriptions, caption, and annotations.')) return;
    flushPendingEdits();
    setProject(p => ({
      ...p,
      title: '',
      segments: [],
      description: '',
      detailedPlan: '',
      caption: '',
      annotations: [],
    }));
    setExportStatus('Cleared — start fresh');
    setTimeout(() => setExportStatus(''), 2500);
  };

  const addAnnotation = (styleKey = 'science') => {
    flushPendingEdits();
    const preset = ANNOTATION_PRESETS[styleKey];
    const a = migrateAnnotation({
      id: rid(),
      style: styleKey,
      text: 'Heart rate drift is the gradual rise in heart rate over time during steady-state exercise despite constant power or pace, typically caused by fatigue, dehydration, heat stress, or reduced cardiovascular efficiency.',
      targetMode: 'segment',
      targetIndex: 0,
      notePos: { x: 0.7, y: -0.4 },
      arrowPos: { x: 0.5, y: 0.5 },
      visible: true,
      bgColor: preset.bg,
      textColor: preset.text,
      accentColor: preset.accent,
      arrowColor: preset.accent,
    });
    setProject(p => ({ ...p, annotations: [...p.annotations, a] }));
  };

  const updateAnnotation = (id, patch) => setProject(p => ({ ...p, annotations: p.annotations.map(a => a.id === id ? { ...a, ...patch } : a) }));
  const removeAnnotation = (id) => setProject(p => ({ ...p, annotations: p.annotations.filter(a => a.id !== id) }));

  const resetAnnotationStyle = (id) => {
    setProject(p => ({
      ...p,
      annotations: p.annotations.map(a => {
        if (a.id !== id) return a;
        const preset = ANNOTATION_PRESETS[a.style] || ANNOTATION_PRESETS.coach;
        return {
          ...a,
          bgColor: preset.bg,
          textColor: preset.text,
          accentColor: preset.accent,
          accentBar: preset.accentBar,
          arrowColor: preset.accent,
          arrowStyle: preset.arrowStyle || 'solid',
          arrowHead: 'filled',
          arrowWidth: 2,
          bubbleOpacity: 0.96,
          bubbleWidth: 0.4,
          showLabel: true,
          customLabel: '',
        };
      }),
    }));
  };

  // Save / Load — serialise everything except non-cloneable image objects
  const saveProject = () => {
    flushPendingEdits();
    const name = prompt('Project name:');
    if (!name) return;
    try {
      const all = JSON.parse(localStorage.getItem('paceon:projects') || '{}');

      // Decide whether to persist the background. Object URLs are session-only,
      // so we need the dataUrl. Skip persistence if file is too large for localStorage.
      let bgToSave = null;
      let bgWarning = '';
      if (bgFile) {
        if (bgFile.dataUrl) {
          if (bgFile.sizeMB && bgFile.sizeMB > 4.5) {
            bgWarning = ` (background too large to save — ${bgFile.sizeMB.toFixed(1)}MB)`;
          } else {
            // Persist only the dataUrl + metadata, not the object URL (which won't be valid later)
            bgToSave = { type: bgFile.type, dataUrl: bgFile.dataUrl, mimeType: bgFile.mimeType };
          }
        } else {
          bgWarning = ' (background not saved — re-upload to enable)';
        }
      }

      const serialisable = {
        ...project,
        logo: { variant: project.logo.variant, hasCustom: project.logo.hasCustom },
        _bgFile: bgToSave,
      };
      all[name] = serialisable;
      localStorage.setItem('paceon:projects', JSON.stringify(all));
      setSavedProjects(Object.keys(all));
      setExportStatus(`Saved “${name}”${bgWarning}`);
      setTimeout(() => setExportStatus(''), 4000);
    } catch (e) {
      // QuotaExceededError most commonly here — try saving without background
      if (e.name === 'QuotaExceededError') {
        try {
          const all = JSON.parse(localStorage.getItem('paceon:projects') || '{}');
          all[name] = {
            ...project,
            logo: { variant: project.logo.variant, hasCustom: project.logo.hasCustom },
            _bgFile: null,
          };
          localStorage.setItem('paceon:projects', JSON.stringify(all));
          setSavedProjects(Object.keys(all));
          setExportStatus(`Saved “${name}” without background (storage full)`);
          setTimeout(() => setExportStatus(''), 4000);
        } catch (e2) {
          setExportStatus('Save failed — storage full');
        }
      } else {
        setExportStatus('Save failed');
      }
    }
  };

  const loadProject = (name) => {
    flushPendingEdits();
    try {
      const all = JSON.parse(localStorage.getItem('paceon:projects') || '{}');
      const data = all[name];
      if (!data) return;
      const { _bgFile, ...proj } = data;
      // Reset hasCustom if customLogo isn't in memory (it can't survive save/load)
      const restoredLogo = {
        variant: proj.logo?.variant || 'white',
        hasCustom: proj.logo?.hasCustom && customLogo.current ? true : false,
      };
      setProject(migrateProject({ ...proj, logo: restoredLogo }));

      // Rehydrate background from dataUrl into a fresh object URL for this session
      if (_bgFile && _bgFile.dataUrl) {
        // Convert dataUrl → Blob → object URL so video/image elements can stream it
        try {
          const [meta, b64] = _bgFile.dataUrl.split(',');
          const mime = _bgFile.mimeType || meta.match(/:(.*?);/)?.[1] || 'application/octet-stream';
          const bin = atob(b64);
          const len = bin.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
          const blob = new Blob([bytes], { type: mime });
          const url = URL.createObjectURL(blob);
          setBgFile({ type: _bgFile.type, url, dataUrl: _bgFile.dataUrl, mimeType: mime });
        } catch (err) {
          // dataUrl couldn't be parsed; clear background gracefully
          setBgFile(null);
        }
      } else {
        setBgFile(null);
      }
    } catch (e) {}
  };

  const deleteProject = (name) => {
    if (!confirm(`Delete “${name}”?`)) return;
    try {
      const all = JSON.parse(localStorage.getItem('paceon:projects') || '{}');
      delete all[name];
      localStorage.setItem('paceon:projects', JSON.stringify(all));
      setSavedProjects(Object.keys(all));
    } catch (e) {}
  };

  // Export all saved projects as a JSON file — useful for moving them between
  // devices since localStorage is per-browser-per-origin.
  const exportProjects = () => {
    try {
      const all = localStorage.getItem('paceon:projects') || '{}';
      const blob = new Blob([all], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `paceon-projects-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus('Projects exported');
      setTimeout(() => setExportStatus(''), 2000);
    } catch (e) {
      setExportStatus('Export failed');
    }
  };

  const importProjects = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const incoming = JSON.parse(reader.result);
        if (typeof incoming !== 'object' || Array.isArray(incoming)) {
          setExportStatus('Invalid project file');
          return;
        }
        const existing = JSON.parse(localStorage.getItem('paceon:projects') || '{}');
        const merged = { ...existing, ...incoming };
        localStorage.setItem('paceon:projects', JSON.stringify(merged));
        setSavedProjects(Object.keys(merged));
        const added = Object.keys(incoming).length;
        setExportStatus(`Imported ${added} project${added === 1 ? '' : 's'}`);
        setTimeout(() => setExportStatus(''), 3000);
      } catch (err) {
        setExportStatus('Import failed — bad file');
        setTimeout(() => setExportStatus(''), 3000);
      }
    };
    reader.readAsText(file);
    // Reset the input so the same file can be selected again later
    e.target.value = '';
  };

  // Uploads
  const handleBackgroundUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    const mimeType = file.type;

    // Use object URL for the live session (fast, no memory bloat)
    const url = URL.createObjectURL(file);

    // Also read as base64 so it can survive save/load
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const sizeMB = (dataUrl.length * 0.75) / (1024 * 1024); // base64 → bytes approx
      setBgFile({ type, url, dataUrl, mimeType, sizeMB });
    };
    reader.onerror = () => {
      // Fall back to object URL only — won't persist but works in session
      setBgFile({ type, url, mimeType });
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        customLogo.current = img;
        setProject(p => ({ ...p, logo: { ...p.logo, hasCustom: true } }));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const resetLogo = () => {
    customLogo.current = null;
    setProject(p => ({ ...p, logo: { ...p.logo, hasCustom: false } }));
  };

  // Export
  // Render a single page to an offscreen canvas at full output resolution.
  // Returns a Promise that resolves to a Blob (PNG).
  const renderPageToBlob = (pageNum) => new Promise((resolve, reject) => {
    const off = document.createElement('canvas');
    off.width = format.w;
    off.height = format.h;
    const ctx = off.getContext('2d');
    const projectWithLogoImage = { ...project, logo: { ...project.logo, image: activeLogoImage } };
    drawCanvas(ctx, {
      project: projectWithLogoImage,
      format, sport: project.sport,
      mediaEl: mediaRef.current, mediaType: bgFile?.type || null,
      hoverAnno: null, // never show hover indicator in exports
      currentPage: pageNum,
    });
    off.toBlob((blob) => {
      if (blob) resolve(blob); else reject(new Error('toBlob failed'));
    }, 'image/png');
  });

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportImage = () => {
    flushPendingEdits();
    setExportStatus(`Rendering page ${currentPage}...`);
    canvasRef.current.toBlob((blob) => {
      downloadBlob(blob, `paceon-${project.format}-page${currentPage}-${Date.now()}.png`);
      setExportStatus(`Page ${currentPage} exported`);
      setTimeout(() => setExportStatus(''), 2000);
    }, 'image/png');
  };

  const exportBothImages = async () => {
    flushPendingEdits();
    setExportStatus('Rendering both pages...');
    try {
      const ts = Date.now();
      const blob1 = await renderPageToBlob(1);
      downloadBlob(blob1, `paceon-${project.format}-page1-${ts}.png`);
      // Tiny delay so the second download isn't blocked by the browser
      await new Promise(r => setTimeout(r, 250));
      const blob2 = await renderPageToBlob(2);
      downloadBlob(blob2, `paceon-${project.format}-page2-${ts}.png`);
      setExportStatus('Both pages exported');
      setTimeout(() => setExportStatus(''), 2500);
    } catch (e) {
      setExportStatus('Export failed');
      setTimeout(() => setExportStatus(''), 2500);
    }
  };

  // Record a video of the currently-displayed canvas for the configured loop length.
  // Caller decides which page is showing (we don't switch pages mid-record).
  const recordVideoForCurrentCanvas = (suffix) => new Promise((resolve, reject) => {
    const canvas = canvasRef.current;
    if (!canvas) return reject(new Error('no canvas'));

    const mimeCandidates = [
      'video/mp4;codecs=avc1', 'video/mp4',
      'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm',
    ];
    let mime = '';
    for (const m of mimeCandidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) { mime = m; break; }
    }
    if (!mime) return reject(new Error('no supported mime'));

    const stream = canvas.captureStream(30);
    const chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mime });
      const ext = mime.includes('mp4') ? 'mp4' : 'webm';
      downloadBlob(blob, `paceon-${project.format}-${suffix}-${Date.now()}.${ext}`);
      resolve(ext);
    };

    if (mediaRef.current && bgFile?.type === 'video') {
      try { mediaRef.current.currentTime = 0; mediaRef.current.play(); } catch (e) {}
    }

    recorder.start();
    recorderRef.current = recorder;
    setTimeout(() => { try { recorder.stop(); } catch (e) {} }, project.videoLoopLength * 1000);
  });

  const exportVideo = () => {
    flushPendingEdits();
    setExportStatus(`Recording page ${currentPage} (${project.videoLoopLength}s)...`);
    recordVideoForCurrentCanvas(`page${currentPage}`)
      .then(ext => {
        setExportStatus(`Video exported (.${ext})${ext === 'webm' ? ' — convert to MP4 for Instagram' : ''}`);
        setTimeout(() => setExportStatus(''), 4000);
      })
      .catch(() => setExportStatus('Video recording not supported'));
  };

  const exportBothVideos = async () => {
    flushPendingEdits();
    const remember = currentPage;
    try {
      // Page 1 first
      setCurrentPage(1);
      // Wait one frame so the canvas reflects the page change
      await new Promise(r => requestAnimationFrame(r));
      await new Promise(r => setTimeout(r, 100)); // let render loop settle
      setExportStatus(`Recording page 1 of 2 (${project.videoLoopLength}s)...`);
      await recordVideoForCurrentCanvas('page1');

      // Page 2
      setCurrentPage(2);
      await new Promise(r => requestAnimationFrame(r));
      await new Promise(r => setTimeout(r, 100));
      setExportStatus(`Recording page 2 of 2 (${project.videoLoopLength}s)...`);
      await recordVideoForCurrentCanvas('page2');

      setCurrentPage(remember);
      setExportStatus('Both videos exported');
      setTimeout(() => setExportStatus(''), 3000);
    } catch (e) {
      setCurrentPage(remember);
      setExportStatus('Video recording not supported');
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  const autoFillDescription = () => updateProject({ description: autoDraftDescription(project.title, project.segments, project.sport) });
  const autoFillCaption = () => updateProject({ caption: autoDraftCaption(project.title, project.segments, project.sport, project.description, project.metricOverrides) });
  const autoFillDetailedPlan = () => updateProject({ detailedPlan: autoDraftDetailedPlan(project.segments, project.sport) });

  // ---------- Subviews used by both desktop and mobile ----------
  const headerLogoBlock = (
    <div className="flex items-center gap-3">
      <img src="/logos/paceon-black.svg" alt="PaceOn Coaching" className="h-7 w-auto sm:h-8" />
      <span className="font-display text-[10px] sm:text-xs uppercase tracking-widest border-l pl-2 sm:pl-3"
        style={{ color: BRAND.muted, borderColor: BRAND.line }}>Post Builder</span>
    </div>
  );

  const formatTogglesBlock = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Toggle label="Sport" options={['cycling', 'running']} value={project.sport} onChange={v => updateProject({ sport: v })} accent={BRAND.olive} />
      <Toggle label="Format"
        options={Object.keys(FORMATS)} getOptionLabel={k => FORMATS[k].label}
        value={project.format} onChange={v => updateProject({ format: v })} accent={BRAND.ink} />
      <Toggle label="Layout"
        options={Object.keys(LAYOUTS)} getOptionLabel={k => LAYOUTS[k].label}
        value={project.layout} onChange={v => updateProject({ layout: v })} accent={BRAND.ink} />
    </div>
  );

  const desktopExportButtons = (
    <div className="flex items-center gap-2">
      {exportStatus && <span className="text-xs" style={{ color: BRAND.olive }}>{exportStatus}</span>}
      <button onClick={saveProject}
        className="font-display flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
        style={{ border: `1px solid ${BRAND.line}` }}>
        <Save size={13} /> Save
      </button>
      <div className="flex" style={{ border: `1px solid ${BRAND.ink}` }}>
        <button onClick={exportImage}
          className="font-display flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white"
          style={{ background: BRAND.ink }}
          title={`Export current page (page ${currentPage}) as PNG`}>
          <Download size={13} /> Image
        </button>
        <button onClick={exportBothImages}
          className="font-display px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white"
          style={{ background: BRAND.ink, borderLeft: '1px solid rgba(255,255,255,0.2)' }}
          title="Export both pages as separate PNGs">
          ×2
        </button>
      </div>
      <div className="flex" style={{ border: `1px solid ${BRAND.orange}` }}>
        <button onClick={exportVideo}
          className="font-display flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white"
          style={{ background: BRAND.orange }}
          title={`Record current page (page ${currentPage}) as video`}>
          <Video size={13} /> Video
        </button>
        <button onClick={exportBothVideos}
          className="font-display px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white"
          style={{ background: BRAND.orange, borderLeft: '1px solid rgba(255,255,255,0.25)' }}
          title="Record both pages as separate videos (sequential)">
          ×2
        </button>
      </div>
    </div>
  );

  // Tab definitions — share between desktop and mobile, with mobile getting two extra tabs
  const baseTabs = [
    { k: 'build',      l: 'Build',   i: <Layers size={13} /> },
    { k: 'style',      l: 'Style',   i: <Sparkles size={13} /> },
    { k: 'background', l: 'BG',      i: <ImageIcon size={13} /> },
    { k: 'annotate',   l: 'Notes',   i: <MessageSquare size={13} /> },
    { k: 'layout',     l: 'Layout',  i: <Move size={13} /> },
    { k: 'presets',    l: 'Presets', i: <Bookmark size={13} /> },
  ];
  const mobileExtraTabs = [
    { k: 'content',    l: 'Content', i: <FileText size={13} /> },
    { k: 'export',     l: 'Export',  i: <Download size={13} /> },
  ];
  const tabs = isMobile ? [...baseTabs, ...mobileExtraTabs] : baseTabs;

  const renderActivePanel = () => {
    switch (activeTab) {
      case 'build':      return <BuildPanel project={project} addSegment={addSegment} addRepeat={addRepeat} updateSegment={updateSegment} updateSegmentLabelConfig={updateSegmentLabelConfig} removeSegment={removeSegment} moveSegment={moveSegment} />;
      case 'style':      return <StylePanel project={project} updateProject={updateProject} handleLogoUpload={handleLogoUpload} resetLogo={resetLogo} setAllLabelsShow={setAllLabelsShow} />;
      case 'background': return <BackgroundPanel project={project} updateProject={updateProject} bgFile={bgFile} setBgFile={setBgFile} handleBackgroundUpload={handleBackgroundUpload} />;
      case 'annotate':   return <AnnotatePanel project={project} flat={flat} addAnnotation={addAnnotation} updateAnnotation={updateAnnotation} removeAnnotation={removeAnnotation} resetAnnotationStyle={resetAnnotationStyle} />;
      case 'layout':     return <LayoutPanel project={project} updateProject={updateProject} />;
      case 'presets':    return <PresetsPanel project={project} loadPreset={loadPreset} clearProject={clearProject} savedProjects={savedProjects} loadProject={loadProject} deleteProject={deleteProject} exportProjects={exportProjects} importProjects={importProjects} />;
      case 'content':    return <ContentPanel project={project} updateProject={updateProject} metrics={metrics} autoFillDescription={autoFillDescription} autoFillCaption={autoFillCaption} autoFillDetailedPlan={autoFillDetailedPlan} />;
      case 'export':     return <ExportPanel project={project} updateProject={updateProject} saveProject={saveProject} exportImage={exportImage} exportVideo={exportVideo} exportBothImages={exportBothImages} exportBothVideos={exportBothVideos} exportStatus={exportStatus} currentPage={currentPage} />;
      default:           return null;
    }
  };

  // Canvas wrapper — same JSX for desktop and mobile, parent decides sizing
  // The canvas DOM node — referenced by mouse/touch handlers and the render loop.
  // Use a callback ref so we always have the latest mounted canvas regardless of
  // which layout branch (desktop, mobile, or zoom overlay) renders it.
  const setCanvasNode = useCallback((node) => {
    canvasRef.current = node;
  }, []);

  // Common props for the canvas tag — used in whichever layout branch renders it.
  const canvasProps = {
    ref: setCanvasNode,
    width: format.w,
    height: format.h,
    onMouseDown: handleCanvasMouseDown,
    onMouseMove: handleCanvasMouseMove,
    onMouseUp: handleCanvasMouseUp,
    onMouseLeave: handleCanvasMouseUp,
    onTouchStart: handleCanvasTouchStart,
    onTouchMove: handleCanvasTouchMove,
    onTouchEnd: handleCanvasTouchEnd,
    onTouchCancel: handleCanvasTouchEnd,
    style: { width: '100%', height: '100%', display: 'block', cursor: draggingAnno ? 'grabbing' : 'default', touchAction: 'none' },
  };

  // Page toggle — shown above the canvas in both layouts so the user can preview
  // page 1 (overview) vs page 2 (detail) before exporting.
  const pageToggle = (
    <div className="flex items-center gap-1">
      {[1, 2].map(p => (
        <button key={p} onClick={() => setCurrentPage(p)}
          className="font-display px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition"
          style={{
            background: currentPage === p ? BRAND.orange : BRAND.white,
            color: currentPage === p ? BRAND.white : BRAND.ink,
            border: `1px solid ${currentPage === p ? BRAND.orange : BRAND.line}`,
          }}>
          Page {p} {p === 1 ? '· Overview' : '· Detail'}
        </button>
      ))}
    </div>
  );

  const tabsBar = (
    <div className="flex border-b flex-wrap" style={{ borderColor: BRAND.line }}>
      {tabs.map(t => (
        <button key={t.k} onClick={() => setActiveTab(t.k)}
          className="font-display flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            borderBottom: `2px solid ${activeTab === t.k ? BRAND.orange : 'transparent'}`,
            color: activeTab === t.k ? BRAND.ink : BRAND.muted,
            background: activeTab === t.k ? BRAND.white : 'transparent',
            minWidth: 56,
          }}>
          {t.i} {t.l}
        </button>
      ))}
    </div>
  );

  // ---------- Render ----------
  // Mobile header height — used to compute workspace height. Closed = compact bar only,
  // open = compact bar + toggles strip below it.
  const mobileHeaderHeight = mobileControlsOpen ? 92 : 48;

  return (
    <div className="font-body min-h-screen text-paceon-ink" style={{ background: BRAND.paper }}>
      {/* Top bar */}
      {isMobile ? (
        <div className="border-b" style={{ borderColor: BRAND.line, background: BRAND.white }}>
          <button
            onClick={() => setMobileControlsOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-2"
            style={{ background: BRAND.white }}>
            {headerLogoBlock}
            <div className="flex items-center gap-2">
              {exportStatus && <span className="text-[10px] truncate max-w-[120px]" style={{ color: BRAND.olive }}>{exportStatus}</span>}
              <div className="flex items-center gap-1 px-2 py-1 font-display text-[10px] uppercase tracking-wider"
                style={{ color: BRAND.muted, border: `1px solid ${BRAND.line}` }}>
                {project.sport === 'cycling' ? 'CYC' : 'RUN'} · {FORMATS[project.format].label.split(' ')[1] || FORMATS[project.format].label}
                {mobileControlsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </div>
            </div>
          </button>
          {mobileControlsOpen && (
            <div className="px-3 pb-2 overflow-x-auto scroll-thin border-t" style={{ borderColor: BRAND.line }}>
              <div className="pt-2">{formatTogglesBlock}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="border-b flex items-center justify-between px-5 py-3 flex-wrap gap-2" style={{ borderColor: BRAND.line, background: BRAND.white }}>
          <div className="flex items-center gap-6 flex-wrap">
            {headerLogoBlock}
            {formatTogglesBlock}
          </div>
          {desktopExportButtons}
        </div>
      )}

      {/* Workspace */}
      {isMobile ? (
        <div className="flex flex-col" style={{ height: `calc(100vh - ${mobileHeaderHeight}px)` }}>
          {/* Canvas — renders inline normally, becomes fullscreen overlay when zoomed.
              Either way it's the SAME DOM node, so the ref stays valid and the
              render loop keeps drawing without a remount. */}
          {zoomed ? (
            <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(10,10,10,0.95)' }}
              onClick={() => setZoomed(false)}>
              <div className="flex justify-between items-center px-4 py-3 flex-shrink-0">
                <div className="font-display text-[10px] uppercase tracking-widest text-white opacity-70">
                  {format.label} · {format.w}×{format.h}
                </div>
                <button onClick={(e) => { e.stopPropagation(); setZoomed(false); }}
                  className="text-white opacity-80 p-2">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
                <div className="relative bg-black"
                  style={{
                    aspectRatio: `${format.w} / ${format.h}`,
                    maxHeight: '100%', maxWidth: '100%',
                    height: format.h >= format.w ? '100%' : 'auto',
                    width:  format.h >= format.w ? 'auto'  : '100%',
                  }}>
                  <canvas {...canvasProps} />
                </div>
              </div>
              <div className="text-center px-4 py-2 flex-shrink-0">
                <div className="font-display text-[10px] uppercase tracking-widest text-white opacity-50">
                  Tap outside the post to close · drag notes to reposition
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center px-3 py-2 flex-shrink-0 cursor-pointer"
                style={{ background: '#e8e5dc', height: 'min(38vh, 80vw)' }}
                onClick={() => setZoomed(true)}>
                <div className="relative bg-black"
                  style={{
                    aspectRatio: `${format.w} / ${format.h}`,
                    maxHeight: '100%',
                    maxWidth: '100%',
                    height: format.h >= format.w ? '100%' : 'auto',
                    width:  format.h >= format.w ? 'auto'  : '100%',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                  }}>
                  <canvas {...canvasProps} />
                </div>
              </div>
              <div className="flex justify-center py-1.5 flex-shrink-0" style={{ background: '#e8e5dc' }}>
                {pageToggle}
              </div>
            </>
          )}

          {/* Tab bar + content */}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: BRAND.panel }}>
            <div className="overflow-x-auto scroll-thin flex-shrink-0" style={{ background: BRAND.panel }}>
              <div style={{ minWidth: 'max-content' }}>{tabsBar}</div>
            </div>
            <div className="flex-1 overflow-y-auto scroll-thin p-4">
              {renderActivePanel()}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: '400px 1fr 320px', height: 'calc(100vh - 56px)' }}>
          {/* LEFT — tabs + active panel */}
          <div className="flex flex-col border-r" style={{ borderColor: BRAND.line, background: BRAND.panel }}>
            {tabsBar}
            <div className="flex-1 overflow-y-auto scroll-thin p-4">
              {renderActivePanel()}
            </div>
          </div>

          {/* CENTER — canvas */}
          <div className="flex flex-col items-center justify-center p-6 gap-3" style={{ background: '#e8e5dc' }}>
            {pageToggle}
            <div className="relative bg-black"
              style={{
                maxHeight: '100%', maxWidth: '100%',
                aspectRatio: `${format.w} / ${format.h}`,
                height: 'calc(100vh - 160px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)',
              }}>
              <canvas {...canvasProps} />
            </div>
            <div className="text-xs font-display uppercase tracking-widest" style={{ color: BRAND.muted }}>
              {format.w} × {format.h}px · {format.label} · drag note bubbles to reposition
            </div>
          </div>

          {/* RIGHT — content sidebar */}
          <div className="flex flex-col border-l overflow-y-auto scroll-thin" style={{ borderColor: BRAND.line, background: BRAND.panel }}>
            <ContentPanel project={project} updateProject={updateProject} metrics={metrics}
              autoFillDescription={autoFillDescription} autoFillCaption={autoFillCaption}
              autoFillDetailedPlan={autoFillDetailedPlan}
              embedded={true} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Reusable bits ----------
function Toggle({ label, options, value, onChange, accent, getOptionLabel }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="font-display uppercase tracking-wider mr-1" style={{ color: BRAND.muted }}>{label}</span>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)}
          className="px-3 py-1.5 font-display font-semibold uppercase tracking-wider transition"
          style={{
            background: value === o ? accent : 'transparent',
            color: value === o ? BRAND.white : BRAND.ink,
            border: `1px solid ${value === o ? accent : BRAND.line}`,
          }}>
          {getOptionLabel ? getOptionLabel(o) : o}
        </button>
      ))}
    </div>
  );
}

function Metric({ label, value, highlight }) {
  return (
    <div className="border p-2"
      style={{
        borderColor: highlight ? BRAND.orange : BRAND.line,
        background: BRAND.white,
        borderWidth: highlight ? 2 : 1,
      }}>
      <div className="font-display text-[9px] font-semibold uppercase tracking-wider" style={{ color: BRAND.orange }}>{label}</div>
      <div className="font-display text-sm font-bold mt-0.5" style={{ color: BRAND.ink }}>{value}</div>
    </div>
  );
}

/* OverrideField — small numeric input used for IF/TSS overrides. The value is
   either a number (override active) or undefined (use auto-calculated). The
   placeholder shows the auto-calculated value so the user knows what they're
   overriding. Empty string commits as "remove override" so the field falls
   back to auto. */
function OverrideField({ label, value, placeholder, step, onChange }) {
  const [local, setLocal] = useState(typeof value === 'number' ? String(value) : '');
  const lastExternal = useRef(value);

  useEffect(() => {
    if (value !== lastExternal.current) {
      lastExternal.current = value;
      setLocal(typeof value === 'number' ? String(value) : '');
    }
  }, [value]);

  const commit = (raw) => {
    if (raw === '' || raw === '.') {
      lastExternal.current = undefined;
      onChange('');
      return;
    }
    const num = parseFloat(raw);
    if (!Number.isNaN(num)) {
      lastExternal.current = num;
      onChange(num);
    }
  };

  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: BRAND.muted }}>{label}</div>
      <input
        type="text"
        inputMode="decimal"
        pattern="[0-9]*\.?[0-9]*"
        value={local}
        placeholder={placeholder}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
          setLocal(cleaned);
          commit(cleaned);
        }}
        onBlur={() => {
          // No special blur behaviour — empty stays empty (auto), valid stays valid
        }}
        className="w-full px-1.5 py-1 text-xs border" style={{ borderColor: BRAND.line }} />
    </div>
  );
}

function BuildPanel({ project, addSegment, addRepeat, updateSegment, updateSegmentLabelConfig, removeSegment, moveSegment }) {
  return (
    <div>
      <div className="font-display text-xs font-bold uppercase tracking-widest mb-3" style={{ color: BRAND.muted }}>Workout Structure</div>
      <div className="space-y-2">
        {project.segments.map(s => (
          <SegmentEditor key={s.id} segment={s} sport={project.sport}
            labelsEnabled={!!project.showGraphLabels}
            updateSegment={updateSegment} updateSegmentLabelConfig={updateSegmentLabelConfig}
            removeSegment={removeSegment} moveSegment={moveSegment} />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={addSegment}
          className="font-display flex items-center justify-center gap-1 py-2 text-xs font-semibold uppercase tracking-wider"
          style={{ background: BRAND.white, border: `1px solid ${BRAND.line}` }}>
          <Plus size={12} /> Segment
        </button>
        <button onClick={addRepeat}
          className="font-display flex items-center justify-center gap-1 py-2 text-xs font-semibold uppercase tracking-wider"
          style={{ background: BRAND.white, border: `1px solid ${BRAND.line}` }}>
          <Repeat size={12} /> Repeat block
        </button>
      </div>

      <div className="mt-6">
        <div className="font-display text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.muted }}>Zones reference ({project.sport})</div>
        <div className="space-y-1">
          {(project.sport === 'cycling' ? ZONES_CYCLING : ZONES_RUNNING).map(z => (
            <div key={z.id} className="flex items-center gap-2 text-[11px]">
              <div style={{ width: 14, height: 14, background: z.color }} />
              <span className="font-display font-semibold" style={{ minWidth: 38 }}>Z{z.id}</span>
              <span className="flex-1">{z.name.replace(`Z${z.id} `, '')}</span>
              <span style={{ color: BRAND.muted }}>{z.low}–{z.high === 999 ? '∞' : z.high}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SegmentEditor({ segment, sport, labelsEnabled, updateSegment, updateSegmentLabelConfig, removeSegment, moveSegment, isChild }) {
  const [labelOpen, setLabelOpen] = useState(false);

  if (segment.type === 'repeat') {
    return (
      <div className="border-2 border-dashed p-2" style={{ borderColor: BRAND.olive, background: 'rgba(106,113,75,0.04)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Repeat size={14} style={{ color: BRAND.olive }} />
            <span className="font-display text-xs font-bold uppercase" style={{ color: BRAND.olive }}>Repeat</span>
            <input type="number" min={1} max={20} value={segment.count}
              onChange={e => updateSegment(segment.id, { count: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-12 px-1.5 py-0.5 text-xs border" style={{ borderColor: BRAND.line }} />
            <span className="text-[10px]" style={{ color: BRAND.muted }}>×</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={() => moveSegment(segment.id, -1)} className="p-1 hover:bg-white"><ArrowUp size={11} /></button>
            <button onClick={() => moveSegment(segment.id, 1)} className="p-1 hover:bg-white"><ArrowDown size={11} /></button>
            <button onClick={() => removeSegment(segment.id)} className="p-1 hover:bg-white" style={{ color: '#a13d00' }}><Trash2 size={11} /></button>
          </div>
        </div>
        <div className="space-y-1.5 ml-3">
          {segment.children.map(c => (
            <SegmentEditor key={c.id} segment={c} sport={sport} isChild={true}
              labelsEnabled={labelsEnabled}
              updateSegment={updateSegment} updateSegmentLabelConfig={updateSegmentLabelConfig}
              removeSegment={removeSegment} moveSegment={moveSegment} />
          ))}
          <button
            onClick={() => updateSegment(segment.id, { children: [...segment.children, seg('Step', 1, 60, 70)] })}
            className="font-display w-full py-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{ border: `1px dashed ${BRAND.line}`, background: 'transparent' }}>
            + Step
          </button>
        </div>
      </div>
    );
  }

  const mid = (segment.intensityLow + segment.intensityHigh) / 2;
  const zone = getZoneFor(mid, sport);
  const cfg = segment.labelConfig || DEFAULT_LABEL_CONFIG;

  // Compact label-state badge: A (auto), S (always show), H (hidden)
  const labelBadge = cfg.show === 'always' ? 'S' : cfg.show === 'never' ? 'H' : 'A';
  const labelBadgeColor = cfg.show === 'always' ? BRAND.orange : cfg.show === 'never' ? '#a13d00' : BRAND.muted;

  return (
    <div className="bg-white border" style={{ borderColor: BRAND.line }}>
      <div className="p-2">
        <div className="flex items-center gap-1 mb-1.5">
          <div style={{ width: 6, height: 22, background: zone.color }} />
          <DebouncedInput value={segment.label}
            onCommit={v => updateSegment(segment.id, { label: v })}
            className="flex-1 font-display text-xs font-semibold uppercase tracking-wide bg-transparent" />
          <button
            onClick={() => setLabelOpen(o => !o)}
            className="p-1 hover:bg-gray-50 flex items-center gap-0.5 font-display text-[9px] font-bold uppercase tracking-wider"
            style={{ color: labelOpen ? BRAND.orange : labelBadgeColor }}
            title={labelsEnabled ? `Segment label: ${cfg.show}` : 'Enable Show segment labels in Style tab to use'}>
            <Tag size={10} /><span style={{ minWidth: 8, display: 'inline-block', textAlign: 'center' }}>{labelBadge}</span>
          </button>
          {!isChild && (
            <>
              <button onClick={() => moveSegment(segment.id, -1)} className="p-1 hover:bg-gray-50"><ArrowUp size={10} /></button>
              <button onClick={() => moveSegment(segment.id, 1)} className="p-1 hover:bg-gray-50"><ArrowDown size={10} /></button>
            </>
          )}
          <button onClick={() => removeSegment(segment.id)} className="p-1 hover:bg-gray-50" style={{ color: '#a13d00' }}><X size={11} /></button>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <DurationField label="Min" value={segment.duration} mode="min"
            onChange={v => updateSegment(segment.id, { duration: v })} />
          <DurationField label="Sec" value={segment.duration} mode="sec"
            onChange={v => updateSegment(segment.id, { duration: v })} />
          <NumberField label="Low %" value={segment.intensityLow}
            onChange={v => updateSegment(segment.id, { intensityLow: v })} integer />
          <NumberField label="High %" value={segment.intensityHigh}
            onChange={v => updateSegment(segment.id, { intensityHigh: v })} integer />
        </div>
        <div className="mt-1 text-[10px] flex justify-between" style={{ color: BRAND.muted }}>
          <span className="font-display">{zone.name}</span>
          <span>{segment.intensityLow}–{segment.intensityHigh}% · {fmtDuration(segment.duration)}</span>
        </div>
      </div>

      {labelOpen && (
        <div className="border-t p-2 space-y-2.5" style={{ borderColor: BRAND.line, background: BRAND.panel }}>
          <div className="font-display text-[10px] font-bold uppercase tracking-widest" style={{ color: BRAND.muted }}>
            Segment Label {!labelsEnabled && <span style={{ color: '#a13d00', fontWeight: 'normal', textTransform: 'none' }}>· Enable in Style tab first</span>}
          </div>

          <div className="grid grid-cols-3 gap-1">
            {[
              { v: 'auto',   l: 'Auto',  hint: 'Show if wide enough' },
              { v: 'always', l: 'Show',  hint: 'Force show with leader if narrow' },
              { v: 'never',  l: 'Hide',  hint: 'Never show' },
            ].map(opt => (
              <button key={opt.v} onClick={() => updateSegmentLabelConfig(segment.id, { show: opt.v })}
                className="font-display py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  background: cfg.show === opt.v ? BRAND.ink : BRAND.white,
                  color: cfg.show === opt.v ? BRAND.white : BRAND.ink,
                  border: `1px solid ${BRAND.line}`,
                }}
                title={opt.hint}>
                {opt.l}
              </button>
            ))}
          </div>

          {cfg.show !== 'never' && (
            <>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-[10px]">
                  <input type="checkbox" checked={cfg.showIntensity !== false}
                    onChange={e => updateSegmentLabelConfig(segment.id, { showIntensity: e.target.checked })} />
                  <span className="font-display uppercase tracking-wider" style={{ color: BRAND.muted }}>%</span>
                </label>
                <label className="flex items-center gap-1 text-[10px]">
                  <input type="checkbox" checked={cfg.showTime !== false}
                    onChange={e => updateSegmentLabelConfig(segment.id, { showTime: e.target.checked })} />
                  <span className="font-display uppercase tracking-wider" style={{ color: BRAND.muted }}>Time</span>
                </label>
              </div>

              <SliderInput label="Size" min={0.6} max={2.0} step={0.1}
                value={cfg.size || 1.0}
                format={v => `${v.toFixed(1)}×`}
                onChange={v => updateSegmentLabelConfig(segment.id, { size: v })} />

              <div className="grid grid-cols-2 gap-2">
                <NumberField label="Nudge X" value={cfg.offsetX || 0}
                  onChange={v => updateSegmentLabelConfig(segment.id, { offsetX: v })} integer />
                <NumberField label="Nudge Y" value={cfg.offsetY || 0}
                  onChange={v => updateSegmentLabelConfig(segment.id, { offsetY: v })} integer />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[10px] uppercase tracking-wider flex-1" style={{ color: BRAND.muted }}>Intensity colour</span>
                  <input type="color" value={cfg.color || '#ffffff'}
                    onChange={e => updateSegmentLabelConfig(segment.id, { color: e.target.value })}
                    className="w-6 h-6 cursor-pointer" style={{ border: `1px solid ${BRAND.line}` }} />
                  {cfg.color && (
                    <button onClick={() => updateSegmentLabelConfig(segment.id, { color: null })}
                      className="font-display text-[9px] uppercase tracking-wider px-1.5 py-0.5"
                      style={{ background: BRAND.white, border: `1px solid ${BRAND.line}` }}
                      title="Reset to default">×</button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-[10px] uppercase tracking-wider flex-1" style={{ color: BRAND.muted }}>Time colour</span>
                  <input type="color" value={cfg.subColor || '#999999'}
                    onChange={e => updateSegmentLabelConfig(segment.id, { subColor: e.target.value })}
                    className="w-6 h-6 cursor-pointer" style={{ border: `1px solid ${BRAND.line}` }} />
                  {cfg.subColor && (
                    <button onClick={() => updateSegmentLabelConfig(segment.id, { subColor: null })}
                      className="font-display text-[9px] uppercase tracking-wider px-1.5 py-0.5"
                      style={{ background: BRAND.white, border: `1px solid ${BRAND.line}` }}
                      title="Reset to default">×</button>
                  )}
                </div>
              </div>
            </>
          )}

          <button onClick={() => updateSegmentLabelConfig(segment.id, { ...DEFAULT_LABEL_CONFIG })}
            className="font-display w-full py-1 text-[9px] font-semibold uppercase tracking-wider"
            style={{ background: BRAND.white, border: `1px solid ${BRAND.line}`, color: BRAND.muted }}>
            Reset label to defaults
          </button>
        </div>
      )}
    </div>
  );
}

/* NumberField — uses local state so the field can be temporarily empty while
   editing. The parent value updates on each valid keystroke, but the displayed
   text reflects exactly what the user typed (no surprise zero-prefixing on mobile).
   On blur, if the field is empty or invalid, it falls back to 0. */
function NumberField({ label, value, onChange, step = 1, integer = false }) {
  const [local, setLocal] = useState(String(value));
  const lastExternal = useRef(value);

  useEffect(() => {
    // External value changed (preset load, segment reorder) — adopt it
    if (value !== lastExternal.current) {
      lastExternal.current = value;
      setLocal(String(value));
    }
  }, [value]);

  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: BRAND.muted }}>{label}</div>
      <input
        type="text"
        inputMode={integer ? 'numeric' : 'decimal'}
        pattern={integer ? '[0-9]*' : '[0-9]*\\.?[0-9]*'}
        value={local}
        onChange={(e) => {
          const raw = e.target.value;
          // Allow only digits (and a single decimal point for non-integer fields)
          const cleaned = integer
            ? raw.replace(/[^0-9]/g, '')
            : raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
          setLocal(cleaned);
          // Push valid numeric values to parent in real time; ignore empty/partial
          if (cleaned === '' || cleaned === '.') return;
          const num = integer ? parseInt(cleaned, 10) : parseFloat(cleaned);
          if (!Number.isNaN(num)) {
            lastExternal.current = num;
            onChange(num);
          }
        }}
        onBlur={() => {
          // Empty field on blur → commit 0 and reflect that in the display
          if (local === '' || local === '.') {
            lastExternal.current = 0;
            setLocal('0');
            onChange(0);
          }
        }}
        className="w-full px-1.5 py-1 text-xs border" style={{ borderColor: BRAND.line }} />
    </div>
  );
}

/* DurationField — splits a decimal-minute value into separate Min and Sec
   inputs. Each field is rendered independently (mode="min" or mode="sec") so
   the SegmentEditor can place them side-by-side in its grid. The two fields
   share the same underlying `value` (decimal minutes) and `onChange` handler;
   editing either one recomputes the combined value.
   - Mode "min": shows whole minutes (Math.floor). Sub-minute values display
     as 0; the user can still see their seconds in the Sec field.
   - Mode "sec": shows the seconds remainder (0-59). Editing it past 59
     overflows into minutes (e.g. typing 90 becomes 1m 30s). */
function DurationField({ label, value, mode, onChange }) {
  const totalSec = Math.max(0, Math.round((value || 0) * 60));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec - mins * 60;

  const displayValue = mode === 'min' ? mins : secs;
  const [local, setLocal] = useState(String(displayValue));
  const lastDisplayed = useRef(displayValue);

  useEffect(() => {
    // External value changed — recompute our half and re-display
    if (displayValue !== lastDisplayed.current) {
      lastDisplayed.current = displayValue;
      setLocal(String(displayValue));
    }
  }, [displayValue]);

  const commit = (cleaned) => {
    if (cleaned === '') return; // empty is fine while typing
    const num = parseInt(cleaned, 10);
    if (Number.isNaN(num)) return;
    let newMins = mins;
    let newSecs = secs;
    if (mode === 'min') newMins = num;
    else newSecs = num;
    // Allow seconds > 59 to overflow naturally
    const newTotalSec = newMins * 60 + newSecs;
    const newDecimalMin = newTotalSec / 60;
    lastDisplayed.current = mode === 'min' ? Math.floor(newTotalSec / 60) : (newTotalSec - Math.floor(newTotalSec / 60) * 60);
    onChange(newDecimalMin);
  };

  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: BRAND.muted }}>{label}</div>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={local}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[^0-9]/g, '');
          setLocal(cleaned);
          commit(cleaned);
        }}
        onBlur={() => {
          if (local === '') {
            // Empty on blur → 0 for that half; the other half stays
            setLocal('0');
            commit('0');
          }
        }}
        className="w-full px-1.5 py-1 text-xs border" style={{ borderColor: BRAND.line }} />
    </div>
  );
}

function StylePanel({ project, updateProject, handleLogoUpload, resetLogo, setAllLabelsShow }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="font-display text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.muted }}>Graph Style</div>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(GRAPH_STYLES).map(([k, s]) => (
            <button key={k} onClick={() => updateProject({ graphStyle: k })}
              className="font-display py-2 text-xs font-semibold uppercase tracking-wider"
              style={{
                background: project.graphStyle === k ? BRAND.ink : BRAND.white,
                color: project.graphStyle === k ? BRAND.white : BRAND.ink,
                border: `1px solid ${BRAND.line}`,
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="font-display text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.muted }}>Segment Labels</div>
        <div className="flex items-center gap-2 p-2.5" style={{ background: BRAND.white, border: `1px solid ${BRAND.line}` }}>
          <input type="checkbox" id="showGraphLabels"
            checked={!!project.showGraphLabels}
            onChange={e => updateProject({ showGraphLabels: e.target.checked })} />
          <label htmlFor="showGraphLabels" className="font-display text-xs uppercase tracking-wider flex-1 cursor-pointer">
            Show time + intensity above each bar
          </label>
        </div>

        {project.showGraphLabels && (
          <>
            <div className="font-display text-[10px] font-bold uppercase tracking-wider mt-3 mb-1.5" style={{ color: BRAND.muted }}>
              Bulk action — set every segment to:
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[
                { v: 'auto',   l: 'Auto'  },
                { v: 'always', l: 'Show All'  },
                { v: 'never',  l: 'Hide All' },
              ].map(opt => (
                <button key={opt.v} onClick={() => setAllLabelsShow(opt.v)}
                  className="font-display py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ background: BRAND.white, border: `1px solid ${BRAND.line}` }}>
                  {opt.l}
                </button>
              ))}
            </div>
            <div className="text-[10px] mt-1.5 leading-relaxed" style={{ color: BRAND.muted }}>
              Per-segment overrides are set in the <strong>Build</strong> tab — tap the <Tag size={10} className="inline" /> badge on any segment.
              Forced labels on narrow segments use a leader line.
            </div>
          </>
        )}

        {!project.showGraphLabels && (
          <div className="text-[10px] mt-1.5" style={{ color: BRAND.muted }}>
            Enable to access per-segment label customisation in the Build tab.
          </div>
        )}
      </div>

      <div>
        <div className="font-display text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.muted }}>PaceOn Logo</div>
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          {['white', 'black'].map(v => (
            <button key={v} onClick={() => updateProject({ logo: { ...project.logo, variant: v } })}
              className="font-display py-1.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                background: project.logo.variant === v ? BRAND.ink : BRAND.white,
                color: project.logo.variant === v ? BRAND.white : BRAND.ink,
                border: `1px solid ${BRAND.line}`,
              }}>
              {v}
            </button>
          ))}
        </div>
        {project.logo.hasCustom ? (
          <button onClick={resetLogo}
            className="font-display w-full flex items-center justify-center gap-1 py-2 text-xs font-semibold uppercase tracking-wider"
            style={{ background: BRAND.white, border: `1px solid ${BRAND.line}`, color: '#a13d00' }}>
            <X size={12} /> Reset to bundled logo
          </button>
        ) : (
          <label className="font-display flex items-center justify-center gap-1 py-2 text-xs font-semibold uppercase tracking-wider cursor-pointer"
            style={{ background: BRAND.white, border: `1px solid ${BRAND.line}` }}>
            <Plus size={12} /> Upload override (optional)
            <input type="file" accept="image/*,.svg" onChange={handleLogoUpload} className="hidden" />
          </label>
        )}
        <div className="text-[10px] mt-1.5" style={{ color: BRAND.muted }}>
          Bundled logos load automatically. Use white on dark backgrounds, black on light.
        </div>
      </div>

      <div>
        <div className="font-display text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.muted }}>Brand Lock</div>
        <div className="border p-3 text-[11px]" style={{ borderColor: BRAND.line, background: BRAND.white }}>
          <div className="flex items-center gap-2 mb-1">
            <div style={{ width: 10, height: 10, background: '#10b981', borderRadius: 50 }} />
            <span className="font-display font-semibold uppercase tracking-wider text-[10px]">Locked</span>
          </div>
          <div style={{ color: BRAND.muted }}>
            Typography (League Spartan + Roboto), colour palette, and footer wordmark are locked to PaceOn brand standards.
          </div>
          <div className="flex gap-1 mt-2">
            {[BRAND.white, BRAND.olive, BRAND.orange, BRAND.black].map(c => (
              <div key={c} style={{ width: 24, height: 24, background: c, border: `1px solid ${BRAND.line}` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BackgroundPanel({ project, updateProject, bgFile, setBgFile, handleBackgroundUpload }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="font-display text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.muted }}>Background Media</div>
        <label className="font-display flex items-center justify-center gap-1 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer"
          style={{ background: BRAND.white, border: `1px dashed ${BRAND.line}` }}>
          <Plus size={13} /> Upload image or video
          <input type="file" accept="image/*,video/*" onChange={handleBackgroundUpload} className="hidden" />
        </label>
        {bgFile && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                {bgFile.type === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
                <span style={{ color: BRAND.muted }}>
                  {bgFile.type} loaded{bgFile.sizeMB ? ` · ${bgFile.sizeMB.toFixed(1)}MB` : ''}
                </span>
              </div>
              <button onClick={() => setBgFile(null)} className="font-display font-semibold uppercase tracking-wider text-[10px]"
                style={{ color: '#a13d00' }}>Remove</button>
            </div>
            {bgFile.sizeMB && bgFile.sizeMB > 4.5 && (
              <div className="text-[10px] p-1.5" style={{ background: '#fff4ef', color: '#7a2d00', border: `1px solid #f0d0c0` }}>
                Too large to save with project — works in this session only. Use a smaller file or trim the video to persist.
              </div>
            )}
          </div>
        )}
      </div>

      <SliderInput label="Tint Opacity" min={0} max={1} step={0.05}
        value={project.background.tint}
        onChange={v => updateProject({ background: { ...project.background, tint: v } })} />

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-display text-xs font-bold uppercase tracking-widest" style={{ color: BRAND.muted }}>Gradient overlay</span>
          <button onClick={() => updateProject({ background: { ...project.background, gradient: !project.background.gradient } })}
            className="font-display text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: project.background.gradient ? BRAND.orange : BRAND.muted }}>
            {project.background.gradient ? 'On' : 'Off'}
          </button>
        </div>
        {project.background.gradient && (
          <div className="space-y-3">
            <SliderInput label="Top Darkness" min={0} max={1} step={0.05}
              value={project.background.gradientTop}
              onChange={v => updateProject({ background: { ...project.background, gradientTop: v } })} />
            <SliderInput label="Bottom Darkness" min={0} max={1} step={0.05}
              value={project.background.gradientBottom}
              onChange={v => updateProject({ background: { ...project.background, gradientBottom: v } })} />
          </div>
        )}
      </div>
    </div>
  );
}

function SliderInput({ label, min, max, step, value, onChange, format }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="font-display font-semibold uppercase tracking-wider" style={{ color: BRAND.muted }}>{label}</span>
        <span className="font-display font-bold" style={{ color: BRAND.ink }}>
          {format ? format(value) : `${Math.round(value * 100)}%`}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full" style={{ accentColor: BRAND.orange }} />
    </div>
  );
}

/* DebouncedTextarea / DebouncedInput
   Keep the user's typing in local state and only push to the parent on:
   - 400ms of inactivity (so the canvas redraws shortly after they pause)
   - Blur (so the value is committed when they move on)
   This prevents any race conditions between rapid typing and other state updates,
   and keeps the canvas snappy because it isn't re-rendering on every keystroke.
   The component also re-syncs from props when the external value changes
   (e.g. auto-draft, preset load, project switch). */
function DebouncedTextarea({ value, onCommit, debounceMs = 400, ...rest }) {
  const [local, setLocal] = useState(value ?? '');
  const lastExternal = useRef(value);
  const timer = useRef(null);

  useEffect(() => {
    // External value changed (preset load, auto-draft) — adopt it
    if (value !== lastExternal.current) {
      lastExternal.current = value;
      setLocal(value ?? '');
    }
  }, [value]);

  const commit = (v) => {
    lastExternal.current = v;
    onCommit(v);
  };

  return (
    <textarea
      {...rest}
      value={local}
      onChange={(e) => {
        const v = e.target.value;
        setLocal(v);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => commit(v), debounceMs);
      }}
      onBlur={() => {
        if (timer.current) { clearTimeout(timer.current); timer.current = null; }
        if (local !== lastExternal.current) commit(local);
      }}
    />
  );
}

function DebouncedInput({ value, onCommit, debounceMs = 400, ...rest }) {
  const [local, setLocal] = useState(value ?? '');
  const lastExternal = useRef(value);
  const timer = useRef(null);

  useEffect(() => {
    if (value !== lastExternal.current) {
      lastExternal.current = value;
      setLocal(value ?? '');
    }
  }, [value]);

  const commit = (v) => {
    lastExternal.current = v;
    onCommit(v);
  };

  return (
    <input
      {...rest}
      value={local}
      onChange={(e) => {
        const v = e.target.value;
        setLocal(v);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => commit(v), debounceMs);
      }}
      onBlur={() => {
        if (timer.current) { clearTimeout(timer.current); timer.current = null; }
        if (local !== lastExternal.current) commit(local);
      }}
    />
  );
}

function ColorRow({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-display text-[10px] uppercase tracking-wider flex-1" style={{ color: BRAND.muted }}>{label}</span>
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        className="w-7 h-7 cursor-pointer" style={{ border: `1px solid ${BRAND.line}` }} />
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="w-20 px-1.5 py-0.5 text-[11px] font-mono border" style={{ borderColor: BRAND.line }} />
    </div>
  );
}

function AnnotatePanel({ project, flat, addAnnotation, updateAnnotation, removeAnnotation, resetAnnotationStyle }) {
  const [expandedAnno, setExpandedAnno] = useState(null);
  const [showStylePicker, setShowStylePicker] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="font-display text-xs font-bold uppercase tracking-widest" style={{ color: BRAND.muted }}>
          Annotations <span style={{ color: BRAND.orange }}>· Page 2 only</span>
        </div>
        <button onClick={() => setShowStylePicker(s => !s)}
          className="font-display flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold"
          style={{ color: BRAND.orange }}>
          <Plus size={11} /> Add
        </button>
      </div>
      <div className="text-[10px] mb-3 leading-relaxed" style={{ color: BRAND.muted }}>
        Annotations only render on Page 2 (the detail slide). Switch the canvas page toggle to preview them.
      </div>

      {showStylePicker && (
        <div className="mb-3 grid grid-cols-2 gap-1.5 p-2" style={{ background: BRAND.white, border: `1px solid ${BRAND.line}` }}>
          {Object.entries(ANNOTATION_PRESETS).map(([k, p]) => (
            <button key={k} onClick={() => { addAnnotation(k); setShowStylePicker(false); }}
              className="text-left p-2 hover:bg-gray-50 transition" style={{ border: `1px solid ${BRAND.line}` }}>
              <div className="flex items-center gap-1.5 mb-1">
                <div style={{ width: 8, height: 8, background: p.accent }} />
                <span className="font-display text-[10px] font-bold uppercase tracking-wider">{p.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {project.annotations.map(a => (
          <div key={a.id} className="bg-white border" style={{ borderColor: BRAND.line }}>
            <div className="p-2.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 10, height: 10, background: a.accentColor || ANNOTATION_PRESETS[a.style].accent }} />
                  <select value={a.style} onChange={e => {
                    const newStyle = e.target.value;
                    const preset = ANNOTATION_PRESETS[newStyle];
                    updateAnnotation(a.id, {
                      style: newStyle,
                      bgColor: preset.bg, textColor: preset.text,
                      accentColor: preset.accent, accentBar: preset.accentBar,
                      arrowColor: preset.accent,
                      arrowStyle: preset.arrowStyle || 'solid',
                    });
                  }}
                    className="font-display text-[10px] font-semibold uppercase tracking-wider bg-transparent">
                    {Object.entries(ANNOTATION_PRESETS).map(([k, s]) => (
                      <option key={k} value={k}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => setExpandedAnno(expandedAnno === a.id ? null : a.id)}
                    className="p-1" style={{ color: expandedAnno === a.id ? BRAND.orange : BRAND.muted }}
                    title="Customise style">
                    <Palette size={11} />
                  </button>
                  <button onClick={() => updateAnnotation(a.id, { visible: !a.visible })}
                    className="p-1" style={{ color: a.visible ? BRAND.ink : BRAND.muted }}>
                    {a.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                  </button>
                  <button onClick={() => removeAnnotation(a.id)} className="p-1" style={{ color: '#a13d00' }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              <div className="text-[10px] mb-1 font-display uppercase tracking-wider" style={{ color: BRAND.muted }}>Target</div>
              <select
                value={
                  a.targetMode === 'segment' ? `segment:${a.targetIndex}` :
                  a.targetMode === 'repeat'  ? `repeat:${a.targetRepeatId}` :
                  'free'
                }
                onChange={e => {
                  const v = e.target.value;
                  if (v === 'free') updateAnnotation(a.id, { targetMode: 'free' });
                  else if (v.startsWith('segment:')) {
                    updateAnnotation(a.id, { targetMode: 'segment', targetIndex: parseInt(v.slice(8), 10) });
                  } else if (v.startsWith('repeat:')) {
                    updateAnnotation(a.id, { targetMode: 'repeat', targetRepeatId: v.slice(7) });
                  }
                }}
                className="w-full text-xs px-1.5 py-1 border mb-2" style={{ borderColor: BRAND.line }}>
                {/* Repeat blocks first (they're usually what coaches want to point at) */}
                {project.segments.filter(s => s.type === 'repeat').map(r => {
                  const childSummary = r.children.length === 1
                    ? `${fmtDuration(r.children[0].duration)} @ ${r.children[0].intensityLow}%`
                    : `${r.children.length} steps`;
                  return (
                    <option key={`r-${r.id}`} value={`repeat:${r.id}`}>
                      🔁 Repeat {r.count}× — {childSummary}
                    </option>
                  );
                })}
                {flat.map((s, i) => (
                  <option key={`s-${i}`} value={`segment:${i}`}>{i + 1}. {s.label} ({fmtDuration(s.duration)})</option>
                ))}
                <option value="free">— Free position (drag tip) —</option>
              </select>

              <DebouncedTextarea
                value={a.text}
                onCommit={(text) => updateAnnotation(a.id, { text })}
                rows={4}
                className="w-full text-xs px-1.5 py-1 border" style={{ borderColor: BRAND.line, resize: 'vertical' }} />
              <div className="text-[10px] mt-1 leading-relaxed" style={{ color: BRAND.muted }}>
                <strong>**bold**</strong>, <em>*italic*</em>, <code>- text</code> for a bullet.
              </div>
            </div>

            {expandedAnno === a.id && (
              <div className="p-2.5 border-t space-y-3" style={{ borderColor: BRAND.line, background: BRAND.panel }}>
                <div className="font-display text-[10px] font-bold uppercase tracking-widest" style={{ color: BRAND.muted }}>
                  Bubble
                </div>
                <ColorRow label="Background" value={a.bgColor} onChange={v => updateAnnotation(a.id, { bgColor: v })} />
                <ColorRow label="Text colour" value={a.textColor} onChange={v => updateAnnotation(a.id, { textColor: v })} />
                <ColorRow label="Accent" value={a.accentColor} onChange={v => updateAnnotation(a.id, { accentColor: v })} />
                <SliderInput label="Bubble width" min={0.2} max={0.85} step={0.05}
                  value={a.bubbleWidth || 0.4}
                  format={v => `${Math.round(v * 100)}%`}
                  onChange={v => updateAnnotation(a.id, { bubbleWidth: v })} />
                <SliderInput label="Background opacity" min={0} max={1} step={0.05}
                  value={a.bubbleOpacity ?? 0.96}
                  onChange={v => updateAnnotation(a.id, { bubbleOpacity: v })} />

                <div className="flex items-center gap-2">
                  <input type="checkbox" id={`bar-${a.id}`} checked={a.accentBar !== false}
                    onChange={e => updateAnnotation(a.id, { accentBar: e.target.checked })} />
                  <label htmlFor={`bar-${a.id}`} className="font-display text-[10px] uppercase tracking-wider" style={{ color: BRAND.muted }}>
                    Show accent bar
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id={`label-${a.id}`} checked={a.showLabel !== false}
                    onChange={e => updateAnnotation(a.id, { showLabel: e.target.checked })} />
                  <label htmlFor={`label-${a.id}`} className="font-display text-[10px] uppercase tracking-wider" style={{ color: BRAND.muted }}>
                    Show label
                  </label>
                </div>
                {a.showLabel !== false && (
                  <div>
                    <div className="font-display text-[10px] uppercase tracking-wider mb-1" style={{ color: BRAND.muted }}>
                      Custom label (blank = use preset)
                    </div>
                    <DebouncedInput value={a.customLabel || ''}
                      placeholder={ANNOTATION_PRESETS[a.style].label}
                      onCommit={v => updateAnnotation(a.id, { customLabel: v })}
                      className="w-full text-xs px-1.5 py-1 border" style={{ borderColor: BRAND.line }} />
                  </div>
                )}

                <div className="font-display text-[10px] font-bold uppercase tracking-widest pt-2" style={{ color: BRAND.muted }}>
                  Arrow
                </div>
                <ColorRow label="Colour" value={a.arrowColor} onChange={v => updateAnnotation(a.id, { arrowColor: v })} />
                <div>
                  <div className="font-display text-[10px] uppercase tracking-wider mb-1" style={{ color: BRAND.muted }}>Line style</div>
                  <div className="grid grid-cols-3 gap-1">
                    {Object.entries(ARROW_STYLES).map(([k, s]) => (
                      <button key={k} onClick={() => updateAnnotation(a.id, { arrowStyle: k })}
                        className="font-display py-1 text-[10px] font-semibold uppercase tracking-wider"
                        style={{
                          background: a.arrowStyle === k ? BRAND.ink : BRAND.white,
                          color: a.arrowStyle === k ? BRAND.white : BRAND.ink,
                          border: `1px solid ${BRAND.line}`,
                        }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-display text-[10px] uppercase tracking-wider mb-1" style={{ color: BRAND.muted }}>Head</div>
                  <div className="grid grid-cols-3 gap-1">
                    {Object.entries(ARROW_HEADS).map(([k, s]) => (
                      <button key={k} onClick={() => updateAnnotation(a.id, { arrowHead: k })}
                        className="font-display py-1 text-[10px] font-semibold uppercase tracking-wider"
                        style={{
                          background: a.arrowHead === k ? BRAND.ink : BRAND.white,
                          color: a.arrowHead === k ? BRAND.white : BRAND.ink,
                          border: `1px solid ${BRAND.line}`,
                        }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <SliderInput label="Line thickness" min={1} max={6} step={0.5}
                  value={a.arrowWidth || 2}
                  format={v => `${v}px`}
                  onChange={v => updateAnnotation(a.id, { arrowWidth: v })} />

                <button onClick={() => resetAnnotationStyle(a.id)}
                  className="font-display w-full py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ background: BRAND.white, border: `1px solid ${BRAND.line}`, color: BRAND.muted }}>
                  Reset to preset defaults
                </button>
              </div>
            )}
          </div>
        ))}

        {project.annotations.length === 0 && (
          <div className="text-center py-6 text-[11px]" style={{ color: BRAND.muted }}>
            No annotations yet.
            <br /><br />
            Add explanatory notes that point to specific segments — perfect for explaining heart-rate drift, cadence cues, or pacing strategy.
          </div>
        )}
      </div>

      {project.annotations.length > 0 && (
        <div className="mt-4 p-2 text-[10px] leading-relaxed" style={{ background: BRAND.white, border: `1px solid ${BRAND.line}`, color: BRAND.muted }}>
          <strong className="font-display uppercase tracking-wider" style={{ color: BRAND.ink }}>Tip:</strong> drag any bubble on the canvas to reposition it. If notes are covering the graph, also try the <strong>Layout</strong> tab to move the graph up or shrink it.
        </div>
      )}
    </div>
  );
}

function LayoutPanel({ project, updateProject }) {
  const positions = project.positions || DEFAULT_POSITIONS;
  const setPos = (patch) => updateProject({ positions: { ...positions, ...patch } });
  const reset = () => updateProject({ positions: { ...DEFAULT_POSITIONS } });

  // Slider range: -0.3 means up to 30% of canvas height up, +0.3 means down
  return (
    <div className="space-y-5">
      <div className="text-[11px] leading-relaxed" style={{ color: BRAND.muted }}>
        Fine-tune where each element sits on the canvas. All offsets are relative to the layout default — set them all back to zero with the reset button below.
      </div>

      <div className="space-y-4">
        <SliderInput label="Title position" min={-0.15} max={0.3} step={0.01}
          value={positions.titleY}
          format={v => v === 0 ? 'default' : `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`}
          onChange={v => setPos({ titleY: v })} />

        <SliderInput label="Graph position" min={-0.2} max={0.4} step={0.01}
          value={positions.graphY}
          format={v => v === 0 ? 'default' : `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`}
          onChange={v => setPos({ graphY: v })} />

        <SliderInput label="Graph height" min={-0.15} max={0.25} step={0.01}
          value={positions.graphHeight}
          format={v => v === 0 ? 'default' : `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`}
          onChange={v => setPos({ graphHeight: v })} />

        <SliderInput label="Description position" min={-0.3} max={0.3} step={0.01}
          value={positions.descriptionY}
          format={v => v === 0 ? 'default' : `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`}
          onChange={v => setPos({ descriptionY: v })} />

        <SliderInput label="Metrics row position" min={-0.4} max={0.05} step={0.01}
          value={positions.metricsY}
          format={v => v === 0 ? 'default' : `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`}
          onChange={v => setPos({ metricsY: v })} />
      </div>

      <button onClick={reset}
        className="font-display w-full py-2 text-xs font-semibold uppercase tracking-wider"
        style={{ background: BRAND.white, border: `1px solid ${BRAND.line}` }}>
        Reset all to defaults
      </button>

      <div className="p-2 text-[10px] leading-relaxed" style={{ background: BRAND.white, border: `1px solid ${BRAND.line}`, color: BRAND.muted }}>
        <strong className="font-display uppercase tracking-wider" style={{ color: BRAND.ink }}>Tip:</strong> if annotations are covering the graph, push the graph down (positive value) or shrink the description area to make room.
      </div>
    </div>
  );
}

/* ContentPanel — title, description, caption, metrics.
   Used as the right sidebar on desktop (embedded=true → no outer padding/wrapping)
   and as the "Content" tab on mobile (embedded=false → tab-style spacing). */
function ContentPanel({ project, updateProject, metrics, autoFillDescription, autoFillCaption, autoFillDetailedPlan, embedded = false }) {
  const sectionClass = embedded ? "p-4 border-b" : "pb-4 border-b mb-4";

  const setOverride = (key, val) => {
    const o = { ...(project.metricOverrides || {}) };
    if (val === '' || val === null || val === undefined) delete o[key];
    else o[key] = val;
    updateProject({ metricOverrides: o });
  };

  const ifLabel  = project.sport === 'cycling' ? 'IF'  : 'rIF';
  const tssLabel = project.sport === 'cycling' ? 'TSS' : 'rTSS';
  const fmtIF = v => v.toFixed(2);

  return (
    <div className={embedded ? "" : "space-y-0"}>
      <div className={sectionClass} style={{ borderColor: BRAND.line }}>
        <div className="font-display text-xs font-bold uppercase tracking-widest mb-3" style={{ color: BRAND.muted }}>Session Metrics</div>
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Duration" value={fmtDuration(metrics.totalMin)} />
          <Metric
            label={ifLabel + (metrics.overridden.ifLow || metrics.overridden.ifHigh ? ' ·' : '')}
            value={metrics.ifLow === metrics.ifHigh ? fmtIF(metrics.ifLow) : `${fmtIF(metrics.ifLow)}–${fmtIF(metrics.ifHigh)}`}
            highlight={metrics.overridden.ifLow || metrics.overridden.ifHigh}
          />
          <Metric
            label={tssLabel + (metrics.overridden.tssLow || metrics.overridden.tssHigh ? ' ·' : '')}
            value={metrics.tssLow === metrics.tssHigh ? `${Math.round(metrics.tssLow)}` : `${Math.round(metrics.tssLow)}–${Math.round(metrics.tssHigh)}`}
            highlight={metrics.overridden.tssLow || metrics.overridden.tssHigh}
          />
        </div>
        <div className="text-[10px] mt-2" style={{ color: BRAND.muted }}>
          Auto-calculated from segments. Use the override fields below to set fixed values (e.g. from a TrainingPeaks workout).
        </div>

        <div className="mt-3">
          <div className="font-display text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: BRAND.muted }}>
            Manual Overrides
          </div>
          <div className="grid grid-cols-2 gap-2">
            <OverrideField label={`${ifLabel} low`} placeholder={metrics.ifLowAuto.toFixed(2)} step={0.01}
              value={project.metricOverrides?.ifLow}
              onChange={v => setOverride('ifLow', v)} />
            <OverrideField label={`${ifLabel} high`} placeholder={metrics.ifHighAuto.toFixed(2)} step={0.01}
              value={project.metricOverrides?.ifHigh}
              onChange={v => setOverride('ifHigh', v)} />
            <OverrideField label={`${tssLabel} low`} placeholder={`${Math.round(metrics.tssLowAuto)}`} step={1}
              value={project.metricOverrides?.tssLow}
              onChange={v => setOverride('tssLow', v)} />
            <OverrideField label={`${tssLabel} high`} placeholder={`${Math.round(metrics.tssHighAuto)}`} step={1}
              value={project.metricOverrides?.tssHigh}
              onChange={v => setOverride('tssHigh', v)} />
          </div>
          <div className="text-[10px] mt-1.5" style={{ color: BRAND.muted }}>
            Leave blank to use auto-calculated. Set both low and high to the same number to display a single value (e.g. {ifLabel} 0.85 instead of 0.83–0.87).
          </div>
        </div>
      </div>

      <div className={sectionClass} style={{ borderColor: BRAND.line }}>
        <label className="font-display text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: BRAND.muted }}>Title <span style={{ color: BRAND.orange }}>· Both pages</span></label>
        <DebouncedInput value={project.title} onCommit={v => updateProject({ title: v })}
          className="w-full px-3 py-2 text-sm border" style={{ borderColor: BRAND.line, background: BRAND.white }} />
      </div>

      <div className={sectionClass} style={{ borderColor: BRAND.line }}>
        <div className="flex items-center justify-between mb-2">
          <label className="font-display text-xs font-bold uppercase tracking-widest" style={{ color: BRAND.muted }}>
            Description <span style={{ color: BRAND.orange }}>· Page 1</span>
          </label>
          <button onClick={autoFillDescription} className="font-display flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold" style={{ color: BRAND.orange }}>
            <Sparkles size={10} /> Auto-draft
          </button>
        </div>
        <DebouncedTextarea value={project.description} onCommit={v => updateProject({ description: v })} rows={4}
          className="w-full px-3 py-2 text-sm border" style={{ borderColor: BRAND.line, background: BRAND.white, resize: 'vertical' }} />
        <div className="text-[10px] mt-1 leading-relaxed" style={{ color: BRAND.muted }}>
          Short overview shown on the first slide. Format inline: <strong>**bold**</strong>, <em>*italic*</em>. Start a line with <code>- </code> or <code>* </code> for a bullet.
        </div>
      </div>

      <div className={sectionClass} style={{ borderColor: BRAND.line }}>
        <div className="flex items-center justify-between mb-2">
          <label className="font-display text-xs font-bold uppercase tracking-widest" style={{ color: BRAND.muted }}>
            Detailed Plan <span style={{ color: BRAND.orange }}>· Page 2</span>
          </label>
          <button onClick={autoFillDetailedPlan} className="font-display flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold" style={{ color: BRAND.orange }}>
            <Sparkles size={10} /> Auto-draft from structure
          </button>
        </div>
        <DebouncedTextarea value={project.detailedPlan} onCommit={v => updateProject({ detailedPlan: v })} rows={8}
          placeholder={"Structured breakdown of the session.\n\nFormatting:\n  **bold** and *italic* for emphasis\n  - or * to start a bullet\n  Two leading spaces for nested indent\n\nExample:\n  **Repeat 3×**\n  - 30s @ 120% FTP (Z5)\n  - 4m 30s @ 70% FTP (Z2)"}
          className="w-full px-3 py-2 text-xs border font-mono" style={{ borderColor: BRAND.line, background: BRAND.white, resize: 'vertical' }} />
        <div className="text-[10px] mt-1 leading-relaxed" style={{ color: BRAND.muted }}>
          Bullets: <code>- text</code> or <code>* text</code>. Inline: <strong>**bold**</strong>, <em>*italic*</em>. Indent with 2 spaces for nested items. Wrapped lines stay aligned without a phantom bullet.
        </div>
      </div>

      <div className={embedded ? "p-4" : ""}>
        <div className="flex items-center justify-between mb-2">
          <label className="font-display text-xs font-bold uppercase tracking-widest" style={{ color: BRAND.muted }}>Instagram Caption</label>
          <button onClick={autoFillCaption} className="font-display flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold" style={{ color: BRAND.orange }}>
            <Sparkles size={10} /> Auto-draft
          </button>
        </div>
        <DebouncedTextarea value={project.caption} onCommit={v => updateProject({ caption: v })} rows={6}
          className="w-full px-3 py-2 text-xs border font-mono" style={{ borderColor: BRAND.line, background: BRAND.white, resize: 'vertical' }} />
        {project.caption && (
          <button onClick={() => navigator.clipboard.writeText(project.caption)}
            className="font-display mt-2 flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: BRAND.olive }}>
            <Copy size={10} /> Copy caption
          </button>
        )}
      </div>
    </div>
  );
}

/* ExportPanel — mobile-only "Export" tab containing Save / Image / Video buttons
   plus the video loop length picker. On desktop the same actions live in the top bar. */
function ExportPanel({ project, updateProject, saveProject, exportImage, exportVideo, exportBothImages, exportBothVideos, exportStatus, currentPage }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="font-display text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.muted }}>
          Export Current Page <span style={{ color: BRAND.orange }}>· Page {currentPage}</span>
        </div>
        <div className="space-y-2">
          <button onClick={exportImage}
            className="font-display w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold uppercase tracking-wider text-white"
            style={{ background: BRAND.ink }}>
            <Download size={15} /> Image (PNG)
          </button>
          <button onClick={exportVideo}
            className="font-display w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold uppercase tracking-wider text-white"
            style={{ background: BRAND.orange }}>
            <Video size={15} /> Video ({project.videoLoopLength}s loop)
          </button>
        </div>
      </div>

      <div>
        <div className="font-display text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.muted }}>
          Export Both Pages
        </div>
        <div className="space-y-2">
          <button onClick={exportBothImages}
            className="font-display w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold uppercase tracking-wider"
            style={{ background: BRAND.white, border: `2px solid ${BRAND.ink}`, color: BRAND.ink }}>
            <Download size={15} /> Both images (×2 PNGs)
          </button>
          <button onClick={exportBothVideos}
            className="font-display w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold uppercase tracking-wider"
            style={{ background: BRAND.white, border: `2px solid ${BRAND.orange}`, color: BRAND.orange }}>
            <Video size={15} /> Both videos (×2, sequential)
          </button>
        </div>
        <div className="text-[10px] mt-2 leading-relaxed" style={{ color: BRAND.muted }}>
          "Both videos" records page 1 then page 2 back-to-back, taking {project.videoLoopLength * 2}s in total. Don't switch pages while it's running.
        </div>
      </div>

      <div>
        <button onClick={saveProject}
          className="font-display w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold uppercase tracking-wider"
          style={{ background: BRAND.white, border: `1px solid ${BRAND.line}` }}>
          <Save size={15} /> Save project
        </button>
      </div>

      {exportStatus && (
        <div className="text-[11px] p-2" style={{ background: BRAND.white, color: BRAND.olive, border: `1px solid ${BRAND.line}` }}>
          {exportStatus}
        </div>
      )}

      <div>
        <div className="font-display text-xs font-bold uppercase tracking-widest mb-3" style={{ color: BRAND.muted }}>Video Loop Length</div>
        <div className="flex gap-1.5">
          {[5, 10, 15].map(s => (
            <button key={s} onClick={() => updateProject({ videoLoopLength: s })}
              className="font-display flex-1 py-2 text-xs font-semibold uppercase tracking-wider"
              style={{
                background: project.videoLoopLength === s ? BRAND.ink : BRAND.white,
                color: project.videoLoopLength === s ? BRAND.white : BRAND.ink,
                border: `1px solid ${BRAND.line}`,
              }}>
              {s}s
            </button>
          ))}
        </div>
      </div>

      <div className="text-[10px] leading-relaxed p-2" style={{ background: BRAND.white, border: `1px solid ${BRAND.line}`, color: BRAND.muted }}>
        Modern Chrome/Edge exports MP4 directly. Other browsers fall back to WebM — convert to MP4 (CloudConvert / HandBrake) for guaranteed Instagram compatibility.
      </div>
    </div>
  );
}

function PresetsPanel({ project, loadPreset, clearProject, savedProjects, loadProject, deleteProject, exportProjects, importProjects }) {
  const presets = PRESETS[project.sport] || [];
  return (
    <div className="space-y-5">
      <div>
        <div className="font-display text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.muted }}>Start Over</div>
        <button onClick={clearProject}
          className="font-display w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold uppercase tracking-wider"
          style={{ background: BRAND.white, border: `1px solid ${BRAND.line}`, color: '#a13d00' }}>
          <Trash2 size={12} /> Clear all fields
        </button>
        <div className="text-[10px] mt-1.5" style={{ color: BRAND.muted }}>
          Wipes title, segments, description, plan, caption, and annotations. Keeps your sport, format, layout, and background.
        </div>
      </div>

      <div>
        <div className="font-display text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.muted }}>Library ({project.sport})</div>
        <div className="space-y-1.5">
          {presets.map((p, i) => (
            <button key={i} onClick={() => loadPreset(p)}
              className="w-full text-left bg-white border p-2.5 hover:border-orange-600 transition"
              style={{ borderColor: BRAND.line }}>
              <div className="font-display text-xs font-bold uppercase tracking-wider">{p.name}</div>
              <div className="text-[10px] mt-0.5" style={{ color: BRAND.muted }}>{p.segments.length} block{p.segments.length !== 1 ? 's' : ''}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="font-display text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.muted }}>Saved Projects</div>
        {savedProjects.length === 0 ? (
          <div className="text-[11px] py-2" style={{ color: BRAND.muted }}>
            None saved on this device yet — use Save (top bar on desktop, Export tab on mobile) to persist your work.
          </div>
        ) : (
          <div className="space-y-1.5">
            {savedProjects.map(name => (
              <div key={name} className="flex items-center bg-white border" style={{ borderColor: BRAND.line }}>
                <button onClick={() => loadProject(name)}
                  className="flex-1 text-left p-2 font-display text-xs font-semibold uppercase tracking-wider">
                  <FolderOpen size={11} className="inline mr-1.5" />
                  {name}
                </button>
                <button onClick={() => deleteProject(name)} className="p-2" style={{ color: '#a13d00' }}>
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="font-display text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.muted }}>Move Projects Between Devices</div>
        <div className="text-[10px] mb-2 leading-relaxed" style={{ color: BRAND.muted }}>
          Saved projects live in this browser only. To move them to another device, export them to a JSON file then import on the other device.
        </div>
        <div className="space-y-1.5">
          {savedProjects.length > 0 && (
            <button onClick={exportProjects}
              className="font-display w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold uppercase tracking-wider"
              style={{ background: BRAND.white, border: `1px solid ${BRAND.line}` }}>
              <Download size={12} /> Export all projects
            </button>
          )}
          <label className="font-display w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold uppercase tracking-wider cursor-pointer"
            style={{ background: BRAND.white, border: `1px solid ${BRAND.line}` }}>
            <Plus size={12} /> Import projects
            <input type="file" accept="application/json,.json" onChange={importProjects} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}
