// ======================================================================
// home.js · 홈 화면과 여행 준비
// 홈 상단 사진(HERO_PHOTOS)·동네 사진(AREA_PHOTOS), 공항→시내·교통 패스·타는 법·여행 일본어 시트,
// 동네 둘러보기, 장소 정보 시트, 계획 공유하기(링크·코드), 한국어/일본어 바꾸기(L)
// 고치는 법: docs/수정가이드.md
// ======================================================================
// ===== 홈: 후쿠오카 타워 상단 그림 + 버튼 =====
const AREA_JA = {
  hakata: '博多',
  nakasu: '中洲・祇園',
  tenjin: '天神・大名',
  ohori: '大濠公園',
  momochi: '百道浜',
  bayside: 'ベイサイド',
  dazaifu: '太宰府',
  itoshima: '糸島',
  noko: '能古島',
  uminaka: '海の中道',
  yanagawa: '柳川',
  yufuin: '由布院',
  beppu: '別府',
  mojiko: '門司港'
};
const AREA_TONE = {
  hakata: ['#F0703A', '#B92E1C'],
  nakasu: ['#E2547A', '#6E2652'],
  tenjin: ['#F2A33A', '#C4501C'],
  ohori: ['#5DB58C', '#1F604A'],
  momochi: ['#FF9E6B', '#553A8C'],
  bayside: ['#4FA3D1', '#1B4A80'],
  dazaifu: ['#D9455F', '#5E1A34'],
  itoshima: ['#3FB6C8', '#11596F'],
  noko: ['#EE9BB3', '#A8466C'],
  uminaka: ['#62BE9B', '#1A6D69'],
  yanagawa: ['#79A866', '#2C5636'],
  yufuin: ['#8A7BD0', '#352A70'],
  beppu: ['#E07A4F', '#6E2828'],
  mojiko: ['#5C7FD6', '#1C2A66']
};
// 예전 버전에서 올린 상단 사진은 이제 안 써요 (저장 공간 비우기)
try {
  localStorage.removeItem('fk-hero');
} catch (e) {}
// 상단 사진 (모두 Unsplash 라이선스) — 앱을 열 때마다 바로 전과 다른 사진이 나와요
const HERO_PHOTOS = {
  day: [
    {
      f: 'hero-day-1.jpg',
      by: 'Leopold Maitre',
      u: '3msDfruIp4k',
      alt: ['해 질 녘 분홍빛 하늘이 비친 오호리 공원 호수', '夕暮れのピンク色の空が映る大濠公園の池']
    },
    {
      f: 'hero-day-2.jpg',
      by: 'Zion C',
      u: 'ovBw9UkuiDA',
      alt: ['후쿠오카 성터 해자 위로 핀 벚꽃', '福岡城跡の堀に咲く桜']
    },
    {
      f: 'hero-day-3.jpg',
      by: 'Nichika Sakurai',
      u: 'ur4N7oXpVls',
      alt: ['노을 진 텐진 하늘과 전깃줄', '夕焼けの天神の空と電線']
    },
    {
      f: 'hero-day-4.jpg',
      by: 'Minyeong Jeong',
      u: 'H7FnrACfoAI',
      alt: ['절 문 너머로 보이는 만개한 벚꽃', '寺の門越しに見える満開の桜']
    },
    {
      f: 'hero-day-5.jpg',
      by: 'PJH',
      u: 'OAwFBZfBA7Q',
      alt: ['노을빛이 비치는 미야지다케 신사 앞 길', '夕日が差す宮地嶽神社前の道']
    }
  ],
  night: [
    {
      f: 'hero-nightview-1.jpg',
      by: 'Taewoo Kim',
      u: 'vKcWjhcAfxc',
      alt: ['파란 조명으로 빛나는 후쿠오카 타워', '青くライトアップされた福岡タワー']
    },
    {
      f: 'hero-nightview-2.jpg',
      by: 'K.T. Francis',
      u: '0OVIS0uRrdQ',
      alt: ['붉은 등롱이 밝힌 니시공원 신사 돌계단', '赤い灯籠に照らされた西公園の神社の石段']
    },
    {
      f: 'hero-nightview-3.jpg',
      by: 'Caleb Jack',
      u: 'H3Nv1kiQfL8',
      alt: ['노란 등불이 켜진 후쿠오카의 밤 골목', '提灯が灯る福岡の夜の路地']
    },
    {
      f: 'hero-nightview-4.jpg',
      by: 'Red Shuheart',
      u: 'BltD4NLohe8',
      alt: ['높은 곳에서 내려다본 밤의 도심 거리', '高い所から見下ろした夜の街の通り']
    }
  ]
};
// 이번에 열었을 때 보여 줄 사진 고르기 (지난번과 겹치지 않게)
const HERO_PICK = (() => {
  const last = lsGet('fk-hero-last', {}) || {},
    pick = {};
  for (const sc of Object.keys(HERO_PHOTOS)) {
    const n = HERO_PHOTOS[sc].length;
    let i = Math.floor(Math.random() * n);
    if (n > 1 && i === last[sc]) i = (i + 1 + Math.floor(Math.random() * (n - 1))) % n;
    pick[sc] = i;
  }
  lsSet('fk-hero-last', pick);
  return pick;
})();
// 상단 사진 하나 고르기 (낮/밤 목록에서)
function heroPhoto(sc) {
  const list = HERO_PHOTOS[sc] || HERO_PHOTOS.day,
    p = list[(HERO_PICK[sc] || 0) % list.length];
  return { ...p, src: `photos/${p.f}`, url: `https://unsplash.com/photos/${p.u}`, altT: L(p.alt[0], p.alt[1]) };
}

// 동네 카드 사진 (모두 Unsplash 라이선스) — [사진가, Unsplash 사진 ID]
const AREA_PHOTOS = {
  hakata: ['WS Chae', 'JFLqBa5p4h0'],
  nakasu: ['Jayjayli', 'cAKKzIgOKEQ'],
  tenjin: ['Nichika Sakurai', 'V46fgZZLJCY'],
  ohori: ['Winged Jedi', 'L_GSQ5N8IU0'],
  momochi: ['PJH', 'uDqOED6rrBE'],
  bayside: ['Yuhei Abe Studio', 'VesZCwIGrjY'],
  dazaifu: ['Winged Jedi', 'FwQhjDz4RYs'],
  itoshima: ['PJH', 'izMurwBQ5Q4'],
  noko: ['Kouji Tsuru', 'cy7zm8mGzEY'],
  uminaka: ['Zion C', 'MW9Kch8DRjw'],
  yanagawa: ['MIO ITO', 'CD-8j0ak10g'],
  yufuin: ['Tayawee Supan', 'pDmndWCyGUc'],
  beppu: ['Tayawee Supan', 'I8K-lIkvqYI'],
  mojiko: ['Tomo M', 'TuTiKzZElBU']
};
const areaPh = id => (AREA_PHOTOS[id] && !S.areaBroken[id] ? `photos/area-${id}.jpg` : null);
const areaImg = id => `<img class="ph-img" data-area="${id}" src="photos/area-${id}.jpg" alt="" decoding="async">`;
// 사진을 못 불러오면 그 동네만 원래 색깔 카드로 돌아가요
document.addEventListener(
  'error',
  e => {
    const t = e.target;
    if (!t || !t.classList || !t.classList.contains('ph-img')) return;
    S.areaBroken[t.dataset.area] = 1;
    const box = t.parentElement;
    if (box) box.classList.remove('has-ph');
    const cr = box && box.nextElementSibling;
    if (cr && cr.classList.contains('ph-cr')) cr.remove();
    t.remove();
  },
  true
);

// 로고
function logoSVG() {
  return `<svg class="logo2" viewBox="0 0 28 28" aria-hidden="true"><rect width="28" height="28" rx="9" fill="#D63A1F"/><path d="M11.6 22.5 13.3 6h1.4l1.7 16.5z" fill="#fff"/><rect x="10.6" y="12.6" width="6.8" height="2.2" rx="1" fill="#fff"/><path d="M14 6V3" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/><path d="M6.5 22.8h15" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>`;
}

