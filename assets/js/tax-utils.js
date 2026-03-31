/* ============================================
   Shared Tax Utilities
   Used by tax-calculator.js and slab-chart.js
   ============================================ */

var TaxUtils = (function() {
  var newSlabs = [
    { limit: 400000, rate: 0 },
    { limit: 800000, rate: 0.05 },
    { limit: 1200000, rate: 0.10 },
    { limit: 1600000, rate: 0.15 },
    { limit: 2000000, rate: 0.20 },
    { limit: 2400000, rate: 0.25 },
    { limit: Infinity, rate: 0.30 }
  ];

  var oldSlabsByAge = {
    'below60': [
      { limit: 250000, rate: 0 },
      { limit: 500000, rate: 0.05 },
      { limit: 1000000, rate: 0.20 },
      { limit: Infinity, rate: 0.30 }
    ],
    '60to80': [
      { limit: 300000, rate: 0 },
      { limit: 500000, rate: 0.05 },
      { limit: 1000000, rate: 0.20 },
      { limit: Infinity, rate: 0.30 }
    ],
    'above80': [
      { limit: 500000, rate: 0 },
      { limit: 1000000, rate: 0.20 },
      { limit: Infinity, rate: 0.30 }
    ]
  };

  function computeSlabTax(income, slabs) {
    var tax = 0;
    var prev = 0;
    var breakdown = [];
    for (var i = 0; i < slabs.length; i++) {
      var slab = slabs[i];
      if (income <= prev) break;
      var taxableInSlab = Math.min(income, slab.limit) - prev;
      var slabTax = taxableInSlab * slab.rate;
      tax += slabTax;
      if (taxableInSlab > 0) {
        breakdown.push({
          range: prev === 0
            ? 'Up to ' + fmtCurrency(slab.limit)
            : fmtCurrency(prev + 1) + ' \u2013 ' + fmtCurrency(Math.min(income, slab.limit)),
          rate: (slab.rate * 100) + '%',
          amount: slabTax
        });
      }
      prev = slab.limit;
    }
    return { tax: tax, breakdown: breakdown };
  }

  function fmtCurrency(n) {
    if (n >= Infinity) return '\u221E';
    return '\u20B9' + Math.round(n).toLocaleString('en-IN');
  }

  return {
    newSlabs: newSlabs,
    oldSlabsByAge: oldSlabsByAge,
    getOldSlabs: function(age) { return oldSlabsByAge[age] || oldSlabsByAge['below60']; },
    computeSlabTax: computeSlabTax,
    fmtCurrency: fmtCurrency
  };
})();
