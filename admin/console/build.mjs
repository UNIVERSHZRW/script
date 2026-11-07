import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const esbuild=require(process.env.ESBUILD_PATH||'esbuild');
const acorn=require('acorn');
await mkdir('dist',{recursive:true});
const version=createHash('sha256').update(await readFile('shell.js')).update(await readFile('shell.html')).update(await readFile('shell.css')).update(await readFile('uploads-client.js')).update(await readFile('child-bridge.js')).update(await readFile('child.css')).update(await readFile('core.mjs')).update(await readFile('original/univershzrw-admin.mjs')).update(await readFile('build.mjs')).digest('hex').slice(0,12);
await esbuild.build({entryPoints:['uploads-client.js'],outfile:'dist/admin-uploads.js',bundle:true,minify:true,platform:'browser',format:'iife',target:['es2022'],legalComments:'eof'});
const read=name=>readFile(name,'utf8');
function replaceLiterals(source,values){const ast=acorn.parse(source,{ecmaVersion:'latest',sourceType:'module'}),edits=[];for(const node of ast.body)if(node.type==='VariableDeclaration')for(const d of node.declarations)if(d.id.type==='Identifier'&&Object.hasOwn(values,d.id.name))edits.push({start:d.init.start,end:d.init.end,value:JSON.stringify(values[d.id.name])});if(edits.length!==Object.keys(values).length)throw Error('Asset replacement mismatch');return edits.sort((a,b)=>b.start-a.start).reduce((s,e)=>s.slice(0,e.start)+e.value+s.slice(e.end),source);}
function change(source,a,b){if(!source.includes(a))throw Error('Missing expected source marker: '+a.slice(0,100));return source.replace(a,b);}
function functionReplace(source,name,body){const ast=acorn.parse(source,{ecmaVersion:'latest',sourceType:'module'}),node=ast.body.find(x=>x.type==='FunctionDeclaration'&&x.id.name===name);if(!node)throw Error('Missing function '+name);return source.slice(0,node.start)+body+source.slice(node.end);}
const child=`<link rel="stylesheet" href="/_uhz/admin-child.css?v=${version}"><script src="/_uhz/admin-uploads.js?v=${version}"></script><script defer src="/_uhz/admin-child.js?v=${version}"></script>`;
const primaryOriginal=await read('original/univershzrw-admin.mjs');let primary=primaryOriginal;
const originalAST=acorn.parse(primary,{ecmaVersion:'latest',sourceType:'module'}),texts={};for(const node of originalAST.body)if(node.type==='VariableDeclaration')for(const d of node.declarations)if(d.id.type==='Identifier'&&d.init?.type==='Literal'&&typeof d.init.value==='string')texts[d.id.name]=d.init.value;
const assets={SHELL:(await read('shell.html')).replaceAll('__VERSION__',version),SHELL_JS:await read('shell.js'),SHELL_CSS:await read('shell.css')};
for(const name of ['LEGACY_HTML','ECONOMY_ADMIN_HTML','CATALOG_HTML','ADVANCED_TOOLS_HTML','CREATOR_HTML','LICENSE_HTML','GUARDIAN_HTML'])assets[name]=texts[name].replace('</head>',child+'</head>');
assets.LEGACY_HTML=assets.LEGACY_HTML.replaceAll('UNIVERSHZRW-BETA','UNIVERSHZRW').replaceAll('/_uhz/admin-bridge.js','/_uhz/admin-bridge.js?v='+version);
assets.LEGACY_HTML=assets.LEGACY_HTML.replaceAll("connect-src 'self' https://kgqkszlennwhlyngktcc.supabase.co;", "connect-src 'self' https://kgqkszlennwhlyngktcc.supabase.co https://kgqkszlennwhlyngktcc.storage.supabase.co;");
assets.ADMIN_BRIDGE=change(texts.ADMIN_BRIDGE,'return storage};\n};','return storage};\n if(window.UHZUploads)window.UHZUploads.installStorage(client);\n};');
assets.ECONOMY_ADMIN_JS=change(texts.ECONOMY_ADMIN_JS,"const image=val('preview_image_url');", "let image=val('preview_image_url');if(/^https:\\/\\/univershzrw[.]com\\/_uhz\\/catalog-images\\/[0-9a-f-]{36}[.]webp$/.test(image))image=location.origin+'/api/catalog-media/'+image.split('/').pop();");
primary=replaceLiterals(primary,assets);
primary=change(primary,"const assets={'/catalogo.js'",`const assets={'/_uhz/admin-uploads.js':[ADMIN_UPLOADS_JS,'application/javascript'],'/_uhz/admin-child.js':[ADMIN_CHILD_JS,'application/javascript'],'/_uhz/admin-child.css':[ADMIN_CHILD_CSS,'text/css'],'/catalogo.js'`);
primary="const ADMIN_UPLOADS_JS="+JSON.stringify(await read('dist/admin-uploads.js'))+';\nconst ADMIN_CHILD_JS='+JSON.stringify(await read('child-bridge.js'))+';\nconst ADMIN_CHILD_CSS='+JSON.stringify(await read('child.css'))+';\n'+primary;
primary=primary.replaceAll("user?.role!=='superadmin'","(user?.role!=='superadmin'||user?.email?.toLowerCase()!=='univershzrw@gmail.com')");
primary=change(primary,"const res=response(req.method==='HEAD'?null:LEGACY_HTML);", "const res=response(req.method==='HEAD'?null:SHELL);res.headers.set('X-UHZ-Admin-Shell','2');");
const oldCSP=`default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'`;
const newCSP=`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; connect-src 'self' https://kgqkszlennwhlyngktcc.storage.supabase.co https://kgqkszlennwhlyngktcc.supabase.co; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'`;
// Root is a native authenticated shell; the legacy module retains its inline CRUD scripts.
const rootStart=primary.indexOf("if(p==='/'||p==='/index.html'||p==='/control')"),rootEnd=primary.indexOf("if(p==='/favicon.ico')",rootStart);
primary=primary.slice(0,rootStart)+primary.slice(rootStart,rootEnd).replace(oldCSP,newCSP)+primary.slice(rootEnd);
primary=primary.replace('cleanup-20261029-1-',`console-${version}-`);
primary=change(primary,"html=html.replace('</head>','<link rel=\"stylesheet\" href=\"/panel.css\"><script defer src=\"/panel.js\"></script></head>');",`html=html.replace('</head>',${JSON.stringify(child+'<link rel="stylesheet" href="/panel.css"><script defer src="/panel.js"></script></head>')});`);
// All embedded editors use the same signed, resumable upload service.
primary=primary.replaceAll("connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'", "connect-src 'self' https://kgqkszlennwhlyngktcc.storage.supabase.co https://kgqkszlennwhlyngktcc.supabase.co; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'");
primary=primary.replaceAll("connect-src 'self';", "connect-src 'self' https://kgqkszlennwhlyngktcc.storage.supabase.co https://kgqkszlennwhlyngktcc.supabase.co;");
await writeFile('dist/univershzrw-admin.mjs',primary);
let proxy=await read('original/univershzrw-comunidad.mjs');
proxy="const ownerIdentityUser=u=>!!u&&String(u.email||'').toLowerCase()==='univershzrw@gmail.com'&&u.uhz_status?.role==='superadmin';\nconst ownerUser=u=>ownerIdentityUser(u)&&!u.uhz_status?.must_change_password;\n"+proxy;
proxy=proxy.replaceAll('limited(env.WRITE_LIMIT,','limited(env.WRITE_LIMIT||env.API_LIMIT,');
proxy=proxy.replaceAll("s.u.uhz_status?.role!=='superadmin'","!ownerUser(s.u)").replaceAll("u.uhz_status?.role!=='superadmin'","!ownerUser(u)").replaceAll("session.u?.uhz_status?.role!=='superadmin'","!ownerUser(session.u)");
proxy=proxy.replace("if(isAdminHost(req)&&s.u&&!ownerUser(s.u))", "if(isAdminHost(req)&&s.u&&!ownerIdentityUser(s.u))").replace("if(isAdminHost(req)&&!ownerUser(u)){await supabaseFetch('/auth/v1/logout", "if(isAdminHost(req)&&!ownerIdentityUser(u)){await supabaseFetch('/auth/v1/logout");
proxy=change(proxy,"||path==='/functions/v1/uhz-inft-wallet')permitted", "||path==='/functions/v1/uhz-inft-wallet'||path==='/functions/v1/uhz-admin-control')permitted");
proxy=change(proxy,"if(!permitted)return apiResponse({message:'Ruta no permitida.'},404);", "if(path==='/functions/v1/uhz-admin-control'&&!isAdminHost(req))return apiResponse({message:'Usa el centro de administración.'},403);\n  if(!permitted)return apiResponse({message:'Ruta no permitida.'},404);");
proxy=change(proxy,"path==='/functions/v1/uhz-inft-wallet'?45000:10000", "['/functions/v1/uhz-inft-wallet','/functions/v1/uhz-admin-control'].includes(path)?45000:10000");
proxy=change(proxy,"const body=await jsonBody(req);\n   if(['signup','recover']", "const body=await jsonBody(req);\n   if(isAdminHost(req)&&['token','recover'].includes(action)&&body.email&&String(body.email).trim().toLowerCase()!=='univershzrw@gmail.com')return apiResponse({message:'Usa la cuenta propietaria de UNIVERSHZRW.'},403);\n   if(['signup','recover']");
proxy=functionReplace(proxy,'catalogMedia',await read('catalog-media.mjs'));
await writeFile('dist/univershzrw-comunidad.mjs',proxy);
let wrapper=await read('original/univershzrw-admin-guardian-ui.mjs');
wrapper=change(wrapper,"if(request.method!=='GET'||!response.ok", "if(response.headers.get('X-UHZ-Admin-Shell')==='2')return response;\n if(request.method!=='GET'||!response.ok");
wrapper=wrapper.replace("user?.role==='superadmin'&&!user.must_change_password", "user?.role==='superadmin'&&user?.email?.toLowerCase()==='univershzrw@gmail.com'&&!user.must_change_password");
const wrapperAST=acorn.parse(wrapper,{ecmaVersion:'latest',sourceType:'module'});let guardian;for(const node of wrapperAST.body)if(node.type==='VariableDeclaration')for(const d of node.declarations)if(d.id.name==='GUARDIAN_HTML')guardian=d.init.value;
wrapper=replaceLiterals(wrapper,{GUARDIAN_HTML:guardian.replace('</head>',child+'</head>')});
await writeFile('dist/univershzrw-admin-guardian-ui.mjs',wrapper);
let finance=await read('original/univershzrw-inft-panel.mjs');
// The financial ledger and customer panel stay unchanged; only admin embedding is enabled.
finance=change(finance,"let body=FILES[name];","let body=FILES[name];const security=u.hostname==='admin.univershzrw.com'?{...SECURITY,'x-frame-options':'SAMEORIGIN','content-security-policy':SECURITY['content-security-policy'].replace(\"frame-ancestors 'none'\",\"frame-ancestors 'self'\")}:SECURITY;");
finance=change(finance,"if(name==='panel.html')body=body.replaceAll('__BASE__',base);","if(name==='panel.html'){body=body.replaceAll('__BASE__',base);if(u.hostname==='admin.univershzrw.com'&&u.searchParams.get('embed')==='1')body=body.replace('</head>',"+JSON.stringify(child)+"+'</head>');}");
finance=change(finance,"headers:{...SECURITY,'content-type':type","headers:{...security,'content-type':type");
await writeFile('dist/univershzrw-inft-panel.mjs',finance);
for(const file of ['dist/univershzrw-admin.mjs','dist/univershzrw-comunidad.mjs','dist/univershzrw-admin-guardian-ui.mjs','public-files-worker.mjs','dist/univershzrw-inft-panel.mjs'])acorn.parse(await read(file),{ecmaVersion:'latest',sourceType:'module'});
await esbuild.transform(await read('index.ts'),{loader:'ts',format:'esm'});
console.log(JSON.stringify({version,workers:['univershzrw-admin','univershzrw-comunidad','univershzrw-admin-guardian-ui'],signedUploadBundle:(await read('dist/admin-uploads.js')).length}));
