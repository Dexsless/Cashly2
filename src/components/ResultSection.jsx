import React from 'react'
import { HelpCircle, ChevronDown, ChevronUp, Edit2 } from 'lucide-react'

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

const ResultSection = ({
  t,
  language,
  selectedMonth,
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
  formatMonthLabel,
  isMobile,
  showAdvanced,
  setShowAdvanced,
  setMobileStep
}) => {
  return (
    <section className="section-block results-section" id="hasil-analisis">
      <div className="section-heading">
        <span className="section-kicker">{t.results.kicker}</span>
        <h2>{t.results.title}</h2>
        <p>
          {hasCalculated
            ? t.results.calculatedDescription
            : t.results.liveDescription}
        </p>
      </div>

      <div className="summary-grid">
        <SummaryCard
          detail={t.results.totalIncomeDetail}
          icon={WalletIconFallback}
          label={t.results.totalIncome}
          tone="income"
          value={formatRupiah(totals.totalIncome)}
          tooltipAriaLabel={t.tooltipHelpLabel}
          tooltipText={t.results.totalIncomeTooltip}
        />
        <SummaryCard
          detail={t.results.totalExpenseDetail}
          icon={ReceiptTextIconFallback}
          label={t.results.totalExpense}
          tone="expense"
          value={formatRupiah(currentDisplayExpense)}
          tooltipAriaLabel={t.tooltipHelpLabel}
          tooltipText={t.results.totalExpenseTooltip}
        />
        <SummaryCard
          detail={t.results.statusDetail(formatMonthLabel(selectedMonth, language), dashboardStatusLabel)}
          icon={BalanceCardIcon}
          label={t.results.finalBalance}
          tone={balanceCardMeta.tone}
          value={formatRupiah(totals.balance)}
          tooltipAriaLabel={t.tooltipHelpLabel}
          tooltipText={t.results.balanceTooltip}
        />
      </div>

      <div className={`analysis-panel ${dashboardStatusTone}`}>
        <span className="analysis-icon" aria-hidden="true">
          <DashboardStatusIcon size={28} strokeWidth={2.2} />
        </span>
        <div>
          <span className="status-label">{dashboardStatusLabel}</span>
          <h3>{dashboardHeadline}</h3>
          <p>{dashboardMessage}</p>
        </div>
      </div>

      {isMobile && (
        <div className="mobile-actions-wrapper" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            className="secondary-link"
            onClick={() => setMobileStep(1)}
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '12px',
              background: '#fff',
              border: '1px solid var(--line)',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: 'var(--blue)',
              cursor: 'pointer',
              minHeight: '48px'
            }}
          >
            <Edit2 size={16} />
            Ubah Input
          </button>

          <button
            className="primary-button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              minHeight: '48px',
              width: '100%'
            }}
          >
            {showAdvanced ? (
              <>
                Sembunyikan Analisis
                <ChevronUp size={18} />
              </>
            ) : (
              <>
                Lihat Analisis
                <ChevronDown size={18} />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  )
}

import { Wallet as WalletIconFallback, ReceiptText as ReceiptTextIconFallback } from 'lucide-react'

export default ResultSection
