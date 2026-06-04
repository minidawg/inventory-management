import { getVendors } from '@/lib/dal'
import { RecordCost } from '@/components/panels/record-cost'

export default async function RecordCostPage() {
  const vendors = await getVendors()
  return <RecordCost vendors={vendors} />
}
