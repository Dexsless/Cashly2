export const BISECTION_MIN = 0
export const BISECTION_MAX = 5000000
export const BISECTION_ITERATIONS = 18

export function isMoneyInputValid(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0
  }
  const rawValue = String(value ?? '').trim()
  return rawValue === '' || /^\d+$/.test(rawValue)
}

export function getMoneyInputErrors(values, fields, message) {
  return fields.reduce((errors, field) => {
    if (isMoneyInputValid(values[field.key])) return errors
    return {
      ...errors,
      [field.key]: message,
    }
  }, {})
}

export function parseMoney(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : 0
  }
  const rawValue = String(value ?? '').trim()
  if (!rawValue) return 0
  if (!isMoneyInputValid(rawValue)) return 0
  const numericValue = Number(rawValue)
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0
}

export function calculateBisection(targetExpense, bisMin = BISECTION_MIN, bisMax = BISECTION_MAX) {
  const expense = Math.max(0, targetExpense)
  if (expense < bisMin || expense > bisMax) {
    return {
      expense,
      bisMin,
      bisMax,
      hasValidInterval: false,
      root: null,
      rows: [],
    }
  }
  if (expense === bisMin || expense === bisMax) {
    return {
      expense,
      bisMin,
      bisMax,
      hasValidInterval: true,
      root: expense,
      rows: [
        {
          iteration: 1,
          a: bisMin,
          b: bisMax,
          c: expense,
          fc: 0,
        },
      ],
    }
  }
  let a = bisMin
  let b = bisMax
  const rows = []
  for (let iteration = 1; iteration <= BISECTION_ITERATIONS; iteration += 1) {
    const c = (a + b) / 2
    const fc = c - expense
    rows.push({
      iteration,
      a,
      b,
      c,
      fc,
    })
    if (Math.abs(fc) <= 1) break
    if (fc < 0) {
      a = c
    } else {
      b = c
    }
  }
  return {
    expense,
    bisMin,
    bisMax,
    hasValidInterval: true,
    root: rows[rows.length - 1]?.c ?? expense,
    rows,
  }
}

export function getAverageProjection(data, key, fallbackValue) {
  const validValues = data
    .map((item) => item[key])
    .filter((value) => Number.isFinite(value) && value > 0)
  if (validValues.length === 0) return fallbackValue
  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length
}

export function buildProjection({ projectionDataset, totals, method, languageCopy }) {
  const projectionCopy = languageCopy.projectionMethods
  if (method === 'history' && projectionDataset.length >= 2) {
    const projectedIncome = getAverageProjection(projectionDataset, 'income', totals.totalIncome)
    const projectedExpense = getAverageProjection(projectionDataset, 'expense', totals.totalExpense)
    return {
      projectedIncome,
      projectedExpense,
      projectedBalance: projectedIncome - projectedExpense,
      methodLabel: projectionCopy.history.label,
      methodDescription: projectionCopy.history.description,
    }
  }
  return {
    projectedIncome: totals.totalIncome,
    projectedExpense: totals.totalExpense,
    projectedBalance: totals.balance,
    methodLabel: projectionCopy.quick.label,
    methodDescription: projectionCopy.quick.description,
  }
}
