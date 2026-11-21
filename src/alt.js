// ======================================================================
// alt.js · 웨이팅 길 때 근처 다른 식당
// 일정의 식당·카페를 눌렀을 때 「근처 다른 식당 보기」 시트, 구글 지도 검색 버튼(ALT_Q)
// 고치는 법: docs/수정가이드.md
// ======================================================================
// ---- 웨이팅이 길 때: 근처 다른 식당(카페)으로 바꾸기 ----
const ALT_Q = [
  ['ラーメン', '라멘', 'ラーメン'],
  ['うどん', '우동', 'うどん'],
  ['定食', '정식·덮밥', '定食・丼'],
  ['居酒屋', '이자카야', '居酒屋'],
  ['焼肉', '고기', '焼肉'],
  ['カフェ', '카페', 'カフェ'],
  ['レストラン', '식당 전체', '飲食店すべて']
];
function spName(x) {
  return LANG === 'ja' ? x.j : x.n;
}
function itName(p, it) {
  return LANG === 'ja' && it.sid ? SPOT[it.sid].j : itemName(p, it);
}
function isEat(s) {
  return !!s && (s.c === 'food' || s.c === 'cafe' || s.meal);
}
function queued(s) {
  const i = SPOT_INFO[s.id] || {};
  return /줄/.test(`${s.d} ${i.tk || ''}`);
}
function nearSearchUrl(q, pt) {
  return `https://www.google.com/maps/search/${encodeURIComponent(q)}/@${pt.lat.toFixed(5)},${pt.lng.toFixed(5)},16z`;
}
function altFind(p, di, it) {
  const s = SPOT[it.sid],
    day = p.days[di],
    c = computeDay(p, di),
    row = c.rows.find(r => r.it === it);
  const arr = row ? row.arr : 720,
    wd = weekday(day.date),
    mon = Number(day.date.slice(5, 7));
  const cafeMode = s.c === 'cafe' && !it.meal,
    lunch = it.meal === 'L' || (!it.meal && arr < 900);
  const inPlan = new Set(p.days.flatMap(d => d.items.map(x => x.sid)).filter(Boolean));
  const open = x =>
    !(x.cl && x.cl.includes(wd)) &&
    inSeason(x, day.date) &&
    !(x.from && arr < toMin(x.from) - 20) &&
    !(x.to && arr + 40 > toMin(x.to)) &&
    !(lunch && x.b === 'n');
  const R = s.z === 'city' ? 1.6 : 3;
  const pool = kind =>
    SPOTS.filter(x => x.id !== s.id && !inPlan.has(x.id) && x.z === s.z && kind(x) && open(x))
      .map(x => ({ x, d: km(s, x), q: queued(x) }))
      .filter(o => o.d <= R)
      .sort((a, b) => a.q - b.q || a.d - b.d);
  const eats = pool(x => (cafeMode ? x.c === 'cafe' : x.c === 'food' || x.meal)).slice(0, 6);
  const cafes = cafeMode ? [] : pool(x => x.c === 'cafe').slice(0, 2);
  return { s, arr, cafeMode, eats, cafes };
}
function altCard(o, uid) {
  const x = o.x,
    info = SPOT_INFO[x.id] || {},
    w = wmin(o.d),
    desc = LANG === 'ja' ? info.ja || '' : x.d;
  const price = info.pr ? ['', '¥', '¥¥', '¥¥¥'][info.pr] : '';
  return `<li class="alt">
    <div class="alt-h">${catTile(x.c)}<span class="alt-t"><b>${esc(spName(x))}</b>${LANG === 'ja' ? '' : `<small lang="ja">${esc(x.j)}</small>`}</span></div>
    ${desc ? `<p class="alt-d">${esc(desc)}</p>` : ''}
    <div class="alt-m"><span>${ic('walk')}${w <= 25 ? L(`걸어서 ${w}분`, `徒歩${w}分`) : `${o.d.toFixed(1)}km`}</span>${price ? `<span>${price}</span>` : ''}${o.q ? `<span class="q">${ic('clock')}${L('여기도 줄 서는 곳', 'ここも行列店')}</span>` : ''}</div>
    <div class="alt-b"><button class="btn pri" data-act="altSwap" data-uid="${uid}" data-id="${x.id}">${ic('swap')}${L('이걸로 바꾸기', 'ここに変える')}</button><button class="btn soft" data-act="spotSheet" data-id="${x.id}">${ic('info')}${L('정보', '詳細')}</button></div>
  </li>`;
}
function altSheetV(sh) {
  const p = S.plan,
    it = p && p.days[S.di].items.find(x => x.uid === sh.uid);
  if (!it || !it.sid)
    return (
      shHead(L('근처 다른 식당', '近くのほかの店'), '') +
      `<p class="note">${ic('alert')}<span>${L('이 장소를 찾을 수 없어요.', 'この場所が見つかりません。')}</span></p>`
    );
  const r = altFind(p, S.di, it),
    s = r.s,
    what = r.cafeMode ? L('카페', 'カフェ') : L('식당', 'お店');
  const list = r.eats.length
    ? `<ul class="alts">${r.eats.map(o => altCard(o, it.uid)).join('')}</ul>`
    : `<p class="note">${ic('search')}<span>${L(`이 근처엔 플래너에 들어 있는 ${what}${r.cafeMode ? '가' : '이'} 더 없어요. 아래 구글 지도에서 찾아보세요.`, `この近くにはプランナーに入っている${what}がほかにありません。下のGoogleマップで探してみてください。`)}</span></p>`;
  const cafes = r.cafes.length
    ? `<h3 class="sec"><span>${L('가볍게 때울 카페', '軽く済ませるならカフェ')}</span></h3><ul class="alts">${r.cafes.map(o => altCard(o, it.uid)).join('')}</ul>`
    : '';
  return (
    shHead(
      L(`근처 다른 ${what}`, `近くのほかの${what}`),
      L(
        `「${esc(s.n)}」 웨이팅이 길 때 바로 갈 수 있는 곳이에요. ${fmt(r.arr)}쯤 열려 있는 곳만 골랐어요.`,
        `「${esc(s.j)}」の待ち時間が長いときにすぐ行ける店です。${fmt(r.arr)}ごろ開いている店だけ選びました。`
      )
    ) +
    list +
    cafes +
    `<h3 class="sec"><span>${L('구글 지도에서 지금 근처 찾기', 'Googleマップで近くを探す')}</span></h3>
    <div class="alt-g">${ALT_Q.filter(([q]) => !r.cafeMode || q === 'カフェ' || q === 'レストラン')
      .map(
        ([q, l, lj]) => `<a href="${nearSearchUrl(q, s)}" target="_blank" rel="noopener">${ic('search')}${L(l, lj)}</a>`
      )
      .join('')}</div>
    <p class="fine">${L('구글 지도에서 「営業中(영업 중)」을 켜면 지금 들어갈 수 있는 곳만 보여요. 가게마다 「혼잡도」도 볼 수 있어요.', 'Googleマップで「営業中」を選ぶと、今入れる店だけが表示されます。店ごとの混雑状況も見られます。')}</p>
    <details class="alt-own"><summary>${ic('pen')}<span>${L('찾은 가게 이름으로 바꾸기', '見つけた店の名前で変える')}</span>${ic('down', 'chev')}</summary>
      <div class="alt-own-b"><label class="fld"><span>${L('가게 이름', '店の名前')}</span><input id="altName" type="text" maxlength="30" placeholder="${L('예: 이치란 텐진니시도리점', '例: 一蘭 天神西通り店')}" autocomplete="off"></label>
      <button class="btn pri" data-act="altCustom" data-uid="${it.uid}">${ic('check')}${L('이 가게로 바꾸기', 'この店に変える')}</button>
      <p class="fine">${L(`「${esc(s.n)}」 근처로 보고 이동 시간을 계산해요.`, `「${esc(s.j)}」の近くとして移動時間を計算します。`)}</p></div></details>`
  );
}
SHEETS.alt = altSheetV;
SHEET_LABEL.alt = '근처 다른 식당';
function altApply(p, di, it, apply, label) {
  const before = computeDay(p, di).endArr,
    old = itName(p, it),
    day = p.days[di];
  pushUndo();
  apply();
  Object.keys(day.modes).forEach(k => {
    const [a, b] = k.split('>');
    if (a === it.uid || b === it.uid) delete day.modes[k];
  });
  cleanModes(p, di);
  dirty();
  const diff = computeDay(p, di).endArr - before;
  S.sheet = null;
  S.sel = it.uid;
  render();
  toast(
    L(
      `${old} 대신 ${label}(으)로 바꿨어요.${diff > 0 ? ` 이후 일정이 ${diff}분 늦어져요.` : diff < 0 ? ` 이후 일정이 ${-diff}분 당겨져요.` : ''}`,
      `「${old}」の代わりに「${label}」にしました。${diff > 0 ? `この後の予定が${diff}分遅くなります。` : diff < 0 ? `この後の予定が${-diff}分早まります。` : ''}`
    ),
    true
  );
}
Object.assign(A, {
  altSheet(d) {
    S.sheet = { type: 'alt', uid: d.uid };
    render();
  },
  altSwap(d) {
    const p = S.plan,
      it = p.days[S.di].items.find(x => x.uid === d.uid),
      n = SPOT[d.id];
    if (!it || !n) return;
    altApply(
      p,
      S.di,
      it,
      () => {
        it.sid = n.id;
        it.stay = n.s;
        delete it.n;
        delete it.lat;
        delete it.lng;
        delete it.z;
        delete it.custom;
        delete it.cat;
        it.src = 'user';
      },
      spName(n)
    );
  },
  altCustom(d) {
    const el = document.getElementById('altName'),
      name = ((el && el.value) || '').trim();
    if (!name) {
      if (el) el.focus();
      toast(L('가게 이름을 적어 주세요.', '店の名前を入力してください。'));
      return;
    }
    const p = S.plan,
      it = p.days[S.di].items.find(x => x.uid === d.uid);
    if (!it || !it.sid) return;
    const s = SPOT[it.sid];
    altApply(
      p,
      S.di,
      it,
      () => {
        it.n = name;
        it.lat = s.lat;
        it.lng = s.lng;
        it.z = s.z;
        it.cat = s.c;
        it.custom = true;
        delete it.sid;
        it.src = 'user';
      },
      name
    );
  }
});
