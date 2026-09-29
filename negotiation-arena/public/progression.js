export const ranks = [
 {name:'sub 3',xp:0,line:'Открыл рот. Сделка закрылась.'},
 {name:'normie',xp:100,line:'Уже спрашивает, прежде чем обещать.'},
 {name:'chad',xp:250,line:'Челюсть на месте. Аргументы тоже.'},
 {name:'gigachad',xp:450,line:'Умеет сказать «нет» без трёх голосовых.'},
 {name:'true adam',xp:700,line:'Мьюинг закончен. Договорённость зафиксирована.'},
];
export function attemptXP(s) {
 if(s.status!=='completed'||!s.result||s.turn<2)return 0;
 const score=Math.max(0,Math.min(100,Number(s.result.score)||0));
 return 40+Math.floor(score/10)*5+(s.result.outcome==='agreement'?30:0)+(s.result.game?.ending?.id==='resilient'?20:0);
}
export function progression(data) {
 const attempts=[...new Map([...(data.sessions||[]),...(data.incidents||[])].map(s=>[s.id,s])).values()];
 const completed=attempts.filter(s=>s.status==='completed'),xp=completed.reduce((n,s)=>n+attemptXP(s),0);
 const index=ranks.findLastIndex(r=>xp>=r.xp),rank=ranks[index],next=ranks[index+1]||null;
 return {xp,rank,index,next,remaining:next?next.xp-xp:0,percent:next?Math.floor((xp-rank.xp)/(next.xp-rank.xp)*100):100,
   completed:completed.length,agreements:completed.filter(s=>s.result?.outcome==='agreement').length,
   resilient:completed.filter(s=>s.result?.game?.ending?.id==='resilient').length,
   scenarios:new Set(completed.map(s=>s.type==='incident'?'incident':s.config.id)).size,
   attempts:attempts.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))};
}
