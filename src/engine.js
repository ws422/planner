// ======================================================================
// engine.js · 일정 짜기 계산
// 새 계획 만들기(createPlan), 하루 계산(computeDay), 이동 방법(legOptions), 교통비(farePlan), 숙소(nightHotel)
// 화면은 그리지 않아요. 계산 규칙(걷는 속도, 식사 시간대, 벌점 등)을 바꿀 때만 여기를 봐요.
// 고치는 법: docs/수정가이드.md
// ======================================================================
// ===== 일정 엔진 =====
const AREA = Object.fromEntries(AREAS.map(a => [a.id, a]));
const SPOT = Object.fromEntries(SPOTS.map(s => [s.id, s]));
SPOTS.forEach(s => {
  s.z = AREA[s.a].z;
});
const KX = 92.72,
  KY = 110.95;

// 두 지점 사이 직선 거리(km)
function km(a, b) {
  return Math.hypot((b.lng - a.lng) * KX, (b.lat - a.lat) * KY);
}
// '09:30' → 하루 시작부터 분(570)
function toMin(hm) {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}
// 분(570) → '09:30'
function fmt(min) {
  min = Math.round(min);
  const h = Math.floor(min / 60),
    m = ((min % 60) + 60) % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}
// '09:30' 에 분을 더한 시각
function addMin(hm, d) {
  return fmt(toMin(hm) + d);
}
// 걷는 시간(분) = 거리 × 16분/km
function wmin(k) {
  return Math.max(1, Math.round(k * 16));
}
// 값을 최소~최대 사이로 자르기
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
let UID_N = 0;
// 일정 칸마다 붙이는 고유 번호 만들기
function uid() {
  return 'i' + Date.now().toString(36).slice(-5) + (UID_N++).toString(36) + Math.random().toString(36).slice(2, 5);
}
// 깊은 복사 (원본을 안 건드리게)
function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

const MODE = {
  walk: { n: '도보', color: '#2E9B5F' },
  subway: { n: '지하철', color: '#E8711A' },
  bus: { n: '버스', color: '#2F6BD3' },
  taxi: { n: '택시', color: '#C99A06' },
  car: { n: '렌터카·택시', color: '#7A5BD0' },
  train: { n: '전철·열차', color: '#C0397E' },
  ferry: { n: '페리', color: '#0B97A5' },
  none: { n: '같은 곳', color: '#8A96A3' }
};

// ---- 지하철 경로 ----
const SUB = (() => {
  const adj = {},
    by = {};
  const add = (a, b, w) => {
    (adj[a] = adj[a] || []).push([b, w]);
    (adj[b] = adj[b] || []).push([a, w]);
  };
  for (const [lid, L] of Object.entries(LINES)) {
    L.st.forEach((s, i) => {
      (by[s] = by[s] || []).push(lid);
      if (i > 0) {
        const p = L.st[i - 1];
        add(lid + ':' + p, lid + ':' + s, 0.8 + km(STATIONS[p], STATIONS[s]) * 1.8);
      }
    });
  }
  for (const [s, ls] of Object.entries(by))
    for (let i = 0; i < ls.length; i++)
      for (let j = i + 1; j < ls.length; j++) add(ls[i] + ':' + s, ls[j] + ':' + s, 4);
  add('kuko:tenjin', 'nana:tenjinminami', 6);
  return { adj, by };
})();
const SUB_MEMO = {};
// 지하철 두 역 사이 가장 빠른 길 (환승 포함)
function subRoute(sa, sb) {
  const mk = sa + '>' + sb;
  if (mk in SUB_MEMO) return SUB_MEMO[mk];
  const dist = {},
    prev = {},
    pq = [];
  for (const l of SUB.by[sa]) {
    const k = l + ':' + sa;
    dist[k] = 0;
    pq.push([0, k]);
  }
  let found = null;
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, k] = pq.shift();
    if (d > dist[k]) continue;
    if (k.split(':')[1] === sb) {
      found = k;
      break;
    }
    for (const [n, w] of SUB.adj[k] || []) {
      const nd = d + w;
      if (nd < (dist[n] ?? Infinity)) {
        dist[n] = nd;
        prev[n] = k;
        pq.push([nd, n]);
      }
    }
  }
  if (!found) return (SUB_MEMO[mk] = null);
  const path = [found];
  while (prev[path[0]]) path.unshift(prev[path[0]]);
  const segs = [];
  for (const node of path) {
    const [l, s] = node.split(':'),
      g = segs[segs.length - 1];
    if (g && g.line === l) g.st.push(s);
    else segs.push({ line: l, st: [s] });
  }
  const rides = segs
    .filter(s => s.st.length > 1)
    .map(s => {
      const L = LINES[s.line].st,
        i0 = L.indexOf(s.st[0]),
        i1 = L.indexOf(s.st[s.st.length - 1]);
      let k = 0;
      for (let j = 1; j < s.st.length; j++) k += km(STATIONS[s.st[j - 1]], STATIONS[s.st[j]]);
      return { line: s.line, st: s.st, stops: s.st.length - 1, km: k, toward: LINE_ENDS[s.line][i1 > i0 ? 1 : 0] };
    });
  return (SUB_MEMO[mk] = { min: dist[found], rides });
}
// 어떤 지점에서 가까운 지하철역 최대 3곳 (1.3km 안)
function nearStations(p, max = 1.3) {
  return Object.entries(STATIONS)
    .map(([id, s]) => ({ id, s, d: km(p, s) }))
    .filter(x => x.d <= max)
    .sort((a, b) => a.d - b.d)
    .slice(0, 3);
}
// 두 지점 사이 지하철로 가는 방법 하나 만들기
function subwayOpt(a, b) {
  const A = a.airport ? [{ id: 'airport', s: STATIONS.airport, d: 0 }] : nearStations(a);
  const B = b.airport ? [{ id: 'airport', s: STATIONS.airport, d: 0 }] : nearStations(b);
  let best = null;
  for (const x of A)
    for (const y of B) {
      if (x.id === y.id) continue;
      const r = subRoute(x.id, y.id);
      if (!r) continue;
      const wa = x.d ? wmin(x.d) : 0,
        wb = y.d ? wmin(y.d) : 0;
      const air = a.airport || b.airport ? 12 : 0;
      const total = Math.round(wa + 3 + r.min + wb + air);
      if (!best || total < best.min) best = { x, y, r, wa, wb, air, total };
    }
  if (!best) return null;
  const { x, y, r, wa, wb, air } = best;
  const steps = [];
  if (a.airport) steps.push('국제선 터미널 → 무료 셔틀버스로 국내선 지하철역 (약 10분)');
  if (wa) steps.push(`도보 ${wa}분 → ${STATIONS[x.id].n}역`);
  r.rides.forEach((rd, i) =>
    steps.push(
      `${i ? '갈아타기 → ' : ''}${LINES[rd.line].n} ${rd.toward} 방면 ${rd.stops}정거장 → ${STATIONS[rd.st[rd.st.length - 1]].n}역`
    )
  );
  if (b.airport) steps.push('국내선역 → 무료 셔틀버스로 국제선 터미널 (약 10분)');
  if (wb) steps.push(`도보 ${wb}분 → 도착`);
  const segs = [];
  if (wa) segs.push({ mode: 'walk', pts: [a, x.s] });
  r.rides.forEach(rd => segs.push({ mode: 'subway', line: rd.line, pts: rd.st.map(s => STATIONS[s]) }));
  if (wb) segs.push({ mode: 'walk', pts: [y.s, b] });
  const lineTxt = r.rides.map(rd => LINES[rd.line].n).join('→');
  const rideKm = r.rides.reduce((t, rd) => t + rd.km, 0) * 1.08;
  return {
    mode: 'subway',
    min: best.total,
    label: `${lineTxt} · ${STATIONS[x.id].n} → ${STATIONS[y.id].n}`,
    steps,
    segs,
    fare: [{ k: 'subway', yen: subwayFare(rideKm) }],
    route: { from: x.id, to: y.id, wa, wb, rides: r.rides, airFrom: !!a.airport, airTo: !!b.airport }
  };
}

