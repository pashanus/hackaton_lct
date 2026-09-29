import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {once} from 'node:events';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server.mjs';
import {methods,methodLaunch,methodDetail,methodPage} from '../public/satire-ui.js';

test('Every lesson opens a ready training attempt through its single CTA',async t=>{
 const app=await createApp({dataDir:await mkdtemp(path.join(os.tmpdir(),'arena-lessons-'))});
 app.listen(0,'127.0.0.1');await once(app,'listening');t.after(()=>new Promise(r=>app.close(r)));
 const base=`http://127.0.0.1:${app.address().port}`,catalog=methodPage();
 for(const method of methods){
  assert.ok(catalog.includes(`#method/${method.id}`));
  const html=methodDetail(method.id),launch=methodLaunch(method.id);
  assert.equal((html.match(/<button /g)||[]).length,1);
  assert.ok(html.includes(`data-try-method="${method.id}"`));
  const response=await fetch(base+launch.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(launch.body)});
  assert.equal(response.status,201,method.id);
  const session=await response.json();
  assert.equal(session.status,'active');assert.equal(session.turn,0);assert.ok(session.messages.length>0);
  const saved=await (await fetch(`${base}${launch.endpoint}/${session.id}`)).json();assert.equal(saved.id,session.id);
  if(launch.route==='session'){assert.equal(session.config.id,launch.body.scenarioId);assert.equal(session.maxTurns,6);assert.equal(session.game.resource.id,'intel');}
  else assert.equal(session.stage,'opening');
 }
 for(const invalid of ['missing','__proto__','constructor']){assert.equal(methodLaunch(invalid),null);assert.ok(!methodDetail(invalid).includes('data-try-method'));}
});
