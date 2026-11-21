// ======================================================================
// guide.js · 길안내 탭 + 일본어로 보여주기
// 저장한 계획의 이동마다 지하철 몇 번 승강장·어느 방면·몇 정거장, 버스 번호, 구글 지도 링크
// 택시 기사님께 보여주는 일본어 카드(jaSheet)
// 고치는 법: docs/수정가이드.md
// ======================================================================
// ===== 탑승 안내 (저장한 계획에서 보여줌) =====
const TOWARD = {
  kuko: {
    후쿠오카공항: { ja: '福岡空港行', ko: '후쿠오카공항(동쪽) 방면' },
    메이노하마: { ja: '姪浜行 · 筑前前原行 · 唐津行', ko: '메이노하마(서쪽) 방면 · 셋 중 어느 열차든 OK' }
  },
  hako: {
    가이즈카: { ja: '貝塚行', ko: '가이즈카 방면' },
    나카스카와바타: { ja: '中洲川端 方面', ko: '나카스카와바타 방면 (「姪浜」 행 직통 열차도 OK)' }
  },
  nana: { 하카타: { ja: '博多行', ko: '하카타 방면' }, 하시모토: { ja: '橋本行', ko: '하시모토 방면' } }
};
const HUB_HAKATA = { lat: 33.5899, lng: 130.4207 },
  HUB_TENJIN = { lat: 33.5913, lng: 130.399 };
