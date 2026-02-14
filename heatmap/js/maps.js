
// ===== FORMATTING HELPERS =====
function fC(n) { return '$' + Math.round(n).toLocaleString(); }
function fN(n) { return Math.round(n).toLocaleString(); }
function fD(s) { var d = new Date(s + 'T00:00:00'); return d.toLocaleDateString('en-AU', {day:'numeric',month:'short'}); }
function gPC(la, ln) { return REVIEW_PC_LOOKUP[la+','+ln] || ''; }
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];


// ===== NAVIGATION =====
function showOnBrandMap(lat, lng, label, targetView) {
  switchView(targetView);
  if (targetView === 'map') {
    setTimeout(() => { window._map.invalidateSize(); showCatchment(lat, lng, label); }, 100);
  } else if (BRAND_MAPS[targetView]) {
    var mk = BRAND_MAPS[targetView].mapKey;
    setTimeout(() => { window[mk].invalidateSize(); showBrandCatchment(targetView, lat, lng, label); }, 100);
  }
}

// Keep legacy function for onclick handlers in insights panel
function showOnMap(lat, lng, label) {
  showOnBrandMap(lat, lng, label, 'map');
}

// ===== MAP INITIALIZATION (deferred) =====
let catchCircle = null, catchPin = null;

function showCatchment(lat, lng, label) {
  if (!window._map) return;
  if (catchCircle) { window._map.removeLayer(catchCircle); catchCircle = null; }
  if (catchPin) { window._map.removeLayer(catchPin); catchPin = null; }
  catchCircle = L.circle([lat, lng], {radius:15000, color:'#fca50a', weight:2, opacity:.8, fillColor:'#fca50a', fillOpacity:.1, dashArray:'8 6'}).addTo(window._map);
  catchPin = L.marker([lat, lng], {icon:L.divIcon({className:'', html:'<div style="background:#fca50a;color:#000;font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.4);transform:translate(-50%,-100%)">'+label+'<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid #fca50a;margin:0 auto"></div></div>', iconSize:[0,0], iconAnchor:[0,0]})}).addTo(window._map);
  window._map.flyTo([lat, lng], 11, {duration:1.5});
}

function clearCatchment() {
  if (catchCircle) { window._map.removeLayer(catchCircle); catchCircle = null; }
  if (catchPin) { window._map.removeLayer(catchPin); catchPin = null; }
}

// Generic brand catchment (replaces per-brand showSnsCatchment, etc.)
var brandCatchState = {}; // {viewKey: {circle, pin}}
function showBrandCatchment(viewKey, lat, lng, label) {
  var cfg = BRAND_MAPS[viewKey];
  if (!cfg || !window[cfg.mapKey]) return;
  var map = window[cfg.mapKey];
  clearBrandCatchment(viewKey);
  var col = cfg.color;
  var txtCol = isLightColor(col) ? '#000' : '#fff';
  var circle = L.circle([lat, lng], {radius:15000, color:col, weight:2, opacity:.8, fillColor:col, fillOpacity:.1, dashArray:'8 6'}).addTo(map);
  var pin = L.marker([lat, lng], {icon:L.divIcon({className:'', html:'<div style="background:'+col+';color:'+txtCol+';font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.4);transform:translate(-50%,-100%)">'+label+'<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid '+col+';margin:0 auto"></div></div>', iconSize:[0,0], iconAnchor:[0,0]})}).addTo(map);
  brandCatchState[viewKey] = {circle:circle, pin:pin};
  map.flyTo([lat, lng], 11, {duration:1.5});
}
function clearBrandCatchment(viewKey) {
  var cfg = BRAND_MAPS[viewKey];
  if (!cfg || !window[cfg.mapKey]) return;
  var s = brandCatchState[viewKey];
  if (s) {
    if (s.circle) window[cfg.mapKey].removeLayer(s.circle);
    if (s.pin) window[cfg.mapKey].removeLayer(s.pin);
    delete brandCatchState[viewKey];
  }
}
function isLightColor(hex) { var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return (r*299+g*587+b*114)/1000 > 150; }
// Legacy wrapper for existing onclick handlers
function showSnsCatchment(lat, lng, label) { showBrandCatchment('sns-map', lat, lng, label); }
function clearSnsCatchment() { clearBrandCatchment('sns-map'); }

