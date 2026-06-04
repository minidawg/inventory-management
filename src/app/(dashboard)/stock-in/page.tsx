import { getBrands, getExchangeRate, getVendors } from '@/lib/dal'
import { StockIn } from '@/components/panels/stock-in'

export default async function StockInPage() {
  const [brands, exchangeRate, vendors] = await Promise.all([
    getBrands(),
    getExchangeRate(),
    getVendors(),
  ])

  return <StockIn brands={brands} vendors={vendors} exchangeRate={exchangeRate} />
}
