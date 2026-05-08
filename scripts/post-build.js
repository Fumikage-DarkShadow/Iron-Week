const fs = require('fs');
const path = require('path');

const indexPath = path.join('dist', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
const before = html;
html = html.replace(/<script src="([^"]+\.js)" defer>/g, '<script type="module" src="$1">');
fs.writeFileSync(indexPath, html);
console.log('post-build: patched index.html', before === html ? '(no change)' : '(script -> type=module)');
