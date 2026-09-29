import {randomInt} from 'node:crypto';
import {chatAttachments} from './public/media-catalog.js';

export const managerLines = [
 'Ясно. Пошёл нахуй.',
 'Чё маме, чё папе, чё бабке в тапки.',
 'Ты мне сейчас мозг вынес. Верни на место, блядь.',
 'Ща, я сру. Не мешай принимать решения.',
 'Ты это сам придумал или нейросеть тоже сдалась?',
 'Дедлайн? Я уже мысленно уволился, блядь.',
 'Ммм, нихуя. Продолжай, я делаю вид, что понял.',
 'Алло, алло. Да, это отдел «пошёл ты нахуй».',
 'Скинь это ещё раз. Хочу охуеть дважды.',
 'Я всё понял. Ни хуя не понял, но всё понял.',
];
export const managerMedia = chatAttachments;

// Decorate the newly computed response once; snapshots and saved messages keep the draw.
export function addManagerReply(session,input,{pick=randomInt}={}) {
 if(input?.type!=='text'||!['supply','project'].includes(session.config.id))return false;
 const reply=session.messages.at(-1);
 if(reply?.role!=='opponent'||reply.source==='scripted-manager')return false;
 const previous=session.messages.slice(0,-1).filter(m=>m.source==='scripted-manager');
 const count=previous.length%managerLines.length;
 const used=new Set(count?previous.slice(-count).map(m=>m.banterId):[]);
 let available=managerLines.map((_,i)=>i).filter(i=>!used.has(i));
 if(available.length>1)available=available.filter(i=>i!==previous.at(-1)?.banterId);
 const index=available[pick(available.length)];
 reply.ruleText=reply.ruleText||reply.text;
 reply.text=managerLines[index];
 reply.source='scripted-manager';
 reply.banterId=index;
 // Ensure a quick demo has media; later messages have a 45% chance.
 if(!previous.length||pick(100)<45){
   const lastMedia=previous.findLast(m=>m.attachment)?.attachment.src;
   const pool=managerMedia.filter(m=>m.src!==lastMedia);
   reply.attachment=structuredClone(pool[pick(pool.length)]);
 }
 return true;
}