// ---- 요금 ----
function subwayFare(k) {
  for (const [lim, y] of FARE.subway) if (k <= lim) return y;
  return 380;
}
const inCenter = p => p.lat >= 33.583 && p.lat <= 33.607 && p.lng >= 130.392 && p.lng <= 130.425;
// 시내버스 요금
function busFare(a, b, d) {
  if (a.airport || b.airport) return FARE.airportBus;
  if (inCenter(a) && inCenter(b)) return 150;
  return Math.max(190, Math.round((140 + 30 * d) / 10) * 10);
}
// 택시 요금 (거리 기준 대략)
function taxiFare(d) {
  const road = d * 1.3;
  return FARE.taxiBase + Math.max(0, Math.ceil((road - FARE.taxiBaseKm) / FARE.taxiStepKm)) * FARE.taxiStep;
}
// 요금 조각들을 합친 금액
function fareSum(f) {
  return (f || []).reduce((t, x) => t + (x.yen || 0), 0);
}
// 요금이 대략값인지
function fareApprox(f) {
  return (f || []).some(x => x.approx || x.yen == null);
}
// 요금을 모르는 조각이 있는지
function fareUnknown(f) {
  return (f || []).some(x => x.yen == null);
}

// ---- 이동 방법 계산 ----
const LEG_MEMO = {};
// 두 지점 사이 갈 수 있는 이동 방법 목록 (걷기·지하철·버스·택시·전철 등)
function legOptions(a, b) {
  const key = a.lat.toFixed(5) + ',' + a.lng.toFixed(5) + '>' + b.lat.toFixed(5) + ',' + b.lng.toFixed(5);
  if (LEG_MEMO[key]) return LEG_MEMO[key];
  const d = km(a, b);
  let opts;
  if (d < 0.04) opts = [{ mode: 'none', min: 0, km: 0, label: '같은 장소', steps: [], segs: [], fare: [] }];
  else if (a.z === b.z) opts = zoneOptions(a, b, d);
  else opts = crossOptions(a, b, d);
  opts.forEach((o, i) => {
    o.km = o.km ?? d;
    o.id = o.mode + (opts.filter((x, j) => j < i && x.mode === o.mode).length || '');
    o.fare = o.fare || [];
  });
  return (LEG_MEMO[key] = opts);
}
// 직선 이동 모양(지도에 그릴 선) 만들기
function straight(mode, a, b) {
  return [{ mode, pts: [a, b] }];
}
// 공항 국제선 ↔ 하카타역 筑紫口 직행버스 (2025.4~ 하카타 쪽 승강장 筑紫口, 어른 ¥400, 약 20분, 밤 9시쯤 막차)
const CHIKUSHI = { lat: 33.5899, lng: 130.4223, z: 'city', n: '하카타역 지쿠시 출구', j: '博多駅 筑紫口' };
// 공항 ↔ 시내 버스 방법
function airBusOpt(a, b) {
  const out = !!a.airport,
    other = out ? b : a,
    dd = km(CHIKUSHI, other);
  let tail = null;
  if (dd > 1.1) {
    tail = out ? subwayOpt(CHIKUSHI, other) : subwayOpt(other, CHIKUSHI);
    if (!tail) return null;
  }
  const ride = 23,
    extra = tail ? tail.min + 4 : wmin(dd);
  const segs = out
    ? [{ mode: 'bus', pts: [a, CHIKUSHI] }, ...(tail ? tail.segs : straight('walk', CHIKUSHI, b))]
    : [...(tail ? tail.segs : straight('walk', a, CHIKUSHI)), { mode: 'bus', pts: [CHIKUSHI, b] }];
  return {
    id: 'bus',
    mode: 'bus',
    min: ride + extra,
    label: tail
      ? out
        ? '직행버스로 하카타역 → 지하철'
        : '지하철로 하카타역 → 직행버스'
      : '공항 국제선 ↔ 하카타역 직행버스 (니시테츠)',
    steps: [],
    segs,
    fare: [{ k: 'bus', yen: FARE.airportBus }, ...(tail ? tail.fare : [])],
    airBus: { out, tail: tail ? tail.route : null, walk: tail ? 0 : wmin(dd) }
  };
}
// 같은 근교 지역 안에서의 이동 방법
function zoneOptions(a, b, d) {
  const z = a.z,
    o = [];
  const walk = {
    mode: 'walk',
    min: wmin(d),
    label: `걸어서 ${d < 1 ? Math.round(d * 1000) + 'm' : d.toFixed(1) + 'km'}`,
    steps: [],
    segs: straight('walk', a, b),
    fare: []
  };
  const taxiF = [{ k: 'taxi', yen: taxiFare(d), approx: true }];
  if (z === 'itoshima') {
    if (d < 1.5) o.push(walk);
    o.push({
      mode: 'car',
      min: Math.round(5 + ((d * 1.3) / 38) * 60),
      label: '렌터카·택시 (요금은 택시 기준)',
      steps: [],
      segs: straight('car', a, b),
      fare: taxiF
    });
    return o;
  }
  if (!(a.airport || b.airport) || d < 2) o.push(walk);
  if (z === 'city') {
    const sw = subwayOpt(a, b);
    if (sw && sw.min < walk.min - 2) o.push(sw);
    if (d >= 1) {
      const air = a.airport || b.airport;
      if (air) {
        const ab = airBusOpt(a, b);
        if (ab) o.push(ab);
      } else
        o.push({
          mode: 'bus',
          min: Math.round(10 + d * 5),
          label: '니시테츠 버스 (대기 포함 대략)',
          steps: [],
          segs: straight('bus', a, b),
          fare: [{ k: 'bus', yen: busFare(a, b, d), approx: !(inCenter(a) && inCenter(b)) }]
        });
    }
    if (d >= 0.8)
      o.push({
        mode: 'taxi',
        min: Math.round(4 + d * 3.6 + (a.airport || b.airport ? 3 : 0)),
        label: '택시',
        steps: [],
        segs: straight('taxi', a, b),
        fare: taxiF
      });
  } else if (z === 'mojiko' && d > 4) {
    o.push({
      mode: 'train',
      min: Math.round(10 + d * 1.4),
      label: 'JR 열차',
      steps: [],
      segs: straight('train', a, b),
      fare: [{ k: 'jr', yen: 340, approx: true }]
    });
    o.push({
      mode: 'taxi',
      min: Math.round(4 + d * 2.6),
      label: '택시',
      steps: [],
      segs: straight('taxi', a, b),
      fare: taxiF
    });
  } else {
    if (
      (z === 'dazaifu' && d > 1.2) ||
      (z === 'noko' && d > 1) ||
      (z === 'uminaka' && d > 1.5) ||
      (z === 'beppu' && d > 1.5)
    ) {
      const bl = {
        dazaifu: '커뮤니티 버스 마호로바호',
        noko: '섬 노선버스 (니시테츠)',
        uminaka: '니시테츠 버스',
        beppu: '노선버스'
      }[z];
      o.push({
        mode: 'bus',
        min: Math.round(9 + d * 4),
        label: bl,
        steps: [],
        segs: straight('bus', a, b),
        fare: [
          {
            k: z === 'noko' || z === 'uminaka' ? 'bus' : 'busx',
            yen: Math.max(190, Math.round((140 + 30 * d) / 10) * 10),
            approx: true
          }
        ]
      });
    }
    if (d > 1 && z !== 'noko')
      o.push({
        mode: 'taxi',
        min: Math.round(4 + d * 3),
        label: '택시',
        steps: [],
        segs: straight('taxi', a, b),
        fare: taxiF
      });
  }
  return o;
}
// 시내 ↔ 근교(다자이후·유후인 등) 이동 방법
function crossOptions(a, b, d) {
  const pair = [a.z, b.z].sort().join('|');
  if (DIRECT[pair]) {
    const v = DIRECT[pair];
    return [
      {
        mode: v.mode,
        min: v.min + v.wait,
        label: v.label,
        steps: [v.label],
        segs: straight(v.mode, a, b),
        fare: v.fare.map(f => ({ ...f })),
        gparts: [{ vkey: 'direct:' + pair, out: true }]
      }
    ];
  }
  if (a.z === 'city' || b.z === 'city') {
    const out = a.z === 'city';
    const cp = out ? a : b,
      zp = out ? b : a,
      Z = zp.z,
      acc = ACCESS[Z];
    const res = acc.v.map((v, vi) => {
      const hub = HUB[v.hub],
        zh = { ...v.zh, z: Z };
      const c = out ? bestOpt(cp, hub) : bestOpt(hub, cp);
      const zl = out ? bestOpt(zh, zp) : bestOpt(zp, zh);
      const tr = {
        mode: v.mode,
        min: v.min + v.wait,
        label: v.label,
        segs: [{ mode: v.mode, pts: out ? [hub, zh] : [zh, hub] }],
        fare: v.fare.map(f => ({ ...f }))
      };
      const parts = out ? [c, tr, zl] : [zl, tr, c];
      const steps = parts
        .filter(p => p.mode !== 'none')
        .map(p =>
          p === tr
            ? `${v.label} (대기 포함 약 ${tr.min}분)`
            : `${MODE[p.mode].n} ${p.min}분${p.mode === 'subway' ? ' · ' + p.label : ''}`
        );
      return {
        mode: v.mode,
        min: Math.round(c.min + tr.min + zl.min),
        label: v.label,
        steps,
        segs: parts.flatMap(p => p.segs),
        fare: parts.flatMap(p => (p.fare || []).map(f => ({ ...f }))),
        via: v.hub,
        off: v.off,
        gparts: out
          ? [
              { opt: c, a: cp, b: hub },
              { vkey: Z + ':' + vi, out: true, a: hub, b: zh },
              { opt: zl, a: zh, b: zp }
            ]
          : [
              { opt: zl, a: zp, b: zh },
              { vkey: Z + ':' + vi, out: false, a: zh, b: hub },
              { opt: c, a: hub, b: cp }
            ]
      };
    });
    if (acc.car) {
      const m = Z === 'itoshima' ? 'car' : 'taxi';
      res.push({
        mode: m,
        min: Math.round(8 + ((d * 1.3) / 32) * 60),
        label: m === 'car' ? '렌터카·택시로 바로 이동 (요금은 택시 기준)' : '택시로 바로 이동',
        steps: [],
        segs: straight(m, a, b),
        fare: [{ k: 'taxi', yen: taxiFare(d), approx: true }]
      });
    }
    if (acc.note) res.forEach(r => (r.note = acc.note));
    return res;
  }
  const h = HUB.hakataSt,
    o1 = bestOpt(a, h),
    o2 = bestOpt(h, b);
  return [
    {
      gparts: [
        { opt: o1, a, b: h },
        { opt: o2, a: h, b }
      ],
      mode: o1.mode === 'none' ? o2.mode : o1.mode,
      min: o1.min + o2.min,
      label: `${ZONES[a.z]} → 시내 경유 → ${ZONES[b.z]}`,
      steps: [...(o1.steps.length ? o1.steps : [o1.label]), ...(o2.steps.length ? o2.steps : [o2.label])],
      segs: [...o1.segs, ...o2.segs],
      fare: [...(o1.fare || []), ...(o2.fare || [])].map(f => ({ ...f }))
    }
  ];
}
// 그 날짜에 운행하지 않는 방법인지
function isOff(o, date) {
  if (!o.off || !date) return false;
  const dt = new Date(date + 'T00:00:00');
  return o.off.m.includes(dt.getMonth() + 1) && o.off.wd.includes(dt.getDay());
}
// 이동 방법 목록에서 기본으로 고를 것
function pickDefault(opts, date) {
  opts = opts.filter(o => !isOff(o, date));
  const walk = opts.find(o => o.mode === 'walk');
  if (opts.length === 1) return opts[0];
  if (walk && walk.min <= 15) return walk;
  const pub = opts.filter(o => o.mode !== 'taxi' && o.mode !== 'walk');
  const eff = o => o.min + fareSum(o.fare) / 100;
  const best = pub.sort((x, y) => eff(x) - eff(y))[0];
  if (walk && (!best || walk.min <= best.min + 3)) return walk;
  return best || opts.find(o => o.mode === 'taxi') || walk || opts[0];
}
// 두 지점 사이 가장 나은 방법 하나
function bestOpt(a, b) {
  return pickDefault(legOptions(a, b));
}
// 일정 칸 사이 이동: 직접 고른 방법이 있으면 그것, 없으면 기본
function chooseLeg(a, b, mode, date) {
  const opts = legOptions(a, b).map(o => (isOff(o, date) ? { ...o, isOff: true } : o));
  const pick =
    (mode && (opts.find(o => o.id === mode && !o.isOff) || opts.find(o => o.mode === mode && !o.isOff))) ||
    pickDefault(opts, date);
  return { ...pick, chosen: !!(mode && (pick.id === mode || pick.mode === mode)), opts };
}

