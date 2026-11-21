// ======================================================================
// i18n.js · 일본어 화면 바꾸기 장치
// 화면을 한국어로 그린 뒤, 일본어 모드면 글자를 ja.json 사전에서 찾아 바꿔요.
// 새로 쓰는 글자는 L('한국어', '日本語') 로 바로 쓰는 게 제일 편해요. (home.js 의 L 함수)
// 고치는 법: docs/수정가이드.md
// ======================================================================
// ===== 한국어 ↔ 일본어 =====
// 화면은 한국어로 그리고, 일본어일 때는 그려진 글자를 사전으로 바꿔요.
// 사전 키에서 장소 이름은 {@}, 숫자는 {#}, 이미 일본어인 부분은 {J} 로 바꿔서 찾아요.
let LANG = (() => {
  try {
    return JSON.parse(localStorage.getItem('fk-lang') || '"ko"') === 'ja' ? 'ja' : 'ko';
  } catch (e) {
    return 'ko';
  }
})();
const WD_KO = ['일', '월', '화', '수', '목', '금', '토'],
  WD_JA = ['日', '月', '火', '水', '木', '金', '土'];
const HANGUL = /[가-힣ㄱ-ㆎ]/;
const NAME_FIX = {
  // 동네
  하카타역: '博多駅',
  '나카스·기온': '中洲・祇園',
  '텐진·다이묘': '天神・大名',
  '오호리공원·성터': '大濠公園・城跡',
  '모모치 해변': 'シーサイドももち',
  '베이사이드·하코자키': 'ベイサイド・箱崎',
  다자이후: '太宰府',
  이토시마: '糸島',
  노코노시마: '能古島',
  우미노나카미치: '海の中道',
  야나가와: '柳川',
  유후인: '由布院',
  벳푸: '別府',
  '모지코·고쿠라': '門司港・小倉',
  // 숙소 동네
  텐진: '天神',
  나카스: '中洲',
  '기온·캐널시티': '祇園・キャナルシティ',
  // 종류·이동수단
  명소: '観光',
  맛집: 'グルメ',
  카페: 'カフェ',
  쇼핑: 'ショッピング',
  '자연·공원': '自然・公園',
  온천: '温泉',
  도보: '徒歩',
  지하철: '地下鉄',
  버스: 'バス',
  택시: 'タクシー',
  '렌터카·택시': 'レンタカー・タクシー',
  '전철·열차': '電車・列車',
  페리: 'フェリー',
  // 장소
  '후쿠오카 공항 국제선': '福岡空港 国際線',
  '숙소 (하카타역 주변)': '宿（博多駅周辺）',
  '숙소 (텐진 주변)': '宿（天神周辺）',
  '숙소 (야쿠인 주변)': '宿（薬院周辺）',
  '숙소 (오호리코엔 주변)': '宿（大濠公園周辺）',
  '숙소 (니시진 주변)': '宿（西新周辺）',
  '숙소 (나카스 주변)': '宿（中洲周辺）',
  '숙소 (기온·캐널시티 주변)': '宿（祇園・キャナルシティ周辺）',
  '하카타역 지쿠시 출구': '博多駅 筑紫口',
  '하카타 버스터미널': '博多バスターミナル',
  '니시테츠 텐진역': '西鉄福岡（天神）駅'
};
let NAME_JA = null,
  NAME_RE = null;
