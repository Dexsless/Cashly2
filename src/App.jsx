import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import {
  BookOpen,
  BriefcaseBusiness,
  Bus,
  Calculator,
  CircleDollarSign,
  ReceiptText,
  RotateCcw,
  Save,
  TrendingDown,
  TrendingUp,
  Utensils,
  Wallet,
} from 'lucide-react'
import './App.css'

import {
  DEFAULT_CURRENCY,
  CURRENCY_SYMBOLS,
  STATIC_EXCHANGE_RATES,
  convertCurrency,
  formatCurrency,
  readSavedCurrency
} from './utils/currency'

import {
  BISECTION_MIN,
  BISECTION_MAX,
  isMoneyInputValid,
  getMoneyInputErrors,
  parseMoney,
  calculateBisection,
  buildProjection
} from './utils/calculations'

import CurrencySelector from './components/CurrencySelector'
import InputSection from './components/InputSection'
import ResultSection from './components/ResultSection'
import DesktopDashboard from './components/DesktopDashboard'

const AdvancedSection = lazy(() => import('./components/AdvancedSection'))

const HISTORY_STORAGE_KEY = 'cashlyMonthlyHistory'
const LANGUAGE_STORAGE_KEY = 'cashlyLanguage'
const CURRENCY_STORAGE_KEY = 'cashlyCurrency'
const DEFAULT_LANGUAGE = 'id'


const incomeFields = [
  {
    key: 'monthlyIncome',
    label: { id: 'Uang Saku Utama', en: 'Main Allowance' },
    shortLabel: { id: 'Uang Saku', en: 'Allowance' },
    icon: Wallet,
  },
  {
    key: 'partTimeIncome',
    label: { id: 'Part Time', en: 'Part-time Income' },
    shortLabel: { id: 'Part Time', en: 'Part-time' },
    icon: BriefcaseBusiness,
  },
  {
    key: 'scholarshipIncome',
    label: { id: 'Beasiswa', en: 'Scholarship' },
    shortLabel: { id: 'Beasiswa', en: 'Scholarship' },
    icon: BookOpen,
  },
  {
    key: 'freelanceIncome',
    label: { id: 'Freelance', en: 'Freelance' },
    shortLabel: { id: 'Freelance', en: 'Freelance' },
    icon: Calculator,
  },
  {
    key: 'additionalIncome',
    label: { id: 'Dana Tambahan Lainnya', en: 'Other Extra Funds' },
    shortLabel: { id: 'Lainnya', en: 'Other' },
    icon: CircleDollarSign,
  },
]

const expenseFields = [
  {
    key: 'food',
    label: { id: 'Makan dan minum', en: 'Food and drinks' },
    shortLabel: { id: 'Makan', en: 'Food' },
    symbol: 'M',
    coefficient: 'x1 = 1',
    icon: Utensils,
    color: '#0f294a',
  },
  {
    key: 'transport',
    label: { id: 'Transportasi', en: 'Transportation' },
    shortLabel: { id: 'Transport', en: 'Transport' },
    symbol: 'Tr',
    coefficient: 'x2 = 1',
    icon: Bus,
    color: '#0f766e',
  },
  {
    key: 'internet',
    label: { id: 'Internet dan pulsa', en: 'Internet and phone credit' },
    shortLabel: { id: 'Internet', en: 'Internet' },
    symbol: 'I',
    coefficient: 'x3 = 1',
    icon: ReceiptText,
    color: '#b89047',
  },
  {
    key: 'otherNeeds',
    label: { id: 'Lain-lain', en: 'Other needs' },
    shortLabel: { id: 'Lain-lain', en: 'Other' },
    symbol: 'L',
    coefficient: 'x4 = 1',
    icon: CircleDollarSign,
    color: '#475569',
  },
]

const conditionModeLabels = {
  id: {
    formal: {
      surplus: 'Surplus',
      deficit: 'Defisit',
      impas: 'Impas',
    },
    simple: {
      surplus: 'Kelebihan',
      deficit: 'Kekurangan',
      impas: 'Seimbang',
    },
  },
  en: {
    formal: {
      surplus: 'Surplus',
      deficit: 'Deficit',
      impas: 'Break-even',
    },
    simple: {
      surplus: 'Extra',
      deficit: 'Shortfall',
      impas: 'Balanced',
    },
  },
}

