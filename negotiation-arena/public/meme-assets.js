// Replace a src with a new, versioned local filename to keep old runs reproducible.
export const memeAssets = Object.fromEntries([
 ['research_evidence','Результат исследования','research.svg'],
 ['virus_expert','Очень целеустремлённый вирус','virus.svg'],
 ['colleague_evidence','Посылка от коллеги','colleague.svg'],
 ['ai_receipt','Результат запроса к ИИ','receipt.svg'],
 ['silent_image','Звук у PNG','speaker.svg'],
 ['generated_result','Результат генерации','result.svg'],
 ['architecture_core','Средний блок архитектуры','core.svg'],
 ['thinking_room','Комната глубокого мышления','toilet.svg'],
 ['deep_analysis','Объект глубокого анализа','analysis.svg'],
 ['final_result','Финальный результат','poop.svg'],
 ['analysis_sample','Прикреплённые данные','sample.svg'],
 ['unexplained_image','Необъяснимая картинка','mystery.svg'],
 ['proof_image','Убедительное доказательство','proof.svg'],
 ['pass_question','Передача вопроса','arrow.svg'],
 ['last_question','Последний вопрос','question.svg'],
].map(([key,alt,file])=>[key,{src:`/memes/${file}`,alt,placeholder:true}]));
