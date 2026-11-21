// 일정 계산 점검: 여러 가지 여행을 실제로 만들어 보고, 오류나 이상한 값이 없는지 봐요.
// 깃허브에서 자동으로 돌아가요. 내 컴퓨터에서는:  node tools/check.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const SRC = path.join(__dirname, '..', 'src');
const ctx = { console, module: { exports: {} } };
vm.createContext(ctx);
try {
  vm.runInContext(['data.js', 'spot_info.js', 'engine.js'].map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n') +
    '\nthis.E = module.exports; this.AREAS = AREAS; this.SPOTS = SPOTS; this.HOTEL_LABEL = HOTEL_LABEL; this.SPOT_INFO = SPOT_INFO;', ctx);
} catch (e) {
  console.error('[점검 실패] 데이터나 계산 파일을 읽다가 오류가 났어요:\n' + e.stack);
  process.exit(1);
}
const { E, AREAS, SPOTS, HOTEL_LABEL, SPOT_INFO } = ctx;
const problems = [];

// 1) 데이터 기본 점검
const ids = new Set();
SPOTS.forEach(s => {
  if (ids.has(s.id)) problems.push(`장소 id 가 겹쳐요: ${s.id}`);
  ids.add(s.id);
  if (!AREAS.some(a => a.id === s.a)) problems.push(`${s.id}: 없는 동네(a: '${s.a}')`);
  if (typeof s.lat !== 'number' || typeof s.lng !== 'number') problems.push(`${s.id}: 좌표(lat/lng)가 없어요`);
  if (!(s.s > 0)) problems.push(`${s.id}: 머무는 시간(s)이 없어요`);
  for (const k of ['from', 'to']) if (s[k] && !/^\d{2}:\d{2}$/.test(s[k])) problems.push(`${s.id}: ${k} 는 '18:00' 처럼 적어 주세요`);
});
Object.keys(SPOT_INFO).forEach(k => { if (!ids.has(k)) problems.push(`spot_info.js 의 ${k} 는 data.js 에 없는 장소예요`); });

// 2) 여행을 여러 개 만들어 보기
const day = n => { const d = new Date('2026-12-04T00:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const hotels = Object.keys(HOTEL_LABEL);
let made = 0;
for (let len = 0; len <= 5; len++) {
  for (let t = 0; t < 6; t++) {
    const areas = AREAS.filter((a, i) => (i + t) % 3 !== 0).slice(0, 3 + len).map(a => a.id);
    const nights = len;
    const stays = nights >= 2 ? [{ n0: 0, n1: 0, h: { k: hotels[t % hotels.length] } }, { n0: 1, n1: nights - 1, h: { st: 'watanabedori', name: '점검용 호텔' } }] : null;
    const set = { start: day(t * 7), end: day(t * 7 + len), hotel: hotels[(t + 2) % hotels.length], stays, arrive: '10:00', depart: '18:00', dayStart: '09:30', dayEnd: '21:30' };
    try {
      const p = E.createPlan(set, areas); made++;
      p.days.forEach((d, i) => {
        const c = E.computeDay(p, i);
        if (!Number.isFinite(c.endArr)) problems.push(`${len + 1}일 여행 ${i + 1}일차: 마무리 시각을 계산하지 못했어요`);
        c.rows.forEach(r => { if (!Number.isFinite(r.arr) || !r.leg) problems.push(`${len + 1}일 여행 ${i + 1}일차 ${E.itemName(p, r.it)}: 이동 계산 오류`); });
        if (c.over > 30) problems.push(`${len + 1}일 여행 ${i + 1}일차: 마무리보다 ${c.over}분 늦어요 (일정 조절 규칙 확인)`);
      });
      E.farePlan(p);
    } catch (e) {
      problems.push(`${len + 1}일 여행 (${areas.join(',')}) 만들다가 오류: ${e.message}`);
    }
  }
}
if (problems.length) {
  console.error(`[점검 실패] 문제 ${problems.length}개\n- ` + problems.slice(0, 30).join('\n- '));
  process.exit(1);
}
console.log(`점검 통과: 장소 ${SPOTS.length}곳, 여행 ${made}개를 만들어 봤어요.`);