// 역 번호 (K11 등)
function stCode(line, id) {
  const L = LINES[line],
    i = L.st.indexOf(id);
  return i < 0 ? '' : L.p + String(i + L.o).padStart(2, '0');
}
// 역 이름 + 번호
function stLabel(id, line) {
  const s = STATIONS[id];
  return { ko: s.n, ja: s.j, code: line ? stCode(line, id) : '' };
}
// 환승 안내 한 줄
function transferStep(prev, next) {
  const at = prev.st[prev.st.length - 1],
    nx = next.st[0],
    L = LINES[next.line];
  let d;
  if (at === 'tenjin' && nx === 'tenjinminami')
    d = '「天神」역에서 지하상가를 따라 「天神南」역까지 걸어서 약 5~8분. 안내판의 「七隈線」(초록)을 따라가요.';
  else if (at === 'tenjinminami' && nx === 'tenjin')
    d = '「天神南」역에서 지하상가를 따라 「天神」역까지 걸어서 약 5~8분. 안내판의 「空港線」(주황)을 따라가요.';
  else if (at === 'hakata') d = `博多역 안에서 「${L.j}」 안내판을 따라 승강장으로 이동해요 (약 5분).`;
  else d = `같은 역 안에서 「${L.j}」 승강장으로 옮겨 타요.`;
  return { k: 'transfer', t: `${STATIONS[at].n}에서 ${L.n}으로 갈아타기`, ja: `${L.j} のりかえ`, d };
}
// 지하철 탈 때 단계별 안내
function subwaySteps(r, B) {
  const st = [];
  if (r.airFrom)
    st.push({
      k: 'shuttle',
      t: '국제선 → 국내선 무료 셔틀버스',
      ja: '国内線ターミナル行 無料連絡バス',
      d: '국제선 터미널 1층 버스 승강장에서 타요 (약 10분). 국내선 터미널에 지하철 「福岡空港」역이 바로 이어져요.'
    });
  else if (r.wa)
    st.push({
      k: 'walk',
      t: `${STATIONS[r.from].n}역까지 걷기`,
      ja: `${STATIONS[r.from].j}駅`,
      d: `도보 약 ${r.wa}분`
    });
  r.rides.forEach((rd, i) => {
    if (i > 0) st.push(transferStep(r.rides[i - 1], rd));
    const L = LINES[rd.line],
      tw = TOWARD[rd.line][rd.toward] || { ja: rd.toward, ko: rd.toward + ' 방면' };
    let min = 0;
    for (let j = 1; j < rd.st.length; j++) min += 0.8 + km(STATIONS[rd.st[j - 1]], STATIONS[rd.st[j]]) * 1.8;
    st.push({
      k: 'subway',
      line: rd.line,
      t: `${L.n} 타기`,
      lj: L.j,
      board: stLabel(rd.st[0], rd.line),
      off: stLabel(rd.st[rd.st.length - 1], rd.line),
      ja: tw.ja,
      towardKo: tw.ko,
      n: rd.stops,
      min: Math.max(2, Math.round(min)),
      stops: rd.st.map(id => stLabel(id, rd.line))
    });
  });
  if (r.airTo)
    st.push({
      k: 'shuttle',
      t: '국내선 → 국제선 무료 셔틀버스',
      ja: '国際線ターミナル行 無料連絡バス',
      d: '「福岡空港」역에서 나와 국내선 터미널 버스 승강장에서 타요 (약 10분).'
    });
  else if (r.wb) st.push({ k: 'walk', t: `${B.n || '목적지'}까지 걷기`, d: `역에서 도보 약 ${r.wb}분` });
  return st;
}
// 버스 탈 때 단계별 안내
function busSteps(o, A, B) {
  const ab = o.airBus;
  if (A.airport) {
    const st = [
      {
        k: 'bus',
        t: '하카타역 직행버스 타기',
        ja: '国際線ターミナル 1階 6・7番のりば · 直行 博多駅',
        d: '국제선 터미널 1층 6·7번 승강장에서 니시테츠 직행버스를 타요. 중간에 서지 않고 하카타역 지쿠시 출구(博多駅 筑紫口)에서 내려요 (약 20분). 막차는 밤 9시쯤이에요.'
      }
    ];
    if (ab && ab.tail) {
      const r = { ...ab.tail, airFrom: false };
      st.push(...subwaySteps(r, B));
    } else
      st.push({
        k: 'walk',
        t: `${B.n || '목적지'}까지 걷기`,
        ja: B.j || '',
        d: `지쿠시 출구에서 도보 약 ${ab ? ab.walk : 5}분`
      });
    return st;
  }
  if (B.airport) {
    const st = [];
    if (ab && ab.tail) st.push(...subwaySteps({ ...ab.tail, airTo: false }, { n: '하카타역 지쿠시 출구' }));
    else
      st.push({
        k: 'walk',
        t: '하카타역 지쿠시 출구까지 걷기',
        ja: '博多駅 筑紫口',
        d: `도보 약 ${ab ? ab.walk : 5}분 · 신칸센 쪽(동쪽) 출구예요.`
      });
    st.push({
      k: 'bus',
      t: '공항 국제선 직행버스 타기',
      ja: '博多駅 筑紫口 → 福岡空港 国際線',
      d: '지쿠시 출구 앞 승강장에서 「福岡空港国際線」 직행버스를 타요 (약 20분). 국내선 터미널엔 서지 않아요.'
    });
    return st;
  }
  const near = p => (km(p, HUB_HAKATA) < 1.2 ? 'hakata' : km(p, HUB_TENJIN) < 1.2 ? 'tenjin' : null);
  const from = near(A),
    sid = B.sid;
  const hint = BUS_HINTS.find(h => h.from === from && sid && h.to.includes(sid));
  if (hint)
    return [
      { k: 'bus', t: '니시테츠 버스 타기', ja: hint.ja, d: hint.d, note: '앞 전광판의 번호와 행선지를 확인하고 타요.' }
    ];
  return [
    {
      k: 'bus',
      t: '니시테츠 버스 타기',
      ja: B.j ? `${B.j} 方面` : '',
      d: '가까운 정류장과 버스 번호는 아래 「구글 지도」 버튼으로 확인하세요. 버스 앞 전광판의 번호·행선지를 보고 타요.'
    }
  ];
}
// 이동 방법 → 단계별 안내
function guideFor(o, A, B) {
  if (!o || o.mode === 'none') return [];
  if (o.gparts)
    return o.gparts.flatMap(gp => {
      if (gp.vkey) {
        const g = GUIDE_ACCESS[gp.vkey];
        return g ? (gp.out ? g.out : g.back || g.out) : [];
      }
      return guideFor(gp.opt, gp.a, gp.b);
    });
  const d = km(A, B);
  if (o.mode === 'walk')
    return [{ k: 'walk', t: `${B.n || '목적지'}까지 걷기`, ja: B.j || '', d: `약 ${dist(d)} · ${o.min}분` }];
  if (o.mode === 'subway' && o.route) return subwaySteps(o.route, B);
  if (o.mode === 'bus') {
    if (A.z === 'city') return busSteps(o, A, B);
    const zb = ZONE_BUS[A.z] || { ja: '', d: '' };
    return [{ k: 'bus', t: o.label, ja: zb.ja, d: `${zb.d} 내릴 곳: ${B.j || B.n}` }];
  }
  if (o.mode === 'train') return [{ k: 'train', t: 'JR 열차', ja: '小倉 ↔ 門司港 · 鹿児島本線', d: '약 13분' }];
  if (o.mode === 'taxi' || o.mode === 'car')
    return [
      {
        k: o.mode,
        t: o.mode === 'car' ? '렌터카 또는 택시' : '택시 타기',
        d: '택시 승강장이나 길가에서 손을 들어 잡아요. 「일본어로 보여주기」 화면을 기사님께 보여 주면 돼요.',
        taxi: true
      }
    ];
  return [{ k: o.mode, t: o.label, d: '' }];
}
// 하루 이동의 지점 목록
function legPoints(p, di) {
  const c = computeDay(p, di),
    day = c.day;
  const startPt = { ...c.startPt },
    endPt = { ...c.endPt };
  const pts = [startPt, ...c.rows.map(r => ({ ...r.p, sid: r.it.sid, name: itemName(p, r.it) })), endPt];
  pts[0].name = day.start.kind === 'airport' ? '공항' : '숙소';
  pts[pts.length - 1].name = day.end.kind === 'airport' ? '공항' : '숙소';
  return { c, pts };
}
// 구글 지도 길찾기 링크
function mapsUrl(A, B, mode) {
  const tm = mode === 'walk' || mode === 'none' ? 'walking' : mode === 'taxi' || mode === 'car' ? 'driving' : 'transit';
  return `https://www.google.com/maps/dir/?api=1&origin=${A.lat.toFixed(5)},${A.lng.toFixed(5)}&destination=${B.lat.toFixed(5)},${B.lng.toFixed(5)}&travelmode=${tm}`;
}
const STEP_IC = {
  walk: 'walk',
  subway: 'subway',
  bus: 'bus',
  train: 'train',
  ferry: 'ferry',
  taxi: 'taxi',
  car: 'car',
  transfer: 'shuffle',
  shuttle: 'bus'
};
// 안내 한 단계 그리기
function stepHTML(s) {
  const color =
    s.k === 'subway'
      ? LINES[s.line].color
      : s.k === 'transfer'
        ? 'var(--ink-3)'
        : s.k === 'shuttle'
          ? MODE.bus.color
          : (MODE[s.k] || MODE.walk).color;
  let body = `<b class="gs-t">${esc(s.t)}</b>`;
  if (s.k === 'subway') {
    body += `<div class="sub-rows">
      <div><small>타는 역</small><span class="sc-code" style="--m:${color}">${s.board.code}</span><b lang="ja">${esc(s.board.ja)}</b><em class="kor">${esc(s.board.ko)}</em></div>
      <div><small>방면</small><b lang="ja">${esc(s.ja)}</b><em class="kor">${esc(s.towardKo)}</em></div>
      <div><small>내리는 역</small><span class="sc-code" style="--m:${color}">${s.off.code}</span><b lang="ja">${esc(s.off.ja)}</b><em class="kor">${esc(s.off.ko)}</em></div></div>
      <details class="stops"><summary>${s.n}정거장 · 약 ${s.min}분 · 정차역 보기${ic('down', 'chev')}</summary><ol>${s.stops.map((x, i) => `<li class="${i === 0 ? 'b' : i === s.stops.length - 1 ? 'e' : ''}"><span class="sc-code sm" style="--m:${color}">${x.code}</span><span lang="ja">${esc(x.ja)}</span><em class="kor">${esc(x.ko)}</em>${i === 0 ? '<i>타기</i>' : i === s.stops.length - 1 ? '<i>내리기</i>' : ''}</li>`).join('')}</ol></details>
      <p class="gs-ok">${ic('check')}후쿠오카 지하철은 급행이 없어 모든 열차가 이 역에 서요.</p>`;
  } else {
    if (s.ja) body += `<span class="ja" lang="ja">${esc(s.ja)}</span>`;
    if (s.d) body += `<p>${esc(s.d)}</p>`;
    if (s.note) body += `<p class="gs-note">${esc(s.note)}</p>`;
  }
  return `<li class="gs k-${s.k}" style="--m:${color}"><span class="gs-ic">${ic(STEP_IC[s.k] || 'pin')}</span><div class="gs-b">${body}</div></li>`;
}
// 타는 법 접는 설명
function howtoDL() {
  return `<dl>
        <dt>${modeIc('subway', 'xs')}지하철</dt><dd>개찰구에 신용카드(Visa·Mastercard·JCB 등)를 대거나 교통카드(Suica 등)를 찍어요. 승강장 위 안내판에서 「○○行(행)」 방면을 확인하고 타요. 역마다 K08 같은 번호가 붙어 있어요.</dd>
        <dt>${modeIc('bus', 'xs')}버스</dt><dd>버스 앞 전광판의 번호·행선지를 확인하고, 가운데(뒷)문으로 타면서 교통카드를 찍거나 번호표(整理券)를 뽑아요. 내릴 정류장 안내가 나오면 벨을 누르고, 앞문에서 요금을 내요. 신용카드 터치가 안 되는 버스가 많아요.</dd>
        <dt>${modeIc('train', 'xs')}전철·JR</dt><dd>특급·급행이라도 이 안내에 적힌 역에는 서요. 표는 역 발매기나 교통카드로.</dd>
        <dt><span class="mi xs" style="--m:#6B5BD0">${ic('card')}</span>교통카드</dt><dd>Suica 같은 일본 교통카드(IC카드)도 지하철·버스·JR에서 그대로 써요. 잔액이 모자라면 역 발매기에서 충전해요.</dd>
        <dt>${modeIc('taxi', 'xs')}택시</dt><dd>문은 기사님이 자동으로 열고 닫아요. 「일본어로 보여주기」 화면을 보여 주면 돼요.</dd>
      </dl>`;
}
// 저장된 계획인지
function savedNow() {
  return S.saved && S.plans.some(x => x.id === S.plan.id);
}
// ★ 화면: 계획의 길안내 탭
function guideTab() {
  const p = S.plan;
  if (!savedNow())
    return `<section class="card g-lock">${ic('save')}<h2>계획을 저장하면 이동 안내가 만들어져요</h2>
    <p>구간마다 어느 역·정류장에서 무엇을 어느 방향으로 타고, 몇 번째 역에서 내리는지 일본어 표기와 함께 알려 드려요.</p>
    <button class="btn pri big" data-act="saveGuide">저장하고 이동 안내 보기</button></section>`;
  const { c, pts } = legPoints(p, S.di);
  const legs = [...c.rows.map(r => r.leg), c.endLeg];
  const times = [c.start, ...c.rows.map(r => r.dep)];
  const cnt = {};
  legs.forEach(l => {
    cnt[l.mode] = (cnt[l.mode] || 0) + 1;
  });
  const sum = Object.entries(cnt)
    .filter(([m]) => m !== 'none')
    .map(([m, n]) => `<span>${modeIc(m, 'xs')}${MODE[m].n} ${n}</span>`)
    .join('');
  const cards = legs
    .map((l, i) => {
      const A = pts[i],
        B = pts[i + 1];
      if (l.mode === 'none') return '';
      const t0 = times[i],
        t1 = t0 + l.min,
        ft = fareTxt(l.fare);
      if (l.mode === 'walk' && l.min <= 12)
        return `<article class="gcard mini" id="g-${i}"><span class="g-t">${fmt(t0)}</span>${modeIc('walk', 'sm')}<span class="g-mini"><b>${esc(B.name)}까지 걸어서 ${l.min}분</b><small>${dist(l.km)}${B.j ? ` · <span lang="ja">${esc(B.j)}</span>` : ''}</small></span><a class="ib sm" href="${mapsUrl(A, B, 'walk')}" target="_blank" rel="noopener" aria-label="구글 지도에서 걷는 길 보기">${ic('map')}</a></article>`;
      const steps = guideFor(l, A, B);
      return `<article class="gcard" id="g-${i}">
      <header class="g-h"><span class="g-t">${fmt(t0)} → ${fmt(t1)}</span><div class="g-r"><b>${esc(A.name)}</b>${ic('next')}<b>${esc(B.name)}</b></div>
      <div class="g-m">${modeIc(l.mode, 'xs')}<span>${MODE[l.mode].n} ${l.min}분${ft ? ` · ${ft}` : ''}</span></div></header>
      <ol class="gsteps">${steps.map(stepHTML).join('')}</ol>
      <div class="g-act"><a class="btn soft sm" href="${mapsUrl(A, B, l.mode)}" target="_blank" rel="noopener">${ic('map')}구글 지도로 실시간 확인</a><button class="btn soft sm" data-act="showJa" data-i="${i + 1}">${ic('taxi')}일본어로 보여주기</button></div>
    </article>`;
    })
    .join('');
  return `<section class="daycard g-top"><div class="dc-h"><div><h2>${S.di + 1}일차 이동 안내</h2><small>${md(c.day.date)} · 이동 ${legs.filter(l => l.mode !== 'none').length}번</small></div></div><div class="g-sum">${sum}</div></section>
    <details class="card tips"${S.tipsOpen ? ' open' : ''}><summary>${ic('spark')}<b>처음이라면 · 타는 법</b>${ic('down', 'chev')}</summary>
      ${howtoDL()}</details>
    <div class="glist">${cards}</div>
    <p class="fine">역 번호·방면·노선은 2026년 기준이에요. 버스 번호와 시간표는 바뀔 수 있으니 「구글 지도로 실시간 확인」을 함께 보세요.</p>`;
}
// 시트: 일본어로 보여주기 (택시·역무원용)
function jaSheet(sh) {
  const p = S.plan,
    { pts } = legPoints(p, S.di),
    B = pts[sh.i] || pts[pts.length - 1];
  let big,
    phrase,
    ko,
    note = '';
  if (B.airport) {
    big = '福岡空港 国際線ターミナル';
    phrase = '福岡空港 国際線ターミナルまで お願いします';
    ko = '후쿠오카 공항 국제선 터미널';
  } else if (!B.sid && (B.hotel || B.name === '숙소' || (B.j && /周辺/.test(B.j)))) {
    const hn = B.hn || '',
      readable = hn && !/[가-힣]/.test(hn);
    big = readable ? hn : '宿泊先のホテル';
    phrase = readable ? `${hn}まで お願いします` : 'このホテルまで お願いします';
    ko =
      LANG === 'ja' && B.hwj
        ? `宿（${hn ? hn + '・' : ''}${B.hwj}周辺）`
        : `숙소 (${hn ? hn + ', ' : ''}${B.hw || HOTEL_LABEL[p.set.hotel] || ''} 근처)`;
    note = '호텔 예약 확인서의 호텔 이름·주소를 함께 보여 주세요.';
  } else {
    big = B.j || B.name;
    phrase = `${B.j || B.name}まで お願いします`;
    ko = B.name;
  }
  return `<div class="sh-h"><div><h2>일본어로 보여주기</h2><p>택시 기사님이나 역무원에게 이 화면을 보여 주세요.</p></div><button class="ib sm" data-act="closeSheet" aria-label="닫기">${ic('close')}</button></div>
    ${jaCardV({ label: `<small>목적지 · ${esc(ko)}</small>`, ja: `<div class="ja-big" lang="ja">${esc(big)}</div><p class="ja-ph" lang="ja">${esc(phrase)}</p>`, sub: `<p class="ja-ko">(${esc(ko)}까지 가 주세요)</p>` })}
    ${note ? `<p class="note">${ic('alert')}<span>${esc(note)}</span></p>` : ''}
    <p class="note">${ic('spark')}<span>길을 물을 땐 「<span lang="ja">${esc(big)}はどこですか？</span>」 (○○는 어디예요?) 라고 보여 주세요.</span></p>`;
}
