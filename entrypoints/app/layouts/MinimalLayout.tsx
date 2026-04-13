import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { LayoutProps } from './types';
import { COUNTRIES, CURRENCIES } from '@/lib/uncefact/constants';

export function MinimalLayout({ invoice, layout, isEditing, handlers }: LayoutProps) {
  const { handlePartyChange, handleAddressChange, handleLineChange, handleLookup, lookupParty, isLookingUp, addLineItem, removeLineItem, setInvoice } = handlers;

  return (
    <div className="font-serif p-12 max-w-4xl mx-auto text-gray-800" style={{ fontFamily: layout.font.body }}>
      {/* Header - Centered & Minimal */}
      <div className="text-center mb-16 space-y-2">
        <h1 className="text-3xl tracking-widest uppercase font-light border-b border-gray-200 pb-4 inline-block px-12">
           {layout.labels.invoiceTitle || 'INVOICE'}
        </h1>
        <div className="text-sm text-gray-400 uppercase tracking-widest mt-2">
           #{invoice.id} • {invoice.issueDate.toLocaleDateString()}
        </div>
      </div>

      {/* Grid for Addresses */}
      <div className="grid grid-cols-2 gap-12 mb-16">
         {/* Seller */}
         <div className="text-right border-r border-gray-100 pr-12">
            <div className="text-xs uppercase tracking-widest text-gray-400 mb-4">From</div>
            {isEditing ? (
               <div className="space-y-2 text-right">
                  <div className="flex gap-2 items-center justify-end">
                    <div className="flex items-center gap-1">
                      <input 
                        type="checkbox" 
                        id="seller-lookup-minimal" 
                        className="w-3 h-3 rounded"
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleLookup('seller');
                            e.target.checked = false;
                          }
                        }}
                        disabled={isLookingUp}
                      />
                      <label htmlFor="seller-lookup-minimal" className="text-[10px] uppercase opacity-40 cursor-pointer flex items-center gap-1">
                        {isLookingUp && lookupParty === 'seller' ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : null}
                        Lookup
                      </label>
                    </div>
                    <Input 
                      value={invoice.seller.id || ''} 
                      onChange={e => handlePartyChange('seller', 'id', e.target.value)} 
                      className="text-right border-gray-200 w-32 h-8" 
                      placeholder="ID" 
                    />
                  </div>
                  <Input value={invoice.seller.name} onChange={e => handlePartyChange('seller', 'name', e.target.value)} className="text-right border-gray-200" placeholder="Seller Name" />
                  <Input value={invoice.seller.address?.street || ''} onChange={e => handleAddressChange('seller', 'street', e.target.value)} className="text-right border-gray-200" placeholder="Street" />
                  <Input value={invoice.seller.address?.city || ''} onChange={e => handleAddressChange('seller', 'city', e.target.value)} className="text-right border-gray-200" placeholder="City" />
               </div>
            ) : (
               <div className="space-y-1">
                  <div className="font-medium text-lg">{invoice.seller.name}</div>
                  <div className="text-gray-500 font-light">{invoice.seller.address?.street}</div>
                  <div className="text-gray-500 font-light">{invoice.seller.address?.city} {invoice.seller.address?.postcode}</div>
                  <div className="text-gray-400 text-xs mt-2 uppercase">{invoice.seller.address?.countryCode}</div>
               </div>
            )}
         </div>

         {/* Buyer */}
         <div className="pl-4">
            <div className="text-xs uppercase tracking-widest text-gray-400 mb-4">{layout.labels.billTo || 'To'}</div>
            {isEditing ? (
               <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <Input 
                      value={invoice.buyer.id || ''} 
                      onChange={e => handlePartyChange('buyer', 'id', e.target.value)} 
                      className="border-gray-200 w-32 h-8" 
                      placeholder="ID" 
                    />
                    <div className="flex items-center gap-1">
                      <input 
                        type="checkbox" 
                        id="buyer-lookup-minimal" 
                        className="w-3 h-3 rounded"
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleLookup('buyer');
                            e.target.checked = false;
                          }
                        }}
                        disabled={isLookingUp}
                      />
                      <label htmlFor="buyer-lookup-minimal" className="text-[10px] uppercase opacity-40 cursor-pointer flex items-center gap-1">
                         {isLookingUp && lookupParty === 'buyer' ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : null}
                         Lookup
                      </label>
                    </div>
                  </div>
                  <Input value={invoice.buyer.name} onChange={e => handlePartyChange('buyer', 'name', e.target.value)} className="border-gray-200" placeholder="Buyer Name" />
                  <Input value={invoice.buyer.address?.street || ''} onChange={e => handleAddressChange('buyer', 'street', e.target.value)} className="border-gray-200" placeholder="Street" />
                  <Input value={invoice.buyer.address?.city || ''} onChange={e => handleAddressChange('buyer', 'city', e.target.value)} className="border-gray-200" placeholder="City" />
               </div>
            ) : (
               <div className="space-y-1">
                  <div className="font-medium text-lg">{invoice.buyer.name}</div>
                  <div className="text-gray-500 font-light">{invoice.buyer.address?.street}</div>
                  <div className="text-gray-500 font-light">{invoice.buyer.address?.city} {invoice.buyer.address?.postcode}</div>
                  <div className="text-gray-400 text-xs mt-2 uppercase">{invoice.buyer.address?.countryCode}</div>
               </div>
            )}
         </div>
      </div>

      {/* Items Table - Clean, no vertical lines */}
      <div className="mb-16">
         <table className="w-full">
            <thead>
               <tr className="border-b border-gray-800">
                  <th className="py-4 text-left font-normal uppercase tracking-widest text-xs w-1/2">Item</th>
                  <th className="py-4 text-center font-normal uppercase tracking-widest text-xs">Qty</th>
                  <th className="py-4 text-right font-normal uppercase tracking-widest text-xs">Price</th>
                  <th className="py-4 text-right font-normal uppercase tracking-widest text-xs">Total</th>
                  {isEditing && <th className="w-10"></th>}
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {invoice.lines.map((line, index) => (
                  <tr key={index}>
                     <td className="py-4">
                        {isEditing ? (
                           <div className="space-y-1">
                              <Input value={line.name} onChange={e => handleLineChange(index, 'name', e.target.value)} className="border-gray-200" placeholder="Item name" />
                              <Input value={line.hsCode || ''} onChange={e => handleLineChange(index, 'hsCode', e.target.value)} className="text-xs h-7 w-32 border-gray-200" placeholder="HS Code" />
                           </div>
                        ) : (
                           <div>
                              <span className="font-medium">{line.name}</span>
                              {line.hsCode && <div className="text-xs text-gray-400 mt-1">HS: {line.hsCode}</div>}
                           </div>
                        )}
                     </td>
                     <td className="py-4 text-center text-gray-500">
                        {isEditing ? <Input type="number" value={line.quantity} onChange={e => handleLineChange(index, 'quantity', e.target.value)} className="w-16 text-center mx-auto border-gray-200" /> : line.quantity}
                     </td>
                     <td className="py-4 text-right text-gray-500">
                        {isEditing ? <Input type="number" value={line.unitPrice} onChange={e => handleLineChange(index, 'unitPrice', e.target.value)} className="w-20 ml-auto text-right border-gray-200" /> : line.unitPrice.toFixed(2)}
                     </td>
                     <td className="py-4 text-right font-medium">
                        {line.amount.toFixed(2)}
                     </td>
                     {isEditing && (
                        <td className="py-4 text-right">
                           <Button variant="ghost" size="icon" onClick={() => removeLineItem(index)} className="text-gray-400 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                           </Button>
                        </td>
                     )}
                  </tr>
               ))}
            </tbody>
         </table>
         {isEditing && (
            <div className="mt-4 text-center">
               <Button variant="outline" size="sm" onClick={addLineItem} className="border-gray-200 text-gray-500 hover:text-gray-900">
                  <Plus className="w-4 h-4 mr-2" /> Add Item
               </Button>
            </div>
         )}
      </div>

      {/* Totals - Simple */}
      <div className="border-t border-gray-200 pt-8 flex justify-between items-end">
         <div className="text-sm text-gray-400 max-w-xs">
            Thank you for your business. Payment is due within 30 days.
         </div>
         <div className="text-right space-y-2">
            <div className="flex justify-between w-64 text-gray-500">
               <span>Subtotal</span>
               <span>{invoice.totals.lineTotalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-64 text-gray-500">
               <span>{layout.labels.tax || 'VAT'}</span>
               <span>{invoice.totals.taxTotalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-64 font-medium text-2xl text-gray-900 pt-4 mt-2 border-t border-gray-100">
               <span>Total</span>
               <span>{invoice.currency} {invoice.totals.grandTotalAmount.toFixed(2)}</span>
            </div>
         </div>
      </div>
    </div>
  );
}
