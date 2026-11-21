// ======================================================================
// stays.js · 숙소를 날짜별로 정하기
// 새 여행 1단계의 숙소 칸, 숙소 위치 고르기 시트, 계획 화면의 숙소 시트, 일차 카드의 「오늘 밤 숙소」 줄
// 고치는 법: docs/수정가이드.md
// ======================================================================
// ---- 숙소: 날짜별로 다르게 정하기 (새 여행 화면 · 계획 화면 공통) ----
function hotelWhereT(h) {
  return LANG === 'ja' ? hotelWhereJ(h) : hotelWhere(h);
}
function hotelLabelT(h) {
  h = h || {};
  return h.name ? `${h.name} · ${hotelWhereT(h)}` : hotelWhereT(h);
}
function hotelNearT(h) {
  return LANG === 'ja' ? `${hotelWhereJ(h)}周辺` : `${hotelWhere(h)} 근처`;
}
function draftNights() {
  const D = S.draft;
  return D.start && D.end ? dayDiff(D.start, D.end) : 0;
}
function nightDate(start, n) {
  const d = pd(start);
  d.setDate(d.getDate() + n);
  return ymd(d);
}
// ctx: 'draft' = 새 여행 만들기 화면, 'plan' = 만들어 둔 계획
function stayCtx(ctx) {
  if (ctx === 'plan') {
    const p = S.plan;
    return {
      start: p.days[0].date,
      nights: nightsOf(p),
      get: () => staysOf(p),
      set: st => {
        pushUndo();
        p.set.stays = st;
        syncMoveItems(p);
        dirty();
      }
    };
  }
  const D = S.draft;
  return {
    start: D.start,
    nights: draftNights(),
    get: () => normStays(D.stays, draftNights(), D.hotel),
    set: st => {
      D.stays = st;
      D.hotel = hotelKeyOf(st[0] && st[0].h);
    }
  };
}
function staysEditorV(ctx) {
  const c = stayCtx(ctx),
    st = c.get(),
    n = c.nights;
  const rows = st
    .map((x, k) => {
      const cnt = x.n1 - x.n0 + 1,
        inD = nightDate(c.start, x.n0),
        outD = nightDate(c.start, x.n1 + 1);
      let opts = '';
      if (k > 0)
        for (let b = st[k - 1].n0 + 1; b <= x.n1; b++)
          opts += `<option value="${b}"${b === x.n0 ? ' selected' : ''}>${mds(nightDate(c.start, b))}</option>`;
      return `<li class="stay">
      <div class="stay-h"><span class="stay-n">${k + 1}</span><span class="stay-d"><b>${mds(inD)} – ${mds(outD)}</b><small>${L(`${cnt}박`, `${cnt}泊`)}</small></span>
        ${
          k > 0
            ? `<button class="ib xs" data-act="stayDel" data-ctx="${ctx}" data-k="${k}" aria-label="${L(`${k + 1}번째 숙소 빼기`, `${k + 1}番目の宿を外す`)}">${ic('close')}</button>
        <label class="stay-in"><span>${L('이 숙소 체크인 날', 'この宿のチェックイン日')}</span><select data-change="stayFrom" data-ctx="${ctx}" data-k="${k}">${opts}</select></label>`
            : ''
        }</div>
      <button class="stay-pick" data-act="stayPick" data-ctx="${ctx}" data-k="${k}">${ic('home')}<span><b>${esc(hotelNearT(x.h))}</b><small>${x.h.name ? esc(x.h.name) : L('눌러서 위치·숙소 이름 정하기', 'タップして場所・宿の名前を設定')}</small></span>${ic('next', 'chev')}</button></li>`;
    })
    .join('');
  const canAdd = st.some(x => x.n1 > x.n0);
  return (
    `<ol class="stays">${rows}</ol>` +
    (canAdd
      ? `<button class="btn soft wide stay-add" data-act="stayAdd" data-ctx="${ctx}">${ic('plus')}${L('중간에 숙소 옮기기', '途中で宿を移る')}</button>`
      : '')
  );
}
// 새 여행 화면의 숙소 카드
function draftHotelCard() {
  const D = S.draft,
    n = draftNights();
  const head = `<h2 class="h-s">${L('숙소', '宿')}</h2>`;
  if (!D.start || !D.end)
    return `<section class="card">${head}<p class="sub">${L('날짜를 고르면 밤마다 묵을 숙소를 정할 수 있어요.', '日付を選ぶと、泊まる宿を夜ごとに決められます。')}</p></section>`;
  if (!n)
    return `<section class="card">${head}<p class="sub">${L('당일치기라 숙소 없이 공항에서 출발해 공항으로 돌아오는 동선으로 짜요.', '日帰りなので、宿なしで空港発・空港着のルートを作ります。')}</p></section>`;
  return `<section class="card">${head}<p class="sub">${L('매일 숙소에서 출발해 숙소로 돌아오는 동선으로 짜요. 숙소를 옮기면 그날 아침 새 숙소에 짐을 맡기고 시작해요.', '毎日宿を出発して宿に戻るルートを作ります。宿を移る日は、朝に新しい宿へ荷物を預けてから始めます。')}</p>${staysEditorV('draft')}</section>`;
}
// 숙소 위치 고르기
function hpickSheetV(sh) {
  const c = stayCtx(sh.ctx),
    st = c.get(),
    x = st[sh.k] || st[0],
    h = sh.h;
  const chip = (v, label, on) =>
    `<button class="${on ? 'on' : ''}" data-act="hpPick" data-v="${v}" aria-pressed="${on}">${label}</button>`;
  const presets = Object.keys(HOTEL_LABEL)
    .map(k => chip('k:' + k, esc(hotelWhereT({ k })), !h.st && h.k === k))
    .join('');
  const skip = new Set([...Object.values(HOTEL_STATION), 'airport']),
    seen = new Set();
  const lines = Object.values(LINES)
    .map(ln => {
      const ids = ln.st.filter(id => !skip.has(id) && !seen.has(id));
      ids.forEach(id => seen.add(id));
      return ids.length
        ? `<p class="hp-line"><i style="--m:${ln.color}"></i>${esc(LANG === 'ja' ? ln.j : ln.n)}</p><div class="chips-sel hp-st">${ids.map(id => chip('st:' + id, esc(LANG === 'ja' ? STATIONS[id].j : STATIONS[id].n), h.st === id)).join('')}</div>`
        : '';
    })
    .join('');
  return (
    shHead(
      L('숙소 위치', '宿の場所'),
      `${L(`${sh.k + 1}번째 숙소`, `${sh.k + 1}番目の宿`)} · ${mds(nightDate(c.start, x.n0))} – ${mds(nightDate(c.start, x.n1 + 1))}`
    ) +
    `<label class="fld hp-name"><span>${L('숙소 이름 (안 적어도 돼요)', '宿の名前(空欄でもOK)')}</span><input id="hName" type="text" maxlength="40" value="${esc(h.name || '')}" placeholder="${L('예: 도미인 하카타', '例: ドーミーイン博多')}" autocomplete="off"></label>
    <h3 class="sec"><span>${L('많이 묵는 동네', '人気の宿泊エリア')}</span></h3><div class="chips-sel">${presets}</div>
    <h3 class="sec"><span>${L('다른 역 근처', 'ほかの駅の近く')}</span><small>${L('숙소에서 가장 가까운 역', '宿から一番近い駅')}</small></h3>${lines}
    <div class="sh-foot"><button class="btn pri" data-act="hpSave">${ic('check')}${L('이 숙소로 정하기', 'この宿に決める')}</button></div>`
  );
}
SHEETS.hpick = hpickSheetV;
SHEET_LABEL.hpick = '숙소 위치';
// 계획 화면에서 숙소 관리
function staysSheetV() {
  return (
    shHead(
      L('숙소', '宿'),
      L(
        '날짜별로 묵는 숙소를 정해요. 바꾸면 그날 이동 경로가 새 숙소 기준으로 바뀌어요.',
        '日付ごとに泊まる宿を決めます。変えるとその日の移動ルートが新しい宿に合わせて変わります。'
      )
    ) +
    staysEditorV('plan') +
    `<p class="fine">${L('숙소를 옮기는 날엔 아침에 「숙소 옮기기 · 짐 맡기기」가 자동으로 들어가요. 이미 넣은 장소는 그대로 두고 이동 경로와 시간만 다시 계산해요. 동네 배치까지 새 숙소에 맞추려면 그날의 「다시 짜기」를 눌러 주세요.', '宿を移る日は、朝に「宿の移動・荷物預け」が自動で入ります。入れた場所はそのままで、移動ルートと時間だけ計算し直します。エリアの割り振りも合わせたいときは、その日の「組み直す」を押してください。')}</p>`
  );
}
SHEETS.stays = staysSheetV;
SHEET_LABEL.stays = '숙소';
// 일차 카드에 보이는 숙소 한 줄
function dayHotelRow(p, di) {
  const N = p.days.length;
  if (N < 2) return '';
  const prev = di > 0 ? nightHotel(p, di - 1) : null,
    cur = di < N - 1 ? nightHotel(p, di) : null;
  let t;
  if (cur && prev && !sameHotel(prev, cur))
    t = `${L('숙소 옮기는 날', '宿を移る日')} · ${esc(hotelLabelT(prev))} → ${esc(hotelLabelT(cur))}`;
  else if (cur) t = `${L('오늘 밤', '今夜の宿')} · ${esc(hotelLabelT(cur))}`;
  else t = `${L('체크아웃', 'チェックアウト')} · ${esc(hotelLabelT(prev))}`;
  return `<button class="dc-hotel" data-act="staysSheet">${ic('home')}<span>${t}</span>${ic('next', 'chev')}</button>`;
}
Object.assign(A, {
  staysSheet() {
    S.sheet = { type: 'stays' };
    render();
  },
  stayPick(d) {
    const st = stayCtx(d.ctx).get(),
      k = Number(d.k);
    if (!st[k]) return;
    S.sheet = { type: 'hpick', ctx: d.ctx, k, h: clone(st[k].h), back: d.ctx === 'plan' ? 'stays' : null };
    render();
  },
  hpPick(d) {
    const nm = document.getElementById('hName'),
      name = nm ? nm.value.trim().slice(0, 40) : S.sheet.h.name;
    const [t, v] = d.v.split(':');
    S.sheet.h = t === 'k' ? { k: v } : { st: v };
    if (name) S.sheet.h.name = name;
    S.keepSheetScroll = true;
    render();
  },
  hpSave() {
    const sh = S.sheet,
      nm = document.getElementById('hName'),
      name = nm ? nm.value.trim().slice(0, 40) : '';
    const h = { ...sh.h };
    delete h.name;
    if (name) h.name = name;
    const c = stayCtx(sh.ctx),
      st = c.get().map(x => ({ ...x }));
    if (!st[sh.k]) return;
    st[sh.k].h = h;
    c.set(st);
    S.sheet = sh.back ? { type: sh.back } : null;
    render();
    toast(
      sh.ctx === 'plan'
        ? L(
            `${hotelLabelT(h)}(으)로 바꾸고 이동 경로를 다시 계산했어요.`,
            `${hotelLabelT(h)}に変えて、移動ルートを計算し直しました。`
          )
        : L(`${hotelLabelT(h)}(으)로 정했어요.`, `${hotelLabelT(h)}に決めました。`)
    );
  },
  stayAdd(d) {
    const c = stayCtx(d.ctx),
      st = c.get().map(x => ({ ...x }));
    let k = st.length - 1;
    while (k >= 0 && st[k].n1 <= st[k].n0) k--;
    if (k < 0) {
      toast(L('나눌 수 있는 밤이 없어요.', '分けられる夜がありません。'));
      return;
    }
    const x = st[k],
      b = x.n0 + Math.ceil((x.n1 - x.n0 + 1) / 2);
    st.splice(k + 1, 0, { n0: b, n1: x.n1, h: clone(x.h) });
    x.n1 = b - 1;
    c.set(st);
    A.stayPick({ ctx: d.ctx, k: k + 1 });
  },
  stayDel(d) {
    const c = stayCtx(d.ctx),
      st = c.get().map(x => ({ ...x })),
      k = Number(d.k);
    if (k < 1 || !st[k]) return;
    st[k - 1].n1 = st[k].n1;
    st.splice(k, 1);
    c.set(st);
    S.keepSheetScroll = true;
    render();
  }
});
function stayFromChange(t) {
  const c = stayCtx(t.dataset.ctx),
    st = c.get().map(x => ({ ...x })),
    k = Number(t.dataset.k),
    b = Number(t.value);
  if (!st[k] || !st[k - 1]) return;
  st[k - 1].n1 = b - 1;
  st[k].n0 = b;
  c.set(st);
  S.keepSheetScroll = true;
  render();
}