// ---- 계획 모델 ----
function datesBetween(s, e) {
  const out = [];
  const d = new Date(s + 'T00:00:00');
  const end = new Date(e + 'T00:00:00');
  while (d <= end) {
    out.push(
      d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
    );
    d.setDate(d.getDate() + 1);
  }
  return out;
}
// ---- 숙소: 밤마다 다를 수 있어요 ----
// set.stays = [{ n0, n1, h }] : n0~n1번째 밤(0부터)에 묵는 숙소. h = { k: 동네 프리셋 } 또는 { st: 역 }, 이름은 h.name
function nightsOf(plan) {
  return Math.max(0, plan.days.length - 1);
}
// 숙소 목록을 밤 수에 맞게 정리 (겹침·빈틈 없애기)
function normStays(stays, nights, fallback) {
  if (!nights) return [];
  const src = (Array.isArray(stays) ? stays : [])
    .filter(x => x && x.h)
    .map(x => ({ n0: Math.max(0, x.n0 | 0), n1: x.n1 | 0, h: x.h }))
    .sort((a, b) => a.n0 - b.n0);
  if (!src.length) return [{ n0: 0, n1: nights - 1, h: { k: PLACES.hotel[fallback] ? fallback : 'hakata' } }];
  const out = [];
  for (const x of src) {
    const n0 = out.length ? out[out.length - 1].n1 + 1 : 0;
    if (n0 > nights - 1) break;
    out.push({ n0, n1: Math.min(Math.max(x.n1, n0), nights - 1), h: x.h });
  }
  out[out.length - 1].n1 = nights - 1;
  return out;
}
// 계획의 숙소 목록
function staysOf(plan) {
  return normStays(plan.set.stays, nightsOf(plan), plan.set.hotel);
}
// n번째 밤에 묵는 숙소
function nightHotel(plan, ni) {
  const st = staysOf(plan);
  if (!st.length) return { k: PLACES.hotel[plan.set.hotel] ? plan.set.hotel : 'hakata' };
  const x = st.find(y => ni >= y.n0 && ni <= y.n1);
  return (x || (ni < 0 ? st[0] : st[st.length - 1])).h;
}
// 그날 기준 숙소: 밤이 있는 날은 그날 밤 숙소, 마지막 날은 전날 밤 숙소
function dayHotel(plan, di) {
  return nightHotel(plan, Math.min(di, Math.max(0, plan.days.length - 2)));
}
// 숙소 → 지도 위 지점(좌표·이름)
function hotelPt(h) {
  h = h || {};
  let p;
  if (h.st && STATIONS[h.st]) {
    const s = STATIONS[h.st];
    p = { j: `${s.j}駅周辺`, n: `숙소 (${s.n}역 주변)`, lat: s.lat, lng: s.lng, z: 'city' };
  } else p = { ...(PLACES.hotel[h.k] || PLACES.hotel.hakata) };
  if (h.name) {
    p.n = `숙소 · ${h.name}`;
    p.hn = h.name;
  }
  p.hotel = true;
  p.hw = hotelWhere(h);
  p.hwj = hotelWhereJ(h);
  return p;
}
// 숙소 위치 이름 (일본어)
function hotelWhereJ(h) {
  h = h || {};
  return h.st && STATIONS[h.st]
    ? `${STATIONS[h.st].j}駅`
    : ((PLACES.hotel[h.k] || PLACES.hotel.hakata).j || '').replace(/周辺$/, '');
}
// 숙소 위치 이름 (한국어, 예: 하카타역)
function hotelWhere(h) {
  h = h || {};
  return h.st && STATIONS[h.st] ? `${STATIONS[h.st].n}역` : HOTEL_LABEL[h.k] || HOTEL_LABEL.hakata;
}
// 숙소 이름 + 위치 (예: 도미인 · 기온역)
function hotelLabel(h) {
  h = h || {};
  return h.name ? `${h.name} · ${hotelWhere(h)}` : hotelWhere(h);
}
// 두 숙소가 같은지
function sameHotel(a, b) {
  a = a || {};
  b = b || {};
  return (a.k || '') === (b.k || '') && (a.st || '') === (b.st || '') && (a.name || '') === (b.name || '');
}
// 어떤 지점에서 가장 가까운 숙소 동네 프리셋
function presetNear(pt) {
  let bk = 'hakata',
    bd = Infinity;
  for (const [k, v] of Object.entries(PLACES.hotel)) {
    const d = km(pt, v);
    if (d < bd) {
      bd = d;
      bk = k;
    }
  }
  return bk;
}
// 숙소 → 동네 프리셋 이름 (예전 방식 호환용)
function hotelKeyOf(h) {
  h = h || {};
  return h.k && PLACES.hotel[h.k] ? h.k : presetNear(hotelPt(h));
}
// 숙소를 옮기는 날(전날 밤과 그날 밤 숙소가 다른 날)엔 아침에 「새 숙소에 짐 맡기기」를 넣어요
function syncMoveItems(plan) {
  const N = plan.days.length;
  plan.days.forEach((d, i) => {
    const want = i >= 1 && i <= N - 2 && !sameHotel(nightHotel(plan, i - 1), nightHotel(plan, i));
    const k = d.items.findIndex(it => it.place === 'hotel' && it.move);
    if (want && k < 0)
      d.items.splice(0, 0, {
        uid: uid(),
        place: 'hotel',
        ni: i,
        move: true,
        n: '숙소 옮기기 · 새 숙소에 짐 맡기기',
        stay: 20,
        src: 'auto',
        fixed: true
      });
    else if (want) d.items[k].ni = i;
    else if (k >= 0) d.items.splice(k, 1);
    if (d.modes) cleanModes(plan, i);
  });
  const h0 = nightHotel(plan, 0);
  plan.set.hotel = hotelKeyOf(h0);
}
// 데이터(data.js)에서 지운 장소·동네가 예전 계획에 남아 있으면 그 칸만 빼요 (앱이 멈추지 않게)
function prunePlan(p) {
  if (!p || !Array.isArray(p.days)) return p;
  const ok = it => it && (!it.sid || SPOT[it.sid]);
  p.days.forEach(d => {
    if (Array.isArray(d.items)) d.items = d.items.filter(ok);
    if (Array.isArray(d.areas)) d.areas = d.areas.filter(a => AREA[a]);
  });
  if (Array.isArray(p.parked)) p.parked = p.parked.filter(ok);
  if (Array.isArray(p.areas)) p.areas = p.areas.filter(a => AREA[a]);
  return p;
}
// 하루의 시작·끝 지점 (공항 또는 그날 숙소)
function anchorPt(plan, an, di, isEnd) {
  return an.kind === 'airport' ? PLACES.airport : hotelPt(nightHotel(plan, isEnd ? di : di - 1));
}
// 일정 칸 → 지도 위 지점
function itemPt(plan, it) {
  if (it.sid) {
    const s = SPOT[it.sid];
    return { lat: s.lat, lng: s.lng, z: s.z, n: s.n, j: s.j };
  }
  if (it.place === 'hotel') return hotelPt(nightHotel(plan, it.ni ?? 0));
  return { lat: it.lat, lng: it.lng, z: it.z || 'city', n: it.n };
}
// 일정 칸에 보이는 이름
function itemName(plan, it) {
  return it.sid
    ? SPOT[it.sid].n
    : it.move
      ? (h => `새 숙소에 짐 맡기기 · ${h.name || hotelWhere(h)}`)(nightHotel(plan, it.ni ?? 0))
      : it.n;
}
// 장소로 새 일정 칸 만들기
function mkItem(sid, src) {
  const s = SPOT[sid];
  return { uid: uid(), sid, stay: s.s, src: src || 'auto' };
}
// 하루에 쓸 수 있는 시간(분)
function dayCap(plan, i) {
  const d = plan.days[i];
  return toMin(d.end.time) - toMin(d.start.time) - 25 - (i === 0 ? 25 : 0);
}
// 시내에서 그 지역까지 가는 데 걸리는 시간(분)
function accessMin(z) {
  return z === 'city' ? 0 : Math.min(...ACCESS[z].v.map(v => v.min + v.wait)) + 18;
}
// 점심·저녁 시간대
function mealWin(t) {
  return t >= 660 && t <= 870 ? 'L' : t >= 1050 && t <= 1260 ? 'D' : null;
}
// 다음 식사 시간대
function nextOpen(t, used) {
  if (!used.L && t < 660) return 660;
  if (!used.D && t < 1050) return 1050;
  return null;
}
// 요일 (0=일)
function weekday(date) {
  return new Date(date + 'T00:00:00').getDay();
}
// 그 날짜가 장소의 시즌인지
function inSeason(s, date) {
  return !s.se || s.se.includes(Number(date.slice(5, 7)));
}
let WD = ['일', '월', '화', '수', '목', '금', '토'];

