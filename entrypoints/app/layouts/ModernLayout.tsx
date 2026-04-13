import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { LayoutProps } from './types';
import { COUNTRIES, CURRENCIES } from '@/lib/uncefact/constants';

export function ModernLayout({ invoice, layout, isEditing, handlers }: LayoutProps) {
  const { handlePartyChange, handleAddressChange, handleLineChange, handleLookup, lookupParty, isLookingUp, addLineItem, removeLineItem, setInvoice } = handlers;

  return (
    <div className="font-sans min-h-[800px] flex flex-col" style={{ fontFamily: layout.font.body }}>
      {/* Modern Header - Full Width Color */}
      <div className="p-8 text-white rounded-t-xl" style={{ backgroundColor: layout.colors.primary }}>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">{layout.labels.invoiceTitle || 'INVOICE'}</h1>
            <div className="flex items-center gap-2 opacity-90">
              <span className="text-sm uppercase font-semibold">#{invoice.id}</span>
              {isEditing && <Input value={invoice.id} onChange={e => setInvoice(prev => ({...prev, id: e.target.value}))} className="h-6 w-32 bg-white/20 border-none text-white placeholder:text-white/50" />}
            </div>
          </div>
          <div className="text-right space-y-1">
             <div className="text-sm opacity-80 uppercase">{layout.labels.date || 'Date'}</div>
             {isEditing ? (
                <Input 
                  type="date" 
                  value={invoice.issueDate.toISOString().split('T')[0]} 
                  onChange={e => {
                    const d = new Date(e.target.value);
                    if(!isNaN(d.getTime())) setInvoice(prev => ({...prev, issueDate: d}));
                  }} 
                  className="h-8 bg-white/20 border-none text-white w-auto inline-block" 
                />
              ) : <div className="font-medium text-lg">{invoice.issueDate.toLocaleDateString()}</div>}
          </div>
        </div>

        {/* Seller Info in Header */}
        <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-2 gap-8">
           <div>
              <div className="text-xs uppercase opacity-70 mb-1">From</div>
              {isEditing ? (
                  <div className="space-y-2">
                     <div className="flex gap-2 items-end">
                       <Input 
                         value={invoice.seller.id || ''} 
                         onChange={e => handlePartyChange('seller', 'id', e.target.value)} 
                         className="bg-white/10 border-none text-white placeholder:text-white/50 h-8 flex-1" 
                         placeholder="Company ID" 
                       />
                       <div className="flex items-center gap-1 mb-1">
                         <input 
                           type="checkbox" 
                           id="seller-lookup-modern" 
                           className="w-3 h-3 rounded bg-white/10 border-none"
                           onChange={(e) => {
                             if (e.target.checked) {
                               handleLookup('seller');
                               e.target.checked = false;
                             }
                           }}
                           disabled={isLookingUp}
                         />
                         <label htmlFor="seller-lookup-modern" className="text-[10px] uppercase opacity-70 cursor-pointer flex items-center gap-1">
                           {isLookingUp && lookupParty === 'seller' ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : null}
                           Lookup
                         </label>
                       </div>
                     </div>
                     <Input value={invoice.seller.name} onChange={e => handlePartyChange('seller', 'name', e.target.value)} className="bg-white/10 border-none text-white placeholder:text-white/50 h-8" placeholder="Seller Name" />
                     <div className="grid grid-cols-2 gap-2">
                        <Input value={invoice.seller.address?.street || ''} onChange={e => handleAddressChange('seller', 'street', e.target.value)} className="bg-white/10 border-none text-white h-8" placeholder="Street" />
                        <Input value={invoice.seller.address?.city || ''} onChange={e => handleAddressChange('seller', 'city', e.target.value)} className="bg-white/10 border-none text-white h-8" placeholder="City" />
                     </div>
                  </div>
              ) : (
                 <div>
                    <div className="font-bold text-lg">{invoice.seller.name}</div>
                    <div className="opacity-90">{invoice.seller.address?.street}, {invoice.seller.address?.city}</div>
                    <div className="opacity-90">{invoice.seller.address?.postcode} {invoice.seller.address?.countryCode}</div>
                 </div>
              )}
           </div>
           <div className="text-right">
              <div className="text-xs uppercase opacity-70 mb-1">Currency</div>
              {isEditing ? (
                 <div className="flex justify-end">
                    <Select value={invoice.currency} onValueChange={(value) => setInvoice(prev => ({...prev, currency: value}))}>
                      <SelectTrigger className="w-32 bg-white/10 border-none text-white h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}
                      </SelectContent>
                    </Select>
                 </div>
              ) : <div className="font-bold text-xl">{invoice.currency}</div>}
           </div>
        </div>
      </div>

      <div className="p-8 flex-1 bg-white rounded-b-xl border-x border-b border-gray-100 shadow-sm">
        {/* Buyer Section */}
        <div className="mb-12">
           <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{layout.labels.billTo || 'Bill To'}</div>
           <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              {isEditing ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <div className="flex gap-2 items-end">
                           <div className="flex-1">
                              <Label>Company ID</Label>
                              <Input 
                                 value={invoice.buyer.id || ''} 
                                 onChange={e => handlePartyChange('buyer', 'id', e.target.value)} 
                                 placeholder="gb/15863314"
                              />
                           </div>
                           <div className="flex items-center space-x-2 pb-2">
                              <input 
                                 type="checkbox" 
                                 id="buyer-lookup-modern" 
                                 className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                 onChange={(e) => {
                                    if (e.target.checked) {
                                       handleLookup('buyer');
                                       e.target.checked = false;
                                    }
                                 }}
                                 disabled={isLookingUp}
                              />
                              <Label htmlFor="buyer-lookup-modern" className="text-xs flex items-center gap-1 cursor-pointer">
                                 {isLookingUp && lookupParty === 'buyer' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />} Lookup
                              </Label>
                           </div>
                        </div>
                        <Label>Company Name</Label>
                        <Input value={invoice.buyer.name} onChange={e => handlePartyChange('buyer', 'name', e.target.value)} />
                        <Label>Tax ID</Label>
                        <Input value={invoice.buyer.taxId || ''} onChange={e => handlePartyChange('buyer', 'taxId', e.target.value)} />
                     </div>
                    <div className="space-y-2">
                       <Label>Address</Label>
                       <Input value={invoice.buyer.address?.street || ''} onChange={e => handleAddressChange('buyer', 'street', e.target.value)} placeholder="Street" />
                       <div className="grid grid-cols-2 gap-2">
                          <Input value={invoice.buyer.address?.city || ''} onChange={e => handleAddressChange('buyer', 'city', e.target.value)} placeholder="City" />
                          <Input value={invoice.buyer.address?.postcode || ''} onChange={e => handleAddressChange('buyer', 'postcode', e.target.value)} placeholder="Postcode" />
                       </div>
                    </div>
                 </div>
              ) : (
                 <div className="grid grid-cols-2">
                    <div>
                       <div className="font-bold text-xl text-gray-900">{invoice.buyer.name}</div>
                       <div className="text-gray-500 mt-1">{invoice.buyer.taxId && `Tax ID: ${invoice.buyer.taxId}`}</div>
                    </div>
                    <div className="text-right text-gray-600">
                       <div>{invoice.buyer.address?.street}</div>
                       <div>{invoice.buyer.address?.city}, {invoice.buyer.address?.postcode}</div>
                       <div>{invoice.buyer.address?.countryCode}</div>
                    </div>
                 </div>
              )}
           </div>
        </div>

        {/* Line Items */}
        <div className="mb-12">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Items</h3>
              {isEditing && (
                 <Button size="sm" onClick={addLineItem} className="bg-gray-900 text-white hover:bg-gray-800">
                    <Plus className="w-4 h-4 mr-2" /> Add Item
                 </Button>
              )}
           </div>
           
           <table className="w-full">
              <thead>
                 <tr className="border-b-2 border-gray-100 text-left">
                    <th className="py-3 font-semibold text-gray-500 text-sm">Description</th>
                    <th className="py-3 font-semibold text-gray-500 text-sm w-24 text-center">Qty</th>
                    <th className="py-3 font-semibold text-gray-500 text-sm w-32 text-right">Price</th>
                    <th className="py-3 font-semibold text-gray-500 text-sm w-32 text-right">Total</th>
                    {isEditing && <th className="w-10"></th>}
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {invoice.lines.map((line, index) => (
                    <tr key={index}>
                       <td className="py-4">
                          {isEditing ? (
                             <div className="space-y-1">
                                <Input value={line.name} onChange={e => handleLineChange(index, 'name', e.target.value)} className="font-medium" placeholder="Item name" />
                                <Input value={line.hsCode || ''} onChange={e => handleLineChange(index, 'hsCode', e.target.value)} className="text-xs h-7 w-32" placeholder="HS Code" />
                             </div>
                          ) : (
                             <div>
                                <div className="font-medium text-gray-900">{line.name}</div>
                                {line.hsCode && <div className="text-xs text-gray-400 mt-0.5">HS: {line.hsCode}</div>}
                             </div>
                          )}
                       </td>
                       <td className="py-4 text-center">
                          {isEditing ? <Input type="number" value={line.quantity} onChange={e => handleLineChange(index, 'quantity', e.target.value)} className="w-20 text-center mx-auto" /> : <span className="text-gray-600">{line.quantity}</span>}
                       </td>
                       <td className="py-4 text-right">
                          {isEditing ? <Input type="number" value={line.unitPrice} onChange={e => handleLineChange(index, 'unitPrice', e.target.value)} className="w-24 ml-auto text-right" /> : <span className="text-gray-600">{line.unitPrice.toFixed(2)}</span>}
                       </td>
                       <td className="py-4 text-right font-bold text-gray-900">
                          {line.amount.toFixed(2)}
                       </td>
                       {isEditing && (
                          <td className="py-4 text-right">
                             <Button variant="ghost" size="icon" onClick={() => removeLineItem(index)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                             </Button>
                          </td>
                       )}
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
           <div className="w-80 space-y-3">
              <div className="flex justify-between text-gray-500">
                 <span>Subtotal</span>
                 <span>{invoice.totals.lineTotalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                 <span>{layout.labels.tax || 'Tax'}</span>
                 <span>{invoice.totals.taxTotalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t-2 border-gray-100">
                 <span className="font-bold text-lg text-gray-900">Total</span>
                 <span className="font-bold text-2xl" style={{ color: layout.colors.primary }}>{invoice.currency} {invoice.totals.grandTotalAmount.toFixed(2)}</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
