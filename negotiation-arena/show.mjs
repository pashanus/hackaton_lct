import {memeAssets} from './public/meme-assets.js';

export const sceneCatalog = [
 ['01','Исследование аудитории','Вкладка','Покажите результаты. И объясните Рис. 1.','research_evidence'],
 ['02','Очень целеустремлённый вирус','Вкладка','Независимый эксперт уже всё понял.','virus_expert'],
 ['03','Коллега прислал','Вкладка','Передайте слово. Ответственность тоже.','colleague_evidence'],
 ['04','Это всё нейросеть','Вкладка','Покажите, что именно вы попросили.','ai_receipt'],
 ['05','Уберите картинку','Вкладка','Теперь это ваш аватар.','unexplained_image'],
 ['06','Не включайте звук','Вкладка','Сделайте PNG погромче.','silent_image'],
 ['07','Сделай круче','Ларпинг','Масштабируем результат буквально.','generated_result'],
 ['08','Спросить другую ИИ','Ларпинг','Три эксперта. Одна картинка.','generated_result'],
 ['09','Длина промпта','Ларпинг','Пожалуйста. Ты эксперт. Очень надо.','generated_result'],
 ['10','Верни как было','Ларпинг','Найдите разницу между двумя копиями.','generated_result'],
 ['11','Объяснить архитектуру','Ларпинг','За средний блок отвечает следующий.','architecture_core'],
 ['12','Глубокое мышление','Ларпинг','Подумали? Запишите мысль.','thinking_room'],
 ['13','Качество кода','Ларпинг','Меньше объектов. Крупнее проблема.','final_result'],
 ['14','Посмотреть свой вклад','Ларпинг','Вы задавали направление.','pass_question'],
 ['15','Добавить члена команды','Методички','Большой. Ещё один. На удалёнке.','unexplained_image'],
 ['16','Расширенный А.Н.А.Л.','Методички','Увеличение до полного непонимания.','deep_analysis'],
 ['17','Показать результат','Методички','Это финальная версия?','final_result'],
 ['18','Сдать анализ','Методички','Прикрепите данные. Добавьте воды.','analysis_sample'],
 ['19','Смыть правки','Методички','Ещё одна небольшая правка.','thinking_room'],
 ['20','Сделать прилично','Методички','Первые буквы можно прикрыть.','unexplained_image'],
 ['21','Фича, баг или дизайнер','Защита','Определите судьбу картинки.','unexplained_image'],
 ['22','Убрать непонятное','Защита','Это мы поняли. Остальное убрали.','unexplained_image'],
 ['23','Показать доказательство','Защита','Неубедительно? Будет два.','proof_image'],
 ['24','Объяснить картинку','Защита','Визуальная метафора. Чего?','unexplained_image'],
 ['25','Передать вопрос','Защита','Следующий. Предыдущий. Снова вы.','pass_question'],
 ['26','Исправить подпись','Защита','Ваши слова ещё пригодятся.','unexplained_image'],
 ['27','Получить сертификат','Защита','Только ваши реальные игровые подвиги.','unexplained_image'],
 ['28','Ещё один вопрос','Защита','А это?','last_question'],
].map(([id,title,group,description,image])=>({id,title,group,description,image}));

const tours={tour:['01','03','08','11','15','21','24','27','28'],incident:['opening','11','21','24','27','28']};
const picture=(key,caption='',scale=1)=>({key,caption,scale});
const remember=(s,key,label,value='',image=null)=>{
 const fact={key,label,value,image};const i=s.facts.findIndex(x=>x.key===key);
 if(i<0)s.facts.push(fact);else s.facts[i]=fact;
};
const option=(id,label,run,extra={})=>({id,label,run,...extra});
const change=(id,label,patch,feedback)=>option(id,label,s=>{Object.assign(s.local,patch);s.feedback=feedback||'';});
const done=(id,label,key,value='',image=null)=>option(id,label,s=>{
 if(key)remember(s,key,value,'',image);finishChapter(s);
});
function finishChapter(s){
 if(s.scene!=='opening')s.visited=[...new Set([...s.visited,s.scene])];
 s.checkpoint={scene:s.scene,local:structuredClone(s.local)};
 s.scene='interlude';s.feedback='';
}
function enter(s,id){s.scene=id;s.local={};s.feedback='';}
function finalize(s){s.status='completed';s.scene='summary';s.completedAt=new Date().toISOString();s.feedback='';}
const routeName=id=>sceneCatalog.find(x=>x.id===id)?.title||'Не та вкладка';

