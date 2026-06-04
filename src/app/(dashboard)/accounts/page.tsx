import { getVendorSummaries, getVendors } from '@/lib/dal'
import { Accounts } from '@/components/panels/accounts'

export default async function AccountsPage() {
  const [summaries, vendors] = await Promise.all([
    getVendorSummaries(),
    getVendors(),
  ])

  return <Accounts summaries={summaries} vendors={vendors} />
}
