import { randomUUID } from 'node:crypto';
import {initGame,hasIntel,reserveViolations,toolText,activateTool,publicGame,gameResult} from './game.mjs';

export const templates = [
  { id: 'supply', number: '01', title: 'Поставка без срыва', category: 'Закупки', description: 'Сроки горят. Поставщик не торопится. Найдите условия, которые устроят обе стороны.', skill: 'Интересы и взаимные уступки', duration: '5–7 минут', role: 'Менеджер поставщика', goal: 'cash', topic: 'Поставка оборудования', sphere: 'Закупки', difficulty: 2, tone: 'firm', budget: 110, deadline: 10, maxAdvance: 50 },
  { id: 'project', number: '02', title: 'Дедлайн под контролем', category: 'Управление', description: 'Заказчик хочет всё и сразу. Согласуйте объём, который команда действительно выполнит.', skill: 'Приоритеты и границы', duration: '5–7 минут', role: 'Внутренний заказчик', goal: 'demo', topic: 'Первый релиз продукта', sphere: 'Управление проектами', difficulty: 2, tone: 'neutral', deadline: 5, maxExtra: 1 },
];
export const toneNames = { firm: 'Требовательный', neutral: 'Деловой', friendly: 'Доброжелательный' };
export const goalNames = { cash: 'Получить предоплату', schedule: 'Спланировать загрузку', demo: 'Показать ключевой процесс', full: 'Получить полный объём' };
const copy = value => structuredClone(value);
export function validateConfig(raw) {
  const template = templates.find(t => t.id === raw?.id);
  if (!template) throw new Error('Неизвестный шаблон сценария.');
  const c = { ...template };
  for (const k of ['topic', 'role', 'sphere']) {
    if (raw[k] !== undefined && (typeof raw[k] !== 'string' || !raw[k].trim() || raw[k].trim().length > 100)) throw new Error(`Поле «${k}» должно содержать от 1 до 100 символов.`);
    c[k] = (raw[k] ?? c[k]).trim();
  }
  for (const [k,min,max] of [['difficulty',1,3],['deadline',3,20], ...(c.id === 'supply' ? [['budget',80,150],['maxAdvance',0,100]] : [['maxExtra',0,3]])]) {
    const n = Number(raw[k] ?? c[k]);
    if (!Number.isInteger(n) || n < min || n > max) throw new Error(`Поле «${k}»: целое число от ${min} до ${max}.`);
    c[k] = n;
  }
  c.tone = raw.tone ?? c.tone;
  if (!Object.hasOwn(toneNames, c.tone)) throw new Error('Выберите допустимый тон.');
  c.goal = raw.goal ?? c.goal;
  if (!(c.id === 'supply' ? ['cash','schedule'] : ['demo','full']).includes(c.goal)) throw new Error('Цель не соответствует сценарию.');
  return c;
}
const tone = (s, text) => s.config.tone === 'friendly' ? `Давайте разберёмся вместе. ${text}` : s.config.tone === 'firm' ? `Мне нужна конкретика. ${text}` : text;
export function brief(c) {
  return c.id === 'supply' ? {
    you: 'Менеджер по закупкам', mission: `Получить 100 комплектов: хотя бы 60 к ${c.deadline}-му дню, остаток — не позднее ${c.deadline+6}-го дня.`,
    limits: [`Бюджет: ${c.budget} тыс. ₽ за партию`, `Предоплата: не более ${c.maxAdvance}%`, 'Частичная поставка допустима'],
    alternative: 'Другой поставщик: 100 комплектов за 112 тыс. ₽ на 12-й день, без предоплаты. Проверьте, укладывается ли это в ваши ограничения.',
    opening: `Обсудим «${c.topic}». Могу поставить 100 комплектов на 14-й день за 110 тыс. ₽, без предоплаты. Какие условия нужны вам?`
  } : {
    you: 'Руководитель проекта', mission: `Согласовать выполнимый первый релиз к ${c.deadline}-му рабочему дню.`,
    limits: ['Одна функция = 2 человеко-дня', `В команде 1 специалист; можно добавить до ${c.maxExtra}`, 'Объём: от 1 до 5 функций; сроки можно обсуждать'],
    alternative: `Готовое временное решение: 2 функции за ${c.deadline} дней. Оно закрывает демо, но не заменяет полный продукт.`,
    opening: `Обсудим «${c.topic}». Мне нужны все 5 функций к ${c.deadline}-му дню. Давайте подтвердим план.`
  };
}
function message(s, role, text, extra = {}) {
  const m = { id: randomUUID(), role, text, at: new Date().toISOString(), ...(s.turn?{turn:s.turn}:{}), ...extra };
  s.messages.push(m); return m;
}
export function createSession(raw, mode = 'guided', previousId = null, game = null) {
  const config = validateConfig(raw);
  const s = { id: randomUUID(), config, mode, previousId, createdAt: new Date().toISOString(), status: 'active', turn: 0, maxTurns: 10, messages: [], events: [], checkpoints: [], state: { trust: 60, interest: 0, reason: 0, exchange: 0, boundaries: 0, attacks: 0, pending: null }, result: null };
  if(game){s.state.game=initGame(config,game);s.maxTurns=6;}
  message(s, 'opponent', tone(s, brief(config).opening + (config.difficulty === 1 ? ' ' + interestReply(s) : ''))); return s;
}
export function forkSession(original, beforeTurn, mode = original.mode) {
  if (!Number.isInteger(beforeTurn) || beforeTurn < 1 || beforeTurn > original.turn) throw new Error('Выберите существующий ход для переигрывания.');
  const checkpoint = original.checkpoints?.find(c => c.beforeTurn === beforeTurn);
  if (!checkpoint) throw new Error('Для этого старого хода нет сохранённого состояния. Повторите тренировку с начала.');
  const s = copy(original);
  s.id = randomUUID();
  s.previousId = original.id;
  s.fork = { beforeTurn, sourceMessageId: original.messages.find(m => m.role === 'user' && m.turn === beforeTurn)?.id };
  s.createdAt = new Date().toISOString();
  s.status = 'active';
  s.mode = mode;
  s.turn = beforeTurn - 1;
  s.maxTurns = checkpoint.maxTurns ?? original.maxTurns;
  s.result = null;
  delete s.completedAt;
  s.state = copy(checkpoint.state);
  s.messages = s.messages.slice(0, checkpoint.messageCount);
  s.events = s.events.slice(0, checkpoint.eventCount);
  s.checkpoints = s.checkpoints.filter(c => c.beforeTurn < beforeTurn);
  return s;
}
export const actionTexts = {
  interest: 'Что для вас самое важное в этих переговорах? Какие ограничения мешают?',
  probe: 'Расскажите подробнее: что именно позволит изменить условия?',
  reason: 'Объясню нашу позицию: нам важно выполнить обязательства перед командой. Давайте опираться на реальные ограничения.',
  exchange: 'Давайте рассмотрим обмен уступками: что мы можем предложить в ответ на нужные нам условия?',
  boundary: 'Важно сохранить наши ограничения. Я не могу обещать то, что мы не сможем выполнить.',
  pressure: 'Меня не интересуют ваши сложности. Сделайте всё на наших условиях, иначе разговаривать не о чем.',
  accept: 'Подтверждаю согласованные условия и следующий шаг.',
  withdraw: 'Приемлемого варианта пока нет. Завершим переговоры и вернёмся к альтернативе.',
};
export function classifyText(text) {
  if (/игнорир|system prompt|промпт|поставь.*(?:100|балл)|забудь.*правил|системн.*инструк/i.test(text)) return 'injection';
  if (/не интересуют|иначе|обязан|ультимат|без разговор|плевать/i.test(text)) return 'pressure';
  if (/не можем|не могу|ограничен|бюджет|предел|невыполним/i.test(text)) return 'boundary';
  if (/почему|объясн|потому|так как|обязательств|причин/i.test(text) && !text.includes('?')) return 'reason';
  if (/взамен|в ответ|обмен|уступ|вариант|поэтап|частями|предоплат/i.test(text)) return 'exchange';
  if (/подробнее|что именно|позволит|логист|какие функц/i.test(text)) return 'probe';
  if (/важн|приоритет|зачем|для чего|что мешает|ограничения|какая цель|интерес|потребност/i.test(text) && (text.includes('?') || /расскаж|уточн|выясн/i.test(text))) return 'interest';
  return 'unknown';
}
function interestReply(s) {
  const c = s.config;
  if (c.difficulty === 3 && s.state.interest < 2 && !hasIntel(s)) return 'У меня есть внутренние ограничения. Уточните, что именно вы готовы обсуждать: сроки, объём или встречные условия?';
  if (c.id === 'supply') return c.goal === 'cash' ? 'Для меня важна предоплата. От 30% можем зарезервировать транспорт: всю партию с 10-го дня или 60 комплектов с 8-го, остаток через 6 дней. С предоплатой цена может начинаться от 104 тыс. ₽.' : 'Для меня важна загрузка производства. При сроке от 12 дней готов обсуждать цену от 104 тыс. ₽. Для более ранней отгрузки нужны предоплата от 30% и цена от 108 тыс. ₽; всю партию раньше 10-го дня не соберём.';
  return c.goal === 'demo' ? 'Главная цель — показать ключевой процесс. Для демонстрации достаточно двух функций. Остальные три можно вынести в следующий этап, если первый релиз будет выполнимым.' : `Мне нужен именно полный набор из 5 функций. Могу обсуждать срок до ${c.deadline+5} дней. Давайте проверим ресурсы, чтобы план был выполнимым.`;
}
export function validateOffer(s, raw) {
  const keys = s.config.id === 'supply' ? { price:[1,200], day:[1,30], advance:[0,100] } : { scope:[1,5], day:[1,30], extra:[0,3] };
  const o = {};
  for (const [k,[min,max]] of Object.entries(keys)) {
    if (typeof raw?.[k] !== 'number' || !Number.isInteger(raw[k]) || raw[k] < min || raw[k] > max) throw new Error('Проверьте числовые поля предложения.');
    o[k] = raw[k];
  }
  if (s.config.id === 'supply') { if (typeof raw.partial !== 'boolean') throw new Error('Укажите способ поставки.'); o.partial = raw.partial; }
  return o;
}
export function offerLabel(c,o) {
  return c.id === 'supply' ? `${o.price} тыс. ₽ · ${o.partial ? '60 комплектов' : '100 комплектов'} на ${o.day}-й день${o.partial ? `, ещё 40 на ${o.day+6}-й` : ''} · предоплата ${o.advance}%` : `Функций: ${o.scope} · рабочих дней: ${o.day} · дополнительных специалистов: ${o.extra}`;
}
export function assessOffer(s,o) {
  const c=s.config; const reasons=[]; const violations=[];
  if(c.id==='supply') {
    const minDay=o.partial?8:o.advance>=30?10:14;
    const minPrice=c.goal==='cash'?(o.advance>=30?104:110):(o.day>=12?104:108);
    if(o.day<minDay) reasons.push(`Такой срок физически недоступен: минимум ${minDay} дней.`);
    if(o.partial&&o.advance<30) reasons.push('Для двух отгрузок нужна предоплата от 30%.');
    if(o.price<minPrice) reasons.push(`На этих условиях цена должна быть не ниже ${minPrice} тыс. ₽.`);
    if(o.price>c.budget) violations.push('Превышен ваш бюджет.');
    if(o.advance>c.maxAdvance) violations.push('Предоплата выше вашего лимита.');
    if(o.day>c.deadline) violations.push('Первая поставка позже вашего срока.');
  } else {
    const disclosed=hasIntel(s)||c.difficulty===1||s.state.interest >= (c.difficulty===3?2:1);
    const minScope=c.goal==='demo'&&disclosed?2:5;
    if(o.scope<minScope) reasons.push(disclosed?'Для этой цели нужен больший объём.':'Сначала выясните, какой объём действительно нужен заказчику. Сейчас запрос — 5 функций.');
    if(o.scope*2>o.day*(1+o.extra)) reasons.push(`Обещание невыполнимо: нужно ${o.scope*2} человеко-дней, доступно ${o.day*(1+o.extra)}.`);
    if(o.day>c.deadline+(c.goal==='full'?5:0)) reasons.push('Такой срок не подходит цели заказчика.');
    if(o.extra>c.maxExtra) violations.push('Вы обещаете недоступные дополнительные ресурсы.');
    if(o.day>c.deadline) violations.push('Первый релиз позже вашего целевого срока.');
  }
  const concession=c.id==='supply'?(o.price<110||o.day<14):o.scope<5;
  if(c.difficulty===3&&concession&&((s.state.interest<2&&!hasIntel(s))||s.state.reason<1)) reasons.push('Для уступки нужны уточнение интересов и обоснование вашей позиции.');
  violations.push(...reserveViolations(s,o));
  if(s.state.trust<20) reasons.push('После давления собеседник не готов согласовать сделку.');
  return { accepted: reasons.length===0, reasons, violations, good: reasons.length===0&&violations.length===0 };
}
export function publicSession(s) {
  const result=copy(s);
  result.brief=brief(s.config);
  result.game=publicGame(s);
  result.state={ trust:s.state.trust, pending:s.state.pending ? copy(s.state.pending) : null, interestRevealed:hasIntel(s)||s.config.difficulty===1||s.state.interest >= (s.config.difficulty===3?2:1) };
  delete result.events;
  result.replayableTurns=(s.checkpoints||[]).map(c=>c.beforeTurn);
  delete result.checkpoints;
  // The administrator's hidden goal is not sent in an active player's session.
  if(result.status==='active') delete result.config.goal;
  return result;
}
function finish(s,outcome,title,detail,offer=null,violations=[]) {
  s.status='completed'; s.completedAt=new Date().toISOString();
  s.result={ outcome,title,detail,offer,violations,...evaluate(s) };
  if(s.state.game)s.result.game=gameResult(s);
  return s;
}
export function evaluate(s) {
  const p=s.state.pending, o=p?.offer, last=s.events.at(-1)?.type;
  const valid=!!p?.assessment.accepted;
  const usedInterest=valid && s.state.interest>0 && (s.config.id==='supply' ? (s.config.goal==='cash'?o.advance>=30:o.day>=12) : (s.config.goal==='demo'?o.scope===2:o.scope===5));
  const exchanged=valid && (s.config.id==='supply'?(o.advance>=30||o.partial):o.scope<5);
  const goodClosure=last==='accept'&&p?.assessment.good;
  const defs=[
    ['interest','Выяснение интересов','Выясните приоритет собеседника и используйте его в конкретном предложении.',s.state.interest?usedInterest?2:1:0],
    ['reason','Аргументация','Объясните, почему ваши условия важны, и предложите выполнимый пакет.',s.state.reason?valid?2:1:0],
    ['exchange','Обмен уступками','Предложите конкретный обмен: что вы дадите в ответ на уступку.',s.state.exchange?exchanged?2:1:0],
    ['boundary','Сохранение границ','Назовите свои ограничения и проверьте предложение перед подтверждением.',s.state.boundaries?goodClosure?2:1:0],
    ['accept','Фиксация результата','Подведите итог и явно подтвердите условия или причину отказа.',s.events.some(e=>['accept','withdraw'].includes(e.type))?2:0],
  ];
  const criteria=defs.map(([key,title,advice,value])=>{
    const matches=s.events.filter(e=>e.type===key||(key==='accept'&&e.type==='withdraw'));
    const ev=matches.map(e=>s.messages.find(m=>m.id===e.messageId)).filter(Boolean);
    if(value===2&&key!=='accept') { const proposal=s.messages.findLast(m=>m.role==='user'&&m.action==='offer');if(proposal)ev.push(proposal); }
    const applied={interest:'Вопрос помог выявить приоритет, который учтён в согласуемом предложении.',reason:'После обоснования предложен пакет, допустимый для собеседника.',exchange:'Обмен уступками выражен в конкретных условиях.',boundary:'Ограничения обозначены и соблюдены в подтверждённой сделке.',accept:'Исход явно зафиксирован отдельной репликой.'};
    return {key,title,value,advice,evidence:ev.slice(-2).map(m=>({id:m.id,turn:m.turn,text:m.text})), observation:value===2?applied[key]:ev.length?'Приём обозначен; его применение в итоговых условиях пока не подтверждено.':'В этой попытке действие не зафиксировано.'};
  });
  const violated=s.state.pending?.assessment?.violations?.length;
  if(violated&&s.events.at(-1)?.type==='accept') {
    criteria[3].value=0;criteria[3].observation='В подтверждённом предложении нарушены ваши ограничения.';
    const proposal=s.messages.findLast(m=>m.role==='user'&&m.action==='offer');
    if(proposal)criteria[3].evidence=[{id:proposal.id,turn:proposal.turn,text:proposal.text}];
  }
  const score=criteria.reduce((n,c)=>n+c.value,0)*10;
  const next=violated&&last==='accept'?criteria[3]:criteria.filter(c=>c.value<2).sort((a,b)=>a.value-b.value)[0];
  return {rubricVersion:s.state.game?'2-game-1':'2',score,criteria,nextStep:next?.advice??'Попробуйте тот же кейс на высокой сложности и объясняйте каждую уступку.',note:'Учебная оценка наблюдаемых действий по правилам. Не измеряет профессиональную компетентность; свободные формулировки могут быть распознаны неточно.'};
}
export function applyAction(original,input) {
  if(original.status!=='active') throw new Error('Эта попытка уже завершена. Начните новую.');
  const s=copy(original);let type=input?.type;let text='';let offer;
  if(type==='tool') {text=toolText(s);}
  else if(type==='text') {
    if(typeof input.text!=='string'||!input.text.trim()||input.text.trim().length>2000) throw new Error('Напишите сообщение от 1 до 2000 символов.');
    text=input.text.trim();type=classifyText(text);
  } else if(type==='offer') { offer=validateOffer(s,input.offer);text=`Предлагаю: ${offerLabel(s.config,offer)}.`; }
  else if(type==='finish') {text='Завершаю тренировку. Подведём итоги.';}
  else if(Object.hasOwn(actionTexts,type)) {
    text=actionTexts[type];
    if(type==='reason') text=s.config.id==='supply'?`Нам нужно хотя бы 60 комплектов к ${s.config.deadline}-му дню, чтобы команда начала работу. Поэтому предлагаю обсудить раннюю или частичную отгрузку.`:`Каждая функция требует 2 человеко-дня. До первого релиза ${s.config.deadline} дней, поэтому нужно согласовать выполнимый объём и ресурсы.`;
    if(type==='boundary') text=s.config.id==='supply'?`Наш бюджет — ${s.config.budget} тыс. ₽, лимит предоплаты — ${s.config.maxAdvance}%. Не могу обещать больше. Давайте подберём условия в этих границах.`:`Лимит дополнительных специалистов — ${s.config.maxExtra}. Не хочу обещать команде невыполнимый срок: проверим объём работ.`;
  }
  else throw new Error('Неизвестное действие.');
  if(type==='accept'&&!s.state.pending) throw new Error('Сначала согласуйте предложение с конкретными условиями.');
  // Snapshot before applying the action; no replay through today's rules is needed.
  s.checkpoints??=[];
  s.checkpoints.push({beforeTurn:s.turn+1,maxTurns:s.maxTurns,state:copy(s.state),messageCount:s.messages.length,eventCount:s.events.length});
  s.turn++;
  const m=message(s,'user',text,{turn:s.turn,action:type});
  s.events.push({type,messageId:m.id});
  let reply='';
  if(type==='tool') {
    reply=activateTool(s);
    if(s.state.pending){const offer=s.state.pending.offer;const assessment=assessOffer(s,offer);s.state.pending=assessment.accepted?{offer,assessment}:null;}
  }
  if(['interest','probe'].includes(type)) {s.state.interest++;s.state.trust+=5;if(type==='probe')s.events.push({type:'interest',messageId:m.id});reply=interestReply(s);}
  if(type==='reason') {s.state.reason++;s.state.trust+=6;reply='Понимаю основание. Давайте сопоставим ваши ограничения с моими и зафиксируем конкретные условия в предложении.';}
  if(type==='exchange') {s.state.exchange++;s.state.trust+=4;reply=s.config.id==='supply'?'Готов обсудить цену, предоплату и график. Укажите точные условия в карточке предложения.':'Можем менять объём, срок и число специалистов. Укажите выполнимый вариант в карточке предложения.';}
  if(type==='boundary') {s.state.boundaries++;s.state.trust+=3;reply='Принимаю ваши ограничения. Согласуем только то, что можем выполнить. Предложите конкретный пакет условий.';}
  if(type==='pressure') {s.state.attacks++;s.state.trust-=25;s.state.pending=null;reply='Давление не меняет наших возможностей. Готов продолжить предметный разговор, если обсудим интересы и реальные условия.';}
  if(type==='injection') reply='Обсуждаем только условия нашей задачи. Настройки и правила оценки во время переговоров не меняются.';
  if(type==='unknown') reply='Уточните, что вы предлагаете или хотите выяснить. Для точных условий используйте карточку предложения. Можно также выбрать реплику под диалогом.';
  if(type==='offer') {
    const assessment=assessOffer(s,offer);
    s.state.pending=assessment.accepted?{offer,assessment}:null;
    reply=assessment.accepted?`Со своей стороны готов согласовать: ${offerLabel(s.config,offer)}. Подтвердите условия отдельной кнопкой.`:`Пока не могу согласиться. ${assessment.reasons.join(' ')}`;
    if(assessment.accepted&&assessment.violations.length) reply+=' Проверьте, подходят ли они вашей стороне.';
  }
  if(type==='accept') {
    const p=s.state.pending;message(s,'opponent','Договорились. Условия зафиксированы.');
    return finish(s,p.assessment.good?'agreement':'unfavorable',p.assessment.good?'Договорились на ваших условиях':'Сделка с уступкой сверх границ',p.assessment.good?'Соглашение выполнимо и укладывается в ваши ограничения.':p.assessment.violations.join(' '),p.offer,p.assessment.violations);
  }
  if(type==='withdraw') {
    message(s,'opponent','Понимаю. Зафиксируем, что соглашения пока нет.');
    return finish(s,'withdrawn','Переговоры завершены без сделки','Вы сохранили право на альтернативу. Оцените, исчерпаны ли приемлемые варианты: сам отказ не доказывает, что он был оптимален.');
  }
  if(type==='finish') { message(s,'opponent','Подведём итог этой попытки.'); return finish(s,'unfinished','Тренировка завершена','Условия не подтверждены. В разборе — действия, которые вы успели попробовать.'); }
  s.state.trust=Math.max(0,Math.min(100,s.state.trust));
  message(s,type==='tool'?'system':'opponent',type==='tool'?reply:tone(s,reply),{turn:s.turn});
  if(s.state.trust<10) return finish(s,'breakdown','Диалог зашёл в тупик','Повторное давление закрыло возможность договориться. Попробуйте начать с интересов собеседника.');
  if(s.turn>=s.maxTurns&&!s.state.pending) return finish(s,'timeout','Время подвести итоги','Лимит ходов исчерпан. Подтверждённого соглашения пока нет.');
  if(s.turn>=s.maxTurns+1) return finish(s,'timeout','Раунд завершён','В этой попытке соглашение не было подтверждено.');
  return s;
}