function initMap() {
  const isDark = document.body.classList.contains('dark-mode');
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const map = L.map('map', {center:[-28.5,134], zoom:5, zoomControl:true, attributionControl:false, minZoom:4, maxZoom:18, scrollWheelZoom:true});
  tileLayer = L.tileLayer(tileUrl, {subdomains:'abcd', maxZoom:20}).addTo(map);
  window._map = map;
  window._tileLayer = tileLayer;

  const sC = {Boutique:'#e74c3c', Concession:'#3498db', Outlet:'#2ecc71'};
  REVIEW_STORES.forEach(s => {
    const m = L.circleMarker([s.la, s.ln], {radius:7, fillColor:sC[s.t]||'#fff', fillOpacity:.9, color:'#fff', weight:2, zIndexOffset:1000});
    m.bindTooltip('<div style="font-weight:700;font-size:14px">'+s.n+'</div><div style="font-size:11px;color:var(--tx2)">'+s.t+' &middot; '+s.c+', '+s.s+'</div>', {className:'postcode-tooltip', direction:'top', offset:[0,-10]});
    m.addTo(map);
  });

  // Competitor stores
  const COMP_COLORS = {'Country Road':'#a855f7','Witchery':'#ec4899','Mimco':'#f59e0b','Trenery':'#14b8a6','Seed Heritage':'#f97316','Gorman':'#06b6d4','Cue':'#8b5cf6','Sportscraft':'#10b981','Portmans':'#ef4444','Forever New':'#84cc16'};
  const compLayer = L.layerGroup();
  REVIEW_COMP_STORES.forEach(s => {
    const col = COMP_COLORS[s.b] || '#a855f7';
    const m = L.circleMarker([s.la, s.ln], {radius:5, fillColor:col, fillOpacity:.85, color:'rgba(255,255,255,.6)', weight:1.5, zIndexOffset:900});
    m.bindTooltip('<div style="font-weight:700;font-size:13px">'+s.b+'</div><div style="font-size:12px">'+s.n+'</div><div style="font-size:10px;color:var(--tx2)">'+s.c+'</div>', {className:'postcode-tooltip', direction:'top', offset:[0,-8]});
    compLayer.addLayer(m);
  });
  document.getElementById('compToggle').addEventListener('change', function() {
    if (this.checked) { compLayer.addTo(map); document.getElementById('compBrandLegend').classList.add('visible'); }
    else { map.removeLayer(compLayer); document.getElementById('compBrandLegend').classList.remove('visible'); }
  });

  let hL = null, mL = L.layerGroup().addTo(map), cP = [], cM = 0;
  function gCol(r){const S=[[0,[0,0,4]],[.1,[22,11,57]],[.2,[66,10,104]],[.3,[106,23,110]],[.4,[147,38,103]],[.5,[188,55,84]],[.6,[221,81,58]],[.7,[243,120,25]],[.8,[252,165,10]],[.9,[246,215,70]],[1,[252,255,164]]];let lo=S[0],hi=S[S.length-1];for(let i=0;i<S.length-1;i++){if(r>=S[i][0]&&r<=S[i+1][0]){lo=S[i];hi=S[i+1];break;}}const t=(r-lo[0])/(hi[0]-lo[0]||1);const c=lo[1].map((v,i)=>Math.round(v+(hi[1][i]-v)*t));return 'rgb('+c[0]+','+c[1]+','+c[2]+')';}

  function uMk() {
    mL.clearLayers();
    const z = map.getZoom(), h = document.getElementById('zoomHint');
    if (z >= 8) h.style.opacity = '0';
    else { h.style.opacity = '1'; h.textContent = '\u{1F50D} Scroll to zoom \u00B7 Postcode detail '+(8-z)+' zoom levels away'; }
    if (z < 8 || !cP.length) return;
    const br = z >= 14 ? 10 : z >= 12 ? 8 : z >= 10 ? 6 : 4;
    cP.forEach(p => {
      const la=p[0], ln=p[1], v=p[2], r=cM>0?v/cM:0, pc=gPC(la,ln);
      const mk = L.circleMarker([la,ln], {radius:br, fillColor:gCol(Math.min(r,1)), fillOpacity:.35, color:'rgba(255,255,255,.15)', weight:.5});
      let tt = '<div class="postcode-tooltip">'+(pc?'<div class="pc-code">'+pc+'</div>':'')+'<div class="pc-sales">'+fC(v)+' this week</div>';
      if (pc && REVIEW_PC_DETAIL[pc]) { const d=REVIEW_PC_DETAIL[pc]; tt+='<div class="pc-meta">'+d.d+'km to '+d.ns+' ('+d.nt+')</div><div class="pc-meta">CY2025: '+fC(d.dem)+' \u00B7 '+d.ord+' orders \u00B7 AOV $'+d.aov.toFixed(0)+'</div>'; if(d.rpt!==null) tt+='<div class="pc-meta">Repeat: '+d.rpt+'% \u00B7 '+d.opc+' ord/cust</div>'; }
      tt += '</div>';
      mk.bindTooltip(tt, {permanent:false, direction:'top', offset:[0,-8], className:'pc-tooltip-wrapper'});
      mL.addLayer(mk);
    });
  }

  function uWk(i) {
    const w=REVIEW_DATA[i], pts=w[4]; cP=pts;
    document.getElementById('weekLabel').textContent = 'Week '+(i+1)+': '+fD(w[0])+' \u2014 '+fD(w[1]);
    document.getElementById('totalSales').textContent = fC(w[2]);
    document.getElementById('totalOrders').textContent = fN(w[3]);
    document.getElementById('totalPostcodes').textContent = fN(pts.length);
    const _ws=document.getElementById('weekSlider'); if(_ws) _ws.value = i;
    let mx=0; pts.forEach(p => { if(p[2]>mx) mx=p[2]; }); cM=mx;
    const nm = pts.map(p => [p[0], p[1], mx>0 ? p[2]/mx : 0]);
    if (hL) hL.setLatLngs(nm);
    else { hL=L.heatLayer(nm, {radius:30, blur:25, maxZoom:12, max:0.6, minOpacity:0.15, gradient:{0:'rgba(0,0,0,0)',0.05:'#0d0829',0.15:'#2a0a5e',0.25:'#6a0d83',0.35:'#a8226a',0.45:'#d63a4a',0.55:'#f05a24',0.65:'#f3781e',0.75:'#fca50a',0.85:'#f6d746',0.95:'#fcffa4',1:'#fcffa4'}}).addTo(map); }
    uMk();
  }

  map.on('zoomend', () => { if(hL){ const z=map.getZoom(); hL.setOptions({radius:z>=12?22:z>=10?26:z>=8?28:30, blur:z>=12?18:z>=10?22:z>=8?24:25}); } uMk(); });

  const sl=document.getElementById('weekSlider'), pb=document.getElementById('playBtn'), sb=document.getElementById('speedBtn');
  let pl=false, pi=null, sp=[1,2,4], si=0;
  function gD(){return[800,400,150][si];}
  function tP(){if(!sl)return;pl=!pl;pb.textContent=pl?'\u23F8':'\u25B6';if(pl)pi=setInterval(()=>{let v=(parseInt(sl.value)+1)%REVIEW_DATA.length;sl.value=v;uWk(v);},gD());else clearInterval(pi);}
  if(sl){
    sl.addEventListener('input', function(){ if(typeof currentMonth!=='undefined'&&typeof getWeeksForMonth==='function'){const indices=getWeeksForMonth(currentMonth);const li=parseInt(sl.value);if(li>=0&&li<indices.length){weekMode=true;uWk(indices[li]);}}});
    pb.addEventListener('click', tP);
    sb.addEventListener('click', ()=>{si=(si+1)%3;sb.textContent=sp[si]+'\u00D7';if(pl){clearInterval(pi);pi=setInterval(()=>{let v=(parseInt(sl.value)+1)%REVIEW_DATA.length;sl.value=v;uWk(v);},gD());}});
    document.addEventListener('keydown', e=>{if(e.key===' '){e.preventDefault();tP();}else if(e.key==='ArrowRight'){let v=Math.min(parseInt(sl.value)+1,REVIEW_DATA.length-1);sl.value=v;uWk(v);}else if(e.key==='ArrowLeft'){let v=Math.max(parseInt(sl.value)-1,0);sl.value=v;uWk(v);}});
  }

  // Month filter
  const monthFilter = document.getElementById('monthFilter');
  const weekSliderRow = document.querySelector('.slider-row'); // removed from DOM
  const weekTicksEl = document.querySelector('.week-ticks');
  const weekLabelEl = document.getElementById('weekLabel');

  function getMonthFromDate(dateStr) { return new Date(dateStr+'T00:00:00').getMonth(); }
  function getWeeksForMonth(monthIdx) {
    if (monthIdx === -1) return REVIEW_DATA.map((_, i) => i);
    return REVIEW_DATA.map((w, i) => [w, i]).filter(([w]) => getMonthFromDate(w[0]) === monthIdx).map(([_, i]) => i);
  }
  // Make accessible for slider
  window.getWeeksForMonth = getWeeksForMonth;

  function aggregateWeeks(indices) {
    const merged = {};
    let totalSales = 0, totalOrders = 0;
    indices.forEach(i => {
      const w = REVIEW_DATA[i];
      totalSales += w[2];
      totalOrders += w[3];
      w[4].forEach(p => {
        const key = p[0]+','+p[1];
        if (!merged[key]) merged[key] = [p[0], p[1], 0];
        merged[key][2] += p[2];
      });
    });
    return { totalSales, totalOrders, pts: Object.values(merged), count: indices.length };
  }

  function showAggregated(monthIdx) {
    const indices = getWeeksForMonth(monthIdx);
    if (!indices.length) return;
    const agg = aggregateWeeks(indices);
    cP = agg.pts;
    if (weekLabelEl) { if (monthIdx === -1) weekLabelEl.textContent = 'All Year \u2014 '+REVIEW_DATA.length+' weeks aggregated'; else weekLabelEl.textContent = MONTHS[monthIdx]+' \u2014 '+agg.count+' weeks aggregated'; }
    document.getElementById('totalSales').textContent = fC(agg.totalSales);
    document.getElementById('totalOrders').textContent = fN(agg.totalOrders);
    document.getElementById('totalPostcodes').textContent = fN(agg.pts.length);
    const aovEl = document.getElementById('totalAOV');
    if (aovEl && agg.totalOrders > 0) aovEl.textContent = '$' + (agg.totalSales / agg.totalOrders).toFixed(0);
    let mx=0; agg.pts.forEach(p => { if(p[2]>mx) mx=p[2]; }); cM=mx;
    const nm = agg.pts.map(p => [p[0], p[1], mx>0 ? p[2]/mx : 0]);
    if (hL) hL.setLatLngs(nm);
    else { hL=L.heatLayer(nm, {radius:30, blur:25, maxZoom:12, max:0.6, minOpacity:0.15, gradient:{0:'rgba(0,0,0,0)',0.05:'#0d0829',0.15:'#2a0a5e',0.25:'#6a0d83',0.35:'#a8226a',0.45:'#d63a4a',0.55:'#f05a24',0.65:'#f3781e',0.75:'#fca50a',0.85:'#f6d746',0.95:'#fcffa4',1:'#fcffa4'}}).addTo(map); }
    uMk();
  }

  let currentMonth = -1;
  let weekMode = false;
  // Make accessible
  window.currentMonth = currentMonth;

  monthFilter.addEventListener('change', function() {
    currentMonth = parseInt(this.value);
    window.currentMonth = currentMonth;
    if (pl) tP();
    showAggregated(currentMonth);
    if(weekSliderRow) weekSliderRow.style.display = 'flex';
    if(weekTicksEl) weekTicksEl.style.display = 'flex';
    if(sl){
      const indices = getWeeksForMonth(currentMonth);
      sl.min = 0;
      sl.max = indices.length - 1;
      sl.value = 0;
    }
    weekMode = false;
  });

  if(sl){
    sl.addEventListener('input', function(e) {
      e.stopImmediatePropagation();
      const indices = getWeeksForMonth(currentMonth);
      const localIdx = parseInt(sl.value);
      if (localIdx >= 0 && localIdx < indices.length) {
        weekMode = true;
        uWk(indices[localIdx]);
      }
    }, true);
  }

  // Show aggregated on load
  showAggregated(-1);
}


