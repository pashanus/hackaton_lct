import {mediaFiles} from './media-catalog.js';
const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function chatMedia(message){
 const a=message?.attachment;
 if(!a||!mediaFiles.includes(a.src))return '';
 const title=esc(a.alt||'Вложение менеджера');
 const content=a.type==='image'&&/\.(png|jpe?g|webp)$/.test(a.src)?`<img src="${esc(a.src)}" alt="${title}" loading="lazy">`:a.type==='video'&&a.src.endsWith('.mp4')?`<video controls playsinline preload="metadata" ${mediaFiles.includes(a.poster)?`poster="${esc(a.poster)}"`:''} aria-label="${title}"><source src="${esc(a.src)}" type="video/mp4">${mediaFiles.includes(a.captions)?`<track kind="subtitles" src="${esc(a.captions)}" srclang="ru" label="Русские субтитры" default>`:''}</video>`:'';
 return content?`<figure class="chat-attachment">${content}<figcaption>${esc(a.caption||'')}</figcaption></figure>`:'';
}
export function lastManagerReply(session){
 const m=session.messages.at(-1);
 return m?.source==='scripted-manager'?`<section class="manager-last-reply"><span class="eyebrow">ПОСЛЕДНИЙ ОТВЕТ · ${esc(session.config.role)}</span><p>${esc(m.text)}</p>${chatMedia(m)}</section>`:'';
}
