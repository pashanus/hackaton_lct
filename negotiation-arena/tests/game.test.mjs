import test from 'node:test';
import assert from 'node:assert/strict';
import {templates,createSession,applyAction,forkSession,publicSession,assessOffer} from '../engine.mjs';
import {stressTest,gameOptions} from '../game.mjs';
const start=(id='supply',kit='intel',changes={})=>createSession({...templates.find(x=>x.id===id),...changes},'guided',null,{operationId:id,kit});
const act=(s,type,extra={})=>applyAction(s,{type,...extra});
const offer={price:108,day:10,advance:30,partial:false};
const settle=(s,o)=>act(act(s,'offer',{offer:o}),'accept');

test('Игровые ресурсы проверяются, обычная тренировка не получает инструменты',()=>{
 for(const kit of ['intel','reserve','time'])assert.equal(start('supply',kit).state.game.kit,kit);
 assert.throws(()=>start('supply','fake'),/ресурс/);
 assert.throws(()=>createSession(templates[0],'guided',null,{operationId:'project',kit:'intel'}),/дело/);
 assert.throws(()=>start('project','reserve',{maxExtra:0}),/нет специалиста/);
 assert.throws(()=>act(createSession(templates[0]),'tool'),/игровом деле/);
});
test('Скрытый мотив не раскрывается без вопроса, досье или лёгкой сложности',()=>{
 let s=start();assert.equal(publicSession(s).game.motive,null);assert.equal(publicSession(s).config.goal,undefined);
 s=act(s,'tool');assert.equal(publicSession(s).game.revealed,true);assert.match(publicSession(s).game.motive,/предоплату/);
 assert.equal(s.messages.at(-1).role,'system');assert.equal(s.turn,1);assert.equal(s.maxTurns,7);
 assert.throws(()=>act(s,'tool'),/уже использован/);
 assert.equal(publicSession(start('supply','time',{difficulty:1})).game.revealed,true);
});
test('Досье открывает переговорное пространство, но не даёт балл за вопрос',()=>{
 let s=start('project','intel',{difficulty:3});s=act(s,'tool');
 assert.equal(assessOffer(s,{scope:2,day:5,extra:0}).accepted,false);
 s=act(s,'reason');assert.equal(assessOffer(s,{scope:2,day:5,extra:0}).accepted,true);
 s=settle(s,{scope:2,day:5,extra:0});
 assert.equal(s.result.criteria.find(x=>x.key==='interest').value,0);
 assert.equal(s.result.criteria.find(x=>x.key==='interest').evidence.length,0);
});
test('Формально допустимая поставка без запаса заканчивается тонким льдом',()=>{
 let s=start();for(const t of ['interest','reason','exchange','boundary'])s=act(s,t);
 s=settle(s,offer);
 assert.equal(s.result.outcome,'agreement');assert.equal(s.result.score,100);
 assert.equal(s.result.game.ending.id,'fragile');assert.equal(s.result.game.stress.metrics[1].value,-2);
 assert.equal(s.result.game.replayTurn,5);
});
test('Частичная ранняя поставка выдерживает задержку без покупки резерва',()=>{
 const s=settle(start(),{...offer,partial:true,day:8});
 assert.equal(s.result.game.ending.id,'resilient');
 assert.match(s.result.game.stress.summary,/день 10/);assert.match(s.result.game.stress.summary,/день 16/);
});
test('Резерв транспорта реально оплачивается из общего бюджета',()=>{
 const s=act(start('supply','reserve'),'tool');
 const good=settle(s,{...offer,price:104});
 assert.equal(good.result.game.ending.id,'resilient');assert.equal(good.result.game.stress.metrics[0].value,2);
 const bad=settle(s,offer);
 assert.equal(bad.result.outcome,'unfavorable');assert.equal(bad.result.game.ending.id,'costly');
 assert.match(bad.result.violations.join(' '),/резерва/);
});
test('Активация резерва после предложения пересчитывает готовый к подтверждению пакет',()=>{
 let s=act(start('supply','reserve'),'offer',{offer});assert.equal(s.state.pending.assessment.good,true);
 s=act(s,'tool');assert.equal(s.state.pending.assessment.good,false);
 assert.equal(publicSession(s).game.forecast.passed,false);
 assert.equal(act(s,'accept').result.outcome,'unfavorable');
});
test('Проект имеет три настоящих исхода: дефицит, запас команды, резерв',()=>{
 const base={scope:2,day:5,extra:0};
 const fragile=settle(act(start('project'),'interest'),base);
 assert.equal(fragile.result.game.ending.id,'fragile');assert.equal(fragile.result.game.stress.metrics[0].value,-1);
 const extra=settle(act(start('project'),'interest'),{...base,extra:1});
 assert.equal(extra.result.game.ending.id,'resilient');
 let prepared=act(act(start('project','reserve'),'interest'),'tool');
 assert.equal(settle(prepared,base).result.game.ending.id,'resilient');
 assert.equal(settle(prepared,{...base,extra:1}).result.game.ending.id,'costly');
});
test('Дополнительное время одноразовое; перемотка восстанавливает прежний лимит',()=>{
 let s=act(start('supply','time'),'interest');s=act(s,'tool');assert.equal(s.turn,2);assert.equal(s.maxTurns,8);
 s=act(s,'reason');const before=forkSession(s,2),after=forkSession(s,3);
 assert.equal(before.maxTurns,6);assert.equal(before.state.game.used,false);
 assert.equal(after.maxTurns,8);assert.equal(after.state.game.used,true);
 assert.equal(act(before,'tool').maxTurns,8);assert.throws(()=>act(after,'tool'));
});
test('Повтор сохраняет выбранный ресурс, но сбрасывает применение и не меняет исходную попытку',()=>{
 const s=act(start('supply','reserve'),'tool');const repeat=createSession(s.config,'guided',s.id,gameOptions(s));
 assert.equal(repeat.state.game.kit,'reserve');assert.equal(repeat.state.game.used,false);
 const branch=forkSession(s,1);assert.equal(branch.state.game.used,false);assert.equal(s.state.game.used,true);
});
test('Другие финалы не создают фиктивную проверку неподписанной сделки',()=>{
 for(const [action,id] of [['withdraw','exit'],['finish','unresolved']]){const s=act(start(),action);assert.equal(s.result.game.ending.id,id);assert.equal(s.result.game.stress,null);}
 let s=start();for(let i=0;i<3;i++)s=act(s,'pressure');assert.equal(s.result.game.ending.id,'rupture');assert.equal(s.result.game.stress,null);
});
test('Настройки тренера и цена резерва учитываются в проверке, прогноз не изменяет состояние',()=>{
 const s=start('supply','reserve',{budget:106,deadline:12});const before=structuredClone(s);
 assert.equal(stressTest(s,{...offer,price:104}).passed,true);assert.deepEqual(s,before);
 const prepared=act(s,'tool');assert.equal(stressTest(prepared,{...offer,price:104}).passed,false);
 assert.equal(prepared.config.budget,106);
});
