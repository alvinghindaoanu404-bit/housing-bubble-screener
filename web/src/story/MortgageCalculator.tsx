import { useState } from 'react'

// The loan length is fixed, to keep the example simple.
const YEARS = 25

/** Monthly payment of a loan repaid in equal instalments (the annuity formula). */
function monthlyPayment(amount: number, yearlyRatePercent: number) {
  const months = YEARS * 12
  const monthlyRate = yearlyRatePercent / 100 / 12
  if (monthlyRate === 0) return amount / months
  return (amount * monthlyRate) / (1 - (1 + monthlyRate) ** -months)
}

const euros = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

/** The one calculation the dashboard is allowed to do itself (CLAUDE.md rule 4):
 *  an illustration of how the interest rate changes a monthly loan payment. */
export function MortgageCalculator() {
  const [amount, setAmount] = useState(100_000)
  const [rate, setRate] = useState(2)

  const payment = monthlyPayment(amount, rate)
  const paymentOnePointHigher = monthlyPayment(amount, rate + 1)
  const totalInterest = payment * YEARS * 12 - amount

  return (
    <div className="mt-4 rounded-xl border border-border bg-bg p-4">
      <label className="block">
        <span className="flex justify-between text-sm">
          <span className="text-muted">Loan amount</span>
          <span className="font-bold">{euros.format(amount)}</span>
        </span>
        <input
          type="range"
          min={50_000}
          max={300_000}
          step={10_000}
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
          className="mt-1 w-full accent-accent"
        />
      </label>

      <label className="mt-3 block">
        <span className="flex justify-between text-sm">
          <span className="text-muted">Interest rate</span>
          <span className="font-bold">{rate.toFixed(2)}%</span>
        </span>
        <input
          type="range"
          min={0.5}
          max={10}
          step={0.25}
          value={rate}
          onChange={(event) => setRate(Number(event.target.value))}
          className="mt-1 w-full accent-accent"
        />
      </label>

      <div className="mt-4 border-t border-border pt-3">
        <div className="text-sm text-muted">Monthly payment over {YEARS} years</div>
        <div className="text-3xl font-bold text-accent-soft">{euros.format(payment)}</div>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-muted">
          <li>
            One percentage point more would add{' '}
            <span className="text-text">{euros.format(paymentOnePointHigher - payment)}</span>{' '}
            per month.
          </li>
          <li>
            Total interest paid: <span className="text-text">{euros.format(totalInterest)}</span>
          </li>
        </ul>
      </div>

      <p className="mt-3 text-xs text-muted">
        Illustration only, calculated in your browser. Not thesis data.
      </p>
    </div>
  )
}