export function createShow(id,raw={},previousId=null){
 const mode=raw.mode??'tour';
 if(!['tour','incident','free'].includes(mode))throw new Error('Неизвестный маршрут.');
 const sceneId=raw.sceneId??'01';
 if(mode==='free'&&!sceneCatalog.some(x=>x.id===sceneId))throw new Error('Сцена не найдена.');
 const plan=mode==='free'?[sceneId]:[...tours[mode]];
 return {id,version:1,revision:0,createdAt:new Date().toISOString(),previousId,
  config:{mode,sceneId},plan,cursor:0,scene:plan[0],status:'active',local:{},feedback:'',
  facts:[],visited:[],events:[],assets:structuredClone(memeAssets)};
}

function scene(s){
 const l=s.local,n=l.count||0,art=l.image||'unexplained_image';
 const v={title:routeName(s.scene),body:'',images:[],actions:[],input:null,visual:null};
 const set=(id,label,patch,feedback)=>change(id,label,patch,feedback);
 const fact=(id,label,key,value,image)=>done(id,label,key,value,image);
 const text=(id,label,key,title,image,allowEmpty=false)=>option(id,label,(r,value)=>{remember(r,key,title,value||'—',image);finishChapter(r);},{input:true,allowEmpty});
 if(s.scene==='opening')return {...v,title:'Объясните это.',body:'Вы показали не ту вкладку. Руководитель остался после созвона. С какой легендой зайдёте?',images:[picture('research_evidence')],actions:[
  option('research','Это исследование аудитории',r=>enter(r,'01')),
  option('virus','Это вирус',r=>enter(r,'02')),
  option('colleague','Коллега прислал',r=>enter(r,'03')),
  option('ai','Это всё нейросеть',r=>enter(r,'04')),
  fact('honest','Моя вкладка. Открыл по ошибке.','honest','Признал ошибку без легенды'),
 ]};
 if(s.scene==='interlude'){
  const next=s.plan[s.cursor+1];
  return {...v,title:'Запомнили.',body:s.facts.at(-1)?.label||'Можно продолжать. Эта сцена сохранена.',recap:true,actions:[
   ...(next?[option('next',`Дальше · ${routeName(next)}`,r=>{r.cursor++;enter(r,r.plan[r.cursor]);})]:[]),
   option('choose','Выбрать следующую подставу',r=>enter(r,'choose')),
   option('finish','Собрать финал',finalize),
  ]};
 }
 if(s.scene==='choose')return {...v,title:'Во что ещё вляпаться?',body:'Продолжайте эту же попытку. Все прежние решения попадут в финал.',catalog:true,actions:[
  ...sceneCatalog.map(c=>option('scene-'+c.id,c.title,r=>{r.plan=r.plan.slice(0,r.cursor+1);r.plan.push(c.id);r.cursor++;enter(r,c.id);})),option('finish','Собрать финал',finalize),
 ]};
 switch(s.scene){
 case '01':
  v.title=l.step==='explain'?'Графика нет. Начинайте.':l.step==='files'?'Который из них?':'Покажите результаты.';
  v.body=l.step==='conclusion'?'Вы досмотрели. Это и есть вывод. Руководитель: «А рабочий результат?»':'Рис. 1. Сейчас кто-то должен объяснить, зачем он здесь.';
  v.images=[picture('research_evidence','Рис. 1'),...(l.step==='files'?[picture('research_evidence','Нет, этот',1.3)]:[])];
  if(l.step==='explain'){v.input={label:'Главный вывод исследования',placeholder:'Объясните картинку одной фразой…'};v.actions=[text('save','Защитить вывод','research','Главный вывод исследования','research_evidence')];}
  else if(l.step==='files')v.actions=[set('left','Вот этот',{step:'explain'}),set('right','Нет, этот',{step:'explain'})];
  else v.actions=[set('explain','Объяснить график',{step:'explain'}),set('files','Это не тот файл',{step:'files'}),set('conclusion','Перейти к выводам',{step:'conclusion'}),fact('insist','Это и есть результат','research','Исследование завершено. Работа не начата.','research_evidence')];
  v.actions.push(fact('admit','Ладно, я выдумал','honest','Отказался от выдуманного исследования'));break;
 case '02':
  v.title=l.started?(l.senior?'Старший вирус':'Вирус'):'Запустим диагностику?';
  v.body=l.started?'Независимый специалист подключился.':'Это игровая диагностика. В файлы компьютера никто не смотрит.';
  if(l.started){v.images=[picture('virus_expert',l.senior?'Старший вирус':'Вирус',l.senior?1.5:1)];v.actions=[set('who','Это ты открыл?',{},'нет'),set('me','А кто?',{},'ты'),option('senior','Позвать другого специалиста',r=>{r.local.senior=true;remember(r,'virus','Консультировался со старшим вирусом','','virus_expert');})];}
  else v.actions=[set('start','Запустить диагностику',{started:true})];
  v.actions.push(fact('admit','Признать ошибку','honest','Признал ошибку после консультации с вирусом'));break;
 case '03':
  v.title=l.started?'Следующий докладчик, объясните.':'Ссылка от коллеги';
  v.body=l.started?'Что именно вы прислали? Слово переходит человеку рядом.': 'Экран ваш. Ссылка, конечно, чужая.';
  if(!l.started)v.actions=[set('pass','Передать слово коллеге',{started:true})];
  else {v.images=[picture('colleague_evidence')];v.actions=[set('deny','Я такого не присылал',{},'Тогда почему предыдущий докладчик уверен?'),fact('own','Да, это моё','owner','Автор подтвердил','colleague_evidence'),option('ours','Это наш общий результат',r=>{remember(r,'team-cover','Общий результат команды','','colleague_evidence');finishChapter(r);}),fact('return','Вернуть слово','returned','Ответственность возвращена отправителю')];}break;
 case '04':
  v.title=l.open?'Покажем запрос.':'Это всё нейросеть';v.body=l.open?'Игровая переписка. Похожие запросы — совпадение.':'И кто же сформулировал задачу?';
  if(l.open){v.transcript=['Вы: сделай','ИИ: что именно?','Вы: ты понял','Вы: ещё',...(l.more?['Вы: да, именно это']:[])];v.images=l.hidden?[]:[picture('ai_receipt')];v.actions=[set('wrong','Меня неправильно поняли',{more:true}),set('limits','Я тестировал ограничения',{},'Чьи? Свои?'),option('hide','Удалить переписку',r=>{r.local.hidden=true;remember(r,'receipt-hidden','Пытался убрать переписку со слайда','','ai_receipt');r.feedback='Карточка закрыта. Миниатюра осталась в итогах.';}),fact('own','Это мой запрос','prompt-author','Признал свой запрос к ИИ','ai_receipt')];}
  else v.actions=[set('open','Показать запрос',{open:true})];break;
 case '05':
  v.title=n===0?'Уберите картинку':n===1?'Теперь это аватар.':'Теперь аккуратно.';
  v.images=n?[picture('unexplained_image','Ваш аватар')]:[picture('unexplained_image')];v.visual={type:'avatar',level:n};
  v.actions=[...(n<2?[set('hide',n?'Убрать и оттуда':'Убрать с экрана',{count:n+1})]:[]),fact('keep','Оставить','avatar','Выбрал аватар','unexplained_image'),fact('exit','Продолжить без картинки','avatar-dismissed','Закрыл картинку')];break;
 case '06':
  v.title='Не включайте звук';v.images=l.on?[picture('silent_image','',1+n*.25)]:[];
  v.actions=l.on?[set('silent','Ничего не слышно',{},'Это картинка.'),set('louder','Сделать громче',{count:Math.min(4,n+1)}),fact('ok','Теперь нормально','png-sound','Настроил звук у PNG','silent_image')]:[set('on','Включить звук',{on:true})];break;
 case '07':
  v.title='Сделай круче';v.images=[picture('generated_result','',1+n*.3)];v.body=n>=3?'Крупнее уже некуда.':'Результат готов. Улучшаем?';
  v.actions=[...(n<3?[set('bigger','Сделай круче',{count:n+1})]:[]),set('normal','Сделай нормально',{count:0}),fact('accept','Вот теперь продукт','bigger-result',`Утвердил результат в масштабе ${100+n*30}%`,'generated_result')];break;
 case '08':
  v.title='Спросить другую ИИ';v.images=Array.from({length:Math.min(3,n+1)},(_,i)=>picture('generated_result',['Первая ИИ','Первая нейросеть ошиблась','Обе ошиблись'][i]));
  v.body=n===2?'Кому верить?':'Экспертное мнение готово.';
  v.input=l.own?{label:'Что именно вы выбираете?',placeholder:'Своими словами…'}:null;
  v.actions=[...(n<2?[set('another',n?'Спросить третью':'Спросить другую нейросеть',{count:n+1})]:[]),...Array.from({length:n+1},(_,i)=>fact('pick-'+i,['Этой','Вот этой','Нет, вот этой'][i],'ai-choice',`Выбрал копию № ${i+1} из ${n+1}`,'generated_result')),l.own?text('save','Зафиксировать выбор','own-choice','Объяснил свой выбор','generated_result'):set('own','Выбрать самому',{own:true})];break;
 case '09':{
  const cm=l.cm??12;v.title='Длина промпта';v.body=l.sent?'Размер запроса изменился. Результат — перед вами.':'Добавьте убедительности. Измеряем в сантиметрах.';
  v.visual={type:'prompt',cm};v.transcript=[l.prompt||'сделай'];if(l.sent)v.images=[picture('generated_result')];
  const grow=(id,label,add,word)=>option(id,label,r=>{r.local.cm=Math.min(40,cm+add);r.local.prompt=((l.prompt||'сделай')+' '+word).slice(-240);r.local.sent=false;});
  v.actions=[grow('please','Добавить «пожалуйста»',1,'пожалуйста'),grow('expert','Ты эксперт мирового уровня',3,'ты эксперт мирового уровня'),grow('need','Очень надо',2,'очень надо'),set('short','Сократить',{cm:4,prompt:'сделай',sent:false}),set('run','Запустить',{sent:true}),fact('accept','Принять результат','prompt-size',`Защитил промпт длиной ${cm} см`,'generated_result')];break;}
 case '10':
  v.title='Верни как было';v.images=[picture('generated_result','Было'),picture('generated_result','Стало')];
  v.actions=[fact('left','Левая лучше','revert','Выбрал левую копию. Результат трёх итераций.','generated_result'),fact('right','Правая лучше','revert','Выбрал правую копию. Результат трёх итераций.','generated_result'),fact('same','Они одинаковые','review','Готов к код-ревью: заметил одинаковые копии','generated_result')];break;
 case '11':
  v.title=l.expert?'Отлично. Что это?':'Объяснить архитектуру';v.body=l.passed?'Технический специалист — следующий докладчик.':'ChatGPT → непонятная хуйня → localhost';
  v.images=n?[picture('architecture_core','Средний блок',1+(n-1)*.6)]:[];
  v.actions=[...(n<3?[set('detail',n?'Ещё подробнее':'Подробнее',{count:n+1})]:[]),set('pass','Это объяснит технический специалист',{passed:true}),set('expert','Я технический специалист',{expert:true,count:Math.max(1,n)}),fact('honest','Мы сами пока не разобрались','architecture','Описал основу: правила сценария и локальное сохранение'),fact('approve','Теперь всё понятно','architecture-image','Утвердил средний блок архитектуры','architecture_core')];break;
 case '12':
  v.title=l.ready?'Что придумал?':'Глубокое мышление';v.images=[picture('thinking_room')];v.body=n?'Ещё?':'Можно подумать. Можно сразу записать мысль.';
  v.input=l.ready?{label:'Что придумал?',placeholder:'Можно оставить пустым'}:null;
  v.actions=[set('think',n?'Да, ещё':'Думаю',{count:n+1},'Ещё?'),...(l.ready?[text('save','Записать мысль','thought','Мысль','thinking_room',true)]:[set('ready','Готово',{ready:true})])];break;
 case '13':
  v.title='Качество кода';v.body=l.optimized?'Одна большая проблема.':'Проверка завершена.';v.visual={type:'quality',count:l.count??3,big:!!l.optimized};
  v.actions=[set('fix','Исправить',{count:Math.max(1,(l.count??3)-1),optimized:false}),set('optimize','Оптимизировать',{count:1,optimized:true}),set('rewrite','Переписать с нуля',{count:3,optimized:false}),fact('accept','Принять работу','quality',l.optimized?'Утвердил одну большую проблему':`Утвердил качество: ${l.count??3} 💩`,'final_result')];break;
 case '14':
  v.title='Мой вклад';v.body='Задал направление.';v.images=[picture('pass_question','На ИИ',1+n*.2)];
  v.input=l.idea?{label:'Ваша идея',placeholder:'Запишем ваш настоящий вклад в игру'}:null;
  v.actions=[set('detail','Показать подробнее',{count:Math.min(4,n+1)}),option('review','Я ещё проверял',r=>{remember(r,'contribution-review','Проверял: написал «норм»');r.feedback='Написал «норм».';}),l.idea?text('save','Записать идею','idea','Идея игрока',null):set('idea','Я отвечал за идеи',{idea:true}),fact('accept','Направление задано','direction','Задал направление стрелкой','pass_question')];break;
 case '15':
  v.title=l.accepted?'Команда укомплектована':'Добавить члена команды';v.body=l.remote?'Работает из дома.':'Подберите состав.';v.visual={type:'team',big:!!l.big,count:l.count??1,remote:!!l.remote};
  v.actions=[set('big','Большой',{big:true,remote:false}),set('another','Ещё один',{count:Math.min(5,(l.count??1)+1),remote:false}),set('remote','На удалёнке',{remote:true}),option('show','Показать команду',r=>{r.local.accepted=true;remember(r,'team',l.remote?'Укомплектовал команду удалённым членом':`Добавил членов команды: ${l.count??1}${l.big?' (больших)':''}`);r.feedback='Команда укомплектована.';})];break;
 case '16':
  v.title='Расширенный А.Н.А.Л.';v.images=n?[picture('deep_analysis',`${Math.pow(2,n-1)*100}%`,Math.pow(2,n-1))]:[];
  v.actions=[...(n<4?[set('deeper',n===0?'Углубиться':n===1?'Глубже':'Ещё',{count:n+1})]:[]),fact('understood','Теперь понятно','analysis',`Посмотрел на ${n?Math.pow(2,n-1)*100:100}%. Согласился.`,'deep_analysis'),fact('exit','Выйти из анализа','analysis-exit','Вышел из анализа')];break;
 case '17':
  v.title=l.client?'Это финальная версия?':'Показать результат';v.images=[picture('final_result','',l.hi?1.8:1)];
  v.actions=l.client?[fact('yes','Да','final-result','Утвердил финальную версию','final_result'),set('no','Нет',{client:false},'Тогда зачем показал?')]:[set('hi','В высоком качестве',{hi:true}),set('client','Показать заказчику',{client:true})];break;
 case '18':
  v.title='Сдать анализ';v.body=l.submitted?'Анализ принят. Где аналитика?':'Ваш вывод и прикреплённые данные.';v.images=[picture('analysis_sample')];
  v.input={label:'Ваш вывод',placeholder:'В целом…',value:l.draft||''};
  v.transcript=l.water?Array.from({length:Math.min(4,l.water)},()=> 'в целом, как бы, в некотором смысле'):[];
  v.actions=[set('attach','Прикрепить данные',{attached:true},'Данные прикреплены.'),option('water','Разбавить водой',(r,value)=>{r.local.water=(l.water||0)+1;r.local.draft=value;},{capture:true}),option('submit','Сдать',(r,value)=>{remember(r,'sample','Сдал анализ',value||'Вывод отсутствует','analysis_sample');r.local.submitted=true;r.local.draft=value;r.feedback='Анализ принят. Где аналитика?';},{input:true,allowEmpty:true})];break;
 case '19':
  v.title='Смыть правки';v.images=[picture('thinking_room')];v.visual={type:'flush',count:n,labels:Array.from({length:Math.min(5,n||3)},(_,i)=>n?'Ещё одна небольшая правка':`Правка № ${i+1}`)};
  v.body=n?`Вернулось правок: ${Math.min(5,n)}.`:'Кнопка действует только на эти игровые карточки.';
  v.actions=[set('flush',n?'Смыть ещё раз':'Смыть',{count:n+1},'Готово. Ещё одна небольшая правка.'),fact('keep','Оставить как есть','flush',`Смывал правки ${n} раз. Они вернулись.`,'thinking_room')];break;
 case '20':
  v.title=l.checked?'Запрещённых слов не найдено.':'Сделать прилично';v.visual={type:'censor',hidden:!!l.hidden,checked:!!l.checked,covered:!!l.covered};
  v.actions=[...(!l.hidden?[set('hide','Сделать прилично',{hidden:true})]:!l.checked?[set('check','Проверить результат',{checked:true})]:!l.covered?[set('cover','И это тоже',{covered:true})]:[]),fact('enough','Достаточно','censor','Проверил приличность интерфейса')];break;
 case '21':
  v.title=l.designer?'Дизайнер, объясните.':'Обоснование решения';v.images=[picture('unexplained_image')];
  if(l.bug){v.body='Описание бага';v.input={label:'Что здесь сломано?',placeholder:'При желании уточните'};v.actions=[text('bugsave','Зафиксировать баг','bug','Назвал картинку багом','unexplained_image',true)];}
  else v.actions=[fact('feature','Это фича','feature','Добавил картинку в функции','unexplained_image'),set('bug','Это баг',{bug:true}),set('designer','Это дизайнер',{designer:true}),fact('logo','Так и задумано','logo','Утвердил новый логотип','unexplained_image')];
  break;
 case '22':
  v.title=l.removed?'':'Убрать непонятное';v.minimal=!!l.removed;v.images=[picture('unexplained_image')];
  v.actions=l.removed?[set('why','А это почему осталось?',{},'Это мы поняли.'),set('restore','Вернуть интерфейс',{removed:false}),fact('better','Так лучше','minimal','Одобрил интерфейс из одной картинки','unexplained_image')]:[set('remove','Убрать непонятное',{removed:true})];break;
 case '23':
  v.title='Показать доказательство';v.images=Array.from({length:l.double?2:1},()=>picture('proof_image'));
  v.body=l.source?'Источник: брат':l.double?'Теперь два.':'';
  v.input=l.doubt?{label:'Каких данных не хватает?',placeholder:'Сформулируйте проверяемый вопрос'}:null;
  v.actions=[set('double','Это не доказывает',{double:true}),set('source','Показать первоисточник',{source:true}),fact('believe','Верю','proof','Принял доказательство','proof_image'),l.doubt?text('save','Записать вопрос','proof-question','Запросил данные',null):set('doubt','Не верю',{doubt:true})];break;
 case '24':{
  const assigned=s.facts.find(x=>x.key==='logo'||x.key==='feature')?.image||'unexplained_image';
  v.title=l.metaphor?'Чего?':'Объясните картинку';v.images=[picture(assigned)];v.input={label:l.metaphor?'Метафора чего?':'Ваше объяснение',placeholder:'Это здесь потому, что…'};
  v.actions=[set('ai','Спросить ИИ',{},'Потому что вы её сюда поставили.'),text('save','Объяснить самому','explanation','Объяснение автора',assigned),set('metaphor','Это визуальная метафора',{metaphor:true})];break;}
 case '25':
  v.title=n>=2?'Вопрос вернулся.':'Это вопрос к коллеге';v.body=n===0?'Следующий докладчик.':n===1?'Предыдущий докладчик.':'Ладно, кто ответит?';v.visual={type:'direction',direction:n===0?'→':n===1?'←':'↓'};v.images=[picture('pass_question')];
  v.actions=[...(n<2?[set('next',n?'Ещё дальше':'Дальше',{count:n+1})]:[]),fact('answer','Ладно, отвечу','returned-question',`Передал вопрос ${n} раз и получил обратно`,'pass_question')];break;
 case '26':
  v.title=l.saved?'Авторское название':'Исправить подпись';v.images=[picture(art,l.saved?l.draft:'Без названия')];v.input={label:'Название картинки',placeholder:'Ваш вариант',value:l.draft||''};
  v.actions=[option('save','Готово',(r,value)=>{const previous=r.facts.find(x=>x.key==='caption');if(previous&&previous.value!==value)remember(r,'old-caption','Предыдущая редакция подписи',previous.value,art);r.local.draft=value;r.local.saved=true;remember(r,'caption','Авторское название',value,art);},{input:true}),...(l.saved?[set('edit','Я не это имел в виду',{saved:false}),fact('approve','Всё верно',null)]:[])];break;
 case '27':
  v.title='Подтверждено: ЧЛЕН команды';v.body='Ваши игровые решения. Каждое действительно было нажато.';v.certificate=true;
  v.actions=[set('role','Исправить должность',{editing:true}),...(l.editing?['Junior','Senior','Я просто рядом стоял'].map((name,i)=>option('role-'+i,name,r=>{remember(r,'role','Должность',name);r.local.editing=false;})):[]),fact('approve','Утвердить сертификат','certificate','Утвердил сертификат ЧЛЕНА команды')];break;
 case '28':
  v.title=l.open?'А это?':'Вопросов нет?';v.images=l.open?[picture('last_question',l.version?'финал_точно_2':'')]:[];
  v.actions=l.open?[set('last','Последняя правка',{version:true}),option('pass','Отвечает следующий',r=>{remember(r,'last-pass','Передал последний вопрос следующему','','last_question');r.feedback='Слово следующему докладчику.';}),option('end','Закончить',r=>{remember(r,'last-question','Пережил последний вопрос','','last_question');r.visited=[...new Set([...r.visited,'28'])];finalize(r);})]:[set('none','Вопросов нет',{open:true})];break;
 default:throw new Error('Сцена не найдена.');
 }
 // Every scene has a reliable, persistent exit, including repeatable visual jokes.
 v.actions.push(option('continue','Продолжить',finishChapter));
 return v;
}

