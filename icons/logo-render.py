import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for src, out, size in [('logo.svg','icon-512-v3.png',512),('logo.svg','icon-192-v3.png',192),('logo.svg','apple-touch-icon-v3.png',180),('logo-maskable.svg','icon-maskable-512-v3.png',512),('logo.svg','preview-64.png',64)]:
            pg = await b.new_page(viewport={'width': size, 'height': size})
            svg = open('/tmp/logo/'+src).read().replace('width="512" height="512"', f'width="{size}" height="{size}"', 1)
            await pg.set_content(f'<html><body style="margin:0">{svg}</body></html>')
            await pg.screenshot(path='/tmp/logo/'+out, omit_background=False)
            await pg.close()
        await b.close()
asyncio.run(main())
