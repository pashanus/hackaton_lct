import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile} from 'node:fs/promises';
import {once} from 'node:events';
import os from 'node:os';
import path from 'node:path';
import {createIncident,actIncident,publicIncident} from '../incident.mjs';
import {createApp} from '../server.mjs';

function play(actions,config={}){let s=createIncident(config);for(const choice of actions)s=actIncident(s,{stage:s.stage,choice});return s;}
test('Честность, вопрос, конкретный план и фиксация дают соглашение на любой сложности',()=>{
 for(const difficulty of [1,2,3]){const s=play(['admit','ask','repair','confirm'],{difficulty});assert.equal(s.result.outcome,'agreement');assert.equal(s.result.score,100);assert.equal(publicIncident(s).choices.length,0);}
});
test('Ларпинг исследования не заменяет признание факта, даже при хорошем плане',()=>{
 const s=play(['research','ask','repair','confirm']);assert.equal(s.result.outcome,'unresolved');assert.equal(s.result.criteria[0].passed,false);
});
test('Можно исправить ложь, но нельзя получить балл за незаданный вопрос',()=>{
 const s=play(['virus','correct','repair','confirm'],{difficulty:2});assert.equal(s.result.outcome,'agreement');assert.equal(s.result.score,80);assert.equal(s.result.criteria[1].passed,false);
});
test('Уточнение на последнем ходу превращает пустое обещание в проверяемый план',()=>{
 assert.equal(play(['admit','ask','promise','confirm']).result.outcome,'unresolved');
 assert.equal(play(['admit','ask','promise','clarify']).result.outcome,'agreement');
});
test('Лишние обещания и давление не дают успешного исхода',()=>{
 assert.equal(play(['admit','ask','overreach','confirm']).result.outcome,'unresolved');
 const s=play(['admit','ask','threaten']);assert.equal(s.status,'completed');assert.equal(s.result.outcome,'rupture');assert.equal(s.turn,3);
});
test('Пауза — самостоятельный финал без балла за договорённость',()=>{
 const s=play(['admit','ask','repair','withdraw']);assert.equal(s.result.outcome,'withdraw');assert.equal(s.result.criteria[4].passed,false);
});
test('Устаревшие и поддельные действия не меняют состояние; завершённый кейс закрыт',()=>{
 const s=createIncident(),copy=structuredClone(s);
 for(const action of [{choice:'confirm',stage:'opening'},{choice:'admit',stage:'terms'}])assert.throws(()=>actIncident(s,action));
 assert.deepEqual(s,copy);
 const ended=play(['admit','ask','repair','confirm']);assert.throws(()=>actIncident(ended,{choice:'confirm',stage:'confirm'}));
 for(const config of [{difficulty:0},{difficulty:4},{tone:'<script>'}])assert.throws(()=>createIncident(config));
});
test('API сохраняет кейс после перезапуска, отклоняет повтор одного действия и сохраняет условия повтора',async t=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'arena-incident-'));
 const open=async()=>{const app=await createApp({dataDir:dir});app.listen(0,'127.0.0.1');await once(app,'listening');t.after(()=>new Promise(r=>app.close(r)));return `http://127.0.0.1:${app.address().port}`;};
 const url=await open();const post=async(base,route,body)=>{const r=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};};
 const first=await post(url,'/api/incidents',{difficulty:3,tone:'friendly'});assert.equal(first.status,201);
 const route=`/api/incidents/${first.body.id}/actions`;
 const input={stage:'opening',choice:'admit'};
 const results=await Promise.all([post(url,route,input),post(url,route,input)]);assert.deepEqual(results.map(x=>x.status).sort(),[200,400]);
 const saved=JSON.parse(await readFile(path.join(dir,'arena.json'),'utf8'));assert.equal(saved.incidents.length,1);assert.equal(saved.incidents[0].turn,1);assert.equal(saved.sessions.length,0);
 const next=await open();const restored=await (await fetch(next+'/api/bootstrap')).json();assert.equal(restored.incidents[0].turn,1);assert.equal(restored.incidents[0].events,undefined);
 const repeat=await post(next,'/api/incidents',{previousId:first.body.id,difficulty:1});assert.equal(repeat.body.config.difficulty,3);assert.equal(repeat.body.config.tone,'friendly');assert.equal(repeat.body.turn,0);
 for(const asset of ['/satire-ui.js','/satire.css']){const r=await fetch(next+asset);assert.equal(r.status,200);assert.ok((await r.text()).length>100);}
 assert.equal((await post(next,'/api/incidents',{previousId:'absent'})).status,400);
 assert.equal((await fetch(next+'/incident.mjs')).status,404);
});