// 결정적인 난수 (그림이 매번 같게)
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// 상단 사진을 못 불러올 때 대신 보이는 그림
function heroSVG() {
  const R = rng(7);
  // 타워: 가운데 x=360, 바닥 y=304, 유리 꼭대기 y=60
  const hw = y => 18 - ((304 - y) / 244) * 8;
  let panels = '';
  for (let y = 292; y > 66; y -= 13) {
    const w = hw(y);
    panels += `M${(360 - w).toFixed(1)} ${y}H${(360 + w).toFixed(1)}`;
  }
  const lv = [
    [60, 10],
    [48, 8],
    [36, 6],
    [24, 4]
  ];
  let lat = `M350 60L356 24M370 60L364 24`;
  for (let i = 0; i < lv.length - 1; i++) {
    const [y0, w0] = lv[i],
      [y1, w1] = lv[i + 1];
    lat += `M${360 - w0} ${y0}L${360 + w1} ${y1}M${360 + w0} ${y0}L${360 - w1} ${y1}M${360 - w1} ${y1}H${360 + w1}`;
  }
  // 타워 물그림자
  let refl = '';
  for (let y = 326; y < 436; y += 6) {
    const w = Math.max(2, 9 - (y - 326) / 16) + R() * 4;
    const dx = (R() - 0.5) * 6;
    refl += `M${(360 + dx - w).toFixed(1)} ${y}h${(w * 2).toFixed(1)}`;
  }
  let sunRefl = '';
  for (let y = 326; y < 420; y += 7) {
    const w = 6 + R() * 14 - (y - 326) / 14;
    if (w > 1) sunRefl += `M${(196 - w).toFixed(1)} ${y}h${(w * 2).toFixed(1)}`;
  }
  // 밤 창문 불빛
  const boxes = [
    [256, 196, 30, 100],
    [30, 270, 16, 28],
    [48, 258, 11, 40],
    [304, 256, 9, 42],
    [406, 252, 10, 46],
    [478, 260, 14, 38],
    [186, 264, 12, 34]
  ];
  let lights = '';
  boxes.forEach(([x, y, w, h]) => {
    for (let yy = y + 4; yy < y + h - 2; yy += 6)
      for (let xx = x + 2; xx < x + w - 2; xx += 5)
        if (R() > 0.45) lights += `<rect x="${xx}" y="${yy}" width="2.2" height="2.6"/>`;
  });
  let stars = '';
  for (let i = 0; i < 34; i++) {
    const x = R() * 520,
      y = R() * 200,
      r = R() * 1.1 + 0.4;
    stars += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" style="animation-delay:${(R() * 4).toFixed(1)}s"/>`;
  }
  let wins = '';
  for (let y = 202; y < 296; y += 8) wins += `M258 ${y}H276`;
  const palm = (x, y, s, flip) =>
    `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><path class="h-palm" d="M0 0Q2 -14 5 -30"/><path class="h-frond" d="M5 -30Q-6 -35 -13 -25M5 -30Q16 -35 23 -25M5 -30Q-2 -41 -11 -41M5 -30Q12 -42 21 -39M5 -30Q7 -40 3 -46"/></g>`;

  return `<svg class="hart" viewBox="0 0 520 440" preserveAspectRatio="xMidYMax slice" role="img" aria-label="모모치 해변에서 바라본 후쿠오카 타워와 돔 풍경 그림">
  <defs>
    <linearGradient id="hSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--h-s1)"/><stop offset=".62" style="stop-color:var(--h-s2)"/><stop offset="1" style="stop-color:var(--h-s3)"/></linearGradient>
    <linearGradient id="hSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--h-sea1)"/><stop offset="1" style="stop-color:var(--h-sea2)"/></linearGradient>
    <linearGradient id="hTwL" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:var(--h-tw1)"/><stop offset="1" style="stop-color:var(--h-tw1b)"/></linearGradient>
    <linearGradient id="hTwR" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:var(--h-tw2)"/><stop offset="1" style="stop-color:var(--h-tw2b)"/></linearGradient>
    <linearGradient id="hDome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--h-dome1)"/><stop offset="1" style="stop-color:var(--h-dome2)"/></linearGradient>
    <radialGradient id="hGlow"><stop offset="0" style="stop-color:var(--h-sun);stop-opacity:.8"/><stop offset="1" style="stop-color:var(--h-sun);stop-opacity:0"/></radialGradient>
    <mask id="hMoon"><circle cx="128" cy="74" r="15" fill="#fff"/><circle cx="136" cy="68" r="14" fill="#000"/></mask>
  </defs>
  <rect width="520" height="440" fill="url(#hSky)"/>
  <g class="only-night h-stars">${stars}</g>
  <g class="only-day"><circle cx="150" cy="80" r="64" fill="url(#hGlow)"/><circle cx="150" cy="80" r="19" class="h-sun"/></g>
  <g class="only-dusk"><circle cx="196" cy="214" r="120" fill="url(#hGlow)"/><circle cx="196" cy="214" r="27" class="h-sun"/></g>
  <g class="only-night"><circle cx="128" cy="74" r="40" fill="url(#hGlow)" opacity=".5"/><circle cx="128" cy="74" r="15" class="h-sun" mask="url(#hMoon)"/></g>
  <g class="h-cloud"><ellipse cx="70" cy="132" rx="50" ry="7"/><ellipse cx="104" cy="124" rx="30" ry="6"/><ellipse cx="420" cy="96" rx="58" ry="8"/><ellipse cx="456" cy="88" rx="30" ry="6"/><ellipse cx="270" cy="160" rx="44" ry="5"/></g>
  <path class="only-day h-bird" d="M214 128q5 -5 10 0q5 -5 10 0M238 114q4 -4 8 0q4 -4 8 0"/>
  <path class="h-mtn" d="M0 282C40 268 70 262 110 270S170 256 215 262 290 276 330 270 420 252 470 266 510 276 520 278V302H0Z"/>
  <g class="h-city"><rect x="30" y="268" width="16" height="32"/><rect x="48" y="256" width="11" height="44"/><rect x="62" y="274" width="18" height="26"/><rect x="186" y="262" width="12" height="38"/><rect x="200" y="270" width="16" height="30"/><rect x="292" y="266" width="12" height="34"/><rect x="304" y="254" width="9" height="46"/><rect x="392" y="262" width="12" height="38"/><rect x="406" y="250" width="10" height="50"/><rect x="418" y="270" width="16" height="30"/><rect x="478" y="258" width="14" height="42"/><rect x="494" y="272" width="22" height="28"/></g>
  <rect y="300" width="520" height="140" fill="url(#hSea)"/>
  <!-- 후쿠오카 돔 -->
  <path class="h-bld" d="M84 302V294H246V302Z"/>
  <path d="M90 296C96 262 136 246 165 246S234 262 240 296Z" fill="url(#hDome)"/>
  <path class="h-domel" d="M104 282Q165 262 226 282M122 265Q165 251 208 265M165 246V296M128 296Q140 262 165 247M202 296Q190 262 165 247"/>
  <!-- 씨호크 호텔 -->
  <path class="h-b2" d="M252 302 254 194C262 182 276 176 290 180L292 302Z"/>
  <path class="h-b3" d="M278 177C284 177 288 178 290 180L292 302H280Z"/>
  <path class="h-win" d="${wins}"/>
  <g class="h-bld"><rect x="300" y="282" width="22" height="20"/><rect x="398" y="284" width="16" height="18"/><rect x="470" y="280" width="24" height="22"/><rect x="36" y="286" width="30" height="16"/></g>
  <!-- 후쿠오카 타워 -->
  <path class="h-bld" d="M330 306V290H390V306Z"/>
  <path d="M342 304 360 304 360 60 350 60Z" fill="url(#hTwL)"/>
  <path d="M360 304 378 304 370 60 360 60Z" fill="url(#hTwR)"/>
  <path class="h-twhi" d="M364 304 370 304 365.6 60 362.6 60Z"/>
  <path class="h-panel" d="${panels}"/>
  <path class="h-deck" d="M345 144H375L376 158H344Z"/>
  <rect class="h-deckw" x="346.5" y="148.5" width="28" height="4" rx="1"/>
  <path class="h-lat" d="${lat}"/>
  <path class="h-lat" d="M360 24V7"/>
  <circle class="only-night h-tip" cx="360" cy="7" r="2"/>
  <g class="only-night h-lights">${lights}</g>
  <!-- 모래사장과 야자수 -->
  <path class="h-sand" d="M0 300H520V316C430 321 340 314 260 318S80 316 0 321Z"/>
  ${palm(296, 318, 1.05)}${palm(318, 320, 0.8, true)}${palm(404, 317, 0.95)}${palm(28, 320, 1.1, true)}${palm(60, 318, 0.8)}${palm(498, 319, 0.9, true)}
  <!-- 마리존 -->
  <path class="h-pier" d="M432 318H440L446 344H426Z"/>
  <path class="h-pier" d="M404 340H490V346H404Z"/>
  <path class="h-stilt" d="M410 346V358M430 346V358M452 346V358M472 346V358M486 346V358"/>
  <rect class="h-mz" x="412" y="320" width="30" height="20"/><path class="h-mzr" d="M408 321 427 302 446 321Z"/>
  <rect class="h-mz" x="452" y="325" width="20" height="15"/><path class="h-mzr" d="M449 326 462 311 475 326Z"/><path class="h-lat2" d="M462 311V300"/>
  <rect class="h-mz" x="476" y="330" width="11" height="10"/>
  <!-- 물결과 반사 -->
  <path class="h-refl" d="${refl}"/>
  <path class="only-dusk h-refl2" d="${sunRefl}"/>
  <path class="h-wave" d="M20 362h40M90 374h60M180 352h30M250 386h70M392 398h50M60 412h80M300 424h60M470 370h30M150 398h36"/>
</svg>`;
}

// 상단 사진은 시간대에 맞춰 낮/밤이 저절로 바뀌어요
function heroScene() {
  const n = new Date(),
    m = n.getHours() * 60 + n.getMinutes(),
    ss = SUNSET[n.getMonth() + 1] || 1110;
  return m < 330 || m > ss + 30 ? 'night' : 'day';
}

