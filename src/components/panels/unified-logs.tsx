'use client'

import { useState } from 'react'
import { PurchaseLog } from './purchase-log'
import { SalesLog } from './sales-log'
import { CostLog } from './cost-log'
import type { SaleRow, PurchaseRow, OverheadRow } from '@/lib/types'
import { ClipboardList, DollarSign, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'

type LogTab = 'purchases' | 'sales' | 'expenses'

interface UnifiedLogsProps {
  sales: SaleRow[]
  purchases: PurchaseRow[]
  overheads: OverheadRow[]
  exchangeRate: number
}

const tabs: { id: LogTab; label: string; icon: typeof ClipboardList }[] = [
  { id: 'purchases', label: 'Purchases', icon: ClipboardList },
  { id: 'sales',     label: 'Sales',     icon: DollarSign },
  { id: 'expenses',  label: 'Expenses',  icon: Receipt },
]

export function UnifiedLogs({ sales, purchases, overheads, exchangeRate }: UnifiedLogsProps) {
  const [activeTab, setActiveTab] = useState<LogTab>('purchases')

  return (
    <div className="animate-fade-in">
      {/* Tab bar */}
      <div className="mb-6 flex items-center gap-1 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#141414] p-1 w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span className={cn(
                'ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold tabular',
                isActive ? 'bg-primary/20 text-primary' : 'bg-white/[0.06] text-muted-foreground',
              )}>
                {tab.id === 'purchases' ? purchases.length : tab.id === 'sales' ? sales.length : overheads.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Active log */}
      {activeTab === 'purchases' && <PurchaseLog purchases={purchases} exchangeRate={exchangeRate} />}
      {activeTab === 'sales' && <SalesLog sales={sales} exchangeRate={exchangeRate} />}
      {activeTab === 'expenses' && <CostLog overheads={overheads} />}
    </div>
  )
}
