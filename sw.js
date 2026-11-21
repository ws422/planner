// 후쿠오카 플래너 오프라인 지원 (버전 2fde532af3) · tools/build.py 가 만든 파일이에요. 직접 고치지 마세요.
const V = 'fkp-2fde532af3', FONTS = 'fkp-fonts';
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png", "./icons/favicon-64.png", "./photos/hero-day-1.jpg", "./photos/hero-day-2.jpg", "./photos/hero-day-3.jpg", "./photos/hero-day-4.jpg", "./photos/hero-day-5.jpg", "./photos/hero-nightview-1.jpg", "./photos/hero-nightview-2.jpg", "./photos/hero-nightview-3.jpg", "./photos/hero-nightview-4.jpg", "./photos/area-bayside.jpg", "./photos/area-beppu.jpg", "./photos/area-dazaifu.jpg", "./photos/area-hakata.jpg", "./photos/area-itoshima.jpg", "./photos/area-mojiko.jpg", "./photos/area-momochi.jpg", "./photos/area-nakasu.jpg", "./photos/area-noko.jpg", "./photos/area-ohori.jpg", "./photos/area-tenjin.jpg", "./photos/area-uminaka.jpg", "./photos/area-yanagawa.jpg", "./photos/area-yufuin.jpg"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('fkp-') && k !== V && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 화면(index.html): 인터넷이 되면 새 버전, 안 되면 저장해 둔 버전
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put('./index.html', cp)); } return r; })
      .catch(() => caches.match('./index.html', { ignoreSearch: true })));
    return;
  }
  // 사진·아이콘: 저장해 둔 것 먼저
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); } return r; })));
    return;
  }
  // 글꼴: 저장해 두고 쓰면서 뒤에서 새로 받기
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
  }
});
