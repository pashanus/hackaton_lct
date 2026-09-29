import {rudeIcon} from './satire-ui.js';
import {memeAssets} from './meme-assets.js';
export const showEscape=(value='')=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e=showEscape;
const groups={all:'Все сцены',incident:'Вкладка',larp:'Ларпинг',methods:'Методички',defense:'Защита'};
function image(key,assets=memeAssets,caption='',extra=''){
 const a=assets[key]||memeAssets.unexplained_image;
 return `<figure class="show-image ${extra}"><button type="button" class="show-image-open" data-show-image="${e(key)}" aria-label="Увеличить: ${e(a.alt)}"><img src="${e(a.src)}" alt="${e(a.alt)}" loading="lazy" data-meme-key="${e(key)}"><span class="show-zoom" aria-hidden="true">↗</span></button>${caption?`<figcaption>${e(caption)}</figcaption>`:''}</figure>`;
}
export function showEntry(group='all'){
 const text={all:['Нажал. Объясняй.','28 подстав, картинки по клику и финал с вашими же словами.'],larp:['Есть к ИИ ещё вопросы?','Размер промпта, три одинаковых ответа и глубокое мышление.'],methods:['Теперь попробуйте руками.','Добавить члена, углубиться в А.Н.А.Л. и сделать прилично.'],incident:['У вас есть легенда?','Исследование, вирус, коллега или нейросеть. У каждого ответа своё продолжение.']}[group]||['Продолжим?','Сохраняем решения и припоминаем их в финале.'];
 return `<section class="show-entry"><div><span class="sat-kicker">НОВЫЕ СЦЕНЫ / 28 СПОСОБОВ ОБЪЯСНИТЬ</span><h2>${text[0]}</h2><p>${text[1]}</p></div><div>${group==='incident'?'<button class="btn dark" data-new-show="incident">Защищать свою легенду ↗</button>':'<button class="btn dark" data-new-show="tour">Пройти маршрут защиты ↗</button>'}<a href="#playground/${group}" class="sat-text-link">Выбрать подставу</a></div></section>`;
}
export function showHome(data,filter='all'){
 const scenes=data.sceneCatalog||[],selection=groups[filter]||groups.all,filtered=scenes.filter(c=>selection===groups.all||c.group===selection);
 const recent=(data.shows||[]).find(x=>x.status==='active');
 return `<div class="sat-page-title"><span class="sat-kicker">ВЫ УЖЕ НАЖАЛИ / ТЕПЕРЬ ОБЪЯСНЯЙТЕ</span><h1>Кнопки есть.<br><span>Ответы — ваши.</span></h1><p>Начните отдельную сцену или пройдите готовый маршрут. Выборы останутся в финале.</p></div><div class="show-starts"><button class="btn primary" data-new-show="tour">Маршрут защиты · 9 сцен ↗</button><button class="btn outline" data-new-show="incident">Не та вкладка · 6 этапов</button>${recent?`<a class="btn outline" href="#show/${recent.id}">Продолжить показ ↗</a>`:''}</div><nav class="show-filters" aria-label="Разделы подстав">${Object.entries(groups).map(([id,label])=>`<a href="#playground/${id}" ${selection===label?'aria-current="page"':''}>${label}<small>${id==='all'?scenes.length:scenes.filter(c=>c.group===label).length}</small></a>`).join('')}</nav><div class="show-catalog">${filtered.map(c=>`<article class="show-scene-card"><div class="show-scene-image">${image(c.image)}</div><div class="show-scene-copy"><span class="sat-kicker">${c.id} / ${e(c.group)}</span><h2>${e(c.title)}</h2><p>${e(c.description)}</p><button class="btn dark full" data-show-scene="${c.id}">Открыть сцену ↗</button></div></article>`).join('')}</div><p class="show-footnote">Картинки пока временные. Переписки и события — вымышленные игровые сцены.</p>`;
}
function facts(s,compact=false){
 if(!s.facts.length)return `<div class="show-empty-facts">Пока вы ничего не утвердили.<br>Удивительная выдержка.</div>`;
 return `<div class="show-facts ${compact?'compact':''}">${s.facts.map(f=>`<article>${f.image?image(f.image,s.assets):''}<div><span class="sat-kicker">${e(f.label)}</span>${f.value?`<blockquote>${e(f.value)}</blockquote>`:''}</div></article>`).join('')}</div>`;
}
function certificate(s){
 const role=s.facts.find(x=>x.key==='role')?.value||'ЧЛЕН команды';
 const logo=s.facts.find(x=>x.key==='logo')||s.facts.find(x=>x.key==='team-cover')||s.facts.find(x=>x.key==='avatar');
 return `<section class="show-certificate"><div class="show-certificate-top"><span>АРЕНА. / ПОДТВЕРЖДЕНО НАЖАТИЯМИ</span><span>№ ${e(s.id.slice(0,8))}</span></div>${logo?image(logo.image,s.assets,logo.label):rudeIcon('member','show-seal')}<span class="sat-kicker">СЕРТИФИКАТ</span><h2>${e(role)}</h2><p>Сцен пройдено: ${s.visited.length}. Ниже — ваши игровые решения.</p>${facts(s)}</section>`;
}
function special(v){
 const x=v.visual;if(!x)return '';
 if(x.type==='prompt')return `<div class="show-prompt-meter">${rudeIcon('member')}<strong>${x.cm}<small>см</small></strong><div style="width:${Math.min(100,x.cm/40*100)}%"></div></div>`;
 if(x.type==='quality')return `<div class="show-quality ${x.big?'big':''}">${Array.from({length:x.count},()=>rudeIcon('poop')).join('')}</div>`;
 if(x.type==='team')return `<div class="show-team ${x.big?'big':''}">${x.remote?'<span>⌂<br>Работает из дома</span>':Array.from({length:x.count},()=>rudeIcon('member')).join('')}</div>`;
 if(x.type==='direction')return `<div class="show-direction">${x.direction}</div>`;
 if(x.type==='flush')return `<div class="show-flush ${x.count?'flushed':''}" aria-label="Игровые правки">${x.labels.map(t=>`<span>${e(t)}</span>`).join('')}</div>`;
 if(x.type==='censor')return `<div class="show-censor"><div class="show-words ${x.hidden?'hidden':''}"><span>П.Е.Р.Д.Ё.Ж.</span><span>А.Н.А.Л.</span><span>П.Е.Н.И.С.</span></div><p>Подготовка. Естественный контакт. Разведка интересов.</p>${x.checked?`<div class="show-censored-icon ${x.covered?'covered':''}">${rudeIcon('member')}</div>`:''}</div>`;
 return '';
}
function actions(v){
 return `<form id="show-action-form">${v.input?`<label class="field show-input">${e(v.input.label)}<textarea aria-label="${e(v.input.label)}" name="answer" rows="3" maxlength="400" placeholder="${e(v.input.placeholder||'')}" aria-describedby="show-input-note">${e(v.input.value||'')}</textarea><small id="show-input-note">До 400 символов. Ваша фраза может вернуться в финале.</small></label>`:''}<div class="show-actions">${v.actions.map(a=>`<button type="${a.input?'submit':'button'}" ${a.input?'name="action" value="'+e(a.id)+'"':''} class="${a.id==='continue'?'show-continue':''}" data-show-action="${e(a.id)}" ${a.input?'data-needs-text="true"':''}><span>${e(a.label)}</span><b aria-hidden="true">↗</b></button>`).join('')}</div></form>`;
}
export function showView(s,catalog){
 if(!s)return '<section class="empty"><h1>Показ не найден</h1><a href="#playground" class="btn primary">К сценам</a></section>';
 const v=s.view,c=catalog.find(x=>x.id===s.scene),total=s.plan.length;
 const heading=`<div class="show-run-head"><a class="back" href="#playground">← Все 28 подстав</a><span>${s.config.mode==='free'?'СВОБОДНЫЙ ПОКАЗ':`МАРШРУТ / ${Math.min(s.cursor+1,total)} ИЗ ${total}`} · ${s.visited.length} пройдено</span>${s.status==='active'?'<button class="btn outline small" data-show-action="end-run">Завершить показ</button>':''}</div>`;
 if(v.summary)return `${heading}<div class="sat-page-title"><span class="sat-kicker">ВСЁ ЗАПИСАНО / ТОЛЬКО ИГРОВЫЕ РЕШЕНИЯ</span><h1>Вы это<br><span>утвердили.</span></h1><p>Сохранено на этом ноутбуке. Можно вернуться к результату из истории.</p></div>${certificate(s)}<div class="show-end-actions"><button class="btn primary" data-show-repeat="${s.id}">Повторить маршрут ↺</button><button class="btn outline" data-show-export="${s.id}">Сохранить итоги</button><a class="btn outline" href="#playground">Другие сцены</a></div>`;
 if(v.catalog)return `${heading}<div class="sat-page-title"><h1>${v.title}</h1><p>${v.body}</p></div><div class="show-picker">${v.actions.filter(a=>a.id.startsWith('scene-')).map(a=>`<button data-show-action="${a.id}"><span>${a.id.slice(6)}</span>${e(a.label)}<b>↗</b></button>`).join('')}</div>`;
 const avatar=s.facts.find(f=>f.key==='avatar');
 return `${heading}<div class="show-play-layout ${v.minimal?'minimal':''}"><section class="show-stage"><div class="show-stage-heading"><span class="sat-kicker">${c?`${c.id} / ${e(c.group)}`:s.scene==='interlude'?'ПРОМЕЖУТОЧНЫЙ ИТОГ':'НЕ ТА ВКЛАДКА'}${avatar?' / С НОВЫМ АВАТАРОМ':''}</span><h1 tabindex="-1" id="show-title">${e(v.title)}</h1>${v.body?`<p>${e(v.body)}</p>`:''}</div>${v.transcript?`<div class="show-transcript">${v.transcript.map(t=>`<p>${e(t)}</p>`).join('')}</div>`:''}${v.certificate?certificate(s):''}${special(v)}<div class="show-images ${v.images?.length>1?'multiple':''} ${v.visual?.type==='avatar'?'avatar-mode avatar-'+v.visual.level:''}">${(v.images||[]).map(i=>`<div class="show-scaled" style="--meme-scale:${i.scale}">${image(i.key,s.assets,i.caption)}</div>`).join('')}</div>${s.feedback?`<div class="show-feedback" role="status">${e(s.feedback)}</div>`:''}${v.recap?facts(s,true):''}${actions(v)}</section><aside class="show-notebook">${avatar?image(avatar.image,s.assets,'Ваш аватар'):''}<span class="sat-kicker">УЖЕ НАЖАЛИ</span><h2>Потом <br>припомним.</h2><p>Картинки и объяснения возвращаются в финале.</p>${facts(s,true)}<a href="#history">История показов ↗</a></aside></div>`;
}
export function showHistory(data){
 const shows=data.shows||[];if(!shows.length)return '';
 return `<section class="show-history"><div class="section-heading"><h2>Защита и подставы</h2><span>${shows.length}</span></div><div class="history-list">${shows.map(s=>`<a class="history-row" href="#show/${s.id}"><span class="history-icon">${rudeIcon('brain')}</span><div><h3>${s.config.mode==='incident'?'Не та вкладка · легенда':s.config.mode==='tour'?'Маршрут защиты':'Свободный показ'}</h3><p>${new Date(s.createdAt).toLocaleDateString('ru-RU')} · ${s.visited.length} сцен · ${s.facts.length} решений</p></div><span class="history-status">${s.status==='completed'?'Финал сохранён':'Продолжить ↗'}</span></a>`).join('')}</div></section>`;
}
export function showExport(s){return ['# Вы это утвердили',`Показ ${s.id}`,`Создан: ${s.createdAt}`,`Сцен пройдено: ${s.visited.length}`,'','Вымышленные игровые ситуации. Ниже — фактические решения игрока в приложении.','',...s.facts.flatMap(f=>[`## ${f.label}`,f.value||'',f.image?`Картинка: ${s.assets[f.image]?.src||f.image}`:'',''])].join('\n');}
