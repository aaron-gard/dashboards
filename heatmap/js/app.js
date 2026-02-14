// ===== GLOBAL STATE =====
const viewTabs = document.querySelectorAll('.view-tab');
const summaryView = document.getElementById('summaryView');
const mapView = document.getElementById('mapView');
let mapInitialized = false;

// ===== DARK MODE =====
(function() {
  const themeToggle = document.getElementById('themeToggle');
  const saved = localStorage.getItem('review-heatmap-theme');
  if (saved === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.innerHTML = '&#9728;&#65039; Light mode';
  }
  themeToggle.addEventListener('click', function() {
    const dark = document.body.classList.toggle('dark-mode');
    themeToggle.innerHTML = dark ? '&#9728;&#65039; Light mode' : '&#127763; Dark mode';
    localStorage.setItem('review-heatmap-theme', dark ? 'dark' : 'light');
    // Update map tiles
    const url = dark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    [window._tileLayer, window._snsTileLayer, window._ytTileLayer].forEach(function(tl) {
      if (tl) tl.setUrl(url);
    });
  });
})();




  // View tab/select switching (data-driven via BRAND_MAPS registry)
  var brandMapInitialized = {};
  function switchView(view) {
    document.querySelectorAll('.view-tab').forEach(function(t) {
      t.classList.toggle('active', t.getAttribute('data-view') === view);
    });
    var sel = document.getElementById('viewSelect');
    if (sel) sel.value = view;

    var sv = document.getElementById('summaryView');
    var mv = document.getElementById('mapView');

    // Reset body state classes
    var bodyClasses = ['summary-active'];
    Object.keys(BRAND_MAPS).forEach(function(k){ bodyClasses.push(BRAND_MAPS[k].bodyClass); });
    bodyClasses.forEach(function(c){ document.body.classList.remove(c); });

    // Hide all brand map views
    Object.keys(BRAND_MAPS).forEach(function(k){
      var el = document.getElementById(BRAND_MAPS[k].viewElId);
      if (el) el.classList.add('hidden');
    });

    if (view === 'summary') {
      sv.classList.add('active'); mv.classList.add('hidden');
      document.body.classList.add('summary-active');
    } else if (view === 'map') {
      sv.classList.remove('active'); mv.classList.remove('hidden');
      if (!mapInitialized) { initMap(); mapInitialized = true; }
      if (window._map) setTimeout(function(){ window._map.invalidateSize(); }, 100);
    } else if (BRAND_MAPS[view]) {
      var cfg = BRAND_MAPS[view];
      sv.classList.remove('active'); mv.classList.add('hidden');
      var viewEl = document.getElementById(cfg.viewElId);
      if (viewEl) viewEl.classList.remove('hidden');
      document.body.classList.add(cfg.bodyClass);
      if (!brandMapInitialized[view]) {
        initBrandMap(cfg);
        brandMapInitialized[view] = true;
      }
      if (window[cfg.mapKey]) setTimeout(function(){ window[cfg.mapKey].invalidateSize(); }, 100);
    }

    // Toggle insights panels
    var insClass = view === 'map' ? 'review-ins' : (BRAND_MAPS[view] ? BRAND_MAPS[view].insClass : null);
    document.querySelectorAll('.insights-column .ins').forEach(function(el) {
      if (view === 'summary') { el.style.display = 'none'; }
      else { el.style.display = (insClass && el.classList.contains(insClass)) ? 'block' : 'none'; }
    });
  }
  // Tab clicks
  document.querySelectorAll('.view-tab').forEach(function(tab) {
    tab.addEventListener('click', function() { switchView(this.getAttribute('data-view')); });
  });
  // Select change
  var viewSelect = document.getElementById('viewSelect');
  if (viewSelect) {
    viewSelect.addEventListener('change', function() { switchView(this.value); });
  }