const appCopy = {
  id: {
    locale: 'id-ID',
    monthFallback: 'Bulan belum dipilih',
    tooltipHelpLabel: 'Bantuan rumus',
    languageSwitcher: {
      ariaLabel: 'Pilih bahasa',
      label: 'Bahasa',
      id: 'ID',
      en: 'EN',
      idTitle: 'Bahasa Indonesia',
      enTitle: 'English',
    },
    fields: {
      income: 'Pemasukan',
      expense: 'Pengeluaran',
    },
    notices: {
      moneyInputError: 'Masukkan nominal dalam bentuk angka.',
      pdfNotReady: 'Isi dan hitung data terlebih dahulu sebelum mencetak atau mengekspor PDF.',
      saveNotReady: 'Isi dan hitung data terlebih dahulu sebelum menyimpan ringkasan.',
      calculationSuccess: 'Analisis keuangan berhasil diperbarui.',
      resetSuccess: 'Data input sudah direset.',
      selectMonth: 'Pilih bulan analisis terlebih dahulu.',
      printReady: 'Laporan siap dicetak. Pilih Save as PDF jika ingin menyimpan dari dialog cetak.',
      popupBlocked: 'Popup cetak diblokir browser. Izinkan popup untuk mencetak laporan.',
      pdfDownloaded: 'Laporan PDF berhasil dibuat dan siap diunduh.',
      historyDeleted: 'Riwayat berhasil dihapus.',
      savedHistory: (period) => `Riwayat ${period} berhasil disimpan.`,
      historyLoaded: (period) => `Data bulan ${period} berhasil dimuat.`,
    },
    defaultRecommendations: [
      'Isi pemasukan dan pengeluaran terlebih dahulu.',
      'Tekan Hitung Keuangan untuk melihat rekomendasi otomatis.',
      'Simpan ringkasan setelah data valid berhasil dihitung.',
    ],
    status: {
      surplus: {
        label: 'Surplus',
        headline: (amount) => `Keuangan bulan ini surplus sebesar ${amount}.`,
        message: 'Total pemasukan melebihi pengeluaran. Pertahankan pola pengeluaran ini dan sisihkan sebagian saldo untuk tabungan.',
        recommendations: (amount) => [
          `Sisihkan sebagian saldo ${amount} ke rekening tabungan terpisah.`,
          'Gunakan surplus untuk membangun dana darurat minimal 3x pengeluaran bulanan.',
          'Pertahankan kontrol pengeluaran non-primer agar surplus terus terjaga.',
        ],
      },
      impas: {
        label: 'Impas',
        headline: 'Keuangan bulan ini tepat impas.',
        message: 'Pemasukan dan pengeluaran seimbang. Coba kurangi sedikit pos non-primer agar mulai ada ruang menabung.',
        recommendations: [
          'Identifikasi pengeluaran non-primer yang bisa dikurangi bulan ini.',
          'Cari sumber pemasukan tambahan seperti part time, beasiswa, atau freelance.',
          'Buat anggaran bulanan agar tidak terus berada di titik impas.',
        ],
      },
      deficit: {
        label: 'Defisit',
        headline: (amount) => `Keuangan bulan ini defisit sebesar ${amount}.`,
        message: 'Pengeluaran melebihi pemasukan. Segera evaluasi pos pengeluaran dan cari cara meningkatkan pemasukan.',
        recommendations: [
          'Pangkas pengeluaran non-primer bulan ini.',
          'Atur ulang biaya makan, transportasi, internet, dan kebutuhan lain dengan batas mingguan.',
          'Manfaatkan beasiswa, part time, freelance, atau pemasukan tambahan lain untuk menutup defisit.',
        ],
      },
    },
    projectedStatus: {
      surplus: {
        label: 'Surplus (Prediksi)',
        headline: (amount) => `Diprediksi surplus sebesar ${amount}.`,
        message: 'Dengan pola data saat ini, bulan depan masih memiliki ruang saldo positif.',
      },
      impas: {
        label: 'Impas (Prediksi)',
        headline: 'Diprediksi impas.',
        message: 'Pemasukan dan pengeluaran bulan depan diperkirakan seimbang.',
      },
      deficit: {
        label: 'Defisit (Prediksi)',
        headline: (amount) => `Diprediksi defisit sebesar ${amount}.`,
        message: 'Bulan depan perlu penyesuaian pengeluaran atau tambahan pemasukan agar tidak melewati titik impas.',
      },
    },
    projectionMethods: {
      quick: {
        label: 'Proyeksi cepat',
        noteTitle: 'Proyeksi Cepat',
        note: 'menggunakan data bulan terakhir sebagai estimasi bulan berikutnya.',
        description: 'Proyeksi Cepat menggunakan data bulan terakhir sebagai estimasi bulan berikutnya.',
      },
      history: {
        label: 'Rata-rata riwayat',
        noteTitle: 'Rata-rata Riwayat',
        note: 'menggunakan rata-rata data riwayat yang tersimpan.',
        description: 'Rata-rata Riwayat menggunakan rata-rata data riwayat yang tersimpan, lalu dibandingkan dengan titik impas Bisection.',
      },
    },
    bisectionSource: {
      calculated: 'total pengeluaran dari input',
      empty: 'data input yang belum dihitung',
    },
    dashboard: {
      notCalculated: 'Belum dihitung',
      headline: 'Data belum dihitung.',
      message: 'Isi nominal lalu tekan Hitung Keuangan untuk melihat status surplus, defisit, atau impas.',
    },
    hero: {
      eyebrow: 'Kalkulator bulanan untuk mahasiswa',
      description: 'Hitung pemasukan dan pengeluaran bulanan, analisis titik impas dengan Metode Bisection, serta modelkan komponen pengeluaran menggunakan Sistem Persamaan Linear.',
      primaryAction: 'Mulai isi data',
      secondaryAction: 'Lihat metode numerik',
      panelAria: 'Ringkasan cepat',
      endBalance: 'Saldo akhir bulan',
      balanceTooltip: 'Pemasukan - Pengeluaran',
      incomeTooltip: 'Uang saku + part time + beasiswa + freelance + lainnya',
      expenseTooltip: 'Makan/minum + transportasi + internet/pulsa + lain-lain',
      month: 'Bulan',
      spendingRatio: 'Rasio pengeluaran',
    },
    inputSection: {
      kicker: 'Input data',
      title: 'Pemasukan dan pengeluaran bulanan',
      description: 'Masukkan nominal dalam Rupiah. Kolom kosong akan otomatis dihitung sebagai 0.',
      incomePanel: 'Pemasukan Bulanan & Tambahan',
      expensePanel: 'Pengeluaran Bulanan',
      calculate: 'Hitung Keuangan',
      reset: 'Reset Data',
      save: 'Simpan Ringkasan',
      print: 'Cetak PDF',
      export: 'Export PDF',
    },
    monthSelector: {
      label: 'Bulan analisis',
      period: 'Periode',
    },
    conditionMode: {
      label: 'Mode kondisi keuangan',
      description: 'Pilih istilah status yang ditampilkan pada dashboard.',
      ariaLabel: 'Mode kondisi keuangan',
      formal: 'Surplus/Defisit',
      simple: 'Kelebihan/Kekurangan',
    },
    results: {
      kicker: 'Hasil analisis',
      title: 'Ringkasan kondisi keuangan',
      calculatedDescription: 'Hasil di bawah mengikuti data terakhir yang kamu masukkan.',
      liveDescription: 'Dashboard ini akan terus menyesuaikan saat kamu mengisi angka.',
      totalIncome: 'Total Pemasukan',
      totalIncomeDetail: 'Total seluruh sumber dana',
      totalIncomeTooltip: 'Rumus: Uang saku + part time + beasiswa + freelance + dana tambahan lainnya',
      totalExpense: 'Total Pengeluaran',
      totalExpenseDetail: 'Total seluruh kebutuhan bulan ini',
      totalExpenseTooltip: 'Rumus SPL: T = M + Tr + I + L',
      finalBalance: 'Saldo Akhir',
      balanceTooltip: 'Rumus: Pemasukan - Pengeluaran',
      statusDetail: (period, status) => `${period} - Status: ${status}`,
    },
    prediction: {
      kicker: 'Proyeksi Finansial',
      title: 'Prediksi Finansial Bulan Depan',
      description: 'Prediksi tetap tersedia dengan proyeksi cepat atau rata-rata riwayat, lalu dibandingkan dengan titik impas dari Metode Bisection.',
      notesAria: 'Keterangan metode prediksi',
      income: 'Prediksi Pemasukan',
      incomeTooltip: 'Pemasukan utama + part time + beasiswa + freelance + dana tambahan lainnya.',
      expense: 'Prediksi Pengeluaran',
      expenseTooltip: 'Makan/minum + transportasi + internet/pulsa + lain-lain.',
      balance: 'Prediksi Saldo Akhir',
      balanceTooltip: 'Prediksi pemasukan - prediksi pengeluaran.',
      period: 'Periode',
      comparedToBreakEven: (amount) => `Dibandingkan titik impas ${amount}`,
      formulaTitle: 'Detail Rumus Bisection & SPL',
      bisectionIntro: 'Metode Bisection mencari akar fungsi dengan membagi interval [a, b] secara berulang. Pada Cashly, fungsi yang digunakan adalah:',
      bisectionClosing: 'Saat f(c) mendekati 0, nilai c menjadi pendekatan titik impas dalam Rupiah.',
      splIntro: 'SPL memodelkan total pengeluaran sebagai penjumlahan setiap komponen utama pengeluaran mahasiswa.',
      splClosing: 'Koefisien bernilai 1 karena setiap komponen dihitung penuh ke dalam total pengeluaran.',
      historyUnavailableTitle: 'Rata-rata riwayat belum tersedia',
      historyUnavailableText: 'Simpan minimal 2 bulan ringkasan untuk memakai proyeksi berbasis rata-rata riwayat. Proyeksi cepat tetap aktif.',
    },
    method: {
      kicker: 'Analisis Metode Numerik',
      title: 'Bisection dan Sistem Persamaan Linear',
      description: 'Bagian ini menyesuaikan analisis Cashly dengan Metode Bisection untuk titik impas dan SPL untuk model komponen pengeluaran.',
      breakEvenTitle: 'Titik Impas Menggunakan Metode Bisection',
      bisectionExplanation: (source, amount) => `E memakai ${source}: ${amount}. Titik impas adalah nominal pemasukan minimal agar pemasukan sama dengan pengeluaran.`,
      breakEven: 'Titik Impas',
      breakEvenDetail: 'Akar f(x) = 0',
      breakEvenTooltip: 'Karena f(x) = x - E, akar berada saat x sama dengan E.',
      conclusion: 'Kesimpulan',
      conclusionDetail: (amount) => `Pemasukan - titik impas = ${amount}`,
      conclusionTooltip: 'Surplus jika pemasukan di atas titik impas, defisit jika di bawah, impas jika sama.',
      splTitle: 'Sistem Persamaan Linear (SPL)',
      splExplanation: 'Total pengeluaran merupakan penjumlahan semua komponen pengeluaran: makan/minum, transportasi, internet/pulsa, dan lain-lain.',
      totalExpense: 'Total Pengeluaran',
      sum: 'Jumlah',
    },
    bisectionTable: {
      invalidTitle: 'Interval tidak memuat akar',
      invalidText: (expense, min, max) => `Nilai E sebesar ${expense} berada di luar interval awal ${min} sampai ${max}.`,
      iteration: 'Iterasi',
    },
    charts: {
      kicker: 'Grafik',
      title: 'Visualisasi pemasukan dan pengeluaran',
      description: 'Gunakan grafik ini untuk melihat kategori paling besar dan perbandingan arus uang.',
      expensePercentage: 'Persentase Pengeluaran Input',
      incomeVsExpense: 'Pemasukan vs Pengeluaran',
      pieAria: 'Grafik pie persentase pengeluaran',
      barAria: 'Grafik bar perbandingan pemasukan dan pengeluaran',
      total: 'Total',
    },
    history: {
      kicker: 'Riwayat',
      title: 'Riwayat keuangan bulanan',
      description: 'Ringkasan tersimpan berdasarkan bulan analisis yang kamu pilih.',
      load: 'Muat Data',
      delete: 'Hapus',
      emptyTitle: 'Belum ada riwayat tersimpan',
      emptyText: 'Simpan ringkasan untuk menambahkan data bulan pertama.',
    },
    recommendation: {
      kicker: 'Rekomendasi',
      title: 'Saran keuangan otomatis',
      biggestExpense: (label, amount) => `Kategori pengeluaran terbesar saat ini adalah ${label.toLowerCase()} sebesar ${amount}.`,
      empty: 'Isi pengeluaranmu untuk melihat kategori yang paling banyak memakan biaya.',
    },
    report: {
      htmlLang: 'id',
      title: 'Laporan Analisis Keuangan Mahasiswa',
      periodAnalysis: 'Periode analisis',
      printed: 'Dicetak',
      totalIncome: 'Total pemasukan',
      totalExpense: 'Total pengeluaran',
      finalBalance: 'Saldo akhir',
      bisectionTitle: 'Hasil Analisis Metode Bisection',
      functionLabel: 'Fungsi',
      initialInterval: 'Interval awal',
      until: 'sampai',
      eUses: 'E memakai',
      amountOf: 'sebesar',
      breakEven: 'Titik impas',
      conclusion: 'Kesimpulan',
      iteration: 'Iterasi',
      splTitle: 'Sistem Persamaan Linear (SPL)',
      splSummary: 'Model: T = M + Tr + I + L. Hasil koefisien: x1 = 1, x2 = 1, x3 = 1, x4 = 1.',
      component: 'Komponen',
      coefficient: 'Koefisien',
      value: 'Nilai',
      sum: 'Jumlah',
      dashboardCharts: 'Grafik Dashboard',
      recommendationsTitle: 'Rekomendasi Keuangan Otomatis',
      pdfIntro: (period, generatedAt) => `Periode analisis: ${period}. Dibuat pada ${generatedAt}.`,
      pdfBisectionSummary: (min, max, source, expense, status) => `Fungsi f(x) = x - E dengan interval awal ${min} sampai ${max}. E memakai ${source} sebesar ${expense}. Titik impas adalah ${expense} dan kesimpulan kondisi adalah ${status}.`,
      pdfSplSummary: 'Model SPL: T = M + Tr + I + L. Hasil koefisien: x1 = 1, x2 = 1, x3 = 1, x4 = 1. Total pengeluaran merupakan penjumlahan seluruh komponen.',
    },
  },
  en: {
    locale: 'en-US',
    monthFallback: 'No month selected',
    tooltipHelpLabel: 'Formula help',
    languageSwitcher: {
      ariaLabel: 'Choose language',
      label: 'Language',
      id: 'ID',
      en: 'EN',
      idTitle: 'Bahasa Indonesia',
      enTitle: 'English',
    },
    fields: {
      income: 'Income',
      expense: 'Expense',
    },
    notices: {
      moneyInputError: 'Enter the amount as numbers only.',
      pdfNotReady: 'Fill in and calculate the data before printing or exporting a PDF.',
      saveNotReady: 'Fill in and calculate the data before saving the summary.',
      calculationSuccess: 'Financial analysis has been updated.',
      resetSuccess: 'Input data has been reset.',
      selectMonth: 'Choose an analysis month first.',
      printReady: 'The report is ready to print. Choose Save as PDF from the print dialog if you want to save it.',
      popupBlocked: 'The print popup was blocked. Allow popups to print the report.',
      pdfDownloaded: 'The PDF report has been created and is ready to download.',
      historyDeleted: 'History has been deleted.',
      savedHistory: (period) => `History for ${period} has been saved.`,
      historyLoaded: (period) => `Data for ${period} has been loaded.`,
    },
    defaultRecommendations: [
      'Fill in income and expenses first.',
      'Press Calculate Finance to see automatic recommendations.',
      'Save the summary after valid data has been calculated.',
    ],
    status: {
      surplus: {
        label: 'Surplus',
        headline: (amount) => `This month has a surplus of ${amount}.`,
        message: 'Total income is higher than expenses. Keep this spending pattern and set aside part of the balance for savings.',
        recommendations: (amount) => [
          `Move part of the ${amount} surplus into a separate savings account.`,
          'Use the surplus to build an emergency fund worth at least 3x monthly expenses.',
          'Keep non-primary spending under control so the surplus stays healthy.',
        ],
      },
      impas: {
        label: 'Break-even',
        headline: 'This month is exactly break-even.',
        message: 'Income and expenses are balanced. Try reducing a few non-primary costs to start creating room for savings.',
        recommendations: [
          'Identify non-primary expenses that can be reduced this month.',
          'Look for extra income such as part-time work, scholarships, or freelance projects.',
          'Create a monthly budget so you do not stay at break-even every month.',
        ],
      },
      deficit: {
        label: 'Deficit',
        headline: (amount) => `This month has a deficit of ${amount}.`,
        message: 'Expenses are higher than income. Review expense categories and look for ways to increase income.',
        recommendations: [
          'Cut non-primary expenses this month.',
          'Reset food, transportation, internet, and other needs with weekly limits.',
          'Use scholarships, part-time work, freelance projects, or other extra income to cover the deficit.',
        ],
      },
    },
    projectedStatus: {
      surplus: {
        label: 'Surplus (Forecast)',
        headline: (amount) => `Forecasted surplus of ${amount}.`,
        message: 'With the current data pattern, next month should still have a positive balance.',
      },
      impas: {
        label: 'Break-even (Forecast)',
        headline: 'Forecasted to break even.',
        message: 'Income and expenses for next month are estimated to be balanced.',
      },
      deficit: {
        label: 'Deficit (Forecast)',
        headline: (amount) => `Forecasted deficit of ${amount}.`,
        message: 'Next month needs expense adjustments or extra income to avoid going below break-even.',
      },
    },
    projectionMethods: {
      quick: {
        label: 'Quick projection',
        noteTitle: 'Quick Projection',
        note: 'uses the latest month data as the estimate for next month.',
        description: 'Quick Projection uses the latest month data as the estimate for next month.',
      },
      history: {
        label: 'History average',
        noteTitle: 'History Average',
        note: 'uses the average of saved history data.',
        description: 'History Average uses the average of saved history data, then compares it with the Bisection break-even point.',
      },
    },
    bisectionSource: {
      calculated: 'total expenses from input',
      empty: 'input data that has not been calculated',
    },
    dashboard: {
      notCalculated: 'Not calculated',
      headline: 'Data has not been calculated.',
      message: 'Enter amounts and press Calculate Finance to see surplus, deficit, or break-even status.',
    },
    hero: {
      eyebrow: 'Monthly calculator for students',
      description: 'Calculate monthly income and expenses, analyze the break-even point with the Bisection Method, and model expense components with a Linear Equation System.',
      primaryAction: 'Start entering data',
      secondaryAction: 'View numerical method',
      panelAria: 'Quick summary',
      endBalance: 'Month-end balance',
      balanceTooltip: 'Income - Expenses',
      incomeTooltip: 'Allowance + part-time + scholarship + freelance + other funds',
      expenseTooltip: 'Food/drinks + transportation + internet/phone credit + other needs',
      month: 'Month',
      spendingRatio: 'Spending ratio',
    },
    inputSection: {
      kicker: 'Input data',
      title: 'Monthly income and expenses',
      description: 'Enter amounts in Rupiah. Empty fields are automatically counted as 0.',
      incomePanel: 'Monthly & Extra Income',
      expensePanel: 'Monthly Expenses',
      calculate: 'Calculate Finance',
      reset: 'Reset Data',
      save: 'Save Summary',
      print: 'Print PDF',
      export: 'Export PDF',
    },
    monthSelector: {
      label: 'Analysis month',
      period: 'Period',
    },
    conditionMode: {
      label: 'Financial condition mode',
      description: 'Choose the status terms shown on the dashboard.',
      ariaLabel: 'Financial condition mode',
      formal: 'Surplus/Deficit',
      simple: 'Extra/Shortfall',
    },
    results: {
      kicker: 'Analysis results',
      title: 'Financial condition summary',
      calculatedDescription: 'The results below follow the latest data you entered.',
      liveDescription: 'This dashboard updates as you enter numbers.',
      totalIncome: 'Total Income',
      totalIncomeDetail: 'Total from all funding sources',
      totalIncomeTooltip: 'Formula: allowance + part-time + scholarship + freelance + other extra funds',
      totalExpense: 'Total Expenses',
      totalExpenseDetail: 'Total needs for this month',
      totalExpenseTooltip: 'LES formula: T = M + Tr + I + L',
      finalBalance: 'Final Balance',
      balanceTooltip: 'Formula: Income - Expenses',
      statusDetail: (period, status) => `${period} - Status: ${status}`,
    },
    prediction: {
      kicker: 'Financial Projection',
      title: 'Next Month Financial Forecast',
      description: 'The forecast is available with quick projection or history average, then compared with the Bisection break-even point.',
      notesAria: 'Prediction method notes',
      income: 'Forecasted Income',
      incomeTooltip: 'Main allowance + part-time + scholarship + freelance + other extra funds.',
      expense: 'Forecasted Expenses',
      expenseTooltip: 'Food/drinks + transportation + internet/phone credit + other needs.',
      balance: 'Forecasted Final Balance',
      balanceTooltip: 'Forecasted income - forecasted expenses.',
      period: 'Period',
      comparedToBreakEven: (amount) => `Compared with break-even ${amount}`,
      formulaTitle: 'Bisection & LES Formula Details',
      bisectionIntro: 'The Bisection Method finds a function root by repeatedly splitting the interval [a, b]. In Cashly, the function is:',
      bisectionClosing: 'When f(c) approaches 0, c becomes the Rupiah approximation of the break-even point.',
      splIntro: 'The Linear Equation System models total expenses as the sum of each main student expense component.',
      splClosing: 'Each coefficient is 1 because every component is counted fully in total expenses.',
      historyUnavailableTitle: 'History average is not available yet',
      historyUnavailableText: 'Save at least 2 monthly summaries to use history-average projection. Quick projection remains active.',
    },
    method: {
      kicker: 'Numerical Method Analysis',
      title: 'Bisection and Linear Equation System',
      description: 'This section adapts Cashly analysis with the Bisection Method for break-even and LES for modeling expense components.',
      breakEvenTitle: 'Break-even Point Using Bisection Method',
      bisectionExplanation: (source, amount) => `E uses ${source}: ${amount}. The break-even point is the minimum income needed so income equals expenses.`,
      breakEven: 'Break-even Point',
      breakEvenDetail: 'Root of f(x) = 0',
      breakEvenTooltip: 'Because f(x) = x - E, the root is where x equals E.',
      conclusion: 'Conclusion',
      conclusionDetail: (amount) => `Income - break-even point = ${amount}`,
      conclusionTooltip: 'Surplus if income is above break-even, deficit if below, break-even if equal.',
      splTitle: 'Linear Equation System (LES)',
      splExplanation: 'Total expenses are the sum of all expense components: food/drinks, transportation, internet/phone credit, and other needs.',
      totalExpense: 'Total Expenses',
      sum: 'Sum',
    },
    bisectionTable: {
      invalidTitle: 'Interval does not contain a root',
      invalidText: (expense, min, max) => `E value of ${expense} is outside the initial interval from ${min} to ${max}.`,
      iteration: 'Iteration',
    },
    charts: {
      kicker: 'Charts',
      title: 'Income and expense visualization',
      description: 'Use these charts to see the largest category and compare cash flow.',
      expensePercentage: 'Input Expense Percentage',
      incomeVsExpense: 'Income vs Expenses',
      pieAria: 'Expense percentage pie chart',
      barAria: 'Income and expenses comparison bar chart',
      total: 'Total',
    },
    history: {
      kicker: 'History',
      title: 'Monthly financial history',
      description: 'Saved summaries based on the analysis month you selected.',
      load: 'Load Data',
      delete: 'Delete',
      emptyTitle: 'No saved history yet',
      emptyText: 'Save a summary to add your first monthly data.',
    },
    recommendation: {
      kicker: 'Recommendations',
      title: 'Automatic financial advice',
      biggestExpense: (label, amount) => `The largest expense category right now is ${label.toLowerCase()} at ${amount}.`,
      empty: 'Fill in your expenses to see the category that costs the most.',
    },
    report: {
      htmlLang: 'en',
      title: 'Student Financial Analysis Report',
      periodAnalysis: 'Analysis period',
      printed: 'Printed',
      totalIncome: 'Total income',
      totalExpense: 'Total expenses',
      finalBalance: 'Final balance',
      bisectionTitle: 'Bisection Method Analysis Result',
      functionLabel: 'Function',
      initialInterval: 'Initial interval',
      until: 'to',
      eUses: 'E uses',
      amountOf: 'amounting to',
      breakEven: 'Break-even point',
      conclusion: 'Conclusion',
      iteration: 'Iteration',
      splTitle: 'Linear Equation System (LES)',
      splSummary: 'Model: T = M + Tr + I + L. Coefficient result: x1 = 1, x2 = 1, x3 = 1, x4 = 1.',
      component: 'Component',
      coefficient: 'Coefficient',
      value: 'Value',
      sum: 'Sum',
      dashboardCharts: 'Dashboard Charts',
      recommendationsTitle: 'Automatic Financial Recommendations',
      pdfIntro: (period, generatedAt) => `Analysis period: ${period}. Created on ${generatedAt}.`,
      pdfBisectionSummary: (min, max, source, expense, status) => `Function f(x) = x - E with initial interval ${min} to ${max}. E uses ${source} of ${expense}. The break-even point is ${expense} and the condition conclusion is ${status}.`,
      pdfSplSummary: 'LES model: T = M + Tr + I + L. Coefficient result: x1 = 1, x2 = 1, x3 = 1, x4 = 1. Total expenses are the sum of all components.',
    },
  },
}

