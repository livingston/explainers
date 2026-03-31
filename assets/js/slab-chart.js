/* ============================================
   Pure CSS + JS — Tax Slab Comparison Chart
   Depends on: tax-utils.js (loaded before this)
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  var container = document.getElementById('slabChart');
  if (!container) return;

  var incomes = [
    400000, 500000, 600000, 750000, 800000, 1000000,
    1200000, 1275000, 1500000, 1800000, 2000000, 2400000,
    3000000, 4000000, 5000000
  ];

  function calcEffectiveTax(gross, slabs, stdDeduction, rebateLimit, rebateMax, applyMarginal) {
    var taxable = Math.max(0, gross - stdDeduction);
    var result = TaxUtils.computeSlabTax(taxable, slabs);
    var tax = result.tax;
    if (taxable <= rebateLimit) tax = Math.max(0, tax - rebateMax);
    if (applyMarginal && taxable > 1200000) {
      var excess = taxable - 1200000;
      if (tax > excess) tax = excess;
    }
    return tax * 1.04;
  }

  var data = incomes.map(function(income) {
    var newTax = calcEffectiveTax(income, TaxUtils.newSlabs, 75000, 1200000, 60000, true);
    var oldTax = calcEffectiveTax(income, TaxUtils.getOldSlabs('below60'), 50000, 500000, 12500, false);
    return {
      income,
      label: (income / 100000).toFixed(income % 100000 === 0 ? 0 : 1) + 'L',
      newRate: income > 0 ? (newTax / income * 100) : 0,
      oldRate: income > 0 ? (oldTax / income * 100) : 0,
      newTax: Math.round(newTax),
      oldTax: Math.round(oldTax)
    };
  });

  const maxRate = Math.ceil(Math.max(...data.map(d => Math.max(d.newRate, d.oldRate))) / 5) * 5;

  // Build chart DOM using safe DOM methods only
  var chart = document.createElement('div');
  chart.className = 'css-chart';
  chart.setAttribute('role', 'img');
  chart.setAttribute('aria-label', 'Bar chart comparing effective tax rates for New and Old regimes across income levels');

  // Legend
  var legend = document.createElement('div');
  legend.className = 'css-chart__legend';
  var newSwatch = document.createElement('span');
  newSwatch.className = 'css-chart__legend-item css-chart__legend-item--new';
  var oldSwatch = document.createElement('span');
  oldSwatch.className = 'css-chart__legend-item css-chart__legend-item--old';
  legend.appendChild(newSwatch);
  legend.appendChild(document.createTextNode(' New Regime  '));
  legend.appendChild(oldSwatch);
  legend.appendChild(document.createTextNode(' Old Regime'));
  chart.appendChild(legend);

  // Chart body (Y axis + bars area)
  var body = document.createElement('div');
  body.className = 'css-chart__body';

  // Y axis
  var yAxis = document.createElement('div');
  yAxis.className = 'css-chart__y-axis';
  var ticks = 6;
  for (var i = ticks; i >= 0; i--) {
    var val = Math.round(maxRate / ticks * i);
    var tick = document.createElement('span');
    tick.className = 'css-chart__y-tick';
    tick.textContent = val + '%';
    yAxis.appendChild(tick);
  }
  body.appendChild(yAxis);

  // Bars container
  var barsWrap = document.createElement('div');
  barsWrap.className = 'css-chart__bars';

  // Grid lines
  for (var g = 0; g <= ticks; g++) {
    var line = document.createElement('div');
    line.className = 'css-chart__grid-line';
    line.style.bottom = (g / ticks * 100) + '%';
    barsWrap.appendChild(line);
  }

  // Tooltip
  var tooltip = document.createElement('div');
  tooltip.className = 'css-chart__tooltip';
  chart.appendChild(tooltip);

  function showTip(text, rect) {
    tooltip.textContent = text;
    tooltip.classList.add('visible');
    var chartRect = chart.getBoundingClientRect();
    var barRect = rect.getBoundingClientRect();
    tooltip.style.left = (barRect.left - chartRect.left + barRect.width / 2) + 'px';
    tooltip.style.top = (barRect.top - chartRect.top - 8) + 'px';
  }
  function hideTip() { tooltip.classList.remove('visible'); }

  // Bar groups
  data.forEach(function(d, i) {
    var group = document.createElement('div');
    group.className = 'css-chart__group';
    group.setAttribute('tabindex', '0');
    group.setAttribute('role', 'img');
    group.setAttribute('aria-label',
      'Income ' + d.label + ': New regime ' + d.newRate.toFixed(1) + '%, Old regime ' + d.oldRate.toFixed(1) + '%'
    );

    var newBar = document.createElement('div');
    newBar.className = 'css-chart__bar css-chart__bar--new';
    newBar.style.setProperty('--bar-height', (d.newRate / maxRate * 100) + '%');
    newBar.style.setProperty('--bar-delay', (i * 50) + 'ms');

    var oldBar = document.createElement('div');
    oldBar.className = 'css-chart__bar css-chart__bar--old';
    oldBar.style.setProperty('--bar-height', (d.oldRate / maxRate * 100) + '%');
    oldBar.style.setProperty('--bar-delay', (i * 50 + 25) + 'ms');

    var label = document.createElement('span');
    label.className = 'css-chart__x-label';
    label.textContent = d.label;

    group.appendChild(newBar);
    group.appendChild(oldBar);
    group.appendChild(label);
    barsWrap.appendChild(group);

    // Hover on individual bars
    newBar.addEventListener('mouseenter', function() {
      showTip('\u20B9' + d.income.toLocaleString('en-IN') + ' \u2014 New: ' + d.newRate.toFixed(1) + '% (\u20B9' + d.newTax.toLocaleString('en-IN') + ')', newBar);
    });
    oldBar.addEventListener('mouseenter', function() {
      showTip('\u20B9' + d.income.toLocaleString('en-IN') + ' \u2014 Old: ' + d.oldRate.toFixed(1) + '% (\u20B9' + d.oldTax.toLocaleString('en-IN') + ')', oldBar);
    });
    newBar.addEventListener('mouseleave', hideTip);
    oldBar.addEventListener('mouseleave', hideTip);

    // Keyboard focus on group
    group.addEventListener('focus', function() {
      showTip('\u20B9' + d.income.toLocaleString('en-IN') + ' \u2014 New: ' + d.newRate.toFixed(1) + '% | Old: ' + d.oldRate.toFixed(1) + '%', newBar);
    });
    group.addEventListener('blur', hideTip);
  });

  body.appendChild(barsWrap);
  chart.appendChild(body);

  // X axis label
  var xLabel = document.createElement('div');
  xLabel.className = 'css-chart__x-axis-label';
  xLabel.textContent = 'Gross Annual Income';
  chart.appendChild(xLabel);

  container.appendChild(chart);

  // Trigger bar animation after paint
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      chart.classList.add('css-chart--animated');
    });
  });
});
