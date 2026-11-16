/* PolarClock researcher add-on. Add before </body> in index.html, after the main scripts:
   <script src="researcher.js"></script>   (or paste the code inside a <script> tag) */
(function(){
const $=id=>document.getElementById(id);
const P=document.createElement('div');P.className='panel';
P.innerHTML=`<b>Researcher tools</b>
<div class="note" style="margin:6px 0">Works on the selected cell (site, landing date) and the mission length above.</div>
<div class="ctl"><label>Time step (min)<select id="r_step"><option>1</option><option>5</option><option selected>10</option><option>60</option></select></label>
<label>Terrain file (site,az°,elev° CSV)<input type="file" id="r_tf" accept=".csv,.txt"></label></div>
<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
<button id="r_ts">Time series CSV</button><button id="r_ev">Rise / set events</button><button id="r_sn">Horizon sensitivity</button>
<button id="r_sv">Save setup</button><button id="r_ld">Load setup</button></div>
<input type="file" id="r_lf" accept=".json" style="display:none">
<label style="flex-direction:row;align-items:center;gap:8px;margin-top:8px"><input type="checkbox" id="r_cmp" class="x" checked> Compact view (hide plain-language panel and reference image)</label>
<div id="r_out" class="note hm" style="margin-top:8px"></div>`;
$('det').after(P);
const out=$('r_out'),dwn=(n,t,m)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:m}));a.download=n;a.click()};
const ctx=()=>{if(!sel){out.textContent='Tap a cell in the table first.';return null}return{st:SITES[sel[0]],t:t0()+sel[1]*stp()*DAY,n:len()}};
const iso=t=>new Date(t).toISOString();
const meta=c=>`# PolarClock researcher export, generated ${iso(Date.now())}\n# site=${c.st[0]} lat=${c.st[1]} lon_E=${c.st[2]}\n# start_utc=${iso(c.t)} days=${c.n}\n# horizon_mask_deg=${mask()} terrain=${PROF[c.st[0]]?'imported profile':'flat'}\n# relay=${ry.checked}\n# model=Meeus series with libration, sun limb 0.27 deg, earth limb 0.95 deg (not DE441)\n`;
const tbl=(h,r)=>'<table class="alt"><tr>'+h.map(x=>'<th>'+x+'</th>').join('')+'</tr>'+r.map(x=>'<tr>'+x.map(y=>'<td>'+y+'</td>').join('')+'</tr>').join('')+'</table>';
$('r_ts').onclick=()=>{const c=ctx();if(!c)return;const s=+$('r_step').value*6e4,f=x=>x.toFixed(3);
let o=meta(c)+'time_utc,sun_el_deg,sun_az_deg,earth_el_deg,earth_az_deg,horizon_at_sun_az_deg,sun_up,earth_direct,earth_or_relay\n';
for(let t=c.t;t<=c.t+c.n*DAY;t+=s){const v=smp(c.st,t);o+=[iso(t),f(v[0]),f(v[1]),f(v[2]),f(v[3]),f(hor(c.st,v[1])),+sunUp(c.st,t),+(v[2]+.95>hor(c.st,v[3])+mask()),+earthUp(c.st,t)].join(',')+'\n'}
dwn('polarclock_timeseries.csv',o,'text/csv');out.textContent='Time series downloaded.'};
$('r_ev').onclick=()=>{const c=ctx();if(!c)return;const rows=[];
[['Sun',sunUp],['Earth',earthUp]].forEach(([nm,f])=>{let p=f(c.st,c.t);for(let t=c.t+6e5;t<=c.t+c.n*DAY;t+=6e5){const q=f(c.st,t);if(q!==p){let a=t-6e5,b=t;while(b-a>1000){const m=Math.floor((a+b)/2);f(c.st,m)===p?a=m:b=m}rows.push([b,nm,q?'rise':'set']);p=q}}});
rows.sort((x,y)=>x[0]-y[0]);out.innerHTML=(rows.length?tbl(['UTC (1 s)','Body','Event'],rows.map(r=>[iso(r[0]).slice(0,19).replace('T',' '),r[1],r[2]])):'No rise or set events in this window.')+'<div>Start state: Sun '+(sunUp(c.st,c.t)?'up':'down')+', Earth '+(earthUp(c.st,c.t)?'in view':'hidden')+'. Events found at 10-minute scan, refined to 1 s.</div>'};
$('r_sn').onclick=()=>{const c=ctx();if(!c)return;const keep=mh.value,r=[];
for(const v of [0,1,2,3,4]){mh.value=v;const s=stats(c.st,c.t,c.n);r.push([v+'°',s.sun.toFixed(1)+'%',s.earth.toFixed(1)+'%',s.dark+' h',s.sunWin+' h'])}
mh.value=keep;draw();out.innerHTML=tbl(['Horizon','Sun','Earth','Longest dark','Longest sun'],r)};
const IDS=['d0','len','ms','me','mh','stp0','dl','ry','ya','ye','yi','yo','yw','pw','bw','lw','hw','pt','pd','bc','mz'];
$('r_sv').onclick=()=>{const o={version:1,sel,custom:SITES.slice(8),terrain:$('tx').value,v:{}};IDS.forEach(i=>o.v[i]=$(i).type==='checkbox'?$(i).checked:$(i).value);dwn('polarclock_setup.json',JSON.stringify(o,null,1),'application/json')};
$('r_ld').onclick=()=>$('r_lf').click();
$('r_lf').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{const o=JSON.parse(t);IDS.forEach(i=>{if(i in o.v){const el=$(i);el.type==='checkbox'?el.checked=o.v[i]:el.value=o.v[i]}});
SITES.length=8;(o.custom||[]).forEach(s=>SITES.push(s));if(o.terrain){$('tx').value=o.terrain;$('tb1').click()}sel=o.sel;draw();out.textContent='Setup loaded.'}catch(x){out.textContent='Could not read setup file.'}})};
$('r_tf').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{$('tx').value=t;$('tb1').click();out.textContent='Terrain file applied: '+f.name})};
const cmp=()=>{const on=$('r_cmp').checked;$('simple').closest('.panel').style.display=on?'none':'';const im=document.querySelector('img[alt^="Shackleton"]');if(im)im.closest('.panel').style.display=on?'none':''};
$('r_cmp').onchange=cmp;cmp();
})();
