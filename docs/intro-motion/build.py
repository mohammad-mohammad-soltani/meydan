import base64, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / 'src'
PUB = ROOT.parents[1] / 'public'
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'naghsh-man-motion.html'

fonts = []
for w in (400, 500, 700, 800, 900):
    b = base64.b64encode((PUB / 'fonts' / f'Vazirmatn-{w}.ttf').read_bytes()).decode()
    fonts.append(f"@font-face{{font-family:'Vazirmatn';font-weight:{w};font-display:block;src:url(data:font/ttf;base64,{b}) format('truetype');}}")

iran = base64.b64encode((PUB / 'fonts' / 'IRANSansXV.woff2').read_bytes()).decode()
fonts.append(f"@font-face{{font-family:'IRANSansX';font-weight:100 900;font-display:block;src:url(data:font/woff2;base64,{iran}) format('woff2');}}")

logo_svg = (PUB / 'images/logo/meydan-mark.svg').read_text()
logo_d = re.search(r'<path[^>]*\sd="([^"]+)"', logo_svg).group(1)
logo_inline = f'<svg viewBox="0 0 531 536" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" fill-rule="evenodd" d="{logo_d}"/></svg>'
flag_b64 = base64.b64encode((PUB / 'images/iran-flag.svg').read_bytes()).decode()
geo = (ROOT / 'geo.json').read_text()
def svg_paths(name):
    return re.findall(r'<path[^>]*?\sd="([^"]+)"', (ROOT / 'assets' / name).read_text())
assets = json.dumps({
    'slogan': svg_paths('slogan.svg'),
    'android': svg_paths('android.svg')[0],
    'apple': svg_paths('apple.svg')[0],
    'qr': json.loads((ROOT / 'qr.json').read_text()),
}, ensure_ascii=False)
js = '\n'.join(p.read_text() for p in sorted(SRC.glob('*.js')))

page = (SRC / 'page.html').read_text()
for k, v in {'FONTS': '\n'.join(fonts), 'LOGO_SVG': logo_inline, 'GEO': geo, 'ASSETS': assets, 'LOGO_D': logo_d, 'FLAG_B64': flag_b64, 'JS': js}.items():
    page = page.replace('{{' + k + '}}', v)
OUT.write_text(page)
print(OUT, f'{OUT.stat().st_size / 1e6:.2f} MB')
