import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,stat} from 'node:fs/promises';
import {once} from 'node:events';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server.mjs';
import {createIncident,actIncident} from '../incident.mjs';
import {progression,attemptXP,ranks} from '../public/progression.js';
import {mediaClips,mediaFiles} from '../public/media-catalog.js';

function completed(){let s=createIncident();for(const choice of ['virus','correct','repair','confirm'])s=actIncident(s,{choice,stage:s.stage});return s;}
test('XP follows real outcomes; active, instant exit and old shows do not award XP',()=>{
 const s=completed();assert.equal(attemptXP(s),110);
 assert.equal(attemptXP(createIncident()),0);assert.equal(attemptXP({...s,turn:1}),0);
 const p=progression({sessions:[],incidents:[s,s],shows:[{id:'legacy',status:'completed',result:{score:100}}]});
 assert.equal(p.xp,110);assert.equal(p.rank.name,'normie');assert.equal(p.completed,1);
 assert.equal(progression({}).rank.name,'sub 3');
 assert.equal(attemptXP({...s,result:{...s.result,score:100,game:{ending:{id:'resilient'}}}}),140);
 assert.equal(attemptXP({...s,result:{...s.result,score:60,outcome:'unresolved'}}),70);
});
test('Each rank threshold, bounded meter and final rank are derived from saved attempts',()=>{
 for(const [n,name] of [[0,'sub 3'],[1,'normie'],[3,'chad'],[5,'gigachad'],[7,'true adam']]){
  const s=completed(),p=progression({incidents:Array.from({length:n},(_,i)=>({...s,id:String(i)}))});
  assert.equal(p.rank.name,name);assert.ok(p.percent>=0&&p.percent<=100);
 }
 const p=progression({incidents:Array.from({length:7},(_,i)=>({...completed(),id:String(i)}))});assert.equal(p.next,null);assert.equal(p.remaining,0);
 assert.equal(ranks.at(-1).xp,700);
});
test('XP survives a server restart and repeated reads do not award again',async t=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'arena-training-'));
 const open=async()=>{const app=await createApp({dataDir:dir});app.listen(0,'127.0.0.1');await once(app,'listening');t.after(()=>new Promise(r=>app.close(r)));return `http://127.0.0.1:${app.address().port}`;};
 let url=await open();const post=async(route,body)=>(await fetch(url+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})).json();
 let s=await post('/api/incidents',{});for(const choice of ['virus','correct','repair','confirm'])s=await post(`/api/incidents/${s.id}/actions`,{stage:s.stage,choice});
 for(let i=0;i<2;i++)assert.equal(progression(await (await fetch(url+'/api/bootstrap')).json()).xp,110);
 url=await open();assert.equal(progression(await (await fetch(url+'/api/bootstrap')).json()).xp,110);
});
test('Local video streaming supports seek, suffix, HEAD and invalid ranges; media and VTT exist',async t=>{
 const app=await createApp({dataDir:await mkdtemp(path.join(os.tmpdir(),'arena-media-'))});app.listen(0,'127.0.0.1');await once(app,'listening');t.after(()=>new Promise(r=>app.close(r)));
 const base=`http://127.0.0.1:${app.address().port}`;
 for(const file of mediaFiles){assert.ok((await stat(new URL('../public'+file,import.meta.url))).size>0);const r=await fetch(base+file,{method:'HEAD'});assert.equal(r.status,200,file);}
 const file=mediaClips[0].src,bytes=await readFile(new URL('../public'+file,import.meta.url));
 let r=await fetch(base+file,{headers:{Range:'bytes=4-99'}});assert.equal(r.status,206);assert.equal(r.headers.get('Content-Range'),`bytes 4-99/${bytes.length}`);assert.deepEqual(Buffer.from(await r.arrayBuffer()),bytes.subarray(4,100));
 r=await fetch(base+file,{headers:{Range:'bytes=-16'}});assert.deepEqual(Buffer.from(await r.arrayBuffer()),bytes.subarray(-16));
 for(const range of ['bytes=99999999-','bytes=9-3','bytes=0-1,4-6','bytes=-0'])assert.equal((await fetch(base+file,{headers:{Range:range}})).status,416);
 r=await fetch(base+file,{method:'HEAD',headers:{Range:'bytes=0-15'}});assert.equal(r.status,206);assert.equal(r.headers.get('Content-Length'),'16');assert.equal(await r.text(),'');
 const vtt=await fetch(base+mediaClips.find(v=>v.captions).captions);assert.match(vtt.headers.get('Content-Type'),/^text\/vtt/);assert.match(await vtt.text(),/^WEBVTT/);
 assert.equal((await fetch(base+'/media/private.mp4')).status,404);
});