// ★ 홈 상단 (사진·제목)
function heroV(f) {
  const sc = heroScene(),
    hp = heroPhoto(sc),
    stock = !S.photoBroken;
  let txt;
  if (f) {
    const st = planStatus(f);
    txt = `<span class="dday b-${st.k}">${st.label}</span><h1 class="hero-t">${esc(f.title)}</h1><p class="hero-s">${md(f.set.start)} – ${md(f.set.end)} · ${nights(f.days.length)}</p>`;
  } else
    txt = `<p class="hero-k">FUKUOKA <span lang="ja">福岡</span></p><h1 class="hero-t">후쿠오카,<br>어디부터 갈까요?</h1><p class="hero-s">날짜와 동네만 고르면 동선·교통비까지 짜 드려요</p>`;
  return `<section class="hero t-${sc}${stock ? ' has-photo' : ''}">
    ${stock ? `<img class="hero-img stock" src="${hp.src}" alt="${esc(hp.altT)}">` : heroSVG()}
    <div class="hero-shade"></div>
    <div class="hero-top"><span class="brand light">${logoSVG()}후쿠오카 플래너</span><span class="ht-r">${langBtn(true)}</span></div>
    <div class="hero-txt">${txt}</div>
  </section>`;
}

const TILES = [
  { act: 'airSheet', ic: 'plane', t: '공항 → 시내', s: '지하철·버스·택시 비교', c: '#2459C9' },
  { act: 'passSheet', ic: 'card', t: '교통 패스', s: '언제 사야 이득일까', c: '#C47F0E' },
  { act: 'howSheet', ic: 'subway', t: '타는 법', s: '지하철·버스 처음이라면', c: '#1D8A55' },
  { act: 'phraseSheet', ic: 'chat', t: '여행 일본어', s: '보여주기만 하면 되는 말', c: '#D63A1F' }
];
// 홈 「여행 준비」 타일 하나
function tileV(t) {
  return `<button class="tile" data-act="${t.act}" style="--c:${t.c}"><span class="tl-ic">${ic(t.ic)}</span><b>${t.t}</b><small>${t.s}</small></button>`;
}

// 동네 대표 종류
function areaMainCat(id) {
  const n = {};
  SPOTS.filter(s => s.a === id).forEach(s => {
    n[s.c] = (n[s.c] || 0) + 1;
  });
  return Object.entries(n).sort((a, b) => b[1] - a[1])[0]?.[0] || 'sight';
}
// 동네 설명 줄
function areaMeta(a) {
  const tm = a.min + 2 * accessMin(a.z);
  return a.kind === 'trip'
    ? `당일치기 · ${a.far}`
    : `${a.kind === 'outer' ? '근교' : '시내'} · ${tm >= 400 ? '하루' : tm >= 240 ? '반나절+' : '반나절'}`;
}
// 홈 「동네 둘러보기」 사진 타일
function areaTile(a) {
  const n = SPOTS.filter(s => s.a === a.id).length,
    [c1, c2] = AREA_TONE[a.id] || ['#F0703A', '#B92E1C'];
  const ph = areaPh(a.id);
  return `<button class="atile" data-act="areaSheet" data-id="${a.id}" style="--c1:${c1};--c2:${c2}">
    <span class="at-art${ph ? ' has-ph' : ''}">${ph ? areaImg(a.id).replace('<img ', '<img loading="lazy" ') : ''}<span class="at-ja" lang="ja">${AREA_JA[a.id] || ''}</span>${ic(areaMainCat(a.id), 'at-ic')}</span>
    <span class="at-b"><b>${a.n}</b><small>${esc(a.sub)}</small><em>${a.kind === 'trip' ? a.far : a.kind === 'outer' ? '근교' : '시내'} · ${n}곳</em></span>
  </button>`;
}

// 계획이 없을 때 홈 카드
function startCard() {
  return `<button class="start" data-act="newPlan">
    <span class="st-ic">${ic('plus')}</span>
    <span class="st-t"><b>새 여행 계획 세우기</b><small>날짜 → 가고 싶은 동네 → 자동 일정</small></span>${ic('next', 'chev')}
  </button>
  <ul class="feats"><li>${ic('map')}동선 자동</li><li>${ic('walk')}걷는 길 추천</li><li>${ic('wallet')}교통비·패스</li></ul>`;
}
// 홈의 가장 가까운 여행 카드
function tripCard(p) {
  const st = planStatus(p),
    di = Math.min(st.di, p.days.length - 1),
    c = computeDay(p, di),
    rows = c.rows.slice(0, 3),
    fp = farePlan(p);
  const visits = p.days.reduce((t, d) => t + d.items.filter(i => i.sid).length, 0);
  return `<article class="tcard">
    <div class="tc-h"><div><b>${st.k === 'now' ? '오늘 일정' : '첫날 미리보기'}</b><small>${di + 1}일차 · ${md(p.days[di].date)}</small></div>
      <button class="ib sm" data-act="delAsk" data-id="${p.id}" aria-label="${esc(p.title)} 삭제">${ic('trash')}</button></div>
    <ol class="mini">${rows.map(r => `<li><b>${fmt(r.arr)}</b>${r.it.sid ? catTile(SPOT[r.it.sid].c) : catTile(r.it.place === 'hotel' ? 'bed' : 'free')}<span>${esc(itemName(p, r.it))}</span></li>`).join('')}
      ${c.rows.length > rows.length ? `<li class="more">그 밖에 ${c.rows.length - rows.length}곳</li>` : ''}${!c.rows.length ? '<li class="more">아직 일정이 없어요</li>' : ''}</ol>
    <div class="tc-s"><span>방문 <b>${visits}곳</b></span><span>교통비 <b>${fp.approx ? '약 ' : ''}${yen(fp.best)}</b></span><span>숙소 <b>${staysOf(p).length > 1 ? L(`${staysOf(p).length}곳`, `${staysOf(p).length}か所`) : esc(hotelWhereT(nightHotel(p, 0)))}</b></span></div>
    <div class="qa">${[
      ['sched', 'list', '일정'],
      ['map', 'map', '지도'],
      ['guide', 'nav', '이동 안내'],
      ['fare', 'wallet', '교통비']
    ]
      .map(
        ([t, i, l]) =>
          `<button data-act="openPlan" data-id="${p.id}" data-tab="${t}"><span>${ic(i)}</span>${l}</button>`
      )
      .join('')}</div>
  </article>`;
}

// ★ 화면: 홈
function homeV() {
  const plans = sortedPlans(),
    f = plans[0],
    rest = plans.slice(1);
  return `<div class="home2">${heroV(f)}<main class="home-body">
    ${f ? tripCard(f) + `<button class="newp" data-act="newPlan">${ic('plus')}<span>새 여행 계획 세우기</span>${ic('next', 'chev')}</button>` : startCard()}
    <h2 class="sec"><span>여행 준비</span></h2>
    <div class="tiles">${TILES.map(tileV).join('')}</div>
    <h2 class="sec"><span>동네 둘러보기</span><small>눌러서 명소 보기</small></h2>
    <div class="acar">${AREAS.map(areaTile).join('')}</div>
    ${rest.length ? `<h2 class="sec"><span>다른 계획</span></h2><ul class="plist">${rest.map(planRow).join('')}</ul>` : ''}
    <button class="xfer-btn" data-act="xferSheet">${ic('share')}<span><b>${IS_APP ? L('계획 공유하기', '計画を共有') : '계획 옮기기'}</b><small>${IS_APP ? L('친구에게 보내기 · 내 다른 폰으로 옮기기', '友だちに送る · 別のスマホに移す') : '앱 버전이나 다른 기기로 보내기 · 가져오기'}</small></span>${ic('next', 'chev')}</button>
    <p class="store-note" id="storeNote">${storeNote()}</p>
    ${S.photoBroken ? '' : `<p class="credit">${L('상단 사진', 'トップの写真')} <a href="${heroPhoto(heroScene()).url}" target="_blank" rel="noopener">${heroPhoto(heroScene()).by}</a> · Unsplash</p>`}
  </main></div>`;
}

// ---- 홈에서 여는 시트 ----
function shHead(t, p) {
  return `<div class="sh-h"><div><h2>${t}</h2>${p ? `<p>${p}</p>` : ''}</div><button class="ib sm" data-act="closeSheet" aria-label="닫기">${ic('close')}</button></div>`;
}

