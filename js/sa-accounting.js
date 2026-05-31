/* ═══════════════════════════════════════════════════════════════
   SA Accounting Engine v1.0
   South African tax tables, formulas, equations, and compliance
   calculations tailored for companies of any size.
   ═══════════════════════════════════════════════════════════════ */
const SAAccounting = (() => {

  const FMT = (n) => new Intl.NumberFormat('en-ZA').format(n);
  const $ = (n) => `R ${FMT(n)}`;

  /* ══════════════════════════════════════════════════════════════
     1. SA TAX TABLES — 2026 Tax Year (1 Mar 2025 – 28 Feb 2026)
     ══════════════════════════════════════════════════════════════ */
  const TAX_BRACKETS_2026 = [
    { min: 0,      max: 237100,   rate: 0.18, base: 0 },
    { min: 237101, max: 370500,   rate: 0.26, base: 42678 },
    { min: 370501, max: 512800,   rate: 0.31, base: 77362 },
    { min: 512801, max: 673000,   rate: 0.36, base: 121475 },
    { min: 673001, max: 857900,   rate: 0.39, base: 179147 },
    { min: 857901, max: 1817000,  rate: 0.41, base: 251258 },
    { min: 1817001, max: Infinity, rate: 0.45, base: 644489 }
  ];

  const TAX_REBATES_2026 = {
    primary:   17235,
    secondary: 9444,  // age 65+
    tertiary:  3145   // age 75+
  };

  const TAX_THRESHOLDS_2026 = {
    under65: 95750,
    age65:   148217,
    age75:   165689
  };

  const MEDICAL_CREDITS_2026 = {
    main:    364,
    first:   730,  // first dependent
    each:    490   // each additional dependent
  };

  const UIF_CEILING = 17712;    // monthly UIF ceiling
  const UIF_RATE_EMPLOYEE = 0.01;
  const UIF_RATE_EMPLOYER = 0.01;
  const SDL_THRESHOLD = 500000; // annual payroll threshold
  const SDL_RATE = 0.01;
  const SDL_CAP = 100;          // per month cap? Actually SDL is uncapped for payroll > R500k

  const VAT_RATE = 0.15;
  const TURNOVER_TAX_BRACKETS = [
    { min: 0,       max: 335000,    rate: 0.00, base: 0 },       // 0%
    { min: 335001,  max: 500000,    rate: 0.01, base: 0 },       // 1% of turnover above R335k
    { min: 500001,  max: 750000,    rate: 0.02, base: 1650 },    // R1,650 + 2% above R500k
    { min: 750001,  max: 1000000,   rate: 0.03, base: 6650 },    // R6,650 + 3% above R750k
    { min: 1000001, max: Infinity,   rate: 0.04, base: 14150 }   // R14,150 + 4% above R1m
  ];

  const CORPORATE_TAX_RATE = 0.27;
  const CGT_INCLUSION_RATE_COMPANY = 0.80;
  const CGT_INCLUSION_RATE_INDIVIDUAL = 0.40;
  const CGT_ANNUAL_EXEMPTION_INDIVIDUAL = 40000;
  const DIVIDENDS_TAX_RATE = 0.20;

  /* ══════════════════════════════════════════════════════════════
     2. PAYE CALCULATOR — Full SA payroll engine
     ══════════════════════════════════════════════════════════════ */

  /**
   * Calculate PAYE tax per SARS 2026 tax tables
   * @param {number} annualSalary - Gross annual salary before deductions
   * @param {object} opts - { age, medicalAidMembers, pensionFundPct, retirementAnnuityPct }
   */
  function calculatePAYE(annualSalary, opts = {}) {
    const age = opts.age || 30;
    const medicalAidMembers = opts.medicalAidMembers || 0;
    const pensionFundPct = opts.pensionFundPct || 0;    // % of salary
    const retirementAnnuityPct = opts.retirementAnnuityPct || 0;

    // 1. Determine taxable income
    const pensionDeduction = Math.min(annualSalary * pensionFundPct / 100, annualSalary * 0.275);
    const raDeduction = Math.min(annualSalary * retirementAnnuityPct / 100, annualSalary * 0.275);
    const totalRetirementDeduction = Math.min(pensionDeduction + raDeduction, annualSalary * 0.275);
    const taxableIncome = Math.max(0, annualSalary - totalRetirementDeduction);

    // 2. Calculate gross tax per brackets
    let grossTax = 0;
    for (const bracket of TAX_BRACKETS_2026) {
      if (taxableIncome > bracket.min && taxableIncome <= bracket.max) {
        grossTax = bracket.base + (taxableIncome - bracket.min) * bracket.rate;
        break;
      }
      if (taxableIncome > bracket.max) continue;
    }
    // Edge case: above top bracket
    if (taxableIncome > TAX_BRACKETS_2026[TAX_BRACKETS_2026.length - 1].min) {
      const top = TAX_BRACKETS_2026[TAX_BRACKETS_2026.length - 1];
      grossTax = top.base + (taxableIncome - top.min) * top.rate;
    }

    // 3. Apply rebates
    let totalRebates = TAX_REBATES_2026.primary;
    if (age >= 65) totalRebates += TAX_REBATES_2026.secondary;
    if (age >= 75) totalRebates += TAX_REBATES_2026.tertiary;

    // 4. Medical aid tax credits
    let medicalCredit = MEDICAL_CREDITS_2026.main * 12;
    if (medicalAidMembers >= 2) {
      medicalCredit += MEDICAL_CREDITS_2026.first * 12;
      medicalCredit += Math.max(0, (medicalAidMembers - 2)) * MEDICAL_CREDITS_2026.each * 12;
    } else if (medicalAidMembers === 1) {
      medicalCredit += MEDICAL_CREDITS_2026.first * 12;
    }

    const taxAfterRebates = Math.max(0, grossTax - totalRebates);
    const annualTax = Math.max(0, taxAfterRebates - medicalCredit);

    return {
      grossAnnual: annualSalary,
      taxableIncome: Math.round(taxableIncome),
      pensionDeduction: Math.round(pensionDeduction),
      raDeduction: Math.round(raDeduction),
      grossTax: Math.round(grossTax),
      totalRebates,
      medicalCredit: Math.round(medicalCredit),
      annualTax: Math.round(annualTax),
      monthlyTax: Math.round(annualTax / 12),
      effectiveRate: annualSalary > 0 ? ((annualTax / annualSalary) * 100).toFixed(1) : '0.0',
      marginalRate: getMarginalRate(taxableIncome),
      thresholdExceeded: annualSalary > getThreshold(age)
    };
  }

  function getMarginalRate(taxableIncome) {
    for (const b of TAX_BRACKETS_2026) {
      if (taxableIncome > b.min && taxableIncome <= b.max) return b.rate * 100;
    }
    return TAX_BRACKETS_2026[TAX_BRACKETS_2026.length - 1].rate * 100;
  }

  function getThreshold(age) {
    if (age >= 75) return TAX_THRESHOLDS_2026.age75;
    if (age >= 65) return TAX_THRESHOLDS_2026.age65;
    return TAX_THRESHOLDS_2026.under65;
  }

  /* ══════════════════════════════════════════════════════════════
     3. TOTAL EMPLOYER COST — Full cost-to-company breakdown
     ══════════════════════════════════════════════════════════════ */

  function employerCost(grossSalary, opts = {}) {
    const monthly = grossSalary / 12;
    const pensionFundPct = opts.pensionFundPct || 0;
    const medicalAidEmployer = opts.medicalAidEmployer || 0;

    // UIF: employer pays 1% of gross, capped at UIF ceiling
    const uifEmployer = Math.min(monthly * UIF_RATE_EMPLOYER, UIF_CEILING * UIF_RATE_EMPLOYER);

    // SDL: 1% of payroll if annual payroll > R500k
    const sdl = grossSalary > SDL_THRESHOLD ? monthly * SDL_RATE : 0;

    // Pension fund employer contribution (% of salary)
    const pensionEmployer = monthly * pensionFundPct / 100;

    // Medical aid employer contribution
    const medicalEmployer = medicalAidEmployer;

    // Skills Development Levy total annual
    const sdlAnnual = grossSalary > SDL_THRESHOLD ? grossSalary * SDL_RATE : 0;

    // Workmen's Compensation (COIDA) — estimate ~0.55% of payroll
    const coida = grossSalary * 0.0055;

    const monthlyCost = monthly + uifEmployer + sdl + pensionEmployer + medicalEmployer;
    const annualCost = monthlyCost * 12;

    return {
      grossAnnual: grossSalary,
      grossMonthly: Math.round(monthly),
      uifEmployer: Math.round(uifEmployer * 100) / 100,
      sdl: Math.round(sdl * 100) / 100,
      sdlAnnual: Math.round(sdlAnnual),
      pensionEmployer: Math.round(pensionEmployer),
      medicalEmployer: Math.round(medicalEmployer),
      coida: Math.round(coida),
      monthlyEmployerCost: Math.round(monthlyCost),
      annualEmployerCost: Math.round(annualCost),
      totalStaffCostAnnual: Math.round(grossSalary + annualCost - grossSalary),
      effectiveMonthly: Math.round(monthlyCost)
    };
  }

  /** Full net pay calculation: employee + employer sides */
  function fullPayrollRun(grossSalary, opts = {}) {
    const age = opts.age || 30;
    const medicalAidMembers = opts.medicalAidMembers || 1;
    const pensionFundPct = opts.pensionFundPct || 7.5;
    const retirementAnnuityPct = opts.retirementAnnuityPct || 0;
    const medicalAidEmployer = opts.medicalAidEmployer || 1500;
    const travelAllowance = opts.travelAllowance || 0;
    const overtimePay = opts.overtimePay || 0;

    const totalGross = grossSalary + travelAllowance + overtimePay;
    const paye = calculatePAYE(totalGross, { age, medicalAidMembers, pensionFundPct, retirementAnnuityPct });

    // Employee UIF
    const monthlyGross = totalGross / 12;
    const uifEmployee = Math.min(monthlyGross * UIF_RATE_EMPLOYEE, UIF_CEILING * UIF_RATE_EMPLOYEE);

    // Pension fund employee contribution
    const pensionEmployee = monthlyGross * pensionFundPct / 100;

    // Net pay
    const monthlyDeductions = (paye.monthlyTax) + uifEmployee + pensionEmployee;
    const monthlyNet = monthlyGross - monthlyDeductions + (medicalAidEmployer > 0 ? 0 : 0); // medical aid employer is additional benefit

    return {
      employee: {
        grossAnnual: totalGross,
        grossMonthly: Math.round(monthlyGross),
        payeAnnual: paye.annualTax,
        payeMonthly: paye.monthlyTax,
        uifMonthly: Math.round(uifEmployee * 100) / 100,
        pensionMonthly: Math.round(pensionEmployee),
        totalDeductionsMonthly: Math.round(monthlyDeductions),
        netMonthly: Math.round(monthlyNet),
        netAnnual: Math.round(monthlyNet * 12),
        effectiveTaxRate: paye.effectiveRate,
        marginalTaxRate: paye.marginalRate
      },
      employer: employerCost(totalGross, { pensionFundPct, medicalAidEmployer }),
      annualSummary: {
        employeeCost: totalGross,
        employerContributions: totalGross > SDL_THRESHOLD ? totalGross * UIF_RATE_EMPLOYER + totalGross * SDL_RATE + totalGross * pensionFundPct / 100 + medicalAidEmployer * 12 + totalGross * 0.0055 : totalGross * UIF_RATE_EMPLOYER + totalGross * pensionFundPct / 100 + medicalAidEmployer * 12 + totalGross * 0.0055,
        totalCostToCompany: Math.round(monthlyGross * 12 + (totalGross > SDL_THRESHOLD ? totalGross * UIF_RATE_EMPLOYER + totalGross * SDL_RATE + totalGross * pensionFundPct / 100 + medicalAidEmployer * 12 + totalGross * 0.0055 : totalGross * UIF_RATE_EMPLOYER + totalGross * pensionFundPct / 100 + medicalAidEmployer * 12 + totalGross * 0.0055))
      }
    };
  }

  /* ══════════════════════════════════════════════════════════════
     4. VAT CALCULATOR — Full SA VAT (15%)
     ══════════════════════════════════════════════════════════════ */

  function vatComprehensive(exclusiveAmount = 0, inclusiveAmount = 0) {
    if (exclusiveAmount > 0) {
      const vat = exclusiveAmount * VAT_RATE;
      return {
        exclusive: Math.round(exclusiveAmount),
        vat: Math.round(vat),
        inclusive: Math.round(exclusiveAmount + vat),
        rate: VAT_RATE * 100
      };
    }
    if (inclusiveAmount > 0) {
      const exclusive = inclusiveAmount / (1 + VAT_RATE);
      return {
        exclusive: Math.round(exclusive),
        vat: Math.round(inclusiveAmount - exclusive),
        inclusive: Math.round(inclusiveAmount),
        rate: VAT_RATE * 100
      };
    }
    return { exclusive: 0, vat: 0, inclusive: 0, rate: VAT_RATE * 100 };
  }

  function vatReturn(totalSales, vatOnSales, totalPurchases, vatOnPurchases) {
    const outputVAT = vatOnSales;
    const inputVAT = vatOnPurchases;
    const netVAT = outputVAT - inputVAT;
    return {
      totalSales: Math.round(totalSales),
      vatOnSales: Math.round(vatOnSales),
      totalPurchases: Math.round(totalPurchases),
      vatOnPurchases: Math.round(vatOnPurchases),
      outputVAT: Math.round(outputVAT),
      inputVAT: Math.round(inputVAT),
      netPayable: netVAT > 0 ? Math.round(netVAT) : 0,
      netRefundable: netVAT < 0 ? Math.round(Math.abs(netVAT)) : 0,
      isPayable: netVAT > 0,
      isRefundable: netVAT < 0
    };
  }

  /* ══════════════════════════════════════════════════════════════
     5. TURNOVER TAX — Micro Business (SARS)
     ══════════════════════════════════════════════════════════════ */

  function turnoverTax(annualTurnover) {
    for (const bracket of TURNOVER_TAX_BRACKETS) {
      if (annualTurnover > bracket.min && annualTurnover <= bracket.max) {
        const tax = bracket.base + (annualTurnover - bracket.min) * bracket.rate;
        return {
          turnover: annualTurnover,
          taxableAmount: annualTurnover,
          tax: Math.round(tax),
          effectiveRate: ((tax / annualTurnover) * 100).toFixed(2),
          bracket: `${$.apply(null, [bracket.min + 1])} – ${bracket.max === Infinity ? 'unlimited' : $(bracket.max)}`
        };
      }
    }
    return { turnover: annualTurnover, tax: 0, effectiveRate: '0.00' };
  }

  /* ══════════════════════════════════════════════════════════════
     6. CAPITAL GAINS TAX
     ══════════════════════════════════════════════════════════════ */

  function capitalGainsTax(proceeds, baseCost, isCompany = true) {
    const capitalGain = Math.max(0, proceeds - baseCost);
    const inclusionRate = isCompany ? CGT_INCLUSION_RATE_COMPANY : CGT_INCLUSION_RATE_INDIVIDUAL;
    const annualExemption = isCompany ? 0 : CGT_ANNUAL_EXEMPTION_INDIVIDUAL;
    const taxableGain = Math.max(0, capitalGain * inclusionRate - annualExemption);
    const taxRate = isCompany ? CORPORATE_TAX_RATE : getMarginalRate(proceeds) / 100;
    const cgt = taxableGain * taxRate;
    return {
      proceeds: Math.round(proceeds),
      baseCost: Math.round(baseCost),
      capitalGain: Math.round(capitalGain),
      inclusionRate,
      taxableGain: Math.round(taxableGain),
      taxRate: taxRate * 100,
      cgtPayable: Math.round(cgt),
      effectiveCGT_Rate: proceeds > 0 ? ((cgt / proceeds) * 100).toFixed(2) : '0.00'
    };
  }

  /* ══════════════════════════════════════════════════════════════
     7. DIVIDENDS TAX
     ══════════════════════════════════════════════════════════════ */

  function dividendsTax(dividendAmount) {
    const tax = dividendAmount * DIVIDENDS_TAX_RATE / (1 - DIVIDENDS_TAX_RATE);
    return {
      grossDividend: Math.round(dividendAmount / (1 - DIVIDENDS_TAX_RATE)),
      netDividend: Math.round(dividendAmount),
      withholdingTax: Math.round(dividendAmount / (1 - DIVIDENDS_TAX_RATE) * DIVIDENDS_TAX_RATE),
      rate: DIVIDENDS_TAX_RATE * 100
    };
  }

  /* ══════════════════════════════════════════════════════════════
     8. IFRS 15 — Revenue Recognition (5-step model)
     ══════════════════════════════════════════════════════════════ */

  function ifrs15(allocation = {}) {
    // Step 1: Identify contract
    // Step 2: Identify performance obligations
    // Step 3: Determine transaction price
    // Step 4: Allocate transaction price
    // Step 5: Recognise revenue when satisfied

    const { totalPrice, obligations } = allocation;
    if (!obligations || !obligations.length) return null;

    const totalSSP = obligations.reduce((s, o) => s + (o.ssp || 0), 0);

    return {
      totalTransactionPrice: totalPrice,
      obligations: obligations.map(o => ({
        description: o.description,
        standaloneSellingPrice: o.ssp,
        allocationPercent: totalSSP > 0 ? ((o.ssp / totalSSP) * 100).toFixed(1) : 0,
        allocatedRevenue: totalSSP > 0 ? Math.round((o.ssp / totalSSP) * totalPrice) : 0,
        recognised: o.satisfied || false,
        recognitionTiming: o.timing || 'point_in_time'
      })),
      totalAllocated: obligations.reduce((s, o) => {
        const alloc = totalSSP > 0 ? Math.round((o.ssp / totalSSP) * totalPrice) : 0;
        return s + alloc;
      }, 0),
      contractLiability: totalPrice - obligations.filter(o => o.satisfied).reduce((s, o) => {
        return s + (totalSSP > 0 ? Math.round((o.ssp / totalSSP) * totalPrice) : 0);
      }, 0)
    };
  }

  /* ══════════════════════════════════════════════════════════════
     9. INVENTORY COSTING — FIFO & Weighted Average
     ══════════════════════════════════════════════════════════════ */

  function fifoCosting(purchases, unitsSold) {
    // purchases: [{ qty, unitCost }] in chronological order
    let remaining = unitsSold;
    let totalCost = 0;
    const layers = purchases.map(p => ({ ...p }));

    for (const layer of layers) {
      if (remaining <= 0) break;
      const taken = Math.min(remaining, layer.qty);
      totalCost += taken * layer.unitCost;
      layer.qty -= taken;
      remaining -= taken;
    }

    const endingInventory = layers.reduce((s, l) => s + l.qty * l.unitCost, 0);
    return {
      cogs: Math.round(totalCost),
      endingInventory: Math.round(endingInventory),
      unitsSold,
      remainingLayers: layers.filter(l => l.qty > 0)
    };
  }

  function weightedAverageCost(purchases, unitsSold, endingUnits) {
    const totalUnits = purchases.reduce((s, p) => s + p.qty, 0);
    const totalCost = purchases.reduce((s, p) => s + p.qty * p.unitCost, 0);
    const avgCost = totalCost / totalUnits;
    return {
      avgCost: Math.round(avgCost * 100) / 100,
      cogs: Math.round(avgCost * unitsSold),
      endingInventory: Math.round(avgCost * endingUnits),
      totalUnits,
      totalCost: Math.round(totalCost)
    };
  }

  /* ══════════════════════════════════════════════════════════════
     10. TIME VALUE OF MONEY — NPV, IRR, PV, FV, PMT
     ══════════════════════════════════════════════════════════════ */

  function futureValue(pv, rate, periods) {
    return Math.round(pv * Math.pow(1 + rate / 100, periods));
  }

  function presentValue(fv, rate, periods) {
    return Math.round(fv / Math.pow(1 + rate / 100, periods));
  }

  function pmt(rate, periods, pv, fv = 0, type = 0) {
    const r = rate / 100 / 12; // monthly rate
    const n = periods;
    if (r === 0) return Math.round(-(pv + fv) / n);
    const pvFactor = (1 - Math.pow(1 + r, -n)) / r;
    const fvFactor = 1 / Math.pow(1 + r, n);
    const payment = (-pv - fv * fvFactor) / pvFactor;
    return Math.round(payment);
  }

  function npv(rate, cashFlows) {
    // cashFlows: [initialInvestment, year1, year2, ...] (negative for outflows)
    let result = cashFlows[0] || 0;
    for (let i = 1; i < cashFlows.length; i++) {
      result += cashFlows[i] / Math.pow(1 + rate / 100, i);
    }
    return Math.round(result * 100) / 100;
  }

  function irr(cashFlows, guess = 0.1) {
    // Newton's method
    let r = guess;
    for (let iter = 0; iter < 1000; iter++) {
      let npvVal = 0;
      let dnpv = 0;
      for (let i = 0; i < cashFlows.length; i++) {
        npvVal += cashFlows[i] / Math.pow(1 + r, i);
        dnpv += -i * cashFlows[i] / Math.pow(1 + r, i + 1);
      }
      if (Math.abs(npvVal) < 0.0001) break;
      if (dnpv === 0) break;
      r = r - npvVal / dnpv;
    }
    return (r * 100).toFixed(2);
  }

  function roi(gain, cost) {
    return { value: ((gain - cost) / cost) * 100, label: 'ROI' };
  }

  function paybackPeriod(initialInvestment, annualCashFlow) {
    return { years: (initialInvestment / annualCashFlow).toFixed(1), months: Math.ceil((initialInvestment / annualCashFlow) * 12) };
  }

  /* ══════════════════════════════════════════════════════════════
     11. CURRENCY CONVERSION — ZAR to/from major currencies
     ══════════════════════════════════════════════════════════════ */

  const EXCHANGE_RATES = {
    USD: 18.25, EUR: 19.80, GBP: 23.15, AUD: 12.10,
    BWP: 1.35, NGN: 0.022, KES: 0.14, GHS: 1.50,
    ZMW: 0.72, MZN: 0.29, ZWL: 0.05, JPY: 0.12,
    CNY: 2.55, INR: 0.22, CAD: 13.50
  };

  function toZAR(amount, currency) {
    const rate = EXCHANGE_RATES[currency];
    if (!rate) return null;
    return { amount: Math.round(amount * rate), rate, from: currency, to: 'ZAR' };
  }

  function fromZAR(amount, currency) {
    const rate = EXCHANGE_RATES[currency];
    if (!rate) return null;
    return { amount: Math.round(amount / rate * 100) / 100, rate, from: 'ZAR', to: currency };
  }

  function convertCurrency(amount, from, to) {
    if (from === 'ZAR') return fromZAR(amount, to);
    if (to === 'ZAR') return toZAR(amount, from);
    // Cross-rate via ZAR
    const inZAR = toZAR(amount, from);
    if (!inZAR) return null;
    return fromZAR(inZAR.amount, to);
  }

  /* ══════════════════════════════════════════════════════════════
     12. INFLATION ADJUSTMENT
     ══════════════════════════════════════════════════════════════ */

  function inflationAdjustment(amount, fromYear, toYear, annualRate = 5.5) {
    const years = toYear - fromYear;
    const adjusted = amount * Math.pow(1 + annualRate / 100, years);
    return {
      originalAmount: Math.round(amount),
      adjustedAmount: Math.round(adjusted),
      fromYear,
      toYear,
      annualRate,
      years,
      cumulativeInflation: ((adjusted / amount - 1) * 100).toFixed(1)
    };
  }

  /* ══════════════════════════════════════════════════════════════
     13. COMPREHENSIVE RATIOS — SA Context
     ══════════════════════════════════════════════════════════════ */

  function allRatios(bs, pl) {
    // bs: { currentAssets, inventory, totalAssets, currentLiabilities, totalLiabilities, totalEquity, cash, receivables }
    // pl: { revenue, cogs, netProfit, operatingProfit, interestExpense, ebitda }
    const ca = bs.currentAssets || 0;
    const inv = bs.inventory || 0;
    const cl = bs.currentLiabilities || 0;
    const ta = bs.totalAssets || 0;
    const tl = bs.totalLiabilities || 0;
    const te = bs.totalEquity || 1;
    const cash = bs.cash || 0;
    const rec = bs.receivables || 0;
    const rev = pl.revenue || 1;
    const cogs = pl.cogs || 0;
    const np = pl.netProfit || 0;
    const op = pl.operatingProfit || 0;
    const ie = pl.interestExpense || 1;
    const ebitda = pl.ebitda || 0;

    return {
      liquidity: {
        currentRatio: { value: (ca / cl).toFixed(2), label: 'Current Ratio', formula: 'Current Assets / Current Liabilities', healthy: '> 1.5', status: ca / cl >= 1.5 ? 'healthy' : ca / cl >= 1 ? 'warning' : 'critical' },
        quickRatio: { value: ((ca - inv) / cl).toFixed(2), label: 'Quick Ratio (Acid Test)', formula: '(Current Assets - Inventory) / Current Liabilities', healthy: '> 1.0', status: (ca - inv) / cl >= 1 ? 'healthy' : (ca - inv) / cl >= 0.5 ? 'warning' : 'critical' },
        cashRatio: { value: (cash / cl).toFixed(2), label: 'Cash Ratio', formula: 'Cash / Current Liabilities', healthy: '> 0.3', status: cash / cl >= 0.3 ? 'healthy' : 'warning' }
      },
      solvency: {
        debtToEquity: { value: (tl / te).toFixed(2), label: 'Debt-to-Equity', formula: 'Total Liabilities / Total Equity', healthy: '< 2.0', status: tl / te <= 2 ? 'healthy' : tl / te <= 4 ? 'warning' : 'critical' },
        debtToAssets: { value: (tl / ta).toFixed(2), label: 'Debt-to-Assets', formula: 'Total Liabilities / Total Assets', healthy: '< 0.6', status: tl / ta <= 0.6 ? 'healthy' : 'warning' },
        equityRatio: { value: (te / ta * 100).toFixed(1), label: 'Equity Ratio (%)', formula: 'Total Equity / Total Assets × 100', healthy: '> 40%', status: te / ta >= 0.4 ? 'healthy' : 'warning' },
        interestCover: { value: (op / ie).toFixed(1), label: 'Interest Coverage', formula: 'Operating Profit / Interest Expense', healthy: '> 3.0', status: op / ie >= 3 ? 'healthy' : op / ie >= 1.5 ? 'warning' : 'critical' }
      },
      profitability: {
        grossMargin: { value: rev > 0 ? ((rev - cogs) / rev * 100).toFixed(1) : '0.0', label: 'Gross Margin %', formula: '(Revenue - COGS) / Revenue × 100' },
        netMargin: { value: rev > 0 ? (np / rev * 100).toFixed(1) : '0.0', label: 'Net Profit Margin %', formula: 'Net Profit / Revenue × 100' },
        returnOnAssets: { value: ta > 0 ? (np / ta * 100).toFixed(1) : '0.0', label: 'Return on Assets (ROA) %', formula: 'Net Profit / Total Assets × 100' },
        returnOnEquity: { value: te > 0 ? (np / te * 100).toFixed(1) : '0.0', label: 'Return on Equity (ROE) %', formula: 'Net Profit / Total Equity × 100' },
        ebitdaMargin: { value: rev > 0 ? (ebitda / rev * 100).toFixed(1) : '0.0', label: 'EBITDA Margin %', formula: 'EBITDA / Revenue × 100' }
      },
      efficiency: {
        assetTurnover: { value: (rev / ta).toFixed(2), label: 'Asset Turnover', formula: 'Revenue / Total Assets' },
        inventoryTurnover: { value: inv > 0 ? (cogs / inv).toFixed(1) : 'N/A', label: 'Inventory Turnover', formula: 'COGS / Average Inventory' },
        daysInventory: { value: inv > 0 ? Math.round(inv / (cogs / 365)) : 'N/A', label: 'Days Inventory Outstanding', formula: 'Inventory / (COGS / 365)' },
        daysSalesOutstanding: { value: rec > 0 ? Math.round(rec / (rev / 365)) : 'N/A', label: 'Days Sales Outstanding', formula: 'Receivables / (Revenue / 365)' },
        daysPayableOutstanding: { value: cl > 0 ? Math.round(cl / (cogs / 365)) : 'N/A', label: 'Days Payable Outstanding', formula: 'Payables / (COGS / 365)' },
        cashConversionCycle: { value: 'N/A', label: 'Cash Conversion Cycle', formula: 'DIO + DSO - DPO' }
      },
      leverage: {
        financialLeverage: { value: (ta / te).toFixed(2), label: 'Financial Leverage', formula: 'Total Assets / Total Equity' },
        longTermDebtToEquity: { value: 'N/A', label: 'Long-Term Debt-to-Equity', formula: 'Long-Term Debt / Total Equity' }
      }
    };
  }

  /* ══════════════════════════════════════════════════════════════
     14. SARS COMPLIANCE — Key thresholds & checks
     ══════════════════════════════════════════════════════════════ */

  function sarsCompliance(annualRevenue, annualPayroll, isVATRegistered = false) {
    const checks = [];

    // VAT registration threshold
    const vatThreshold = 1000000;
    if (annualRevenue > vatThreshold && !isVATRegistered) {
      checks.push({ type: 'error', message: `Mandatory VAT registration required — turnover exceeds R 1,000,000`, section: 'VAT Act Sec 23' });
    } else if (annualRevenue > 50000 && !isVATRegistered) {
      checks.push({ type: 'warning', message: `Voluntary VAT registration possible — turnover exceeds R 50,000`, section: 'VAT Act Sec 23' });
    }

    // PAYE registration
    if (annualPayroll > 0) {
      checks.push({ type: 'info', message: `PAYE registration required if employees > 0`, section: 'Fourth Schedule' });
    }

    // SDL
    if (annualPayroll > SDL_THRESHOLD) {
      checks.push({ type: 'info', message: `SDL applicable — annual payroll exceeds R 500,000`, section: 'Skills Development Levies Act' });
    }

    // UIF
    if (annualPayroll > 0) {
      checks.push({ type: 'info', message: `UIF contributions required for all employees`, section: 'UI Contributions Act' });
    }

    // Turnover tax eligibility
    if (annualRevenue <= 1000000) {
      checks.push({ type: 'info', message: `Eligible for Turnover Tax (micro business) — turnover ≤ R 1,000,000`, section: 'Sixth Schedule' });
    }

    // Provisional tax
    if (annualRevenue > 50000) {
      checks.push({ type: 'info', message: `Provisional taxpayer — annual revenue exceeds R 50,000`, section: 'Fourth Schedule Para 18' });
    }

    // Carbon tax (if applicable industry)
    checks.push({ type: 'info', message: `Carbon Tax may apply — check if your industry is listed`, section: 'Carbon Tax Act' });

    return {
      annualRevenue,
      annualPayroll,
      isVATRegistered,
      checks,
      compliant: checks.filter(c => c.type === 'error').length === 0,
      errors: checks.filter(c => c.type === 'error').length,
      warnings: checks.filter(c => c.type === 'warning').length
    };
  }

  /* ══════════════════════════════════════════════════════════════
     15. SECTION 12J / 12I — Tax Incentives
     ══════════════════════════════════════════════════════════════ */

  function section12J(investmentAmount) {
    const deduction = investmentAmount;
    const taxSaving = investmentAmount * CORPORATE_TAX_RATE;
    return {
      investment: Math.round(investmentAmount),
      deduction: Math.round(deduction),
      taxSaving: Math.round(taxSaving),
      effectiveCost: Math.round(investmentAmount - taxSaving),
      description: 'Section 12J Venture Capital Company investment deduction'
    };
  }

  function section12I(preferredSector, qualifyingAssetCost, trainingCost) {
    const baseDeduction = qualifyingAssetCost * 0.55;
    const trainingDeduction = trainingCost * (preferredSector ? 2.0 : 1.0);
    const totalDeduction = baseDeduction + trainingDeduction;
    return {
      qualifyingAssetCost: Math.round(qualifyingAssetCost),
      trainingCost: Math.round(trainingCost),
      baseDeduction: Math.round(baseDeduction),
      trainingDeduction: Math.round(trainingDeduction),
      totalDeduction: Math.round(totalDeduction),
      taxSaving: Math.round(totalDeduction * CORPORATE_TAX_RATE),
      description: 'Section 12I Industrial Policy Project incentive'
    };
  }

  /* ══════════════════════════════════════════════════════════════
     16. EBITDA & EBIT Calculations
     ══════════════════════════════════════════════════════════════ */

  function earningsMetrics(revenue, cogs, operatingExpenses, depreciation, amortization, interest, tax) {
    const grossProfit = revenue - cogs;
    const ebit = grossProfit - operatingExpenses - depreciation - amortization;
    const ebitda = ebit + depreciation + amortization;
    const ebt = ebit - interest;
    const netIncome = ebt - tax;
    return {
      revenue: Math.round(revenue),
      cogs: Math.round(cogs),
      grossProfit: Math.round(grossProfit),
      operatingExpenses: Math.round(operatingExpenses),
      depreciation: Math.round(depreciation),
      amortization: Math.round(amortization),
      ebitda: Math.round(ebitda),
      ebit: Math.round(ebit),
      ebt: Math.round(ebt),
      netIncome: Math.round(netIncome),
      ebitdaMargin: revenue > 0 ? ((ebitda / revenue) * 100).toFixed(1) : '0.0',
      ebitMargin: revenue > 0 ? ((ebit / revenue) * 100).toFixed(1) : '0.0',
      netMargin: revenue > 0 ? ((netIncome / revenue) * 100).toFixed(1) : '0.0'
    };
  }

  /* ══════════════════════════════════════════════════════════════
     17. DOUBLE-ENTRY BOOKKEEPING — Debit/Credit validation
     ══════════════════════════════════════════════════════════════ */

  const ACCOUNT_TYPES = {
    Asset:     { normalBalance: 'debit', increase: 'debit', decrease: 'credit' },
    Liability: { normalBalance: 'credit', increase: 'credit', decrease: 'debit' },
    Equity:    { normalBalance: 'credit', increase: 'credit', decrease: 'debit' },
    Revenue:   { normalBalance: 'credit', increase: 'credit', decrease: 'debit' },
    Expense:   { normalBalance: 'debit', increase: 'debit', decrease: 'credit' },
    Gain:      { normalBalance: 'credit', increase: 'credit', decrease: 'debit' },
    Loss:      { normalBalance: 'debit', increase: 'debit', decrease: 'credit' }
  };

  function validateJournalEntry(lines) {
    // lines: [{ accountType, amount, side: 'debit'|'credit' }]
    const totalDebits = lines.filter(l => l.side === 'debit').reduce((s, l) => s + l.amount, 0);
    const totalCredits = lines.filter(l => l.side === 'credit').reduce((s, l) => s + l.amount, 0);
    const errors = [];
    const warnings = [];

    lines.forEach((l, i) => {
      const rules = ACCOUNT_TYPES[l.accountType];
      if (!rules) return;
      if (l.side !== rules.increase && l.side !== rules.decrease) {
        warnings.push(`Line ${i + 1}: ${l.accountType} accounts normally ${rules.normalBalance} — ${l.side} is unusual`);
      }
    });

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      errors.push(`Journal entry not balanced: Debits R ${totalDebits.toFixed(2)} ≠ Credits R ${totalCredits.toFixed(2)}`);
    }

    return {
      balanced: Math.abs(totalDebits - totalCredits) <= 0.01,
      totalDebits: Math.round(totalDebits * 100) / 100,
      totalCredits: Math.round(totalCredits * 100) / 100,
      difference: Math.round(Math.abs(totalDebits - totalCredits) * 100) / 100,
      errors,
      warnings
    };
  }

  function normalBalance(accountType) {
    return ACCOUNT_TYPES[accountType]?.normalBalance || 'unknown';
  }

  /* ══════════════════════════════════════════════════════════════
     18. GENERAL LEDGER — Account balance calculation
     ══════════════════════════════════════════════════════════════ */

  function accountBalance(accountType, debits, credits) {
    const rules = ACCOUNT_TYPES[accountType];
    if (!rules) return debits - credits;
    if (rules.normalBalance === 'debit') return debits - credits;
    return credits - debits;
  }

  /* ══════════════════════════════════════════════════════════════
     PUBLIC API
     ══════════════════════════════════════════════════════════════ */

  return {
    FMT, $,
    // Tax Tables
    TAX_BRACKETS_2026, TAX_REBATES_2026, TAX_THRESHOLDS_2026,
    MEDICAL_CREDITS_2026,
    // Tax calculations
    calculatePAYE, employerCost, fullPayrollRun,
    vatComprehensive, vatReturn,
    turnoverTax,
    capitalGainsTax,
    dividendsTax,
    corporateTax: (profit) => ({ tax: Math.round(profit * CORPORATE_TAX_RATE), rate: CORPORATE_TAX_RATE * 100 }),
    // IFRS
    ifrs15,
    // Inventory
    fifoCosting, weightedAverageCost,
    // Time Value
    futureValue, presentValue, pmt, npv, irr, roi, paybackPeriod,
    // Currency
    EXCHANGE_RATES, toZAR, fromZAR, convertCurrency,
    // Inflation
    inflationAdjustment,
    // Ratios
    allRatios,
    // Compliance
    sarsCompliance,
    // Incentives
    section12J, section12I,
    // Earnings
    earningsMetrics,
    // Double-entry
    validateJournalEntry, normalBalance, accountBalance
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = SAAccounting;
