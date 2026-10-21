import { chromium } from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {validateShot,provenance} from '../src/recording.js';
const root=resolve(import.meta.dirname,'..'),shot=validateShot(JSON.parse(await readFile(process.argv[2]??resolve(root,'shots/landscape.json'),'utf8'))),out=resolve(process.argv[3]??resolve(root,'output/landscape'));
await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!path.startsWith(root+'/'))throw Error();res.setHeader('Content-Type',extname(path)==='.js'?'text/javascript':'text/html');res.end(await readFile(path));}catch{res.writeHead(404);res.end();}}).listen(0,'127.0.0.1');
let browser;
try{browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});const page=await browser.newPage({viewport:{width:shot.width,height:shot.height},deviceScaleFactor:1});await page.goto(`http://127.0.0.1:${server.address().port}/scripts/record.html`);await page.evaluate(s=>globalThis.setup(s),shot);
const frameHashes=[];for(let frame=0;frame<Math.ceil(shot.duration_ms/1000*shot.fps);frame++){await page.evaluate(f=>globalThis.draw(f),frame);const bytes=await page.locator('canvas').screenshot();frameHashes.push(createHash('sha256').update(bytes).digest('hex'));await writeFile(resolve(out,`${String(frame).padStart(6,'0')}.png`),bytes);}
execFileSync('ffmpeg',['-y','-loglevel','error','-framerate',String(shot.fps),'-i',resolve(out,'%06d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',resolve(out,'proof.mp4')]);
const source_commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();const source_hash=createHash('sha256').update(execFileSync('git',['diff','HEAD'],{cwd:root})).update(source_commit).digest('hex');
const env={browser:browser.version(),platform:process.platform,arch:process.arch,gpu:'ANGLE SwiftShader',device_scale_factor:1,source_commit,source_hash,ffmpeg:execFileSync('ffmpeg',['-version'],{encoding:'utf8'}).split('\n')[0]};const record=await provenance(shot,env,s=>createHash('sha256').update(s).digest('hex'));record.frame_hashes=frameHashes;await writeFile(resolve(out,'provenance.json'),JSON.stringify(record,null,2));console.log(JSON.stringify({out,frames:frameHashes.length,environment:env}));
}finally{await browser?.close();server.close();}