function getSafeLanguage(language) {
  return appCopy[language] ? language : DEFAULT_LANGUAGE
}

function getLanguageCopy(language) {
  return appCopy[getSafeLanguage(language)]
}

function readSavedLanguage() {
  try {
    return getSafeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY))
  } catch {
    return DEFAULT_LANGUAGE
  }
}

function translateField(field, language) {
  const safeLanguage = getSafeLanguage(language)

  return {
    ...field,
    label: field.label?.[safeLanguage] ?? field.label?.[DEFAULT_LANGUAGE] ?? field.key,
    shortLabel: field.shortLabel?.[safeLanguage] ?? field.shortLabel?.[DEFAULT_LANGUAGE] ?? field.key,
  }
}

function translateFields(fields, language) {
  return fields.map((field) => translateField(field, language))
}

function getNextMonthKey(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) return getCurrentMonthKey()

  let nextMonth = month + 1
  let nextYear = year
  if (nextMonth > 12) {
    nextMonth = 1
    nextYear += 1
  }
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`
}

function createEmptyValues(fields) {
  return fields.reduce((values, field) => ({ ...values, [field.key]: '' }), {})
}

function getCurrentMonthKey() {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')

  return `${today.getFullYear()}-${month}`
}

function formatMonthLabel(monthKey, language = DEFAULT_LANGUAGE) {
  const [year, month] = monthKey.split('-').map(Number)

  if (!year || !month) {
    return getLanguageCopy(language).monthFallback
  }

  return new Intl.DateTimeFormat(getLanguageCopy(language).locale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
}

function readMonthlyHistory() {
  try {
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY)
    const parsedHistory = savedHistory ? JSON.parse(savedHistory) : []

    return Array.isArray(parsedHistory) ? parsedHistory : []
  } catch {
    return []
  }
}

function formatRupiah(value, currency = DEFAULT_CURRENCY) {
  return formatCurrency(Number(value), currency)
}



function getConditionLabel(statusKey, conditionMode, language = DEFAULT_LANGUAGE) {
  const labels = conditionModeLabels[getSafeLanguage(language)] ?? conditionModeLabels[DEFAULT_LANGUAGE]

  return labels[conditionMode]?.[statusKey] ?? labels.formal[statusKey]
}

function normalizeLoadedIncomeValues(values = {}) {
  return {
    ...createEmptyValues(incomeFields),
    ...values,
  }
}

function normalizeLoadedExpenseValues(values = {}) {
  const normalizedValues = {
    ...createEmptyValues(expenseFields),
    ...values,
  }

  if (values.entertainment) {
    const oldEntertainmentValue = parseMoney(values.entertainment)
    const currentOtherValue = parseMoney(values.otherNeeds)
    normalizedValues.otherNeeds = String(oldEntertainmentValue + currentOtherValue)
  }

  delete normalizedValues.entertainment
  return normalizedValues
}



function getStatus(totalIncome, totalExpense, language = DEFAULT_LANGUAGE, currency = DEFAULT_CURRENCY) {
  const copy = getLanguageCopy(language).status
  const balance = totalIncome - totalExpense

  if (balance > 0) {
    const formattedBalance = formatRupiah(balance, currency)

    return {
      key: 'surplus',
      label: copy.surplus.label,
      tone: 'positive',
      icon: TrendingUp,
      headline: copy.surplus.headline(formattedBalance),
      message: copy.surplus.message,
      recommendations: copy.surplus.recommendations(formattedBalance),
    }
  }

  if (balance === 0) {
    return {
      key: 'impas',
      label: copy.impas.label,
      tone: 'warning',
      icon: CircleDollarSign,
      headline: copy.impas.headline,
      message: copy.impas.message,
      recommendations: copy.impas.recommendations,
    }
  }

  const formattedDeficit = formatRupiah(Math.abs(balance), currency)

  return {
    key: 'deficit',
    label: copy.deficit.label,
    tone: 'danger',
    icon: TrendingDown,
    headline: copy.deficit.headline(formattedDeficit),
    message: copy.deficit.message,
    recommendations: copy.deficit.recommendations,
  }
}

function getProjectedStatus(balance, language = DEFAULT_LANGUAGE, currency = DEFAULT_CURRENCY) {
  const copy = getLanguageCopy(language).projectedStatus

  if (balance > 0) {
    return {
      key: 'surplus',
      label: copy.surplus.label,
      tone: 'positive',
      headline: copy.surplus.headline(formatRupiah(balance, currency)),
      message: copy.surplus.message,
    }
  }

  if (balance === 0) {
    return {
      key: 'impas',
      label: copy.impas.label,
      tone: 'warning',
      headline: copy.impas.headline,
      message: copy.impas.message,
    }
  }

  return {
    key: 'deficit',
    label: copy.deficit.label,
    tone: 'danger',
    headline: copy.deficit.headline(formatRupiah(Math.abs(balance), currency)),
    message: copy.deficit.message,
  }
}



function getBalanceCardMeta(balance) {
  if (balance > 0) {
    return {
      icon: TrendingUp,
      tone: 'positive',
    }
  }

  if (balance < 0) {
    return {
      icon: TrendingDown,
      tone: 'danger',
    }
  }

  return {
    icon: CircleDollarSign,
    tone: 'neutral',
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatPercent(value, total) {
  if (total <= 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

function createBarChartSvg(
  data,
  { ariaLabel = 'Grafik batang laporan', currency = DEFAULT_CURRENCY, width = 560, height = 260 } = {},
) {
  const maxValue = Math.max(...data.map((item) => item.value), 1)
  const plotHeight = height - 82
  const barWidth = Math.min(70, Math.max(36, (width - 120) / data.length - 18))
  const gap = (width - 80 - barWidth * data.length) / Math.max(data.length - 1, 1)

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(ariaLabel)}">
      <rect x="0" y="0" width="${width}" height="${height}" rx="4" fill="#f8fafc" />
      ${data.map((item, index) => {
        const x = 40 + index * (barWidth + gap)
        const barHeight = Math.max((item.value / maxValue) * plotHeight, item.value > 0 ? 8 : 0)
        const y = 36 + plotHeight - barHeight

        return `
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="2" fill="${item.color}" />
          <text x="${x + barWidth / 2}" y="${height - 38}" text-anchor="middle" font-size="12" font-weight="700" fill="#0f172a">${escapeHtml(item.label)}</text>
          <text x="${x + barWidth / 2}" y="${height - 18}" text-anchor="middle" font-size="11" fill="#475569">${escapeHtml(formatRupiah(item.value, currency))}</text>
        `
      }).join('')}
    </svg>
  `
}

