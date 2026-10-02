// 示範資料：只有網址加上 ?demo 時才會載入。
// 資料存在 localStorage 的 skincare-diary-demo，和正式紀錄 skincare-diary-v1 分開，不會互相影響。
// Three weeks of sample records, dated relative to today.
window.skincareDemo = ({ today, addDays, isScheduled, normalize }) => {
  const start = addDays(today(), -24);
  const list = [
    ['溫和卸妝油', '卸妝', ['pm'], { type: 'daily' }, 'peach'],
    ['胺基酸洗面乳', '洗臉', ['am', 'pm'], { type: 'daily' }, 'blue'],
    ['玻尿酸化妝水', '化妝水', ['am', 'pm'], { type: 'daily' }, 'pink'],
    ['維他命C精華', '精華', ['am'], { type: 'weekly', days: [1, 3, 5] }, 'butter', '3 滴就好'],
    ['A醇精華', '精華', ['pm'], { type: 'weekly', days: [2, 4, 6] }, 'lilac', '豌豆大小，避開眼周'],
    ['緊緻眼霜', '眼霜', ['am', 'pm'], { type: 'daily' }, 'mint'],
    ['修護乳液', '乳液', ['am', 'pm'], { type: 'daily' }, 'pink'],
    ['積雪草修護霜', '面霜', ['pm'], { type: 'weekly', days: [0, 3] }, 'mint'],
    ['清爽防曬乳', '防曬', ['am'], { type: 'daily' }, 'peach', '出門前 15 分鐘'],
    ['保濕面膜', '面膜', ['pm'], { type: 'interval', every: 3 }, 'blue'],
    ['痘痘貼', '其他', ['pm'], { type: 'daily' }, 'butter', '', true],
  ];
  const products = normalize({ products: list.map(([name, step, times, freq, color, note = '', paused = false], i) => (
    { id: 'd' + i, name, step, times, freq: { start, ...freq }, color, note, paused, created: i + 1 }
  )) }).products;
  const plan = (d, slot) => products.filter(p => isScheduled(p, d, slot)).map(p => p.id);
  const skin = { 1: ['水潤', '穩定'], 3: ['穩定'], 5: ['乾燥'], 7: ['冒痘'], 8: ['冒痘', '泛紅'], 12: ['出油'], 14: ['穩定'], 18: ['乾燥'], 20: ['水潤'] };
  const notes = { 1: '今天皮膚摸起來很滑', 5: '冷氣吹太久，多擦一層乳液', 8: '下巴冒了兩顆，先停 A 醇一天', 12: '流汗流很多' };
  const days = {};
  for (let n = 24; n >= 0; n--) {
    if (n === 16) continue;
    const d = addDays(today(), -n), am = plan(d, 'am'), pm = plan(d, 'pm');
    let amDone = [...am], pmDone = [...pm];
    const pmExtra = [];
    if (n === 0 || n === 10) pmDone = pm.slice(0, 2);
    if (n === 7) pmDone = pm.slice(0, -2);
    if (n === 13) amDone = am.filter(id => id !== 'd8');
    if (n === 19) pmDone = pm.slice(0, 3);
    if (n === 8) { pmDone = pmDone.filter(id => id !== 'd4').concat('d10'); pmExtra.push('d10'); }
    days[d] = { am: { plan: am, done: amDone, extra: [] }, pm: { plan: pm, done: pmDone, extra: pmExtra }, skin: skin[n] || [], note: notes[n] || '' };
  }
  return { v: 1, products, days };
};
