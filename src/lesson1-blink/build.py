"""Build lesson1/index.html (single self-contained file) from the parts in this folder.
Run from the repo root:  python3 src/lesson1-blink/build.py"""
import os
here = os.path.dirname(os.path.abspath(__file__)) + '/'
root = os.path.abspath(here + '../../') + '/'
r = lambda f: open(here + f, encoding='utf-8').read()
head, body, sha = r('head.html'), r('body.html'), r('sha.js')
shared = lambda f: open(here + '../shared/' + f, encoding='utf-8').read()
head = head.replace('</style>', shared('kit.css') + '</style>', 1)
app = shared('kit.js') + '\n' + shared('help.js') + '\n' + '\n'.join(r(f) for f in ['core.js', 'hw.js', 'code.js', 'ext.js', 'report.js', 'glue.js'])
# a literal </script inside the JS (the report template) would end the tag early
app = app.replace('</script', '<\\/script').replace('<!--', '<\\!--')
sha = sha.replace('</script', '<\\/script')
scripts = f'<script id="shaSrc">\n{sha}</script>\n<script>\n"use strict";\n{app}\n</script>\n'
full = ('<!doctype html>\n<html lang="zh-Hant">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        + head + '\n</head>\n<body>\n' + body + '\n' + scripts + '</body>\n</html>\n')
os.makedirs(root + 'lesson1', exist_ok=True)
open(root + 'lesson1/index.html', 'w', encoding='utf-8').write(full)
print('wrote lesson1/index.html', len(full), 'bytes')
