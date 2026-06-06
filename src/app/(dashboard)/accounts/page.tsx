import { getVendorSummaries, getVendors, getPurchases } from '@/lib/dal'
import { Accounts } from '@/components/panels/accounts'

export default async function AccountsPage() {
  const [summaries, vendors, purchases] = await Promise.all([
    getVendorSummaries(),
    getVendors(),
    getPurchases(),
  ])

  return <Accounts summaries={summaries} vendors={vendors} purchases={purchases} />
}