// ★ 새 계획 만들기: 날짜·숙소·고른 동네로 날마다 일정을 채워요
function createPlan(set, areaIds) {
  const dates = datesBetween(set.start, set.end);
  const N = dates.length;
  const plan = {
    id: 'plan-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    v: 1,
    title: `후쿠오카 ${N > 1 ? N - 1 + '박 ' : ''}${N}일`,
    created: Date.now(),
    updated: Date.now(),
    set: clone(set),
    areas: areaIds.slice(),
    parked: [],
    days: []
  };
  dates.forEach((date, i) => {
    const start = i === 0 ? { kind: 'airport', time: addMin(set.arrive, 50) } : { kind: 'hotel', time: set.dayStart };
    const end = i === N - 1 ? { kind: 'airport', time: addMin(set.depart, -120) } : { kind: 'hotel', time: set.dayEnd };
    if (toMin(end.time) < toMin(start.time) + 60) end.time = addMin(start.time, 60);
    plan.days.push({ date, start, end, items: [], modes: {} });
  });
  if (N > 1)
    plan.days[0].items.push({
      uid: uid(),
      place: 'hotel',
      ni: 0,
      n: '숙소에 짐 맡기기',
      stay: 15,
      src: 'auto',
      fixed: true
    });
  plan.set.stays = normStays(set.stays, N - 1, set.hotel);
  if (!plan.set.stays.length) delete plan.set.stays;
  syncMoveItems(plan);
  const alloc = allocate(
    plan,
    areaIds.map(id => AREA[id])
  );
  plan.days.forEach((day, i) => {
    plan.days[i].areas = alloc[i].map(a => a.id);
    const picks = pickSpots(plan, i, alloc[i]);
    day.items.push(
      ...picks.map(p => {
        const it = mkItem(p.s.id, 'auto');
        if (p.meal) it.meal = p.meal;
        return it;
      })
    );
    reorderDay(plan, i, leadingFixed(day));
    trimDay(plan, i, leadingFixed(day));
  });
  rebalance(plan);
  plan.days.forEach((d, i) => cleanModes(plan, i));
  return plan;
}
// 맨 앞의 고정 칸 수 (짐 맡기기 등)
function leadingFixed(day) {
  let n = 0;
  while (n < day.items.length && day.items[n].fixed) n++;
  return n;
}