// 시트: 공항 → 시내
function airSheetV(sh) {
  const A = PLACES.airport,
    B = { ...PLACES.hotel[sh.h], n: `${HOTEL_LABEL[sh.h]} 숙소` };
  const opts = legOptions(A, B),
    sel = sh.o || (opts.find(o => o.mode === 'subway') || opts[0]).id;
  return (
    shHead('공항에서 시내로', '국제선 터미널에 내린 기준이에요. 숙소 동네를 골라 주세요.') +
    `<div class="chips-sel">${Object.entries(HOTEL_LABEL)
      .map(
        ([k, v]) =>
          `<button class="${sh.h === k ? 'on' : ''}" data-act="airHotel" data-v="${k}" aria-pressed="${sh.h === k}">${v}</button>`
      )
      .join('')}</div>
    <p class="note">${ic('plane')}<span>국제선 터미널에는 지하철역이 없어요. 무료 셔틀버스로 국내선 터미널(지하철역)까지 가거나, 터미널 앞에서 바로 버스·택시를 타요.</span></p>
    <div class="aopts">${opts
      .map(o => {
        const on = o.id === sel,
          ft = fareTxt(o.fare) || '무료';
        const steps = on
          ? guideFor(o, A, B).map(s =>
              s.taxi ? { ...s, d: '터미널 앞 택시 승강장에서 타요. 호텔 이름과 주소(일본어)를 보여 주면 돼요.' } : s
            )
          : [];
        return `<div class="aopt${on ? ' on' : ''}"><button class="opt${on ? ' on' : ''}" data-act="airOpt" data-o="${o.id}" aria-expanded="${on}">
          ${modeIc(o.mode)}<span class="ob"><span class="o1"><b>${MODE[o.mode].n}</b>${o.mode === 'subway' ? '<span class="tag cheap">가장 쌈</span>' : o.mode === 'taxi' ? '<span class="tag fast">가장 빠름</span>' : ''}</span>
          <span class="o2"><b>${o.min}분</b><em>${ft}</em></span><span class="ol">${esc(o.label)}</span></span>${ic(on ? 'up' : 'down', 'chev')}</button>
        ${on ? `<ol class="gsteps">${steps.map(stepHTML).join('')}</ol>` : ''}</div>`;
      })
      .join('')}</div>
    <a class="btn soft wide" href="${mapsUrl(A, B, 'subway')}" target="_blank" rel="noopener">${ic('map')}구글 지도로 실시간 확인</a>
    <p class="fine">직행버스는 밤 9시쯤 끊겨요. 늦게 내리면 셔틀버스+지하철이나 택시를 타요. 국내선으로 도착했다면 터미널에서 바로 지하철 「福岡空港」역으로 내려가면 돼요. 시간은 대략적인 값이에요.</p>`
  );
}

const PASSES = [
  {
    t: '신용카드 터치로 지하철',
    p: () => `하루 최대 ${yen(FARE.subwayCap)}`,
    ok: '지하철을 하루 3번 넘게 타면 저절로 이득',
    d: 'Visa·Mastercard·JCB 등 컨택리스 카드를 개찰구에 대기만 하면 돼요. 표를 따로 살 필요가 없어요.',
    ic: 'card'
  },
  {
    t: '지하철 1일권',
    p: () => yen(FARE.subwayCap),
    ok: '터치 결제 카드가 없을 때',
    d: '역 발매기에서 사요. 카드 터치 상한과 값이 같아요.',
    ic: 'subway'
  },
  {
    t: '투어리스트 시티패스',
    p: () => `${yen(FARE.cityPass)} · 다자이후 포함 ${yen(FARE.cityPassDz)}`,
    ok: '다자이후를 오가거나 지하철·버스를 많이 타는 날',
    d: '지하철·니시테츠 버스·니시테츠 전철·시영 도선이 하루 무제한. 외국인 여행자 전용이라 여권이 필요해요.',
    ic: 'wallet'
  },
  {
    t: '니시테츠 버스 1일권',
    p: () => `약 ${yen(FARE.busDay)}`,
    ok: '버스만 여러 번 타는 날',
    d: '시내버스 하루 무제한이에요.',
    ic: 'bus'
  },
  {
    t: '다자이후·야나가와 관광 티켓',
    p: () => yen(FARE.dzYanagawa),
    ok: '하루에 다자이후와 야나가와를 한 방향으로 돌 때',
    d: '니시테츠 전철과 야나가와 뱃놀이가 들어 있어요. 텐진 → 다자이후 → 야나가와 → 텐진 순서로만 쓸 수 있어요.',
    ic: 'train'
  },
  {
    t: 'JR 큐슈 레일패스 북큐슈 3일',
    p: () => yen(FARE.jrNorth3),
    ok: '유후인·벳푸·모지코 같은 먼 곳을 3일 안에 2곳 넘게',
    d: '외국인 여행자 전용. 특급·규슈 신칸센 포함, 하카타~고쿠라 신칸센은 빠져요.',
    ic: 'train'
  },
  {
    t: 'SUNQ 패스 북큐슈 3일',
    p: () => yen(FARE.sunq3),
    ok: '고속버스로 유후인·벳푸를 다녀올 때',
    d: '북큐슈 고속버스·시내버스 3일 무제한. 고속버스는 좌석 예약이 필요해요.',
    ic: 'bus'
  }
];
// 시트: 교통 패스
function passSheetV() {
  const f = sortedPlans()[0];
  return (
    shHead('교통 패스 한눈에', '어른 1명 기준 · 가격은 바뀔 수 있어요') +
    `<ul class="passl">${PASSES.map(x => `<li><span class="ps-ic">${ic(x.ic)}</span><span class="rb"><span class="ps-t"><b>${x.t}</b><em>${x.p()}</em></span><span class="ps-ok">${ic('check')}${x.ok}</span><small>${x.d}</small></span></li>`).join('')}</ul>
    <div class="sh-foot col">${f ? `<button class="btn pri" data-act="openPlan" data-id="${f.id}" data-tab="fare">${ic('wallet')}'${esc(f.title)}' 일정으로 계산해 보기</button>` : `<button class="btn pri" data-act="newPlan">${ic('plus')}계획 세우고 내 일정으로 계산하기</button>`}</div>`
  );
}

// 시트: 지하철·버스 타는 법
function howSheetV() {
  return (
    shHead('처음 타는 법', '후쿠오카 지하철·버스·택시, 이것만 알면 돼요') +
    `<div class="card tips open">${howtoDL()}</div>
    <p class="fine">계획을 저장하면 구간마다 타는 역·방면·내리는 역을 일본어와 함께 알려 드려요.</p>`
  );
}

const PHRASES = [
  ['이거 주세요', 'これください', '코레 쿠다사이'],
  ['계산해 주세요', 'お会計お願いします', '오카이케- 오네가이시마스'],
  ['카드 돼요?', 'カードは使えますか？', '카-도와 츠카에마스카?'],
  ['두 명이에요', '二人です', '후타리 데스'],
  ['추천 메뉴는 뭐예요?', 'おすすめは何ですか？', '오스스메와 난데스카?'],
  ['화장실은 어디예요?', 'トイレはどこですか？', '토이레와 도코 데스카?'],
  ['이 열차, ○○역에 서요?', 'この電車は〇〇駅に止まりますか？', '코노 덴샤와 ○○에키니 토마리마스카?'],
  ['여기로 가 주세요', 'ここまでお願いします', '코코마데 오네가이시마스'],
  ['영수증 주세요', 'レシートください', '레시-토 쿠다사이'],
  ['괜찮아요 (사양할 때)', '大丈夫です', '다이죠-부 데스']
];
// 일본어 보여주기 카드: 「그대로 보기」(지금처럼 들고 보여주기) / 「마주 보기」(위쪽 일본어만 180° 돌려 맞은편 사람이 읽고, 아래 한국어는 내가 읽기)
function faceToggleV() {
  const b = (v, icon, t) =>
    `<button class="${!!S.face === v ? 'on' : ''}" data-act="faceMode" data-v="${v ? 1 : 0}" aria-pressed="${!!S.face === v}">${ic(icon)}${t}</button>`;
  return `<div class="face-tg" role="group" aria-label="${L('보여주는 방식', '見せ方')}">${b(false, 'phone', L('그대로 보기', 'そのまま'))}${b(true, 'flip', L('마주 보기', '向かい合わせ'))}</div>`;
}
// o.label: 위 작은 한국어 / o.ja: 상대방이 읽을 일본어 / o.sub: 내가 읽을 한국어(뜻·발음)
function jaCardV(o) {
  const cls = o.cls ? ` ${o.cls}` : '';
  if (!S.face) return faceToggleV() + `<div class="ja-card${cls}">${o.label}${o.ja}${o.sub}</div>`;
  return (
    faceToggleV() +
    `<div class="ja-card face${cls}${S.faceAnim ? ' anim' : ''}">
      <div class="face-them">${o.ja}</div>
      <p class="face-cut">${ic('up')}<span>${L('휴대폰 위쪽을 상대방 쪽으로 향해 놓아 주세요', 'スマホの上側を相手に向けて置いてください')}</span></p>
      <div class="face-me">${o.label}${o.sub}</div></div>`
  );
}
// 시트: 여행 일본어
function phraseSheetV(sh) {
  const b = PHRASES[sh.i ?? 0];
  return (
    shHead('여행 일본어', '고르면 크게 보여 줘요. 화면을 그대로 보여 주세요.') +
    jaCardV({
      label: `<small data-notr>${esc(b[0])}</small>`,
      ja: `<div class="ja-big" lang="ja">${esc(b[1])}</div>`,
      sub: `<p class="ja-ko" data-notr>${esc(b[2])}</p>`
    }) +
    `
    <ul class="phl">${PHRASES.map((x, i) => `<li><button class="${i === (sh.i ?? 0) ? 'on' : ''}" data-act="phrase" data-i="${i}" aria-pressed="${i === (sh.i ?? 0)}"><b data-notr>${esc(x[0])}</b><span lang="ja">${esc(x[1])}</span></button></li>`).join('')}</ul>`
  );
}

