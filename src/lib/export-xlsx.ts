import * as XLSX from 'xlsx'

interface ExportData {
  articles: any[]
  purchases: any[]
  sales: any[]
  overheads: any[]
  brands: any[]
  vendors: any[]
  vendorPayments: any[]
}

export function generateBackupXlsx(data: ExportData): Blob {
  const wb = XLSX.utils.book_new()

  // ── Inventory sheet ──
  const inventoryRows: any[][] = [['Brand', 'Collection', 'Article', 'Size', 'Qty', 'Avg Cost PKR', 'Avg Cost USD']]
  for (const a of data.articles) {
    const brand = a.collections?.brands?.name ?? ''
    const col = a.collections?.name ?? ''
    for (const s of a.skus ?? []) {
      const rate = Number(s.avg_exchange_rate) || 1
      inventoryRows.push([brand, col, a.name, s.size, s.quantity ?? 0, Number(s.avg_cost_pkr) || 0, (Number(s.avg_cost_pkr) || 0) / rate])
    }
  }
  const wsInventory = XLSX.utils.aoa_to_sheet(inventoryRows)
  XLSX.utils.book_append_sheet(wb, wsInventory, 'Active Inventory')

  // ── All Purchases sheet ──
  const purchaseRows: any[][] = [['Date', 'Brand', 'Collection', 'Article', 'Size', 'Qty', 'Cost PKR', 'Shipping PKR', 'Exchange Rate', 'Source', 'Vendor', 'Amount Paid', 'Notes']]
  for (const p of data.purchases) {
    purchaseRows.push([
      p.created_at?.slice(0, 10) ?? '',
      p.skus?.articles?.collections?.brands?.name ?? '',
      p.skus?.articles?.collections?.name ?? '',
      p.skus?.articles?.name ?? '',
      p.skus?.size ?? '',
      p.quantity,
      Number(p.cost_pkr) || 0,
      Number(p.shipping_pkr) || 0,
      Number(p.exchange_rate) || 0,
      p.source ?? '',
      p.vendors?.name ?? '',
      Number(p.amount_paid_at_purchase) || 0,
      p.notes ?? '',
    ])
  }
  const wsPurchases = XLSX.utils.aoa_to_sheet(purchaseRows)
  XLSX.utils.book_append_sheet(wb, wsPurchases, 'All Purchases')

  // ── All Sales sheet ──
  const saleRows: any[][] = [['Date', 'Brand', 'Article', 'Size', 'Qty', 'Price USD', 'Cost PKR', 'Exchange Rate', 'Channel', 'Client', 'Payment Method']]
  for (const s of data.sales) {
    saleRows.push([
      s.created_at?.slice(0, 10) ?? '',
      s.skus?.articles?.collections?.brands?.name ?? '',
      s.skus?.articles?.name ?? '',
      s.skus?.size ?? '',
      s.quantity,
      Number(s.selling_price) || 0,
      Number(s.cost_pkr_at_sale) || 0,
      Number(s.exchange_rate_at_sale) || 0,
      s.channel ?? '',
      s.client_name ?? '',
      s.payment_method ?? '',
    ])
  }
  const wsSales = XLSX.utils.aoa_to_sheet(saleRows)
  XLSX.utils.book_append_sheet(wb, wsSales, 'All Sales')

  // ── Expenses sheet ──
  const expenseRows: any[][] = [['Date', 'Category', 'Amount USD', 'Payment Method', 'Vendor', 'Notes']]
  for (const o of data.overheads) {
    expenseRows.push([
      o.expense_date ?? '',
      o.category ?? '',
      Number(o.amount) || 0,
      o.payment_method ?? '',
      o.vendors?.name ?? '',
      o.notes ?? '',
    ])
  }
  const wsExpenses = XLSX.utils.aoa_to_sheet(expenseRows)
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses')

  // ── Brands sheet ──
  const brandRows: any[][] = [['Brand', 'Collections']]
  for (const b of data.brands) {
    const cols = (b.collections ?? []).map((c: any) => c.name).join(', ')
    brandRows.push([b.name, cols])
  }
  const wsBrands = XLSX.utils.aoa_to_sheet(brandRows)
  XLSX.utils.book_append_sheet(wb, wsBrands, 'Brands')

  // ── Vendors sheet ──
  const vendorRows: any[][] = [['Vendor']]
  for (const v of data.vendors) {
    vendorRows.push([v.name])
  }
  const wsVendors = XLSX.utils.aoa_to_sheet(vendorRows)
  XLSX.utils.book_append_sheet(wb, wsVendors, 'Vendors')

  // ── Vendor Payments sheet ──
  const vpRows: any[][] = [['Date', 'Vendor', 'Amount USD', 'Payment Method', 'Notes']]
  for (const vp of data.vendorPayments) {
    vpRows.push([
      vp.payment_date ?? '',
      vp.vendors?.name ?? '',
      Number(vp.amount) || 0,
      vp.payment_method ?? '',
      vp.notes ?? '',
    ])
  }
  const wsVP = XLSX.utils.aoa_to_sheet(vpRows)
  XLSX.utils.book_append_sheet(wb, wsVP, 'Vendor Payments')

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
