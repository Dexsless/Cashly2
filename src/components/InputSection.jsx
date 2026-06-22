import React from 'react'
import {
  CalendarDays,
  Wallet,
  ReceiptText,
} from 'lucide-react'
import CurrencySelector from './CurrencySelector'

const MoneyInput = React.memo(({ error, field, value, onChange, currencySymbol = 'Rp' }) => {
  const Icon = field.icon
  const errorId = `${field.key}-error`

  return (
    <label className="money-field">
      <span className="field-label">
        <span className="field-icon" aria-hidden="true">
          <Icon size={17} strokeWidth={2.2} />
        </span>
        {field.label}
      </span>
      <span className={`input-shell ${error ? 'input-shell-error' : ''}`}>
        <span className="currency-prefix">{currencySymbol}</span>
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          autoComplete="off"
          inputMode="numeric"
          onChange={(event) => onChange(field.key, event.target.value)}
          onKeyDown={(event) => {
            if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
              event.preventDefault()
            }
          }}
          onWheel={(event) => {
            event.currentTarget.blur()
          }}
          pattern="[0-9]*"
          placeholder="0"
          type="text"
          value={value}
        />
      </span>
      {error && (
        <span className="field-error" id={errorId}>
          {error}
        </span>
      )}
    </label>
  )
})
MoneyInput.displayName = 'MoneyInput'

const MonthSelector = React.memo(({ copy, language, selectedMonth, onChange, formatMonthLabel }) => {
  return (
    <div className="month-panel">
      <label className="month-field">
        <span className="field-label">
          <span className="field-icon" aria-hidden="true">
            <CalendarDays size={17} strokeWidth={2.2} />
          </span>
          {copy.label}
        </span>
        <input
          onChange={(event) => onChange(event.target.value)}
          type="month"
          value={selectedMonth}
        />
      </label>
      <div className="selected-month-card">
        <span>{copy.period}</span>
        <strong>{formatMonthLabel(selectedMonth, language)}</strong>
      </div>
    </div>
  )
})
MonthSelector.displayName = 'MonthSelector'

const ConditionModeSelector = React.memo(({ conditionMode, copy, onChange }) => {
  return (
    <div className="mode-panel">
      <div>
        <span className="field-label">{copy.label}</span>
        <p>{copy.description}</p>
      </div>
      <div className="segmented-control" aria-label={copy.ariaLabel}>
        <button
          className={`small-button ${conditionMode === 'formal' ? 'primary-button' : ''}`}
          onClick={() => onChange('formal')}
          type="button"
        >
          {copy.formal}
        </button>
        <button
          className={`small-button ${conditionMode === 'simple' ? 'primary-button' : ''}`}
          onClick={() => onChange('simple')}
          type="button"
        >
          {copy.simple}
        </button>
      </div>
    </div>
  )
})
ConditionModeSelector.displayName = 'ConditionModeSelector'

const InputSection = ({
  t,
  language,
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
  formatMonthLabel,
  isMobile,
  selectedCurrency,
  handleCurrencyChange,
  ratesLive,
  ratesLoading
}) => {
  return (
    <section className="section-block input-section" id="input-data">
      {!isMobile && (
        <>
          <div className="section-heading">
            <span className="section-kicker">{t.inputSection.kicker}</span>
            <h2>{t.inputSection.title}</h2>
            <p>{t.inputSection.description}</p>
          </div>

          <MonthSelector
            copy={t.monthSelector}
            language={language}
            onChange={setSelectedMonth}
            selectedMonth={selectedMonth}
            formatMonthLabel={formatMonthLabel}
          />
          <ConditionModeSelector
            conditionMode={conditionMode}
            copy={t.conditionMode}
            onChange={setConditionMode}
          />
        </>
      )}

      {isMobile && (
        <div className="mobile-currency-container" style={{ marginBottom: '16px', padding: '0 4px' }}>
          <div className="field-label" style={{ marginBottom: '8px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)' }}>
            Mata Uang / Currency
          </div>
          <CurrencySelector
            currency={selectedCurrency}
            onChange={handleCurrencyChange}
            ratesLive={ratesLive}
            ratesLoading={ratesLoading}
          />
        </div>
      )}

      <div className="form-grid">
        <form className="finance-panel" onSubmit={(event) => event.preventDefault()}>
          <div className="panel-title">
            <Wallet size={20} strokeWidth={2.2} />
            <h3>{t.inputSection.incomePanel}</h3>
          </div>
          <div className="field-grid">
            {translatedIncomeFields.map((field) => (
              <MoneyInput
                currencySymbol={currencySymbol}
                error={moneyInputErrors[field.key]}
                field={field}
                key={field.key}
                onChange={handleIncomeChange}
                value={incomeValues[field.key]}
              />
            ))}
          </div>
        </form>

        <form className="finance-panel" onSubmit={(event) => event.preventDefault()}>
          <div className="panel-title">
            <ReceiptText size={20} strokeWidth={2.2} />
            <h3>{t.inputSection.expensePanel}</h3>
          </div>
          <div className="field-grid">
            {translatedExpenseFields.map((field) => (
              <MoneyInput
                currencySymbol={currencySymbol}
                error={moneyInputErrors[field.key]}
                field={field}
                key={field.key}
                onChange={handleExpenseChange}
                value={expenseValues[field.key]}
              />
            ))}
          </div>
        </form>
      </div>
    </section>
  )
}

export default InputSection