// ===== SNS MAP INITIALIZATION (deferred) =====
// ===== GENERIC BRAND MAP INITIALIZATION =====
// Config: { id, mapElId, mapKey, tileKey, color, hmData, stores, clusters,
//           storeColors, clusterColor, zoomHintId, oppToggleId,
//           gradient, storeRadius(optional fn), hmFields:{lat,lng,pc,dem,ord,aov,dist,loc} }
function initBrandMap(cfg) {
  const isDark = document.body.classList.contains('dark-mode');
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const map = L.map(cfg.mapElId, {center:[-28.5,134], zoom:5, zoomControl:true, attributionControl:false, minZoom:4, maxZoom:18, scrollWheelZoom:true});
  const tileLayer = L.tileLayer(tileUrl, {subdomains:'abcd', maxZoom:20}).addTo(map);
  window[cfg.mapKey] = map;
  window[cfg.tileKey] = tileLayer;

  // Compute max demand for normalization
  const f = cfg.hmFields || {lat:0, lng:1, pc:3, dem:4, ord:5, aov:6, dist:7, loc:8};
  let maxDem = 0;
  cfg.hmData.forEach(p => { if (p[f.dem] > maxDem) maxDem = p[f.dem]; });

  // Heatmap layer
  const hmPts = cfg.hmData.map(p => [p[f.lat], p[f.lng], maxDem > 0 ? p[f.dem] / maxDem : 0]);
  const heatLayer = L.heatLayer(hmPts, {
    radius:30, blur:25, maxZoom:12, max:0.6, minOpacity:0.15, gradient:cfg.gradient
  }).addTo(map);

  // Store markers
  cfg.stores.forEach(s => {
    const col = cfg.storeColors[s.t] || cfg.color;
    const r = cfg.storeRadius ? cfg.storeRadius(s) : 7;
    const m = L.circleMarker([s.lat, s.lng], {radius:r, fillColor:col, fillOpacity:.9, color:'#fff', weight:2, zIndexOffset:1000});
    m.bindTooltip('<div style="font-weight:700;font-size:14px">'+s.n+'</div><div style="font-size:11px;color:#999">'+s.t+'</div><div style="font-size:10px;color:#666">'+(s.a||'')+'</div>', {className:'postcode-tooltip', direction:'top', offset:[0,-10]});
    m.addTo(map);
  });

  // Opportunity cluster circles (toggle)
  if (cfg.clusters && cfg.clusters.length && cfg.oppToggleId) {
    const clusterLayer = L.layerGroup();
    cfg.clusters.forEach(c => {
      const radius = Math.max(8000, Math.min(25000, c.avg_dist * 800));
      const circle = L.circle([c.lat, c.lng], {radius:radius, color:cfg.clusterColor||cfg.color, weight:2, opacity:.7, fillColor:cfg.clusterColor||cfg.color, fillOpacity:.08, dashArray:'8 6'});
      let tt = '<div style="font-weight:700;font-size:13px">'+c.locality+', '+c.state+'</div>';
      tt += '<div style="font-size:12px;color:'+cfg.color+';font-weight:600">'+fC(c.demand)+' demand</div>';
      tt += '<div style="font-size:11px">'+c.orders+' orders &middot; '+c.n+' postcodes</div>';
      tt += '<div style="font-size:10px;color:#999">Avg '+c.avg_dist.toFixed(1)+'km from nearest store</div>';
      circle.bindTooltip(tt, {className:'postcode-tooltip', direction:'top'});
      clusterLayer.addLayer(circle);
    });
    const toggle = document.getElementById(cfg.oppToggleId);
    if (toggle) toggle.addEventListener('change', function() {
      if (this.checked) clusterLayer.addTo(map); else map.removeLayer(clusterLayer);
    });
  }

  // Competitor store markers (toggle)
  if (cfg.compStores && cfg.compStores.length && cfg.compToggleId) {
    const compLayer = L.layerGroup();
    cfg.compStores.forEach(function(s) {
      var col = (cfg.compColors && cfg.compColors[s.b]) || '#a855f7';
      var m = L.circleMarker([s.lat, s.lng], {radius:5, fillColor:col, fillOpacity:.85, color:'rgba(255,255,255,.6)', weight:1.5, zIndexOffset:900});
      m.bindTooltip('<div style="font-weight:700;font-size:13px">'+s.b+'</div><div style="font-size:12px">'+s.n+'</div>', {className:'postcode-tooltip', direction:'top', offset:[0,-8]});
      compLayer.addLayer(m);
    });
    var compToggle = document.getElementById(cfg.compToggleId);
    if (compToggle) compToggle.addEventListener('change', function() {
      if (this.checked) compLayer.addTo(map); else map.removeLayer(compLayer);
    });
  }

  // Postcode bubbles at zoom 8+
  const markerLayer = L.layerGroup().addTo(map);
  function gCol(ratio) {
    const t = Math.min(ratio, 1);
    // Parse cfg.color as base, lerp toward white
    const bc = cfg.bubbleColorFn;
    if (bc) return bc(t);
    // Default: just use brand color at varying opacity
    return cfg.color;
  }

  function updateMarkers() {
    markerLayer.clearLayers();
    const z = map.getZoom();
    const h = document.getElementById(cfg.zoomHintId);
    if (h) {
      if (z >= 8) h.style.opacity = '0';
      else { h.style.opacity = '1'; h.textContent = '\u{1F50D} Scroll to zoom \u00B7 Postcode detail '+(8-z)+' zoom levels away'; }
    }
    if (z < 8) return;
    const br = z >= 14 ? 10 : z >= 12 ? 8 : z >= 10 ? 6 : 4;
    cfg.hmData.forEach(p => {
      const la=p[f.lat], ln=p[f.lng], pc=p[f.pc], dem=p[f.dem], ord=p[f.ord], aov=p[f.aov];
      const dist = f.dist !== undefined ? p[f.dist] : null;
      const loc = f.loc !== undefined ? p[f.loc] : '';
      const r = maxDem > 0 ? dem / maxDem : 0;
      const mk = L.circleMarker([la,ln], {radius:br, fillColor:gCol(r), fillOpacity:.4, color:'rgba(255,255,255,.15)', weight:.5});
      let tt = '<div class="postcode-tooltip"><div class="pc-code">'+pc+'</div>';
      if (loc) tt += '<div style="font-size:11px;color:#999">'+loc+'</div>';
      tt += '<div class="pc-sales" style="color:'+cfg.color+'">'+fC(dem)+' demand</div>';
      tt += '<div class="pc-meta">'+ord+' orders &middot; AOV $'+(aov?aov.toFixed(2):'N/A')+'</div>';
      if (dist !== null && dist !== undefined) tt += '<div class="pc-meta">'+Number(dist).toFixed(1)+'km to nearest store</div>';
      tt += '</div>';
      mk.bindTooltip(tt, {permanent:false, direction:'top', offset:[0,-8], className:'pc-tooltip-wrapper'});
      markerLayer.addLayer(mk);
    });
  }

  map.on('zoomend', () => {
    if(heatLayer){ const z=map.getZoom(); heatLayer.setOptions({radius:z>=12?22:z>=10?26:z>=8?28:30, blur:z>=12?18:z>=10?22:z>=8?24:25}); }
    updateMarkers();
  });
  updateMarkers();

  // Theme reactivity
  const themeObs = new MutationObserver(() => {
    if (window[cfg.mapKey] && window[cfg.tileKey]) {
      const dark = document.body.classList.contains('dark-mode');
      window[cfg.mapKey].removeLayer(window[cfg.tileKey]);
      const url = dark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      window[cfg.tileKey] = L.tileLayer(url, {subdomains:'abcd', maxZoom:20}).addTo(window[cfg.mapKey]);
      window[cfg.tileKey].bringToBack();
    }
  });
  themeObs.observe(document.body, {attributes:true, attributeFilter:['class']});

  return map;
}

