document.addEventListener('DOMContentLoaded', () => {
  const fmtILS = (n) => '₪' + Math.round(n).toLocaleString('he-IL');

  const monthly = (principal, annualPct, years) => {
    const r = annualPct / 100 / 12;
    const n = years * 12;
    if (r === 0) return principal / n;
    return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  };

  // Live proof ticker
  const proofText = document.getElementById('proofText');
  if (proofText) {
    const proofMessages = [
      'לקוח מבאר שבע חסך ₪190,000 השבוע',
      'משפחה מחיפה קיבלה אישור עקרוני תוך 48 שעות',
      'לקוחה מדימונה מיחזרה משכנתא וחסכה ₪1,450 בחודש',
      'לקוח שנדחה בעבר קיבל אישור משכנתא החודש',
      'זוג מבאר יעקב חתם על משכנתא ראשונה השבוע',
    ];
    let proofIdx = 0;
    proofText.textContent = proofMessages[0];
    setInterval(() => {
      proofText.classList.add('is-fading');
      setTimeout(() => {
        proofIdx = (proofIdx + 1) % proofMessages.length;
        proofText.textContent = proofMessages[proofIdx];
        proofText.classList.remove('is-fading');
      }, 350);
    }, 4200);
  }

  // Spotlight glow that follows the cursor on dark panels
  document.querySelectorAll('.spotlight').forEach((panel) => {
    panel.addEventListener('mousemove', (e) => {
      const rect = panel.getBoundingClientRect();
      panel.style.setProperty('--spot-x', ((e.clientX - rect.left) / rect.width * 100) + '%');
      panel.style.setProperty('--spot-y', ((e.clientY - rect.top) / rect.height * 100) + '%');
    });
  });

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
    const interestCurrentOut = document.getElementById('interestCurrentOut');
    const interestOursOut = document.getElementById('interestOursOut');
    const barCurrent = document.getElementById('barCurrent');
    const barOurs = document.getElementById('barOurs');

    const updateSavings = () => {
      const a = +amount.value;
      const y = +years.value;
      const r = +rate.value;
      const ourRate = Math.max(r - 0.75, 1.5);
      const monthlyCurrent = monthly(a, r, y);
      const monthlyOurs = monthly(a, ourRate, y);
      const saveMonthly = Math.max(monthlyCurrent - monthlyOurs, 0);
      const saveTotal = saveMonthly * y * 12;
      const interestCurrent = Math.max(monthlyCurrent * y * 12 - a, 0);
      const interestOurs = Math.max(monthlyOurs * y * 12 - a, 0);

      amountOut.textContent = fmtILS(a);
      yearsOut.textContent = y + ' שנים';
      rateOut.textContent = r.toFixed(1) + '%';
      saveMonthlyOut.textContent = fmtILS(saveMonthly);
      saveTotalOut.textContent = fmtILS(saveTotal);

      interestCurrentOut.textContent = fmtILS(interestCurrent);
      interestOursOut.textContent = fmtILS(interestOurs);
      const maxInterest = Math.max(interestCurrent, interestOurs, 1);
      barCurrent.style.height = Math.max(interestCurrent / maxInterest * 100, 4) + '%';
      barOurs.style.height = Math.max(interestOurs / maxInterest * 100, 4) + '%';
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
    const amortBalanceLine = document.getElementById('amortBalanceLine');
    const amortInterestLine = document.getElementById('amortInterestLine');

    // Yearly amortization series: balance remaining (% of loan) vs cumulative interest (% of total interest)
    const amortizationSeries = (principal, annualPct, years, payment) => {
      const r = annualPct / 100 / 12;
      const n = years * 12;
      let balance = principal;
      let cumInterest = 0;
      const points = [{ balance, cumInterest: 0 }];
      for (let m = 1; m <= n; m++) {
        const interest = balance * r;
        const principalPaid = Math.min(payment - interest, balance);
        balance = Math.max(balance - principalPaid, 0);
        cumInterest += interest;
        if (m % 12 === 0 || m === n) points.push({ balance, cumInterest });
      }
      return points;
    };

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

      if (amortBalanceLine && amortInterestLine) {
        const series = amortizationSeries(loanAmount, r, y, mortgageMonthly);
        const maxInterest = Math.max(mortgageInterest, 1);
        const w = 400, h = 140, pad = 6;
        const step = (w - pad * 2) / (series.length - 1);
        const balancePts = series.map((pt, i) => {
          const x = pad + i * step;
          const yVal = pad + (1 - pt.balance / loanAmount) * (h - pad * 2);
          return x + ',' + yVal;
        }).join(' ');
        const interestPts = series.map((pt, i) => {
          const x = pad + i * step;
          const yVal = h - pad - (pt.cumInterest / maxInterest) * (h - pad * 2);
          return x + ',' + yVal;
        }).join(' ');
        amortBalanceLine.setAttribute('points', balancePts);
        amortInterestLine.setAttribute('points', interestPts);
      }
    };
    [price, downPct, years2, rate2].forEach(el => el.addEventListener('input', updateMortgage));
    updateMortgage();
  }

  // Eligibility wizard
  const wizardSteps = document.querySelectorAll('.wizard-step');
  const wizardProgressFill = document.getElementById('wizardProgressFill');
  const wizardBack = document.getElementById('wizardBack');
  if (wizardSteps.length) {
    const totalSteps = wizardSteps.length;
    let currentStep = 1;

    const goToStep = (stepNum) => {
      wizardSteps.forEach((step) => {
        step.classList.toggle('is-active', +step.dataset.step === stepNum);
      });
      wizardProgressFill.style.width = (stepNum / totalSteps * 100) + '%';
      wizardBack.hidden = stepNum <= 1;
      currentStep = stepNum;
    };

    wizardSteps.forEach((step) => {
      step.querySelectorAll('.wizard-option').forEach((btn) => {
        btn.addEventListener('click', () => {
          step.querySelectorAll('.wizard-option').forEach((b) => b.classList.remove('is-selected'));
          btn.classList.add('is-selected');
          setTimeout(() => goToStep(currentStep + 1), 250);
        });
      });
    });

    wizardBack.addEventListener('click', () => {
      if (currentStep > 1) goToStep(currentStep - 1);
    });
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
