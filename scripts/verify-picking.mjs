import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'..');
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!path.startsWith(root+'/'))throw Error();res.setHeader('Content-Type',extname(path)==='.js'?'text/javascript':'text/html');res.end(await readFile(path));}catch{res.writeHead(404);res.end();}}).listen(0,'127.0.0.1');
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CELESTIAL_CHROMIUM_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({deviceScaleFactor:2});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/examples/picking.html`);
 await page.locator('#mount[data-mode="webgl"]').waitFor();
 const point=await page.evaluate(async()=>{
  const {createScene}=await import('/src/scene.js');const {syntheticFixture}=await import('/src/fixtures.js');const {Vector3}=await import('three');
  const core=createScene(syntheticFixture('synthetic_geometry_001'),{moment_id:'moment_0'});core.camera.aspect=800/600;core.camera.updateProjectionMatrix();core.camera.updateMatrixWorld(true);
  const p=new Vector3(...core.state.bodies.find(b=>b.id==='sun').position).project(core.camera);const rect=document.querySelector('canvas').getBoundingClientRect();core.dispose();
  return {x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2};
 });
 await page.mouse.click(point.x,point.y);assert.deepEqual(JSON.parse(await page.locator('output').textContent()),{id:'sun',state:'pending'});
 await page.evaluate(()=>document.querySelector('output').textContent='unchanged');
 await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+15,point.y);await page.mouse.up();assert.equal(await page.locator('output').textContent(),'unchanged');
 await page.mouse.click(10,10);assert.equal(await page.locator('output').textContent(),'unchanged');
 await page.evaluate(()=>document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
 await page.locator('#mount[data-mode="2d"]').waitFor();
 const target=await page.evaluate(()=>{const r=document.querySelector('canvas').getBoundingClientRect();const radius=600*.37*(.68+.18*(-6+90)/180);return {x:r.left+400*r.width/800,y:r.top+(300-radius)*r.height/600};});
 await page.mouse.click(target.x,target.y);assert.deepEqual(JSON.parse(await page.locator('output').textContent()),{id:'sun',state:'pending'});assert.deepEqual(errors,[]);
 const proof={browser:browser.version(),deviceScaleFactor:2,canvasPixels:[800,600],cssPixels:[400,300],checks:['WebGL real pointer selects sun','CSS-scaled coordinates at DPR 2','drag does not select','empty click does not select','actual WebGL context loss switches canvas','fallback pointer selects same sun'],pageErrors:errors};
 await mkdir(resolve(root,'evidence'),{recursive:true});await writeFile(resolve(root,'evidence/picking-browser.json'),JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify(proof));
}finally{await browser?.close();server.close();}
