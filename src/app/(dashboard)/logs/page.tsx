import { getSales, getPurchases, getOverheads, getExchangeRate } from '@/lib/dal'
import { UnifiedLogs } from '@/components/panels/unified-logs'

export default async function LogsPage() {
  const [sales, purchases, overheads, exchangeRate] = await Promise.all([
    getSales(),
    getPurchases(),
    getOverheads(),
    getExchangeRate(),
  ])

  return (
    <UnifiedLogs
      sales={sales}
      purchases={purchases}
      overheads={overheads}
      exchangeRate={exchangeRate}
    />
  )
}