// 고른 동네를 날짜에 나누기 (숙소에서 가까운 동네를 그날로)
function allocate(plan, areas) {
  const N = plan.days.length,
    caps = plan.days.map((d, i) => dayCap(plan, i));
  const asg = plan.days.map(() => []),
    load = caps.map(() => 0);
  const need = a => a.min + 2 * accessMin(a.z);
  const edge = i => N > 2 && (i === 0 || i === N - 1);
  const hp = plan.days.map((d, i) => (i < N - 1 ? hotelPt(nightHotel(plan, i)) : null)); // 숙소로 돌아오는 날만 숙소와 가까운 동네를 우선
  const trips = areas.filter(a => a.kind === 'trip');
  const rest = areas.filter(a => a.kind !== 'trip').sort((a, b) => need(b) - need(a));
  for (const t of trips) {
    const order = [...Array(N).keys()]
      .filter(i => !asg[i].some(x => x.kind === 'trip'))
      .sort((i, j) => caps[j] - (edge(j) ? 300 : 0) - load[j] - (caps[i] - (edge(i) ? 300 : 0) - load[i]));
    const i = order.length ? order[0] : load.indexOf(Math.min(...load));
    asg[i].push(t);
    load[i] += need(t);
  }
  for (const a of rest) {
    let bi = 0,
      bc = Infinity;
    for (let i = 0; i < N; i++) {
      const rem = caps[i] - load[i],
        over = Math.max(0, need(a) - rem);
      let c = over * 2 - rem * 0.05;
      if (asg[i].some(x => x.kind === 'trip')) c += 400;
      if (asg[i].length) c += Math.min(...asg[i].map(o => km(o, a))) * 6;
      if (a.kind === 'outer' && asg[i].some(o => o.kind === 'outer')) c += 150;
      if (a.kind === 'outer' && edge(i)) c += 40;
      if (hp[i] && a.z === 'city') c += km(hp[i], a) * 3;
      if (c < bc) {
        bc = c;
        bi = i;
      }
    }
    asg[bi].push(a);
    load[bi] += need(a);
  }
  return asg;
}

// 하루에 넣을 장소·식당 고르기
function pickSpots(plan, i, areas) {
  const day = plan.days[i];
  const s0 = toMin(day.start.time),
    e0 = toMin(day.end.time);
  let budget = dayCap(plan, i);
  areas.forEach(a => {
    if (a.z !== 'city') budget -= 2 * accessMin(a.z);
  });
  const taken = new Set(plan.days.flatMap(d => d.items.map(it => it.sid)).filter(Boolean));
  const ok = s =>
    !taken.has(s.id) &&
    inSeason(s, day.date) &&
    !(s.b === 'n' && e0 < 1080) &&
    !(s.from && e0 < toMin(s.from) + 60) &&
    !(s.to && toMin(s.to) < s0 + 60);
  const ids = new Set(areas.map(a => a.id));
  const picked = [];
  const take = (s, meal) => {
    picked.push({ s, meal });
    taken.add(s.id);
    budget -= s.s + 12;
  };
  const needL = s0 <= 750 && e0 >= 810,
    needD = e0 >= 1170;
  const hasOuter = areas.some(a => a.z !== 'city');
  const meals = SPOTS.filter(s => s.meal && ok(s));
  const near = (pool, ref) => pool.slice().sort((x, y) => km(x, ref) - km(y, ref));
  if (needL) {
    let pool = meals.filter(s => ids.has(s.a) && s.b !== 'n' && !s.pd);
    if (hasOuter && pool.some(s => s.z !== 'city')) pool = pool.filter(s => s.z !== 'city');
    pool.sort((x, y) => y.p - x.p);
    if (!pool.length && areas.length)
      pool = near(
        meals.filter(s => s.b !== 'n' && !s.pd && s.z === areas[0].z),
        areas[0]
      );
    if (pool[0]) take(pool[0], 'L');
  }
  if (needD) {
    let pool = meals
      .filter(s => ids.has(s.a) && ok(s))
      .sort((x, y) => !!(y.b === 'n' || y.pd) - !!(x.b === 'n' || x.pd) || y.p - x.p);
    if (!pool.length || hasOuter) {
      const hotel = hotelPt(dayHotel(plan, i));
      const cityPool = meals.filter(s => s.z === 'city' && (s.b === 'n' || s.pd) && ok(s));
      if (!pool.length || !pool.some(s => s.z === 'city')) pool = near(cityPool, hotel);
    }
    if (pool[0]) take(pool[0], 'D');
  }
  const sum = areas.reduce((t, a) => t + a.min, 0) || 1;
  const B = budget;
  areas.forEach(a => {
    const share = (B * a.min) / sum;
    let used = 0;
    SPOTS.filter(s => s.a === a.id && !s.meal && ok(s))
      .sort((x, y) => y.p - x.p)
      .forEach(s => {
        const c = s.s + 12;
        if (used === 0 || used + c <= share + 10) {
          take(s);
          used += c;
        }
      });
  });
  return picked;
}

