/* Jungle Fishing · Water Tracker
   Loaded on jungle-fishing.com/water-tracker by a small embed:
     <div id="jf-water-tracker"></div>
     <script src="https://cdn.jsdelivr.net/gh/JungleFishing/jungle-fishing-data@main/tracker.js" defer></script>
   Reads data.json from this repo (updated every morning by the GitHub job).
   The readings inside are a fallback snapshot used only if data.json can't load. */
(function(){
  var root=document.getElementById('jf-water-tracker');
  if(!root||root.dataset.ready)return; root.dataset.ready='1';
  if(!document.querySelector('link[data-jf-font]')){var l=document.createElement('link');l.rel='stylesheet';l.href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap";l.setAttribute('data-jf-font','1');document.head.appendChild(l);}
  var st=document.createElement('style');st.textContent="\n  .jf-wt{--bg:#2f3a20;--panel:#252e1a;--line:#5b6448;--gold:#e0b54a;--cream:#f3ecd8;--ref:#9fb0c8;--muted:#9aa28a;\n    font-family:'Courier Prime','Courier New',monospace;color:var(--cream);background:var(--panel);\n    border:3px solid var(--line);padding:28px 32px 24px;max-width:1180px;margin:40px 0 24px;box-sizing:border-box}\n  .jf-wt *{box-sizing:border-box}\n  .jf-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}\n  .jf-tabs{display:flex;gap:18px;flex-wrap:wrap}\n  .jf-tab{background:none;border:0;padding:0 0 4px;font:700 15px/1 inherit;font-family:inherit;letter-spacing:.06em;\n    color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;text-transform:uppercase}\n  .jf-tab.on{color:var(--cream);border-color:var(--gold)}\n  .jf-live{font-weight:700;font-size:13px;letter-spacing:.12em;color:var(--muted);display:flex;align-items:center;gap:8px}\n  .jf-dot{width:8px;height:8px;border-radius:50%;background:var(--gold)}\n  @keyframes jfp{0%,100%{opacity:1}50%{opacity:.25}}\n  .jf-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:22px 0 6px}\n  .jf-stat .k{font-size:12px;letter-spacing:.14em;color:var(--muted);font-weight:700}\n  .jf-stat .v{font-size:30px;font-weight:700;margin-top:4px;line-height:1.1}\n  .jf-stat .v small{font-size:15px;color:var(--muted)}\n  .jf-stat.status .v{font-size:18px;color:var(--gold);text-transform:uppercase;letter-spacing:.04em}\n  .jf-chart svg{width:100%;height:auto;display:block}\n  .jf-legend{display:flex;gap:26px;flex-wrap:wrap;font-weight:700;font-size:13px;letter-spacing:.06em;margin-top:6px}\n  .jf-legend .a{color:var(--gold)} .jf-legend .b{color:var(--muted)}\n  .jf-map{margin-top:26px;border-top:1px solid #3a4430;padding-top:20px}\n  .jf-map-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}\n  .jf-map-head .k{font-size:12px;letter-spacing:.14em;color:var(--muted);font-weight:700}\n  .jf-map-head .t{font-size:16px;font-weight:700;color:var(--cream);letter-spacing:.04em;text-transform:uppercase}\n  .jf-map-blurb{font-size:14px;line-height:1.55;color:var(--cream);margin:6px 0 10px;max-width:70ch}\n  .jf-map svg{width:100%;height:auto;display:block}\n  .jf-map .pin{cursor:pointer}\n  .jf-map .pin:focus{outline:none}\n  .jf-map .pin:focus-visible .ring{stroke:var(--cream);stroke-width:2}\n  .jf-area{transition:opacity .35s ease}\n  @media (prefers-reduced-motion:reduce){.jf-area{transition:none}.jf-dot{animation:none}}\n  .jf-note{font-size:11px;color:var(--muted);margin-top:14px;letter-spacing:.04em}\n  @media(max-width:640px){.jf-wt{padding:20px 16px}.jf-tabs{flex-wrap:nowrap;overflow-x:auto;width:100%;gap:16px;padding-bottom:4px;scrollbar-width:none}.jf-tab{white-space:nowrap;font-size:13px}.jf-legend{gap:16px;font-size:12px}.jf-stats{grid-template-columns:1fr 1fr}.jf-stat.status{grid-column:1/-1}.jf-stat .v{font-size:24px}}\n";document.head.appendChild(st);
  root.innerHTML="<div class=\"jf-wt\" id=\"jfWaterTracker\">\n  <div class=\"jf-top\">\n    <div class=\"jf-tabs\" id=\"jfTabs\"></div>\n    <div class=\"jf-live\"><span class=\"jf-dot\"></span><span id=\"jfUpdated\">LIVE</span></div>\n  </div>\n  <div class=\"jf-stats\">\n    <div class=\"jf-stat\"><div class=\"k\">RIVER LEVEL</div><div class=\"v\" id=\"jfLevel\">\u2013</div></div>\n    <div class=\"jf-stat\"><div class=\"k\">LAST 24 HRS</div><div class=\"v\" id=\"jfTrend\">\u2013</div></div>\n    <div class=\"jf-stat status\"><div class=\"k\">RIVER STATUS</div><div class=\"v\" id=\"jfStatus\">\u2013</div></div>\n  </div>\n  <div class=\"jf-chart\" id=\"jfChart\"></div>\n  <div class=\"jf-legend\"><span class=\"a\" id=\"jfLgA\">\u25ae 2026</span><span class=\"b\" id=\"jfLgB\">\u2504 2025</span></div>\n  <div class=\"jf-map\">\n    <div class=\"jf-map-head\"><div class=\"k\">COVERAGE AREA</div><div class=\"t\" id=\"jfMapTitle\">\u2013</div></div>\n    <p class=\"jf-map-blurb\" id=\"jfMapBlurb\"></p>\n    <div id=\"jfMap\"></div>\n  </div>\n  <div class=\"jf-note\" id=\"jfNote\">Source: Ag\u00eancia Nacional de \u00c1guas (ANA) gauge telemetry, daily average, updated every morning. Upper Rio Negro reads the Curicuriari gauge just below S\u00e3o Gabriel. Map and coverage areas are approximate.</div>\n</div>";
})();
(function(){
  // ---- FALLBACK SNAPSHOT of ANA daily readings (every 5th day), used if data.json can't load ----
  // r = [month, day, level in m] this year, prev = last year; d24 = 24h change in m; asof = date of latest reading
  const DATA_URL='https://raw.githubusercontent.com/JungleFishing/jungle-fishing-data/main/data.json';
  let AS_OF='', YEAR=2026;
  const STATIONS = [
    {id:'manaus', code:14990000, gauge:[-3.13,-60.02], region:'Lower Rio Negro', blurb:'Read from the Manaus gauge. Covers the lower Rio Negro, the Anavilhanas islands and the side channels up toward Novo Airão.', area:[[-2.15,-61.3],[-1.95,-60.85],[-2.55,-60.5],[-2.95,-59.8],[-3.32,-59.85],[-3.2,-60.4],[-2.85,-61.05],[-2.5,-61.4]], name:'Rio Negro · Manaus',
      r:[[1,1,21.96],[1,6,21.98],[1,11,22.0],[1,16,21.98],[1,21,22.05],[1,26,22.38],[1,31,22.78],[2,5,23.22],[2,10,23.68],[2,15,23.99],[2,20,24.27],[2,25,24.42],[3,2,24.52],[3,7,24.59],[3,12,24.71],[3,17,24.83],[3,22,25.04],[3,27,25.25],[4,1,25.48],[4,6,25.66],[4,11,25.88],[4,16,26.19],[4,21,26.38],[4,26,26.61],[5,1,26.8],[5,6,27.04],[5,11,27.18],[5,16,27.38],[5,21,27.52],[5,26,27.7],[5,31,27.89],[6,5,28.06],[6,10,28.28],[6,15,28.41],[6,20,28.48],[6,25,28.49],[6,30,28.5],[7,5,28.43],[7,10,28.31],[7,15,28.17],[7,20,27.98],[7,25,27.75],[7,30,27.46],[8,4,27.12],[8,9,26.71],[8,14,26.26],[8,19,25.72],[8,24,25.13],[8,29,24.44],[9,3,23.72],[9,8,22.93],[9,13,22.08],[9,18,21.16],[9,23,20.13],[9,28,19.12],[10,3,18.41],[10,8,17.93],[10,13,17.56],[10,18,17.21],[10,23,16.8],[10,28,16.49],[11,2,16.44],[11,7,16.41],[11,11,16.35]], d24:-0.01, asof:'2026-11-11',
      prev:[[1,1,18.43],[1,6,19.42],[1,11,20.3],[1,16,20.91],[1,21,21.48],[1,26,21.95],[1,31,22.19],[2,5,22.21],[2,10,22.27],[2,15,22.56],[2,20,22.96],[2,25,23.52],[3,2,24.04],[3,7,24.51],[3,12,24.92],[3,17,25.2],[3,22,25.53],[3,27,25.8],[4,1,26.01],[4,6,26.21],[4,11,26.47],[4,16,26.79],[4,21,27.13],[4,26,27.4],[5,1,27.7],[5,6,27.89],[5,11,28.02],[5,16,28.17],[5,21,28.34],[5,26,28.46],[5,31,28.54],[6,5,28.63],[6,10,28.74],[6,15,28.84],[6,20,28.89],[6,25,28.94],[6,30,28.98],[7,5,29.02],[7,10,28.97],[7,15,28.89],[7,20,28.78],[7,25,28.66],[7,30,28.51],[8,4,28.35],[8,9,28.14],[8,14,27.91],[8,19,27.6],[8,24,27.25],[8,29,26.86],[9,3,26.41],[9,8,25.88],[9,13,25.27],[9,18,24.58],[9,23,23.81],[9,28,23.01],[10,3,22.2],[10,8,21.39],[10,13,20.71],[10,18,20.07],[10,23,19.54],[10,28,19.19],[11,2,18.93],[11,7,18.85],[11,12,18.87],[11,17,19.03],[11,22,19.17],[11,27,19.4],[12,2,19.84],[12,7,20.4],[12,12,20.91],[12,17,21.3],[12,22,21.68],[12,27,21.86],[12,31,21.94]],
      note:'', sub:''},
    {id:'barcelos', code:14480002, gauge:[-0.97,-62.93], region:'Middle Rio Negro', blurb:'Read from the Barcelos gauge. Covers the middle Rio Negro and the blackwater tributaries that feed it above and below town.', area:[[-0.25,-63.7],[0.15,-62.95],[-0.25,-62.2],[-0.95,-61.95],[-1.6,-62.25],[-1.55,-63.1],[-1.1,-63.75],[-0.6,-63.95]], name:'Rio Negro · Barcelos',
      r:[[1,1,3.25],[1,6,3.09],[1,11,2.98],[1,16,3.02],[1,21,3.49],[1,26,3.95],[1,31,4.39],[2,5,4.65],[2,10,4.7],[2,15,4.57],[2,20,4.17],[2,25,3.83],[3,2,3.68],[3,7,3.56],[3,12,3.35],[3,17,3.05],[3,22,3.24],[3,27,3.41],[4,1,3.5],[4,6,3.75],[4,11,4.29],[4,16,4.75],[4,21,5.03],[4,26,5.34],[5,1,5.57],[5,6,5.85],[5,11,5.95],[5,16,6.31],[5,21,6.74],[5,26,7.35],[5,31,7.94],[6,5,8.47],[6,10,8.92],[6,15,9.23],[6,20,9.39],[6,25,9.39],[6,30,9.4],[7,5,9.34],[7,10,9.26],[7,15,9.16],[8,1,8.18],[8,6,7.67],[8,11,7.09],[8,16,6.5],[8,21,5.83],[8,26,5.29],[8,31,4.94],[9,5,4.8],[9,10,4.67],[9,15,4.36],[9,20,4.03],[9,25,3.89],[9,30,3.88],[10,5,3.94],[10,10,4.03],[10,15,4.05],[10,20,4.02],[10,25,4.03],[10,30,3.93],[11,4,3.64]], d24:-0.06, asof:'2026-11-04',
      prev:[[1,1,3.32],[1,6,3.93],[1,11,4.32],[1,16,4.58],[1,21,4.53],[1,26,4.19],[1,31,3.51],[2,5,3.26],[2,10,3.54],[2,15,4.09],[2,20,4.51],[2,25,4.92],[3,2,5.12],[3,7,5.25],[3,12,5.19],[3,17,4.94],[3,22,4.88],[3,27,4.98],[4,1,5.03],[4,6,5.09],[4,11,5.37],[4,16,5.86],[4,21,6.49],[4,26,6.96],[5,1,7.28],[5,6,7.41],[5,11,7.51],[5,16,7.66],[5,21,7.83],[5,26,8.03],[5,31,8.25],[6,5,8.47],[6,10,8.73],[6,15,9.05],[6,20,9.35],[6,25,9.57],[6,30,9.7],[7,5,9.71],[7,10,9.72],[7,15,9.68],[7,20,9.65],[7,25,9.62],[7,30,9.6],[8,4,9.52],[8,9,9.38],[8,14,9.04],[8,19,8.64],[8,24,8.23],[8,29,7.83],[9,3,7.33],[9,8,6.78],[9,13,6.38],[9,18,6.07],[9,23,5.77],[9,28,5.45],[10,3,4.99],[10,8,4.47],[10,13,4.11],[10,18,3.99],[10,23,3.99],[10,28,3.91],[11,2,3.96],[11,7,3.91],[11,12,3.77],[11,17,3.58],[11,22,3.55],[11,27,3.73],[12,2,3.9],[12,7,4.04],[12,12,4.02],[12,17,3.85],[12,22,3.52],[12,27,3.31],[12,31,3.27]],
      note:'', sub:''},
    {id:'saogabriel', code:14330000, gauge:[-0.20,-66.80], region:'Upper Rio Negro', blurb:'Read from the Curicuriari gauge on the Rio Negro, just below São Gabriel da Cachoeira. Covers the upper Rio Negro around the São Gabriel rapids and the Curicuriari to the south.', area:[[0.45,-67.45],[0.55,-66.7],[0.05,-66.25],[-0.5,-66.35],[-1.05,-66.85],[-0.95,-67.5],[-0.3,-67.65]], name:'Rio Negro · Curicuriari',
      r:[[1,1,7.62],[1,6,7.64],[1,11,7.84],[1,17,9.11],[1,22,9.6],[1,27,9.61],[2,1,9.51],[2,6,9.38],[2,11,8.86],[2,16,8.24],[2,21,8.42],[2,26,8.51],[3,3,7.93],[3,8,6.94],[3,13,6.97],[3,18,7.54],[3,23,7.7],[3,28,7.21],[4,2,8.4],[4,8,9.4],[4,13,9.88],[4,18,9.96],[4,23,10.26],[4,28,10.21],[5,3,9.45],[5,8,10.66],[5,13,11.19],[5,18,12.02],[5,23,12.71],[5,28,12.71],[6,2,12.82],[6,7,13.21],[6,12,13.85],[6,17,14.0],[6,22,14.16],[6,27,14.23],[7,2,14.34],[7,7,14.24],[7,12,14.13],[7,17,13.97],[7,22,13.72],[7,27,13.3],[8,1,12.63],[8,6,11.8],[8,11,11.1],[8,16,10.6],[8,21,10.24],[8,26,10.74],[8,31,10.86],[9,5,10.47],[9,10,9.75],[9,15,9.34],[9,20,9.57],[9,25,9.79],[9,30,9.89],[10,5,10.1],[10,10,9.91],[10,15,9.86],[10,20,9.87],[10,25,9.31],[10,30,8.62],[11,4,7.76],[11,9,7.78],[11,11,7.76]], d24:-0.01, asof:'2026-11-11',
      prev:[[1,1,10.2],[1,6,10.87],[1,11,10.94],[1,16,10.29],[1,21,8.48],[1,26,7.38],[1,31,8.1],[2,5,9.0],[2,10,9.79],[2,15,10.27],[2,20,10.48],[2,25,10.35],[3,2,10.38],[3,7,9.45],[3,12,8.59],[3,17,9.0],[3,22,9.24],[3,27,9.31],[4,1,10.09],[4,6,10.83],[4,11,11.99],[4,16,12.75],[4,21,12.67],[4,26,12.18],[5,1,11.9],[5,6,11.93],[5,11,12.28],[5,16,12.29],[5,21,12.67],[5,26,12.98],[5,31,13.32],[6,5,13.59],[6,10,13.98],[6,15,14.45],[6,20,14.57],[6,25,14.51],[6,30,14.23],[7,5,13.88],[7,10,13.72],[7,15,13.67],[7,20,14.01],[7,25,14.18],[7,30,14.21],[8,4,13.77],[8,9,13.31],[8,14,12.73],[8,19,12.33],[8,24,11.85],[8,29,11.41],[9,3,11.39],[9,8,11.67],[9,13,11.77],[9,18,11.54],[9,23,10.92],[9,28,9.82],[10,3,9.36],[10,8,8.97],[10,13,9.32],[10,18,9.21],[10,23,9.05],[10,28,9.29],[11,2,9.11],[11,7,8.78],[11,12,8.39],[11,17,8.68],[11,22,9.15],[11,27,9.35],[12,2,9.62],[12,7,9.07],[12,12,8.86],[12,17,8.24],[12,22,8.13],[12,27,8.08],[12,31,7.63]],
      note:'', sub:''}
  ];
  const dd=t=>Date.UTC(+t.slice(0,4),+t.slice(5,7)-1,+t.slice(8,10))/864e5;
  const fmt=t=>t?new Date(dd(t)*864e5).toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).toUpperCase():'';
  function setTrend(s){ // weekly trend from the station's own readings
    const iso=q=>`${YEAR}-${String(q[0]).padStart(2,'0')}-${String(q[1]).padStart(2,'0')}`;
    const last=s.r[s.r.length-1], lt=dd(iso(last));
    const wk=s.r.filter(q=>{const g=lt-dd(iso(q));return g>=5&&g<=9;}).sort((p,q)=>Math.abs(lt-dd(iso(p))-7)-Math.abs(lt-dd(iso(q))-7))[0];
    if(!wk){s.note=s.note||'Latest reading';return;}
    const ch=last[2]-wk[2],cm=Math.abs(ch*100).toFixed(0);
    s.note=ch<=-0.15?'Dropping':ch>=0.15?'Rising':'Holding steady';
    s.sub=s.note==='Holding steady'?(cm==='0'?'No change from last week':`Within ${cm} cm of last week`):`${ch<0?'Down':'Up'} ${cm} cm over the last week`;
  }
  const MONTHS=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  let W=1100,H=380,P={l:46,r:20,t:20,b:40},FS=12;
  const $=id=>document.getElementById(id);

  function smooth(pts){ // Catmull-Rom -> cubic bezier
    let d='M'+pts[0].join(',');
    for(let i=0;i<pts.length-1;i++){
      const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;
      const c1=[p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6],c2=[p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6];
      d+=` C${c1} ${c2} ${p2}`;
    } return d;
  }
  function mono(p){ // monotone cubic (Fritsch-Carlson): smooth, never overshoots real readings
    const n=p.length; if(n<3) return 'M'+p.map(q=>q.join(',')).join(' L');
    const dx=[],m=[],t=[];
    for(let i=0;i<n-1;i++){dx[i]=p[i+1][0]-p[i][0];m[i]=(p[i+1][1]-p[i][1])/dx[i];}
    t[0]=m[0];t[n-1]=m[n-2];
    for(let i=1;i<n-1;i++){if(m[i-1]*m[i]<=0)t[i]=0;else{const w1=2*dx[i]+dx[i-1],w2=dx[i]+2*dx[i-1];t[i]=(w1+w2)/(w1/m[i-1]+w2/m[i]);}}
    let d='M'+p[0].join(',');
    for(let i=0;i<n-1;i++){const h=dx[i]/3;d+=` C${p[i][0]+h},${p[i][1]+t[i]*h} ${p[i+1][0]-h},${p[i+1][1]-t[i+1]*h} ${p[i+1][0]},${p[i+1][1]}`;}
    return d;
  }
  const DIM=[31,28,31,30,31,30,31,31,30,31,30,31];
  const mf=([mo,d])=>mo-1+(d-1)/DIM[mo-1]-0.5; // fractional month index for x()
  const MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function render(s){
    const nar=$('jfWaterTracker').clientWidth<640;
    W=nar?600:1100;H=nar?420:380;FS=nar?20:12;P={l:nar?62:46,r:20,t:24,b:nar?52:40};
    window._jfCur=s; setTrend(s);
    const vals=s.r.concat(s.prev).map(q=>q[2]);
    const span=Math.max(...vals)-Math.min(...vals),step=span>12?4:span>6?2:1;
    const lo=Math.floor((Math.min(...vals)-step/2)/step)*step,hi=Math.ceil((Math.max(...vals)+step/2)/step)*step;
    const x=m=>P.l+(m+0.5)/12*(W-P.l-P.r), y=v=>P.t+(hi-v)/(hi-lo)*(H-P.t-P.b);
    const pts=s.r.map(q=>[x(mf(q)),y(q[2])]), ppts=s.prev.map(q=>[x(mf(q)),y(q[2])]);
    let g='';
    for(let v=lo;v<=hi;v+=step){g+=`<line x1="${P.l}" x2="${W-P.r}" y1="${y(v)}" y2="${y(v)}" stroke="#3a4430" stroke-width="1"/><text x="${P.l-8}" y="${y(v)+4}" text-anchor="end" fill="#9aa28a" font-size="${FS}">${v}m</text>`;}
    MONTHS.forEach((m,i)=>g+=`<text x="${x(i)}" y="${H-14}" text-anchor="middle" fill="#9aa28a" font-size="${FS}" font-weight="700">${nar?m[0]:m}</text>`);
    const line=mono(pts), pline=mono(ppts);
    const [tx,ty]=pts[pts.length-1];
    $('jfChart').innerHTML=`<svg viewBox="0 0 ${W} ${H}" font-family="Courier Prime,monospace" role="img" aria-label="${s.name} river level readings for ${YEAR}">
      ${g}
      <path d="${pline}" fill="none" stroke="#9fb0c8" stroke-width="${nar?3.5:3}" stroke-dasharray="4 7" stroke-linecap="round"/>
      <path d="${line}" fill="none" stroke="#e0b54a" stroke-width="${nar?5:4}" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="${tx}" x2="${tx}" y1="${P.t}" y2="${H-P.b}" stroke="#f3ecd8" stroke-width="1" opacity=".35"/>
      <circle cx="${tx}" cy="${ty}" r="11" fill="#e0b54a" opacity=".25"/>
      <circle cx="${tx}" cy="${ty}" r="6" fill="#e0b54a"/>
      <text x="${tx+(nar?-14:14)}" y="${ty-16}" text-anchor="${nar?'end':'start'}" fill="#f3ecd8" font-size="${nar?22:14}" font-weight="700">${fmt(s.asof)}</text>
    </svg>`;

    const last=s.r[s.r.length-1], now=last[2], falling=s.d24<0;
    const peak=s.r.reduce((m,q)=>q[2]>m[2]?q:m);
    $('jfLevel').innerHTML=`${now.toFixed(2)}<small> m</small>`;
    $('jfTrend').innerHTML=typeof s.d24!=='number'?'–':`${Math.round(s.d24*100)===0?'■':falling?'▼':'▲'} ${Math.abs(s.d24*100).toFixed(0)}<small> cm</small>`;
    const atPeak=peak===last;
    let st=s.note;
    const stale=Math.round((Date.now()/864e5)-dd(s.asof)); let sub=s.sub; if(stale>2)sub=(sub?sub+'. ':'')+`Gauge last reported ${fmt(s.asof).replace(/^(\w)(\w+)/,(m,a,b)=>a+b.toLowerCase())}`;
    st+=` <small style="display:block;color:#9aa28a;font-size:13px;line-height:1.45;margin-top:6px;text-transform:none;letter-spacing:0">${sub?sub+'. ':''}${atPeak?`Highest of the ${YEAR} readings shown.`:`${(peak[2]-now).toFixed(1)} m below the ${YEAR} high shown (${peak[2].toFixed(1)} m, ${MN[peak[0]-1]}).`}</small>`;
    $('jfStatus').innerHTML=st;
    document.querySelectorAll('.jf-tab').forEach(b=>b.classList.toggle('on',b.dataset.id===s.id));
    if(typeof renderMap==='function')renderMap(s);
  }


  // ---- MAP: drawn from real lat/lon (approximate river courses) ----
  const RIVERS=[
    {n:'negro',w:5,pts:[[2.0,-67.1],[1.21,-66.85],[0.6,-66.9],[0.15,-67.0],[-0.13,-67.09],[-0.25,-66.6],[-0.35,-66.0],[-0.41,-65.02],[-0.62,-64.3],[-0.85,-63.6],[-0.97,-62.93],[-1.2,-62.2],[-1.45,-61.63],[-1.95,-61.3],[-2.62,-60.94],[-2.98,-60.4],[-3.13,-60.02],[-3.14,-59.9]]},
    {n:'amazonas',w:7,pts:[[-3.14,-59.9],[-3.2,-59.3],[-3.15,-58.44]]},
    {n:'solimoes',w:7,pts:[[-3.37,-64.72],[-3.9,-63.6],[-4.08,-63.14],[-3.7,-61.6],[-3.31,-60.62],[-3.14,-59.9]]},
    {n:'branco',w:3,pts:[[2.82,-60.67],[1.82,-61.13],[0.6,-61.6],[-0.4,-61.75],[-1.4,-61.85]]},
    {n:'uaupes',w:2.5,pts:[[0.6,-69.4],[0.35,-68.6],[0.25,-67.9],[0.05,-67.3],[-0.05,-67.15]]},
    {n:'curicuriari',w:2,pts:[[-0.95,-67.7],[-0.7,-67.35],[-0.4,-67.0],[-0.22,-66.8]]}
  ];
  const TOWNS=[['São Gabriel',-0.08,-67.12,'w'],['Santa Isabel',-0.41,-65.02,'s'],['Novo Airão',-2.62,-60.94,'w'],['Moura',-1.45,-61.63,'w']];
  const LBL=[['RIO NEGRO',-0.02,-65.9,-8],['SOLIMÕES',-3.95,-62.9,10],['AMAZONAS',-3.38,-58.95,0],['RIO BRANCO',0.9,-61.2,-72],['UAUPÉS',0.62,-68.6,-14],['CURICURIARI',-0.95,-67.55,-40]];
  const LON0=-69.4,LON1=-58.3,LAT0=2.5,LAT1=-4.4;
  function closed(pts){ // closed Catmull-Rom
    const n=pts.length;let d='M'+pts[0].join(',');
    for(let i=0;i<n;i++){const p0=pts[(i-1+n)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n];
      d+=` C${[p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6]} ${[p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6]} ${p2}`;}
    return d+'Z';
  }
  function renderMap(cur){
    const nar=$('jfWaterTracker').clientWidth<640;
    const MW=1100,MH=Math.round(MW*(LAT0-LAT1)/(LON1-LON0)),fs=nar?38:15,small=nar?30:12;
    const X=lon=>(lon-LON0)/(LON1-LON0)*MW, Y=lat=>(LAT0-lat)/(LAT0-LAT1)*MH, P=([la,lo])=>[X(lo),Y(la)];
    let g='';
    // graticule
    for(let lo=-68;lo<=-59;lo+=2)g+=`<line x1="${X(lo)}" x2="${X(lo)}" y1="0" y2="${MH}" stroke="#323c26" stroke-width="1"/>`;
    for(let la=2;la>=-4;la-=2)if(la!==0)g+=`<line x1="0" x2="${MW}" y1="${Y(la)}" y2="${Y(la)}" stroke="#323c26" stroke-width="1"/>`;
    g+=`<line x1="0" x2="${MW}" y1="${Y(0)}" y2="${Y(0)}" stroke="#5b6448" stroke-width="1.5" stroke-dasharray="6 6"/>
        <text x="${MW-10}" y="${Y(0)-8}" text-anchor="end" fill="#9aa28a" font-size="${small}" font-weight="700" letter-spacing="2">EQUATOR 0°</text>`;
    // coverage areas (behind rivers)
    STATIONS.forEach(s=>{const on=s.id===cur.id;
      g+=`<path class="jf-area" d="${closed(s.area.map(P))}" fill="#e0b54a" fill-opacity=".16" stroke="#e0b54a" stroke-width="2" stroke-dasharray="7 6" opacity="${on?1:0}"/>`;});
    // rivers
    RIVERS.forEach(r=>{g+=`<path d="${smooth(r.pts.map(P))}" fill="none" stroke="#9fb0c8" stroke-opacity="${r.n==='negro'?.95:.6}" stroke-width="${r.w*(nar?2:1)}" stroke-linecap="round" stroke-linejoin="round"/>`;});
    LBL.forEach(([t,la,lo,rot])=>{if(nar&&t!=='RIO BRANCO'&&t!=='SOLIMÕES')return;
      g+=`<text transform="translate(${X(lo)},${Y(la)}) rotate(${rot})" text-anchor="middle" fill="#9fb0c8" fill-opacity=".85" font-size="${small}" font-weight="700" letter-spacing="3">${t}</text>`;});
    if(!nar)TOWNS.forEach(([t,la,lo,a])=>{const x=X(lo),y=Y(la),w=a==='w';g+=`<circle cx="${x}" cy="${y}" r="3.5" fill="#9aa28a"/><text x="${w?x-10:x}" y="${w?y+5:a==='n'?y-12:y+24}" text-anchor="${w?'end':'middle'}" fill="#9aa28a" font-size="${small}">${t}</text>`;});
    // gauges
    STATIONS.forEach(s=>{const on=s.id===cur.id,[x,y]=P(s.gauge),short=s.name.split('· ')[1];
      g+=`<g class="pin" data-id="${s.id}" tabindex="0" role="button" aria-label="Show ${short}" aria-pressed="${on}">
        <circle cx="${x}" cy="${y}" r="${nar?44:22}" fill="transparent"/>
        ${on?`<circle cx="${x}" cy="${y}" r="${nar?28:15}" fill="#e0b54a" opacity=".25"/>`:''}
        <circle class="ring" cx="${x}" cy="${y}" r="${nar?16:8}" fill="${on?'#e0b54a':'#252e1a'}" stroke="${on?'#e0b54a':'#f3ecd8'}" stroke-width="${nar?4:2.5}"/>
        <text x="${x}" y="${y-(nar?34:20)}" text-anchor="middle" fill="${on?'#f3ecd8':'#9aa28a'}" font-size="${fs}" font-weight="700" letter-spacing="1">${short.toUpperCase()}</text>
      </g>`;});
    // scale bar
    const km=(nar?200:100),px=km/111*(MW/(LON1-LON0)),sx=MW-px-24,sy=MH-26;
    g+=`<line x1="${sx}" x2="${sx+px}" y1="${sy}" y2="${sy}" stroke="#f3ecd8" stroke-width="3"/><line x1="${sx}" x2="${sx}" y1="${sy-6}" y2="${sy+6}" stroke="#f3ecd8" stroke-width="2"/><line x1="${sx+px}" x2="${sx+px}" y1="${sy-6}" y2="${sy+6}" stroke="#f3ecd8" stroke-width="2"/>
        <text x="${sx+px/2}" y="${sy-12}" text-anchor="middle" fill="#f3ecd8" font-size="${small}" font-weight="700" letter-spacing="2">${km} KM</text>`;
    $('jfMap').innerHTML=`<svg viewBox="0 0 ${MW} ${MH}" font-family="Courier Prime,monospace" role="img" aria-label="Map of the Rio Negro showing the ${cur.region} coverage area">${g}</svg>`;
    $('jfMapTitle').textContent=cur.region;
    $('jfMapBlurb').textContent=cur.blurb;
  }
  function pick(id){render(STATIONS.find(s=>s.id===id));}
  $('jfMap').addEventListener('click',e=>{const p=e.target.closest('.pin');if(p)pick(p.dataset.id);});
  $('jfMap').addEventListener('keydown',e=>{const p=e.target.closest('.pin');if(p&&(e.key==='Enter'||e.key===' ')){e.preventDefault();pick(p.dataset.id);setTimeout(()=>{const q=$('jfMap').querySelector(`.pin[data-id="${p.dataset.id}"]`);q&&q.focus();},0);}});

  $('jfTabs').innerHTML=STATIONS.map(s=>`<button class="jf-tab" data-id="${s.id}">${s.name}</button>`).join('');
  $('jfTabs').addEventListener('click',e=>{const b=e.target.closest('.jf-tab');if(b)render(STATIONS.find(s=>s.id===b.dataset.id));});
  $('jfUpdated').textContent='GAUGE DATA · AS OF '+fmt(STATIONS.map(s=>s.asof).sort().pop());
  render(STATIONS[0]);

  // ---- DAILY DATA: a GitHub job pulls ANA gauge telemetry every morning into data.json ----
  function applyData(d){
    if(!d||!d.stations)return;
    let latest='';
    STATIONS.forEach(s=>{const st=d.stations[s.id];if(st&&st.daily&&st.daily.length){const t=st.daily[st.daily.length-1][0];if(t>latest)latest=t;}});
    if(!latest)return;
    const Y=+latest.slice(0,4), md=q=>[+q[0].slice(5,7),+q[0].slice(8,10),q[1]];
    STATIONS.forEach(s=>{
      const st=d.stations[s.id];if(!st||!st.daily||!st.daily.length)return;
      const cur=st.daily.filter(q=>+q[0].slice(0,4)===Y).map(md), prv=st.daily.filter(q=>+q[0].slice(0,4)===Y-1).map(md);
      if(!cur.length)return;
      s.r=cur; s.prev=prv; s.asof=st.daily[st.daily.length-1][0];
      s.d24=typeof st.d24==='number'?st.d24:null; s.note='';s.sub='';
    });
    YEAR=Y; $('jfLgA').textContent='▮ '+Y; $('jfLgB').textContent='┄ '+(Y-1);
    $('jfUpdated').textContent='GAUGE DATA · AS OF '+fmt(latest);
    render(window._jfCur);
  }
  fetch(DATA_URL+'?h='+Math.floor(Date.now()/36e5)).then(r=>r.ok?r.json():null).then(applyData).catch(()=>{});
  let rt;window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>render(window._jfCur),150);});
})();
