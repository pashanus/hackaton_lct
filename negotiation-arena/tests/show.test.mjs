import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {once} from 'node:events';
import os from 'node:os';
import path from 'node:path';
import {createShow,actShow,publicShow,sceneCatalog} from '../show.mjs';
import {showView,showExport} from '../public/show-ui.js';
import {createApp} from '../server.mjs';
import {createIncident} from '../incident.mjs';
import {createSession,templates} from '../engine.mjs';

const start=id=>createShow('test-id',{mode:'free',sceneId:id});
const act=(s,action,text)=>actShow(s,{revision:s.revision,action,text});
const play=(id,actions)=>actions.reduce((s,a)=>Array.isArray(a)?act(s,...a):act(s,a),start(id));
function nextScene(s,id){if(s.scene!=='interlude')s=act(s,'continue');s=act(s,'choose');return act(s,'scene-'+id);}

test('28 сцен доступны; все показанные действия применимы, не меняют исходник и имеют выход',()=>{
 assert.deepEqual(sceneCatalog.map(x=>x.id),Array.from({length:28},(_,i)=>String(i+1).padStart(2,'0')));
 for(const c of sceneCatalog){
  const queue=[{s:start(c.id),depth:0}],seen=new Set();let checked=0;
  while(queue.length&&checked<180){
   const {s,depth}=queue.shift(),key=JSON.stringify(s.local);if(seen.has(key))continue;seen.add(key);checked++;
   const view=publicShow(s).view;assert.ok(view.actions.some(x=>x.id==='continue'),c.id);
   assert.equal(act(s,'end-run').status,'completed');
   for(const a of view.actions){
    const before=structuredClone(s),r=act(s,a.id,a.input||a.capture?'Тестовое объяснение':undefined);
    assert.deepEqual(s,before);assert.equal(r.revision,s.revision+1);
    if(r.scene===c.id&&depth<4)queue.push({s:r,depth:depth+1});
   }
  }
 }
});
test('Четыре легенды открывают разные сцены; честный ответ тоже имеет продолжение',()=>{
 for(const [action,scene] of Object.entries({research:'01',virus:'02',colleague:'03',ai:'04'})){
  const s=act(createShow('incident',{mode:'incident'}),action);assert.equal(s.scene,scene);
 }
 const s=act(createShow('incident',{mode:'incident'}),'honest');assert.equal(s.scene,'interlude');assert.equal(s.facts[0].key,'honest');assert.equal(act(s,'next').scene,'11');
});
test('Исследование и собственное объяснение сохраняются дословно; пустое объяснение отклоняется',()=>{
 let s=play('01',['files','left']);assert.equal(s.local.step,'explain');assert.throws(()=>act(s,'save',' '));
 s=act(s,'save','Это результат, который я утвердил.');assert.equal(s.facts[0].value,'Это результат, который я утвердил.');assert.equal(s.facts[0].image,'research_evidence');
 assert.equal(s.scene,'interlude');
});
test('Картинка, утверждённая логотипом, объяснение, должность и сертификат переживают переходы',()=>{
 let s=play('21',['logo']);s=nextScene(s,'24');s=act(s,'metaphor');s=act(s,'save','Метафора нашего результата.');s=nextScene(s,'27');
 s=act(s,'role');s=act(s,'role-2');assert.equal(publicShow(s).view.certificate,true);
 const html=showView(publicShow(s),sceneCatalog);assert.match(html,/Утвердил новый логотип/);assert.match(html,/Метафора нашего результата/);assert.match(html,/Я просто рядом стоял/);
 s=act(s,'approve');s=act(s,'finish');assert.equal(s.status,'completed');assert.match(showExport(s),/Метафора нашего результата/);
 assert.throws(()=>act(s,'continue'));
});
test('Текст игрока экранируется на сцене, в подписи, сертификате и итогах',()=>{
 let s=play('26',[['save','<img src=x onerror="alert(1)">']]);
 for(const attempt of [s,act(s,'end-run')]){const html=showView(publicShow(attempt),sceneCatalog);assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('&lt;img src=x'));}
 assert.throws(()=>act(start('24'),'save','a'.repeat(401)));
 assert.throws(()=>act(start('24'),'save',{text:'fake'}));
});
test('Вирус, звук, качество, команда, подпись и последний вопрос дают собственные результаты',()=>{
 const virus=play('02',['start','who','senior']);assert.equal(virus.facts[0].image,'virus_expert');
 const audio=play('06',['on','silent','louder','ok']);assert.equal(audio.facts[0].label,'Настроил звук у PNG');
 const quality=play('13',['fix','optimize','accept']);assert.match(quality.facts[0].label,/одну большую/);
 const team=play('15',['another','remote','show']);assert.match(team.facts[0].label,/удалённым/);
 const caption=play('26',[['save','Первая версия'],'edit',['save','Вторая версия']]);assert.equal(caption.facts.find(x=>x.key==='old-caption').value,'Первая версия');
 const ending=play('28',['none','last','pass','end']);assert.equal(ending.status,'completed');assert.ok(ending.visited.includes('28'));
});
test('Маршрут проходит все 9 сцен, без выдуманных достижений при пропуске',()=>{
 let s=createShow('tour');const ids=[];
 while(s.status==='active'){
  if(s.scene==='interlude')s=act(s,publicShow(s).view.actions.some(a=>a.id==='next')?'next':'finish');
  else {ids.push(s.scene);s=act(s,'continue');}
 }
 assert.deepEqual(ids,['01','03','08','11','15','21','24','27','28']);assert.deepEqual(s.facts,[]);assert.equal(s.visited.length,9);
});
test('Повтор и устаревший клик не меняют результат; из длинной попытки можно выйти',()=>{
 const original=start('07'),s=act(original,'bigger');assert.throws(()=>actShow(s,{revision:0,action:'bigger'}));assert.equal(s.local.count,1);
 assert.throws(()=>act(original,'nonexistent'));
 for(const config of [{mode:'other'},{mode:'free',sceneId:'29'}])assert.throws(()=>createShow('id',config));
 s.events=Array.from({length:1000},()=>({}));assert.equal(publicShow(s).view.actions.length,0);assert.equal(act(s,'end-run').status,'completed');
 assert.equal(publicShow(original).events,undefined);assert.equal(publicShow(original).view.actions[0].run,undefined);
});
test('API: старые данные, атомарные клики, повтор, восстановление и локальные картинки',async t=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'arena-shows-'));
 const old={configs:Object.fromEntries(templates.map(c=>[c.id,c])),sessions:[createSession(templates[0])],incidents:[createIncident()]};
 await writeFile(path.join(dir,'arena.json'),JSON.stringify(old));
 const open=async()=>{const app=await createApp({dataDir:dir});app.listen(0,'127.0.0.1');await once(app,'listening');t.after(()=>new Promise(r=>app.close(r)));return `http://127.0.0.1:${app.address().port}`;};
 const url=await open();
 const post=async(base,route,body)=>{const r=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};};
 const created=await post(url,'/api/shows',{mode:'free',sceneId:'21'});assert.equal(created.status,201);
 const route=`/api/shows/${created.body.id}/actions`,action={revision:0,action:'logo'};
 const results=await Promise.all([post(url,route,action),post(url,route,action)]);assert.deepEqual(results.map(x=>x.status).sort(),[200,400]);
 const stored=JSON.parse(await readFile(path.join(dir,'arena.json'),'utf8'));assert.deepEqual(stored.sessions,JSON.parse(JSON.stringify(old.sessions)));assert.deepEqual(stored.incidents,JSON.parse(JSON.stringify(old.incidents)));assert.equal(stored.shows[0].facts[0].key,'logo');
 stored.shows[0].assets.research_evidence.alt='Ранняя подпись картинки';await writeFile(path.join(dir,'arena.json'),JSON.stringify(stored));
 const next=await open();const boot=await(await fetch(next+'/api/bootstrap')).json();assert.equal(boot.sceneCatalog.length,28);assert.equal(boot.shows[0].revision,1);assert.equal(boot.shows[0].facts[0].key,'logo');
 const repeated=await post(next,'/api/shows',{previousId:created.body.id,mode:'tour'});assert.equal(repeated.body.scene,'21');assert.deepEqual(repeated.body.facts,[]);assert.equal(repeated.body.revision,0);assert.equal(repeated.body.assets.research_evidence.alt,'Ранняя подпись картинки');
 for(const {src} of Object.values(boot.shows[0].assets)){const r=await fetch(next+src);assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/image\/svg/);assert.match(await r.text(),/<svg/);}
 for(const asset of ['/show-ui.js','/show.css','/meme-assets.js'])assert.equal((await fetch(next+asset)).status,200);
 assert.equal((await fetch(next+'/show.mjs')).status,404);assert.equal((await fetch(next+'/memes/absent.svg')).status,404);
 assert.equal((await post(next,'/api/shows',{previousId:'missing'})).status,400);
});
