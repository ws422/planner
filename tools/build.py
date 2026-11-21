#!/usr/bin/env python3
"""후쿠오카 플래너 앱 만들기

src/ 안의 원본 파일을 하나로 합쳐서, 저장소 맨 위에 아래 파일을 만들어요.
  index.html            앱 화면 (코드·글자·디자인이 모두 이 한 파일에 들어가요)
  sw.js                 오프라인 지원 (한 번 열면 인터넷 없이도 열리게 저장)
  manifest.webmanifest  홈 화면에 설치할 때 쓰는 이름·아이콘 정보

깃허브에서 src/ 를 고치면 자동으로 이 스크립트가 돌아가요 (.github/workflows/build.yml).
내 컴퓨터에서 직접 돌릴 때:
  python3 tools/build.py               저장소 맨 위에 만들기
  python3 tools/build.py --out 폴더     다른 폴더에 만들기 (사진·아이콘도 같이 복사)
  python3 tools/build.py --web 파일     Claude 아티팩트용 한 파일 만들기 (설치 기능 없음)
"""
import argparse, hashlib, json, os, re, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')

# 합치는 순서가 중요해요. 위에 있는 파일에서 만든 것을 아래 파일이 써요.
JS_FILES = [
    'data.js',       # 장소·역·노선·요금·지도 모양 같은 데이터
    'spot_info.js',  # 장소별 긴 설명·팁·입장료 (한국어·일본어)
    'engine.js',     # 일정 짜기 계산 (동선, 이동 시간, 요금, 숙소)
    'i18n.js',       # 일본어 화면 바꾸기 장치
    'ja.json',       # 일본어 사전 (한국어 문장 → 일본어)
    'ui.js',         # 화면 공통 + 새 여행 만들기 + 계획 화면(일정 탭)
    'home.js',       # 홈 화면, 여행 준비 시트들, 동네·장소 정보, 계획 공유
    'stays.js',      # 숙소 날짜별로 정하기
    'alt.js',        # 웨이팅 길 때 근처 다른 식당
    'drag.js',       # 일정 카드 끌어서 순서 바꾸기
    'nav.js',        # 안드로이드 뒤로가기
    'guide.js',      # 길안내 탭, 일본어로 보여주기
    'maps.js',       # 지도 그리기
]
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '<link href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;500;600;700;800&family=Outfit:wght@500;600;700'
         '&family=Noto+Sans+JP:wght@400;500;700;800&family=Nanum+Myeongjo:wght@700;800&family=Noto+Serif+JP:wght@600;700&display=swap" rel="stylesheet">')