function createDonutChartSvg(
  data,
  total,
  { ariaLabel = 'Grafik donut laporan', currency = DEFAULT_CURRENCY, totalLabel = 'Total', width = 560, height = 260 } = {},
) {
  const radius = 74
  const circumference = 2 * Math.PI * radius
  let cumulative = 0

  const segments = data
    .filter((item) => item.value > 0 && total > 0)
    .map((item) => {
      const dash = (item.value / total) * circumference
      const segment = `
        <circle cx="130" cy="126" r="${radius}" fill="none" stroke="${item.color}" stroke-width="28"
          stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-cumulative}" />
      `
      cumulative += dash
      return segment
    })

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(ariaLabel)}">
      <rect x="0" y="0" width="${width}" height="${height}" rx="4" fill="#f8fafc" />
      <g transform="rotate(-90 130 126)">
        <circle cx="130" cy="126" r="${radius}" fill="none" stroke="#e2e8f0" stroke-width="28" />
        ${segments.join('')}
      </g>
      <text x="130" y="121" text-anchor="middle" font-size="12" fill="#475569">${escapeHtml(totalLabel)}</text>
      <text x="130" y="141" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">${escapeHtml(formatRupiah(total, currency))}</text>
      ${data.map((item, index) => {
        const y = 62 + index * 36
        return `
          <circle cx="285" cy="${y - 4}" r="4" fill="${item.color}" />
          <text x="302" y="${y}" font-size="13" font-weight="700" fill="#0f172a">${escapeHtml(item.label)}</text>
          <text x="302" y="${y + 18}" font-size="11" fill="#475569">${escapeHtml(formatRupiah(item.value, currency))} - ${escapeHtml(formatPercent(item.value, total))}</text>
        `
      }).join('')}
    </svg>
  `
}

function createPrintableReportHtml(report) {
  const languageCopy = getLanguageCopy(report.language)
  const reportCopy = languageCopy.report
  const reportCurrency = report.currency ?? DEFAULT_CURRENCY
  const formatReportCurrency = (value) => formatRupiah(value, reportCurrency)
  const inputExpenseTotal = report.expenseChartData.reduce((sum, item) => sum + item.value, 0)
  const bisectionRows = report.bisectionResult.rows
    .map((row) => `
      <tr>
        <td>${row.iteration}</td>
        <td>${escapeHtml(formatReportCurrency(row.a))}</td>
        <td>${escapeHtml(formatReportCurrency(row.b))}</td>
        <td>${escapeHtml(formatReportCurrency(row.c))}</td>
        <td>${escapeHtml(formatReportCurrency(row.fc))}</td>
      </tr>
    `)
    .join('')

  return `<!doctype html>
    <html lang="${escapeHtml(reportCopy.htmlLang)}">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(reportCopy.title)}</title>
        <style>
          @page { size: A4; margin: 16mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #0f172a; font-family: Inter, Arial, sans-serif; background: #ffffff; }
          .report { display: grid; gap: 18px; }
          .header { display: flex; justify-content: space-between; gap: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 14px; }
          .brand { color: #0f294a; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; letter-spacing: -.02em; text-transform: uppercase; }
          h1 { margin: 4px 0 6px; font-size: 24px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; }
          h2 { margin: 0 0 10px; font-size: 15px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; color: #0f294a; border-bottom: 2px solid #0f294a; width: fit-content; padding-bottom: 2px; }
          h3 { margin: 0 0 8px; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; }
          p { margin: 0; color: #475569; line-height: 1.5; font-size: 12px; }
          .muted { color: #475569; font-size: 11px; }
          .grid-3, .grid-2 { display: grid; gap: 12px; }
          .grid-3 { grid-template-columns: repeat(3, 1fr); }
          .grid-2 { grid-template-columns: repeat(2, 1fr); }
          .card, section { border: 1px solid #e2e8f0; border-radius: 4px; padding: 14px; background: #ffffff; }
          .card span { display: block; color: #475569; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
          .card strong { display: block; margin-top: 5px; font-size: 18px; font-weight: 700; color: #0f172a; }
          .status { color: #0f294a; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
          th { background: #f1f5f9; color: #0f172a; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
          ul { margin: 0; padding-left: 18px; color: #0f172a; font-size: 12px; }
          li { margin: 6px 0; }
          svg { width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 4px; }
          .page-break { break-before: page; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .card, section, svg { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <main class="report">
          <div class="header">
            <div>
              <div class="brand">Cashly</div>
              <h1>${escapeHtml(reportCopy.title)}</h1>
              <p>${escapeHtml(reportCopy.periodAnalysis)}: <strong>${escapeHtml(report.periodLabel)}</strong></p>
            </div>
            <div class="muted">${escapeHtml(reportCopy.printed)}: ${escapeHtml(report.generatedAt)}</div>
          </div>
 
          <div class="grid-3">
            <div class="card"><span>${escapeHtml(reportCopy.totalIncome)}</span><strong>${escapeHtml(formatReportCurrency(report.totalIncome))}</strong></div>
            <div class="card"><span>${escapeHtml(reportCopy.totalExpense)}</span><strong>${escapeHtml(formatReportCurrency(report.totalExpense))}</strong></div>
            <div class="card"><span>${escapeHtml(reportCopy.finalBalance)}</span><strong>${escapeHtml(formatReportCurrency(report.balance))}</strong><p class="status">${escapeHtml(report.statusLabel)}</p></div>
          </div>
 
          <section>
            <h2>${escapeHtml(reportCopy.bisectionTitle)}</h2>
            <p>${escapeHtml(reportCopy.functionLabel)}: <strong>f(x) = x - E</strong>. ${escapeHtml(reportCopy.initialInterval)}: <strong>${escapeHtml(formatReportCurrency(report.bisectionResult.bisMin ?? BISECTION_MIN))}</strong> ${escapeHtml(reportCopy.until)} <strong>${escapeHtml(formatReportCurrency(report.bisectionResult.bisMax ?? BISECTION_MAX))}</strong>.</p>
            <p>${escapeHtml(reportCopy.eUses)} ${escapeHtml(report.bisectionSourceLabel)} ${escapeHtml(reportCopy.amountOf)} <strong>${escapeHtml(formatReportCurrency(report.bisectionResult.expense))}</strong>. ${escapeHtml(reportCopy.breakEven)}: <strong>${escapeHtml(formatReportCurrency(report.bisectionResult.expense))}</strong>. ${escapeHtml(reportCopy.conclusion)}: <strong>${escapeHtml(report.breakEvenStatusLabel)}</strong>.</p>
            <table>
              <thead><tr><th>${escapeHtml(reportCopy.iteration)}</th><th>a</th><th>b</th><th>c</th><th>f(c)</th></tr></thead>
              <tbody>${bisectionRows}</tbody>
            </table>
          </section>
 
          <section>
            <h2>${escapeHtml(reportCopy.splTitle)}</h2>
            <p>${escapeHtml(reportCopy.splSummary)}</p>
            <table>
              <thead><tr><th>${escapeHtml(reportCopy.component)}</th><th>${escapeHtml(reportCopy.coefficient)}</th><th>${escapeHtml(reportCopy.value)}</th></tr></thead>
              <tbody>
                ${report.splComponents.map((item) => `<tr><td>${escapeHtml(item.symbol)} - ${escapeHtml(item.label)}</td><td>${escapeHtml(item.coefficient)}</td><td>${escapeHtml(formatReportCurrency(item.value))}</td></tr>`).join('')}
                <tr><th>${escapeHtml(reportCopy.totalExpense)}</th><th>${escapeHtml(reportCopy.sum)}</th><th>${escapeHtml(formatReportCurrency(report.totalExpense))}</th></tr>
              </tbody>
            </table>
          </section>
 
          <section class="page-break">
            <h2>${escapeHtml(reportCopy.dashboardCharts)}</h2>
            <div class="grid-2">
              <div>
                <h3>${escapeHtml(languageCopy.charts.incomeVsExpense)}</h3>
                ${createBarChartSvg([
                  { label: languageCopy.fields.income, value: report.totalIncome, color: '#0f294a' },
                  { label: languageCopy.fields.expense, value: report.totalExpense, color: '#0f766e' },
                ], { ariaLabel: languageCopy.charts.barAria, currency: reportCurrency })}
              </div>
              <div>
                <h3>${escapeHtml(languageCopy.charts.expensePercentage)}</h3>
                ${createDonutChartSvg(report.expenseChartData, inputExpenseTotal, {
                  ariaLabel: languageCopy.charts.pieAria,
                  currency: reportCurrency,
                  totalLabel: languageCopy.charts.total,
                })}
              </div>
            </div>
          </section>

          <section>
            <h2>${escapeHtml(reportCopy.recommendationsTitle)}</h2>
            <ul>
              ${report.recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          </section>
        </main>
      </body>
    </html>`
}

function escapePdfText(value) {
  return String(value)
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(normalized, 16)

  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ]
}

function createReportPdf(report) {
  const languageCopy = getLanguageCopy(report.language)
  const reportCopy = languageCopy.report
  const reportCurrency = report.currency ?? DEFAULT_CURRENCY
  const formatReportCurrency = (value) => formatRupiah(value, reportCurrency)
  const pageWidth = 595.28
  const pageHeight = 841.89
  const margin = 42
  const contentWidth = pageWidth - margin * 2
  const pages = []
  let commands = []
  let y = margin

  function push(command) {
    commands.push(command)
  }

  function addPage() {
    if (commands.length > 0) {
      pages.push(commands.join('\n'))
    }
    commands = []
    y = margin
  }

  function ensure(height) {
    if (y + height > pageHeight - margin) {
      addPage()
    }
  }

  function setFill(hex) {
    const [r, g, b] = hexToRgb(hex)
    push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`)
  }

  function setStroke(hex) {
    const [r, g, b] = hexToRgb(hex)
    push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`)
  }

  function rect(x, top, width, height, fill, stroke) {
    push('q')
    if (fill) setFill(fill)
    if (stroke) setStroke(stroke)
    push(`${x} ${(pageHeight - top - height).toFixed(2)} ${width} ${height} re ${fill && stroke ? 'B' : fill ? 'f' : 'S'}`)
    push('Q')
  }

  function text(value, x, top, size = 10, font = 'F1', color = '#0f172a') {
    setFill(color)
    push(`BT /${font} ${size} Tf 1 0 0 1 ${x} ${(pageHeight - top).toFixed(2)} Tm (${escapePdfText(value)}) Tj ET`)
  }

  function wrap(value, maxChars) {
    const words = String(value).split(/\s+/)
    const lines = []
    let line = ''

    words.forEach((word) => {
      const nextLine = line ? `${line} ${word}` : word
      if (nextLine.length > maxChars && line) {
        lines.push(line)
        line = word
      } else {
        line = nextLine
      }
    })

    if (line) lines.push(line)
    return lines
  }

  function paragraph(value, x, width, size = 10, lineHeight = 14, color = '#475569') {
    const maxChars = Math.max(22, Math.floor(width / (size * 0.52)))
    const lines = wrap(value, maxChars)
    ensure(lines.length * lineHeight + 4)
    lines.forEach((line) => {
      text(line, x, y, size, 'F1', color)
      y += lineHeight
    })
  }

  function sectionTitle(title) {
    ensure(34)
    text(title, margin, y, 14, 'F2', '#0f172a')
    y += 22
  }

  function summaryCard(x, title, value, detail, color) {
    rect(x, y, 158, 68, '#f8fafc', '#e2e8f0')
    text(title, x + 12, y + 18, 9, 'F2', '#475569')
    text(value, x + 12, y + 40, 14, 'F2', color)
    if (detail) text(detail, x + 12, y + 57, 8, 'F1', '#475569')
  }

  function simpleTable(headers, rows, columnWidths) {
    const rowHeight = 22
    ensure((rows.length + 1) * rowHeight + 10)
    let x = margin
    rect(margin, y - 4, contentWidth, rowHeight, '#f8fafc', '#e2e8f0')
    headers.forEach((header, index) => {
      text(header, x + 6, y + 10, 8, 'F2', '#0f172a')
      x += columnWidths[index]
    })
    y += rowHeight

    rows.forEach((row) => {
      x = margin
      rect(margin, y - 4, contentWidth, rowHeight, '#ffffff', '#e2e8f0')
      row.forEach((cell, index) => {
        text(cell, x + 6, y + 10, 8, 'F1', '#0f172a')
        x += columnWidths[index]
      })
      y += rowHeight
    })
  }

  function drawBarChart(title, data, x, top, width, height) {
    rect(x, top, width, height, '#f8fafc', '#e2e8f0')
    text(title, x + 12, top + 18, 10, 'F2', '#0f172a')
    const maxValue = Math.max(...data.map((item) => item.value), 1)
    const plotTop = top + 38
    const plotHeight = height - 82
    const barWidth = Math.min(44, (width - 56) / data.length - 12)
    const gap = (width - 40 - data.length * barWidth) / Math.max(data.length - 1, 1)

    data.forEach((item, index) => {
      const barHeight = Math.max((item.value / maxValue) * plotHeight, item.value > 0 ? 6 : 0)
      const barX = x + 20 + index * (barWidth + gap)
      const barTop = plotTop + plotHeight - barHeight
      rect(barX, barTop, barWidth, barHeight, item.color, null)
      text(item.label.slice(0, 16), barX - 2, top + height - 34, 7, 'F1', '#475569')
      text(formatReportCurrency(item.value), barX - 2, top + height - 18, 7, 'F2', '#0f172a')
    })
  }

  function drawStackedChart(title, data, total, x, top, width, height) {
    rect(x, top, width, height, '#f8fafc', '#e2e8f0')
    text(title, x + 12, top + 18, 10, 'F2', '#0f172a')
    let offset = 0
    const barY = top + 42
    const barWidth = width - 28

    data.forEach((item) => {
      const segmentWidth = total > 0 ? (item.value / total) * barWidth : 0
      rect(x + 14 + offset, barY, segmentWidth, 18, item.color, null)
      offset += segmentWidth
    })

    data.forEach((item, index) => {
      const lineTop = top + 82 + index * 18
      rect(x + 14, lineTop - 9, 7, 7, item.color, null)
      text(`${item.label} - ${formatReportCurrency(item.value)} (${formatPercent(item.value, total)})`, x + 28, lineTop, 8, 'F1', '#0f172a')
    })
  }

  text('Cashly', margin, y, 11, 'F2', '#0f294a')
  y += 20
  text(reportCopy.title, margin, y, 20, 'F2', '#0f172a')
  y += 18
  paragraph(reportCopy.pdfIntro(report.periodLabel, report.generatedAt), margin, contentWidth, 10)
  y += 10

  summaryCard(margin, reportCopy.totalIncome, formatReportCurrency(report.totalIncome), '', '#0f294a')
  summaryCard(margin + 174, reportCopy.totalExpense, formatReportCurrency(report.totalExpense), '', '#0f766e')
  summaryCard(margin + 348, reportCopy.finalBalance, formatReportCurrency(report.balance), report.statusLabel, report.balance >= 0 ? '#0f766e' : '#991b1b')
  y += 86

  sectionTitle(reportCopy.bisectionTitle)
  paragraph(
    reportCopy.pdfBisectionSummary(
      formatReportCurrency(report.bisectionResult.bisMin ?? BISECTION_MIN),
      formatReportCurrency(report.bisectionResult.bisMax ?? BISECTION_MAX),
      report.bisectionSourceLabel,
      formatReportCurrency(report.bisectionResult.expense),
      report.breakEvenStatusLabel,
    ),
    margin,
    contentWidth,
    9,
  )
  y += 4
  simpleTable(
    [reportCopy.iteration, 'a', 'b', 'c', 'f(c)'],
    report.bisectionResult.rows.slice(0, 10).map((row) => [
      String(row.iteration),
      formatReportCurrency(row.a),
      formatReportCurrency(row.b),
      formatReportCurrency(row.c),
      formatReportCurrency(row.fc),
    ]),
    [54, 110, 110, 110, 110],
  )
  y += 16

  sectionTitle(reportCopy.splTitle)
  paragraph(reportCopy.pdfSplSummary, margin, contentWidth, 9)
  y += 4
  simpleTable(
    [reportCopy.component, reportCopy.coefficient, reportCopy.value],
    [
      ...report.splComponents.map((item) => [
        `${item.symbol} - ${item.label}`,
        item.coefficient,
        formatReportCurrency(item.value),
      ]),
      [`T - ${reportCopy.totalExpense}`, reportCopy.sum, formatReportCurrency(report.totalExpense)],
    ],
    [240, 110, 160],
  )

  addPage()
  sectionTitle(reportCopy.dashboardCharts)
  drawBarChart(
    languageCopy.charts.incomeVsExpense,
    [
      { label: languageCopy.fields.income, value: report.totalIncome, color: '#0f294a' },
      { label: languageCopy.fields.expense, value: report.totalExpense, color: '#0f766e' },
    ],
    margin,
    y,
    248,
    190,
  )
  drawStackedChart(
    languageCopy.charts.expensePercentage,
    report.expenseChartData,
    report.expenseChartData.reduce((sum, item) => sum + item.value, 0),
    margin + 266,
    y,
    248,
    190,
  )
  y += 214

  sectionTitle(reportCopy.recommendationsTitle)
  report.recommendations.forEach((recommendation, index) => {
    paragraph(`${index + 1}. ${recommendation}`, margin, contentWidth, 9)
  })

  addPage()

  const objects = []
  const pageObjectNumbers = []
  objects.push('<< /Type /Catalog /Pages 2 0 R >>')
  objects.push('')
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')

  pages.forEach((pageContent, index) => {
    const contentObjectNumber = objects.length + 1
    const pageObjectNumber = objects.length + 2
    const encodedContent = new TextEncoder().encode(pageContent)

    objects.push(`<< /Length ${encodedContent.length} >>\nstream\n${pageContent}\nendstream`)
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`)
    pageObjectNumbers.push(pageObjectNumber)

    if (index === pages.length - 1) {
      objects[1] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((pageNumber) => `${pageNumber} 0 R`).join(' ')}] /Count ${pageObjectNumbers.length} >>`
    }
  })

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(pdf).length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = new TextEncoder().encode(pdf).length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new TextEncoder().encode(pdf)
}

function downloadPdf(report) {
  const pdfBytes = createReportPdf(report)
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const filePrefix = getSafeLanguage(report.language) === 'en' ? 'cashly-report' : 'laporan-cashly'

  link.href = url
  link.download = `${filePrefix}-${report.monthKey}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function printPdfReport(report) {
  const printWindow = window.open('', '_blank', 'width=920,height=1200')
  if (!printWindow) return false

  printWindow.document.write(createPrintableReportHtml(report))
  printWindow.document.close()
  printWindow.focus()
  window.setTimeout(() => {
    printWindow.print()
  }, 250)

  return true
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return isMobile
}

function MobileInput({
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
  handleCalculateMobile,
  handleResetMobile,
  formatMonthLabel,
  selectedCurrency,
  handleCurrencyChange,
  ratesLive,
  ratesLoading,
  notice
}) {
  return (
    <main className="app-shell">
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
        formatMonthLabel={formatMonthLabel}
        isMobile={true}
        selectedCurrency={selectedCurrency}
        handleCurrencyChange={handleCurrencyChange}
        ratesLive={ratesLive}
        ratesLoading={ratesLoading}
      />
      {notice && (
        <p className={`notice ${notice === t.notices.moneyInputError ? 'notice-error' : ''}`} role="status" style={{ margin: '12px 14px' }}>
          {notice}
        </p>
      )}
      <div className="action-bar" id="action-bar">
        <button className="primary-button" onClick={handleCalculateMobile} type="button" style={{ minHeight: '48px' }}>
          <Calculator size={18} strokeWidth={2.2} />
          <span className="btn-label">{t.inputSection.calculate}</span>
        </button>
        <button className="ghost-button" onClick={handleResetMobile} type="button" style={{ minHeight: '48px' }}>
          <RotateCcw size={18} strokeWidth={2.2} />
        </button>
      </div>
    </main>
  )
}

function MobileResult({
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
  showAdvanced,
  setShowAdvanced,
  setMobileStep,
  handleSave,
  handleResetMobile,
  notice,
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
  conditionMode,
  expenseValues,
  translatedExpenseFields,
  setProjectionMethod,
  selectedCurrency,
  handleCurrencyChange,
  ratesLive,
  ratesLoading
}) {
  return (
    <main className="app-shell">
      {notice && (
        <p className={`notice ${notice === t.notices.moneyInputError ? 'notice-error' : ''}`} role="status" style={{ margin: '12px 14px' }}>
          {notice}
        </p>
      )}
      <div className="mobile-result-toolbar">
        <span className="field-label">Mata Uang / Currency</span>
        <CurrencySelector
          currency={selectedCurrency}
          onChange={handleCurrencyChange}
          ratesLive={ratesLive}
          ratesLoading={ratesLoading}
        />
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
        isMobile={true}
        showAdvanced={showAdvanced}
        setShowAdvanced={setShowAdvanced}
        setMobileStep={setMobileStep}
      />

      <div className="action-bar" id="action-bar">
        <button className="primary-button" onClick={handleSave} type="button" style={{ minHeight: '48px' }}>
          <Save size={18} strokeWidth={2.2} />
          <span className="btn-label">{t.inputSection.save}</span>
        </button>
        <button className="ghost-button" onClick={handleResetMobile} type="button" style={{ minHeight: '48px' }}>
          <RotateCcw size={18} strokeWidth={2.2} />
        </button>
      </div>

      {showAdvanced && (
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
            onProjectionMethodChange={setProjectionMethod}
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
            isMobile={true}
            getConditionLabel={getConditionLabel}
            getStatus={getStatus}
            parseMoney={parseMoney}
            expenseData={expenseData}
          />
        </Suspense>
      )}
    </main>
  )
}

function App() {
  const resultsRef = useRef(null)
  const [language, setLanguage] = useState(() => readSavedLanguage())
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonthKey())
  const [incomeValues, setIncomeValues] = useState(() => createEmptyValues(incomeFields))
  const [expenseValues, setExpenseValues] = useState(() => createEmptyValues(expenseFields))
  const [hasCalculated, setHasCalculated] = useState(false)
  const [notice, setNotice] = useState('')
  const [monthlyHistory, setMonthlyHistory] = useState(() => readMonthlyHistory())
  const [conditionMode, setConditionMode] = useState('formal')
  const [projectionMethod, setProjectionMethod] = useState('quick')
  const [isFormulaOpen, setIsFormulaOpen] = useState(false)
  const [activeFormulaTab, setActiveFormulaTab] = useState('bisection')
  // ── Multi-currency state ───────────────────────────────────────────────────
  const [selectedCurrency, setSelectedCurrency] = useState(() => readSavedCurrency())
  const [exchangeRates, setExchangeRates] = useState(STATIC_EXCHANGE_RATES)
  const [ratesLoading, setRatesLoading] = useState(true)
  const [ratesLive, setRatesLive] = useState(false)
  // ── Mobile collapsible sections ────────────────────────────────────────────
  const [mobileChartOpen, setMobileChartOpen] = useState(true)
  const [mobilePredOpen, setMobilePredOpen] = useState(true)
  const [mobileAnalysisOpen, setMobileAnalysisOpen] = useState(true)
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(true)
  const [mobileRecoOpen, setMobileRecoOpen] = useState(true)

  const isMobile = useIsMobile()
  const [mobileStep, setMobileStep] = useState(1)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const t = getLanguageCopy(language)
  const formatRupiah = useCallback(
    (value) => formatCurrency(Number(value), selectedCurrency),
    [selectedCurrency],
  )
  const translatedIncomeFields = useMemo(() => translateFields(incomeFields, language), [language])
  const translatedExpenseFields = useMemo(() => translateFields(expenseFields, language), [language])

  useEffect(() => {
    document.documentElement.lang = t.report.htmlLang
  }, [t.report.htmlLang])

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    } catch {
      // Language persistence is a nice-to-have; the app still works without storage.
    }
  }, [language])

  // Persist selected currency
  useEffect(() => {
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, selectedCurrency)
    } catch { /* non-critical */ }
  }, [selectedCurrency])

  // Fetch live exchange rates from open.er-api.com (free, no API key required)
  useEffect(() => {
    let isActive = true

    fetch('https://open.er-api.com/v6/latest/IDR')
      .then((res) => res.json())
      .then((data) => {
        if (!isActive) return

        if (data.result === 'success' && data.rates) {
          setExchangeRates({
            IDR: 1,
            USD: data.rates.USD ?? STATIC_EXCHANGE_RATES.USD,
            EUR: data.rates.EUR ?? STATIC_EXCHANGE_RATES.EUR,
            JPY: data.rates.JPY ?? STATIC_EXCHANGE_RATES.JPY,
          })
          setRatesLive(true)
        }
      })
      .catch(() => {
        if (!isActive) return

        // API unavailable – keep static fallback rates silently
        setRatesLive(false)
      })
      .finally(() => {
        if (isActive) {
          setRatesLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  const moneyInputErrors = useMemo(() => ({
    ...getMoneyInputErrors(incomeValues, incomeFields, t.notices.moneyInputError),
    ...getMoneyInputErrors(expenseValues, expenseFields, t.notices.moneyInputError),
  }), [expenseValues, incomeValues, t.notices.moneyInputError])
  const hasInvalidMoneyInput = Object.keys(moneyInputErrors).length > 0

  const totals = useMemo(() => {
    const totalIncome = incomeFields.reduce(
      (sum, field) => sum + parseMoney(incomeValues[field.key]),
      0,
    )
    const totalExpense = expenseFields.reduce(
      (sum, field) => sum + parseMoney(expenseValues[field.key]),
      0,
    )
    const balance = totalIncome - totalExpense

    return {
      totalIncome,
      totalExpense,
      balance,
    }
  }, [expenseValues, incomeValues])

  const getStatusForCurrency = useCallback(
    (totalIncome, totalExpense, statusLanguage = language) =>
      getStatus(totalIncome, totalExpense, statusLanguage, selectedCurrency),
    [language, selectedCurrency],
  )
  const status = getStatusForCurrency(totals.totalIncome, totals.totalExpense, language)
  const displayStatusLabel = getConditionLabel(status.key, conditionMode, language)
  const StatusIcon = status.icon
  const isAnalysisCalculated = hasCalculated && !hasInvalidMoneyInput
  const dashboardStatusLabel = isAnalysisCalculated ? displayStatusLabel : t.dashboard.notCalculated
  const DashboardStatusIcon = isAnalysisCalculated ? StatusIcon : Calculator
  const dashboardStatusTone = isAnalysisCalculated ? status.tone : 'neutral'
  const dashboardHeadline = isAnalysisCalculated ? status.headline : t.dashboard.headline
  const dashboardMessage = isAnalysisCalculated
    ? status.message
    : t.dashboard.message
  const balanceCardMeta = getBalanceCardMeta(totals.balance)
  const BalanceCardIcon = balanceCardMeta.icon

  const expenseData = useMemo(() => {
    return translatedExpenseFields
      .map((field) => ({
        ...field,
        value: parseMoney(expenseValues[field.key]),
      }))
      .sort((first, second) => second.value - first.value)
  }, [expenseValues, translatedExpenseFields])

  const currentDisplayExpense = totals.totalExpense
  const biggestExpense = expenseData.find((item) => item.value > 0)
  const hasAnyFinancialValue = totals.totalIncome > 0 || totals.totalExpense > 0
  const isCalculatedDataReady = hasCalculated && hasAnyFinancialValue && !hasInvalidMoneyInput
  const recommendations = isCalculatedDataReady ? status.recommendations : t.defaultRecommendations
  const spendingRatio =
    totals.totalIncome > 0 ? Math.min((currentDisplayExpense / totals.totalIncome) * 100, 100) : 0

  const projectionDataset = useMemo(() => {
    const combinedDataMap = new Map()

    monthlyHistory.forEach((item) => {
      combinedDataMap.set(item.month, {
        month: item.month,
        income: item.totalIncome,
        expense: item.totalExpense,
        balance: item.balance,
      })
    })

    combinedDataMap.set(selectedMonth, {
      month: selectedMonth,
      income: totals.totalIncome,
      expense: totals.totalExpense,
      balance: totals.balance,
    })

    return Array.from(combinedDataMap.values()).sort((first, second) =>
      first.month.localeCompare(second.month),
    )
  }, [monthlyHistory, selectedMonth, totals])

  const nextMonthKey = useMemo(
    () => getNextMonthKey(selectedMonth || getCurrentMonthKey()),
    [selectedMonth],
  )

  const numericalProjection = useMemo(
    () => buildProjection({ projectionDataset, totals, method: projectionMethod, languageCopy: t }),
    [t, projectionDataset, projectionMethod, totals],
  )

  const predictedStatus = useMemo(
    () => getProjectedStatus(numericalProjection.projectedBalance, language, selectedCurrency),
    [language, numericalProjection, selectedCurrency],
  )

  const bisectionExpense = hasCalculated ? totals.totalExpense : 0
  const bisectionSourceLabel = hasCalculated
    ? t.bisectionSource.calculated
    : t.bisectionSource.empty
  // Scale bisection range for the selected currency
  const bisectionMaxCurrency = useMemo(
    () => Math.round(convertCurrency(BISECTION_MAX, 'IDR', selectedCurrency, exchangeRates)),
    [selectedCurrency, exchangeRates],
  )
  const bisectionMinCurrency = BISECTION_MIN

  const bisectionResult = useMemo(
    () => calculateBisection(bisectionExpense, bisectionMinCurrency, bisectionMaxCurrency),
    [bisectionExpense, bisectionMinCurrency, bisectionMaxCurrency],
  )

  function handleIncomeChange(key, value) {
    setIncomeValues((current) => ({
      ...current,
      [key]: value,
    }))
    setHasCalculated(false)

    if (!isMoneyInputValid(value)) {
      setNotice(t.notices.moneyInputError)
    }
  }

  function handleExpenseChange(key, value) {
    setExpenseValues((current) => ({
      ...current,
      [key]: value,
    }))
    setHasCalculated(false)

    if (!isMoneyInputValid(value)) {
      setNotice(t.notices.moneyInputError)
    }
  }

  // Convert all input values when currency changes, preserving the monetary amount.
  function handleCurrencyChange(newCurrency) {
    if (newCurrency === selectedCurrency) return

    const convertVal = (raw) => {
      const num = parseMoney(raw)
      if (!num) return raw
      const converted = convertCurrency(num, selectedCurrency, newCurrency, exchangeRates)
      return String(Math.round(converted))
    }

    setIncomeValues((prev) =>
      Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, v ? convertVal(v) : v]))
    )
    setExpenseValues((prev) =>
      Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, v ? convertVal(v) : v]))
    )
    setSelectedCurrency(newCurrency)
    setNotice('')
  }

  function stopIfMoneyInputInvalid() {
    if (!hasInvalidMoneyInput) return false

    setNotice(t.notices.moneyInputError)
    return true
  }

  function stopIfSaveNotReady() {
    if (isCalculatedDataReady) return false

    setNotice(t.notices.saveNotReady)
    return true
  }

  function stopIfPdfNotReady() {
    if (isCalculatedDataReady) return false

    setNotice(t.notices.pdfNotReady)
    return true
  }

  function handleCalculate() {
    if (stopIfMoneyInputInvalid()) return

    setHasCalculated(true)
    setNotice(t.notices.calculationSuccess)
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleCalculateMobile() {
    if (stopIfMoneyInputInvalid()) return

    setHasCalculated(true)
    setNotice(t.notices.calculationSuccess)
    setMobileStep(2)
  }

  function handleReset() {
    setIncomeValues(createEmptyValues(incomeFields))
    setExpenseValues(createEmptyValues(expenseFields))
    setHasCalculated(false)
    setProjectionMethod('quick')
    setNotice(t.notices.resetSuccess)
  }

  function handleResetMobile() {
    handleReset()
    setMobileStep(1)
    setShowAdvanced(false)
  }

  function handleSave() {
    if (stopIfMoneyInputInvalid()) return
    if (stopIfSaveNotReady()) return

    if (!selectedMonth) {
      setNotice(t.notices.selectMonth)
      return
    }

    const summary = {
      month: selectedMonth,
      savedAt: new Date().toLocaleString(t.locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      incomeValues: { ...incomeValues },
      expenseValues: { ...expenseValues },
      totalIncome: totals.totalIncome,
      totalExpense: totals.totalExpense,
      balance: totals.balance,
      status: displayStatusLabel,
      statusKey: status.key,
      tone: status.tone,
    }
    const updatedHistory = [summary, ...monthlyHistory.filter((item) => item.month !== selectedMonth)].sort(
      (first, second) => second.month.localeCompare(first.month),
    ).slice(0, 20)

    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory))
    setMonthlyHistory(updatedHistory)
    setHasCalculated(true)
    setNotice(t.notices.savedHistory(formatMonthLabel(selectedMonth, language)))
  }

  function getReportData() {
    const breakEvenStatus = getStatus(totals.totalIncome, bisectionResult.expense, language, selectedCurrency)

    return {
      language,
      currency: selectedCurrency,
      monthKey: selectedMonth || getCurrentMonthKey(),
      periodLabel: formatMonthLabel(selectedMonth, language),
      generatedAt: new Date().toLocaleString(t.locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      totalIncome: totals.totalIncome,
      totalExpense: totals.totalExpense,
      balance: totals.balance,
      statusLabel: displayStatusLabel,
      bisectionResult,
      bisectionSourceLabel,
      breakEvenStatusLabel: getConditionLabel(breakEvenStatus.key, conditionMode, language),
      splComponents: translatedExpenseFields.map((field) => ({
        ...field,
        value: parseMoney(expenseValues[field.key]),
      })),
      expenseChartData: expenseData.map((item) => ({
        key: item.key,
        label: item.shortLabel,
        value: item.value,
        color: item.color,
      })),
      recommendations,
    }
  }

  function handlePrintPdf() {
    if (stopIfMoneyInputInvalid()) return
    if (stopIfPdfNotReady()) return

    const isPrintWindowOpened = printPdfReport(getReportData())

    setNotice(
      isPrintWindowOpened
        ? t.notices.printReady
        : t.notices.popupBlocked,
    )
  }

  function handleExportPdf() {
    if (stopIfMoneyInputInvalid()) return
    if (stopIfPdfNotReady()) return

    downloadPdf(getReportData())
    setNotice(t.notices.pdfDownloaded)
  }

  function handleLoadHistory(item) {
    setSelectedMonth(item.month)
    setIncomeValues(normalizeLoadedIncomeValues(item.incomeValues))
    setExpenseValues(normalizeLoadedExpenseValues(item.expenseValues))
    setHasCalculated(true)
    setNotice(t.notices.historyLoaded(formatMonthLabel(item.month, language)))
    if (isMobile) {
      setMobileStep(2)
    }
  }

  function handleDeleteHistory(month) {
    const updatedHistory = monthlyHistory.filter((item) => item.month !== month)

    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory))
    setMonthlyHistory(updatedHistory)
    setNotice(t.notices.historyDeleted)
  }

  function handleLanguageChange(nextLanguage) {
    setLanguage(getSafeLanguage(nextLanguage))
    setNotice('')
  }

  const currencySymbol = CURRENCY_SYMBOLS[selectedCurrency] ?? 'Rp.'

  if (isMobile) {
    if (mobileStep === 1) {
      return (
        <MobileInput
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
          handleCalculateMobile={handleCalculateMobile}
          handleResetMobile={handleResetMobile}
          formatMonthLabel={formatMonthLabel}
          selectedCurrency={selectedCurrency}
          handleCurrencyChange={handleCurrencyChange}
          ratesLive={ratesLive}
          ratesLoading={ratesLoading}
          notice={notice}
        />
      )
    }

    if (mobileStep === 2) {
      return (
        <MobileResult
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
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          setMobileStep={setMobileStep}
          handleSave={handleSave}
          handleResetMobile={handleResetMobile}
          notice={notice}
          biggestExpense={biggestExpense}
          isCalculatedDataReady={isCalculatedDataReady}
          status={status}
          recommendations={recommendations}
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
          getConditionLabel={getConditionLabel}
          getStatus={getStatusForCurrency}
          parseMoney={parseMoney}
          expenseData={expenseData}
          conditionMode={conditionMode}
          expenseValues={expenseValues}
          translatedExpenseFields={translatedExpenseFields}
          setProjectionMethod={setProjectionMethod}
          selectedCurrency={selectedCurrency}
          handleCurrencyChange={handleCurrencyChange}
          ratesLive={ratesLive}
          ratesLoading={ratesLoading}
        />
      )
    }
  }

  return (
    <DesktopDashboard
      t={t}
      language={language}
      handleLanguageChange={handleLanguageChange}
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
      selectedCurrency={selectedCurrency}
      handleCurrencyChange={handleCurrencyChange}
      ratesLive={ratesLive}
      ratesLoading={ratesLoading}
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
      showAdvanced={showAdvanced}
      setShowAdvanced={setShowAdvanced}
      setMobileStep={setMobileStep}
      biggestExpense={biggestExpense}
      isCalculatedDataReady={isCalculatedDataReady}
      status={status}
      recommendations={recommendations}
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
      predictedStatus={predictedStatus}
      projectionDataset={projectionDataset}
      projectionMethod={projectionMethod}
      setProjectionMethod={setProjectionMethod}
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
      getConditionLabel={getConditionLabel}
      getStatus={getStatusForCurrency}
      parseMoney={parseMoney}
      expenseData={expenseData}
      spendingRatio={spendingRatio}
      notice={notice}
    />
  )
}

export default App
