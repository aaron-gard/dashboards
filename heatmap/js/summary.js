function buildSummaryCards() {
  const container = document.getElementById('locationCards');
  container.innerHTML = LOCATIONS.map((loc, i) => {
    // Brand badge
    const badge = `<span class="loc-brand-badge ${loc.brandClass}">${loc.brand}</span>`;
    const scoreBadge = loc.score ? `<span style="font-size:11px;font-weight:600;background:${loc.brandColor};color:#fff;padding:2px 8px;border-radius:3px;margin-left:8px">Score: ${loc.score.toFixed(2)}</span>` : '';

    // Metrics row - adapt based on brand
    let metricsHtml = `
      <div class="loc-metric"><div class="lm-label">Catchment Demand</div><div class="lm-value">${loc.demand}</div></div>
      <div class="loc-metric"><div class="lm-label">Orders</div><div class="lm-value">${loc.orders}</div></div>
      <div class="loc-metric"><div class="lm-label">AOV</div><div class="lm-value">${loc.aov}</div></div>
    `;

    if (loc.avgDist) {
      metricsHtml += `<div class="loc-metric"><div class="lm-label">Avg Distance</div><div class="lm-value">${loc.avgDist}</div></div>`;
    }
    if (loc.postcodes) {
      metricsHtml += `<div class="loc-metric"><div class="lm-label">Postcodes</div><div class="lm-value">${loc.postcodes}</div></div>`;
    }

    // Detail metrics (Review has demographics, SNS has distance)
    let detailHtml = '';
    if (loc.population) {
      detailHtml = `
        <div class="loc-metrics-full">
          <div class="lm-mini"><div class="lm-label">Population</div><div class="lm-value">${loc.population}</div></div>
          <div class="lm-mini"><div class="lm-label">HH Income</div><div class="lm-value">${loc.income}</div></div>
          <div class="lm-mini"><div class="lm-label">${loc.demoLabel || (loc.kids ? 'Kids 0-14' : 'Women 25-54')}</div><div class="lm-value">${loc.kids || loc.women}</div></div>
          <div class="lm-mini"><div class="lm-label">Median Age</div><div class="lm-value">${loc.medianAge}</div></div>
          <div class="lm-mini"><div class="lm-label">Nearest Store</div><div class="lm-value">${loc.nearest}</div></div>
        </div>`;
    } else {
      detailHtml = loc.avgDist ? `
        <div class="loc-metrics-full">
          <div class="lm-mini"><div class="lm-label">Avg Store Distance</div><div class="lm-value">${loc.avgDist}</div></div>
        </div>` : '';
    }

    // Sections
    let sectionsHtml = '';
    if (loc.keyPostcodes) {
      sectionsHtml += `
        <div class="loc-section">
          <div class="loc-section-title">&#128205; Key Postcodes</div>
          <div class="loc-postcodes">${loc.keyPostcodes}</div>
        </div>`;
    }
    sectionsHtml += `
      <div class="loc-section">
        <div class="loc-section-title">&#128161; Rationale</div>
        <div class="loc-rationale" style="margin-top:0;padding-top:0;border-top:none">${loc.rationale}</div>
        ${loc.venue ? `<div style="margin-top:10px"><span class="loc-venue">&#127978; Recommended: ${loc.venue}</span></div>` : ''}
      </div>`;

    if (loc.compValidation) {
      sectionsHtml += `
        <div class="loc-section">
          <div class="loc-section-title">&#127978; Competitive Validation</div>
          <div class="loc-comp-validation">${loc.compValidation}</div>
          ${loc.compBrands ? `<div class="loc-comp-brands">Brands present: ${loc.compBrands}</div>` : ''}
        </div>`;
    }

    const borderColor = loc.color || loc.brandColor;
    const viewLabel = 'View on ' + loc.brand + ' heatmap';

    return `
      <div class="location-card" style="border-left:3px solid ${borderColor}">
        <div class="rank">#${i + 1}</div>${scoreBadge}
        ${badge}
        <div class="loc-name">${loc.name}</div>
        <div class="loc-state">${loc.state}</div>
        <div class="loc-metrics">${metricsHtml}</div>
        ${detailHtml}
        ${sectionsHtml}
        <div style="margin-top:14px;text-align:right">
          <span onclick="showOnBrandMap(${loc.lat},${loc.lng},'${loc.label}','${loc.mapView}')" style="font-size:12px;color:var(--accent);cursor:pointer;font-weight:600">${viewLabel} &rarr;</span>
        </div>
      </div>`;
  }).join('');
}
try { buildSummaryCards(); } catch(e) { document.getElementById('locationCards').innerHTML = '<div style="color:red;padding:20px">Error: ' + e.message + '</div>'; }

