const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
test('Embedded dossier cards use equal responsive heights and bounded stretched covers',()=>{
 const css=fs.readFileSync('app/style.css','utf8');
 assert.match(css,/\.body \.game-platform-card:not\(\.is-compact\)\{height:220px;min-height:0/);
 assert.match(css,/\.body \.game-platform-card:not\(\.is-compact\) \.game-platform-art img\{position:absolute;[^}]*margin:0;object-fit:fill/);
 assert.match(css,/\.body \.game-platform-card:not\(\.is-compact\) \.game-platform-copy\{[^}]*overflow:auto;[^}]*justify-content:safe center/);
 assert.match(css,/@media\(max-width:600px\)\{\.body \.game-platform-card:not\(\.is-compact\)\{height:460px;[^}]*grid-template-rows:160px minmax\(0,1fr\)/);
});
