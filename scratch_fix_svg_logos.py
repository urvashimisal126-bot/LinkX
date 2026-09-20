import base64

with open('public/brand/linkx-mark@2x.png', 'rb') as f:
    b64_teal = base64.b64encode(f.read()).decode('ascii')

with open('public/brand/linkx-mark-white@2x.png', 'rb') as f:
    b64_white = base64.b64encode(f.read()).decode('ascii')

with open('public/brand/linkx-mark-ink@2x.png', 'rb') as f:
    b64_ink = base64.b64encode(f.read()).decode('ascii')

svg_teal = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 314 223" width="314" height="223">
  <image href="data:image/png;base64,{b64_teal}" width="314" height="223" />
</svg>'''

svg_white = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 314 223" width="314" height="223">
  <image href="data:image/png;base64,{b64_white}" width="314" height="223" />
</svg>'''

svg_ink = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 314 223" width="314" height="223">
  <image href="data:image/png;base64,{b64_ink}" width="314" height="223" />
</svg>'''

with open('public/brand/linkx-mark.svg', 'w', encoding='utf-8') as f:
    f.write(svg_teal)

with open('public/brand/linkx-mark-white.svg', 'w', encoding='utf-8') as f:
    f.write(svg_white)

with open('public/brand/linkx-mark-ink.svg', 'w', encoding='utf-8') as f:
    f.write(svg_ink)

with open('public/favicon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_teal)

print('Updated public/brand/ SVGs successfully!')
