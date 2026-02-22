// Quick filter chips for collection pages
function quickFilter(btn, type) {
  var chips = btn.parentElement.querySelectorAll('.qf-chip');
  chips.forEach(function(c) { c.classList.remove('active'); });
  btn.classList.add('active');
  var cards = document.querySelectorAll('.pc[data-type]');
  cards.forEach(function(card) {
    if (type === 'All' || card.getAttribute('data-type') === type) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
  // Update count
  var visible = document.querySelectorAll('.pc[data-type]:not([style*="display: none"])').length;
  var countEl = document.querySelector('.plp-count');
  if (countEl) countEl.textContent = visible + ' Products';
}