// ===== BRAND REGISTRY (non-Review brands) =====
// To add a new brand: add an entry here, create the HTML containers, data file, and insights panel.
var BRAND_MAPS = {
  'sns-map': {
    id:'sns', tabLabel:'Shoes \x26 Sox', mapElId:'snsMap', mapKey:'_snsMap', tileKey:'_snsTileLayer', viewElId:'snsMapView',
    bodyClass:'sns-active', insClass:'sns-ins', color:'#FF4B0F', clusterColor:'#FDC145',
    hmData: typeof SNS_HM !== 'undefined' ? SNS_HM : [],
    stores: typeof SNS_STORES !== 'undefined' ? SNS_STORES : [],
    clusters: typeof SNS_CLUSTERS !== 'undefined' ? SNS_CLUSTERS : [],
    storeColors: {'SNS Store':'#FF4B0F', 'Myer Concession':'#3398FF'},
    zoomHintId:'snsZoomHint', oppToggleId:'snsOppToggle',
    stats: {demand:'$15.06M', orders:'159,963', postcodes:'2,233', aov:'$94.16'},
    storeCount: 96, storeLegend: [{color:'#FF4B0F',label:'SNS Store',count:40},{color:'#3398FF',label:'Myer Concession',count:56}],
    hmFields: {lat:0, lng:1, pc:3, dem:4, ord:5, aov:6, dist:7, loc:8},
    gradient: {0:'rgba(0,0,0,0)',0.1:'rgba(255,75,15,0.1)',0.25:'rgba(255,75,15,0.3)',0.4:'rgba(255,75,15,0.5)',0.55:'#FF4B0F',0.7:'#FD8C33',0.85:'#FDC145',0.95:'#fff',1:'#fff'},
    bubbleColorFn: function(t){ return 'rgb('+Math.round(255*(1-t*0.3))+','+Math.round(75+(193-75)*t)+','+Math.round(15+(69-15)*t)+')'; }
  },
  'yt-map': {
    id:'yt', tabLabel:'Yarra Trail', mapElId:'ytMap', mapKey:'_ytMap', tileKey:'_ytTileLayer', viewElId:'ytMapView',
    bodyClass:'yt-active', insClass:'yt-ins', color:'#6B4C3B', clusterColor:'#C4956A',
    hmData: typeof YT_HM !== 'undefined' ? YT_HM : [],
    stores: typeof YT_STORES !== 'undefined' ? YT_STORES : [],
    clusters: typeof YT_CLUSTERS !== 'undefined' ? YT_CLUSTERS : [],
    storeColors: {'BOUTIQUE':'#6B4C3B', 'CONCESSION':'#A0522D', 'STOCKIST':'#C4956A', 'DAVID JONES':'#A0522D'},
    storeRadius: function(s){ return s.t==='BOUTIQUE'?8:s.t==='STOCKIST'?5:7; },
    zoomHintId:'ytZoomHint', oppToggleId:'ytOppToggle',
    stats: {demand:'$1.72M', orders:'10,442', postcodes:'984', aov:'$164.81'},
    storeCount: 109, storeLegend: [{color:'#6B4C3B',label:'Boutique',count:2},{color:'#A0522D',label:'Concession',count:15},{color:'#C4956A',label:'Stockist',count:89},{color:'#A0522D',label:'David Jones',count:3}],
    hmFields: {lat:0, lng:1, pc:3, dem:4, ord:5, aov:6, dist:9, loc:8},
    gradient: {0:'rgba(0,0,0,0)',0.1:'rgba(107,76,59,0.1)',0.25:'rgba(107,76,59,0.3)',0.4:'rgba(107,76,59,0.5)',0.55:'#6B4C3B',0.7:'#A0522D',0.85:'#C4956A',0.95:'#F5DEB3',1:'#fff'},
    bubbleColorFn: function(t){ return 'rgb('+Math.round(107+(245-107)*t)+','+Math.round(76+(222-76)*t)+','+Math.round(59+(179-59)*t)+')'; }
  },
  'elka-map': {
    id:'elka', tabLabel:'Elka Collective', mapElId:'elkaMap', mapKey:'_elkaMap', tileKey:'_elkaTileLayer', viewElId:'elkaMapView',
    bodyClass:'elka-active', insClass:'elka-ins', color:'#5B7553', clusterColor:'#8FAE85',
    hmData: typeof ELKA_HM !== 'undefined' ? ELKA_HM : [],
    stores: typeof ELKA_STORES !== 'undefined' ? ELKA_STORES : [],
    clusters: typeof ELKA_CLUSTERS !== 'undefined' ? ELKA_CLUSTERS : [],
    storeColors: {'Boutique':'#5B7553','David Jones':'#8B6914','Stockist':'#A8BFA0'},
    stats: {demand:'$4.22M', orders:'16,956', postcodes:'1,511', aov:'$238.92'},
    storeCount: 97, storeLegend: [{color:'#5B7553',label:'Boutique',count:11},{color:'#8B6914',label:'David Jones',count:9},{color:'#A8BFA0',label:'Stockist',count:77}],
    storeRadius: function(s){ return s.t==='Boutique'?8:s.t==='David Jones'?7:5; },
    compStores: typeof ELKA_COMP !== 'undefined' ? ELKA_COMP : [],
    compColors: {'Aje':'#D4A574','Zimmermann':'#C48B9F','Scanlan Theodore':'#7B9DB7','Camilla':'#E8A87C','Morrison':'#85B09A','Bassike':'#B8A9C9'},
    compToggleId: 'elkaCompToggle',
    hmFields: {lat:0, lng:1, pc:3, dem:4, ord:5, aov:6, dist:7, loc:8},
    gradient: {0:'rgba(0,0,0,0)',0.1:'rgba(91,117,83,0.1)',0.25:'rgba(91,117,83,0.3)',0.4:'rgba(91,117,83,0.5)',0.55:'#5B7553',0.7:'#7B8F6B',0.85:'#A8BFA0',0.95:'#E8F0E4',1:'#fff'},
    bubbleColorFn: function(t){ return 'rgb('+Math.round(91+(200-91)*t)+','+Math.round(117+(210-117)*t)+','+Math.round(83+(180-83)*t)+')'; }
  },
  'hp-map': {
    id:'hp', tabLabel:'Hush Puppies', mapElId:'hpMap', mapKey:'_hpMap', tileKey:'_hpTileLayer', viewElId:'hpMapView',
    bodyClass:'hp-active', insClass:'hp-ins', color:'#8B5E3C', clusterColor:'#C4956A',
    hmData: typeof HP_HM !== 'undefined' ? HP_HM : [],
    stores: typeof HP_STORES !== 'undefined' ? HP_STORES : [],
    clusters: typeof HP_CLUSTERS !== 'undefined' ? HP_CLUSTERS : [],
    storeColors: {'Myer Concession':'#3498db', 'Hush Puppies Store':'#8B5E3C'},
    zoomHintId:'hpZoomHint', oppToggleId:'hpOppToggle',
    stats: {demand:'$9.15M', orders:'68,355', postcodes:'2,107', aov:'$133.79'},
    storeCount: 62, storeLegend: [{color:'#3498db',label:'Myer Concession',count:56},{color:'#8B5E3C',label:'Hush Puppies Store',count:6}],
    hmFields: {lat:0, lng:1, pc:3, dem:4, ord:5, aov:6, dist:7, loc:8},
    gradient: {0:'rgba(0,0,0,0)',0.1:'rgba(139,94,60,0.1)',0.25:'rgba(139,94,60,0.3)',0.4:'rgba(139,94,60,0.5)',0.55:'#8B5E3C',0.7:'#C4956A',0.85:'#F5DEB3',0.95:'#fff',1:'#fff'},
    bubbleColorFn: function(t){ return 'rgb('+Math.round(139+(255-139)*t)+','+Math.round(94+(255-94)*t)+','+Math.round(60+(255-60)*t)+')'; }
  },
  'bp-map': {
    id:'bp', tabLabel:'Black Pepper', mapElId:'bpMap', mapKey:'_bpMap', tileKey:'_bpTileLayer', viewElId:'bpMapView',
    bodyClass:'bp-active', insClass:'bp-ins', color:'#e53935', clusterColor:'#FF8A80',
    hmData: typeof BP_HM !== 'undefined' ? BP_HM : [],
    stores: typeof BP_STORES !== 'undefined' ? BP_STORES : [],
    clusters: typeof BP_CLUSTERS !== 'undefined' ? BP_CLUSTERS : [],
    storeColors: {'Black Pepper Store':'#e53935', 'David Jones':'#8B6914', 'Outlet':'#2ecc71'},
    zoomHintId:'bpZoomHint', oppToggleId:'bpOppToggle',
    stats: {demand:'$9.91M', orders:'74,383', postcodes:'2,264', aov:'$133.23'},
    storeCount: 96, storeLegend: [{color:'#e53935',label:'Black Pepper Store',count:80},{color:'#8B6914',label:'David Jones',count:13},{color:'#2ecc71',label:'Outlet',count:3}],
    hmFields: {lat:0, lng:1, pc:3, dem:4, ord:5, aov:6, dist:7, loc:8},
    gradient: {0:'rgba(0,0,0,0)',0.1:'rgba(229,57,53,0.1)',0.25:'rgba(229,57,53,0.3)',0.4:'rgba(229,57,53,0.5)',0.55:'#e53935',0.7:'#FF8A80',0.85:'#FFCDD2',0.95:'#fff',1:'#fff'},
    bubbleColorFn: function(t){ return 'rgb('+Math.round(229+(255-229)*t)+','+Math.round(57+(255-57)*t)+','+Math.round(53+(255-53)*t)+')'; }
  },
  'reebok-map': {
    id:'reebok', tabLabel:'Reebok', mapElId:'reebokMap', mapKey:'_reebokMap', tileKey:'_reebokTileLayer', viewElId:'reebokMapView',
    bodyClass:'reebok-active', insClass:'reebok-ins', color:'#CC0000', clusterColor:'#FF6666',
    hmData: typeof RBK_HM !== 'undefined' ? RBK_HM : [],
    stores: typeof RBK_STORES !== 'undefined' ? RBK_STORES : [],
    clusters: typeof RBK_CLUSTERS !== 'undefined' ? RBK_CLUSTERS : [],
    storeColors: {'Myer Concession':'#3498db', 'Reebok Store':'#CC0000'},
    zoomHintId:'reebokZoomHint', oppToggleId:'reebokOppToggle',
    stats: {demand:'$11.17M', orders:'83,029', postcodes:'2,183', aov:'$134.50'},
    storeCount: 32, storeLegend: [{color:'#3498db',label:'Myer Concession',count:28},{color:'#CC0000',label:'Reebok Store',count:4}],
    hmFields: {lat:0, lng:1, pc:3, dem:4, ord:5, aov:6, dist:7, loc:8},
    gradient: {0:'rgba(0,0,0,0)',0.1:'rgba(204,0,0,0.1)',0.25:'rgba(204,0,0,0.3)',0.4:'rgba(204,0,0,0.5)',0.55:'#CC0000',0.7:'#FF6666',0.85:'#FFCDD2',0.95:'#fff',1:'#fff'},
    bubbleColorFn: function(t){ return 'rgb('+Math.round(204+(255-204)*t)+','+Math.round(0+(255-0)*t)+','+Math.round(0+(255-0)*t)+')'; }
  },
  'sw-map': {
    id:'sw', tabLabel:'Shoe Warehouse', mapElId:'swMap', mapKey:'_swMap', tileKey:'_swTileLayer', viewElId:'swMapView',
    bodyClass:'sw-active', insClass:'sw-ins', color:'#E85D00', clusterColor:'#FFB74D',
    hmData: typeof SW_HM !== 'undefined' ? SW_HM : [],
    stores: typeof SW_STORES !== 'undefined' ? SW_STORES : [],
    clusters: typeof SW_CLUSTERS !== 'undefined' ? SW_CLUSTERS : [],
    storeColors: {'Outlet':'#E85D00'},
    compStores: typeof SW_COMP_STORES !== 'undefined' ? SW_COMP_STORES : [],
    compColors: {"Athlete's Foot":'#2ecc71','The Athlete\'s Foot':'#2ecc71','Platypus Shoes':'#9b59b6','Hype DC':'#e74c3c','Skechers':'#3498db','Spendless':'#f39c12','Foot Locker':'#1abc9c'},
    compToggleId: 'swCompToggle',
    zoomHintId:'swZoomHint', oppToggleId:'swOppToggle',
    stats: {demand:'$4.00M', orders:'41,366', postcodes:'1,999', aov:'$98.30'},
    storeCount: 19, storeLegend: [{color:'#E85D00',label:'Outlet Store',count:19}],
    hmFields: {lat:0, lng:1, pc:3, dem:4, ord:5, aov:6, dist:7, loc:8},
    gradient: {0:'rgba(0,0,0,0)',0.1:'rgba(232,93,0,0.1)',0.25:'rgba(232,93,0,0.3)',0.4:'rgba(232,93,0,0.5)',0.55:'#E85D00',0.7:'#FF8C33',0.85:'#FFB74D',0.95:'#fff',1:'#fff'},
    bubbleColorFn: function(t){ return 'rgb('+Math.round(232+(255-232)*t)+','+Math.round(93+(255-93)*t)+','+Math.round(0+(255-0)*t)+')'; }
  },
  'superdry-map': {
    id:'sd', tabLabel:'Superdry', mapElId:'sdMap', mapKey:'_sdMap', tileKey:'_sdTileLayer', viewElId:'sdMapView',
    bodyClass:'sd-active', insClass:'sd-ins', color:'#FF6B00', clusterColor:'#FFB74D',
    hmData: typeof SD_HM !== 'undefined' ? SD_HM : [],
    stores: typeof SD_STORES !== 'undefined' ? SD_STORES : [],
    clusters: typeof SD_CLUSTERS !== 'undefined' ? SD_CLUSTERS : [],
    storeColors: {'Superdry Store':'#FF6B00', 'Outlet':'#2ecc71'},
    zoomHintId:'sdZoomHint', oppToggleId:'sdOppToggle',
    stats: {demand:'$10.91M', orders:'64,536', postcodes:'1,913', aov:'$169.00'},
    storeCount: 16, storeLegend: [{color:'#FF6B00',label:'Superdry Store',count:9},{color:'#2ecc71',label:'Outlet',count:7}],
    hmFields: {lat:0, lng:1, pc:3, dem:4, ord:5, aov:6, dist:7, loc:8},
    gradient: {0:'rgba(0,0,0,0)',0.1:'rgba(255,107,0,0.1)',0.25:'rgba(255,107,0,0.3)',0.4:'rgba(255,107,0,0.5)',0.55:'#FF6B00',0.7:'#FFB74D',0.85:'#FFE0B2',0.95:'#fff',1:'#fff'},
    bubbleColorFn: function(t){ return 'rgb('+Math.round(255+(255-255)*t)+','+Math.round(107+(255-107)*t)+','+Math.round(0+(255-0)*t)+')'; }
  }
};

