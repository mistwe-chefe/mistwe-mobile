# Erzeugt das App-Logo als SVG. scale < 1 → Inhalt für maskable Icons verkleinern.
def svg(scale=1.0, bg=True):
    s = scale
    g = f'transform="translate(256 256) scale({s*1.08}) translate(-242 -256)"'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3a55"/><stop offset="1" stop-color="#121a2b"/></linearGradient>
    <linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4a3d"/><stop offset=".55" stop-color="#e5281c"/><stop offset="1" stop-color="#b51a10"/></linearGradient>
    <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f7fb"/><stop offset="1" stop-color="#a9b4c4"/></linearGradient>
  </defs>
  {'<rect width="512" height="512" fill="url(#bg)"/>' if bg else ''}
  <g {g}>
    <!-- Schlüsselring links -->
    <circle cx="92" cy="256" r="34" fill="none" stroke="url(#steel)" stroke-width="16"/>
    <!-- eingeklappte Werkzeuge, oben und unten leicht sichtbar -->
    <rect x="132" y="158" width="256" height="50" rx="22" fill="url(#steel)" stroke="#0b1220" stroke-width="10"/>
    <rect x="168" y="304" width="210" height="50" rx="22" fill="url(#steel)" stroke="#0b1220" stroke-width="10"/>
    <path d="M340 170 h22" stroke="#7d8898" stroke-width="7" stroke-linecap="round"/>
    <!-- Griff -->
    <rect x="96" y="186" width="330" height="140" rx="70" fill="url(#body)" stroke="#0b1220" stroke-width="14"/>
    <!-- Glanzkante -->
    <path d="M150 210 H372 a44 44 0 0 1 30 12" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="10" stroke-linecap="round"/>
    <!-- Kreuz / Plus -->
    <g fill="#ffffff">
      <rect x="243" y="216" width="34" height="80" rx="3"/>
      <rect x="220" y="239" width="80" height="34" rx="3"/>
    </g>
    <!-- Nieten -->
    <circle cx="150" cy="256" r="11" fill="url(#steel)" stroke="#0b1220" stroke-width="5"/>
    <circle cx="372" cy="256" r="11" fill="url(#steel)" stroke="#0b1220" stroke-width="5"/>
  </g>
</svg>'''
open('/tmp/logo/logo.svg','w').write(svg())
open('/tmp/logo/logo-maskable.svg','w').write(svg(0.78))
