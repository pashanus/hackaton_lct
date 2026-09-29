import {randomUUID} from 'node:crypto';

const opening = 'Демонстрацию экрана вы освоили. Теперь объясните, почему вместо отчёта мы смотрели вашу вкладку с порно.';
const response = (s, text) => s.config.tone==='firm' ? `Давайте без воды. ${text}` : s.config.tone==='friendly' ? `Спокойно, разберёмся. ${text}` : text;
const msg=(s,role,text)=>s.messages.push({role,text,turn:s.turn});

export function createIncident(raw={},previousId=null) {
 const difficulty=Number(raw.difficulty??2),tone=raw.tone??'firm';
 if(!Number.isInteger(difficulty)||difficulty<1||difficulty>3||!['firm','neutral','friendly'].includes(tone))throw new Error('Проверьте сложность и тон кейса.');
 return {id:randomUUID(),type:'incident',title:'Не та вкладка',createdAt:new Date().toISOString(),previousId,config:{difficulty,tone},status:'active',stage:'opening',turn:0,maxTurns:4,state:{trust:70-difficulty*5,truth:false,asked:false,plan:false,overreach:false},messages:[{role:'opponent',text:opening,turn:0}],events:[],result:null};
}

export function incidentChoices(s) {
 if(s.status!=='active')return [];
 if(s.stage==='opening')return [
  {id:'admit',label:'Да, это моя вкладка. Я открыл её по ошибке.',tag:'Признать факт'},
  {id:'research',label:'Это исследование удержания аудитории.',tag:'Ларпить аналитика'},
  {id:'virus',label:'Это вирус. Очень целеустремлённый.',tag:'Свалить на технику'},
  {id:'blame',label:'Коллега прислал ссылку. Я проверял качество.',tag:'Подставить коллегу'},
 ];
 if(s.stage==='response')return [
  ...(!s.state.truth?[{id:'correct',label:'Стоп. Я сейчас выдумываю. Вкладка моя.',tag:'Исправить объяснение'}]:[]),
  {id:'ask',label:'Что для вас сейчас важнее всего исправить?',tag:'Выяснить интерес'},
  {id:'impact',label:'Я поставил коллег в неловкое положение. Извинюсь.',tag:'Признать последствия'},
  {id:'double',label:'Но аудитория ведь досмотрела до конца.',tag:'Добить репутацию'},
 ];
 if(s.stage==='terms')return [
  {id:'repair',label:'Сегодня извинюсь перед участниками. Для созвонов — отдельный рабочий профиль и показ одного окна.',tag:'Конкретный план'},
  {id:'promise',label:'Больше такого не будет. Ну, скорее всего.',tag:'Обещание без плана'},
  {id:'overreach',label:'Я неделю буду работать бесплатно и всё исправлю.',tag:'Пообещать лишнее'},
  {id:'threaten',label:'Я вообще-то ценный кадр. Радуйтесь, что пришёл.',tag:'Надавить'},
 ];
 return [
  {id:'confirm',label:'Зафиксируем план и проверим его на следующем созвоне.',tag:'Подтвердить'},
  {id:'clarify',label:'Уточню: сегодня — извинение, далее — рабочий профиль и показ окна. Сверимся завтра.',tag:'Уточнить обязательства'},
  {id:'withdraw',label:'Возьму паузу. Вернусь к разговору с конкретным планом.',tag:'Завершить без соглашения'},
 ];
}

function finish(s,outcome) {
 const st=s.state;
 const criteria=[
  ['Факты вместо отмазки',st.truth,'Вы признали, что вкладка принадлежит вам.','Вы оставили выдуманное объяснение. Вернитесь к фактам.'],
  ['Интерес руководителя',st.asked,'Вы спросили, что именно нужно исправить.','Вы не уточнили, что беспокоит руководителя.'],
  ['Конкретное действие',st.plan,'Есть проверяемые действия: извинение, рабочий профиль и показ окна.','Обещанию не хватает конкретного способа исполнения.'],
  ['Границы обязательств',!st.overreach,'Вы не предлагали лишних обязательств или давления.','Вы обещали лишнее или давили на собеседника.'],
  ['Фиксация решения',outcome==='agreement','Вы согласовали следующий шаг.','Подтверждённого соглашения пока нет.'],
 ].map(([title,passed,yes,no])=>({title,passed,detail:passed?yes:no}));
 const endings={agreement:['Вкладку закрыл. Разговор тоже.','План принят. Завтра руководитель проверит договорённость. Скандал не исчез, но у него появился конец.'],unresolved:['Отмазка не загрузилась.','Собеседник не принял объяснение или план. Репутацию придётся восстанавливать следующей попыткой.'],rupture:['Теперь смотрят на тебя.','Давление стало отдельной проблемой. Разговор остановлен.'],withdraw:['Вышел из чата. Вопрос остался.','Пауза зафиксирована. Для продолжения понадобится честное объяснение и выполнимый план.']};
 s.status='completed';s.stage='done';s.completedAt=new Date().toISOString();
 s.result={outcome,title:endings[outcome][0],detail:endings[outcome][1],score:criteria.filter(x=>x.passed).length*20,criteria};
 return s;
}