// 시간대·식사·마감 시간을 고려해 순서 정하기 (삽입 + 국소 개선)
const outside = (t, a, b) => (t < a ? a - t : t > b ? t - b : 0);
// 도착 시각이 장소와 안 맞을 때 벌점
function timePen(c, arr, ctx) {
  const sp = c.sp,
    it = c.it;
  let p = 0;
  if (it.meal === 'L') p += outside(arr, 690, 810) * 1.2;
  else if (it.meal === 'D') p += outside(arr, 1080, 1200) * 1.2;
  if (sp) {
    if (sp.from && arr < toMin(sp.from)) p += (toMin(sp.from) - arr) * 1.5;
    if (sp.b === 'n' && arr < 1080) p += (1080 - arr) * 0.8;
    if (sp.b === 'e') p += outside(arr, ctx.sunset - 70, ctx.sunset + 10) * 0.5;
    if (sp.b === 'm' && arr > 660) p += (arr - 660) * 0.25;
    if (sp.to && arr + it.stay > toMin(sp.to)) p += (arr + it.stay - toMin(sp.to)) * 1.5;
  }
  return p;
}
// 방문 순서 하나의 점수 (짧을수록 좋음)
function seqEval(ctx, seq) {
  let t = ctx.t,
    cur = ctx.cur,
    cost = 0;
  for (const c of seq) {
    const m = bestOpt(cur, c.pt).min;
    t += m;
    cost += m + timePen(c, t, ctx);
    t += c.it.stay;
    cur = c.pt;
  }
  const m = bestOpt(cur, ctx.endPt).min;
  t += m;
  cost += m;
  if (t > ctx.deadline) cost += (t - ctx.deadline) * 3;
  return cost;
}
// 방문 순서 고르기 (가장 덜 돌아가게)
function optimize(ctx, cands) {
  const strength = c =>
    (c.it.meal ? 3 : 0) +
    (c.sp && (c.sp.b || c.sp.from) ? 2 : 0) +
    (c.sp && c.sp.to ? 1 : 0) +
    (c.sp ? c.sp.p * 0.1 : 0);
  let seq = [];
  for (const c of cands.slice().sort((a, b) => strength(b) - strength(a))) {
    let best = null,
      bc = Infinity;
    for (let k = 0; k <= seq.length; k++) {
      const s2 = seq.slice(0, k).concat([c], seq.slice(k));
      const v = seqEval(ctx, s2);
      if (v < bc) {
        bc = v;
        best = s2;
      }
    }
    seq = best;
  }
  let cur = seqEval(ctx, seq);
  for (let pass = 0; pass < 8; pass++) {
    let imp = false;
    for (let i = 0; i < seq.length; i++)
      for (let j = 0; j < seq.length; j++) {
        if (i === j) continue;
        const s2 = seq.slice();
        const [x] = s2.splice(i, 1);
        s2.splice(j, 0, x);
        const v = seqEval(ctx, s2);
        if (v < cur - 0.5) {
          seq = s2;
          cur = v;
          imp = true;
        }
      }
    for (let i = 0; i < seq.length - 1; i++)
      for (let j = i + 2; j <= seq.length; j++) {
        const s2 = seq.slice(0, i).concat(seq.slice(i, j).reverse(), seq.slice(j));
        const v = seqEval(ctx, s2);
        if (v < cur - 0.5) {
          seq = s2;
          cur = v;
          imp = true;
        }
      }
    if (!imp) break;
  }
  return seq;
}

// ★ 하루 계산: 칸마다 도착·출발 시각, 이동 방법, 경고, 마무리 시각
function computeDay(plan, di) {
  const day = plan.days[di];
  const startPt = anchorPt(plan, day.start, di, false),
    endPt = anchorPt(plan, day.end, di, true);
  let t = toMin(day.start.time),
    cur = startPt,
    ck = 'S';
  const rows = [],
    wd = weekday(day.date),
    mon = Number(day.date.slice(5, 7));
  for (const it of day.items) {
    const p = itemPt(plan, it),
      key = ck + '>' + it.uid,
      leg = chooseLeg(cur, p, day.modes[key], day.date);
    const arr = t + leg.min,
      dep = arr + it.stay,
      warn = [];
    const s = it.sid && SPOT[it.sid];
    if (s) {
      if (s.cl && s.cl.includes(wd)) warn.push(`${WD[wd]}요일은 휴관일 수 있어요`);
      if (s.se && !s.se.includes(mon)) warn.push('시즌이 아닐 수 있어요');
      if (s.from && arr < toMin(s.from)) warn.push(`${s.from} 이후에 문을 열어요`);
      else if (s.b === 'n' && arr < 1050) warn.push('저녁 이후에 가면 더 좋아요');
      if (s.b === 'e' && arr < SUNSET[mon] - 120) warn.push('해 질 무렵에 가면 더 좋아요');
      if (s.to && dep > toMin(s.to)) warn.push(`${s.to}쯤 문을 닫아요`);
    }
    rows.push({ it, p, leg, key, arr, dep, warn, from: cur });
    t = dep;
    cur = p;
    ck = it.uid;
  }
  const endKey = ck + '>E',
    endLeg = chooseLeg(cur, endPt, day.modes[endKey], day.date);
  const endArr = t + endLeg.min,
    deadline = toMin(day.end.time);
  const walkKm =
    rows.reduce((s, r) => s + (r.leg.mode === 'walk' ? r.leg.km : 0), 0) + (endLeg.mode === 'walk' ? endLeg.km : 0);
  return {
    day,
    rows,
    startPt,
    endPt,
    endLeg,
    endKey,
    endArr,
    deadline,
    over: endArr - deadline,
    start: toMin(day.start.time),
    walkKm,
    lastPt: cur
  };
}

// 앞 칸에서 이미 먹은 식사
function mealsUsedBefore(plan, di, n) {
  const c = computeDay(plan, di),
    used = {};
  c.rows.slice(0, n).forEach(r => {
    const s = r.it.sid && SPOT[r.it.sid];
    if (s && s.meal) used[r.it.meal || mealWin(r.arr) || (r.arr < 960 ? 'L' : 'D')] = true;
  });
  return { used, c };
}
// 장소 우선순위 점수
function pri(it) {
  return it.sid ? SPOT[it.sid].p : 3;
}