function buildNames() {
  const m = new Map(),
    add = (ko, ja) => {
      if (ko && ja && ko.length >= 2 && HANGUL.test(ko) && !m.has(ko)) m.set(ko, ja);
    };
  Object.entries(NAME_FIX).forEach(([k, v]) => add(k, v));
  SPOTS.forEach(s => add(s.n, s.j));
  Object.values(STATIONS).forEach(s => add(s.n, s.j));
  Object.values(LINES).forEach(l => add(l.n, l.j));
  Object.values(HUB).forEach(h => add(h.n, h.j));
  NAME_JA = m;
  NAME_RE = new RegExp(
    [...m.keys()]
      .sort((a, b) => b.length - a.length)
      .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|'),
    'g'
  );
}
const JC = '\u3040-\u30FF\u3400-\u9FFF\uF900-\uFAFF々〆ヵヶ「」『』【】〜（）';
const JA_RUN = new RegExp(`[\\d.,:/()]*[${JC}][${JC}\\d.,:/()]*`, 'g');
const NUM_RUN = /\d+(?:[.,:/]\d+)*/g;
function normKey(s) {
  if (!NAME_RE) buildNames();
  const at = [],
    js = [],
    ns = [];
  let k = s.replace(NAME_RE, m => {
    at.push(m);
    return '{@}';
  });
  k = k.replace(JA_RUN, m => {
    js.push(m);
    return '{J}';
  });
  k = k.replace(NUM_RUN, m => {
    ns.push(m);
    return '{#}';
  });
  return { key: k, at, js, ns };
}
// 사용자가 직접 적은 이름이 들어가는 문장
const JA_RX = [
  [/^'(.+)' 삭제할까요\?$/, '「$1」を削除しますか？'],
  [/^'(.+)'부터 다시 짰어요$/, '「$1」から組み直しました'],
  [/^(.+)을\(를\) 보류함으로 옮겼어요\.$/, '「$1」を保留リストに移しました。'],
  [/^'(.+)'을\(를\) 마지막에 넣었어요\.$/, '「$1」を最後に入れました。'],
  [/^(.+)을\(를\) (\d+)번째에 넣었어요\.$/, '「$1」を$2番目に入れました。'],
  [/^(.+)을\(를\) (\d+)일차 (\d+)번째로 옮겼어요\.$/, '「$1」を$2日目の$3番目に移しました。'],
  [/^(.+)까지 걸어서 (\d+)분$/, '$1まで徒歩$2分'],
  [/^\((.+)까지 가 주세요\)$/, '($1までお願いします)'],
  [/^숙소 \((.+) 근처\)$/, '宿（$1周辺）'],
  [/^숙소 · (.+)$/, '宿・$1'],
  [/^(.+) 삭제$/, '$1を削除']
];
function fillKey(hit, n) {
  const c = { '@': 0, '#': 0, J: 0 };
  return hit.replace(/\{([#@J])(\d*)\}/g, (_, t, i) => {
    const x = i ? +i - 1 : c[t]++;
    return t === '@' ? (NAME_JA.get(n.at[x]) ?? n.at[x] ?? '') : t === '#' ? (n.ns[x] ?? '') : (n.js[x] ?? '');
  });
}
// 통째로 없으면 ' · ', ' → ' 로 나눠서 조각마다 찾아요
function trCore(core) {
  if (Object.prototype.hasOwnProperty.call(JA, core)) return JA[core];
  const n = normKey(core);
  if (n.key === '{@}' && n.at.length === 1) return NAME_JA.get(n.at[0]);
  const hit = JA[n.key];
  if (hit != null) return fillKey(hit, n);
  for (const [re, to] of JA_RX) {
    const m = core.match(re);
    if (m)
      return to.replace(/\$(\d)/g, (_, d) => {
        const g = m[+d] || '';
        return NAME_JA.get(g) || (HANGUL.test(g) ? (trCore(g) ?? g) : g);
      });
  }
  for (const sep of [' · ', ' → ']) {
    if (core.includes(sep))
      return core
        .split(sep)
        .map(p => (HANGUL.test(p) ? (trCore(p.trim()) ?? p) : p))
        .join(sep);
  }
  if (window.__miss) window.__miss.set(n.key, core);
  return null;
}
function trText(text) {
  if (!HANGUL.test(text)) return text;
  const lead = text.match(/^\s*/)[0],
    trail = text.match(/\s*$/)[0],
    core = text.slice(lead.length, text.length - trail.length);
  const o = trCore(core);
  return o == null ? text : lead + o + trail;
}
const TR_ATTR = ['aria-label', 'placeholder', 'title', 'alt'];
function trTree(root) {
  if (LANG !== 'ja' || !root) return;
  if (root.nodeType === 3) {
    trOne(root);
    return;
  }
  if (root.nodeType !== 1 || skipEl(root)) return;
  trAttrs(root);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: n => (n.nodeType === 1 && skipEl(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)
  });
  let n;
  while ((n = w.nextNode())) {
    if (n.nodeType === 3) trOne(n);
    else trAttrs(n);
  }
}
function skipEl(el) {
  return el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'TEXTAREA' || el.hasAttribute('data-notr');
}
function trOne(t) {
  const p = t.parentElement;
  if (p && p.closest('[data-notr],textarea,script,style')) return;
  const v = t.nodeValue;
  if (!HANGUL.test(v)) return;
  const o = trText(v);
  if (o !== v) t.nodeValue = o;
}
function trAttrs(el) {
  for (const a of TR_ATTR) {
    const v = el.getAttribute(a);
    if (v && HANGUL.test(v)) {
      const o = trText(v);
      if (o !== v) el.setAttribute(a, o);
    }
  }
}
let trObs = null;
function startTr() {
  if (trObs) return;
  trObs = new MutationObserver(ms => {
    if (LANG !== 'ja') return;
    for (const m of ms) {
      if (m.type === 'characterData') trOne(m.target);
      else if (m.type === 'attributes') trAttrs(m.target);
      else m.addedNodes.forEach(trTree);
    }
  });
  trObs.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: TR_ATTR
  });
}
function applyLang() {
  document.documentElement.lang = LANG;
  WD = LANG === 'ja' ? WD_JA : WD_KO;
  document.title = LANG === 'ja' ? '福岡旅行プランナー' : '후쿠오카 여행 플래너';
}
function langBtn(light) {
  return `<button class="lang-btn${light ? ' light' : ''}" data-act="toggleLang" data-notr aria-label="${LANG === 'ja' ? '한국어로 보기' : '日本語で表示'}">${ic('globe')}<span>${LANG === 'ja' ? '한국어' : '日本語'}</span></button>`;
}
