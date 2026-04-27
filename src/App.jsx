import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Trash2, ArrowUp, ArrowDown, Repeat, Image as ImageIcon, Video,
  Download, Save, FolderOpen, Sparkles, FileText, MessageSquare, Layers,
  Bookmark, X, Copy, Eye, EyeOff,
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

const ANNOTATION_STYLES = {
  coach:    { label: "Coach's Tip",    accent: BRAND.orange, icon: '◆' },
  science:  { label: 'Science Note',   accent: BRAND.olive,  icon: '◇' },
  mistake:  { label: 'Common Mistake', accent: '#7a2d00',    icon: '!' },
  cue:      { label: 'Execution Cue',  accent: BRAND.black,  icon: '→' },
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

function rid() { return Math.random().toString(36).slice(2, 10); }
function seg(label, duration, low, high) {
  return { id: rid(), type: 'segment', label, duration, intensityLow: low, intensityHigh: high };
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

function fmtDuration(min) {
  if (min < 60) return `${Math.round(min * 10) / 10}min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min - h * 60);
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
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

function autoDraftCaption(title, segments, sport, description) {
  const flat = flattenSegments(segments);
  const { totalMin, ifLow, ifHigh, tssLow, tssHigh } = calculateMetrics(flat, sport);
  const tags = sport === 'cycling'
    ? '#cycling #ftp #sweetspot #vo2max #endurance #triathlon #cyclingtraining #pacelife'
    : '#running #threshold #vo2max #endurancerunning #marathon #triathlon #pacelife';
  return `${title || "This week's key session"}\n\n${description}\n\n— Duration: ${fmtDuration(totalMin)}\n— IF: ${ifLow.toFixed(2)}–${ifHigh.toFixed(2)}\n— TSS: ${Math.round(tssLow)}–${Math.round(tssHigh)}\n\nPaceOn — evidence-driven coaching for athletes balancing ambition with life.\n\n#paceon ${tags}`;
}

// ---------- Canvas drawing ----------
function drawCanvas(ctx, opts) {
  const { project, format, sport, mediaEl, mediaType, hoverAnno } = opts;
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
  drawLogo(ctx, project, W, H, pad);

  const titleSize = Math.round(W * 0.072);
  const titleY = pad + Math.round(W * 0.13);

  const kickSize = Math.round(W * 0.022);
  ctx.font = `600 ${kickSize}px "League Spartan", system-ui, sans-serif`;
  ctx.fillStyle = BRAND.orange;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText('KEY SESSION  /  ' + (sport === 'cycling' ? 'CYCLING' : 'RUNNING'), pad, titleY - kickSize - 12);

  ctx.font = `700 ${titleSize}px "League Spartan", system-ui, sans-serif`;
  ctx.fillStyle = BRAND.white;
  const titleLines = wrapText(ctx, (project.title || 'Workout Title').toUpperCase(), W - pad * 2, 2);
  let cy = titleY;
  titleLines.forEach(line => {
    ctx.fillText(line, pad, cy);
    cy += titleSize * 1.05;
  });

  const flat = flattenSegments(project.segments);
  let graphHeight;
  if (project.layout === 'graphLed') graphHeight = Math.round(H * 0.32);
  else if (project.layout === 'descriptionLed') graphHeight = Math.round(H * 0.22);
  else graphHeight = Math.round(H * 0.20);
  const graphTop = cy + Math.round(W * 0.06);
  const graphRect = { x: pad, y: graphTop, w: W - pad * 2, h: graphHeight };
  drawGraph(ctx, graphRect, flat, sport, project.graphStyle);
  drawAnnotations(ctx, project.annotations, flat, graphRect, W, hoverAnno);

  const descTop = graphTop + graphHeight + Math.round(W * 0.06);
  drawDescription(ctx, project.description, pad, descTop, W - pad * 2, W);
  drawCalculations(ctx, flat, sport, pad, H, W);

  ctx.font = `600 ${Math.round(W * 0.018)}px "League Spartan", system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.textAlign = 'right';
  ctx.fillText('paceon.com.au', W - pad, H - pad - Math.round(W * 0.07));
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
    // Fallback wordmark
    ctx.fillStyle = BRAND.white;
    ctx.font = `800 ${Math.round(W * 0.05)}px "League Spartan", system-ui, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText('PACE', x, y);
    ctx.fillStyle = BRAND.orange;
    ctx.fillText('ON', x + ctx.measureText('PACE').width, y);
  }
}

function drawGraph(ctx, rect, flatSegs, sport, style) {
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
  const innerY = y + 8;
  const innerH = h - axisPad - 8;
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

    cx += segW;
  });

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

  ctx.font = `500 ${Math.round(w * 0.02)}px Roboto, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('0:00', innerX, innerY + innerH + 6);
  ctx.textAlign = 'right';
  ctx.fillText(fmtDuration(totalMin), innerX + innerW, innerY + innerH + 6);
}

function drawAnnotations(ctx, annotations, flatSegs, graphRect, W, hoverAnno) {
  if (!annotations.length) return;
  const totalMin = flatSegs.reduce((s, x) => s + x.duration, 0) || 1;

  annotations.forEach(a => {
    if (!a.visible) return;
    let targetX, targetY;
    if (a.targetMode === 'segment' && a.targetIndex != null && flatSegs[a.targetIndex]) {
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

    const style = ANNOTATION_STYLES[a.style] || ANNOTATION_STYLES.coach;

    ctx.strokeStyle = style.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(noteX, noteY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();

    const angle = Math.atan2(targetY - noteY, targetX - noteX);
    const ah = 14;
    ctx.fillStyle = style.accent;
    ctx.beginPath();
    ctx.moveTo(targetX, targetY);
    ctx.lineTo(targetX - ah * Math.cos(angle - 0.4), targetY - ah * Math.sin(angle - 0.4));
    ctx.lineTo(targetX - ah * Math.cos(angle + 0.4), targetY - ah * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();

    const bubbleW = Math.min(W * 0.4, 380);
    const padB = 14;
    const labelSize = Math.round(W * 0.018);
    const bodySize = Math.round(W * 0.022);

    ctx.font = `400 ${bodySize}px Roboto, system-ui, sans-serif`;
    const lines = wrapTextAll(ctx, a.text || '', bubbleW - padB * 2);
    const bubbleH = padB * 2 + labelSize + 8 + lines.length * (bodySize * 1.3);

    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    roundRect(ctx, noteX - bubbleW / 2, noteY - bubbleH / 2, bubbleW, bubbleH, 6);
    ctx.fill();

    ctx.fillStyle = style.accent;
    ctx.fillRect(noteX - bubbleW / 2, noteY - bubbleH / 2, 4, bubbleH);

    ctx.fillStyle = style.accent;
    ctx.font = `700 ${labelSize}px "League Spartan", system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(style.label.toUpperCase(), noteX - bubbleW / 2 + padB + 4, noteY - bubbleH / 2 + padB);

    ctx.fillStyle = BRAND.ink;
    ctx.font = `400 ${bodySize}px Roboto, system-ui, sans-serif`;
    let ly = noteY - bubbleH / 2 + padB + labelSize + 8;
    lines.forEach(line => {
      ctx.fillText(line, noteX - bubbleW / 2 + padB + 4, ly);
      ly += bodySize * 1.3;
    });

    if (hoverAnno === a.id) {
      ctx.strokeStyle = style.accent;
      ctx.lineWidth = 2;
      roundRect(ctx, noteX - bubbleW / 2, noteY - bubbleH / 2, bubbleW, bubbleH, 6);
      ctx.stroke();
    }
  });
}