// fixedCount 이후의 일정을 다시 짠다
function reorderDay(plan, di, fixedCount) {
  const day = plan.days[di];
  const { used, c } = mealsUsedBefore(plan, di, fixedCount);
  const cur = fixedCount ? c.rows[fixedCount - 1].p : c.startPt;
  const t = fixedCount ? c.rows[fixedCount - 1].dep : c.start;
  const rest = day.items.slice(fixedCount);
  const open = new Set();
  if (!used.L && t <= 810 && c.deadline >= 720) open.add('L');
  if (!used.D && c.deadline >= 1110) open.add('D');
  const parked = [];
  const meals = rest
    .filter(it => it.sid && SPOT[it.sid].meal)
    .sort((a, b) => (b.meal ? 1 : 0) - (a.meal ? 1 : 0) || (b.src !== 'auto') - (a.src !== 'auto') || pri(b) - pri(a));
  for (const m of meals) {
    if (m.meal && open.has(m.meal)) {
      open.delete(m.meal);
      continue;
    }
    const alt = [...open].find(w => !(w === 'L' && SPOT[m.sid].b === 'n'));
    if (alt) {
      m.meal = alt;
      open.delete(alt);
      continue;
    }
    if (m.src === 'auto')
      parked.push({
        it: m,
        reason:
          (used.L && used.D) || (m.meal && used[m.meal])
            ? '식사가 이미 계획돼 있어서 보류'
            : '식사 시간대와 맞지 않아 보류'
      });
    else m.meal = null;
  }
  const keep = rest.filter(it => !parked.some(p => p.it === it));
  const ctx = { cur, t, endPt: c.endPt, deadline: c.deadline, sunset: SUNSET[Number(day.date.slice(5, 7))] };
  const seq = optimize(
    ctx,
    keep.map(it => ({ it, pt: itemPt(plan, it), sp: it.sid ? SPOT[it.sid] : null }))
  );
  day.items = [...day.items.slice(0, fixedCount), ...seq.map(x => x.it)];
  parked.forEach(p => park(plan, di, p.it, p.reason));
  return {
    before: rest.map(i => i.uid),
    after: seq.map(x => x.it.uid),
    parked: parked.map(p => ({ n: itemName(plan, p.it), reason: p.reason }))
  };
}
// 일정에서 빼서 보류함으로
function park(plan, di, it, reason) {
  plan.parked = plan.parked.filter(p => p.uid !== it.uid);
  const { meal, ...rest } = it;
  plan.parked.push({ ...rest, reason, fromDay: di });
}
// 시간이 넘치는 하루에서 덜 중요한 곳 빼기
function trimDay(plan, di, fixedCount) {
  const out = [];
  for (let guard = 0; guard < 30; guard++) {
    const c = computeDay(plan, di);
    if (c.over <= 10) break;
    const day = plan.days[di];
    const cand = day.items
      .map((it, idx) => ({ it, idx }))
      .filter(x => x.idx >= fixedCount && x.it.src === 'auto' && !x.it.fixed);
    if (!cand.length) break;
    const nonMeal = cand.filter(x => !(x.it.sid && SPOT[x.it.sid].meal));
    const pool = nonMeal.length ? nonMeal : cand;
    pool.sort((a, b) => pri(a.it) - pri(b.it) || b.it.stay - a.it.stay);
    const v = pool[0];
    day.items.splice(v.idx, 1);
    park(plan, di, v.it, '시간이 부족해서 보류');
    out.push({ n: itemName(plan, v.it), reason: '시간이 부족해서 보류' });
    reorderDay(plan, di, fixedCount);
  }
  return out;
}
// 없어진 칸의 이동 방법 기록 지우기
function cleanModes(plan, di) {
  const day = plan.days[di],
    keys = new Set();
  let ck = 'S';
  day.items.forEach(it => {
    keys.add(ck + '>' + it.uid);
    ck = it.uid;
  });
  keys.add(ck + '>E');
  Object.keys(day.modes).forEach(k => {
    if (!keys.has(k)) delete day.modes[k];
  });
}
// 시간이 모자라 보류된 곳을 여유 있는 다른 날로 옮겨 본다
function rebalance(plan) {
  for (const p of plan.parked.filter(x => x.reason.startsWith('시간') && x.sid)) {
    const slack = j => {
      const c = computeDay(plan, j);
      return c.deadline - c.endArr;
    };
    const order = plan.days
      .map((d, j) => ({ j, s: slack(j) }))
      .filter(
        x =>
          x.j !== p.fromDay &&
          x.s > p.stay + 30 &&
          (plan.days[x.j].areas || []).some(
            aid => aid === SPOT[p.sid].a || (AREA[aid].z === SPOT[p.sid].z && km(AREA[aid], AREA[SPOT[p.sid].a]) < 3)
          )
      )
      .sort((a, b) => b.s - a.s);
    for (const { j } of order) {
      const snapDay = clone(plan.days[j]),
        snapParked = clone(plan.parked);
      const endBefore = computeDay(plan, j).endArr;
      const { reason, fromDay, ...it } = p;
      plan.days[j].items.push(it);
      reorderDay(plan, j, leadingFixed(plan.days[j]));
      const c = computeDay(plan, j);
      if (c.over <= 0 && plan.days[j].items.some(x => x.uid === it.uid) && c.endArr - endBefore - it.stay <= 45) {
        plan.parked = plan.parked.filter(x => x.uid !== p.uid);
        cleanModes(plan, j);
        break;
      }
      plan.days[j] = snapDay;
      plan.parked = snapParked;
    }
  }
}

// 고정 구간 이후 재계획 + 요약
function replanFrom(plan, di, fixedCount, added = []) {
  const before = computeDay(plan, di);
  const r = reorderDay(plan, di, fixedCount);
  const trimmed = trimDay(plan, di, fixedCount);
  cleanModes(plan, di);
  const after = computeDay(plan, di);
  const items = plan.days[di].items.slice(fixedCount).map(i => i.uid);
  const pos = u => r.before.indexOf(u);
  let moved = 0;
  for (let k = 1; k < items.length; k++) if (pos(items[k]) < pos(items[k - 1])) moved++;
  return {
    added,
    parked: [...r.parked, ...trimmed],
    moved,
    rest: items.length,
    endBefore: before.endArr,
    endAfter: after.endArr,
    over: after.over
  };
}

// ---- 도보 동선 추천 ----
function legEnds(plan, di, li) {
  const c = computeDay(plan, di),
    day = plan.days[di];
  const A = li === 0 ? c.startPt : c.rows[li - 1].p;
  const B = li < c.rows.length ? c.rows[li].p : c.endPt;
  const tA = li === 0 ? c.start : c.rows[li - 1].dep;
  const Akey = li === 0 ? 'S' : day.items[li - 1].uid;
  const Bkey = li < day.items.length ? day.items[li].uid : 'E';
  return { A, B, tA, Akey, Bkey, c };
}
// 지도 계산용 좌표 변환
function proj(A, B, P) {
  const bx = (B.lng - A.lng) * KX,
    by = (B.lat - A.lat) * KY,
    px = (P.lng - A.lng) * KX,
    py = (P.lat - A.lat) * KY;
  const L2 = bx * bx + by * by || 1e-9,
    t = (px * bx + py * by) / L2;
  return { t, d: Math.hypot(px - t * bx, py - t * by) };
}
// 걸어가는 길 위 추천 장소
function walkRecs(plan, di, li) {
  const { A, B, tA } = legEnds(plan, di, li);
  if (A.z !== B.z) return { err: '다른 지역으로 넘어가는 구간이라 걸어서 갈 수 없어요.' };
  if ((A.airport || B.airport) && km(A, B) >= 2) return { err: '공항 구간은 걸어서 가기 어려워요.' };
  const L = km(A, B);
  if (L > 7) return { err: `${L.toFixed(1)}km라 걸어가기엔 너무 멀어요.` };
  const corridor = clamp(L * 0.2, 0.25, 0.6);
  const inPlan = new Set(plan.days.flatMap(d => d.items.map(i => i.sid)).filter(Boolean));
  const parkedIds = new Set(plan.parked.map(p => p.sid).filter(Boolean));
  const recs = [];
  for (const s of SPOTS) {
    if (s.z !== A.z || inPlan.has(s.id) || s.g) continue;
    const { t, d } = proj(A, B, s);
    if (t < -0.08 || t > 1.08) continue;
    const dd = t < 0 ? km(A, s) : t > 1 ? km(B, s) : d;
    if (dd > corridor) continue;
    const detour = Math.max(0, km(A, s) + km(s, B) - L),
      dm = Math.round(detour * 16);
    const eta = tA + wmin(km(A, s));
    if (s.to && eta + s.s > toMin(s.to) + 10) continue;
    if (s.from && eta < toMin(s.from) - 30) continue;
    let score = s.p * 10 - dd * 25 - dm * 0.3;
    if (s.meal && mealWin(eta)) score += 12;
    if (s.b === 'n') score += eta >= 1050 ? 8 : -15;
    recs.push({ s, t, dd, dm, add: dm + s.s, eta, score, parked: parkedIds.has(s.id) });
  }
  recs.sort((a, b) => b.score - a.score);
  const top = recs.slice(0, 10).sort((a, b) => a.t - b.t);
  return { A, B, L, walk: wmin(L), corridor, recs: top, tA };
}
// 걷기로 바꾸고 길 위 추천을 일정에 넣기
function applyWalk(plan, di, li, sids) {
  const day = plan.days[di];
  const { A, B, Akey, Bkey } = legEnds(plan, di, li);
  const chosen = sids
    .map(id => SPOT[id])
    .map(s => ({ s, t: proj(A, B, s).t }))
    .sort((a, b) => a.t - b.t);
  const items = chosen.map(x => mkItem(x.s.id, 'walk'));
  day.items.splice(li, 0, ...items);
  plan.parked = plan.parked.filter(p => !sids.includes(p.sid));
  delete day.modes[Akey + '>' + Bkey];
  const chain = [Akey, ...items.map(i => i.uid), Bkey];
  for (let k = 0; k < chain.length - 1; k++) day.modes[chain[k] + '>' + chain[k + 1]] = 'walk';
  const fixed = Bkey === 'E' ? day.items.length : li + items.length + 1;
  return replanFrom(
    plan,
    di,
    fixed,
    chosen.map(x => x.s.n)
  );
}