// 시트: 동네 둘러보기 (사진 + 장소 목록)
function areaSheetV(sh) {
  const a = AREA[sh.id],
    list = SPOTS.filter(s => s.a === a.id).sort((x, y) => (x.p || 3) - (y.p || 3));
  const [c1, c2] = AREA_TONE[a.id] || ['#F0703A', '#B92E1C'],
    ph = areaPh(a.id);
  return (
    shHead(`${a.n}`, `${esc(a.sub)} · ${areaMeta(a)}`) +
    `<div class="ar-band${ph ? ' has-ph' : ''}" style="--c1:${c1};--c2:${c2}">${ph ? areaImg(a.id) : ''}<span lang="ja">${AREA_JA[a.id] || ''}</span><small>${list.length}곳</small></div>
    ${ph ? `<p class="ph-cr">${L('사진', '写真')} <a href="https://unsplash.com/photos/${AREA_PHOTOS[a.id][1]}" target="_blank" rel="noopener">${AREA_PHOTOS[a.id][0]}</a> · Unsplash</p>` : ''}
    <ul class="spl">${list.map(s => `<li><button class="spl-b" data-act="spotSheet" data-id="${s.id}">${catTile(s.c)}<span class="al-t"><b>${esc(s.n)}</b><small>${CATS[s.c].n} · ${dur(s.s)}${s.j ? ` · <span lang="ja">${esc(s.j)}</span>` : ''}</small><span class="sp-d">${esc(s.d)}</span></span>${ic('next', 'chev')}</button></li>`).join('')}</ul>
    <div class="sh-foot"><button class="btn soft" data-act="closeSheet">닫기</button><button class="btn pri" data-act="planArea" data-id="${a.id}">이 동네 넣어서 계획 세우기</button></div>`
  );
}

const SHEETS = { air: airSheetV, pass: passSheetV, how: howSheetV, phrase: phraseSheetV, area: areaSheetV };
const SHEET_LABEL = {
  air: '공항에서 시내로',
  pass: '교통 패스',
  how: '처음 타는 법',
  phrase: '여행 일본어',
  area: '동네 둘러보기',
  leg: '이동 방법',
  add: '장소 추가',
  dayTime: '시간 바꾸기',
  rename: '여행 이름',
  ja: '일본어로 보여주기'
};

// 상단 사진을 못 불러오면 다음 사진으로
function wireHero() {
  const hi = document.querySelector('.hero-img');
  if (!hi) return;
  const stock = hi.classList.contains('stock');
  hi.addEventListener(
    'error',
    () => {
      if (stock) {
        // 못 불러온 사진은 건너뛰고 다음 사진으로, 다 안 되면 그림으로
        const sc = heroScene();
        S.heroTries = (S.heroTries || 0) + 1;
        if (S.heroTries < HERO_PHOTOS[sc].length) HERO_PICK[sc] = (HERO_PICK[sc] + 1) % HERO_PHOTOS[sc].length;
        else S.photoBroken = true;
      }
      render();
    },
    { once: true }
  );
  if (stock && !wireHero.pre) {
    wireHero.pre = true;
    Object.keys(HERO_PHOTOS).forEach(sc => {
      const im = new Image();
      im.src = heroPhoto(sc).src;
    });
  }
}

Object.assign(A, {
  airSheet() {
    const f = sortedPlans()[0];
    S.sheet = { type: 'air', h: f ? hotelKeyOf(nightHotel(f, 0)) : 'hakata', o: null };
    render();
  },
  airHotel(d) {
    S.sheet.h = d.v;
    S.sheet.o = null;
    S.keepSheetScroll = true;
    render();
  },
  airOpt(d) {
    S.sheet.o = d.o;
    S.keepSheetScroll = true;
    render();
  },
  passSheet() {
    S.sheet = { type: 'pass' };
    render();
  },
  howSheet() {
    S.sheet = { type: 'how' };
    render();
  },
  phraseSheet() {
    S.sheet = { type: 'phrase', i: 0 };
    render();
  },
  faceMode(d) {
    S.face = d.v === '1';
    lsSet('fk-face', S.face);
    S.faceAnim = S.face;
    S.keepSheetScroll = true;
    render();
    S.faceAnim = false;
  },
  phrase(d) {
    S.sheet.i = Number(d.i);
    render();
    const s = document.querySelector('.sheet');
    if (s) s.scrollTo({ top: 0, behavior: 'smooth' });
  },
  areaSheet(d) {
    S.sheet = { type: 'area', id: d.id };
    render();
  },
  planArea(d) {
    S.draft = defaultDraft();
    S.draft.areas = [d.id];
    S.mv = null;
    go('dates');
    toast(`${AREA[d.id].n}을(를) 넣어 뒀어요. 날짜를 골라 주세요.`);
  }
});

