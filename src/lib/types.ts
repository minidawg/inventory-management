// ─── Supabase Database type (mirrors 0001_initial_schema.sql) ────────────────

type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      brands: {
        Row:    { id: string; name: string; tenant_id: string }
        Insert: { id?: string; name: string; tenant_id?: string }
        Update: { id?: string; name?: string; tenant_id?: string }
        Relationships: []
      }
      collections: {
        Row:    { id: string; name: string; brand_id: string; tenant_id: string }
        Insert: { id?: string; name: string; brand_id: string; tenant_id?: string }
        Update: { id?: string; name?: string; brand_id?: string; tenant_id?: string }
        Relationships: [{ foreignKeyName: 'collections_brand_id_fkey'; columns: ['brand_id']; referencedRelation: 'brands'; referencedColumns: ['id'] }]
      }
      articles: {
        Row:    { id: string; name: string; collection_id: string; image_url: string | null; tenant_id: string }
        Insert: { id?: string; name: string; collection_id: string; image_url?: string | null; tenant_id?: string }
        Update: { id?: string; name?: string; collection_id?: string; image_url?: string | null; tenant_id?: string }
        Relationships: [{ foreignKeyName: 'articles_collection_id_fkey'; columns: ['collection_id']; referencedRelation: 'collections'; referencedColumns: ['id'] }]
      }
      skus: {
        Row:    { id: string; article_id: string; size: string; quantity: number; low_stock_buffer: number; avg_cost_pkr: number; avg_exchange_rate: number; tenant_id: string }
        Insert: { id?: string; article_id: string; size: string; quantity?: number; low_stock_buffer?: number; avg_cost_pkr?: number; avg_exchange_rate?: number; tenant_id?: string }
        Update: { id?: string; article_id?: string; size?: string; quantity?: number; low_stock_buffer?: number; avg_cost_pkr?: number; avg_exchange_rate?: number; tenant_id?: string }
        Relationships: [{ foreignKeyName: 'skus_article_id_fkey'; columns: ['article_id']; referencedRelation: 'articles'; referencedColumns: ['id'] }]
      }
      purchases: {
        Row:    { id: string; created_at: string; sku_id: string; quantity: number; cost_pkr: number; commission_pkr: number; shipping_pkr: number; exchange_rate: number; source: string | null; notes: string | null; paid_to_wajid: boolean; tenant_id: string; vendor_id: string | null; amount_paid_at_purchase: number }
        Insert: { id?: string; created_at?: string; sku_id: string; quantity: number; cost_pkr: number; commission_pkr?: number; shipping_pkr?: number; exchange_rate: number; source?: string | null; notes?: string | null; paid_to_wajid?: boolean; tenant_id?: string; vendor_id?: string | null; amount_paid_at_purchase?: number }
        Update: { id?: string; created_at?: string; sku_id?: string; quantity?: number; cost_pkr?: number; commission_pkr?: number; shipping_pkr?: number; exchange_rate?: number; source?: string | null; notes?: string | null; paid_to_wajid?: boolean; tenant_id?: string; vendor_id?: string | null; amount_paid_at_purchase?: number }
        Relationships: [{ foreignKeyName: 'purchases_sku_id_fkey'; columns: ['sku_id']; referencedRelation: 'skus'; referencedColumns: ['id'] }]
      }
      sales: {
        Row:    { id: string; created_at: string; sku_id: string; quantity: number; selling_price: number; cost_pkr_at_sale: number | null; exchange_rate_at_sale: number | null; channel: string | null; client_name: string | null; payment_method: string | null; tenant_id: string }
        Insert: { id?: string; created_at?: string; sku_id: string; quantity: number; selling_price: number; cost_pkr_at_sale?: number | null; exchange_rate_at_sale?: number | null; channel?: string | null; client_name?: string | null; payment_method?: string | null; tenant_id?: string }
        Update: { id?: string; created_at?: string; sku_id?: string; quantity?: number; selling_price?: number; cost_pkr_at_sale?: number | null; exchange_rate_at_sale?: number | null; channel?: string | null; client_name?: string | null; payment_method?: string | null; tenant_id?: string }
        Relationships: [{ foreignKeyName: 'sales_sku_id_fkey'; columns: ['sku_id']; referencedRelation: 'skus'; referencedColumns: ['id'] }]
      }
      settings: {
        Row:    { key: string; value: string; tenant_id: string }
        Insert: { key: string; value: string; tenant_id?: string }
        Update: { key?: string; value?: string; tenant_id?: string }
        Relationships: []
      }
      overheads: {
        Row:    { id: string; created_at: string; category: string; amount: number; expense_date: string; notes: string | null; tenant_id: string; payment_method: string | null; vendor_id: string | null }
        Insert: { id?: string; created_at?: string; category: string; amount: number; expense_date?: string; notes?: string | null; tenant_id?: string; payment_method?: string | null; vendor_id?: string | null }
        Update: { id?: string; created_at?: string; category?: string; amount?: number; expense_date?: string; notes?: string | null; tenant_id?: string; payment_method?: string | null; vendor_id?: string | null }
        Relationships: []
      }
      vendors: {
        Row:    { id: string; name: string; tenant_id: string; created_at: string }
        Insert: { id?: string; name: string; tenant_id?: string; created_at?: string }
        Update: { id?: string; name?: string; tenant_id?: string }
        Relationships: []
      }
      vendor_payments: {
        Row:    { id: string; vendor_id: string; amount: number; payment_date: string; notes: string | null; payment_method: string | null; tenant_id: string; created_at: string }
        Insert: { id?: string; vendor_id: string; amount: number; payment_date: string; notes?: string | null; payment_method?: string | null; tenant_id?: string; created_at?: string }
        Update: { id?: string; vendor_id?: string; amount?: number; payment_date?: string; notes?: string | null; payment_method?: string | null; tenant_id?: string }
        Relationships: [{ foreignKeyName: 'vendor_payments_vendor_id_fkey'; columns: ['vendor_id']; referencedRelation: 'vendors'; referencedColumns: ['id'] }]
      }
      audit_logs: {
        Row:    { id: string; created_at: string; tenant_id: string; user_id: string | null; user_email: string | null; action: string; table_name: string; record_id: string | null; summary: string; metadata: Json | null }
        Insert: { id?: string; created_at?: string; tenant_id?: string; user_id?: string | null; user_email?: string | null; action: string; table_name: string; record_id?: string | null; summary: string; metadata?: Json | null }
        Update: { id?: string; created_at?: string; tenant_id?: string; user_id?: string | null; user_email?: string | null; action?: string; table_name?: string; record_id?: string | null; summary?: string; metadata?: Json | null }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      record_sale_atomic: {
        Args: { p_sku_id: string; p_quantity: number; p_selling_price: number; p_cost_pkr: number; p_exchange_rate: number; p_channel?: string | null; p_client_name?: string | null; p_payment_method?: string | null }
        Returns: { id?: string; remaining?: number; error?: string }
      }
      record_multi_sale: {
        Args: { p_items: Json; p_channel?: string | null; p_client_name?: string | null; p_payment_method?: string | null }
        Returns: { success?: boolean; error?: string }
      }
      delete_sale_atomic: {
        Args: { p_sale_id: string }
        Returns: { success?: boolean; error?: string }
      }
      delete_purchase_atomic: {
        Args: { p_purchase_id: string }
        Returns: { success?: boolean; error?: string }
      }
      stock_in_sku: {
        Args: { p_sku_id: string; p_quantity: number; p_total_cost_per_unit: number; p_exchange_rate: number }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
  '34', '36', '38', '40', '42', '44', '46',
] as const
export type Size = typeof SIZES[number]

export const SOURCES = ['prebook', 'released'] as const
export type Source = typeof SOURCES[number]

export const CHANNELS = ['WhatsApp', 'Instagram', 'Exhibition'] as const
export type Channel = typeof CHANNELS[number]

export const PAYMENT_METHODS = ['Zelle', 'Cash'] as const
export type PaymentMethod = typeof PAYMENT_METHODS[number]

export const OVERHEAD_CATEGORIES = [
  'Exhibition Rent',
  'Logistics / Delivery',
  'Supplies & Packaging',
  'Vendor Payment',
  'Miscellaneous',
] as const
export type OverheadCategory = typeof OVERHEAD_CATEGORIES[number]

export const VENDOR_NAMES = [
  'Naz Fashion Bug',
  'Infinity Jewels',
  'Shi Brand',
  'Seema Anjum',
  'Hiba Saad',
  'Samiyah Salim',
] as const

// ─── View types (returned by DAL, camelCase) ─────────────────────────────────

export interface SkuForStats {
  id: string
  quantity: number
  lowStockBuffer: number
  avgCostPKR: number
}

export interface SaleRow {
  id: string
  createdAt: string
  quantity: number
  /** Selling price in USD — primary currency */
  sellingPrice: number
  /** Cost basis in PKR at time of sale */
  costPKRAtSale: number | null
  /** PKR/USD exchange rate locked at time of sale */
  exchangeRateAtSale: number | null
  channel: string | null
  clientName: string | null
  paymentMethod: string | null
  size: string
  articleId: string
  articleName: string
  brandName: string
}

export interface PurchaseRow {
  id: string
  createdAt: string
  quantity: number
  costPKR: number
  commissionPKR: number
  shippingPKR: number
  exchangeRate: number
  source: string | null
  notes: string | null
  paidToWajid: boolean
  size: string
  articleName: string
  brandName: string
  collectionName: string
  vendorId: string | null
  vendorName: string | null
  amountPaidAtPurchase: number
}

export interface ArticleInventory {
  articleId: string
  articleName: string
  brandId: string
  brandName: string
  collectionId: string
  collectionName: string
  totalQuantity: number
  imageUrl: string | null
  skus: {
    skuId: string
    size: string
    quantity: number
    lowStockBuffer: number
    avgCostPKR: number
    avgExchangeRate: number
    /** false if any purchase for this SKU has paid_to_wajid = false */
    paidToWajid: boolean
  }[]
}

export interface OverheadRow {
  id: string
  createdAt: string
  category: OverheadCategory
  amount: number
  expenseDate: string
  notes: string | null
  paymentMethod: string | null
  vendorId: string | null
  vendorName: string | null
}

export interface VendorRow {
  id: string
  name: string
}

export interface VendorLedgerEntry {
  id: string
  date: string
  type: 'purchase' | 'payment'
  description: string
  totalCost: number
  amountPaid: number
  balance: number
}

export interface VendorSummary {
  id: string
  name: string
  totalOwed: number
  totalPaid: number
  outstanding: number
}

export interface BrandWithCollections {
  id: string
  name: string
  collections: { id: string; name: string }[]
}

export interface AuditLogEntry {
  id: string
  createdAt: string
  userEmail: string | null
  action: string
  tableName: string
  summary: string
}

export interface ChangelogEntry {
  date: string
  author: string
  changes: string[]
}
