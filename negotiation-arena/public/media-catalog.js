export const mediaClips = [
 {id:'debate',src:'/media/negotiation-3-v1.mp4',poster:'/media/video-3.jpg',captions:'/media/negotiation-3-ru.vtt',captionNote:'Текст диалога из ролика',duration:18,title:'Спор ради спора',description:'Как не надо: конфликт крутится по кругу. Текст вынесен в читаемые субтитры.',lesson:'Пустого извинения мало для восстановления доверия. Назови конкретное изменение, срок и способ проверить результат.',alternative:'Я понял, что именно повторяется. Давай договоримся, что я изменю и когда мы проверим результат.',scenario:'incident'},
 {id:'call',src:'/media/negotiation-2-v1.mp4',poster:'/media/video-2.jpg',captions:'/media/negotiation-2-ru.vtt',duration:6,title:'Алло, это переговоры?',description:'Приветствие было. Контакт уничтожен следующим предложением.',lesson:'Оскорбление закрывает разговор. Назови причину недовольства и конкретный запрос, сохранив возможность ответа.',alternative:'Я сейчас злюсь. Давай сделаем паузу и вернёмся к конкретному вопросу.',scenario:'operation/supply'},
 {id:'table',src:'/media/negotiation-1-v1.mp4',poster:'/media/video-1.jpg',duration:5,title:'Аргумент не загрузился',description:'Мемная пауза перед разбором. Речь нечёткая — субтитры пока не добавлены.',lesson:'Если собеседник не понял реплику, переформулируй её простыми словами и уточни, одинаково ли вы поняли запрос.',alternative:'Сформулирую иначе: мне нужно согласовать срок. Какой вариант для тебя выполним?',scenario:'operation/project'},
];
export const chatAttachments = [
 {type:'image',src:'/media/chat-locker-v1.jpg',alt:'Селфи в баскетбольной форме',caption:'Привет. Охуевать будешь?'},
 {type:'image',src:'/media/chat-table-thumb-v1.jpg',alt:'Большой палец вверх за столом',caption:'Всё заебись. Это не точно.'},
 {type:'image',src:'/media/chat-big-thumb-v1.jpg',alt:'Большой палец крупным планом',caption:'Во. Столько мне похуй.'},
 {type:'image',src:'/media/chat-snow-v1.jpg',alt:'Селфи в ушанке на снегу',caption:'Вышел потрогать траву. Наебали.'},
 {type:'image',src:'/media/chat-yogurt-v1.jpg',alt:'Йогурт пошёл не по плану',caption:'Бля. Это был питьевой?'},
 {type:'image',src:'/media/chat-mirror-v1.jpg',alt:'Селфи в зеркале',caption:'Вышел посрать. Вернулся экспертом.'},
 {type:'video',src:'/media/chat-duo-v1.mp4',poster:'/media/chat-duo-poster-v1.jpg',alt:'Короткое видео с двумя участниками',caption:'Нас двое, и мы оба нихуя не поняли.'},
];
export const mediaFiles = [
 '/media/rank-sub3-v1.jpg','/media/expert-v1.jpg','/media/reaction-v1.png',
 ...mediaClips.flatMap(v=>[v.src,v.poster,...(v.captions?[v.captions]:[])]),
 ...chatAttachments.flatMap(v=>[v.src,...(v.poster?[v.poster]:[])]),
];