function drawDescription(ctx, text, x, y, w, W) {
  if (!text) return;
  const size = Math.round(W * 0.028);
  ctx.font = `400 ${size}px Roboto, system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  const lines = wrapTextAll(ctx, text, w);
  let cy = y;
  lines.slice(0, 6).forEach(line => {
    ctx.fillText(line, x, cy);
    cy += size * 1.4;
  });
}

function drawCalculations(ctx, flatSegs, sport, pad, H, W) {
  if (!flatSegs.length) return;
  const m = calculateMetrics(flatSegs, sport);
  const pillH = Math.round(W * 0.07);
  const y = H - pad - pillH;
  const pillSize = Math.round(W * 0.022);
  const labelSize = Math.round(W * 0.016);

  const items = [
    { label: 'DURATION', value: fmtDuration(m.totalMin) },
    { label: sport === 'cycling' ? 'IF' : 'rIF', value: `${m.ifLow.toFixed(2)}–${m.ifHigh.toFixed(2)}` },
    { label: sport === 'cycling' ? 'TSS' : 'rTSS', value: `${Math.round(m.tssLow)}–${Math.round(m.tssHigh)}` },
  ];

  let cx = pad;
  items.forEach(item => {
    ctx.font = `700 ${pillSize}px "League Spartan", system-ui, sans-serif`;
    const valW = ctx.measureText(item.value).width;
    ctx.font = `600 ${labelSize}px "League Spartan", system-ui, sans-serif`;
    const labW = ctx.measureText(item.label).width;
    const pillW = Math.max(valW, labW) + 36;

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

    cx += pillW + 12;
  });
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
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 0xff},${n & 0xff},${alpha})`;
}

