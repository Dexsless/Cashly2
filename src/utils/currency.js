export const DEFAULT_CURRENCY = 'IDR'

export const CURRENCY_SYMBOLS = { IDR: 'Rp', USD: '$', EUR: '€', JPY: '¥' }
export const CURRENCY_LANGUAGE_SYMBOLS = {
  id: { IDR: 'Rp' },
  en: { IDR: 'IDR' },
}

export const STATIC_EXCHANGE_RATES = {
  IDR: 1,
  USD: 1 / 15500,   // 1 USD = 15,500 IDR
  EUR: 1 / 17000,   // 1 EUR = 17,000 IDR
  JPY: 1 / 105,     // 1 JPY = 105 IDR
}

export function convertCurrency(value, from, to, rates = STATIC_EXCHANGE_RATES) {
  if (from === to) return value
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  const valueInIDR = from === 'IDR' ? num : num / (rates[from] ?? STATIC_EXCHANGE_RATES[from] ?? 1)
  const result = to === 'IDR' ? valueInIDR : valueInIDR * (rates[to] ?? STATIC_EXCHANGE_RATES[to] ?? 1)
  return result
}

export function getCurrencySymbol(currency = 'IDR', language = 'id') {
  return CURRENCY_LANGUAGE_SYMBOLS[language]?.[currency] ?? CURRENCY_SYMBOLS[currency] ?? currency
}

export function formatCurrency(value, currency = 'IDR', language = 'id') {
  const num = Number(value)
  const safe = Number.isFinite(num) ? num : 0
  const fraction = currency === 'JPY' || currency === 'IDR' ? 0 : 2
  if (currency === 'IDR') {
    const formattedAmount = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(safe))

    return `${safe < 0 ? '-' : ''}${getCurrencySymbol(currency, language)}${formattedAmount}`
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  }).format(safe)
}

export function readSavedCurrency() {
  try {
    const saved = localStorage.getItem('cashlyCurrency')
    return Object.prototype.hasOwnProperty.call(STATIC_EXCHANGE_RATES, saved) ? saved : DEFAULT_CURRENCY
  } catch {
    return DEFAULT_CURRENCY
  }
}
