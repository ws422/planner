// ======================================================================
// drag.js · 일정 카드 끌어서 순서 바꾸기
// 카드 오른쪽 ≡ 손잡이를 끌면 순서가 바뀌어요. 화면 끝에 가면 저절로 스크롤해요.
// 고치는 법: docs/수정가이드.md
// ======================================================================
// ---- 일정 순서: ≡ 손잡이를 끌어서 바꾸기 (손가락·마우스 모두) ----
let DRAG = null;
function dragStart(e, hnd) {
  const li = hnd.closest('li.stop'),
    tl = li && li.closest('.tl');
  if (!li || !tl) return;
  const list = [...tl.querySelectorAll(':scope > li.stop')],
    from = list.indexOf(li);
  if (from < 0 || list.length < 2) return;
  e.preventDefault();
  const sy = window.scrollY,
    tlTop = tl.getBoundingClientRect().top + sy;
  const boxes = list.map(x => {
    const r = x.getBoundingClientRect();
    return { top: r.top + sy, bot: r.bottom + sy };
  });
  const ind = document.createElement('div');
  ind.className = 'drop-ind';
  tl.appendChild(ind);
  DRAG = {
    uid: hnd.dataset.uid,
    li,
    tl,
    list,
    from,
    to: from,
    boxes,
    tlTop,
    ind,
    y0: e.clientY + sy,
    cy: e.clientY,
    pid: e.pointerId,
    raf: 0
  };
  try {
    hnd.setPointerCapture(e.pointerId);
  } catch (_) {}
  li.classList.add('dragging');
  document.body.classList.add('is-dragging');
  if (navigator.vibrate)
    try {
      navigator.vibrate(8);
    } catch (_) {}
  dragPaint();
  DRAG.raf = requestAnimationFrame(dragTick);
}
function dragPaint() {
  const d = DRAG;
  if (!d) return;
  const y = d.cy + window.scrollY;
  d.li.style.transform = `translateY(${Math.round(y - d.y0)}px)`;
  // 끄는 카드를 뺀 나머지 중, 손가락보다 위에 있는(가운데 기준) 카드 수 = 놓을 자리
  const others = d.boxes.filter((b, i) => i !== d.from);
  let t = 0;
  others.forEach(b => {
    if ((b.top + b.bot) / 2 < y) t++;
  });
  d.to = t;
  const gapY = t < others.length ? others[t].top - 6 : others[others.length - 1].bot + 6;
  d.ind.style.top = `${Math.round(gapY - d.tlTop)}px`;
  d.ind.classList.toggle('same', t === d.from);
}
function dragTick() {
  const d = DRAG;
  if (!d) return;
  // 화면 위·아래 끝에 가까우면 저절로 스크롤
  const top = 120,
    bot = window.innerHeight - 110;
  const v = d.cy < top ? -Math.min(18, (top - d.cy) / 4 + 2) : d.cy > bot ? Math.min(18, (d.cy - bot) / 4 + 2) : 0;
  if (v) {
    window.scrollBy(0, v);
    dragPaint();
  }
  d.raf = requestAnimationFrame(dragTick);
}
function dragEnd(ok) {
  const d = DRAG;
  if (!d) return;
  DRAG = null;
  cancelAnimationFrame(d.raf);
  d.li.classList.remove('dragging');
  d.li.style.transform = '';
  d.ind.remove();
  document.body.classList.remove('is-dragging');
  if (ok && d.to !== d.from) A.dragTo({ uid: d.uid, to: d.to });
}
$app.addEventListener('pointerdown', e => {
  const h = e.target.closest('.drag-h');
  if (!h || DRAG || (e.pointerType === 'mouse' && e.button !== 0)) return;
  dragStart(e, h);
});
window.addEventListener(
  'pointermove',
  e => {
    if (DRAG && e.pointerId === DRAG.pid) {
      DRAG.cy = e.clientY;
      dragPaint();
    }
  },
  { passive: true }
);
window.addEventListener('pointerup', e => {
  if (DRAG && e.pointerId === DRAG.pid) dragEnd(true);
});
window.addEventListener('pointercancel', e => {
  if (DRAG && e.pointerId === DRAG.pid) dragEnd(false);
});
// 키보드: 손잡이에 초점을 두고 ↑↓
$app.addEventListener('keydown', e => {
  const h = e.target.closest && e.target.closest('.drag-h');
  if (!h || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
  e.preventDefault();
  const uid = h.dataset.uid;
  A.move({ uid, n: e.key === 'ArrowUp' ? -1 : 1 });
  const nh = document.querySelector(`.drag-h[data-uid="${uid}"]`);
  if (nh) nh.focus();
});
Object.assign(A, {
  dragTo(d) {
    const p = S.plan,
      items = p.days[S.di].items,
      i = items.findIndex(x => x.uid === d.uid),
      t = Number(d.to);
    if (i < 0 || t === i || t < 0 || t >= items.length) return;
    const before = computeDay(p, S.di);
    pushUndo();
    const [it] = items.splice(i, 1);
    items.splice(t, 0, it);
    items.forEach(x => {
      if (x.fixed) x.fixed = false;
    });
    cleanModes(p, S.di);
    dirty();
    const after = computeDay(p, S.di),
      diff = after.endArr - before.endArr;
    S.reAsk =
      (diff >= 10 || after.over > Math.max(0, before.over)) && t < items.length - 1
        ? { uid: it.uid, di: S.di, at: S.editN, diff }
        : null;
    render();
    if (!S.reAsk)
      toast(
        L(
          `${itemName(p, it)}을(를) ${t + 1}번째로 옮겼어요.`,
          `「${it.sid ? SPOT[it.sid].j : itemName(p, it)}」を${t + 1}番目に移しました。`
        ),
        true
      );
  }
});
