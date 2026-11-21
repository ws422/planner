// ======================================================================
// ui.js · 화면 공통 + 새 여행 만들기 + 계획 화면
// 상태(S), 동작 목록(A), 화면 그리기(render), 아이콘(ICON), 새 여행 1·2단계, 일정 탭, 지도·교통비 탭, 시트들
// 버튼은 data-act="이름" 을 달면 눌렀을 때 A.이름() 이 실행돼요.
// 고치는 법: docs/수정가이드.md
// ======================================================================
// ===== 화면 (모바일 앱 스타일) =====
const $app = document.getElementById('app');
const esc = s =>
  String(s ?? '').replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
const ICON = {
  grip: '<path d="M5 8h14M5 12h14M5 16h14"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  flip: '<path d="M4.5 10a7.5 7.5 0 0 1 13.3-4.2L20 8"/><path d="M20 3.5V8h-4.5"/><path d="M19.5 14a7.5 7.5 0 0 1-13.3 4.2L4 16"/><path d="M4 20.5V16h4.5"/>',
  walk: '<circle cx="13" cy="4" r="2"/><path d="M12 7l-1 6-2 8M11 13l3 3 1 5M12 8l-4 3M12 8l4 3"/>',
  subway:
    '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 14h.01M15 14h.01M8 21l2-4M16 21l-2-4"/>',
  bus: '<rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 10h16M8 14h.01M16 14h.01M7 17v3M17 17v3"/>',
  taxi: '<path d="M5 17h14v-4l-2-5H7l-2 5v4zM5 17v2M19 17v2M10 5h4v3M8 13h.01M16 13h.01"/>',
  car: '<path d="M5 17h14v-4l-2-5H7l-2 5v4zM5 17v2M19 17v2M8 13h.01M16 13h.01"/>',
  train: '<rect x="6" y="5" width="12" height="12" rx="3"/><path d="M9 2h6M12 2v3M6 11h12M8 21l2-4M16 21l-2-4"/>',
  ferry:
    '<path d="M4 14l2 4h12l2-4H4zM7 14v-4h10v4M10 10V6h4v4M3 21c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1"/>',
  none: '<circle cx="12" cy="12" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  undo: '<path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  home: '<path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-5h4v5"/>',
  plane:
    '<path d="M10.5 3.5a1.5 1.5 0 0 1 3 0V9l7 4.5V16l-7-2v4.5l2 1.5V22l-3.5-1-3.5 1v-2l2-1.5V14l-7 2v-2.5L10.5 9z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M12 4l9 16H3zM12 10v4M12 17h.01"/>',
  shuffle:
    '<path d="M4 7h3c4 0 6 10 10 10h3M4 17h3c1.5 0 2.6-1.4 3.6-3M14 10c.9-1.6 2-3 3-3h3M17 4l3 3-3 3M17 14l3 3-3 3"/>',
  box: '<path d="M4 9h16v11H4zM3 4h18v5H3zM10 13h4"/>',
  pin: '<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  wallet:
    '<path d="M4 7.5A1.5 1.5 0 0 1 5.5 6H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5.5A1.5 1.5 0 0 1 4 18.5zM4 8l11-4v2M16 13h.01"/>',
  save: '<path d="M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6"/>',
  minus: '<path d="M5 12h14"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4"/>',
  zin: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M8 11h6M11 8v6"/>',
  zout: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M8 11h6"/>',
  sight: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  food: '<path d="M4 12h16a8 8 0 0 1-16 0zM15 3l-4 6M19 3.5l-5 5.5"/>',
  cafe: '<path d="M5 9h11v5a5 5 0 0 1-10 0V9zM16 10.5h1.5a2 2 0 0 1 0 4H16M8.5 3.5v2.5M12 3.5v2.5"/>',
  shop: '<path d="M5 8h14l-1 12H6zM9 8V6.5a3 3 0 0 1 6 0V8"/>',
  nature: '<path d="M12 21v-6M12 15c-4 0-6.5-3-6.5-6.5a6.5 6.5 0 0 1 13 0C18.5 12 16 15 12 15z"/>',
  onsen:
    '<path d="M4 15c0 3 4 5 8 5s8-2 8-5M8 12c-1.2-1.6 1.2-3.1 0-4.8M12 12c-1.2-1.6 1.2-3.1 0-4.8M16 12c-1.2-1.6 1.2-3.1 0-4.8"/>',
  free: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2"/>',
  bed: '<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5M7 11.5h.01"/>',
  nav: '<path d="M12 2l7 19-7-4-7 4z"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/>',
  sc_day:
    '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  sc_dusk: '<path d="M7 16a5 5 0 0 1 10 0M3 16h18M6 20h12M12 5v3M5.5 9.5 7 11M18.5 9.5 17 11"/>',
  sc_night: '<path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.3 6.3 0 0 0 10 10z"/>',
  swap: '<path d="M7 7h13l-4-4M17 17H4l4 4"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  share: '<path d="M12 3v13M7 8l5-5 5 5M5 13v7h14v-7"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.8 3.8 5.8 3.8 9s-1.2 6.2-3.8 9c-2.6-2.8-3.8-5.8-3.8-9S9.4 5.8 12 3z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  chat: '<path d="M4 5h16v11h-9l-5 4v-4H4z"/><path d="M8 9.5h8M8 12.5h5"/>'
};
// 아이콘 그리기 (ICON 목록의 이름)
function ic(n, cls = '') {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n] || ''}</svg>`;
}
// 날짜 → '2026-12-11'
function ymd(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
// '2026-12-11' → 날짜
function pd(s) {
  return new Date(s + 'T00:00:00');
}
// 날짜 → '12월 11일 (금)'
function md(s) {
  const d = pd(s);
  return LANG === 'ja'
    ? `${d.getMonth() + 1}月${d.getDate()}日(${WD[d.getDay()]})`
    : `${d.getMonth() + 1}월 ${d.getDate()}일 (${WD[d.getDay()]})`;
}
// 날짜 → '12.11 금'
function mds(s) {
  const d = pd(s);
  return LANG === 'ja'
    ? `${d.getMonth() + 1}/${d.getDate()}(${WD[d.getDay()]})`
    : `${d.getMonth() + 1}.${d.getDate()} ${WD[d.getDay()]}`;
}
// 일수 → '2박 3일'
function nights(n) {
  return LANG === 'ja' ? (n <= 1 ? '日帰り' : `${n - 1}泊${n}日`) : n <= 1 ? '당일치기' : `${n - 1}박 ${n}일`;
}
// 분 → '1시간 30분'
function dur(m) {
  m = Math.round(m);
  const h = Math.floor(m / 60),
    r = m % 60;
  return LANG === 'ja'
    ? h
      ? `${h}時間${r ? r + '分' : ''}`
      : `${r}分`
    : h
      ? `${h}시간${r ? ' ' + r + '분' : ''}`
      : `${r}분`;
}
// km → '524m'·'1.2km'
function dist(k) {
  return k < 1 ? Math.round(k * 1000) + 'm' : k.toFixed(1) + 'km';
}
// 오늘 날짜
function today() {
  return ymd(new Date());
}
// 두 날짜 사이 일수
function dayDiff(a, b) {
  return Math.round((pd(b) - pd(a)) / 864e5);
}
const TIMES = (() => {
  const o = [];
  for (let m = 5 * 60; m <= 23 * 60 + 30; m += 30) o.push(fmt(m));
  return o;
})();
const yen = n => '¥' + Math.round(n).toLocaleString('ko-KR');
const won = n => '₩' + (Math.round((n * S.rate) / 100 / 10) * 10).toLocaleString('ko-KR');
// 요금 글자 (¥·원)
function fareTxt(f, short) {
  if (!f || !f.length) return '';
  if (fareUnknown(f)) return short ? '요금 확인' : '요금은 현지 확인';
  return (fareApprox(f) ? '약 ' : '') + yen(fareSum(f));
}
// 이 기기에 저장한 값 읽기
function lsGet(k, d) {
  try {
    const v = localStorage.getItem(k);
    return v == null ? d : JSON.parse(v);
  } catch (e) {
    return d;
  }
}
// 이 기기에 값 저장하기
function lsSet(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch (e) {
    return false;
  }
}

// ---- 저장소: 계정(db) 우선, 안 되면 이 브라우저 ----
const LS_KEY = 'fukuoka-planner-v1';
const store = {
  col: null,
  mode: 'local',
  q: {},
  readLocal() {
    const v = lsGet(LS_KEY, []);
    return Array.isArray(v) ? v : [];
  },
  writeLocal(plans) {
    return lsSet(LS_KEY, plans);
  },
  async init() {
    if (typeof claude === 'undefined' || !claude || !claude.use) return;
    try {
      const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]);
      if (!db || !user) return;
      const id = await user.id();
      if (!id) return;
      const col = db.collection('data/users/' + id);
      const snap = await Promise.race([
        col.get(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))
      ]);
      this.col = col;
      this.mode = 'account';
      const remote = snap.docs
        .filter(d => d.exists && d.id.startsWith('plan-'))
        .map(d => d.data())
        .filter(p => p && p.days)
        .map(prunePlan);
      const map = new Map();
      [...S.plans, ...remote].forEach(p => {
        const o = map.get(p.id);
        if (!o || (p.updated || 0) > (o.updated || 0)) map.set(p.id, clone(p));
      });
      const merged = [...map.values()],
        rIds = new Map(remote.map(p => [p.id, p.updated || 0]));
      merged.forEach(p => {
        if (!rIds.has(p.id) || rIds.get(p.id) < (p.updated || 0)) this.put(p);
      });
      S.plans = merged;
      this.writeLocal(merged);
      if (S.view === 'home') render();
      else updateStoreNote();
    } catch (e) {
      updateStoreNote();
    }
  },
  put(plan) {
    if (!this.col) return Promise.resolve();
    const id = plan.id,
      body = clone(plan);
    this.q[id] = (this.q[id] || Promise.resolve())
      .then(() => this.col.doc(id).set(body))
      .catch(e => {
        if (e && e.code === 'quota_exceeded') toast('계정 저장 공간이 가득 찼어요. 이 브라우저에는 저장됐어요.');
      });
    return this.q[id];
  },
  remove(id) {
    if (!this.col) return;
    this.q[id] = (this.q[id] || Promise.resolve()).then(() => this.col.doc(id).delete()).catch(() => {});
  }
};
// 홈 아래 「저장 위치」 문구 고치기
function updateStoreNote() {
  const el = document.getElementById('storeNote');
  if (el) el.innerHTML = storeNote();
}
// 홈 아래 「저장 위치」 문구
function storeNote() {
  return store.mode === 'account'
    ? `${ic('check')}계정에 저장돼요 · 다른 기기에서도 보여요`
    : `${ic('save')}${IS_APP ? '이 휴대폰에 저장돼요 · 인터넷 없이도 열려요' : '이 브라우저에 저장돼요'}`;
}

// ---- 상태 ----
const S = {
  view: 'home',
  plans: store.readLocal().map(prunePlan),
  draft: null,
  plan: null,
  saved: true,
  isNew: false,
  di: 0,
  tab: 'sched',
  sel: null,
  mapSel: null,
  sheet: null,
  undo: [],
  banner: null,
  mv: null,
  toastT: null,
  rate: lsGet('fk-rate', FARE.krwPer100),
  hintOff: lsGet('fk-hint-off', false),
  photoBroken: false,
  areaBroken: {},
  face: lsGet('fk-face', false)
};
// 새 여행 만들기 기본값 (시간·숙소)
function defaultDraft() {
  const t = new Date();
  return {
    start: null,
    end: null,
    hotel: 'hakata',
    stays: null,
    arrive: '10:00',
    depart: '18:00',
    dayStart: '09:30',
    dayEnd: '21:30',
    areas: [],
    cal: ymd(new Date(t.getFullYear(), t.getMonth(), 1))
  };
}
// 계획 상태 (D-19, 여행 중, 지난 여행)
function planStatus(p) {
  const t = today();
  if (t < p.set.start) return { k: 'soon', label: `D-${dayDiff(t, p.set.start)}`, di: 0 };
  if (t <= p.set.end) {
    const i = dayDiff(p.set.start, t);
    return { k: 'now', label: `여행 ${i + 1}일차`, di: i };
  }
  return { k: 'past', label: '다녀온 여행', di: 0 };
}
// 계획 목록 (가까운 여행 먼저)
function sortedPlans() {
  const rank = p => ({ now: 0, soon: 1, past: 2 })[planStatus(p).k];
  return S.plans
    .slice()
    .sort(
      (a, b) =>
        rank(a) - rank(b) ||
        (rank(a) === 2 ? b.set.start.localeCompare(a.set.start) : a.set.start.localeCompare(b.set.start))
    );
}
// 되돌리기용으로 지금 상태 저장
function pushUndo() {
  S.undo.push({ plan: clone(S.plan), di: S.di });
  if (S.undo.length > 25) S.undo.shift();
}
// 계획이 바뀌었다고 표시 (저장 버튼 켜기)
function dirty() {
  S.saved = false;
  S.editN = (S.editN || 0) + 1;
  S.plan.updated = Date.now();
  const b = document.getElementById('saveBtn');
  if (b) {
    b.classList.remove('done');
    b.innerHTML = '저장';
  }
}
// 화면 아래 잠깐 뜨는 알림
function toast(msg, undo) {
  clearTimeout(S.toastT);
  const w = document.getElementById('toasts');
  if (!w) return;
  w.innerHTML = `<div class="toast" role="status"><span>${esc(msg)}</span>${undo ? '<button data-act="undo">되돌리기</button>' : ''}</div>`;
  S.toastT = setTimeout(() => {
    w.innerHTML = '';
  }, 4200);
}

// ---- 공통 조각 ----
function appbar({ back, title, right = '', sub = '' }) {
  return `<header class="appbar">${back ? `<button class="ib" data-act="${back}" aria-label="뒤로">${ic('back')}</button>` : `<span class="brand">${logoSVG()}후쿠오카 플래너</span>`}
    ${title ? `<div class="ab-t">${title}${sub ? `<small>${sub}</small>` : ''}</div>` : '<span class="ab-sp"></span>'}<div class="ab-r">${langBtn()}${right}</div></header>`;
}
// 새 여행 만들기 단계 표시줄
function progress(n) {
  return `<div class="prog" role="progressbar" aria-valuemin="1" aria-valuemax="3" aria-valuenow="${n}" aria-label="3단계 중 ${n}단계">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`;
}
// 이동 수단 아이콘
function modeIc(m, size = '') {
  return `<span class="mi ${size}" style="--m:${MODE[m].color}">${ic(m)}</span>`;
}
// 장소 종류 아이콘 타일
function catTile(c) {
  return `<span class="ct c-${c}">${ic(c)}</span>`;
}
// 장소 종류 칩
function catChip(c) {
  return `<span class="chip c-${c}">${CATS[c].n}</span>`;
}
// ---- 홈 (home.js) ----
function planRow(p) {
  const st = planStatus(p);
  return `<li><button class="prow" data-act="openPlan" data-id="${p.id}"><span class="dday sm b-${st.k}">${st.label}</span><span class="pr-t"><b>${esc(p.title)}</b><small>${mds(p.set.start)} – ${mds(p.set.end)}</small></span>${ic('next')}</button><button class="ib sm" data-act="delAsk" data-id="${p.id}" aria-label="${esc(p.title)} 삭제">${ic('trash')}</button></li>`;
}

// ---- 1단계: 기간 ----
function addMonth(s, n) {
  const d = pd(s);
  return ymd(new Date(d.getFullYear(), d.getMonth() + n, 1));
}
// 달력 한 달
function monthV(first) {
  const d0 = pd(first),
    y = d0.getFullYear(),
    m = d0.getMonth(),
    t = today(),
    D = S.draft;
  const startW = d0.getDay(),
    days = new Date(y, m + 1, 0).getDate();
  let cells = '';
  for (let i = 0; i < startW; i++) cells += '<span></span>';
  for (let k = 1; k <= days; k++) {
    const s = ymd(new Date(y, m, k)),
      wd = (startW + k - 1) % 7;
    const past = s < t,
      isS = s === D.start,
      isE = s === D.end,
      inR = D.start && D.end && s > D.start && s < D.end;
    const cls = [
      'dc',
      past && 'past',
      isS && 's',
      isE && 'e',
      inR && 'in',
      D.start && D.end && D.start !== D.end && isS && 'rs',
      D.start && D.end && D.start !== D.end && isE && 're',
      s === t && 'today',
      wd === 0 && 'sun',
      wd === 6 && 'sat'
    ]
      .filter(Boolean)
      .join(' ');
    cells += `<button class="${cls}" ${past ? 'disabled' : ''} data-act="pickDate" data-d="${s}" aria-label="${md(s)}"${isS || isE ? ' aria-pressed="true"' : ''}><span>${k}</span></button>`;
  }
  return `<div class="month"><div class="wk">${WD.map(w => `<span>${w}</span>`).join('')}</div><div class="grid">${cells}</div></div>`;
}
// 시간 고르기 칸
function selT(id, val, label) {
  return `<label class="fld"><span>${label}</span><select id="${id}" data-change="${id}">${TIMES.map(t => `<option${t === val ? ' selected' : ''}>${t}</option>`).join('')}</select></label>`;
}
// ★ 화면: 새 여행 1단계 (날짜·숙소·시간)
function datesV() {
  const D = S.draft,
    N = D.start && D.end ? dayDiff(D.start, D.end) + 1 : 0;
  const d0 = pd(D.cal),
    thisM = ymd(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  return (
    appbar({ back: 'goHome', title: '새 여행' }) +
    progress(1) +
    `<main class="scr flow">
    <h1 class="h-l">언제 떠나세요?</h1>
    <div class="sel-sum ${N ? 'ok' : ''}">
      <div><small>가는 날</small><b>${D.start ? md(D.start) : '선택'}</b></div>${ic('next')}
      <div><small>오는 날</small><b>${D.end ? md(D.end) : '선택'}</b></div>
      ${N ? `<span class="pill">${nights(N)}</span>` : ''}
    </div>
    <section class="card cal">
      <div class="cal-h"><button class="ib sm" data-act="calMove" data-n="-1" aria-label="이전 달" ${D.cal <= thisM ? 'disabled' : ''}>${ic('back')}</button><b>${d0.getFullYear()}년 ${d0.getMonth() + 1}월</b><button class="ib sm" data-act="calMove" data-n="1" aria-label="다음 달">${ic('next')}</button></div>
      ${monthV(D.cal)}
      <p class="hint-s">${!D.start ? '출발하는 날을 눌러 주세요.' : !D.end ? '돌아오는 날을 눌러 주세요. 같은 날을 한 번 더 누르면 당일치기예요.' : '다시 누르면 새로 고를 수 있어요.'}</p>
    </section>
    ${draftHotelCard()}
    <section class="card">
      <h2 class="h-s">시간</h2>
      <div class="grid2">${selT('arrive', D.arrive, '첫날 공항 도착')}${selT('depart', D.depart, '마지막 날 비행기')}${selT('dayStart', D.dayStart, '하루 시작')}${selT('dayEnd', D.dayEnd, '하루 마무리')}</div>
    </section>
  </main>
  <div class="cta"><button class="btn pri big" data-act="toAreas" ${D.start && D.end ? '' : 'disabled'}>다음 · 가고 싶은 곳 고르기</button></div>`
  );
}

// ---- 2단계: 지역 ----
function draftCaps() {
  const D = S.draft,
    dates = datesBetween(D.start, D.end),
    N = dates.length;
  let total = 0;
  dates.forEach((d, i) => {
    const s = i === 0 ? toMin(D.arrive) + 50 : toMin(D.dayStart),
      e = i === N - 1 ? toMin(D.depart) - 120 : toMin(D.dayEnd);
    total += Math.max(0, e - s - 25 - (i === 0 ? 25 : 0));
  });
  const need =
    D.areas.reduce((t, id) => t + AREA[id].min + 2 * accessMin(AREA[id].z), 0) +
    D.areas.length * 15 +
    (D.areas.length ? N * 90 : 0);
  return { N, total, need, trips: D.areas.filter(a => AREA[a].kind === 'trip').length };
}
// 동네 고르기 카드
function areaCard(a) {
  const on = S.draft.areas.includes(a.id),
    n = SPOTS.filter(s => s.a === a.id).length,
    tm = a.min + 2 * accessMin(a.z);
  return `<button class="acard${on ? ' on' : ''}" data-act="toggleArea" data-id="${a.id}" aria-pressed="${on}">
    <span class="ac-k">${on ? ic('check') : ''}</span>
    <b>${a.n}</b><small>${a.sub}</small>
    <span class="ac-m">${a.kind === 'trip' ? a.far : tm >= 400 ? '하루' : tm >= 240 ? '반나절+' : '반나절'} · ${n}곳</span>
  </button>`;
}
// 2단계 지도 아래 숙소 줄
function hotelLegendV() {
  const st = draftHotelStays();
  if (!st.length) return '';
  return `<p class="map-hotels">${ic('home')}<span>${st.map((x, i) => `${st.length > 1 ? `<b>${i + 1}</b>` : ''}${esc(hotelLabelT(x.h))}`).join('<i>·</i>')}</span><button class="map-hotels-e" data-act="toDates">${L('바꾸기', '変更')}</button></p>`;
}
// ★ 화면: 새 여행 2단계 (가고 싶은 곳)
function areasV() {
  const D = S.draft,
    cap = draftCaps(),
    pct = cap.total ? Math.round((cap.need / cap.total) * 100) : 0;
  const msg = !D.areas.length
    ? '지도나 아래 카드에서 골라 주세요'
    : cap.trips > cap.N
      ? '당일치기는 하루에 한 곳만 넣을 수 있어요'
      : pct <= 70
        ? '여유 있어요 · 더 골라도 돼요'
        : pct <= 100
          ? '일정에 딱 맞아요'
          : '빠듯해요 · 못 넣은 곳은 보류함으로';
  const groups = [
    ['시내', 'city'],
    ['근교', 'outer'],
    ['당일치기 (지도 밖)', 'trip']
  ];
  return (
    appbar({ back: 'toDates', title: '가고 싶은 곳', sub: `${mds(D.start)} – ${mds(D.end)} · ${nights(cap.N)}` }) +
    progress(2) +
    `<main class="scr flow">
    <section class="map-card">
      <div class="rmap" id="rmap"></div>
      <div class="map-ctl"><button class="ib sm" data-act="zoom" data-n="1" aria-label="확대">${ic('plus')}</button><button class="ib sm" data-act="zoom" data-n="-1" aria-label="축소">${ic('minus')}</button></div>
      <p class="map-cap">시내는 크게, 외곽은 작게 그린 안내 지도 · 동그라미를 눌러 고르세요</p>
      ${hotelLegendV()}
    </section>
    ${groups
      .map(
        ([t, k]) =>
          `<h2 class="sec">${t}</h2><div class="agrid">${AREAS.filter(a => a.kind === k)
            .map(areaCard)
            .join('')}</div>`
      )
      .join('')}
  </main>
  <div class="cta">
    <div class="meter"><div class="m-t"><b>${D.areas.length}곳 선택</b><span class="${pct > 100 || cap.trips > cap.N ? 'warn-t' : ''}">${msg}</span></div>
    <div class="bar"><i style="width:${Math.min(100, pct)}%" class="${pct > 100 ? 'over' : ''}"></i></div></div>
    <button class="btn pri big" data-act="generate" ${D.areas.length ? '' : 'disabled'}>세부 계획 만들기</button>
  </div>`
  );
}

// ---- 3단계: 계획 ----
function anchorLabel(an, isEnd) {
  if (an.kind === 'airport') return isEnd ? '후쿠오카 공항 도착' : '공항에서 출발 (입국 후)';
  const p = S.plan,
    di = S.di;
  if (isEnd) return `숙소 도착 · ${esc(hotelLabelT(nightHotel(p, di)))}`;
  const moving = di < p.days.length - 1 && !sameHotel(nightHotel(p, di - 1), nightHotel(p, di));
  return `${moving ? L('체크아웃하고 출발', 'チェックアウトして出発') : '숙소에서 출발'} · ${esc(hotelLabelT(nightHotel(p, di - 1)))}`;
}
// 일정 사이 이동 칸 (지하철 12분 ¥210 등)
function legRow(leg, li) {
  if (leg.mode === 'none') return `<li class="leg none"><span class="rail"></span></li>`;
  const ft = fareTxt(leg.fare, true);
  return `<li class="leg m-${leg.mode}" style="--m:${MODE[leg.mode].color}"><span class="rail"></span>
    <button class="lchip" data-act="leg" data-li="${li}" aria-label="이동 방법 바꾸기: ${MODE[leg.mode].n} ${leg.min}분 ${ft}">
      ${modeIc(leg.mode, 'sm')}<span class="lc-m"><b>${MODE[leg.mode].n} ${leg.min}분</b>${ft ? `<em>${ft}</em>` : ''}${leg.chosen ? '<i class="mine">직접 고름</i>' : ''}</span>
      <span class="lc-l">${esc(leg.mode === 'walk' ? dist(leg.km) : leg.label)}</span>${ic('next', 'chev')}
    </button></li>`;
}
// ★ 일정 카드 한 장 (펼치면 시간·순서·메모 등)
function itemRow(p, r, i, N) {
  const it = r.it,
    s = it.sid && SPOT[it.sid],
    sel = S.sel === it.uid,
    N2 = p.days[S.di].items.length;
  const tags = [
    it.meal === 'L'
      ? '<span class="tag meal">점심</span>'
      : it.meal === 'D'
        ? '<span class="tag meal">저녁</span>'
        : '',
    it.src === 'walk'
      ? '<span class="tag walk">걷다가 들름</span>'
      : it.src === 'user'
        ? '<span class="tag">직접 추가</span>'
        : ''
  ].join('');
  return `<li class="stop${sel ? ' sel' : ''}" id="it-${it.uid}">
    <div class="tm"><b>${fmt(r.arr)}</b><span>${fmt(r.dep)}</span></div>
    <div class="sc">
      <div class="sc-row"><button class="sc-hit" data-act="sel" data-uid="${it.uid}" aria-expanded="${sel}">
        ${s ? catTile(s.c) : catTile(it.cat || (it.place === 'hotel' ? 'bed' : 'free'))}
        <span class="sc-t"><b>${esc(itemName(p, it))}</b><small>${s ? `${CATS[s.c].n} · ` : ''}${dur(it.stay)} 머묾${s && s.j ? ` · <span lang="ja">${esc(s.j)}</span>` : ''}</small></span>
        <span class="num">${i + 1}</span>
      </button>${N2 > 1 ? `<button type="button" class="drag-h" data-uid="${it.uid}" aria-label="${esc(L(`${itemName(p, it)} 순서 바꾸기 (끌거나 위아래 화살표)`, `${s ? s.j : trText(itemName(p, it))} の順番を変える(ドラッグか上下キー)`))}">${ic('grip')}</button>` : ''}</div>
      ${tags ? `<div class="tags">${tags}</div>` : ''}
      ${s ? `<p class="desc">${esc(s.d)}${s.g ? ' (여러 가게 중 골라서)' : ''}</p>` : ''}
      ${r.warn.map(w => `<p class="warn">${ic('alert')}${esc(w)}</p>`).join('')}
      ${it.memo ? `<p class="memo">${esc(it.memo)}</p>` : ''}
      ${
        sel
          ? `<div class="edit">
        ${isEat(s) ? `<button class="btn alt-btn wide" data-act="altSheet" data-uid="${it.uid}">${ic(s.c === 'cafe' && !it.meal ? 'cafe' : 'food')}<span><b>${s.c === 'cafe' && !it.meal ? L('웨이팅이 길면? 근처 다른 카페 보기', '待ちが長いときは? 近くのほかのカフェ') : L('웨이팅이 길면? 근처 다른 식당 보기', '待ちが長いときは? 近くのほかのお店')}</b><small>${L('걸어서 갈 수 있는 곳 · 구글 지도에서 찾기', '歩いて行ける店 · Googleマップで探す')}</small></span>${ic('next', 'chev')}</button>` : ''}
        <div class="ed"><span>머무는 시간</span><div class="stp"><button data-act="stay" data-uid="${it.uid}" data-n="-15" aria-label="15분 줄이기">${ic('minus')}</button><b>${dur(it.stay)}</b><button data-act="stay" data-uid="${it.uid}" data-n="15" aria-label="15분 늘리기">${ic('plus')}</button></div></div>
        <div class="ed"><span>순서</span><div class="stp"><button data-act="move" data-uid="${it.uid}" data-n="-1" ${i === 0 ? 'disabled' : ''} aria-label="앞으로">${ic('up')}</button><button data-act="move" data-uid="${it.uid}" data-n="1" aria-label="뒤로">${ic('down')}</button></div></div>
        ${N > 1 ? `<label class="ed"><span>다른 날로</span><select data-change="moveDay" data-uid="${it.uid}"><option value="">옮길 날 선택</option>${p.days.map((d, k) => (k === S.di ? '' : `<option value="${k}">${k + 1}일차 · ${mds(d.date)}</option>`)).join('')}</select></label>` : ''}
        <label class="ed col"><span>메모</span><input type="text" id="memo-${it.uid}" data-input="memo" data-uid="${it.uid}" value="${esc(it.memo || '')}" placeholder="예약 번호, 먹고 싶은 메뉴" maxlength="120"></label>
        <div class="row2"><button class="btn soft" data-act="replanHere" data-uid="${it.uid}">${ic('shuffle')}여기부터 다시 짜기</button><button class="btn soft" data-act="toPark" data-uid="${it.uid}">${ic('box')}보류함으로</button></div>
        ${s ? `<button class="btn soft wide" data-act="spotSheet" data-id="${s.id}">${ic('info')}장소 정보·가는 법 보기</button>` : ''}
      </div>`
          : ''
      }
    </div>
  </li>`;
}
// 직접 순서를 바꿨더니 하루가 늦어질 때만, 뒤쪽을 다시 짤지 물어봐요
function reAskRow(it, c) {
  const q = S.reAsk;
  if (!q || q.uid !== it.uid || q.di !== S.di || q.at !== S.editN) return '';
  const head =
    c.over > 0
      ? L(
          `순서를 바꿨더니 마무리 시간보다 <b>${c.over}분</b> 늦어요`,
          `順番を変えたら、終了予定より<b>${c.over}分</b>遅れます`
        )
      : L(
          `순서를 바꿨더니 하루가 <b>${q.diff}분</b> 늦게 끝나요`,
          `順番を変えたら、1日の終わりが<b>${q.diff}分</b>遅くなります`
        );
  return `<li class="ask"><div class="tm"></div><div class="ask-c" role="status">
    <p>${ic('shuffle')}<span><em class="ask-t">${head}</em><small>${L('여기까지는 바꾼 순서 그대로 두고, 뒤쪽 일정만 다시 짤까요?', 'ここまでは変えた順番のままにして、後ろの予定だけ組み直しますか?')}</small></span></p>
    <div class="row2"><button class="btn soft sm" data-act="reAskNo">${L('그대로 두기', 'このままにする')}</button><button class="btn pri sm" data-act="reAskYes">${L('뒤쪽만 다시 짜기', '後ろだけ組み直す')}</button></div></div></li>`;
}
// 다시 짠 결과 알림
function bannerV() {
  const b = S.banner;
  if (!b) return '';
  const r = b.res,
    L = [];
  if (r.added && r.added.length)
    L.push(`<li><i class="dot d-ok"></i><span><b>추가</b> ${r.added.map(esc).join(', ')}</span></li>`);
  if (r.parked && r.parked.length)
    L.push(
      `<li><i class="dot d-warn"></i><span><b>보류함으로</b> ${r.parked.map(x => `${esc(x.n)} <small>(${esc(x.reason.replace(' 보류', ''))})</small>`).join(', ')}</span></li>`
    );
  if (r.moved) L.push(`<li><i class="dot"></i><span><b>순서 조정</b> 남은 ${r.rest}곳 중 ${r.moved}곳</span></li>`);
  else if (r.rest)
    L.push(`<li><i class="dot"></i><span><b>순서</b> 남은 ${r.rest}곳은 그대로, 시간만 맞췄어요</span></li>`);
  L.push(
    `<li><i class="dot"></i><span><b>마무리</b> ${fmt(r.endBefore)} → ${fmt(r.endAfter)}${r.over > 0 ? ` <small class="bad-t">(${r.over}분 늦음)</small>` : ''}</span></li>`
  );
  return `<div class="banner" role="status"><div class="bn-h">${ic('spark')}<b>${esc(b.title)}</b></div><ul>${L.join('')}</ul>
    <div class="row2"><button class="btn soft" data-act="undo">${ic('undo')}되돌리기</button><button class="btn soft" data-act="closeBanner">확인</button></div></div>`;
}
// 1일차·2일차 버튼줄
function dayPills() {
  return `<nav class="days" aria-label="날짜">${S.plan.days.map((d, i) => `<button class="${i === S.di ? 'on' : ''}" data-act="day" data-i="${i}" aria-pressed="${i === S.di}"><b>${i + 1}일차</b><small>${mds(d.date)}</small></button>`).join('')}</nav>`;
}
// ★ 화면: 계획의 일정 탭
function schedTab() {
  const p = S.plan,
    N = p.days.length,
    c = computeDay(p, S.di),
    day = c.day,
    df = dayFares(p, S.di);
  const slack = c.deadline - c.endArr,
    last = S.di === N - 1;
  let tl = `<ol class="tl">`;
  tl += `<li class="anc"><div class="tm"><b>${fmt(c.start)}</b></div><button class="anc-c" data-act="dayTime">${ic(day.start.kind === 'airport' ? 'plane' : 'home')}<span>${anchorLabel(day.start, false)}</span>${ic('clock', 'chev')}</button></li>`;
  c.rows.forEach((r, i) => {
    tl += legRow(r.leg, i) + itemRow(p, r, i, N) + reAskRow(r.it, c);
  });
  if (!c.rows.length)
    tl += `<li class="empty"><div></div><div class="card empty-c"><p>이 날은 아직 일정이 없어요.</p><button class="btn soft" data-act="addOpen">${ic('plus')}장소 추가</button></div></li>`;
  tl += legRow(c.endLeg, c.rows.length);
  tl += `<li class="anc"><div class="tm"><b>${fmt(c.endArr)}</b></div>${day.end.kind === 'airport' ? `<div class="anc-c end">${ic('plane')}<span>${anchorLabel(day.end, true)}<small>비행기 ${p.set.depart} · 2시간 전 도착 기준</small></span></div>` : `<button class="anc-c end" data-act="staysSheet">${ic('home')}<span>${anchorLabel(day.end, true)}</span>${ic('next', 'chev')}</button>`}</li></ol>`;
  const status =
    c.over > 0
      ? `<div class="note bad">${ic('alert')}<span>${last ? '공항 도착 기준' : '마무리 시간'}(${day.end.time})보다 <b>${c.over}분</b> 늦어요</span><button class="btn soft sm" data-act="replanDay">다시 짜기</button></div>`
      : slack >= 60
        ? `<div class="note ok">${ic('clock')}<span>${day.end.time}까지 <b>${dur(slack)}</b> 여유</span><button class="btn soft sm" data-act="addOpen">장소 추가</button></div>`
        : '';
  const parked = p.parked.length
    ? `<details class="card parked"${S.openParked ? ' open' : ''}><summary>${ic('box')}<b>보류함</b><span class="cnt">${p.parked.length}</span>${ic('down', 'chev')}</summary>
    <p class="sub">시간이 모자라거나 직접 뺀 곳이에요. 원하는 날에 다시 넣을 수 있어요.</p>
    <ul>${p.parked.map(x => `<li><span class="pk-t"><b>${esc(itemName(p, x))}</b><small>${esc(x.reason)}${x.fromDay != null ? ` · 원래 ${x.fromDay + 1}일차` : ''}</small></span><button class="btn soft sm" data-act="unpark" data-uid="${x.uid}">${S.di + 1}일차에 넣기</button><button class="ib sm" data-act="delParked" data-uid="${x.uid}" aria-label="${esc(itemName(p, x))} 삭제">${ic('trash')}</button></li>`).join('')}</ul></details>`
    : '';
  return `<section class="daycard">
      <div class="dc-h"><div><h2>${S.di + 1}일차</h2><small>${md(day.date)} · ${(day.areas || []).map(a => AREA[a].n).join(' · ') || '자유 일정'}</small></div>
      <button class="dc-re" data-act="replanDay" aria-label="이 날 다시 짜기">${ic('shuffle')}<span>다시 짜기</span></button></div>
      ${dayHotelRow(p, S.di)}
      <div class="stats"><div><small>출발</small><b>${fmt(c.start)}</b></div><div><small>마무리</small><b class="${c.over > 0 ? 'bad-t' : ''}">${fmt(c.endArr)}</b></div><div><small>걷기</small><b>${c.walkKm.toFixed(1)}km</b></div><button data-act="tab" data-t="fare"><small>교통비</small><b>${df.approx ? '약 ' : ''}${yen(df.raw)}</b></button></div>
    </section>
    ${S.hintOff ? '' : `<div class="hint">${ic('walk')}<span>이동 칸을 누르면 <b>지하철·택시 요금</b>을 비교해 바꿀 수 있어요. 걷기로 바꾸면 길 위 맛집·명소를 추천하고 이후 일정을 다시 짜요.</span><button class="ib xs" data-act="hideHint" aria-label="안내 닫기">${ic('close')}</button></div>`}
    ${bannerV()}
    ${tl}
    ${status}
    <div class="day-act"><button class="btn soft wide" data-act="addOpen">${ic('plus')}장소 추가</button></div>
    ${parked}
    <p class="fine">이동 시간·요금·영업시간은 대략적인 값이에요. 방문 전에 확인하세요.</p>`;
}
// 화면: 계획의 지도 탭
function mapTab() {
  const p = S.plan,
    c = computeDay(p, S.di);
  const legend = ['walk', 'subway', 'bus', 'taxi', 'train', 'ferry', 'car']
    .filter(m => c.rows.some(r => r.leg.mode === m) || c.endLeg.mode === m)
    .map(m => `<span>${modeIc(m, 'xs')}${MODE[m].n}</span>`)
    .join('');
  return `<section class="mapfull"><div class="dmap" id="dmap"></div><div class="legend">${legend}</div>
    <div class="strip" aria-label="오늘 들르는 곳">${c.rows.map((r, i) => `<button class="sp${S.mapSel === r.it.uid ? ' on' : ''}" data-act="mapPick" data-uid="${r.it.uid}"><span class="num">${i + 1}</span><span><b>${esc(itemName(p, r.it))}</b><small>${fmt(r.arr)} · ${MODE[r.leg.mode].n} ${r.leg.min}분</small></span></button>`).join('')}</div></section>`;
}
// 택시로만 다닐 때 요금
function taxiAll(p, di) {
  const c = computeDay(p, di);
  let t = 0;
  [...c.rows.map(r => r.leg), c.endLeg].forEach(l => {
    const w = l.opts.find(o => o.mode === 'walk'),
      tx = l.opts.find(o => o.mode === 'taxi' || o.mode === 'car');
    if (w && w.min <= 10) return;
    if (tx) t += fareSum(tx.fare);
    else t += fareSum(l.fare);
  });
  return t;
}
// 화면: 계획의 교통비 탭
function fareTab() {
  const p = S.plan,
    fp = farePlan(p),
    save = fp.raw - fp.best;
  const recs = [];
  const capDays = fp.days.filter(d => d.useSubCap).length,
    busDays = fp.days.filter(d => d.useBusPass).length,
    cityDays = fp.days.filter(d => d.useCity).length;
  const anySub = fp.days.some(d => d.sub > 0);
  if (anySub)
    recs.push({
      ok: true,
      t: '지하철은 신용카드 터치로 타기',
      d: `Visa·Mastercard·JCB 등 컨택리스 카드를 개찰구에 대면 하루 ${yen(FARE.subwayCap)}까지만 나가요. 1일권(${yen(FARE.subwayCap)})을 사도 같아요.${capDays ? ` ${capDays}일은 상한에 걸려 이득이에요.` : ''}`
    });
  if (cityDays)
    recs.push({
      ok: true,
      t: `${cityDays}일은 투어리스트 시티패스가 이득`,
      d: `지하철·버스·니시테츠 전철·시영 도선을 하루 동안 무제한. 외국인 여행자 전용(여권 필요).`
    });
  if (busDays)
    recs.push({
      ok: true,
      t: `${busDays}일은 니시테츠 버스 1일권이 이득`,
      d: `시내버스 하루 무제한 약 ${yen(FARE.busDay)}.`
    });
  fp.multi
    .filter(m => m.good || m.value >= m.price * 0.3)
    .forEach(m =>
      recs.push({
        ok: m.good,
        t: m.good ? `${m.name} 사기` : `${m.name}은 손해`,
        d: `${m.good ? '' : '이번 일정에선 '}${m.good ? `${m.from + 1}일차부터 쓰면 ${yen(m.save)} 아껴요` : `${yen(-m.save)} 더 들어요`}. ${m.note}`,
        v: m.good ? `+${yen(m.save)}` : `−${yen(-m.save)}`
      })
    );
  if (!fp.days.some(d => d.raw > 0))
    recs.push({ ok: true, t: '대부분 걸어서 다녀요', d: '이번 일정은 교통비가 거의 들지 않아요.' });
  return `<section class="fare-hero">
      <small>이번 여행 교통비 · 1인</small>
      <div class="fh-n"><b>${fp.approx ? '약 ' : ''}${yen(fp.best)}</b><span>${won(fp.best)}</span></div>
      ${save > 0 ? `<p>그냥 결제하면 ${yen(fp.raw)} → 추천대로 하면 <b>${yen(save)} 절약</b></p>` : `<p>지금 일정에선 따로 패스를 사지 않아도 돼요</p>`}
    </section>
    <h2 class="sec">추천</h2>
    <ul class="recs-l">${recs.map(r => `<li class="${r.ok ? 'ok' : 'no'}"><span class="rk">${ic(r.ok ? 'check' : 'close')}</span><span class="rb"><b>${esc(r.t)}</b><small>${esc(r.d)}</small></span>${r.v ? `<em>${r.v}</em>` : ''}</li>`).join('')}</ul>
    <h2 class="sec">날짜별</h2>
    <div class="fday">${fp.days
      .map((d, i) => {
        const kinds = Object.entries(d.by)
          .filter(([, v]) => v > 0)
          .map(([k, v]) => `<span class="chip">${FARE_KIND[k]} ${yen(v)}</span>`)
          .join('');
        const how = d.useCity
          ? `투어리스트 시티패스 ${yen(d.passPrice)}`
          : [
              d.useSubCap ? `지하철 상한 ${yen(FARE.subwayCap)}` : '',
              d.useBusPass ? `버스 1일권 ${yen(FARE.busDay)}` : ''
            ]
              .filter(Boolean)
              .join(' + ');
        const tx = taxiAll(p, i);
        return `<button class="fd" data-act="fareDay" data-i="${i}"><div class="fd-h"><b>${i + 1}일차</b><small>${mds(d.date)}</small><span class="fd-n">${d.approx ? '약 ' : ''}${yen(d.best)}</span></div>
        <div class="chips">${kinds || '<span class="chip">걸어서 이동</span>'}${d.boat ? `<span class="chip">뱃놀이 ${yen(d.boat)} 별도</span>` : ''}</div>
        ${how ? `<p class="fd-how">${ic('spark')}${how} 적용 (그냥 내면 ${yen(d.raw)})</p>` : ''}
        ${tx > 0 ? `<p class="fd-tx">${ic('taxi')}택시로만 다니면 약 ${yen(tx)} <small>(${tx > d.best ? yen(tx - d.best) + ' 더' : '비슷'})</small></p>` : ''}</button>`;
      })
      .join('')}</div>
    <h2 class="sec">요금 기준</h2>
    <div class="card fare-info">
      <dl>
        <dt>지하철</dt><dd>거리별 ${yen(210)}~${yen(380)} · 1일권 ${yen(FARE.subwayCap)} (신용카드 터치도 하루 ${yen(FARE.subwayCap)} 상한)</dd>
        <dt>시내버스</dt><dd>도심 구간 ${yen(150)}, 그 밖은 거리에 따라 · 공항 국제선 ↔ 하카타역 직행버스 ${yen(FARE.airportBus)}</dd>
        <dt>택시</dt><dd>1.1km까지 ${yen(600)}, 이후 287m마다 ${yen(100)} (2026년 7월 개정) · 도로 거리를 직선의 1.3배로 추정</dd>
        <dt>시티패스</dt><dd>${yen(FARE.cityPass)} · 다자이후 포함 ${yen(FARE.cityPassDz)} · 다자이후 직행버스 타비토는 제외</dd>
        <dt>환율</dt><dd><label class="rate">100엔 = <input type="number" inputmode="numeric" id="rateIn" data-input="rate" value="${S.rate}" min="300" max="2000" step="1" aria-label="100엔당 원화">원</label> <small>(${FARE.krwDate} 기준, 바꿀 수 있어요)</small></dd>
      </dl>
      <p class="fine">어른 1명 기준이에요. 버스·택시와 일부 JR은 거리로 계산한 추정치라 실제와 다를 수 있어요.</p>
    </div>`;
}
// 계획 화면 아래 탭 (일정·지도·길안내·교통비)
function bottomNav() {
  const T = [
    ['sched', 'list', '일정'],
    ['map', 'map', '지도'],
    ['guide', 'nav', '길안내'],
    ['fare', 'wallet', '교통비']
  ];
  return `<nav class="tabbar" aria-label="화면 전환">${T.map(([k, i, l]) => `<button class="${S.tab === k ? 'on' : ''}" data-act="tab" data-t="${k}" aria-pressed="${S.tab === k}">${ic(i)}<span>${l}</span></button>`).join('')}</nav>`;
}
// ★ 화면: 계획 (위 제목 + 탭 내용)
function planV() {
  const p = S.plan,
    N = p.days.length;
  const right = `<button class="savebtn${S.saved ? ' done' : ''}" id="saveBtn" data-act="save">${S.saved ? ic('check') + '저장됨' : '저장'}</button>`;
  return (
    appbar({
      back: 'goHome',
      title: `<button class="ab-title" data-act="rename">${esc(p.title)}${ic('pen')}</button>`,
      sub: `${mds(p.set.start)} – ${mds(p.set.end)} · ${nights(N)}`,
      right
    }) +
    (S.isNew ? progress(3) : '') +
    `<main class="scr plan t-${S.tab}">${S.tab !== 'fare' ? dayPills() : ''}${S.tab === 'sched' ? schedTab() : S.tab === 'map' ? mapTab() : S.tab === 'guide' ? guideTab() : fareTab()}</main>` +
    bottomNav()
  );
}

// ---- 시트 ----
function ptName(p, di, li) {
  const day = p.days[di];
  if (li === 0) return day.start.kind === 'airport' ? '공항' : '숙소';
  return itemName(p, day.items[li - 1]);
}
// 시트: 이동 방법 바꾸기
function legSheet(sh) {
  const p = S.plan,
    c = computeDay(p, S.di),
    li = sh.li,
    { A, B } = legEnds(p, S.di, li);
  const cur = li < c.rows.length ? c.rows[li].leg : c.endLeg,
    opts = cur.opts;
  const aN = ptName(p, S.di, li),
    bN = li < c.rows.length ? itemName(p, c.rows[li].it) : c.day.end.kind === 'airport' ? '공항' : '숙소';
  const view = sh.mode || cur.id,
    hasWalk = opts.some(o => o.mode === 'walk');
  const cheapest = Math.min(...opts.filter(o => !o.isOff && !fareUnknown(o.fare)).map(o => fareSum(o.fare)));
  const fastest = Math.min(...opts.filter(o => !o.isOff).map(o => o.min));
  let walkPart = '';
  if (view === 'walk') {
    if (!sh.recs) sh.recs = walkRecs(p, S.di, li);
    const R = sh.recs;
    if (R.err) walkPart = `<p class="note">${ic('alert')}<span>${esc(R.err)}</span></p>`;
    else {
      const sumAdd = R.recs.filter(r => sh.picks.includes(r.s.id)).reduce((t, r) => t + r.add, 0);
      walkPart = `<section class="walk">
        <h3>${ic('walk')}걸어가는 길에 들를 만한 곳</h3>
        <p class="sub">${esc(aN)} → ${esc(bN)} 약 ${dist(R.L)}, ${R.walk}분 · 길 양옆 ${Math.round(R.corridor * 1000)}m 안쪽이에요. 고르면 이 구간에 넣고 이후 일정을 다시 짜요.</p>
        <div class="wmap" id="wmap"></div>
        ${
          R.recs.length
            ? `<div class="recs">${R.recs
                .map((r, k) => {
                  const on = sh.picks.includes(r.s.id);
                  return `<button class="rec${on ? ' on' : ''}" data-act="recToggle" data-id="${r.s.id}" aria-pressed="${on}">
            ${catTile(r.s.c)}<span class="rb"><b><span class="rn">${k + 1}</span>${esc(r.s.n)}</b><small>${esc(r.s.d)}</small><small class="rm">${fmt(r.eta)}쯤 · 길에서 ${Math.round(r.dd * 1000)}m · 일정 +${r.add}분${r.s.meal ? ' · 식사' : ''}</small></span>
            <span class="tick">${on ? ic('check') : ''}</span></button>`;
                })
                .join('')}</div>`
            : `<p class="note">${ic('walk')}<span>이 길 근처엔 추천할 곳이 아직 없어요. 걷기만 해도 좋아요.</span></p>`
        }
      </section>`;
    }
  }
  const foot =
    view === 'walk' && sh.recs && !sh.recs.err
      ? `<div class="sh-foot"><button class="btn soft" data-act="walkOnly">걷기만</button><button class="btn pri" data-act="applyWalk" ${sh.picks.length ? '' : 'disabled'}>${sh.picks.length ? `${sh.picks.length}곳 넣고 다시 짜기 · +${sumAddOf(sh)}분` : '들를 곳을 골라 주세요'}</button></div>`
      : '';
  return `<div class="sh-h"><div><h2>이동 방법</h2><p>${esc(aN)} → ${esc(bN)} · ${dist(km(A, B))}</p></div><button class="ib sm" data-act="closeSheet" aria-label="닫기">${ic('close')}</button></div>
    ${savedNow() ? `<button class="to-guide" data-act="toGuide" data-li="${li}">${ic('nav')}<span><b>이 구간 타는 법 보기</b><small>타는 역·방면·내리는 역을 일본어와 함께</small></span>${ic('next')}</button>` : ''}
    <div class="opts">${opts
      .map(o => {
        const on = o.id === view,
          ft = fareTxt(o.fare) || '무료';
        const badges = [
          o.id === cur.id ? '<span class="tag">지금</span>' : '',
          !o.isOff && o.min === fastest ? '<span class="tag fast">가장 빠름</span>' : '',
          !o.isOff && fareSum(o.fare) === cheapest && opts.length > 1 ? '<span class="tag cheap">가장 쌈</span>' : '',
          o.mode === 'walk' ? '<span class="tag walk">길 위 추천</span>' : ''
        ].join('');
        return `<button class="opt${on ? ' on' : ''}${o.isOff ? ' off' : ''}" data-act="legMode" data-mode="${o.id}" aria-pressed="${on}" ${o.isOff ? 'disabled' : ''}>
        ${modeIc(o.mode)}<span class="ob"><span class="o1"><b>${MODE[o.mode].n}</b>${badges}</span>
        <span class="o2"><b>${o.min}분</b><em>${ft}</em></span>
        <span class="ol">${esc(o.label)}</span>
        ${o.steps && o.steps.length ? `<ol class="osteps">${o.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
        ${o.isOff ? `<span class="onote">${esc(o.off.note)}</span>` : o.note ? `<span class="onote">${esc(o.note)}</span>` : ''}</span></button>`;
      })
      .join('')}</div>
    ${!hasWalk ? `<p class="note">${ic('alert')}<span>${A.z !== B.z ? '다른 지역으로 넘어가는 구간이라 걷기는 고를 수 없어요.' : '이 구간은 걸어가기 어려워요.'}</span></p>` : ''}
    ${walkPart}${foot}`;
}
// 장소 추가 시 시간 계산
function sumAddOf(sh) {
  return sh.recs.recs.filter(r => sh.picks.includes(r.s.id)).reduce((t, r) => t + r.add, 0);
}
// 시트: 장소 추가
function addSheet(sh) {
  return `<div class="sh-h"><div><h2>${S.di + 1}일차에 장소 추가</h2><p>가장 덜 돌아가는 자리에 넣어 드려요.</p></div><button class="ib sm" data-act="closeSheet" aria-label="닫기">${ic('close')}</button></div>
    <label class="search">${ic('search')}<span class="sr">장소 검색</span><input id="addQ" data-input="addQ" value="${esc(sh.q)}" placeholder="이름·동네·종류 (예: 라멘, 텐진)"></label>
    <div class="chips-sel scroll">${[['all', '전체'], ...Object.entries(CATS).map(([k, v]) => [k, v.n])].map(([k, v]) => `<button class="${sh.cat === k ? 'on' : ''}" data-act="addCat" data-v="${k}">${v}</button>`).join('')}</div>
    <div class="add-list" id="addList">${addListHTML(sh)}</div>
    <details class="card custom"><summary>${ic('pin')}목록에 없는 일정 직접 넣기${ic('down', 'chev')}</summary>
      <div class="grid2"><label class="fld"><span>이름</span><input id="cName" maxlength="30" placeholder="예: 호텔에서 쉬기"></label>
      <label class="fld"><span>시간</span><select id="cStay">${[15, 30, 45, 60, 90, 120, 180].map(m => `<option value="${m}"${m === 60 ? ' selected' : ''}>${dur(m)}</option>`).join('')}</select></label></div>
      <button class="btn pri" data-act="addCustom">${ic('plus')}마지막에 넣기</button>
    </details>`;
}
// 장소 추가 목록
function addListHTML(sh) {
  const p = S.plan,
    day = p.days[S.di],
    q = sh.q.trim().toLowerCase();
  const where = {};
  p.days.forEach((d, k) =>
    d.items.forEach(it => {
      if (it.sid) where[it.sid] = k;
    })
  );
  const pts = day.items.map(it => itemPt(p, it));
  const ref = pts.length
    ? { lat: pts.reduce((t, x) => t + x.lat, 0) / pts.length, lng: pts.reduce((t, x) => t + x.lng, 0) / pts.length }
    : hotelPt(dayHotel(p, S.di));
  const list = SPOTS.filter(
    s =>
      (sh.cat === 'all' || s.c === sh.cat) &&
      (!q || (s.n + s.j + AREA[s.a].n + CATS[s.c].n + s.d).toLowerCase().includes(q))
  )
    .map(s => ({ s, d: km(ref, s), mine: (day.areas || []).includes(s.a) }))
    .sort((a, b) => b.mine - a.mine || a.d - b.d)
    .slice(0, 40);
  if (!list.length)
    return `<p class="note">${ic('search')}<span>찾는 곳이 없어요. 아래에서 직접 넣을 수 있어요.</span></p>`;
  return `<ul>${list
    .map(({ s, d }) => {
      const w = where[s.id],
        added = (sh.added || []).includes(s.id);
      return `<li><button class="al-b" data-act="spotSheet" data-id="${s.id}" aria-label="${esc(s.n)} 정보 보기">${catTile(s.c)}<span class="al-t"><b>${esc(s.n)}</b><small>${AREA[s.a].n} · ${dur(s.s)} · 지금 동선에서 ${dist(d)}</small></span></button>
      ${added ? `<span class="tag walk">${ic('check')}넣음</span>` : w != null ? `<span class="tag">${w + 1}일차</span>` : `<button class="btn soft sm" data-act="addSpot" data-id="${s.id}">추가</button>`}</li>`;
    })
    .join('')}</ul>`;
}
// 시트: 하루 시작·마무리 시간
function dayTimeSheet() {
  const day = S.plan.days[S.di];
  return `<div class="sh-h"><div><h2>${S.di + 1}일차 시간</h2><p>바꾸면 이 날 일정을 다시 맞춰요.</p></div><button class="ib sm" data-act="closeSheet" aria-label="닫기">${ic('close')}</button></div>
    <div class="grid2">${selT('dtStart', day.start.time, day.start.kind === 'airport' ? '공항에서 출발' : '숙소에서 출발')}${selT('dtEnd', day.end.time, day.end.kind === 'airport' ? '공항 도착 기준' : '숙소 도착')}</div>
    <div class="sh-foot"><button class="btn soft" data-act="closeSheet">취소</button><button class="btn pri" data-act="applyDayTime">적용하고 다시 짜기</button></div>`;
}
// 시트: 여행 이름 바꾸기
function renameSheet() {
  return `<div class="sh-h"><div><h2>여행 이름</h2></div><button class="ib sm" data-act="closeSheet" aria-label="닫기">${ic('close')}</button></div>
    <label class="fld"><span class="sr">여행 이름</span><input id="renameIn" value="${esc(S.plan.title)}" maxlength="40"></label>
    <div class="sh-foot"><button class="btn soft" data-act="closeSheet">취소</button><button class="btn pri" data-act="applyRename">바꾸기</button></div>`;
}
// 시트: 확인 (저장하지 않고 나갈까요? 등)
function confirmSheet(sh) {
  return `<div class="sh-h"><div><h2>${esc(sh.title)}</h2><p>${esc(sh.msg)}</p></div></div>
    <div class="sh-foot col">${sh.btns.map(b => `<button class="btn ${b.cls}" data-act="${b.act}" ${b.id ? `data-id="${b.id}"` : ''}>${esc(b.t)}</button>`).join('')}</div>`;
}
// 열려 있는 시트 그리기 (SHEETS 목록에서 찾아요)
function sheetV() {
  const sh = S.sheet;
  if (!sh) return '';
  const inner = SHEETS[sh.type]
    ? SHEETS[sh.type](sh)
    : sh.type === 'leg'
      ? legSheet(sh)
      : sh.type === 'add'
        ? addSheet(sh)
        : sh.type === 'dayTime'
          ? dayTimeSheet()
          : sh.type === 'rename'
            ? renameSheet()
            : sh.type === 'ja'
              ? jaSheet(sh)
              : confirmSheet(sh);
  return `<div class="scrim" data-act="closeSheet"></div><div class="sheet s-${sh.type}" role="dialog" aria-modal="true" aria-label="${SHEET_LABEL[sh.type] || '확인'}"><span class="handle" aria-hidden="true"></span>${inner}</div>`;
}

// ---- 렌더 ----
function render() {
  const y = window.scrollY,
    shEl = document.querySelector('.sheet'),
    shY = shEl ? shEl.scrollTop : 0;
  const v = S.view === 'home' ? homeV() : S.view === 'dates' ? datesV() : S.view === 'areas' ? areasV() : planV();
  $app.innerHTML = `<div class="shell v-${S.view}">${v}${sheetV()}<div class="toasts" id="toasts" aria-live="polite"></div></div>`;
  document.body.classList.toggle('locked', !!S.sheet);
  const sh = document.querySelector('.sheet');
  if (sh && S.keepSheetScroll) sh.scrollTop = shY;
  S.keepSheetScroll = false;
  window.scrollTo(0, y);
  drawMaps();
  wireHero();
  if (typeof navSync === 'function') navSync();
}
// 다른 화면으로 가기 (home·dates·areas·plan)
function go(view) {
  S.view = view;
  S.sheet = null;
  render();
  window.scrollTo(0, 0);
}

// ---- 동작 ----
const A = {
  goHome() {
    if (S.view === 'plan' && !S.saved) {
      S.sheet = {
        type: 'confirm',
        title: '저장하지 않고 나갈까요?',
        msg: '이번에 바꾼 내용이 사라져요.',
        btns: [
          { t: '저장하고 나가기', cls: 'pri', act: 'saveLeave' },
          { t: '저장 안 하고 나가기', cls: 'soft danger', act: 'leaveNoSave' },
          { t: '취소', cls: 'ghost', act: 'closeSheet' }
        ]
      };
      render();
      return;
    }
    S.plan = null;
    go('home');
  },
  leaveNoSave() {
    S.plan = null;
    S.saved = true;
    go('home');
  },
  saveLeave() {
    A.save();
    S.plan = null;
    go('home');
  },
  saveGuide() {
    A.save(null, null, null, true);
  },
  showJa(d) {
    S.sheet = { type: 'ja', i: Number(d.i) };
    render();
  },
  toGuide(d) {
    S.sheet = null;
    S.tab = 'guide';
    render();
    const el = document.getElementById('g-' + d.li);
    if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 140) });
  },
  newPlan() {
    S.draft = defaultDraft();
    S.mv = null;
    go('dates');
  },
  calMove(d) {
    S.draft.cal = addMonth(S.draft.cal, Number(d.n));
    render();
  },
  pickDate(d) {
    const D = S.draft,
      s = d.d;
    if (!D.start || (D.start && D.end)) {
      D.start = s;
      D.end = null;
    } else if (s < D.start) {
      D.start = s;
    } else if (dayDiff(D.start, s) > 9) {
      D.end = ymd(new Date(pd(D.start).getTime() + 9 * 864e5));
      toast('최대 10일까지 고를 수 있어요.');
    } else D.end = s;
    render();
  },
  setHotel(d) {
    S.draft.hotel = d.v;
    render();
  },
  toAreas() {
    if (S.draft.start && S.draft.end) go('areas');
  },
  toDates() {
    go('dates');
  },
  toggleArea(d) {
    const a = S.draft.areas,
      i = a.indexOf(d.id);
    if (i >= 0) a.splice(i, 1);
    else a.push(d.id);
    render();
  },
  zoom(d) {
    const base = S.mvBase;
    if (!base) return;
    const mv = S.mv || { ...base },
      f = Number(d.n) > 0 ? 0.7 : 1 / 0.7;
    const w = clamp(mv.w * f, base.w * 0.3, base.w),
      h = (w * base.h) / base.w,
      cx = mv.x + mv.w / 2,
      cy = mv.y + mv.h / 2;
    S.mv = w >= base.w * 0.999 ? null : { x: cx - w / 2, y: cy - h / 2, w, h };
    render();
  },
  generate() {
    const D = S.draft;
    S.plan = createPlan(
      {
        start: D.start,
        end: D.end,
        hotel: D.hotel,
        stays: D.stays,
        arrive: D.arrive,
        depart: D.depart,
        dayStart: D.dayStart,
        dayEnd: D.dayEnd
      },
      D.areas
    );
    S.saved = false;
    S.isNew = true;
    S.di = 0;
    S.tab = 'sched';
    S.sel = null;
    S.undo = [];
    S.banner = null;
    go('plan');
    toast('일정을 만들었어요. 마음에 들면 저장하세요.');
  },
  openPlan(d) {
    const p = S.plans.find(x => x.id === d.id);
    if (!p) return;
    S.plan = clone(p);
    S.saved = true;
    S.isNew = false;
    S.undo = [];
    S.banner = null;
    S.sel = null;
    S.tab = d.tab || 'sched';
    S.di = Math.min(planStatus(p).di, p.days.length - 1);
    go('plan');
  },
  save(d, el, e, toGuide) {
    const p = S.plan;
    p.updated = Date.now();
    const i = S.plans.findIndex(x => x.id === p.id),
      first = i < 0;
    if (i >= 0) S.plans[i] = clone(p);
    else S.plans.push(clone(p));
    const ok = store.writeLocal(S.plans);
    store.put(p);
    S.saved = true;
    S.isNew = false;
    if (S.view === 'plan') {
      if (first || toGuide) {
        S.tab = 'guide';
        S.sel = null;
      }
      render();
      if (first || toGuide) window.scrollTo(0, 0);
      toast(
        !(ok || store.mode === 'account')
          ? '저장했지만 이 브라우저에선 보관이 안 될 수 있어요.'
          : first || toGuide
            ? '저장했어요. 구간별 이동 안내가 만들어졌어요.'
            : '저장했어요.'
      );
    }
  },
  delAsk(d) {
    const p = S.plans.find(x => x.id === d.id);
    S.sheet = {
      type: 'confirm',
      title: `'${p.title}' 삭제할까요?`,
      msg: '삭제하면 되돌릴 수 없어요.',
      btns: [
        { t: '삭제', cls: 'pri danger-fill', act: 'delPlan', id: d.id },
        { t: '취소', cls: 'ghost', act: 'closeSheet' }
      ]
    };
    render();
  },
  delPlan(d) {
    S.plans = S.plans.filter(x => x.id !== d.id);
    store.writeLocal(S.plans);
    store.remove(d.id);
    S.sheet = null;
    render();
    toast('계획을 삭제했어요.');
  },
  tab(d) {
    S.tab = d.t;
    S.sel = null;
    render();
    window.scrollTo(0, 0);
  },
  day(d) {
    S.di = Number(d.i);
    S.sel = null;
    S.mapSel = null;
    S.banner = null;
    render();
  },
  fareDay(d) {
    S.di = Number(d.i);
    S.tab = 'sched';
    render();
    window.scrollTo(0, 0);
  },
  sel(d) {
    S.sel = S.sel === d.uid ? null : d.uid;
    render();
  },
  mapPick(d) {
    S.mapSel = S.mapSel === d.uid ? null : d.uid;
    S.sel = S.mapSel;
    render();
    const el = document.querySelector('.sp.on');
    if (el) el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  },
  hideHint() {
    S.hintOff = true;
    lsSet('fk-hint-off', true);
    render();
  },
  rename() {
    S.sheet = { type: 'rename' };
    render();
    setTimeout(() => {
      const i = document.getElementById('renameIn');
      if (i) {
        i.focus();
        i.select();
      }
    }, 30);
  },
  applyRename() {
    const v = (document.getElementById('renameIn').value || '').trim();
    if (v) {
      S.plan.title = v.slice(0, 40);
      dirty();
    }
    S.sheet = null;
    render();
  },
  leg(d) {
    S.sheet = { type: 'leg', li: Number(d.li), picks: [], mode: null, recs: null };
    render();
  },
  legMode(d) {
    const sh = S.sheet,
      id = d.mode;
    if (id === 'walk') {
      sh.mode = 'walk';
      S.keepSheetScroll = true;
      render();
      return;
    }
    const p = S.plan,
      { Akey, Bkey } = legEnds(p, S.di, sh.li),
      before = computeDay(p, S.di).endArr;
    pushUndo();
    p.days[S.di].modes[Akey + '>' + Bkey] = id;
    dirty();
    S.sheet = null;
    render();
    const after = computeDay(p, S.di).endArr,
      dlt = after - before,
      m = id.replace(/\d+$/, '');
    toast(
      `${MODE[m].n}(으)로 바꿨어요.${dlt ? ` 이후 일정이 ${Math.abs(dlt)}분 ${dlt > 0 ? '늦어져요' : '당겨져요'}.` : ''}`,
      true
    );
  },
  recToggle(d) {
    const pk = S.sheet.picks,
      i = pk.indexOf(d.id);
    if (i >= 0) pk.splice(i, 1);
    else pk.push(d.id);
    S.keepSheetScroll = true;
    render();
  },
  applyWalk() {
    const sh = S.sheet;
    if (!sh.picks.length) return;
    pushUndo();
    const res = applyWalk(S.plan, S.di, sh.li, sh.picks.slice());
    S.banner = { title: '걷는 길로 바꾸고 이후 일정을 다시 짰어요', res };
    dirty();
    S.sheet = null;
    S.sel = null;
    S.tab = 'sched';
    render();
    const el = document.querySelector('.banner');
    if (el)
      window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 130), behavior: 'smooth' });
  },
  walkOnly() {
    const sh = S.sheet,
      p = S.plan,
      day = p.days[S.di],
      { Akey, Bkey } = legEnds(p, S.di, sh.li);
    pushUndo();
    const before = computeDay(p, S.di).endArr;
    day.modes[Akey + '>' + Bkey] = 'walk';
    if (computeDay(p, S.di).over > 10) {
      const fixed = Bkey === 'E' ? day.items.length : day.items.findIndex(i => i.uid === Bkey) + 1;
      const res = replanFrom(p, S.di, fixed);
      res.endBefore = before;
      S.banner = { title: '걷기로 바꾸고 늦어진 만큼 일정을 정리했어요', res };
    }
    dirty();
    S.sheet = null;
    render();
    const dlt = computeDay(p, S.di).endArr - before;
    if (!S.banner)
      toast(
        `걷기로 바꿨어요.${dlt ? ` 이후 일정이 ${Math.abs(dlt)}분 ${dlt > 0 ? '늦어져요' : '당겨져요'}.` : ''}`,
        true
      );
  },
  replanDay() {
    pushUndo();
    const res = replanFrom(S.plan, S.di, leadingFixed(S.plan.days[S.di]));
    S.banner = { title: `${S.di + 1}일차 일정을 다시 짰어요`, res };
    dirty();
    S.sel = null;
    S.tab = 'sched';
    render();
  },
  replanHere(d) {
    const day = S.plan.days[S.di],
      idx = day.items.findIndex(i => i.uid === d.uid),
      name = itemName(S.plan, day.items[idx]);
    pushUndo();
    const res = replanFrom(S.plan, S.di, Math.max(idx, leadingFixed(day)));
    S.banner = { title: `'${name}'부터 다시 짰어요`, res };
    dirty();
    S.sel = null;
    render();
  },
  closeBanner() {
    S.banner = null;
    render();
  },
  undo() {
    const u = S.undo.pop();
    if (!u) {
      toast('되돌릴 내용이 없어요.');
      return;
    }
    S.plan = u.plan;
    S.di = u.di;
    S.banner = null;
    S.sel = null;
    dirty();
    render();
    toast('되돌렸어요.');
  },
  stay(d) {
    const it = S.plan.days[S.di].items.find(i => i.uid === d.uid);
    pushUndo();
    it.stay = clamp(it.stay + Number(d.n), 15, 600);
    dirty();
    render();
  },
  move(d) {
    const items = S.plan.days[S.di].items,
      i = items.findIndex(x => x.uid === d.uid),
      j = i + Number(d.n);
    if (j < 0 || j >= items.length) return;
    const before = computeDay(S.plan, S.di);
    pushUndo();
    [items[i], items[j]] = [items[j], items[i]];
    items.forEach(x => {
      if (x.fixed) x.fixed = false;
    });
    cleanModes(S.plan, S.di);
    dirty();
    const after = computeDay(S.plan, S.di),
      diff = after.endArr - before.endArr,
      k = Math.max(i, j);
    // 뒤로 밀린 쪽(둘 중 뒤에 있는 곳) 아래에 물어봐요
    S.reAsk =
      (diff >= 10 || after.over > Math.max(0, before.over)) && k < items.length - 1
        ? { uid: items[k].uid, di: S.di, at: S.editN, diff }
        : null;
    render();
  },
  reAskNo() {
    S.reAsk = null;
    render();
  },
  reAskYes() {
    const q = S.reAsk;
    S.reAsk = null;
    if (!q) return;
    const day = S.plan.days[S.di],
      idx = day.items.findIndex(x => x.uid === q.uid);
    if (idx < 0) {
      render();
      return;
    }
    pushUndo();
    const res = replanFrom(S.plan, S.di, idx + 1);
    S.banner = {
      title: L(
        `'${itemName(S.plan, day.items[idx])}' 뒤쪽 일정을 다시 짰어요`,
        `「${day.items[idx].sid ? SPOT[day.items[idx].sid].j : itemName(S.plan, day.items[idx])}」より後ろの予定を組み直しました`
      ),
      res
    };
    dirty();
    S.sel = null;
    render();
  },
  toPark(d) {
    const day = S.plan.days[S.di],
      i = day.items.findIndex(x => x.uid === d.uid);
    pushUndo();
    const [it] = day.items.splice(i, 1);
    park(S.plan, S.di, it, '직접 뺀 곳');
    cleanModes(S.plan, S.di);
    S.sel = null;
    dirty();
    render();
    toast(`${itemName(S.plan, it)}을(를) 보류함으로 옮겼어요.`, true);
  },
  unpark(d) {
    const p = S.plan,
      k = p.parked.findIndex(x => x.uid === d.uid);
    if (k < 0) return;
    pushUndo();
    const [x] = p.parked.splice(k, 1);
    const { reason, fromDay, ...it } = x;
    it.src = 'user';
    const pos = insertBest(p, S.di, it);
    S.openParked = true;
    dirty();
    render();
    toast(`${S.di + 1}일차 ${pos + 1}번째에 넣었어요.`, true);
  },
  delParked(d) {
    pushUndo();
    S.plan.parked = S.plan.parked.filter(x => x.uid !== d.uid);
    S.openParked = true;
    dirty();
    render();
  },
  addOpen() {
    S.sheet = { type: 'add', q: '', cat: 'all', added: [] };
    render();
  },
  addCat(d) {
    S.sheet.cat = d.v;
    S.keepSheetScroll = true;
    render();
  },
  addSpot(d) {
    const p = S.plan;
    pushUndo();
    p.parked = p.parked.filter(x => x.sid !== d.id);
    const pos = insertBest(p, S.di, mkItem(d.id, 'user'));
    S.sheet.added.push(d.id);
    dirty();
    const list = document.getElementById('addList');
    if (list) list.innerHTML = addListHTML(S.sheet);
    toast(`${SPOT[d.id].n}을(를) ${pos + 1}번째에 넣었어요.`, true);
  },
  addCustom() {
    const el = document.getElementById('cName'),
      name = (el.value || '').trim();
    if (!name) {
      el.focus();
      toast('이름을 적어 주세요.');
      return;
    }
    const stay = Number(document.getElementById('cStay').value),
      p = S.plan,
      c = computeDay(p, S.di),
      at = c.rows.length ? c.rows[c.rows.length - 1].p : c.startPt;
    pushUndo();
    p.days[S.di].items.push({
      uid: uid(),
      n: name,
      lat: at.lat,
      lng: at.lng,
      z: at.z,
      stay,
      src: 'user',
      custom: true
    });
    cleanModes(p, S.di);
    dirty();
    S.sheet = null;
    render();
    toast(`'${name}'을(를) 마지막에 넣었어요.`, true);
  },
  dayTime() {
    S.sheet = { type: 'dayTime' };
    render();
  },
  applyDayTime() {
    const s = document.getElementById('dtStart').value,
      e = document.getElementById('dtEnd').value;
    if (toMin(e) <= toMin(s) + 30) {
      toast('마무리 시간이 출발보다 늦어야 해요.');
      return;
    }
    pushUndo();
    const day = S.plan.days[S.di];
    day.start.time = s;
    day.end.time = e;
    const res = replanFrom(S.plan, S.di, leadingFixed(day));
    S.banner = { title: '시간을 바꾸고 일정을 다시 짰어요', res };
    dirty();
    S.sheet = null;
    render();
  },
  closeSheet() {
    S.sheet = null;
    render();
  }
};

