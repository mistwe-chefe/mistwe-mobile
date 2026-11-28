# App-Logo „Taschenmesser“: waagerechter Griff, herausstehend Korkenzieher, Flaschenöffner, Schere (keine Klinge).
# Aufruf: python3 logo-quelle.py → logo.svg und logo-maskable.svg (Inhalt für maskable Icons verkleinert)
OUT = '#0b1220'
def outlined(d, w_out, w_in, cap='round'):
    return (f'<path d="{d}" fill="none" stroke="{OUT}" stroke-width="{w_out}" stroke-linecap="{cap}" stroke-linejoin="round"/>'
            f'<path d="{d}" fill="none" stroke="url(#steel)" stroke-width="{w_in}" stroke-linecap="{cap}" stroke-linejoin="round"/>')
def corkscrew():
    d = 'M0 0 V-46'
    y = -46
    for i in range(4):
        d += f' C22 {y-4} 22 {y-20} 0 {y-22} C-22 {y-24} -22 {y-40} 0 {y-44}' if i % 2 == 0 else ''
        y -= 44 if i % 2 == 0 else 0
    d = 'M0 0 V-40 C24 -44 24 -62 0 -66 C-24 -70 -24 -88 0 -92 C24 -96 24 -114 0 -118 C-20 -121 -20 -134 -4 -140'
    return outlined(d, 24, 12)
def opener():
    body = 'M-15 0 V-118 a15 15 0 0 1 15 -15 h2 a15 15 0 0 1 15 15 V-96 h-14 V-104 h-6 V0 Z'
    return (f'<path d="{body}" fill="url(#steel)" stroke="{OUT}" stroke-width="9" stroke-linejoin="round"/>'
            f'<path d="M-3 -30 V-80" stroke="#7d8898" stroke-width="5" stroke-linecap="round"/>')
def scissors():
    blade = 'M-11 0 L-17 -104 Q-16 -126 3 -121 L13 -8 Z'
    return (f'<g transform="rotate(-11)"><path d="{blade}" fill="url(#steel)" stroke="{OUT}" stroke-width="9" stroke-linejoin="round"/></g>'
            f'<g transform="rotate(13) scale(-1 1)"><path d="{blade}" fill="url(#steel2)" stroke="{OUT}" stroke-width="9" stroke-linejoin="round"/></g>'
            f'<circle cx="0" cy="-58" r="10" fill="url(#steel)" stroke="{OUT}" stroke-width="5"/>')
def svg(scale=1.0, bg=True):
    g = f'transform="translate(256 256) scale({scale}) translate(-256 -270)"'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3a55"/><stop offset="1" stop-color="#121a2b"/></linearGradient>
    <linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4a3d"/><stop offset=".55" stop-color="#e5281c"/><stop offset="1" stop-color="#b51a10"/></linearGradient>
    <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f4f7fb"/><stop offset="1" stop-color="#b3bdcc"/></linearGradient>
    <linearGradient id="steel2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#dfe5ee"/><stop offset="1" stop-color="#97a3b5"/></linearGradient>
  </defs>
  {'<rect width="512" height="512" fill="url(#bg)"/>' if bg else ''}
  <g {g}>
    <!-- herausstehende Werkzeuge (hinter dem Griff) -->
    <g transform="translate(172 300) rotate(-38)">{corkscrew()}</g>
    <g transform="translate(250 290) rotate(-4)">{opener()}</g>
    <g transform="translate(334 296) rotate(34)">{scissors()}</g>
    <!-- eingeklapptes Werkzeug unten -->
    <rect x="176" y="352" width="168" height="34" rx="16" fill="url(#steel)" stroke="{OUT}" stroke-width="9"/>
    <!-- Griff (waagerecht) -->
    <rect x="126" y="268" width="268" height="104" rx="52" fill="url(#body)" stroke="{OUT}" stroke-width="13"/>
    <path d="M168 288 H352 a34 34 0 0 1 22 9" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="8" stroke-linecap="round"/>
    <!-- Kreuz -->
    <g fill="#ffffff">
      <rect x="247" y="292" width="26" height="58" rx="2"/>
      <rect x="231" y="308" width="58" height="26" rx="2"/>
    </g>
    <!-- Nieten -->
    <circle cx="172" cy="320" r="9" fill="url(#steel)" stroke="{OUT}" stroke-width="4"/>
    <circle cx="348" cy="320" r="9" fill="url(#steel)" stroke="{OUT}" stroke-width="4"/>
  </g>
</svg>'''
if __name__ == '__main__':
    open('logo.svg', 'w').write(svg())
    open('logo-maskable.svg', 'w').write(svg(0.8))