// ---- 계획 옮기기·공유 (웹 ↔ 앱 ↔ 다른 기기 ↔ 친구) ----
function planCode(plans) {
  const json = JSON.stringify({ v: 1, app: 'fukuoka-planner', at: Date.now(), plans });
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return 'FKP1:' + btoa(bin);
}
// 링크용: 압축(deflate) + URL에 안전한 base64 → 「FKZ1.…」. 압축을 못 하는 브라우저면 FKP1 그대로
const b64u = {
  enc(u8) {
    let bin = '';
    for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  dec(t) {
    t = t.replace(/-/g, '+').replace(/_/g, '/');
    while (t.length % 4) t += '=';
    const bin = atob(t);
    return Uint8Array.from(bin, c => c.charCodeAt(0));
  }
};
// 계획 → 링크용 압축 코드 (FKZ1.…)
async function shareCode(plans) {
  if (typeof CompressionStream === 'undefined') return planCode(plans);
  try {
    const json = JSON.stringify({ v: 1, app: 'fukuoka-planner', at: Date.now(), plans });
    const buf = await new Response(
      new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'))
    ).arrayBuffer();
    return 'FKZ1.' + b64u.enc(new Uint8Array(buf));
  } catch (e) {
    return planCode(plans);
  }
}
// 공유 링크 만들기
function shareUrl(code) {
  return location.href.split('#')[0] + '#share=' + encodeURIComponent(code);
}
// 코드 → 계획 (잘못된 계획은 걸러요)
function readCode(txt) {
  txt = String(txt || '').trim();
  if (!txt) throw new Error('empty');
  let json = txt;
  const k = txt.indexOf('FKP1:');
  if (k >= 0) {
    const bin = atob(txt.slice(k + 5).replace(/[^A-Za-z0-9+/=]/g, ''));
    json = new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
  }
  const o = JSON.parse(json),
    arr = Array.isArray(o) ? o : o && o.plans;
  if (!Array.isArray(arr)) throw new Error('shape');
  const ok = arr.filter(
    p =>
      p &&
      typeof p.id === 'string' &&
      /^plan-[\w-]+$/.test(p.id) &&
      typeof p.title === 'string' &&
      p.set &&
      typeof p.set.start === 'string' &&
      Array.isArray(p.days) &&
      p.days.length &&
      p.days.every(d => d && Array.isArray(d.items))
  );
  if (!ok.length) throw new Error('none');
  return ok.map(prunePlan);
}
// 코드·링크 어느 쪽이든 읽기 (FKZ1 압축 코드 / FKP1 코드 / JSON / 링크 통째로 붙여 넣은 것)
async function readAnyCode(txt) {
  txt = String(txt || '').trim();
  try {
    txt = decodeURIComponent(txt);
  } catch (e) {}
  const m = txt.match(/FKZ1\.([A-Za-z0-9_-]+)/);
  if (m) {
    if (typeof DecompressionStream === 'undefined') throw new Error('nozip');
    const buf = await new Response(
      new Blob([b64u.dec(m[1])]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
    ).arrayBuffer();
    if (buf.byteLength > 4e6) throw new Error('big');
    return readCode(new TextDecoder().decode(buf));
  }
  return readCode(txt);
}
// 받은 계획 넣기 (같은 계획은 더 최근 것으로)
function importPlans(list) {
  const map = new Map(S.plans.map(p => [p.id, p]));
  let add = 0,
    upd = 0;
  list.forEach(p => {
    const o = map.get(p.id);
    if (!o) {
      map.set(p.id, clone(p));
      add++;
    } else if ((p.updated || 0) > (o.updated || 0)) {
      map.set(p.id, clone(p));
      upd++;
    }
  });
  S.plans = [...map.values()];
  store.writeLocal(S.plans);
  list.forEach(p => store.put(map.get(p.id)));
  return { add, upd };
}
// 받은 계획을 내 것과 따로 사본으로 넣기 (새 id)
function importCopies(list) {
  list.forEach((p, i) => {
    const c = clone(p);
    c.id = 'plan-' + Date.now().toString(36) + i + Math.random().toString(36).slice(2, 6);
    c.title = `${p.title} ${L('(받은 계획)', '(届いた計画)')}`;
    c.created = c.updated = Date.now();
    S.plans.push(c);
    store.put(c);
  });
  store.writeLocal(S.plans);
  return { add: list.length, upd: 0 };
}
// 가져온 뒤 홈으로 + 알림
function afterImport(r) {
  S.sheet = null;
  render();
  window.scrollTo(0, 0);
  toast(
    r.add || r.upd
      ? `계획 ${r.add}개를 가져왔어요${r.upd ? ` · ${r.upd}개는 최신으로 바꿨어요` : ''}.`
      : '이미 같은 계획이 있어요.'
  );
}
// 보낼 계획 목록
function xferPicked(sh) {
  return !sh.pick || sh.pick === 'all' ? S.plans : S.plans.filter(p => p.id === sh.pick);
}
// 링크는 미리 만들어 둬요 (공유 버튼을 누른 그 순간에 바로 열려야 해서)
function prepLink(sh) {
  const ps = xferPicked(sh),
    key = sh.pick || 'all';
  sh.code = planCode(ps);
  sh.link = shareUrl(sh.code);
  sh.linkFor = key;
  shareCode(ps).then(c => {
    if (S.sheet === sh && (sh.pick || 'all') === key) sh.link = shareUrl(c);
  });
}
// 글자 복사
async function copyText(txt) {
  try {
    await navigator.clipboard.writeText(txt);
    return true;
  } catch (e) {}
  const t = document.createElement('textarea');
  t.value = txt;
  t.setAttribute('readonly', '');
  t.style.cssText = 'position:fixed;opacity:0;top:0';
  document.body.appendChild(t);
  t.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch (e) {}
  t.remove();
  return ok;
}
// 시트: 계획 공유하기
function xferSheetV(sh) {
  const n = S.plans.length,
    pick = sh.pick || 'all',
    cnt = xferPicked(sh).length;
  const picker =
    n > 1
      ? `<p class="xlabel">${L('보낼 계획', '送る計画')}</p><div class="chips-sel xpick">${[['all', L(`전체 ${n}개`, `すべて(${n}件)`)], ...sortedPlans().map(p => [p.id, `${esc(p.title)} · ${mds(p.set.start)}`])].map(([k, t]) => `<button class="${pick === k ? 'on' : ''}" data-act="xferPick" data-v="${k}" aria-pressed="${pick === k}">${t}</button>`).join('')}</div>`
      : '';
  const codeOut = n
    ? `<label class="xlabel" for="xferOut">계획 ${cnt}개 · 코드</label>
      <textarea id="xferOut" class="code" readonly>${sh.code}</textarea>
      <div class="sh-foot col"><button class="btn soft" data-act="xferCopy">${ic('copy')}코드 복사</button>${IS_APP ? `<button class="btn soft" data-act="xferSave">${ic('save')}파일로 저장</button>` : ''}</div>`
    : '';
  const codeIn = `<label class="xlabel" for="xferIn">${L('받은 코드나 링크 붙여 넣기', '届いたコードかリンクを貼り付け')}</label>
    <textarea id="xferIn" class="code" placeholder="${L('받은 코드나 링크를 여기에 붙여 넣으세요', '届いたコードかリンクをここに貼り付けてください')}" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>
    <div class="sh-foot col"><button class="btn soft" data-act="xferImport">${ic('check')}가져오기</button>
      <label class="btn soft pick">${ic('save')}파일에서 가져오기<input type="file" accept=".txt,.json,text/plain,application/json" data-change="xferFile" class="sr"></label></div>
    <p class="fine">같은 계획이 이미 있으면 더 최근에 고친 쪽으로 맞춰요. 지금 있는 다른 계획은 지워지지 않아요.</p>`;
  if (!IS_APP) {
    // 웹 버전(Claude 링크) 주소는 다른 사람이 못 열어서, 여기서는 코드로만 옮겨요
    const head = shHead(
      '계획 옮기기',
      L(
        '코드를 복사해서 앱의 「가져오기」에 붙여 넣으면 옮겨져요.',
        'コードをコピーして、アプリの「取り込む」に貼り付けると移せます。'
      )
    );
    const out = n
      ? picker + codeOut.replace('class="btn soft" data-act="xferCopy"', 'class="btn pri" data-act="xferCopy"')
      : `<p class="note">${ic('alert')}<span>아직 보낼 계획이 없어요. 먼저 계획을 세워 저장해 주세요.</span></p>`;
    return (
      head +
      out +
      `<details class="xdev"${n ? '' : ' open'}><summary>${ic('plus')}<span>${L('앱에서 보낸 코드 가져오기', 'アプリから届いたコードを取り込む')}</span>${ic('down', 'chev')}</summary>${codeIn}</details>`
    );
  }
  const head = shHead(
    L('계획 공유하기', '計画を共有'),
    L(
      '친구에게 보내거나 내 다른 폰으로 옮길 때, 링크 하나만 보내면 돼요.',
      '友だちに送るときも、自分の別のスマホに移すときも、リンクを送るだけです。'
    )
  );
  const main = n
    ? `<section class="xfriend">
        <div class="sh-foot col">${navigator.share ? `<button class="btn pri" data-act="xferLinkShare">${ic('share')}${L('링크 보내기', 'リンクを送る')}</button>` : ''}<button class="btn ${navigator.share ? 'soft' : 'pri'}" data-act="xferLinkCopy">${ic('copy')}${L('링크 복사', 'リンクをコピー')}</button></div>
        <p>${L('받는 사람이 링크를 누르면 플래너가 열리고, 「내 플래너에 넣기」만 누르면 돼요. 받은 계획은 각자 따로 고칠 수 있어요.', '受け取った人がリンクをタップするとプランナーが開き、「プランナーに入れる」を押すだけです。届いた計画はそれぞれ別に編集できます。')}</p></section>`
    : `<section class="xfriend"><p>${L('이 휴대폰에 저장된 계획이 아직 없어요. 계획을 세워 저장하면 여기서 링크로 보낼 수 있어요.', 'このスマホに保存された計画がまだありません。計画を作って保存すると、ここからリンクで送れます。')}</p>
        <div class="sh-foot col"><button class="btn pri" data-act="newPlan">${ic('plus')}${L('새 여행 계획 세우기', '新しい旅行計画を作る')}</button></div></section>`;
  return (
    head +
    picker +
    main +
    `<details class="xdev"><summary>${ic('save')}<span>${L('고급 · 코드나 파일로 백업·가져오기', '詳細設定 · コードやファイルでバックアップ・取り込み')}</span>${ic('down', 'chev')}</summary>
      <p class="xdev-sub">${L('링크가 잘 안 열릴 때나, 홈 화면에 설치한 앱으로 직접 옮길 때 써요.', 'リンクがうまく開かないときや、ホーム画面のアプリに直接移すときに使います。')}</p>
      ${n ? `<h4 class="xdev-h">${L('보내기', '送る')}</h4>${codeOut}` : ''}<h4 class="xdev-h">${L('가져오기', '取り込む')}</h4>${codeIn}</details>`
  );
}
SHEETS.xfer = xferSheetV;
SHEET_LABEL.xfer = IS_APP ? '계획 공유하기' : '계획 옮기기';

// ---- 친구가 보낸 링크(#share=…)로 열었을 때 ----
function recvSheetV(sh) {
  const mine = new Map(S.plans.map(p => [p.id, p])),
    dup = sh.plans.filter(p => mine.has(p.id));
  const standalone =
    (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const rows = sh.plans
    .map(p => {
      const o = mine.get(p.id),
        visits = p.days.reduce((t, d) => t + d.items.filter(i => i.sid).length, 0);
      const areas = (p.areas || [])
        .filter(a => AREA[a])
        .map(a => AREA[a].n)
        .slice(0, 4)
        .join(' · ');
      const pu = p.updated || 0,
        ou = o ? o.updated || 0 : 0;
      const st = !o
        ? ''
        : pu > ou
          ? L('이미 있는 계획 · 받은 쪽이 더 최근에 고쳤어요', 'すでにある計画 · 届いた方が新しい')
          : pu === ou
            ? L('이미 똑같은 계획이 있어요', 'まったく同じ計画がすでにあります')
            : L('이미 있는 계획 · 내 쪽이 더 최근이에요', 'すでにある計画 · 自分の方が新しい');
      return `<li class="rcard"><span class="rc-ic">${ic('map')}</span><span class="rc-t"><b>${esc(p.title)}</b><small>${mds(p.set.start)} – ${mds(p.set.end)} · ${L(`${p.days.length}일 · 방문 ${visits}곳`, `${p.days.length}日 · 訪問${visits}か所`)}</small>${areas ? `<small>${esc(areas)}</small>` : ''}${st ? `<em>${st}</em>` : ''}</span></li>`;
    })
    .join('');
  return (
    shHead(
      L('받은 여행 계획', '届いた旅行プラン'),
      L(
        '친구가 보낸 계획이에요. 내 플래너에 넣어서 같이 볼 수 있어요.',
        '友だちから届いた計画です。自分のプランナーに入れて一緒に見られます。'
      )
    ) +
    `<ul class="rlist">${rows}</ul>
    <div class="sh-foot col"><button class="btn pri" data-act="recvAdd">${ic('check')}${dup.length ? L('내 플래너에 맞춰 넣기', 'プランナーに反映する') : L('내 플래너에 넣기', 'プランナーに入れる')}</button>
      ${dup.length ? `<button class="btn soft" data-act="recvCopy">${ic('plus')}${L('사본으로 따로 넣기', 'コピーとして別に入れる')}</button>` : ''}</div>
    ${dup.length ? `<p class="fine">${L('맞춰 넣기: 같은 계획은 더 최근에 고친 쪽으로 바뀌어요. 사본: 내 계획은 그대로 두고 받은 계획을 하나 더 만들어요.', '反映: 同じ計画は新しく編集した方に合わせます。コピー: 自分の計画はそのままで、届いた計画をもう一つ作ります。')}</p>` : ''}
    ${
      IS_APP && !standalone
        ? `<p class="note">${ic('info')}<span>${L('홈 화면에 설치한 앱에 넣으려면 아래 <b>코드 복사</b>를 누르고, 앱에서 <b>계획 공유하기 → 고급 → 가져오기</b>에 붙여 넣으세요.', 'ホーム画面のアプリに入れるには、下の<b>コードをコピー</b>を押して、アプリの<b>計画を共有 → 詳細設定 → 取り込む</b>に貼り付けてください。')}</span></p>
      <button class="btn soft wide" data-act="recvCode">${ic('copy')}${L('코드 복사', 'コードをコピー')}</button>`
        : ''
    }`
  );
}
SHEETS.recv = recvSheetV;
SHEET_LABEL.recv = L('받은 여행 계획', '届いた旅行プラン');
// 주소에 #share= 가 있으면 받은 계획 시트 열기
async function checkShareLink() {
  const m = location.hash.match(/^#share=(.+)$/);
  if (!m) return;
  try {
    history.replaceState(null, '', location.href.split('#')[0]);
  } catch (e) {}
  try {
    const plans = await readAnyCode(m[1]);
    S.sheet = { type: 'recv', plans, code: planCode(plans) };
    render();
  } catch (e) {
    toast(
      L(
        '받은 링크에서 계획을 읽지 못했어요. 링크가 중간에 잘리지 않았는지 확인해 주세요.',
        'リンクから計画を読み込めませんでした。リンクが途中で切れていないか確認してください。'
      )
    );
  }
}
window.addEventListener('hashchange', checkShareLink);
setTimeout(checkShareLink, 0);

// 파일에서 계획 가져오기
function xferFromFile(file) {
  if (!file) return;
  const fr = new FileReader();
  fr.onload = () => {
    readAnyCode(fr.result)
      .then(l => afterImport(importPlans(l)))
      .catch(() => toast('이 파일에서 계획을 찾지 못했어요.'));
  };
  fr.onerror = () => toast('파일을 열 수 없어요.');
  fr.readAsText(file);
}
Object.assign(A, {
  xferSheet() {
    S.sheet = { type: 'xfer', m: 'out', pick: 'all' };
    prepLink(S.sheet);
    render();
  },
  xferPick(d) {
    S.sheet.pick = d.v;
    prepLink(S.sheet);
    S.keepSheetScroll = true;
    render();
  },
  async xferCopy() {
    const t = document.getElementById('xferOut');
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t.value);
      toast('코드를 복사했어요. 다른 쪽 "가져오기"에 붙여 넣으세요.');
    } catch (e) {
      t.focus();
      t.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (e2) {}
      toast(ok ? '코드를 복사했어요.' : '코드가 선택됐어요. 길게 눌러 복사해 주세요.');
    }
  },
  xferLinkShare() {
    const ps = xferPicked(S.sheet),
      t = ps.length === 1 ? ps[0].title : L(`계획 ${ps.length}개`, `計画${ps.length}件`);
    navigator
      .share({
        title: L('후쿠오카 여행 계획', '福岡旅行プラン'),
        text: L(
          `「${t}」 여행 계획을 보냈어요. 링크를 누르면 플래너에 넣을 수 있어요.`,
          `「${t}」の旅行プランを送りました。リンクをタップするとプランナーに入れられます。`
        ),
        url: S.sheet.link
      })
      .catch(() => {});
  },
  async xferLinkCopy() {
    const ok = await copyText(S.sheet.link);
    toast(
      ok
        ? L(
            '링크를 복사했어요. 카톡에 붙여 넣어 친구에게 보내 주세요.',
            'リンクをコピーしました。メッセージに貼り付けて送ってください。'
          )
        : L('복사하지 못했어요. 「링크 보내기」를 써 주세요.', 'コピーできませんでした。')
    );
  },
  xferSave() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([S.sheet.code], { type: 'text/plain' }));
    a.download = `fukuoka-plans-${today()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  },
  async xferImport() {
    const t = document.getElementById('xferIn'),
      v = t && t.value;
    try {
      afterImport(importPlans(await readAnyCode(v)));
    } catch (e) {
      toast(
        v && v.trim()
          ? '코드를 읽을 수 없어요. 처음부터 끝까지 다 복사했는지 확인해 주세요.'
          : '먼저 코드를 붙여 넣어 주세요.'
      );
    }
  },
  recvAdd() {
    afterImport(importPlans(S.sheet.plans));
  },
  recvCopy() {
    afterImport(importCopies(S.sheet.plans));
  },
  async recvCode() {
    const ok = await copyText(S.sheet.code);
    toast(
      ok
        ? L(
            '코드를 복사했어요. 앱의 「가져오기」에 붙여 넣으세요.',
            'コードをコピーしました。アプリの「取り込む」に貼り付けてください。'
          )
        : L('복사하지 못했어요.', 'コピーできませんでした。')
    );
  }
});
if (IS_APP && navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

Object.assign(A, {
  toggleLang() {
    LANG = LANG === 'ja' ? 'ko' : 'ja';
    lsSet('fk-lang', LANG);
    applyLang();
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
  }
});

// ---- 장소 상세 ----
function L(ko, ja) {
  return LANG === 'ja' ? ja : ko;
}
const AREA_CITY = {
  dazaifu: '太宰府',
  itoshima: '糸島',
  noko: '能古島',
  yanagawa: '柳川',
  yufuin: '由布院',
  beppu: '別府',
  mojiko: '北九州'
};
// 역이 있는 노선
function stationLine(id) {
  return Object.keys(LINES).find(k => LINES[k].st.includes(id));
}
// 장소에서 가장 가까운 역
function nearStation(s) {
  let best = null;
  for (const [id, st] of Object.entries(STATIONS)) {
    const d = km(s, st);
    if (!best || d < best.d) best = { id, st, d };
  }
  return best && best.d <= 1.6 ? best : null;
}
// 구글 지도 링크
function spotMapsUrl(s) {
  const q = s.g ? `${s.lat},${s.lng}` : `${s.j} ${AREA_CITY[s.a] || '福岡'}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
// 장소 정보 표 (입장료·가격대 등)
function spotFacts(s, info) {
  const f = [];
  f.push([ic('clock'), L('추천 머무는 시간', 'おすすめ滞在'), dur(s.s)]);
  if (s.to || s.from)
    f.push([
      ic('clock'),
      L('여는 시간 (대략)', '営業時間（目安）'),
      s.from && s.to
        ? `${s.from}–${s.to}`
        : s.to
          ? L(`${s.to}쯤 닫아요`, `${s.to}ごろまで`)
          : L(`${s.from}부터`, `${s.from}から`)
    ]);
  if (s.cl && s.cl.length)
    f.push([ic('alert'), L('쉬는 날', '定休日'), s.cl.map(d => L(`${WD_KO[d]}요일`, `${WD_JA[d]}曜日`)).join(', ')]);
  if (s.se && s.se.length)
    f.push([
      ic('spark'),
      L('운영 시기', '営業時期'),
      L(`${s.se[0]}~${s.se[s.se.length - 1]}월`, `${s.se[0]}〜${s.se[s.se.length - 1]}月`)
    ]);
  if (s.b)
    f.push([
      ic('sc_day'),
      L('가기 좋은 때', 'おすすめの時間帯'),
      { m: L('아침', '朝'), e: L('해 질 녘', '夕暮れ'), n: L('밤', '夜') }[s.b]
    ]);
  if (info.fee)
    f.push([
      ic('card'),
      L('입장', '入場'),
      { free: L('무료', '無料'), paid: L('유료', '有料'), part: L('일부 유료', '一部有料') }[info.fee]
    ]);
  if (info.pr)
    f.push([
      ic('wallet'),
      L('가격대', '価格帯'),
      ['', L('¥ 부담 없음', '¥ 手ごろ'), L('¥¥ 보통', '¥¥ ふつう'), L('¥¥¥ 조금 비싸요', '¥¥¥ やや高め')][info.pr]
    ]);
  return f;
}
// 시트: 장소 정보 + 숙소에서 가는 법
function spotSheetV(sh) {
  const s = SPOT[sh.id],
    info = SPOT_INFO[s.id] || {},
    a = AREA[s.a],
    [c1, c2] = AREA_TONE[s.a] || ['#F0703A', '#B92E1C'];
  const desc = LANG === 'ja' ? info.ja || '' : info.ko || s.d,
    tip = LANG === 'ja' ? info.tj : info.tk;
  const ns = nearStation(s),
    nl = ns && stationLine(ns.id);
  const H = { ...PLACES.hotel[sh.h], n: `${HOTEL_LABEL[sh.h]} 숙소` },
    B = { ...s, n: s.n };
  const opts = legOptions(H, B),
    sel = sh.o || (pickDefault(opts) || opts[0] || {}).id;
  const near = SPOTS.filter(x => x.id !== s.id && x.z === s.z && !x.g)
    .map(x => ({ x, d: km(s, x) }))
    .filter(o => o.d <= 1.2)
    .sort((p, q) => p.d - q.d)
    .slice(0, 4);
  const p = S.view === 'plan' && S.plan,
    inDay = p ? p.days.findIndex(d => d.items.some(i => i.sid === s.id)) : -1;
  const back = sh.back
    ? `<button class="btn soft" data-act="spotBack">${ic('back')}${sh.back.type === 'area' ? L(`${a.n} 목록`, '一覧に戻る') : L('목록으로', '一覧に戻る')}</button>`
    : `<button class="btn soft" data-act="closeSheet">${L('닫기', '閉じる')}</button>`;
  const main = p
    ? inDay >= 0
      ? `<span class="btn soft in-day">${ic('check')}${L(`${inDay + 1}일차 일정에 있어요`, `${inDay + 1}日目の予定に入っています`)}</span>`
      : `<button class="btn pri" data-act="spotAdd" data-id="${s.id}">${ic('plus')}${L(`${S.di + 1}일차에 넣기`, `${S.di + 1}日目に入れる`)}</button>`
    : `<button class="btn pri" data-act="planArea" data-id="${s.a}">${L('이 동네로 계획 세우기', 'プランを作る')}</button>`;
  return `<div class="sp-hero" style="--c1:${c1};--c2:${c2}">
      <span class="sp-cat">${ic(s.c)}${LANG === 'ja' ? NAME_JA_CAT[s.c] : CATS[s.c].n}</span>
      <span class="sp-ja" lang="ja">${esc(s.j)}</span>
      <button class="ib sm sp-x" data-act="closeSheet" aria-label="${L('닫기', '閉じる')}">${ic('close')}</button>
    </div>
    <div class="sp-h"><h2>${esc(LANG === 'ja' ? s.j : s.n)}</h2><p>${LANG === 'ja' ? AREA_JA[s.a] || a.n : a.n}${s.g ? L(' · 여러 가게 중 골라서', ' · 何軒かから選べます') : ''}</p></div>
    <p class="sp-d">${esc(desc)}</p>
    ${tip ? `<p class="sp-tip">${ic('spark')}<span><b>${L('팁', 'ヒント')}</b> ${esc(tip)}</span></p>` : ''}
    <dl class="sp-facts">${spotFacts(s, info)
      .map(([i, k, v]) => `<div>${i}<dt>${k}</dt><dd>${esc(v)}</dd></div>`)
      .join('')}</dl>
    ${ns ? `<div class="sp-st">${modeIc('subway')}<span><small>${L('가까운 역', '最寄り駅')}</small><b>${nl ? `<span class="sc-code" style="--m:${LINES[nl].color}">${stCode(nl, ns.id)}</span>` : ''}<span lang="ja">${esc(ns.st.j)}</span>${LANG === 'ja' ? '' : ` ${esc(ns.st.n)}`}</b><em>${L(`걸어서 약 ${wmin(ns.d)}분`, `徒歩約${wmin(ns.d)}分`)}</em></span></div>` : ''}
    <a class="btn soft wide gm" href="${spotMapsUrl(s)}" target="_blank" rel="noopener">${ic('map')}${L('구글 지도에서 영업시간·사진·리뷰 보기', 'Googleマップで営業時間・写真・口コミを見る')}</a>
    <div class="ja-card sp-taxi"><small>${L('택시 기사님께 이 화면을 보여 주세요', 'タクシーではこの画面を見せてください')}</small><div class="ja-big" lang="ja">${esc(s.j)}<br>までお願いします</div></div>
    <h3 class="sec"><span>${L('숙소에서 가는 법', '宿からの行き方')}</span></h3>
    <div class="chips-sel">${Object.entries(HOTEL_LABEL)
      .map(
        ([k, v]) =>
          `<button class="${sh.h === k ? 'on' : ''}" data-act="spotHotel" data-v="${k}" aria-pressed="${sh.h === k}">${v}</button>`
      )
      .join('')}</div>
    <div class="aopts">${opts
      .map(o => {
        const on = o.id === sel,
          ft = fareTxt(o.fare) || (o.mode === 'walk' ? '' : L('무료', '無料'));
        const steps = on
          ? guideFor(o, H, B).map(x =>
              x.taxi
                ? {
                    ...x,
                    d: L(
                      '택시 승강장이나 길에서 손을 들어 세워요. 위의 일본어 화면을 보여 주면 돼요.',
                      'タクシー乗り場や道で手を挙げて止めます。上の日本語の画面を見せればOKです。'
                    )
                  }
                : x
            )
          : [];
        return `<div class="aopt${on ? ' on' : ''}"><button class="opt${on ? ' on' : ''}" data-act="spotOpt" data-o="${o.id}" aria-expanded="${on}">
          ${modeIc(o.mode)}<span class="ob"><span class="o1"><b>${MODE[o.mode].n}</b></span><span class="o2"><b>${dur(o.min)}</b>${ft ? `<em>${ft}</em>` : ''}</span><span class="ol">${esc(o.label)}</span></span>${ic(on ? 'up' : 'down', 'chev')}</button>
        ${on ? `<ol class="gsteps">${steps.map(stepHTML).join('')}</ol>` : ''}</div>`;
      })
      .join('')}</div>
    ${near.length ? `<h3 class="sec"><span>${L('근처에 같이 가 볼 곳', '近くの立ち寄り先')}</span></h3><div class="sp-near">${near.map(({ x, d }) => `<button data-act="spotSheet" data-id="${x.id}" data-keep="1">${catTile(x.c)}<span><b>${esc(LANG === 'ja' ? x.j : x.n)}</b><small>${dist(d)}</small></span></button>`).join('')}</div>` : ''}
    <p class="fine">${L('영업시간과 가격은 바뀔 수 있어요. 가기 전에 구글 지도에서 한 번 확인하세요. 이동 시간은 대략적인 값이에요.', '営業時間や料金は変わることがあります。行く前にGoogleマップで確認してください。移動時間はおおよその値です。')}</p>
    <div class="sh-foot">${back}${main}</div>`;
}
const NAME_JA_CAT = {
  sight: '観光',
  food: 'グルメ',
  cafe: 'カフェ',
  shop: 'ショッピング',
  nature: '自然・公園',
  onsen: '温泉'
};
SHEETS.spot = spotSheetV;
SHEET_LABEL.spot = '장소 정보';
Object.assign(A, {
  spotSheet(d) {
    const prev = S.sheet,
      f = sortedPlans()[0];
    const h =
      S.view === 'plan' && S.plan ? hotelKeyOf(dayHotel(S.plan, S.di)) : f ? hotelKeyOf(nightHotel(f, 0)) : 'hakata';
    const back =
      prev && prev.type === 'spot'
        ? prev.back
        : prev && (prev.type === 'area' || prev.type === 'add' || prev.type === 'alt')
          ? prev
          : null;
    S.sheet = { type: 'spot', id: d.id, h: prev && prev.type === 'spot' ? prev.h : h, o: null, back };
    render();
    const sh = document.querySelector('.sheet');
    if (sh) sh.scrollTo(0, 0);
  },
  spotHotel(d) {
    S.sheet.h = d.v;
    S.sheet.o = null;
    S.keepSheetScroll = true;
    render();
  },
  spotOpt(d) {
    S.sheet.o = d.o;
    S.keepSheetScroll = true;
    render();
  },
  spotBack() {
    S.sheet = S.sheet.back;
    render();
  },
  spotAdd(d) {
    const p = S.plan;
    if (!p) return;
    pushUndo();
    p.parked = p.parked.filter(x => x.sid !== d.id);
    const pos = insertBest(p, S.di, mkItem(d.id, 'user'));
    dirty();
    if (S.sheet.back && S.sheet.back.type === 'add') {
      S.sheet.back.added = [...(S.sheet.back.added || []), d.id];
    }
    S.keepSheetScroll = true;
    render();
    toast(`${SPOT[d.id].n}을(를) ${pos + 1}번째에 넣었어요.`, true);
  }
});
