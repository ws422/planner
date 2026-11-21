// ======================================================================
// nav.js · 안드로이드 뒤로가기
// 뒤로가기를 누르면 앱이 닫히지 않고 바로 전 화면(열린 시트 → 이전 단계 → 홈)으로 가요.
// 고치는 법: docs/수정가이드.md
// ======================================================================
// ---- 안드로이드 뒤로가기: 앱 밖으로 나가지 않고 바로 전 화면으로 ----
// 홈(시트 없음)이 아닌 동안 기록을 한 칸 쌓아 두고, 뒤로가기가 그 칸을 지우면 앱 안에서 한 단계 뒤로 가요.
// 홈에서 누르면 원래대로 앱이 닫혀요.
const NAV = { skip: 0, on: IS_APP && !!(window.history && history.pushState) };
function navAtRoot() {
  return S.view === 'home' && !S.sheet;
}
function navSync() {
  if (!NAV.on || NAV.skip) return;
  const guarded = !!(history.state && history.state.fkNav);
  try {
    if (!navAtRoot() && !guarded) history.pushState({ fkNav: 1 }, '');
    else if (navAtRoot() && guarded) {
      NAV.skip++;
      history.back();
    } // 버튼으로 홈에 왔으면 남은 칸을 치워요
  } catch (e) {
    NAV.on = false;
  }
}
function navBack() {
  if (typeof DRAG !== 'undefined' && DRAG) {
    dragEnd(false);
    return;
  }
  const sh = S.sheet;
  if (sh) {
    if (sh.type === 'spot' && sh.back) A.spotBack();
    else if (sh.type === 'hpick' && sh.back) {
      S.sheet = { type: sh.back };
      render();
    } else A.closeSheet();
    return;
  }
  if (S.view === 'plan') {
    if (S.sel) {
      S.sel = null;
      render();
      return;
    }
    if (S.tab !== 'sched') {
      A.tab({ t: 'sched' });
      return;
    }
    A.goHome();
    return;
  }
  if (S.view === 'areas') {
    A.toDates();
    return;
  }
  if (S.view === 'dates') {
    A.goHome();
    return;
  }
}
window.addEventListener('popstate', () => {
  if (!NAV.on) return;
  if (NAV.skip) {
    NAV.skip--;
    navSync();
    return;
  }
  if (navAtRoot()) return;
  navBack();
  navSync();
});
