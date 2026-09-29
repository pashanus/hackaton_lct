import test from 'node:test';
import assert from 'node:assert/strict';
import { templates, createSession, applyAction, forkSession, publicSession } from '../engine.mjs';

const act=(s,type,extra={})=>applyAction(s,{type,...extra});
const packet={price:108,day:10,advance:30,partial:false};

test('Ветка восстанавливает состояние перед выбранным ходом, сохраняя исходную попытку',()=>{
  const start=createSession(templates[0]);
  const prefix=act(start,'interest');
  let parent=act(prefix,'pressure');
  parent=act(parent,'pressure');
  parent=act(parent,'pressure');
  const frozen=structuredClone(parent);
  let branch=forkSession(parent,2);
  assert.notEqual(branch.id,parent.id);
  assert.equal(branch.previousId,parent.id);
  assert.equal(branch.fork.beforeTurn,2);
  assert.equal(branch.status,'active');
  assert.equal(branch.turn,1);
  assert.equal(branch.result,null);
  assert.equal(branch.completedAt,undefined);
  assert.deepEqual(branch.state,prefix.state);
  assert.deepEqual(branch.messages,prefix.messages);
  assert.deepEqual(branch.events,prefix.events);
  branch=act(branch,'reason');
  branch=act(branch,'offer',{offer:packet});
  branch=act(branch,'accept');
  assert.equal(branch.result.outcome,'agreement');
  assert.equal(parent.result.outcome,'breakdown');
  assert.deepEqual(parent,frozen);
  assert.equal(branch.result.rubricVersion,parent.result.rubricVersion);
});

test('Возврат перед подтверждением сохраняет точный пакет; замена предложения не меняет родителя',()=>{
  let parent=act(createSession(templates[0]),'offer',{offer:packet});
  const pending=structuredClone(parent.state.pending);
  parent=act(parent,'accept');
  const branch=forkSession(parent,2);
  assert.deepEqual(branch.state.pending,pending);
  assert.equal(act(branch,'accept').result.outcome,'agreement');
  const changed=act(branch,'offer',{offer:{...packet,price:120}});
  assert.equal(act(changed,'accept').result.outcome,'unfavorable');
  assert.equal(parent.result.offer.price,108);
});

test('Первый ход даёт чистое состояние; наследуемые точки можно переиграть ещё раз',()=>{
  let parent=createSession(templates[1]);
  for(const type of ['interest','reason','exchange'])parent=act(parent,type);
  let branch=forkSession(parent,3);
  assert.deepEqual(publicSession(branch).replayableTurns,[1,2]);
  branch=act(branch,'boundary');
  const nested=forkSession(branch,1);
  assert.equal(nested.turn,0);
  assert.equal(nested.messages.length,1);
  assert.equal(nested.state.trust,60);
  assert.equal(nested.state.interest,0);
  assert.deepEqual(nested.checkpoints,[]);
  assert.equal(nested.previousId,branch.id);
});

test('Точка переигрывания строго проверяется; ошибки не меняют сессию',()=>{
  const s=act(createSession(templates[0]),'interest');
  const frozen=structuredClone(s);
  for(const n of [0,-1,2,1.5,'1',null,undefined,NaN])assert.throws(()=>forkSession(s,n),/ход/);
  assert.deepEqual(s,frozen);
  assert.throws(()=>applyAction(s,{type:'offer',offer:{...packet,price:'108'}}));
  assert.deepEqual(s,frozen);
});

test('Старые сессии открываются; сохранения появляются только для новых ходов',()=>{
  let old=act(createSession(templates[0]),'interest');
  delete old.checkpoints;
  assert.deepEqual(publicSession(old).replayableTurns,[]);
  assert.throws(()=>forkSession(old,1),/старого хода/);
  old=act(old,'reason');
  assert.deepEqual(publicSession(old).replayableTurns,[2]);
  const branch=forkSession(old,2);
  assert.equal(branch.state.interest,1);
  assert.equal(branch.state.reason,0);
  assert.equal(branch.messages.length,3);
});

test('Снимки и скрытые поля не уходят в активный интерфейс',()=>{
  const internal=act(createSession(templates[0]),'interest');
  const visible=publicSession(internal);
  assert.equal(visible.checkpoints,undefined);
  assert.equal(visible.events,undefined);
  assert.equal(visible.config.goal,undefined);
  assert.equal(visible.state.reason,undefined);
  assert.deepEqual(visible.replayableTurns,[1]);
});

test('Возврат перед последним ходом восстанавливает оставшийся лимит',()=>{
  let parent=createSession(templates[0]);
  for(let i=0;i<10;i++)parent=act(parent,'text',{text:'Добрый день'});
  const branch=forkSession(parent,10);
  assert.equal(branch.turn,9);
  assert.equal(act(branch,'offer',{offer:packet}).status,'active');
  assert.equal(act(act(branch,'offer',{offer:packet}),'accept').result.outcome,'agreement');
});
