import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createApp} from '../server.mjs';

// Each launch gets a separate local profile; the user's data/ is never reset.
const port=Number(process.env.ARENA_DEMO_PORT||5182);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('ARENA_DEMO_PORT: целое число от 1024 до 65535.');
const dataDir=await mkdtemp(path.join(tmpdir(),'arena-defense-'));
const app=await createApp({dataDir});
app.listen(port,'127.0.0.1',()=>{
 console.log(`Репетиция: http://127.0.0.1:${port}/#arena`);
 console.log(`Отдельный профиль: ${dataDir}`);
 console.log('Исходные настройки, пустая история. Основной профиль не изменён. Остановка: Ctrl+C.');
});
app.on('error',error=>{
 console.error(error.code==='EADDRINUSE'?'Порт репетиции занят. Закройте прежнюю репетицию или задайте ARENA_DEMO_PORT.':'Не удалось запустить репетицию.');
 process.exitCode=1;
});