// ---------- Main App ----------
const DEFAULT_PROJECT = {
  sport: 'cycling',
  format: 'story',
  layout: 'graphLed',
  graphStyle: 'stepped',
  title: 'Zone 2 with Spikes',
  segments: PRESETS.cycling[2].segments,
  description: PRESETS.cycling[2].description,
  caption: '',
  annotations: [],
  background: { tint: 0.55, gradient: true, gradientTop: 0.4, gradientBottom: 0.7 },
  logo: { variant: 'white', image: null, customImage: null },
  videoLoopLength: 10,
};

export default function App() {
  const [project, setProject] = useState(DEFAULT_PROJECT);
  const [activeTab, setActiveTab] = useState('build');
  const [savedProjects, setSavedProjects] = useState([]);
  const [exportStatus, setExportStatus] = useState('');
  const [hoverAnno, setHoverAnno] = useState(null);
  const [draggingAnno, setDraggingAnno] = useState(null);
  const [bgFile, setBgFile] = useState(null);
  const [bundledLogos, setBundledLogos] = useState({ white: null, black: null });

  const canvasRef = useRef(null);
  const mediaRef = useRef(null);
  const animRef = useRef(null);
  const recorderRef = useRef(null);

  const format = FORMATS[project.format];
  const flat = useMemo(() => flattenSegments(project.segments), [project.segments]);
  const metrics = useMemo(() => calculateMetrics(flat, project.sport), [flat, project.sport]);

  // Load bundled logos on mount
  useEffect(() => {
    const loadLogo = (path) => new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = path;
    });
    Promise.all([loadLogo('/logos/paceon-white.svg'), loadLogo('/logos/paceon-black.svg')])
      .then(([white, black]) => setBundledLogos({ white, black }));

    // Load saved projects from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('paceon:projects') || '{}');
      setSavedProjects(Object.keys(saved));
    } catch (e) {}
  }, []);

  // Switch logo image when variant changes (uses custom upload if present)
  useEffect(() => {
    setProject(p => {
      const img = p.logo.customImage || (p.logo.variant === 'white' ? bundledLogos.white : bundledLogos.black);
      return { ...p, logo: { ...p.logo, image: img } };
    });
  }, [project.logo.variant, project.logo.customImage, bundledLogos]);

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

  // Render loop
  useEffect(() => {
    let mounted = true;
    const render = () => {
      if (!mounted) return;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        drawCanvas(ctx, {
          project, format, sport: project.sport,
          mediaEl: mediaRef.current, mediaType: bgFile?.type || null, hoverAnno,
        });
      }
      animRef.current = requestAnimationFrame(render);
    };
    render();
    return () => { mounted = false; if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [project, format, bgFile, hoverAnno]);

  // Mouse interaction
  const getGraphRect = useCallback(() => {
    const c = canvasRef.current;
    const W = format.w, H = format.h;
    const pad = Math.round(W * 0.06);
    const titleSize = Math.round(W * 0.072);
    const titleY = pad + Math.round(W * 0.13);
    const ctx = c.getContext('2d');
    ctx.font = `700 ${titleSize}px "League Spartan", system-ui, sans-serif`;
    const titleLines = wrapText(ctx, (project.title || 'Workout Title').toUpperCase(), W - pad * 2, 2);
    const titleEnd = titleY + titleLines.length * titleSize * 1.05;
    const graphTop = titleEnd + Math.round(W * 0.06);
    const graphHeight = project.layout === 'graphLed' ? Math.round(H * 0.32) : project.layout === 'descriptionLed' ? Math.round(H * 0.22) : Math.round(H * 0.20);
    return { x: pad, y: graphTop, w: W - pad * 2, h: graphHeight };
  }, [format, project.title, project.layout]);

  const handleCanvasMouseDown = (e) => {
    const c = canvasRef.current;
    const rect = c.getBoundingClientRect();
    const sx = c.width / rect.width;
    const sy = c.height / rect.height;
    const x = (e.clientX - rect.left) * sx;
    const y = (e.clientY - rect.top) * sy;
    const graphRect = getGraphRect();

    for (const a of project.annotations) {
      if (!a.visible) continue;
      const noteX = graphRect.x + (a.notePos?.x ?? 0.7) * graphRect.w;
      const noteY = graphRect.y + (a.notePos?.y ?? -0.3) * graphRect.h;
      const totalMin = flat.reduce((s, x) => s + x.duration, 0) || 1;
      let targetX, targetY;
      if (a.targetMode === 'segment' && a.targetIndex != null && flat[a.targetIndex]) {
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

      const bubbleW = Math.min(format.w * 0.4, 380);
      const bubbleH = 200;
      if (Math.abs(x - noteX) < bubbleW / 2 && Math.abs(y - noteY) < bubbleH / 2) {
        setDraggingAnno({ id: a.id, mode: 'note' });
        return;
      }
      if (a.targetMode !== 'segment' && Math.hypot(x - targetX, y - targetY) < 30) {
        setDraggingAnno({ id: a.id, mode: 'arrow' });
        return;
      }
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!draggingAnno) return;
    const c = canvasRef.current;
    const rect = c.getBoundingClientRect();
    const sx = c.width / rect.width;
    const sy = c.height / rect.height;
    const x = (e.clientX - rect.left) * sx;
    const y = (e.clientY - rect.top) * sy;
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

  const handleCanvasMouseUp = () => setDraggingAnno(null);

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
    setProject(p => ({
      ...p,
      title: preset.title,
      segments: JSON.parse(JSON.stringify(preset.segments)).map(rebuildIds),
      description: preset.description,
      annotations: [],
    }));
  };

  const addAnnotation = () => {
    const a = {
      id: rid(),
      style: 'science',
      text: 'Heart rate drift is the gradual rise in heart rate over time during steady-state exercise despite constant power or pace, typically caused by fatigue, dehydration, heat stress, or reduced cardiovascular efficiency.',
      targetMode: 'segment',
      targetIndex: 0,
      notePos: { x: 0.7, y: -0.4 },
      arrowPos: { x: 0.5, y: 0.5 },
      visible: true,
    };
    setProject(p => ({ ...p, annotations: [...p.annotations, a] }));
  };

  const updateAnnotation = (id, patch) => setProject(p => ({ ...p, annotations: p.annotations.map(a => a.id === id ? { ...a, ...patch } : a) }));
  const removeAnnotation = (id) => setProject(p => ({ ...p, annotations: p.annotations.filter(a => a.id !== id) }));

  // Save / Load (localStorage)
  const saveProject = () => {
    const name = prompt('Project name:');
    if (!name) return;
    try {
      const all = JSON.parse(localStorage.getItem('paceon:projects') || '{}');
      const serialisable = {
        ...project,
        logo: { ...project.logo, image: null, customImage: null },
        _customLogo: project.logo.customImage ? null : null,
        _bgFile: bgFile,
      };
      all[name] = serialisable;
      localStorage.setItem('paceon:projects', JSON.stringify(all));
      setSavedProjects(Object.keys(all));
      setExportStatus(`Saved “${name}”`);
      setTimeout(() => setExportStatus(''), 2000);
    } catch (e) {
      setExportStatus('Save failed');
    }
  };

  const loadProject = (name) => {
    try {
      const all = JSON.parse(localStorage.getItem('paceon:projects') || '{}');
      const data = all[name];
      if (!data) return;
      const { _bgFile, ...proj } = data;
      setProject({ ...proj, logo: { ...proj.logo, image: null, customImage: null } });
      if (_bgFile) setBgFile(_bgFile);
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

  // Uploads
  const handleBackgroundUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setBgFile({ type: file.type.startsWith('video/') ? 'video' : 'image', url });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setProject(p => ({ ...p, logo: { ...p.logo, customImage: img } }));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const resetLogo = () => setProject(p => ({ ...p, logo: { ...p.logo, customImage: null } }));

  // Export
  const exportImage = () => {
    setExportStatus('Rendering image...');
    canvasRef.current.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `paceon-${project.format}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus('Image exported');
      setTimeout(() => setExportStatus(''), 2000);
    }, 'image/png');
  };

  const exportVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setExportStatus(`Recording ${project.videoLoopLength}s loop...`);

    const mimeCandidates = [
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    let mime = '';
    for (const m of mimeCandidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) { mime = m; break; }
    }
    if (!mime) {
      setExportStatus('Video recording not supported in this browser');
      return;
    }

    const stream = canvas.captureStream(30);
    const chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ext = mime.includes('mp4') ? 'mp4' : 'webm';
      a.href = url;
      a.download = `paceon-${project.format}-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus(`Video exported (.${ext})${ext === 'webm' ? ' — convert to MP4 for Instagram' : ''}`);
      setTimeout(() => setExportStatus(''), 4000);
    };

    if (mediaRef.current && bgFile?.type === 'video') {
      try { mediaRef.current.currentTime = 0; mediaRef.current.play(); } catch (e) {}
    }

    recorder.start();
    recorderRef.current = recorder;
    setTimeout(() => { try { recorder.stop(); } catch (e) {} }, project.videoLoopLength * 1000);
  };

  const autoFillDescription = () => updateProject({ description: autoDraftDescription(project.title, project.segments, project.sport) });
  const autoFillCaption = () => updateProject({ caption: autoDraftCaption(project.title, project.segments, project.sport, project.description) });

  return (
    <div className="font-body min-h-screen text-paceon-ink" style={{ background: BRAND.paper }}>
      {/* Top bar */}
      <div className="border-b flex items-center justify-between px-5 py-3 flex-wrap gap-2" style={{ borderColor: BRAND.line, background: BRAND.white }}>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3">
             <img src="/logos/paceon-black.svg" alt="PaceOn Coaching" className="h-8 w-auto" />
             <span className="font-display text-xs uppercase tracking-widest border-l pl-3"
               style={{ color: BRAND.muted, borderColor: BRAND.line }}>Post Builder</span>
          </div>

          <Toggle label="Sport" options={['cycling', 'running']} value={project.sport} onChange={v => updateProject({ sport: v })} accent={BRAND.olive} />

          <Toggle label="Format"
            options={Object.keys(FORMATS)}
            getOptionLabel={k => FORMATS[k].label}
            value={project.format} onChange={v => updateProject({ format: v })} accent={BRAND.ink} />

          <Toggle label="Layout"
            options={Object.keys(LAYOUTS)}
            getOptionLabel={k => LAYOUTS[k].label}
            value={project.layout} onChange={v => updateProject({ layout: v })} accent={BRAND.ink} />
        </div>

        <div className="flex items-center gap-2">
          {exportStatus && <span className="text-xs" style={{ color: BRAND.olive }}>{exportStatus}</span>}
          <button onClick={saveProject}
            className="font-display flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
            style={{ border: `1px solid ${BRAND.line}` }}>
            <Save size={13} /> Save
          </button>
          <button onClick={exportImage}
            className="font-display flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white"
            style={{ background: BRAND.ink }}>
            <Download size={13} /> Image
          </button>
          <button onClick={exportVideo}
            className="font-display flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white"
            style={{ background: BRAND.orange }}>
            <Video size={13} /> Video
          </button>
        </div>
      </div>

      {/* Workspace */}
      <div className="grid" style={{ gridTemplateColumns: '340px 1fr 320px', height: 'calc(100vh - 56px)' }}>
        {/* LEFT */}
        <div className="flex flex-col border-r" style={{ borderColor: BRAND.line, background: BRAND.panel }}>
          <div className="flex border-b" style={{ borderColor: BRAND.line }}>
            {[
              { k: 'build', l: 'Build', i: <Layers size={13} /> },
              { k: 'style', l: 'Style', i: <Sparkles size={13} /> },
              { k: 'background', l: 'BG', i: <ImageIcon size={13} /> },
              { k: 'annotate', l: 'Notes', i: <MessageSquare size={13} /> },
              { k: 'presets', l: 'Presets', i: <Bookmark size={13} /> },
            ].map(t => (
              <button key={t.k} onClick={() => setActiveTab(t.k)}
                className="font-display flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  borderBottom: `2px solid ${activeTab === t.k ? BRAND.orange : 'transparent'}`,
                  color: activeTab === t.k ? BRAND.ink : BRAND.muted,
                  background: activeTab === t.k ? BRAND.white : 'transparent',
                }}>
                {t.i} {t.l}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto scroll-thin p-4">
            {activeTab === 'build' && (
              <BuildPanel project={project} addSegment={addSegment} addRepeat={addRepeat}
                updateSegment={updateSegment} removeSegment={removeSegment} moveSegment={moveSegment} />
            )}
            {activeTab === 'style' && (
              <StylePanel project={project} updateProject={updateProject}
                handleLogoUpload={handleLogoUpload} resetLogo={resetLogo} />
            )}
            {activeTab === 'background' && (
              <BackgroundPanel project={project} updateProject={updateProject} bgFile={bgFile} setBgFile={setBgFile}
                handleBackgroundUpload={handleBackgroundUpload} />
            )}
            {activeTab === 'annotate' && (
              <AnnotatePanel project={project} flat={flat} addAnnotation={addAnnotation}
                updateAnnotation={updateAnnotation} removeAnnotation={removeAnnotation} />
            )}
            {activeTab === 'presets' && (
              <PresetsPanel project={project} loadPreset={loadPreset} savedProjects={savedProjects}
                loadProject={loadProject} deleteProject={deleteProject} />
            )}
          </div>
        </div>

        {/* CENTER */}
        <div className="flex flex-col items-center justify-center p-6" style={{ background: '#e8e5dc' }}>
          <div className="relative bg-black"
            style={{
              maxHeight: '100%', maxWidth: '100%',
              aspectRatio: `${format.w} / ${format.h}`,
              height: 'calc(100vh - 120px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)',
            }}>
            <canvas ref={canvasRef}
              width={format.w} height={format.h}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              style={{ width: '100%', height: '100%', display: 'block', cursor: draggingAnno ? 'grabbing' : 'default' }} />
          </div>
          <div className="mt-3 text-xs font-display uppercase tracking-widest" style={{ color: BRAND.muted }}>
            {format.w} × {format.h}px · {format.label} · drag note bubbles to reposition
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col border-l overflow-y-auto scroll-thin" style={{ borderColor: BRAND.line, background: BRAND.panel }}>
          <div className="p-4 border-b" style={{ borderColor: BRAND.line }}>
            <div className="font-display text-xs font-bold uppercase tracking-widest mb-3" style={{ color: BRAND.muted }}>Session Metrics</div>
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Duration" value={fmtDuration(metrics.totalMin)} />
              <Metric label={project.sport === 'cycling' ? 'IF' : 'rIF'} value={`${metrics.ifLow.toFixed(2)}–${metrics.ifHigh.toFixed(2)}`} />
              <Metric label={project.sport === 'cycling' ? 'TSS' : 'rTSS'} value={`${Math.round(metrics.tssLow)}–${Math.round(metrics.tssHigh)}`} />
            </div>
            <div className="text-[10px] mt-2" style={{ color: BRAND.muted }}>
              Ranges reflect the low–high intensity of each segment.
            </div>
          </div>

          <div className="p-4 border-b" style={{ borderColor: BRAND.line }}>
            <label className="font-display text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: BRAND.muted }}>Title</label>
            <input value={project.title} onChange={e => updateProject({ title: e.target.value })}
              className="w-full px-3 py-2 text-sm border" style={{ borderColor: BRAND.line, background: BRAND.white }} />
          </div>

          <div className="p-4 border-b" style={{ borderColor: BRAND.line }}>
            <div className="flex items-center justify-between mb-2">
              <label className="font-display text-xs font-bold uppercase tracking-widest" style={{ color: BRAND.muted }}>Description</label>
              <button onClick={autoFillDescription} className="font-display flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold" style={{ color: BRAND.orange }}>
                <Sparkles size={10} /> Auto-draft
              </button>
            </div>
            <textarea value={project.description} onChange={e => updateProject({ description: e.target.value })} rows={5}
              className="w-full px-3 py-2 text-sm border" style={{ borderColor: BRAND.line, background: BRAND.white, resize: 'vertical' }} />
          </div>

          <div className="p-4 border-b" style={{ borderColor: BRAND.line }}>
            <div className="flex items-center justify-between mb-2">
              <label className="font-display text-xs font-bold uppercase tracking-widest" style={{ color: BRAND.muted }}>Instagram Caption</label>
              <button onClick={autoFillCaption} className="font-display flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold" style={{ color: BRAND.orange }}>
                <Sparkles size={10} /> Auto-draft
              </button>
            </div>
            <textarea value={project.caption} onChange={e => updateProject({ caption: e.target.value })} rows={8}
              className="w-full px-3 py-2 text-xs border font-mono" style={{ borderColor: BRAND.line, background: BRAND.white, resize: 'vertical' }} />
            {project.caption && (
              <button onClick={() => navigator.clipboard.writeText(project.caption)}
                className="font-display mt-2 flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold"
                style={{ color: BRAND.olive }}>
                <Copy size={10} /> Copy caption
              </button>
            )}
          </div>

          <div className="p-4">
            <div className="font-display text-xs font-bold uppercase tracking-widest mb-3" style={{ color: BRAND.muted }}>Video Loop</div>
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
            <div className="text-[10px] mt-3 leading-relaxed" style={{ color: BRAND.muted }}>
              Modern Chrome/Edge exports MP4 directly. Other browsers fall back to WebM — convert to MP4 (CloudConvert / HandBrake) for guaranteed Instagram compatibility.
            </div>
          </div>
        </div>
      </div>
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

function Metric({ label, value }) {
  return (
    <div className="border p-2" style={{ borderColor: BRAND.line, background: BRAND.white }}>
      <div className="font-display text-[9px] font-semibold uppercase tracking-wider" style={{ color: BRAND.orange }}>{label}</div>
      <div className="font-display text-sm font-bold mt-0.5" style={{ color: BRAND.ink }}>{value}</div>
    </div>
  );
}

function BuildPanel({ project, addSegment, addRepeat, updateSegment, removeSegment, moveSegment }) {
  return (
    <div>
      <div className="font-display text-xs font-bold uppercase tracking-widest mb-3" style={{ color: BRAND.muted }}>Workout Structure</div>
      <div className="space-y-2">
        {project.segments.map(s => (
          <SegmentEditor key={s.id} segment={s} sport={project.sport}
            updateSegment={updateSegment} removeSegment={removeSegment} moveSegment={moveSegment} />
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

function SegmentEditor({ segment, sport, updateSegment, removeSegment, moveSegment, isChild }) {
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
              updateSegment={updateSegment} removeSegment={removeSegment} moveSegment={moveSegment} />
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

  return (
    <div className="bg-white border p-2" style={{ borderColor: BRAND.line }}>
      <div className="flex items-center gap-1 mb-1.5">
        <div style={{ width: 6, height: 22, background: zone.color }} />
        <input value={segment.label}
          onChange={e => updateSegment(segment.id, { label: e.target.value })}
          className="flex-1 font-display text-xs font-semibold uppercase tracking-wide bg-transparent" />
        {!isChild && (
          <>
            <button onClick={() => moveSegment(segment.id, -1)} className="p-1 hover:bg-gray-50"><ArrowUp size={10} /></button>
            <button onClick={() => moveSegment(segment.id, 1)} className="p-1 hover:bg-gray-50"><ArrowDown size={10} /></button>
          </>
        )}
        <button onClick={() => removeSegment(segment.id)} className="p-1 hover:bg-gray-50" style={{ color: '#a13d00' }}><X size={11} /></button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <NumberField label="Min" value={segment.duration} step={0.5}
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
  );
}

function NumberField({ label, value, onChange, step = 1, integer = false }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: BRAND.muted }}>{label}</div>
      <input type="number" step={step} value={value}
        onChange={e => onChange(integer ? parseInt(e.target.value) || 0 : parseFloat(e.target.value) || 0)}
        className="w-full px-1.5 py-1 text-xs border" style={{ borderColor: BRAND.line }} />
    </div>
  );
}

function StylePanel({ project, updateProject, handleLogoUpload, resetLogo }) {
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
        {project.logo.customImage ? (
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
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              {bgFile.type === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
              <span style={{ color: BRAND.muted }}>{bgFile.type} loaded</span>
            </div>
            <button onClick={() => setBgFile(null)} className="font-display font-semibold uppercase tracking-wider text-[10px]"
              style={{ color: '#a13d00' }}>Remove</button>
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

function SliderInput({ label, min, max, step, value, onChange }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="font-display font-semibold uppercase tracking-wider" style={{ color: BRAND.muted }}>{label}</span>
        <span className="font-display font-bold" style={{ color: BRAND.ink }}>{Math.round(value * 100)}%</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full" style={{ accentColor: BRAND.orange }} />
    </div>
  );
}

function AnnotatePanel({ project, flat, addAnnotation, updateAnnotation, removeAnnotation }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="font-display text-xs font-bold uppercase tracking-widest" style={{ color: BRAND.muted }}>Annotations</div>
        <button onClick={addAnnotation} className="font-display flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold"
          style={{ color: BRAND.orange }}>
          <Plus size={11} /> Add
        </button>
      </div>

      <div className="space-y-2">
        {project.annotations.map(a => (
          <div key={a.id} className="bg-white border p-2.5" style={{ borderColor: BRAND.line }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div style={{ width: 10, height: 10, background: ANNOTATION_STYLES[a.style].accent }} />
                <select value={a.style} onChange={e => updateAnnotation(a.id, { style: e.target.value })}
                  className="font-display text-[10px] font-semibold uppercase tracking-wider bg-transparent">
                  {Object.entries(ANNOTATION_STYLES).map(([k, s]) => (
                    <option key={k} value={k}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={() => updateAnnotation(a.id, { visible: !a.visible })}
                  className="p-1" style={{ color: a.visible ? BRAND.ink : BRAND.muted }}>
                  {a.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                </button>
                <button onClick={() => removeAnnotation(a.id)} className="p-1" style={{ color: '#a13d00' }}>
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
            <div className="text-[10px] mb-1 font-display uppercase tracking-wider" style={{ color: BRAND.muted }}>Target Segment</div>
            <select value={a.targetMode === 'segment' ? a.targetIndex : 'free'}
              onChange={e => {
                if (e.target.value === 'free') updateAnnotation(a.id, { targetMode: 'free' });
                else updateAnnotation(a.id, { targetMode: 'segment', targetIndex: parseInt(e.target.value) });
              }}
              className="w-full text-xs px-1.5 py-1 border mb-2" style={{ borderColor: BRAND.line }}>
              {flat.map((s, i) => (
                <option key={i} value={i}>{i + 1}. {s.label} ({fmtDuration(s.duration)})</option>
              ))}
              <option value="free">— Free position (drag tip) —</option>
            </select>
            <textarea value={a.text} onChange={e => updateAnnotation(a.id, { text: e.target.value })}
              rows={4}
              className="w-full text-xs px-1.5 py-1 border" style={{ borderColor: BRAND.line, resize: 'vertical' }} />
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
    </div>
  );
}

function PresetsPanel({ project, loadPreset, savedProjects, loadProject, deleteProject }) {
  const presets = PRESETS[project.sport] || [];
  return (
    <div className="space-y-5">
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
            None saved yet — use Save in the top bar to persist your work.
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
    </div>
  );
}
