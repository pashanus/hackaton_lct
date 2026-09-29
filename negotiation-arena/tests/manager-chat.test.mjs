import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile} from 'node:fs/promises';
import {once} from 'node:events';
import os from 'node:os';
import path from 'node:path';
import {templates,createSession,applyAction,forkSession} from '../engine.mjs';
import {addManagerReply,managerLines,managerMedia} from '../manager-chat.mjs';
import {chatMedia,lastManagerReply} from '../public/chat-media.js';
import {createApp} from '../server.mjs';

test('Both training chats draw all ten different lines, preserve rules and decorate the final turn',()=>{
 for(const template of templates){
  let s=createSession(template);const lines=[];
  for(let i=0;i<10;i++){
   const old=structuredClone(s),input={type:'text',text:'привет'};
   const raw=applyAction(s,input);s=structuredClone(raw);
   assert.equal(addManagerReply(s,input,{pick:()=>0}),true);
   const reply=s.messages.at(-1);lines.push(reply.text);
   assert.ok(managerLines.includes(reply.text));assert.equal(reply.ruleText,raw.messages.at(-1).text);
   assert.deepEqual(s.state,raw.state);assert.deepEqual(s.result,raw.result);
   assert.deepEqual(old.messages,s.messages.slice(0,old.messages.length));
  }
  assert.equal(new Set(lines).size,10);assert.equal(s.status,'completed');
  assert.match(lastManagerReply(s),/ПОСЛЕДНИЙ ОТВЕТ/);
  const prefix=forkSession(s,3);assert.deepEqual(prefix.messages,s.messages.slice(0,5));
  const before=structuredClone(s);assert.equal(addManagerReply(s,{type:'text'},{pick:()=>0}),false);assert.deepEqual(s,before);
 }
});
test('Quick-choice and offer responses remain action-specific; later media can be absent',()=>{
 const start=createSession(templates[0]);let s=applyAction(start,{type:'interest'});const raw=structuredClone(s);
 assert.equal(addManagerReply(s,{type:'interest'},{pick:()=>0}),false);assert.deepEqual(s,raw);
 s=applyAction(s,{type:'text',text:'привет'});addManagerReply(s,{type:'text'},{pick:()=>0});assert.equal(s.messages.at(-1).attachment.type,'image');
 s=applyAction(s,{type:'text',text:'ещё'});addManagerReply(s,{type:'text'},{pick:n=>n===100?99:0});assert.equal(s.messages.at(-1).attachment,undefined);
 s=applyAction(s,{type:'text',text:'ладно'});addManagerReply(s,{type:'text'},{pick:n=>n===100?0:n-1});assert.equal(s.messages.at(-1).attachment.type,'video');
 assert.equal(managerMedia.length,7);
 assert.equal(managerMedia.filter(m=>m.type==='image').length,6);
 assert.ok(managerMedia.every(m=>m.src.startsWith('/media/chat-')));
});
test('Images, playable captioned video and final replies render safely',()=>{
 for(const a of managerMedia){const html=chatMedia({attachment:a});assert.ok(html.includes(a.src));assert.ok(html.includes(a.type==='video'?'<video':'<img'));if(a.captions)assert.match(html,/<track/);}
 assert.equal(chatMedia({attachment:{type:'image',src:'https://example.com/x.png'}}),'');
 const html=chatMedia({attachment:{...managerMedia[0],alt:'"><script>x</script>',caption:'<img onerror=x>'}});assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;img'));
});
test('API saves the random text and video, reload and restart keep the same reply',async t=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'arena-manager-'));
 const open=async()=>{const app=await createApp({dataDir:dir,managerPick:n=>n-1});app.listen(0,'127.0.0.1');await once(app,'listening');t.after(()=>new Promise(r=>app.close(r)));return `http://127.0.0.1:${app.address().port}`;};
 let base=await open();const post=async(route,body)=>{const r=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.ok(r.ok);return r.json();};
 const s=await post('/api/sessions',{scenarioId:'project'}),done=await post(`/api/sessions/${s.id}/actions`,{type:'text',text:'ну привет'}),reply=done.messages.at(-1);
 assert.equal(reply.source,'scripted-manager');assert.equal(reply.attachment.type,'video');
 assert.deepEqual(JSON.parse(await readFile(path.join(dir,'arena.json'),'utf8')).sessions[0].messages.at(-1),reply);
 base=await open();const restored=await (await fetch(base+`/api/sessions/${s.id}`)).json();assert.deepEqual(restored.messages,done.messages);
 assert.equal((await fetch(base+'/chat-media.js')).status,200);
});
