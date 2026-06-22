import React from 'react'
import {
  HelpCircle,
  ChevronDown,
  CircleDollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Calculator,
  Wallet,
  ReceiptText,
  Sparkles,
  History,
  Upload,
  Trash2,
  PiggyBank,
  PieChart,
  BarChart3
} from 'lucide-react'

// Helper Tooltip Component
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

// Helper SummaryCard Component
const SummaryCard = React.memo(({ icon: Icon, label, value, detail, tone, tooltipAriaLabel, tooltipText }) => {
  return (
    <article className={`summary-card ${tone}`}>
      <span className="summary-icon" aria-hidden="true">
        <Icon size={22} strokeWidth={2.2} />
      </span>
      <div className="summary-content">
        <p>
          {label}
          <Tooltip ariaLabel={tooltipAriaLabel} text={tooltipText} />
        </p>
        <strong>{value}</strong>
        {detail && <span>{detail}</span>}
      </div>
    </article>
  )
})
SummaryCard.displayName = 'SummaryCard'

// Helper BisectionTable Component
const BisectionTable = React.memo(({ copy, result, formatRupiah, bisectionMin, bisectionMax }) => {
  if (!result.hasValidInterval) {
    return (
      <div className="empty-history">
        <span aria-hidden="true">
          <AlertTriangle size={22} strokeWidth={2.2} />
        </span>
        <div>
          <strong>{copy.invalidTitle}</strong>
          <p>
            {copy.invalidText(
              formatRupiah(result.expense),
              formatRupiah(bisectionMin),
              formatRupiah(bisectionMax),
            )}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="formula-table-wrap">
      <table className="formula-table">
        <thead>
          <tr>
            <th>{copy.iteration}</th>
            <th>a</th>
            <th>b</th>
            <th>c</th>
            <th>f(c)</th>
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row) => (
            <tr key={row.iteration}>
              <td>{row.iteration}</td>
              <td>{formatRupiah(row.a)}</td>
              <td>{formatRupiah(row.b)}</td>
              <td>{formatRupiah(row.c)}</td>
              <td>{formatRupiah(row.fc)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})
BisectionTable.displayName = 'BisectionTable'

// Helper ExpensePieChart Component
const ExpensePieChart = React.memo(({ copy, data, totalExpense, formatRupiah }) => {
  const radius = 78
  const circumference = 2 * Math.PI * radius
  let cumulative = 0

  const activeData = data.filter((item) => item.value > 0)

  return (
    <div className="pie-layout">
      <div className="pie-visual" aria-label={copy.pieAria} role="img">
        <svg viewBox="0 0 220 220">
          <circle className="pie-track" cx="110" cy="110" r={radius} />
          {activeData.length === 0 ? (
            <circle className="pie-empty" cx="110" cy="110" r={radius} />
          ) : (
            activeData.map((item) => {
              const dash = (item.value / totalExpense) * circumference
              const segment = (
                <circle
                  className="pie-segment"
                  cx="110"
                  cy="110"
                  key={item.key}
                  r={radius}
                  stroke={item.color}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-cumulative}
                />
              )
              cumulative += dash
              return segment
            })
          )}
        </svg>
        <div className="pie-center">
          <span>{copy.total}</span>
          <strong>{formatRupiah(totalExpense)}</strong>
        </div>
      </div>

      <div className="legend-list">
        {data.map((item) => {
          const percentage = totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0

          return (
            <div className="legend-item" key={item.key}>
              <span className="legend-color" style={{ backgroundColor: item.color }} />
              <span className="legend-name">{item.label}</span>
              <strong>{percentage}%</strong>
            </div>
          )
        })}
      </div>
    </div>
  )
})
ExpensePieChart.displayName = 'ExpensePieChart'

// Helper ComparisonChart Component
const ComparisonChart = React.memo(({ copy, totalIncome, totalExpense, formatRupiah }) => {
  const maxValue = Math.max(totalIncome, totalExpense, 1)
  const incomeHeight = `${Math.max((totalIncome / maxValue) * 100, totalIncome > 0 ? 8 : 0)}%`
  const expenseHeight = `${Math.max((totalExpense / maxValue) * 100, totalExpense > 0 ? 8 : 0)}%`

  return (
    <div className="bar-chart" aria-label={copy.barAria} role="img">
      <div className="bar-column">
        <div className="bar-track">
          <span className="bar-fill income-bar" style={{ height: incomeHeight }} />
        </div>
        <strong>{formatRupiah(totalIncome)}</strong>
        <span>{copy.income}</span>
      </div>
      <div className="bar-column">
        <div className="bar-track">
          <span className="bar-fill expense-bar" style={{ height: expenseHeight }} />
        </div>
        <strong>{formatRupiah(totalExpense)}</strong>
        <span>{copy.expense}</span>
      </div>
    </div>
  )
})
ComparisonChart.displayName = 'ComparisonChart'

// Helper HistoryCard Component
const HistoryCard = React.memo(({ conditionMode, copy, item, language, onDelete, onLoad, formatRupiah, formatMonthLabel, getConditionLabel }) => {
  const statusLabel = item.statusKey
    ? getConditionLabel(item.statusKey, conditionMode, language)
    : item.status

  return (
    <article className="history-card">
      <div className="history-card-head">
        <div>
          <span>{formatMonthLabel(item.month, language)}</span>
          <strong>{statusLabel}</strong>
        </div>
        <span className={`history-status ${item.tone}`}>
          {formatRupiah(item.adjustedBalance ?? item.balance)}
        </span>
      </div>

      <div className="history-values">
        <span>
          <small>{copy.income}</small>
          <strong>{formatRupiah(item.totalIncome)}</strong>
        </span>
        <span>
          <small>{copy.expense}</small>
          <strong>{formatRupiah(item.adjustedExpense ?? item.totalExpense)}</strong>
        </span>
      </div>

      <div className="history-actions">
        <button className="small-button" onClick={() => onLoad(item)} type="button">
          <Upload size={16} strokeWidth={2.2} />
          {copy.load}
        </button>
        <button className="small-button danger-button" onClick={() => onDelete(item.month)} type="button">
          <Trash2 size={16} strokeWidth={2.2} />
          {copy.delete}
        </button>
      </div>
    </article>
  )
})
HistoryCard.displayName = 'HistoryCard'

// PredictionSection Component
const PredictionSection = React.memo(({
  activeFormulaTab,
  bisectionResult,
  copy,
  isFormulaOpen,
  language,
  nextMonthKey,
  numericalProjection,
  onProjectionMethodChange,
  predictedStatus,
  projectionDataset,
  projectionMethod,
  projectionMethods,
  setActiveFormulaTab,
  setIsFormulaOpen,
  tooltipAriaLabel,
  formatRupiah,
  formatMonthLabel
}) => {
  const isHistoryAvailable = projectionDataset.length >= 2

  return (
    <section className="section-block prediction-section" id="prediksi">
      <div className="section-heading">
        <span className="section-kicker">{copy.kicker}</span>
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
      </div>

      <div className="formula-tabs-bar">
        <button
          type="button"
          className={`small-button ${projectionMethod === 'quick' ? 'primary-button' : ''}`}
          onClick={() => onProjectionMethodChange('quick')}
        >
          {projectionMethods.quick.label}
        </button>
        <button
          type="button"
          className={`small-button ${projectionMethod === 'history' ? 'primary-button' : ''}`}
          onClick={() => {
            if (isHistoryAvailable) {
              onProjectionMethodChange('history')
            }
          }}
          disabled={!isHistoryAvailable}
        >
          {projectionMethods.history.label}
        </button>
      </div>

      <div className="projection-method-notes" aria-label={copy.notesAria}>
        <p>
          <strong>{projectionMethods.quick.noteTitle}:</strong> {projectionMethods.quick.note}
        </p>
        <p>
          <strong>{projectionMethods.history.noteTitle}:</strong> {projectionMethods.history.note}
        </p>
      </div>

      <div className="prediction-cards">
        <div className="prediction-card">
          <span className="prediction-card-icon income" aria-hidden="true">
            <Wallet size={22} strokeWidth={2.2} />
          </span>
          <div className="prediction-card-content">
            <p>
              {copy.income}
              <Tooltip ariaLabel={tooltipAriaLabel} text={copy.incomeTooltip} />
            </p>
            <strong>{formatRupiah(numericalProjection.projectedIncome)}</strong>
            <span>{copy.period}: {formatMonthLabel(nextMonthKey, language)}</span>
          </div>
        </div>

        <div className="prediction-card">
          <span className="prediction-card-icon expense" aria-hidden="true">
            <ReceiptText size={22} strokeWidth={2.2} />
          </span>
          <div className="prediction-card-content">
            <p>
              {copy.expense}
              <Tooltip ariaLabel={tooltipAriaLabel} text={copy.expenseTooltip} />
            </p>
            <strong>{formatRupiah(numericalProjection.projectedExpense)}</strong>
            <span>{numericalProjection.methodLabel}</span>
          </div>
        </div>

        <div className={`prediction-card ${predictedStatus.tone}`}>
          <span className={`prediction-card-icon balance ${predictedStatus.tone}`} aria-hidden="true">
            <CircleDollarSign size={22} strokeWidth={2.2} />
          </span>
          <div className="prediction-card-content">
            <p>
              {copy.balance}
              <Tooltip ariaLabel={tooltipAriaLabel} text={copy.balanceTooltip} />
            </p>
            <strong>{formatRupiah(numericalProjection.projectedBalance)}</strong>
            <span>{copy.comparedToBreakEven(formatRupiah(bisectionResult.expense))}</span>
          </div>
        </div>
      </div>

      <div className={`analysis-panel ${predictedStatus.tone}`}>
        <span className="analysis-icon" aria-hidden="true">
          <Sparkles size={28} strokeWidth={2.2} />
        </span>
        <div>
          <span className="status-label">{predictedStatus.label}</span>
          <h3>{predictedStatus.headline}</h3>
          <p>{predictedStatus.message} {numericalProjection.methodDescription}</p>
        </div>
      </div>

      <div className="formula-disclosure">
        <div
          className="formula-title-bar"
          onClick={() => setIsFormulaOpen(!isFormulaOpen)}
          role="button"
          aria-expanded={isFormulaOpen}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              setIsFormulaOpen(!isFormulaOpen)
            }
          }}
        >
          <h3>
            <Calculator size={20} strokeWidth={2.2} />
            {copy.formulaTitle}
          </h3>
          <span className={`formula-toggle-icon ${isFormulaOpen ? 'open' : ''}`}>
            <ChevronDown size={20} strokeWidth={2.2} />
          </span>
        </div>

        {isFormulaOpen && (
          <div className="formula-content">
            <div className="formula-tabs-bar">
              <button
                type="button"
                className={`small-button ${activeFormulaTab === 'bisection' ? 'primary-button' : ''}`}
                onClick={() => setActiveFormulaTab('bisection')}
              >
                Bisection
              </button>
              <button
                type="button"
                className={`small-button ${activeFormulaTab === 'spl' ? 'primary-button' : ''}`}
                onClick={() => setActiveFormulaTab('spl')}
              >
                SPL
              </button>
            </div>

            {activeFormulaTab === 'bisection' ? (
              <div className="formula-explanation">
                <p>{copy.bisectionIntro}</p>
                <div className="formula-math-display">
                  <span className="math-equation">f(x) = x - E</span>
                  <span className="math-equation">a = 0, b = 5.000.000</span>
                  <span className="math-equation">c = (a + b) / 2</span>
                </div>
                <p>{copy.bisectionClosing}</p>
              </div>
            ) : (
              <div className="formula-explanation">
                <p>{copy.splIntro}</p>
                <div className="formula-math-display">
                  <span className="math-equation">T = M + Tr + I + L</span>
                  <span className="math-equation">x1 = 1, x2 = 1, x3 = 1, x4 = 1</span>
                </div>
                <p>{copy.splClosing}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {!isHistoryAvailable && (
        <div className="empty-history history-note">
          <span aria-hidden="true">
            <AlertTriangle size={22} strokeWidth={2.2} />
          </span>
          <div>
            <strong>{copy.historyUnavailableTitle}</strong>
            <p>{copy.historyUnavailableText}</p>
          </div>
        </div>
      )}
    </section>
  )
})
PredictionSection.displayName = 'PredictionSection'

// NumericalAnalysisSection Component
const NumericalAnalysisSection = React.memo(({
  bisectionResult,
  bisectionSourceLabel,
  bisectionMaxCurrency,
  bisectionMinCurrency,
  conditionMode,
  copy,
  expenseFieldsForDisplay,
  expenseValues,
  language,
  tooltipAriaLabel,
  totalExpense,
  totalIncome,
  formatRupiah,
  getConditionLabel,
  getStatus,
  parseMoney
}) => {
  const breakEvenPoint = bisectionResult.expense
  const balanceToBreakEven = totalIncome - breakEvenPoint
  const breakEvenStatus = getStatus(totalIncome, breakEvenPoint, language)
  const breakEvenLabel = getConditionLabel(breakEvenStatus.key, conditionMode, language)
  const splComponents = expenseFieldsForDisplay.map((field) => ({
    ...field,
    value: parseMoney(expenseValues[field.key]),
  }))

  return (
    <section className="section-block method-section" id="analisis-metode">
      <div className="section-heading">
        <span className="section-kicker">{copy.kicker}</span>
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
      </div>

      <div className="method-grid">
        <article className="method-panel wide-panel">
          <div className="chart-title">
            <Target size={20} strokeWidth={2.2} />
            <h3>{copy.breakEvenTitle}</h3>
          </div>
          <div className="formula-explanation">
            <div className="formula-math-display">
              <span className="math-equation">f(x) = x - E</span>
              <span className="math-equation">a = {formatRupiah(bisectionResult.bisMin ?? bisectionMinCurrency ?? 0)}, b = {formatRupiah(bisectionResult.bisMax ?? bisectionMaxCurrency ?? 5000000)}</span>
              <span className="math-equation">c = (a + b) / 2</span>
            </div>
            <p>{copy.bisectionExplanation(bisectionSourceLabel, formatRupiah(bisectionResult.expense))}</p>
          </div>

          <div className="method-summary-grid">
            <SummaryCard
              detail={copy.breakEvenDetail}
              icon={Target}
              label={copy.breakEven}
              tone={breakEvenStatus.tone}
              value={formatRupiah(breakEvenPoint)}
              tooltipAriaLabel={tooltipAriaLabel}
              tooltipText={copy.breakEvenTooltip}
            />
            <SummaryCard
              detail={copy.conclusionDetail(formatRupiah(balanceToBreakEven))}
              icon={breakEvenStatus.icon}
              label={copy.conclusion}
              tone={breakEvenStatus.tone}
              value={breakEvenLabel}
              tooltipAriaLabel={tooltipAriaLabel}
              tooltipText={copy.conclusionTooltip}
            />
          </div>

          <BisectionTable
            copy={copy.bisectionTable}
            result={bisectionResult}
            formatRupiah={formatRupiah}
            bisectionMin={bisectionMinCurrency}
            bisectionMax={bisectionMaxCurrency}
          />
        </article>

        <article className="method-panel">
          <div className="chart-title">
            <Calculator size={20} strokeWidth={2.2} />
            <h3>{copy.splTitle}</h3>
          </div>
          <div className="formula-explanation">
            <div className="formula-math-display">
              <span className="math-equation">T = M + Tr + I + L</span>
              <span className="math-equation">x1 = 1, x2 = 1, x3 = 1, x4 = 1</span>
            </div>
            <p>{copy.splExplanation}</p>
          </div>

          <div className="spl-list">
            {splComponents.map((item) => (
              <div className="spl-row" key={item.key}>
                <span className="legend-color" style={{ backgroundColor: item.color }} />
                <span>
                  <strong>{item.symbol}</strong>
                  {item.label}
                </span>
                <small>{item.coefficient}</small>
                <strong>{formatRupiah(item.value)}</strong>
              </div>
            ))}
            <div className="spl-row total-row">
              <span />
              <span>
                <strong>T</strong>
                {copy.totalExpense}
              </span>
              <small>{copy.sum}</small>
              <strong>{formatRupiah(totalExpense)}</strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
})
NumericalAnalysisSection.displayName = 'NumericalAnalysisSection'

// AdvancedSection default component
const AdvancedSection = ({
  t,
  language,
  totals,
  currentDisplayExpense,
  biggestExpense,
  isCalculatedDataReady,
  status,
  recommendations,
  formatRupiah,
  formatMonthLabel,
  conditionMode,
  expenseValues,
  translatedExpenseFields,
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
  onProjectionMethodChange,
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
  isMobile,
  getConditionLabel,
  getStatus,
  parseMoney,
  expenseData
}) => {
  return (
    <>
      {/* Prediction Section */}
      {isMobile ? (
        <div className="mobile-accordion-wrapper">
          <div className="mobile-accordion-header">
            <span className="mobile-accordion-label">{t.prediction.kicker}</span>
            <button
              aria-expanded={mobilePredOpen}
              className={`mobile-section-toggle ${mobilePredOpen ? 'is-open' : ''}`}
              onClick={() => setMobilePredOpen((v) => !v)}
              type="button"
            >
              <ChevronDown size={18} strokeWidth={2.2} />
            </button>
          </div>
          <div className={`mobile-collapsible ${!mobilePredOpen ? 'is-collapsed' : ''}`}>
            <PredictionSection
              activeFormulaTab={activeFormulaTab}
              bisectionResult={bisectionResult}
              copy={t.prediction}
              isFormulaOpen={isFormulaOpen}
              language={language}
              nextMonthKey={nextMonthKey}
              numericalProjection={numericalProjection}
              onProjectionMethodChange={onProjectionMethodChange}
              predictedStatus={predictedStatus}
              projectionDataset={projectionDataset}
              projectionMethod={projectionMethod}
              projectionMethods={t.projectionMethods}
              setActiveFormulaTab={setActiveFormulaTab}
              setIsFormulaOpen={setIsFormulaOpen}
              tooltipAriaLabel={t.tooltipHelpLabel}
              formatRupiah={formatRupiah}
              formatMonthLabel={formatMonthLabel}
            />
          </div>
        </div>
      ) : (
        <PredictionSection
          activeFormulaTab={activeFormulaTab}
          bisectionResult={bisectionResult}
          copy={t.prediction}
          isFormulaOpen={isFormulaOpen}
          language={language}
          nextMonthKey={nextMonthKey}
          numericalProjection={numericalProjection}
          onProjectionMethodChange={onProjectionMethodChange}
          predictedStatus={predictedStatus}
          projectionDataset={projectionDataset}
          projectionMethod={projectionMethod}
          projectionMethods={t.projectionMethods}
          setActiveFormulaTab={setActiveFormulaTab}
          setIsFormulaOpen={setIsFormulaOpen}
          tooltipAriaLabel={t.tooltipHelpLabel}
          formatRupiah={formatRupiah}
          formatMonthLabel={formatMonthLabel}
        />
      )}

      {/* Numerical Analysis Section */}
      {isMobile ? (
        <div className="mobile-accordion-wrapper">
          <div className="mobile-accordion-header">
            <span className="mobile-accordion-label">{t.method.kicker}</span>
            <button
              aria-expanded={mobileAnalysisOpen}
              className={`mobile-section-toggle ${mobileAnalysisOpen ? 'is-open' : ''}`}
              onClick={() => setMobileAnalysisOpen((v) => !v)}
              type="button"
            >
              <ChevronDown size={18} strokeWidth={2.2} />
            </button>
          </div>
          <div className={`mobile-collapsible ${!mobileAnalysisOpen ? 'is-collapsed' : ''}`}>
            <NumericalAnalysisSection
              bisectionResult={bisectionResult}
              bisectionSourceLabel={bisectionSourceLabel}
              bisectionMaxCurrency={bisectionMaxCurrency}
              bisectionMinCurrency={bisectionMinCurrency}
              conditionMode={conditionMode}
              copy={{ ...t.method, bisectionTable: t.bisectionTable }}
              expenseFieldsForDisplay={translatedExpenseFields}
              expenseValues={expenseValues}
              language={language}
              tooltipAriaLabel={t.tooltipHelpLabel}
              totalExpense={currentDisplayExpense}
              totalIncome={totals.totalIncome}
              formatRupiah={formatRupiah}
              getConditionLabel={getConditionLabel}
              getStatus={getStatus}
              parseMoney={parseMoney}
            />
          </div>
        </div>
      ) : (
        <NumericalAnalysisSection
          bisectionResult={bisectionResult}
          bisectionSourceLabel={bisectionSourceLabel}
          bisectionMaxCurrency={bisectionMaxCurrency}
          bisectionMinCurrency={bisectionMinCurrency}
          conditionMode={conditionMode}
          copy={{ ...t.method, bisectionTable: t.bisectionTable }}
          expenseFieldsForDisplay={translatedExpenseFields}
          expenseValues={expenseValues}
          language={language}
          tooltipAriaLabel={t.tooltipHelpLabel}
          totalExpense={currentDisplayExpense}
          totalIncome={totals.totalIncome}
          formatRupiah={formatRupiah}
          getConditionLabel={getConditionLabel}
          getStatus={getStatus}
          parseMoney={parseMoney}
        />
      )}

      {/* Charts Section */}
      <section className="section-block charts-section" id="grafik">
        <div className="section-heading">
          <div className="section-heading-text">
            <span className="section-kicker">{t.charts.kicker}</span>
            <h2>{t.charts.title}</h2>
            <p>{t.charts.description}</p>
          </div>
          {isMobile && (
            <button
              aria-expanded={mobileChartOpen}
              className={`mobile-section-toggle ${mobileChartOpen ? 'is-open' : ''}`}
              onClick={() => setMobileChartOpen((v) => !v)}
              type="button"
            >
              <ChevronDown size={18} strokeWidth={2.2} />
            </button>
          )}
        </div>
        <div className={isMobile ? `mobile-collapsible ${!mobileChartOpen ? 'is-collapsed' : ''}` : ''}>
          <div className="chart-grid">
            <article className="chart-panel">
              <div className="chart-title">
                <PieChart size={20} strokeWidth={2.2} />
                <h3>{t.charts.expensePercentage}</h3>
              </div>
              <ExpensePieChart
                copy={t.charts}
                data={expenseData}
                totalExpense={currentDisplayExpense}
                formatRupiah={formatRupiah}
              />
            </article>

            <article className="chart-panel">
              <div className="chart-title">
                <BarChart3 size={20} strokeWidth={2.2} />
                <h3>{t.charts.incomeVsExpense}</h3>
              </div>
              <ComparisonChart
                copy={{ ...t.charts, income: t.fields.income, expense: t.fields.expense }}
                totalExpense={currentDisplayExpense}
                totalIncome={totals.totalIncome}
                formatRupiah={formatRupiah}
              />
            </article>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="section-block history-section" id="riwayat">
        <div className="section-heading">
          <div className="section-heading-text">
            <span className="section-kicker">{t.history.kicker}</span>
            <h2>{t.history.title}</h2>
            <p>{t.history.description}</p>
          </div>
          {isMobile && (
            <button
              aria-expanded={mobileHistoryOpen}
              className={`mobile-section-toggle ${mobileHistoryOpen ? 'is-open' : ''}`}
              onClick={() => setMobileHistoryOpen((v) => !v)}
              type="button"
            >
              <ChevronDown size={18} strokeWidth={2.2} />
            </button>
          )}
        </div>
        <div className={isMobile ? `mobile-collapsible ${!mobileHistoryOpen ? 'is-collapsed' : ''}` : ''}>
          {monthlyHistory.length > 0 ? (
            <div className="history-grid">
              {monthlyHistory.map((item) => (
                <HistoryCard
                  conditionMode={conditionMode}
                  copy={{ ...t.history, ...t.fields }}
                  item={item}
                  key={item.month}
                  language={language}
                  onDelete={handleDeleteHistory}
                  onLoad={handleLoadHistory}
                  formatRupiah={formatRupiah}
                  formatMonthLabel={formatMonthLabel}
                  getConditionLabel={getConditionLabel}
                />
              ))}
            </div>
          ) : (
            <div className="empty-history">
              <span aria-hidden="true">
                <History size={22} strokeWidth={2.2} />
              </span>
              <div>
                <strong>{t.history.emptyTitle}</strong>
                <p>{t.history.emptyText}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Recommendations Section */}
      <section className="section-block recommendation-section" id="rekomendasi">
        <div className="recommendation-copy">
          <div className="section-heading-text">
            <span className="section-kicker">{t.recommendation.kicker}</span>
            <h2>{t.recommendation.title}</h2>
            <p>
              {isCalculatedDataReady && biggestExpense
                ? t.recommendation.biggestExpense(biggestExpense.label, formatRupiah(biggestExpense.value))
                : t.recommendation.empty}
            </p>
          </div>
        </div>

        <div className="recommendation-list">
          {recommendations.map((recommendation) => (
            <div className="recommendation-item" key={recommendation}>
              <span aria-hidden="true">
                {isCalculatedDataReady && status.key === 'deficit' ? (
                  <AlertTriangle size={18} strokeWidth={2.2} />
                ) : (
                  <PiggyBank size={18} strokeWidth={2.2} />
                )}
              </span>
              <p>{recommendation}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

export default AdvancedSection