// ===== DYNAMIC BRAND REGISTRATION =====
// Call registerBrand(viewKey) to auto-generate map container, CSS, tab, and select option.
// Existing SNS/YT containers are hand-coded, so skip if element already exists.
function registerBrand(viewKey) {
  var cfg = BRAND_MAPS[viewKey];
  if (!cfg) return;

  // Skip if container already exists (hand-coded brands)
  if (document.getElementById(cfg.viewElId)) return;

  // 1. Inject CSS rules
  var style = document.createElement('style');
  var prefix = cfg.id;
  style.textContent = '.' + prefix + '-map-view{display:flex;flex-direction:column;flex:1;position:relative}' +
    '.' + prefix + '-map-view.hidden{display:none}' +
    '#' + cfg.mapElId + '{flex:1;width:100%;min-height:0}' +
    '.' + prefix + '-header{position:absolute;top:0;left:0;right:0;background:linear-gradient(var(--hd-g0),var(--hd-g1));padding:20px 32px 40px;z-index:1000;display:flex;align-items:center;gap:16px;pointer-events:none}' +
    '.' + prefix + '-header>*{pointer-events:auto}' +
    '.' + prefix + '-controls{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(var(--ov-g0),var(--ov-g1) 30%);padding:24px 32px 28px;z-index:1000}' +
    '.' + prefix + '-stats{display:flex;gap:32px;flex-wrap:wrap;align-items:baseline}' +
    '.' + prefix + '-store-legend{position:absolute;top:80px;left:20px;background:var(--ov);border:1px solid var(--bd);border-radius:8px;padding:10px 14px;z-index:1000;font-size:11px}' +
    '.' + prefix + '-zoom-hint{position:absolute;top:80px;right:20px;background:var(--ov);border:1px solid var(--bd);border-radius:8px;padding:8px 14px;font-size:11px;color:var(--tx3);z-index:1000;pointer-events:none;transition:opacity .3s}' +
    'body.' + cfg.bodyClass + ' .insights-column .ins.review-ins{display:none}' +
    'body.' + cfg.bodyClass + ' .insights-column .ins.' + cfg.insClass + '{display:block}' +
    '.ins.' + cfg.insClass + '{display:none}' +
    'body.summary-active .insights-column .ins.' + cfg.insClass + '{display:none}' +
    '@media(max-width:768px){#' + cfg.mapElId + '{min-height:50vh!important}#' + cfg.viewElId + '{min-height:60vh}.' + prefix + '-stats{gap:16px 24px}.' + prefix + '-stats .stat-value{font-size:22px}.' + prefix + '-stats .stat-value.orders{font-size:16px}}';
  document.head.appendChild(style);

  // 2. Build legend HTML
  var legendHtml = '<div style="font-weight:600;margin-bottom:6px;color:var(--tx2)">Stores (' + cfg.storeCount + ')</div>';
  (cfg.storeLegend || []).forEach(function(s) {
    legendHtml += '<div class="store-legend-item"><div class="store-legend-dot" style="background:' + s.color + '"></div><span class="legend-label">' + s.label + ' (' + s.count + ')</span></div>';
  });
  if (cfg.clusters && cfg.clusters.length) {
    legendHtml += '<div class="comp-toggle"><input type="checkbox" id="' + cfg.oppToggleId + '"><label for="' + cfg.oppToggleId + '">Opportunity Zones (' + cfg.clusters.length + ')</label></div>';
  }
  if (cfg.compStores && cfg.compStores.length && cfg.compToggleId) {
    legendHtml += '<div class="comp-toggle"><input type="checkbox" id="' + cfg.compToggleId + '"><label for="' + cfg.compToggleId + '">Competitors (' + cfg.compStores.length + ')</label></div>';
  }

  // 3. Build stats HTML
  var st = cfg.stats || {};
  var statsHtml = '';
  if (st.demand) statsHtml += '<div><div class="stat-label">Demand Sales</div><div class="stat-value">' + st.demand + '</div></div>';
  if (st.orders) statsHtml += '<div><div class="stat-label">Orders</div><div class="stat-value orders">' + st.orders + '</div></div>';
  if (st.postcodes) statsHtml += '<div><div class="stat-label">Postcodes</div><div class="stat-value orders">' + st.postcodes + '</div></div>';
  if (st.aov) statsHtml += '<div><div class="stat-label">AOV</div><div class="stat-value orders">' + st.aov + '</div></div>';

  // 4. Build container HTML
  var label = cfg.tabLabel || cfg.id.toUpperCase();
  var container = document.createElement('div');
  container.className = prefix + '-map-view hidden';
  container.id = cfg.viewElId;
  container.innerHTML = '<div class="' + prefix + '-header"><div><div class="brand-logo" style="color:' + cfg.color + '">' + label + '</div><div class="brand-sub">Australia &middot; Sales &amp; Store Halo Analysis &middot; CY2025</div></div></div>' +
    '<div id="' + cfg.mapElId + '"></div>' +
    '<div class="' + prefix + '-zoom-hint" id="' + cfg.zoomHintId + '">\uD83D\uDD0D Scroll to zoom &middot; Postcode detail at zoom 8+</div>' +
    '<div class="' + prefix + '-store-legend">' + legendHtml + '</div>' +
    '<div class="' + prefix + '-controls"><div class="' + prefix + '-stats">' + statsHtml + '</div><div style="margin-top:12px;font-size:12px;color:var(--tx3)">Annual data &middot; CY2025 vs CY2024</div></div>';

  // Insert before the insights column
  var mapCol = document.querySelector('.map-column');
  mapCol.appendChild(container);

  // 5. Add tab + select option
  var tabsEl = document.getElementById('viewTabs');
  var tab = document.createElement('div');
  tab.className = 'view-tab';
  tab.setAttribute('data-view', viewKey);
  tab.textContent = label;
  tab.addEventListener('click', function() { switchView(viewKey); });
  tabsEl.appendChild(tab);

  var selectEl = document.getElementById('viewSelect');
  if (selectEl) {
    var opt = document.createElement('option');
    opt.value = viewKey;
    opt.textContent = label;
    selectEl.appendChild(opt);
  }
}

// Register all brands (skips if container already exists)
Object.keys(BRAND_MAPS).forEach(registerBrand);

// Legacy wrappers
function initSnsMap() { initBrandMap(BRAND_MAPS['sns-map']); }
function initYtMap() { initBrandMap(BRAND_MAPS['yt-map']); }



