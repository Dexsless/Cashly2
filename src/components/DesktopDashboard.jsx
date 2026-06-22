import React, { Suspense, lazy } from 'react'
import {
  Sparkles,
  Target,
  Calculator,
  RotateCcw,
  Save,
  Printer,
  Download,
  Languages,
} from 'lucide-react'
import CurrencySelector from './CurrencySelector'
import InputSection from './InputSection'
import ResultSection from './ResultSection'
import cashlyLogo from '../assets/cashly_logo.png'

const AdvancedSection = lazy(() => import('./AdvancedSection'))

// Simple Help Tooltip
const Tooltip = React.memo(({ text, ariaLabel = 'Help' }) => {
  return (
    <span className="tooltip-container">
      <span className="tooltip-icon" aria-label={ariaLabel}>
        <HelpCircle size={13} strokeWidth={2.2} />
      </span>
      <span className="tooltip-box">{text}</span>
    </span>
  )
})
Tooltip.displayName = 'Tooltip'

import { HelpCircle } from 'lucide-react'

// Simple Language Switcher
const LanguageSwitcher = React.memo(({ language, onChange, copy }) => {
  const options = [
    { code: 'id', label: copy.id, title: copy.idTitle },
    { code: 'en', label: copy.en, title: copy.enTitle },
  ]

  return (
    <div className="language-switcher" aria-label={copy.ariaLabel}>
      <Languages size={16} strokeWidth={2.2} />
      <span>{copy.label}</span>
      <div className="language-options">
        {options.map((option) => (
          <button
            aria-pressed={language === option.code}
            className={language === option.code ? 'active' : ''}
            key={option.code}
            onClick={() => onChange(option.code)}
            title={option.title}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
})
LanguageSwitcher.displayName = 'LanguageSwitcher'

const DesktopDashboard = ({
  t,
  language,
  handleLanguageChange,
  selectedMonth,
  setSelectedMonth,
  conditionMode,
  setConditionMode,
  incomeValues,
  handleIncomeChange,
  expenseValues,
  handleExpenseChange,
  moneyInputErrors,
  currencySymbol,
  translatedIncomeFields,
  translatedExpenseFields,
  handleCalculate,
  handleReset,
  handleSave,
  handlePrintPdf,
  handleExportPdf,
  formatMonthLabel,
  selectedCurrency,
  handleCurrencyChange,
  ratesLive,
  ratesLoading,
  totals,
  currentDisplayExpense,
  dashboardStatusTone,
  DashboardStatusIcon,
  dashboardStatusLabel,
  dashboardHeadline,
  dashboardMessage,
  BalanceCardIcon,
  balanceCardMeta,
  hasCalculated,
  formatRupiah,
  showAdvanced,
  setShowAdvanced,
  setMobileStep,
  biggestExpense,
  isCalculatedDataReady,
  status,
  recommendations,
  activeFormulaTab,
  setActiveFormulaTab,
  bisectionResult,
  bisectionSourceLabel,
  bisectionMaxCurrency,
  bisectionMinCurrency,
  isFormulaOpen,
  setIsFormulaOpen,
  nextMonthKey,
  numericalProjection,
  predictedStatus,
  projectionDataset,
  projectionMethod,
  monthlyHistory,
  handleLoadHistory,
  handleDeleteHistory,
  mobileChartOpen,
  setMobileChartOpen,
  mobilePredOpen,
  setMobilePredOpen,
  mobileAnalysisOpen,
  setMobileAnalysisOpen,
  mobileHistoryOpen,
  setMobileHistoryOpen,
  mobileRecoOpen,
  setMobileRecoOpen,
  getConditionLabel,
  getStatus,
  parseMoney,
  expenseData,
  spendingRatio,
  notice
}) => {
  return (
    <div className="desktop-layout-wrapper">
      <section className="hero-section" id="top">
        <div className="topbar">
          <a className="brand-mark" href="#top" aria-label="Cashly">
            <img alt="Cashly" className="brand-logo" src={cashlyLogo} />
          </a>
          <div className="topbar-actions">
            <span className={`status-pill ${dashboardStatusTone}`}>
              <DashboardStatusIcon size={16} strokeWidth={2.3} />
              {dashboardStatusLabel}
            </span>
            <CurrencySelector
              currency={selectedCurrency}
              onChange={handleCurrencyChange}
              ratesLive={ratesLive}
              ratesLoading={ratesLoading}
            />
            <LanguageSwitcher
              copy={t.languageSwitcher}
              language={language}
              onChange={handleLanguageChange}
            />
          </div>
        </div>

        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <Sparkles size={16} strokeWidth={2.2} />
              {t.hero.eyebrow}
            </span>
            <h1>Cashly</h1>
            <p>{t.hero.description}</p>
            <div className="hero-actions">
              <a className="primary-link" href="#input-data">
                {t.hero.primaryAction}
              </a>
              <a className="secondary-link" href="#analisis-metode">
                {t.hero.secondaryAction}
              </a>
            </div>
          </div>

          <div className="hero-panel" aria-label={t.hero.panelAria}>
            <div className="hero-panel-head">
              <span>
                <Target size={18} strokeWidth={2.2} />
                {t.hero.endBalance}
                <Tooltip ariaLabel={t.tooltipHelpLabel} text={t.hero.balanceTooltip} />
              </span>
              <strong className={status.tone}>{formatRupiah(totals.balance)}</strong>
            </div>
            <div className="mini-metrics">
              <span>
                <small>
                  {t.fields.income}
                  <Tooltip ariaLabel={t.tooltipHelpLabel} text={t.hero.incomeTooltip} />
                </small>
                <strong>{formatRupiah(totals.totalIncome)}</strong>
              </span>
              <span>
                <small>
                  {t.fields.expense}
                  <Tooltip ariaLabel={t.tooltipHelpLabel} text={t.hero.expenseTooltip} />
                </small>
                <strong>{formatRupiah(currentDisplayExpense)}</strong>
              </span>
              <span className="period-metric">
                <small>{t.hero.month}</small>
                <strong>{formatMonthLabel(selectedMonth, language)}</strong>
              </span>
            </div>
            <div className="progress-wrap">
              <div className="progress-label">
                <span>{t.hero.spendingRatio}</span>
                <strong>{Math.round(spendingRatio)}%</strong>
              </div>
              <div className="progress-track">
                <span className={`progress-fill ${status.tone}`} style={{ width: `${spendingRatio}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {notice && (
        <p className={`notice ${notice === t.notices.moneyInputError ? 'notice-error' : ''}`} role="status">
          {notice}
        </p>
      )}

      <InputSection
        t={t}
        language={language}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        conditionMode={conditionMode}
        setConditionMode={setConditionMode}
        incomeValues={incomeValues}
        handleIncomeChange={handleIncomeChange}
        expenseValues={expenseValues}
        handleExpenseChange={handleExpenseChange}
        moneyInputErrors={moneyInputErrors}
        currencySymbol={currencySymbol}
        translatedIncomeFields={translatedIncomeFields}
        translatedExpenseFields={translatedExpenseFields}
        handleCalculate={handleCalculate}
        handleReset={handleReset}
        handleSave={handleSave}
        handlePrintPdf={handlePrintPdf}
        handleExportPdf={handleExportPdf}
        formatMonthLabel={formatMonthLabel}
        isMobile={false}
        selectedCurrency={selectedCurrency}
        handleCurrencyChange={handleCurrencyChange}
        ratesLive={ratesLive}
        ratesLoading={ratesLoading}
      />

      <div className="action-bar" id="action-bar">
        <button className="primary-button" onClick={handleCalculate} type="button">
          <Calculator size={18} strokeWidth={2.2} />
          <span className="btn-label">{t.inputSection.calculate}</span>
        </button>
        <button className="ghost-button" onClick={handleReset} type="button">
          <RotateCcw size={18} strokeWidth={2.2} />
          <span className="btn-label">{t.inputSection.reset}</span>
        </button>
        <button className="ghost-button" onClick={handleSave} type="button">
          <Save size={18} strokeWidth={2.2} />
          <span className="btn-label">{t.inputSection.save}</span>
        </button>
        <button className="ghost-button" onClick={handlePrintPdf} type="button">
          <Printer size={18} strokeWidth={2.2} />
          <span className="btn-label">{t.inputSection.print}</span>
        </button>
        <button className="ghost-button" onClick={handleExportPdf} type="button">
          <Download size={18} strokeWidth={2.2} />
          <span className="btn-label">{t.inputSection.export}</span>
        </button>
      </div>

      <ResultSection
        t={t}
        language={language}
        selectedMonth={selectedMonth}
        totals={totals}
        currentDisplayExpense={currentDisplayExpense}
        dashboardStatusTone={dashboardStatusTone}
        DashboardStatusIcon={DashboardStatusIcon}
        dashboardStatusLabel={dashboardStatusLabel}
        dashboardHeadline={dashboardHeadline}
        dashboardMessage={dashboardMessage}
        BalanceCardIcon={BalanceCardIcon}
        balanceCardMeta={balanceCardMeta}
        hasCalculated={hasCalculated}
        formatRupiah={formatRupiah}
        formatMonthLabel={formatMonthLabel}
        isMobile={false}
        showAdvanced={showAdvanced}
        setShowAdvanced={setShowAdvanced}
        setMobileStep={setMobileStep}
      />

      <Suspense fallback={<div className="loading-spinner" style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>Loading Advanced Analysis...</div>}>
        <AdvancedSection
          t={t}
          language={language}
          totals={totals}
          currentDisplayExpense={currentDisplayExpense}
          biggestExpense={biggestExpense}
          isCalculatedDataReady={isCalculatedDataReady}
          status={status}
          recommendations={recommendations}
          formatRupiah={formatRupiah}
          formatMonthLabel={formatMonthLabel}
          conditionMode={conditionMode}
          expenseValues={expenseValues}
          translatedExpenseFields={translatedExpenseFields}
          activeFormulaTab={activeFormulaTab}
          setActiveFormulaTab={setActiveFormulaTab}
          bisectionResult={bisectionResult}
          bisectionSourceLabel={bisectionSourceLabel}
          bisectionMaxCurrency={bisectionMaxCurrency}
          bisectionMinCurrency={bisectionMinCurrency}
          isFormulaOpen={isFormulaOpen}
          setIsFormulaOpen={setIsFormulaOpen}
          nextMonthKey={nextMonthKey}
          numericalProjection={numericalProjection}
          onProjectionMethodChange={setSelectedMonth}
          predictedStatus={predictedStatus}
          projectionDataset={projectionDataset}
          projectionMethod={projectionMethod}
          monthlyHistory={monthlyHistory}
          handleLoadHistory={handleLoadHistory}
          handleDeleteHistory={handleDeleteHistory}
          mobileChartOpen={mobileChartOpen}
          setMobileChartOpen={setMobileChartOpen}
          mobilePredOpen={mobilePredOpen}
          setMobilePredOpen={setMobilePredOpen}
          mobileAnalysisOpen={mobileAnalysisOpen}
          setMobileAnalysisOpen={setMobileAnalysisOpen}
          mobileHistoryOpen={mobileHistoryOpen}
          setMobileHistoryOpen={setMobileHistoryOpen}
          mobileRecoOpen={mobileRecoOpen}
          setMobileRecoOpen={setMobileRecoOpen}
          isMobile={false}
          getConditionLabel={getConditionLabel}
          getStatus={getStatus}
          parseMoney={parseMoney}
          expenseData={expenseData}
        />
      </Suspense>
    </div>
  )
}

export default DesktopDashboard