// 가장 덜 돌아가는 위치에 끼워 넣기
function insertBest(plan, di, it) {
  const day = plan.days[di],
    c = computeDay(plan, di),
    p = itemPt(plan, it);
  const pts = [c.startPt, ...c.rows.map(r => r.p), c.endPt];
  let bi = day.items.length,
    bc = Infinity;
  const lo = leadingFixed(day);
  for (let k = lo; k <= day.items.length; k++) {
    const a = pts[k],
      b = pts[k + 1];
    const cost = bestOpt(a, p).min + bestOpt(p, b).min - bestOpt(a, b).min;
    let pen = 0;
    const s = it.sid && SPOT[it.sid];
    if (s && s.b === 'n' && k < day.items.length) pen += 25;
    if (cost + pen < bc) {
      bc = cost + pen;
      bi = k;
    }
  }
  day.items.splice(bi, 0, it);
  cleanModes(plan, di);
  return bi;
}

// ---- 교통비·패스 ----
function dayFares(plan, di) {
  const c = computeDay(plan, di),
    legs = [...c.rows.map(r => ({ leg: r.leg, t: r.arr - r.leg.min })), { leg: c.endLeg, t: c.endArr - c.endLeg.min }];
  const by = {};
  let approx = false,
    unknown = false;
  legs.forEach(({ leg }) =>
    (leg.fare || []).forEach(f => {
      if (f.yen == null) {
        unknown = true;
        return;
      }
      by[f.k] = (by[f.k] || 0) + f.yen;
      if (f.approx) approx = true;
    })
  );
  const boat = c.rows.some(r => r.it.sid === 'kawakudari') ? FARE.boat : 0;
  const raw = Object.values(by).reduce((t, v) => t + v, 0);
  return { by, raw, approx, unknown, boat, date: plan.days[di].date, zones: [...new Set(c.rows.map(r => r.p.z))] };
}
// 날마다 최선의 1일권 조합 + 여러 날 패스
function farePlan(plan) {
  const days = plan.days.map((d, i) => dayFares(plan, i));
  const g = (d, k) => d.by[k] || 0;
  const dayRes = days.map(d => {
    const sub = g(d, 'subway'),
      bus = g(d, 'bus'),
      ferry = g(d, 'ferry'),
      nishiDz = d.zones.includes('dazaifu') ? g(d, 'nishi') : 0,
      jrCity = g(d, 'jr');
    const capped = Math.min(sub, FARE.subwayCap),
      busBest = Math.min(bus, FARE.busDay);
    const covAlt = capped + busBest + ferry + jrCity + nishiDz;
    const passPrice = nishiDz ? FARE.cityPassDz : FARE.cityPass;
    const useCity = covAlt > passPrice && sub + bus + ferry + jrCity + nishiDz > 0;
    const covered = useCity ? passPrice : covAlt;
    const rest = d.raw - (sub + bus + ferry + jrCity + nishiDz);
    return {
      ...d,
      sub,
      bus,
      ferry,
      nishiDz,
      jrCity,
      capped,
      busBest,
      useBusPass: !useCity && bus > FARE.busDay,
      useSubCap: !useCity && sub > FARE.subwayCap,
      useCity,
      passPrice,
      covAlt,
      best: covered + rest
    };
  });
  const N = days.length,
    win = (k, n) => {
      let best = { s: 0, i: 0 };
      for (let i = 0; i < N; i++) {
        let s = 0;
        for (let j = i; j < Math.min(N, i + n); j++) s += k(days[j], j);
        if (s > best.s) best = { s, i };
      }
      return best;
    };
  const jr = win(d => g(d, 'jr') + g(d, 'jrx') + g(d, 'jrltd'), 3);
  const sunq = win((d, j) => g(d, 'highway') + (dayRes[j].useCity ? 0 : dayRes[j].busBest) + g(d, 'busx'), 3);
  const multi = [];
  multi.push({
    id: 'jr',
    name: 'JR 큐슈 레일패스 북큐슈 3일',
    price: FARE.jrNorth3,
    value: jr.s,
    from: jr.i,
    note: '외국인 여행자 전용. 특급·규슈 신칸센 포함, 하카타~고쿠라 신칸센은 제외.'
  });
  multi.push({
    id: 'sunq',
    name: 'SUNQ 패스 북큐슈 3일',
    price: FARE.sunq3,
    value: sunq.s,
    from: sunq.i,
    note: '북큐슈 고속버스·시내버스 3일 무제한. 고속버스는 좌석 예약 필요. 가격은 판매처마다 조금 달라요.'
  });
  const yDays = days.map((d, i) => (d.zones.includes('yanagawa') ? i : -1)).filter(i => i >= 0);
  if (yDays.length) {
    const i = yDays[0],
      same = days[i].zones.includes('dazaifu');
    const nishi = g(days[i], 'nishi') + days[i].boat;
    multi.push({
      id: 'dzy',
      name: '다자이후·야나가와 관광 티켓',
      price: FARE.dzYanagawa,
      value: nishi,
      from: i,
      note: `니시테츠 전철 + 야나가와 뱃놀이(¥1,900) 포함 가격과 비교했어요. 텐진 → 다자이후 → 야나가와 → 텐진 한 방향으로만 쓸 수 있고, 중간에 텐진으로 돌아오면 무효예요.${same ? '' : ' 다자이후를 야나가와와 같은 날 돌면 더 이득이에요.'}`
    });
  }
  multi.forEach(m => {
    m.save = m.value - m.price;
    m.good = m.save > 0;
  });
  const raw = days.reduce((t, d) => t + d.raw, 0);
  const daily = dayRes.reduce((t, d) => t + d.best, 0);
  const extra = multi.filter(m => m.good).reduce((t, m) => t + m.save, 0);
  return {
    days: dayRes,
    multi,
    raw,
    best: Math.max(0, daily - extra),
    approx: days.some(d => d.approx),
    unknown: days.some(d => d.unknown)
  };
}

if (typeof module !== 'undefined')
  module.exports = {
    farePlan,
    dayFares,
    taxiFare,
    subwayFare,
    rebalance,
    pickSpots,
    createPlan,
    computeDay,
    walkRecs,
    applyWalk,
    replanFrom,
    insertBest,
    legOptions,
    subRoute,
    fmt,
    toMin,
    SPOT,
    AREA,
    km,
    itemName,
    reorderDay,
    trimDay,
    leadingFixed,
    staysOf,
    nightHotel,
    hotelPt,
    hotelLabel,
    syncMoveItems,
    dayHotel
  };
