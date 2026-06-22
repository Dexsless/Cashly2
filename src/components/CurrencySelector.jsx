import React from 'react'
import { CircleDollarSign, RefreshCw } from 'lucide-react'

const CurrencySelector = React.memo(({ currency, onChange, ratesLoading, ratesLive }) => {
  const options = [
    { code: 'IDR', label: 'IDR', symbol: 'Rp.', title: 'Indonesian Rupiah' },
    { code: 'USD', label: 'USD', symbol: '$',  title: 'US Dollar' },
    { code: 'EUR', label: 'EUR', symbol: '€',  title: 'Euro' },
    { code: 'JPY', label: 'JPY', symbol: '¥',  title: 'Japanese Yen' },
  ]
  return (
    <div className="currency-switcher">
      <CircleDollarSign size={16} strokeWidth={2.2} />
      <select
        className="currency-select"
        value={currency}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.code} value={o.code} title={o.title}>
            {o.label}
          </option>
        ))}
      </select>
      {ratesLive && (
        <span className="rates-live" title="Live rates from Open Exchange Rates API">
          LIVE
        </span>
      )}
      {ratesLoading && <RefreshCw size={10} className="spin" />}
    </div>
  )
})

CurrencySelector.displayName = 'CurrencySelector'

export default CurrencySelector