APP_HEAD = '''<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#F7F3ED" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E1424" media="(prefers-color-scheme: dark)">
<meta name="description" content="후쿠오카 여행 일정·동선·교통비를 짜 주는 플래너">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="icons/favicon-64.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="후쿠오카">'''
MANIFEST = {
    'name': '후쿠오카 여행 플래너', 'short_name': '후쿠오카',
    'description': '후쿠오카 여행 일정·동선·교통비를 짜 주는 플래너',
    'lang': 'ko', 'dir': 'ltr', 'id': './', 'start_url': './', 'scope': './',
    'display': 'standalone', 'orientation': 'portrait',
    'background_color': '#F7F3ED', 'theme_color': '#F7F3ED', 'categories': ['travel'],
    'icons': [
        {'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
        {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
        {'src': 'icons/icon-maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}
    ]
}
ICONS = ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-64.png']


def fail(msg):
    print(f'\n[만들기 실패] {msg}\n', file=sys.stderr)
    sys.exit(1)


def read(name):
    path = os.path.join(SRC, name)
    if not os.path.exists(path):
        fail(f'src/{name} 파일이 없어요.')
    return open(path, encoding='utf8').read()


def check_syntax():
    """파일마다 문법 오류가 없는지 봐요 (node 가 있을 때만). 오류가 나면 어느 파일 몇째 줄인지 알려 줘요."""
    if not shutil.which('node'):
        return
    for f in JS_FILES:
        if f.endswith('.js'):
            r = subprocess.run(['node', '--check', os.path.join(SRC, f)], capture_output=True, text=True)
            if r.returncode:
                fail(f'src/{f} 에 문법 오류가 있어요. (괄호·따옴표·쉼표를 확인해 주세요)\n{r.stderr.strip()}')


def ja_js():
    """일본어 사전(ja.json)을 코드로 바꿔요."""
    try:
        ja = json.loads(read('ja.json'))
    except json.JSONDecodeError as e:
        fail(f'src/ja.json {e.lineno}째 줄 근처가 JSON 형식에 맞지 않아요. (따옴표·쉼표를 확인해 주세요)\n{e}')
    for k, v in ja.items():
        for t in '@#J':  # {@} 장소 이름, {#} 숫자, {J} 일본어 조각
            if len(re.findall(r'\{' + t + r'\d*\}', v)) > len(re.findall(r'\{' + t + r'\d*\}', k)):
                fail(f'src/ja.json 의 "{k}" 번역에 {{{t}}} 가 한국어 쪽보다 많아요.')
    return 'const JA = ' + json.dumps(ja, ensure_ascii=False, indent=0) + ';\n'


def used_photos(js):
    """코드에서 쓰는 사진만 골라요 (상단 사진 hero-*.jpg, 동네 사진 area-*.jpg)."""
    hero = sorted(set(re.findall(r"['\"](hero-[\w-]+\.jpg)['\"]", js)))
    m = re.search(r'const AREA_PHOTOS = \{(.*?)\n\};', js, re.S)
    area = sorted(f'area-{k}.jpg' for k in re.findall(r'^\s*(\w+): \[', m.group(1), re.M)) if m else []
    missing = [f for f in hero + area if not os.path.exists(os.path.join(ROOT, 'photos', f))]
    if missing:
        fail('코드에는 있는데 photos/ 폴더에 없는 사진이 있어요: ' + ', '.join(missing))
    return hero + area


def page(js, css, is_app):
    head = APP_HEAD if is_app else '<meta name="viewport" content="width=device-width, initial-scale=1">'
    code = f'const IS_APP = {"true" if is_app else "false"};\n' + js + '\napplyLang();\nstartTr();\nrender();\nstore.init();\n'
    if is_app:
        code += "if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));\n"
    return f'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
{head}
<title>후쿠오카 여행 플래너</title>
{FONTS}
<style>
{css}
</style>
</head>
<body>
<div id="app"></div>
<script>
{code}
</script>
</body>
</html>
'''


def service_worker(ver, shell):
    return f'''// 후쿠오카 플래너 오프라인 지원 (버전 {ver}) · tools/build.py 가 만든 파일이에요. 직접 고치지 마세요.
const V = 'fkp-{ver}', FONTS = 'fkp-fonts';
const SHELL = {json.dumps(shell)};
self.addEventListener('install', e => {{
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
}});
self.addEventListener('activate', e => {{
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('fkp-') && k !== V && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
}});
self.addEventListener('fetch', e => {{
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 화면(index.html): 인터넷이 되면 새 버전, 안 되면 저장해 둔 버전
  if (req.mode === 'navigate') {{
    e.respondWith(fetch(req).then(r => {{ if (r.ok) {{ const cp = r.clone(); caches.open(V).then(c => c.put('./index.html', cp)); }} return r; }})
      .catch(() => caches.match('./index.html', {{ ignoreSearch: true }})));
    return;
  }}
  // 사진·아이콘: 저장해 둔 것 먼저
  if (url.origin === location.origin) {{
    e.respondWith(caches.match(req, {{ ignoreSearch: true }}).then(hit => hit || fetch(req).then(r => {{ if (r.ok) {{ const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); }} return r; }})));
    return;
  }}
  // 글꼴: 저장해 두고 쓰면서 뒤에서 새로 받기
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {{
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(hit => {{
      const net = fetch(req).then(r => {{ if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }}).catch(() => hit);
      return hit || net;
    }})));
  }}
}});
'''


def main():
    ap = argparse.ArgumentParser(description='후쿠오카 플래너 앱 만들기')
    ap.add_argument('--out', help='결과를 만들 폴더 (기본: 저장소 맨 위)')
    ap.add_argument('--web', help='Claude 아티팩트용 한 파일 경로')
    a = ap.parse_args()

    check_syntax()
    js = '\n'.join(ja_js() if f == 'ja.json' else read(f) for f in JS_FILES)
    css = read('style.css')
    photos = used_photos(js)

    if a.web:
        open(a.web, 'w', encoding='utf8').write(page(js, css, False))
        print(f'아티팩트용 파일: {a.web}')

    out = os.path.abspath(a.out) if a.out else ROOT
    if out != ROOT:  # 다른 폴더에 만들 땐 사진·아이콘도 같이
        os.makedirs(os.path.join(out, 'photos'), exist_ok=True)
        os.makedirs(os.path.join(out, 'icons'), exist_ok=True)
        for f in photos:
            shutil.copy(os.path.join(ROOT, 'photos', f), os.path.join(out, 'photos', f))
        for f in ICONS:
            shutil.copy(os.path.join(ROOT, 'icons', f), os.path.join(out, 'icons', f))
    app = page(js, css, True)
    ver = hashlib.sha1(app.encode('utf8')).hexdigest()[:10]
    shell = ['./', './index.html', './manifest.webmanifest'] + [f'./icons/{f}' for f in ICONS] + [f'./photos/{f}' for f in photos]
    open(os.path.join(out, 'index.html'), 'w', encoding='utf8').write(app)
    open(os.path.join(out, 'sw.js'), 'w', encoding='utf8').write(service_worker(ver, shell))
    open(os.path.join(out, 'manifest.webmanifest'), 'w', encoding='utf8').write(json.dumps(MANIFEST, ensure_ascii=False, indent=2))
    print(f'완성: index.html ({len(app) // 1024}KB) · sw.js (버전 {ver}) · 사진 {len(photos)}장')


if __name__ == '__main__':
    main()
