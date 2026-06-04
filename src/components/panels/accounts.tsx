'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addVendor, deleteVendor, recordVendorPayment } from '@/lib/actions'
import { PAYMENT_METHODS } from '@/lib/types'
import type { VendorSummary, VendorRow } from '@/lib/types'
import { formatUSD } from '@/lib/data'
import {
  Landmark, Plus, Trash2, Loader2, ChevronDown, ChevronUp,
  DollarSign, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AccountsProps {
  summaries: VendorSummary[]
  vendors: VendorRow[]
}

const selectClass = 'h-11 w-full rounded-xl border border-white/10 bg-[#111] px-3 text-sm text-foreground focus:border-primary/40 focus:outline-none'

export function Accounts({ summaries, vendors }: AccountsProps) {
  const router = useRouter()

  const [expandedVendor, setExpandedVendor] = useState<string | null>(null)
  const [newVendorName,  setNewVendorName]  = useState('')
  const [isAddingVendor, setIsAddingVendor] = useState(false)
  const [deletingId,     setDeletingId]     = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Payment form state
  const [payAmount,       setPayAmount]       = useState('')
  const [payDate,         setPayDate]         = useState(new Date().toISOString().slice(0, 10))
  const [payMethod,       setPayMethod]       = useState('Cash')
  const [payNotes,        setPayNotes]        = useState('')
  const [isPayingVendor,  setIsPayingVendor]  = useState<string | null>(null)

  const totalOutstanding = summaries.reduce((s, v) => s + Math.max(0, v.outstanding), 0)

  async function handleAddVendor() {
    if (!newVendorName.trim()) return
    setIsAddingVendor(true)
    try {
      const result = await addVendor(newVendorName.trim())
      if (result?.error) toast.error(result.error)
      else { router.refresh(); setNewVendorName('') }
    } catch (err: any) { toast.error(err?.message || 'Failed to add vendor.') }
    finally { setIsAddingVendor(false) }
  }

  async function handleDeleteVendor(vendorId: string) {
    setDeletingId(vendorId)
    try {
      const result = await deleteVendor(vendorId)
      if (result?.error) toast.error(result.error)
      else { router.refresh(); setConfirmDeleteId(null) }
    } catch (err: any) { toast.error(err?.message || 'Failed to delete vendor.') }
    finally { setDeletingId(null) }
  }

  async function handlePayVendor(vendorId: string) {
    if (!payAmount || Number(payAmount) <= 0) return
    setIsPayingVendor(vendorId)
    try {
      const result = await recordVendorPayment(vendorId, Number(payAmount), payDate, payNotes, payMethod)
      if (result?.error) toast.error(result.error)
      else {
        toast.success('Payment recorded.')
        router.refresh()
        setPayAmount(''); setPayNotes('')
        setExpandedVendor(null)
      }
    } catch (err: any) { toast.error(err?.message || 'Failed to record payment.') }
    finally { setIsPayingVendor(null) }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="font-[family-name:var(--font-display)] text-[1.9rem] font-semibold tracking-tight leading-none mb-1">
          Accounts Payable
        </h2>
        <p className="text-sm text-muted-foreground">Track vendor balances and record payments</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#141414] p-5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Total Outstanding</div>
          <div className={cn('text-2xl font-bold num-display', totalOutstanding > 0 ? 'text-amber-400' : 'text-success')}>
            {formatUSD(totalOutstanding)}
          </div>
        </div>
        <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#141414] p-5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Active Vendors</div>
          <div className="text-2xl font-bold num-display">{vendors.length}</div>
        </div>
        <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#141414] p-5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Vendors with Balance</div>
          <div className="text-2xl font-bold num-display text-amber-400">
            {summaries.filter(v => v.outstanding > 0.01).length}
          </div>
        </div>
      </div>

      {/* Vendor list */}
      <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#141414] p-6 mb-5">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Landmark className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold">Vendor Ledger</h3>
        </div>

        {summaries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground/50">No vendors yet. Add one below to get started.</p>
        ) : (
          <div className="space-y-2 mb-5">
            {summaries.map(vendor => {
              const isExpanded = expandedVendor === vendor.id
              const isConfirmingDelete = confirmDeleteId === vendor.id
              const outstanding = Math.max(0, vendor.outstanding)

              return (
                <div key={vendor.id} className={cn(
                  'rounded-xl border overflow-hidden transition-all duration-200',
                  isExpanded ? 'border-primary/20 bg-[#1A1A1A]' : 'border-white/6 bg-[#111]/60 hover:border-white/10',
                )}>
                  {/* Vendor row */}
                  <button
                    onClick={() => { setExpandedVendor(isExpanded ? null : vendor.id); setConfirmDeleteId(null) }}
                    className="flex w-full items-center justify-between px-4 py-4 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {outstanding > 0.01 ? (
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      )}
                      <span className="text-sm font-semibold truncate">{vendor.name}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className={cn('text-sm font-bold tabular', outstanding > 0.01 ? 'text-amber-400' : 'text-success')}>
                          {outstanding > 0.01 ? formatUSD(outstanding) + ' owed' : 'Settled'}
                        </div>
                        <div className="text-[10px] text-muted-foreground tabular">
                          {formatUSD(vendor.totalPaid)} paid of {formatUSD(vendor.totalOwed)}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Expanded: payment form + actions */}
                  {isExpanded && (
                    <div className="border-t border-white/5 px-4 py-5 space-y-4">
                      {outstanding > 0.01 && (
                        <>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Record Payment</div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                                <Input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                                  onWheel={e => e.currentTarget.blur()}
                                  placeholder="Amount" min="0.01" step="0.01"
                                  className="pl-7 h-10 bg-[#111] border-white/10 focus:border-primary/40 tabular" />
                              </div>
                            </div>
                            <div>
                              <Input type="date" value={payDate} onChange={e => setPayDate(e.target.value)}
                                className="h-10 bg-[#111] border-white/10 focus:border-primary/40 tabular" />
                            </div>
                            <div>
                              <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="h-10 w-full rounded-xl border border-white/10 bg-[#111] px-3 text-sm text-foreground focus:border-primary/40 focus:outline-none">
                                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                            </div>
                            <div>
                              <Input value={payNotes} onChange={e => setPayNotes(e.target.value)}
                                placeholder="Notes (optional)"
                                className="h-10 bg-[#111] border-white/10 focus:border-primary/40" />
                            </div>
                          </div>
                          <Button
                            onClick={() => handlePayVendor(vendor.id)}
                            disabled={!payAmount || Number(payAmount) <= 0 || isPayingVendor === vendor.id}
                            size="sm"
                            className="h-9 gap-2 bg-success/10 border border-success/20 text-success hover:bg-success/20"
                          >
                            {isPayingVendor === vendor.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <DollarSign className="h-3.5 w-3.5" />
                            }
                            Record Payment
                          </Button>
                        </>
                      )}

                      {/* Delete vendor */}
                      <div className="pt-3 border-t border-white/5">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-destructive/80">Delete "{vendor.name}"? This clears all payment history.</span>
                            <Button onClick={() => handleDeleteVendor(vendor.id)} disabled={deletingId === vendor.id}
                              size="sm" className="h-7 gap-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs">
                              {deletingId === vendor.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                              Confirm
                            </Button>
                            <Button onClick={() => setConfirmDeleteId(null)} size="sm" variant="outline"
                              className="h-7 border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-xs">Cancel</Button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(vendor.id)}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-destructive transition-colors">
                            <Trash2 className="h-3.5 w-3.5" /> Delete vendor
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Add vendor */}
        <div className="flex items-center gap-3 pt-4 border-t border-white/5">
          <Input
            value={newVendorName}
            onChange={e => setNewVendorName(e.target.value)}
            placeholder="New vendor name…"
            className="h-11 flex-1 bg-[#111] border-white/10 focus:border-primary/40"
            onKeyDown={e => { if (e.key === 'Enter') handleAddVendor() }}
          />
          <Button
            onClick={handleAddVendor}
            disabled={!newVendorName.trim() || isAddingVendor}
            className="h-11 gap-2 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isAddingVendor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Vendor
          </Button>
        </div>
      </div>
    </div>
  )
}
