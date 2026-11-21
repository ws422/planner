// ======================================================================
// maps.js · 지도 그리기
// 새 여행 2단계 지도(drawRegion), 계획의 지도 탭(drawDay), 걷기 추천 지도(drawWalk)
// 바다·강·지하철 모양 데이터는 data.js 의 GEO 에 있어요.
// 고치는 법: docs/수정가이드.md
// ======================================================================
const C0 = { lat: 33.592, lng: 130.403 };
const REGION_BASE = { x: -400, y: -262, w: 720, h: 468 };
// 시내는 크게·외곽은 작게 보이는 지도 좌표 변환
function fish(lat, lng) {
  const x = (lng - C0.lng) * KX,
    y = (C0.lat - lat) * KY,
    r = Math.hypot(x, y);
  if (r < 1e-6) return [0, 0];
  const f = (Math.log(1 + r / 0.8) / r) * 100;
  return [x * f, y * f];
}
const f1 = v => Math.round(v * 10) / 10;
// 부드러운 곡선 만들기
function smoothSeg(ps, closed) {
  const n = ps.length,
    get = i => (closed ? ps[(i + n) % n] : ps[Math.max(0, Math.min(n - 1, i))]);
  let d = '';
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1),
      p1 = get(i),
      p2 = get(i + 1),
      p3 = get(i + 2);
    d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
  }
  return d;
}
// 좌표 목록 → 곡선
function pathOf(ps, closed) {
  return `M${f1(ps[0][0])},${f1(ps[0][1])}` + smoothSeg(ps, closed) + (closed ? 'Z' : '');
}
// 바다·섬·공원·강·철도·지하철 그리기
function geoSVG(P, k, o = {}) {
  const pr = arr => arr.map(([la, ln]) => P(la, ln));
  const d2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  let h =
    '<defs><radialGradient id="hillg"><stop offset="0" class="hill-a"/><stop offset="1" class="hill-b"/></radialGradient></defs>';
  GEO.hills.forEach(([la, ln, r]) => {
    const c = P(la, ln),
      rr = d2(c, P(la + r, ln));
    h += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(rr)}" fill="url(#hillg)"/>`;
  });
  const sea = GEO.sea,
    corners = [sea[0], ...sea.slice(-2)],
    coast = pr(sea.slice(1, -2));
  const c0 = P(...corners[0]),
    cA = P(...corners[1]),
    cB = P(...corners[2]);
  const mid = (a, b) => P((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
  h += `<path class="sea" d="M${f1(c0[0])},${f1(c0[1])}L${f1(coast[0][0])},${f1(coast[0][1])}${smoothSeg(coast, false)}L${f1(cA[0])},${f1(cA[1])}L${mid(corners[1], corners[2]).map(f1).join(',')}L${f1(cB[0])},${f1(cB[1])}L${mid(corners[2], corners[0]).map(f1).join(',')}Z"/>`;
  h += `<path class="coast" d="M${f1(coast[0][0])},${f1(coast[0][1])}${smoothSeg(coast, false)}"/>`;
  GEO.islands.forEach(isl => {
    h += `<path class="land isl" d="${pathOf(pr(isl), true)}"/>`;
  });
  GEO.parks.forEach(([la, ln, rla, rln]) => {
    const c = P(la, ln);
    h += `<ellipse class="park" cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(d2(c, P(la, ln + rln)))}" ry="${f1(d2(c, P(la + rla, ln)))}"/>`;
  });
  GEO.ponds.forEach(([la, ln, rla, rln]) => {
    const c = P(la, ln);
    h += `<ellipse class="sea" cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(d2(c, P(la, ln + rln)))}" ry="${f1(d2(c, P(la + rla, ln)))}"/>`;
  });
  GEO.rivers.forEach(rv => {
    h += `<path class="river" style="stroke-width:${f1(o.riverW || 2.5 * k)}" d="${pathOf(pr(rv), false)}"/>`;
  });
  GEO.rails.forEach(r => {
    h += `<path class="rail" style="stroke-width:${f1(1.6 * k)};stroke-dasharray:${f1(5 * k)} ${f1(4 * k)}" d="M${pr(
      r.pts
    )
      .map(p => p.map(f1).join(','))
      .join('L')}"/>`;
  });
  Object.values(LINES).forEach(L => {
    h += `<path class="sline" style="stroke:${L.color};stroke-width:${f1((o.lineW || 2.4) * k)}" d="M${L.st.map(s => P(STATIONS[s].lat, STATIONS[s].lng).map(f1).join(',')).join('L')}"/>`;
  });
  if (o.stations) {
    Object.values(STATIONS).forEach(s => {
      const p = P(s.lat, s.lng);
      h += `<g transform="translate(${f1(p[0])},${f1(p[1])}) scale(${k})"><circle class="st" r="3.2"/><text class="st-t" x="6" y="-5">${s.n}</text></g>`;
    });
  }
  if (o.labels)
    GEO.labels.forEach(l => {
      const p = P(l.lat, l.lng);
      h += `<text class="sea-t" x="${f1(p[0])}" y="${f1(p[1])}" style="font-size:${f1(13 * k)}px">${l.t}</text>`;
    });
  return h;
}
// 화면에 있는 지도 모두 그리기
function drawMaps() {
  const r = document.getElementById('rmap');
  if (r) drawRegion(r, r.classList.contains('deco'));
  const d = document.getElementById('dmap');
  if (d) drawDay(d);
  const w = document.getElementById('wmap');
  if (w) drawWalk(w);
}
// ★ 새 여행 2단계 지도 (동네 동그라미 + 내 숙소 핀)
function drawRegion(el, deco) {
  const W = el.clientWidth,
    H = el.clientHeight;
  if (!W || !H) return;
  const B = REGION_BASE,
    s = Math.min(W / B.w, H / B.h);
  const base = { w: W / s, h: H / s };
  base.x = B.x + B.w / 2 - base.w / 2;
  base.y = B.y + B.h / 2 - base.h / 2;
  if (!deco) S.mvBase = base;
  const mv = !deco && S.mv ? S.mv : base;
  const k = mv.w / W;
  const sel = deco ? [] : S.draft.areas;
  let h = geoSVG(fish, k, { labels: true, lineW: 2 });
  SPOTS.forEach(sp => {
    if (AREA[sp.a].kind === 'trip') return;
    const p = fish(sp.lat, sp.lng);
    h += `<circle class="sdot${sel.includes(sp.a) ? ' on' : ''}" cx="${f1(p[0])}" cy="${f1(p[1])}" r="${f1(2.6 * k)}"/>`;
  });
  AREAS.filter(a => a.kind !== 'trip').forEach(a => {
    const p = fish(a.lat, a.lng),
      on = sel.includes(a.id);
    const lab = `<text class="apin-t" y="${a.lab === 'up' ? -22 : 31}">${a.n}</text>`;
    h += deco
      ? `<g class="apin deco" transform="translate(${f1(p[0])},${f1(p[1])}) scale(${f1(k * 0.85)})"><circle r="9" class="apin-c"/>${lab}</g>`
      : `<g class="apin${on ? ' on' : ''}" data-act="toggleArea" data-id="${a.id}" tabindex="0" role="button" aria-pressed="${on}" aria-label="${a.n}" transform="translate(${f1(p[0])},${f1(p[1])}) scale(${f1(k)})"><circle r="22" class="apin-hit"/><circle r="15" class="apin-c"/>${on ? '<path class="apin-k" d="M-6 0l4 4 8-9"/>' : '<circle r="4" class="apin-d"/>'}${lab}</g>`;
  });
  if (!deco) h += draftHotelPins(k);
  el.innerHTML = `<svg viewBox="${f1(mv.x)} ${f1(mv.y)} ${f1(mv.w)} ${f1(mv.h)}" role="img" aria-label="후쿠오카 안내 지도"${deco ? '' : ' class="pan"'}>${h}</svg>`;
  if (!deco) enablePan(el.querySelector('svg'), W);
}
// 새 여행 2단계 지도: 1단계에서 고른 숙소 자리에 핀 (같은 자리면 하나로 합쳐요)
function draftHotelStays() {
  const D = S.draft;
  if (!D || !D.start || !D.end) return [];
  return normStays(D.stays, draftNights(), D.hotel);
}
// 2단계 지도의 숙소 핀
function draftHotelPins(k) {
  const st = draftHotelStays();
  if (!st.length) return '';
  const multi = st.length > 1,
    groups = new Map();
  st.forEach((x, i) => {
    const pt = hotelPt(x.h),
      key = `${pt.lat.toFixed(4)},${pt.lng.toFixed(4)}`;
    if (!groups.has(key)) groups.set(key, { pt, n: [] });
    groups.get(key).n.push(i + 1);
  });
  let h = '';
  groups.forEach(g => {
    const p = fish(g.pt.lat, g.pt.lng),
      lab = multi ? L(`숙소 ${g.n.join('·')}`, `宿${g.n.join('・')}`) : L('내 숙소', '宿');
    h += `<g class="hpin" transform="translate(${f1(p[0])},${f1(p[1])}) scale(${f1(k)})" aria-hidden="true">
      <path class="hpin-b" d="M0 0C-4 -7 -12 -11 -12 -19a12 12 0 1 1 24 0c0 8 -8 12 -12 19z"/>
      <svg x="-7.5" y="-26.5" width="15" height="15" viewBox="0 0 24 24" class="hpin-ic">${ICON.home}</svg>
      <text class="hpin-t" x="15" y="-14">${esc(lab)}</text></g>`;
  });
  return h;
}
// 확대한 지도 손가락으로 끌기
function enablePan(svg, W) {
  let st = null;
  svg.addEventListener('pointerdown', e => {
    if (!S.mv) return;
    st = { x: e.clientX, y: e.clientY, mv: { ...S.mv }, moved: false };
  });
  svg.addEventListener('pointermove', e => {
    if (!st) return;
    const dx = e.clientX - st.x,
      dy = e.clientY - st.y;
    if (!st.moved && Math.hypot(dx, dy) < 5) return;
    if (!st.moved) {
      st.moved = true;
      try {
        svg.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
    const k = st.mv.w / W,
      b = S.mvBase;
    const x = clamp(st.mv.x - dx * k, b.x - b.w * 0.2, b.x + b.w * 1.2 - st.mv.w),
      y = clamp(st.mv.y - dy * k, b.y - b.h * 0.2, b.y + b.h * 1.2 - st.mv.h);
    S.mv = { ...st.mv, x, y };
    svg.setAttribute('viewBox', `${f1(x)} ${f1(y)} ${f1(st.mv.w)} ${f1(st.mv.h)}`);
  });
  const end = e => {
    if (st && st.moved) {
      svg.addEventListener('click', ev => ev.stopPropagation(), { capture: true, once: true });
    }
    st = null;
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', () => {
    st = null;
  });
}
// 일반 지도 좌표 변환 (일차 지도용)
function linear(ptsIn, W, H, pad, minKm = 1.2) {
  let la0 = Infinity,
    la1 = -Infinity,
    ln0 = Infinity,
    ln1 = -Infinity;
  ptsIn.forEach(p => {
    la0 = Math.min(la0, p.lat);
    la1 = Math.max(la1, p.lat);
    ln0 = Math.min(ln0, p.lng);
    ln1 = Math.max(ln1, p.lng);
  });
  let sx = (ln1 - ln0) * KX,
    sy = (la1 - la0) * KY;
  const cx = (ln0 + ln1) / 2,
    cy = (la0 + la1) / 2;
  sx = Math.max(sx, minKm);
  sy = Math.max(sy, minKm * 0.6);
  const s = Math.min((W - pad * 2) / sx, (H - pad * 2) / sy);
  const P = (lat, lng) => [W / 2 + (lng - cx) * KX * s, H / 2 - (lat - cy) * KY * s];
  return { P, s };
}
const SEG_STYLE = {
  walk: 'stroke-dasharray:0.1 7;stroke-linecap:round;stroke-width:4.5',
  subway: 'stroke-width:4.5',
  bus: 'stroke-width:4;stroke-dasharray:10 5',
  taxi: 'stroke-width:3.5;stroke-dasharray:4 4',
  car: 'stroke-width:3.5;stroke-dasharray:4 4',
  train: 'stroke-width:4.5;stroke-dasharray:14 4',
  ferry: 'stroke-width:4;stroke-dasharray:2 6;stroke-linecap:round',
  none: ''
};
// 이동 선 그리기
function segPath(seg, P) {
  return 'M' + seg.pts.map(p => P(p.lat, p.lng).map(f1).join(',')).join('L');
}
// 출발·도착(숙소·공항) 핀
function anchorPin(P, pt, icon, label) {
  const [x, y] = P(pt.lat, pt.lng);
  return `<g class="anc-pin" transform="translate(${f1(x)},${f1(y)})"><rect x="-13" y="-13" width="26" height="26" rx="7"/><svg x="-8" y="-8" width="16" height="16" viewBox="0 0 24 24" class="anc-ic">${ICON[icon]}</svg><title>${esc(label)}</title></g>`;
}
// ★ 계획의 지도 탭 (그날 동선)
function drawDay(el) {
  const W = el.clientWidth,
    H = el.clientHeight;
  if (!W || !H) return;
  const p = S.plan,
    c = computeDay(p, S.di),
    day = c.day;
  const legs = [...c.rows.map(r => r.leg), c.endLeg];
  let pts = [c.startPt, ...c.rows.map(r => r.p), c.endPt];
  const spanKm = pts2 => {
    const la = pts2.map(x => x.lat),
      ln = pts2.map(x => x.lng);
    return Math.max((Math.max(...ln) - Math.min(...ln)) * KX, (Math.max(...la) - Math.min(...la)) * KY);
  };
  let note = '';
  if (c.rows.length && spanKm(pts) > 28) {
    const zc = {};
    c.rows.forEach(r => (zc[r.p.z] = (zc[r.p.z] || 0) + 1));
    const z = Object.entries(zc).sort((a, b) => b[1] - a[1])[0][0];
    pts = c.rows.filter(r => r.p.z === z).map(r => r.p);
    note = `<p class="map-note2">${ZONES[z]} 주변을 보여 주고 있어요. 숙소·공항 쪽 이동은 지도 밖으로 이어져요.</p>`;
  }
  const { P, s } = linear(pts, W, H, 42);
  let h = geoSVG(P, 1, { stations: s > 120, riverW: clamp(s * 0.05, 1.5, 6), lineW: 2.2 });
  legs.forEach(l =>
    (l.segs || []).forEach(sg => {
      h += `<path class="seg-halo" d="${segPath(sg, P)}"/><path class="rseg" style="stroke:${sg.mode === 'subway' && sg.line ? LINES[sg.line].color : MODE[sg.mode].color};${SEG_STYLE[sg.mode] || ''}" d="${segPath(sg, P)}"/>`;
    })
  );
  const sameAnchor = km(c.startPt, c.endPt) < 0.05;
  h += anchorPin(P, c.startPt, day.start.kind === 'airport' ? 'plane' : 'home', '출발');
  if (!sameAnchor) h += anchorPin(P, c.endPt, day.end.kind === 'airport' ? 'plane' : 'home', '도착');
  c.rows.forEach((r, i) => {
    const [x, y] = P(r.p.lat, r.p.lng),
      on = S.sel === r.it.uid;
    h += `<g class="npin${on ? ' on' : ''}${r.it.src === 'walk' ? ' walkp' : ''}" data-act="mapPick" data-uid="${r.it.uid}" transform="translate(${f1(x)},${f1(y)})" tabindex="0" role="button" aria-label="${i + 1}. ${esc(itemName(p, r.it))}"><circle r="${on ? 15 : 12}"/><text y="4.5">${i + 1}</text>${on ? `<text class="npin-l" y="-22">${esc(itemName(p, r.it))}</text>` : ''}</g>`;
  });
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${S.di + 1}일차 동선 지도">${h}</svg>${note}`;
}
// 걷기 추천 지도
function drawWalk(el) {
  const sh = S.sheet;
  if (!sh || !sh.recs || sh.recs.err) return;
  const W = el.clientWidth,
    H = el.clientHeight;
  if (!W || !H) return;
  const R = sh.recs,
    pts = [R.A, R.B, ...R.recs.map(r => r.s)];
  const { P, s } = linear(pts, W, H, 34, 0.8);
  let h = geoSVG(P, 1, { stations: s > 160, riverW: clamp(s * 0.05, 1.5, 6), lineW: 2 });
  const a = P(R.A.lat, R.A.lng),
    b = P(R.B.lat, R.B.lng);
  h += `<path class="corr" style="stroke-width:${f1(R.corridor * 2 * s)}" d="M${a.map(f1).join(',')}L${b.map(f1).join(',')}"/>`;
  h += `<path class="rseg" style="stroke:${MODE.walk.color};${SEG_STYLE.walk}" d="M${a.map(f1).join(',')}L${b.map(f1).join(',')}"/>`;
  R.recs.forEach((r, k) => {
    const [x, y] = P(r.s.lat, r.s.lng),
      on = sh.picks.includes(r.s.id);
    h += `<g class="rpin${on ? ' on' : ''}" data-act="recToggle" data-id="${r.s.id}" transform="translate(${f1(x)},${f1(y)})"><circle r="11"/><text y="4">${k + 1}</text></g>`;
  });
  [
    [a, '출발'],
    [b, '도착']
  ].forEach(([p, t]) => {
    h += `<g class="ab-pin" transform="translate(${f1(p[0])},${f1(p[1])})"><rect x="-17" y="-11" width="34" height="22" rx="11"/><text y="4">${t}</text></g>`;
  });
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="걷는 길 추천 지도">${h}</svg>`;
}