export function actShow(original,input){
 if(original.status!=='active')throw new Error('Показ завершён. Начните новую попытку.');
 if(input.revision!==original.revision)throw new Error('Этот экран уже изменился. Обновите страницу.');
 if(original.events.length>=1000&&input.action!=='end-run')throw new Error('Лимит этой попытки достигнут. Сохраните финал.');
 const view=scene(original),a=input.action==='end-run'?option('end-run','Собрать финал',finalize):view.actions.find(x=>x.id===input.action);
 if(!a)throw new Error('Действие недоступно в этой сцене.');
 let text='';
 if(a.input||a.capture){if(input.text!==undefined&&typeof input.text!=='string')throw new Error('Ответ должен быть текстом.');text=(input.text||'').trim();if(text.length>400)throw new Error('Ответ — до 400 символов.');if(a.input&&!a.allowEmpty&&!text)throw new Error('Напишите одну фразу.');}
 const s=structuredClone(original);s.feedback='';a.run(s,text);s.revision++;s.updatedAt=new Date().toISOString();
 s.events.push({scene:original.scene,action:a.id,label:a.label,...((a.input||a.capture)?{text}:{}),revision:s.revision});
 return s;
}
export function publicShow(s){
 const {events,checkpoint,...safe}=s;
 if(s.status==='completed')return {...safe,view:{title:'Вы это утвердили.',body:'Теперь можно объяснить, как вы сюда пришли.',summary:true,actions:[],images:[]}};
 const v=scene(s);return {...safe,view:{...v,actions:s.events.length>=1000?[]:v.actions.map(({run,...a})=>a)}};
}