// ---- 이벤트 ----
$app.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || !$app.contains(el) || el.disabled) return;
  const fn = A[el.dataset.act];
  if (!fn) return;
  e.preventDefault();
  fn({ ...el.dataset }, el, e);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && S.sheet) A.closeSheet();
});
$app.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('g[data-act]')) {
    e.preventDefault();
    const fn = A[e.target.dataset.act];
    if (fn) fn({ ...e.target.dataset });
  }
  if (e.key === 'Enter' && e.target.id === 'renameIn') A.applyRename();
});
$app.addEventListener(
  'toggle',
  e => {
    if (!e.target.classList) return;
    if (e.target.classList.contains('parked')) S.openParked = e.target.open;
    if (e.target.classList.contains('tips')) S.tipsOpen = e.target.open;
  },
  true
);
$app.addEventListener('input', e => {
  const t = e.target,
    k = t.dataset.input;
  if (!k) return;
  if (k === 'memo') {
    const it = S.plan.days[S.di].items.find(i => i.uid === t.dataset.uid);
    if (it) {
      it.memo = t.value;
      dirty();
    }
  } else if (k === 'addQ') {
    S.sheet.q = t.value;
    const l = document.getElementById('addList');
    if (l) l.innerHTML = addListHTML(S.sheet);
  } else if (k === 'rate') {
    const v = Number(t.value);
    if (v >= 300 && v <= 2000) {
      S.rate = v;
      lsSet('fk-rate', v);
      const hn = document.querySelector('.fh-n span');
      if (hn) hn.textContent = won(farePlan(S.plan).best);
    }
  }
});
$app.addEventListener('change', e => {
  const t = e.target,
    k = t.dataset.change;
  if (!k) return;
  if (k === 'xferFile') {
    xferFromFile(t.files && t.files[0]);
    return;
  }
  if (k === 'stayFrom') {
    stayFromChange(t);
    return;
  }
  if (['arrive', 'depart', 'dayStart', 'dayEnd'].includes(k)) S.draft[k] = t.value;
  else if (k === 'moveDay' && t.value !== '') {
    const to = Number(t.value),
      p = S.plan,
      day = p.days[S.di],
      i = day.items.findIndex(x => x.uid === t.dataset.uid);
    pushUndo();
    const [it] = day.items.splice(i, 1);
    it.fixed = false;
    cleanModes(p, S.di);
    const pos = insertBest(p, to, it);
    dirty();
    S.sel = null;
    render();
    toast(`${itemName(p, it)}을(를) ${to + 1}일차 ${pos + 1}번째로 옮겼어요.`, true);
  }
});
let rzT;
window.addEventListener('resize', () => {
  clearTimeout(rzT);
  rzT = setTimeout(drawMaps, 120);
});
