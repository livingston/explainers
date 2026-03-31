/* ============================================
   Tax Calculator — New vs Old Regime
   Income Tax Act 2025 (Section 202 & Finance Act)
   Depends on: tax-utils.js (loaded before this)
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  var incomeInput = document.getElementById('calc-income');
  var ageSelect = document.getElementById('calc-age');
  var deductionsInput = document.getElementById('calc-deductions');
  var newTaxEl = document.getElementById('calc-new-tax');
  var oldTaxEl = document.getElementById('calc-old-tax');
  var newEffEl = document.getElementById('calc-new-effective');
  var oldEffEl = document.getElementById('calc-old-effective');
  var verdictEl = document.getElementById('calc-verdict');
  var verdictText = document.getElementById('calc-verdict-text');
  var breakdownEl = document.getElementById('calc-breakdown');

  if (!incomeInput) return;

  var fmtCurrency = TaxUtils.fmtCurrency;

  function buildRow(key, val, cls) {
    var row = document.createElement('div');
    row.className = 'bd-row' + (cls ? ' ' + cls : '');
    var k = document.createElement('span');
    k.className = 'bd-row__key';
    k.textContent = key;
    var v = document.createElement('span');
    v.className = 'bd-row__val';
    v.textContent = val;
    row.appendChild(k);
    row.appendChild(v);
    return row;
  }

  function buildBreakdownColumn(title, data) {
    var col = document.createElement('div');
    col.className = 'bd-col';
    var h = document.createElement('div');
    h.className = 'bd-col__title';
    h.textContent = title;
    col.appendChild(h);

    data.forEach(function(item) {
      if (item.section) {
        var label = document.createElement('div');
        label.className = 'bd-section-label';
        label.textContent = item.section;
        col.appendChild(label);
        return;
      }
      var cls = '';
      if (item.bold) cls = 'bd-row--total';
      if (item.muted) cls = 'bd-row--muted';
      if (item.spacer) cls = 'bd-row--spacer';
      col.appendChild(buildRow(item.key, item.val, cls));
    });

    return col;
  }

  function calculate() {
    var grossIncome = Math.max(0, parseInt(incomeInput.value) || 0);
    var age = ageSelect.value;
    var deductions = Math.max(0, parseInt(deductionsInput.value) || 0);

    var newStdDeduction = 75000;
    var newTaxableIncome = Math.max(0, grossIncome - newStdDeduction);

    var oldStdDeduction = 50000;
    var oldTaxableIncome = Math.max(0, grossIncome - oldStdDeduction - deductions);

    var newResult = TaxUtils.computeSlabTax(newTaxableIncome, TaxUtils.newSlabs);
    var oldResult = TaxUtils.computeSlabTax(oldTaxableIncome, TaxUtils.getOldSlabs(age));

    // New regime rebate (Sec 156(2)): full rebate up to 12L
    var newRebate = 0;
    if (newTaxableIncome <= 1200000) {
      newRebate = Math.min(newResult.tax, 60000);
    }
    // Marginal relief: tax shouldn't exceed amount above 12L
    if (newTaxableIncome > 1200000 && newResult.tax > 0) {
      var excess = newTaxableIncome - 1200000;
      if (newResult.tax > excess) {
        newResult.tax = excess;
        newRebate = 0;
      }
    }

    // Old regime rebate (Sec 156(1)): full rebate up to 5L
    var oldRebate = 0;
    if (oldTaxableIncome <= 500000) {
      oldRebate = Math.min(oldResult.tax, 12500);
    }

    var newFinalTax = Math.max(0, newResult.tax - newRebate);
    var oldFinalTax = Math.max(0, oldResult.tax - oldRebate);

    var newCess = newFinalTax * 0.04;
    var oldCess = oldFinalTax * 0.04;
    var newTotal = newFinalTax + newCess;
    var oldTotal = oldFinalTax + oldCess;

    newTaxEl.textContent = fmtCurrency(newTotal);
    oldTaxEl.textContent = fmtCurrency(oldTotal);

    // Pulse animation on result change
    newTaxEl.classList.remove('pulse');
    oldTaxEl.classList.remove('pulse');
    void newTaxEl.offsetWidth; // force reflow to restart animation
    newTaxEl.classList.add('pulse');
    oldTaxEl.classList.add('pulse');

    var newEffRate = grossIncome > 0 ? (newTotal / grossIncome * 100).toFixed(1) : '0.0';
    var oldEffRate = grossIncome > 0 ? (oldTotal / grossIncome * 100).toFixed(1) : '0.0';
    newEffEl.textContent = 'Effective rate: ' + newEffRate + '%';
    oldEffEl.textContent = 'Effective rate: ' + oldEffRate + '%';

    verdictEl.style.display = 'flex';
    var diff = Math.abs(newTotal - oldTotal);
    if (newTotal < oldTotal) {
      verdictEl.className = 'callout callout--tip';
      verdictText.textContent = 'New Regime saves you ' + fmtCurrency(diff) + ' \u2014 the default regime works better for you. No action needed.';
    } else if (oldTotal < newTotal) {
      verdictEl.className = 'callout callout--warning';
      verdictText.textContent = 'Old Regime saves you ' + fmtCurrency(diff) + ' \u2014 you should opt out of the new regime before filing. Inform your employer to adjust TDS.';
    } else {
      verdictEl.className = 'callout callout--info';
      verdictText.textContent = 'Both regimes result in the same tax. The new regime is simpler \u2014 stick with it.';
    }

    // Build breakdown
    breakdownEl.replaceChildren();
    var grid = document.createElement('div');
    grid.className = 'grid-2';
    grid.style.gap = '2rem';

    var newSlabRows = newResult.breakdown.map(function(s) {
      return { key: s.range + ' @ ' + s.rate, val: fmtCurrency(s.amount) };
    });
    var oldSlabRows = oldResult.breakdown.map(function(s) {
      return { key: s.range + ' @ ' + s.rate, val: fmtCurrency(s.amount) };
    });

    var maxSlabs = Math.max(newSlabRows.length, oldSlabRows.length);
    while (newSlabRows.length < maxSlabs) newSlabRows.push({ key: '\u00A0', val: '\u00A0', spacer: true });
    while (oldSlabRows.length < maxSlabs) oldSlabRows.push({ key: '\u00A0', val: '\u00A0', spacer: true });

    var newHasRebate = newRebate > 0;
    var oldHasRebate = oldRebate > 0;

    var newData = [
      { section: 'Income' },
      { key: 'Gross Income', val: fmtCurrency(grossIncome) },
      { key: 'Standard Deduction', val: '- ' + fmtCurrency(newStdDeduction) },
      { key: '\u00A0', val: '\u00A0', spacer: true },
      { key: 'Taxable Income', val: fmtCurrency(newTaxableIncome), bold: true },
      { section: 'Slab-wise Tax' },
    ];
    newSlabRows.forEach(function(s) { newData.push(s); });
    newData.push({ section: 'Tax Payable' });
    newData.push({ key: 'Tax before rebate', val: fmtCurrency(newResult.tax) });
    if (newHasRebate) newData.push({ key: 'Rebate (Sec 156)', val: '- ' + fmtCurrency(newRebate) });
    if (oldHasRebate && !newHasRebate) newData.push({ key: '\u00A0', val: '\u00A0', spacer: true });
    newData.push({ key: 'Tax after rebate', val: fmtCurrency(newFinalTax) });
    newData.push({ key: 'Health & Education Cess (4%)', val: fmtCurrency(newCess), muted: true });
    newData.push({ key: 'Total Tax', val: fmtCurrency(newTotal), bold: true });
    grid.appendChild(buildBreakdownColumn('New Regime', newData));

    var oldData = [
      { section: 'Income' },
      { key: 'Gross Income', val: fmtCurrency(grossIncome) },
      { key: 'Standard Deduction', val: '- ' + fmtCurrency(oldStdDeduction) },
      { key: 'Deductions (80C etc.)', val: '- ' + fmtCurrency(deductions) },
      { key: 'Taxable Income', val: fmtCurrency(oldTaxableIncome), bold: true },
      { section: 'Slab-wise Tax' },
    ];
    oldSlabRows.forEach(function(s) { oldData.push(s); });
    oldData.push({ section: 'Tax Payable' });
    oldData.push({ key: 'Tax before rebate', val: fmtCurrency(oldResult.tax) });
    if (oldHasRebate) oldData.push({ key: 'Rebate (Sec 156)', val: '- ' + fmtCurrency(oldRebate) });
    if (newHasRebate && !oldHasRebate) oldData.push({ key: '\u00A0', val: '\u00A0', spacer: true });
    oldData.push({ key: 'Tax after rebate', val: fmtCurrency(oldFinalTax) });
    oldData.push({ key: 'Health & Education Cess (4%)', val: fmtCurrency(oldCess), muted: true });
    oldData.push({ key: 'Total Tax', val: fmtCurrency(oldTotal), bold: true });
    grid.appendChild(buildBreakdownColumn('Old Regime', oldData));

    breakdownEl.appendChild(grid);
  }

  incomeInput.addEventListener('input', calculate);
  ageSelect.addEventListener('change', calculate);
  deductionsInput.addEventListener('input', calculate);
  calculate();
});
