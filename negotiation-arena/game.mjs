// Deterministic game layer. All costs and stress conditions are announced before play.
export const operations = [
  {id:'supply',number:'01',title:'Просёр поставки',place:'Производство · комната переговоров',line:'Срок пообещали. Поставщика забыли спросить.',description:'Сто комплектов, горящий срок и ваше уверенное «да без проблем». Выясните интерес поставщика и согласуйте условия, которые действительно выдержат задержку.',stress:'После подписи обе поставки задержатся на 2 дня. Резервный транспорт убирает эту задержку.',stressShort:'Поставка +2 дня',symbol:'route'},
  {id:'project',number:'02',title:'Ларпинг дедлайна',place:'Продуктовая команда · переговорная',line:'Вы нажали «сделай». Теперь нужен результат.',description:'Заказчик хочет пять функций. Вы уже ответили «готово». Теперь нужно разобраться с объёмом, людьми и сроками. Каждый обещанный час кто-то будет отрабатывать.',stress:'После подписи команда потеряет 2 человеко-дня. Резервный специалист компенсирует эту потерю.',stressShort:'Ресурс −2 человеко-дня',symbol:'grid'},
];
export const kits=[
  {id:'intel',number:'I',name:'Расширенный А.Н.А.Л.',tag:'ЗНАНИЕ',description:'Раскрывает приоритет и возвращает ход активации. На высокой сложности заменяет два шага разведки. Балл за вопрос начисляется только за настоящий вопрос.'},
  {id:'reserve',number:'II',name:'Железные яйца',tag:'СТРАХОВКА',description:'Один раз создаёт резерв для объявленного сбоя. У резерва есть цена: он использует часть ваших ограниченных ресурсов.'},
  {id:'time',number:'III',name:'Продлить ЧЛЕНство',tag:'ВРЕМЯ',description:'Один раз добавляет 2 хода к лимиту. Активация тоже занимает ход: чистый выигрыш — один дополнительный ход.'},
];
export const endings=[
  {id:'resilient',number:'01',name:'ПЕНИС в порядке',tone:'mint',line:'Сбой случился. Договорённость пережила его.'},
  {id:'fragile',number:'02',name:'Запахло последствиями',tone:'amber',line:'На бумаге всё сходилось. В жизни не хватило запаса.'},
  {id:'costly',number:'03',name:'Продал чужие выходные',tone:'rose',line:'Вы получили согласие. Вашей команде досталась цена уступки.'},
  {id:'exit',number:'04',name:'Красиво вышел',tone:'blue',line:'Подписи нет. Право выбрать другой путь осталось.'},
  {id:'rupture',number:'05',name:'Альфача отключили',tone:'rose',line:'Условия уже не обсуждают. Сначала придётся вернуть разговор.'},
  {id:'unresolved',number:'06',name:'Поговорили. И что?',tone:'slate',line:'Обсуждение закончилось раньше, чем появилась договорённость.'},
];
export const gameCatalog={operations,kits,endings};
export function initGame(config,options){
  if(!options||options.operationId!==config.id||!operations.some(x=>x.id===options.operationId))throw new Error('Игровое дело не соответствует сценарию.');
  if(!kits.some(x=>x.id===options.kit))throw new Error('Выберите один ресурс подготовки.');
  if(options.kit==='reserve'&&config.id==='project'&&config.maxExtra<1)throw new Error('В этом кейсе нет специалиста для резерва. Выберите досье или время.');
  return {version:1,operationId:options.operationId,kit:options.kit,used:false};
}
export const hasIntel=s=>s.state.game?.kit==='intel'&&s.state.game.used;
export const hasReserve=s=>s.state.game?.kit==='reserve'&&s.state.game.used;
export const gameOptions=s=>s.state.game?{operationId:s.state.game.operationId,kit:s.state.game.kit}:null;
export function toolText(s){
  const g=s.state.game;
  if(!g)throw new Error('Ресурс доступен в игровом деле.');
  if(g.used)throw new Error('Этот ресурс уже использован.');
  return g.kit==='intel'?'Сверяюсь с досье перед следующим решением.':g.kit==='time'?'Согласую ещё два хода для обсуждения.':s.config.id==='supply'?'Резервирую запасной транспорт за 4 тыс. ₽ из нашего бюджета.':'Оставляю одного дополнительного специалиста в резерве на случай сбоя.';
}
export function activateTool(s){
  const g=s.state.game;g.used=true;g.usedAtTurn=s.turn;
  if(g.kit==='time'){s.maxTurns+=2;return 'Время продлено: лимит увеличен на 2 хода. Активация заняла один ход.';}
  if(g.kit==='intel'){s.maxTurns+=1;return `В досье зафиксирован приоритет: ${motive(s.config)} Ход активации возвращён в ваш лимит.`;}
  return s.config.id==='supply'?'Запасной транспорт зарезервирован. 4 тыс. ₽ входят в ваш общий бюджет. Объявленная задержка на 2 дня будет компенсирована.':'Один дополнительный специалист занят резервом. Он компенсирует потерю 2 человеко-дней, но его нельзя одновременно обещать в составе основной команды.';
}
function motive(c){return {cash:'получить предоплату и зарезервировать транспорт.',schedule:'спланировать загрузку производства.',demo:'показать ключевой процесс; для него достаточно двух функций.',full:'получить все пять функций, даже если потребуется обсуждать срок.'}[c.goal];}
export function reserveViolations(s,o){
  if(!hasReserve(s))return [];
  if(s.config.id==='supply')return o.price+4>s.config.budget?['С учётом резерва транспорта общая цена выше вашего бюджета.']:[];
  return o.extra+1>s.config.maxExtra?['Один специалист уже занят резервом: для обещанной основной команды не хватает людей.']:[];
}
export function stressTest(s,o){
  const c=s.config,reserve=hasReserve(s);let metrics,failed=[];
  if(c.id==='supply'){
    const cost=o.price+(reserve?4:0),arrival=o.day+(reserve?0:2),slack=c.deadline-arrival;
    metrics=[{label:'Остаток бюджета',signed:true,value:c.budget-cost,unit:'тыс. ₽',good:cost<=c.budget},{label:'Запас срока после сбоя',signed:true,value:slack,unit:'дн.',good:slack>=0},{label:'Предоплата',value:o.advance,unit:`% / лимит ${c.maxAdvance}%`,good:o.advance<=c.maxAdvance}];
    if(cost>c.budget)failed.push(`Общая цена ${cost} тыс. ₽ превышает бюджет ${c.budget}.`);
    if(slack<0)failed.push(`Первая поставка придёт на ${arrival}-й день, на ${-slack} дн. позже цели.${o.partial?` Остаток — на ${arrival+6}-й день.`:''}`);
    if(o.advance>c.maxAdvance)failed.push('Предоплата превышает ваш лимит.');
    return {passed:!failed.length,metrics,failed,summary:`${o.partial?'Первые 60 комплектов':'Вся партия'}: день ${arrival}${o.partial?`; ещё 40: день ${arrival+6}`:''}. Общая цена: ${cost} тыс. ₽.`,reserve};
  }
  const needed=o.scope*2,capacity=o.day*(1+o.extra)-(reserve?0:2),people=o.extra+(reserve?1:0),slack=capacity-needed;
  metrics=[{label:'Запас после потери ресурса',signed:true,value:slack,unit:'чел.-дн.',good:slack>=0},{label:'Дополнительные люди',value:people,unit:`/ лимит ${c.maxExtra}`,good:people<=c.maxExtra},{label:'Запас до целевого срока',signed:true,value:c.deadline-o.day,unit:'дн.',good:o.day<=c.deadline}];
  if(slack<0)failed.push(`После сбоя доступно ${capacity} человеко-дней, а обещанный объём требует ${needed}. Дефицит: ${-slack}.`);
  if(people>c.maxExtra)failed.push('Основная команда и резерв вместе превышают доступное число людей.');
  if(o.day>c.deadline)failed.push('Обещанный релиз выходит за ваш целевой срок.');
  return {passed:!failed.length,metrics,failed,summary:`Обещано функций: ${o.scope}. Нужно ${needed} человеко-дней; после сбоя доступно ${capacity}.`,reserve};
}
export function publicGame(s){
  const g=s.state.game;if(!g)return null;
  const revealed=hasIntel(s)||s.config.difficulty===1||s.state.interest>=(s.config.difficulty===3?2:1);
  return {...g,operation:operations.find(x=>x.id===g.operationId),resource:kits.find(x=>x.id===g.kit),motive:revealed?motive(s.config):null,revealed,forecast:s.state.pending?stressTest(s,s.state.pending.offer):null,resourceCost:g.kit==='reserve'?(s.config.id==='supply'?'4 тыс. ₽ из общего бюджета':'1 дополнительный специалист из доступного лимита'):g.kit==='intel'?'Возвращает ход активации':'Активация занимает 1 ход'};
}
export function gameResult(s){
  if(!s.state.game)return null;
  const r=s.result,stress=r.offer?stressTest(s,r.offer):null;
  const id=r.outcome==='agreement'?(stress.passed?'resilient':'fragile'):r.outcome==='unfavorable'?'costly':r.outcome==='withdrawn'?'exit':r.outcome==='breakdown'?'rupture':'unresolved';
  const ending=endings.find(x=>x.id===id);
  const replayTurn=s.messages.findLast(m=>m.role==='user'&&m.action==='offer')?.turn||s.messages.find(m=>m.role==='user'&&m.action==='pressure')?.turn||1;
  const consequence=id==='resilient'?'Запаса хватило. Команда может выполнить обещанное даже после объявленного сбоя.':id==='fragile'?'Условия были допустимы в обычном ходе событий, но запаса на объявленный сбой не хватило.':id==='costly'?'Соглашение принято с нарушением ваших ограничений. Согласие собеседника не сняло цену этого решения.':id==='exit'?'Новые обязательства не появились. Альтернативу ещё нужно проверить: выход сам по себе не доказывает, что он был лучшим решением.':id==='rupture'?'Повторное давление закрыло разговор. Условий, которые можно передать команде, нет.':'Команде пока нечего исполнять: подтверждённого пакета нет.';
  return {version:1,ending,stress,consequence,replayTurn,relations:s.state.trust<35?'Разговор требует восстановления':s.state.trust>=75?'Сохранён конструктивный контакт':'Рабочий контакт сохранён',motive:motive(s.config),note:'Эпилог рассчитан по заранее объявленным правилам учебного мира. Это не прогноз реальной сделки.'};
}