export function actIncident(original,input) {
 if(original.status!=='active')throw new Error('Разговор уже завершён. Начните новую попытку.');
 if(input.stage!==original.stage)throw new Error('Этот экран уже изменился. Обновите страницу.');
 const choice=incidentChoices(original).find(x=>x.id===input.choice);
 if(!choice)throw new Error('Выберите реплику текущего хода.');
 const s=structuredClone(original),st=s.state,action=choice.id;
 s.turn++;s.events.push({stage:s.stage,action});msg(s,'user',choice.label);
 let reply='';
 if(s.stage==='opening'){
  if(action==='admit'){st.truth=true;st.trust+=10;reply='Спасибо за прямой ответ. Коллеги пришли на отчёт. Каким будет ваш следующий шаг?';}
  if(action==='research'){st.trust-=15;reply='В графе «исследования» у вас пусто. В графе «вкладки» — слишком много. Попробуем ещё раз.';}
  if(action==='virus'){st.trust-=20;reply='Вирус также добавил страницу в закладки? Мне нужен ваш ответ, а не техподдержка.';}
  if(action==='blame'){st.trust-=20;reply='Экран показывали вы. Коллегу в вашу объяснительную пока не добавляем.';}
  s.stage='response';
 }else if(s.stage==='response'){
  if(action==='correct'){st.truth=true;st.trust+=15;reply='Хорошо, объяснение исправлено. Теперь предложите, как восстановить рабочий разговор и избежать повторения.';}
  if(action==='ask'){st.asked=true;st.trust+=10;reply='Мне важно уважение к участникам и чтобы это не повторилось. Одного «сорян» недостаточно: предложите понятные действия.';}
  if(action==='impact'){st.trust+=5;reply='Извинение уместно. Что конкретно поменяете перед следующим созвоном?';}
  if(action==='double'){st.truth=false;st.trust-=25;reply='Удержание аудитории закончилось. Сейчас решаем, можно ли продолжать разговор с вами.';}
  s.stage='terms';
 }else if(s.stage==='terms'){
  if(action==='repair'){st.plan=true;st.trust+=10;reply='В этом есть конкретные шаги. Давайте зафиксируем, когда вы их выполните.';}
  if(action==='promise')reply='«Скорее всего» — интересная гарантия. Мне нужен конкретный план, а не прогноз погоды.';
  if(action==='overreach'){st.overreach=true;st.trust-=10;reply='Бесплатная неделя не объясняет, как избежать повторения. Оставим рабочие обязательства соразмерными проблеме.';}
  if(action==='threaten'){st.overreach=true;st.trust-=30;reply='Разговор о ситуации превратился в ультиматум. На этом остановимся.';}
  s.stage='confirm';
 }else {
  if(action==='clarify'){st.plan=true;st.trust+=5;}
  if(action==='withdraw')reply='Хорошо, берём паузу. Договорённости пока нет.';
  else if(st.truth&&st.plan&&!st.overreach&&st.trust>=35+s.config.difficulty*5)reply='Договорились. Сегодня — извинение, перед следующим созвоном — проверка демонстрации. Завтра сверимся.';
  else reply='Пока не готов согласиться. Нам всё ещё не хватает честного объяснения, доверия или приемлемых обязательств.';
 }
 st.trust=Math.max(0,Math.min(100,st.trust));msg(s,'opponent',response(s,reply));
 if(action==='threaten')return finish(s,'rupture');
 if(s.turn>=4)return finish(s,action==='withdraw'?'withdraw':st.truth&&st.plan&&!st.overreach&&st.trust>=35+s.config.difficulty*5?'agreement':'unresolved');
 return s;
}

export const publicIncident=s=>({...s,events:undefined,choices:incidentChoices(s)});
