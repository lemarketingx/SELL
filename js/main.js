document.addEventListener('DOMContentLoaded', () => {
  const fmtILS = (n) => '₪' + Math.round(n).toLocaleString('he-IL');

  const monthly = (principal, annualPct, years) => {
    const r = annualPct / 100 / 12;
    const n = years * 12;
    if (r === 0) return principal / n;
    return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  };

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    btn.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // Results counters (count-up on scroll into view)
  const runCounters = (scope) => {
    const els = scope.querySelectorAll ? scope.querySelectorAll('.mf-count') : [];
    els.forEach((el) => {
      if (el.dataset.done) return;
      el.dataset.done = '1';
      const to = parseFloat(el.dataset.countTo) || 0;
      const prefix = el.dataset.countPrefix || '';
      const suffix = el.dataset.countSuffix || '';
      const dur = 1600;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = Math.round(to * eased);
        el.textContent = prefix + val.toLocaleString('he-IL') + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  };
  try {
    const countersIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCounters(entry.target);
          countersIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.mf-count').forEach((el) => countersIo.observe(el.closest('section') || el));
  } catch (err) {
    document.querySelectorAll('.mf-count').forEach((el) => runCounters(el.parentElement));
  }

  // Calculator tabs
  const tabSavings = document.getElementById('tabSavings');
  const tabMortgage = document.getElementById('tabMortgage');
  const calcSavings = document.getElementById('calcSavings');
  const calcMortgage = document.getElementById('calcMortgage');
  if (tabSavings && tabMortgage) {
    tabSavings.addEventListener('click', () => {
      tabSavings.classList.add('is-active');
      tabSavings.setAttribute('aria-selected', 'true');
      tabMortgage.classList.remove('is-active');
      tabMortgage.setAttribute('aria-selected', 'false');
      calcSavings.classList.remove('is-hidden');
      calcMortgage.classList.add('is-hidden');
    });
    tabMortgage.addEventListener('click', () => {
      tabMortgage.classList.add('is-active');
      tabMortgage.setAttribute('aria-selected', 'true');
      tabSavings.classList.remove('is-active');
      tabSavings.setAttribute('aria-selected', 'false');
      calcMortgage.classList.remove('is-hidden');
      calcSavings.classList.add('is-hidden');
    });
  }

  // Savings (refinance) calculator
  const amount = document.getElementById('amount');
  const years = document.getElementById('years');
  const rate = document.getElementById('rate');
  if (amount && years && rate) {
    const amountOut = document.getElementById('amountOut');
    const yearsOut = document.getElementById('yearsOut');
    const rateOut = document.getElementById('rateOut');
    const saveMonthlyOut = document.getElementById('saveMonthlyOut');
    const saveTotalOut = document.getElementById('saveTotalOut');

    const updateSavings = () => {
      const a = +amount.value;
      const y = +years.value;
      const r = +rate.value;
      const ourRate = Math.max(r - 0.75, 1.5);
      const saveMonthly = Math.max(monthly(a, r, y) - monthly(a, ourRate, y), 0);
      const saveTotal = saveMonthly * y * 12;

      amountOut.textContent = fmtILS(a);
      yearsOut.textContent = y + ' שנים';
      rateOut.textContent = r.toFixed(1) + '%';
      saveMonthlyOut.textContent = fmtILS(saveMonthly);
      saveTotalOut.textContent = fmtILS(saveTotal);
    };
    [amount, years, rate].forEach(el => el.addEventListener('input', updateSavings));
    updateSavings();
  }

  // New mortgage calculator
  const price = document.getElementById('price');
  const downPct = document.getElementById('downPct');
  const years2 = document.getElementById('years2');
  const rate2 = document.getElementById('rate2');
  if (price && downPct && years2 && rate2) {
    const priceOut = document.getElementById('priceOut');
    const downPctOut = document.getElementById('downPctOut');
    const years2Out = document.getElementById('years2Out');
    const rate2Out = document.getElementById('rate2Out');
    const loanAmountOut = document.getElementById('loanAmountOut');
    const mortgageMonthlyOut = document.getElementById('mortgageMonthlyOut');
    const mortgageInterestOut = document.getElementById('mortgageInterestOut');

    const updateMortgage = () => {
      const p = +price.value;
      const d = +downPct.value;
      const y = +years2.value;
      const r = +rate2.value;
      const loanAmount = p * (1 - d / 100);
      const mortgageMonthly = monthly(loanAmount, r, y);
      const mortgageTotal = mortgageMonthly * y * 12;
      const mortgageInterest = Math.max(mortgageTotal - loanAmount, 0);

      priceOut.textContent = fmtILS(p);
      downPctOut.textContent = d + '%';
      years2Out.textContent = y + ' שנים';
      rate2Out.textContent = r.toFixed(1) + '%';
      loanAmountOut.textContent = fmtILS(loanAmount);
      mortgageMonthlyOut.textContent = fmtILS(mortgageMonthly);
      mortgageInterestOut.textContent = fmtILS(mortgageInterest);
    };
    [price, downPct, years2, rate2].forEach(el => el.addEventListener('input', updateMortgage));
    updateMortgage();
  }

  // Contact form (front-end validation + friendly confirmation)
  const form = document.getElementById('contactForm');
  const success = document.getElementById('contactSuccess');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      form.hidden = true;
      success.hidden = false;
    });
  }

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
