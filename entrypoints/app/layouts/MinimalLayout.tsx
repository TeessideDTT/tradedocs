import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { LayoutProps } from './types';
import { COUNTRIES, CURRENCIES, DEFAULT_IDS } from '@/lib/uncefact/constants';
import { Invoice, PackingList } from '@/lib/uncefact/models';

export function MinimalLayout({ document: doc, layout, isEditing, handlers }: LayoutProps) {
   const { handlePartyChange, handleAddressChange, handleLineChange, handleLookup, lookupParty, isLookingUp, addLineItem, removeLineItem, setDocument } = handlers;

   const isInvoice = doc.type === 'invoice';
   const data = doc.data;

   return (
      <div className={`font-serif max-w-4xl mx-auto text-gray-800 ${isEditing ? 'p-4 sm:p-8 md:p-12' : 'p-12 min-w-[800px]'}`} style={{ fontFamily: layout.font.body }}>
         {/* Document Settings (only when editing) */}
         {isEditing && (
            <div className="flex flex-wrap gap-4 justify-center bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm mb-8 font-sans">

               {!isInvoice && (
                  <div className="flex items-center gap-2">
                     <Label className="text-xs uppercase text-gray-500">Invoice ID</Label>
                     <Input
                        value={(data as PackingList).invoiceId || ''}
                        onChange={e => {
                           const val = e.target.value;
                           setDocument((prev: any) => ({ ...prev, data: { ...prev.data, invoiceId: val } }));
                        }}
                        className="h-8 w-32 bg-white border-gray-200"
                        placeholder="e.g. INV-9876"
                     />
                  </div>
               )}

               {isInvoice && (
                  <div className="flex items-center gap-2">
                     <Label className="text-xs uppercase text-gray-500">Currency</Label>
                     <Select
                        value={(data as Invoice).currency}
                        onValueChange={(value) => {
                           setDocument((prev: any) => ({ ...prev, data: { ...prev.data, currency: value } }));
                        }}
                     >
                        <SelectTrigger className="w-24 bg-white h-8 border-gray-200">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           {CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}
                        </SelectContent>
                     </Select>
                  </div>
               )}

               <div className="flex items-center gap-2">
                  <Label className="text-xs uppercase text-gray-500">ID</Label>
                  <Input
                     value={data.id}
                     onChange={e => {
                        const val = e.target.value;
                        setDocument((prev: any) => ({ ...prev, data: { ...prev.data, id: val } }));
                     }}
                     className="h-8 w-28 bg-white border-gray-200"
                  />
               </div>

               <div className="flex items-center gap-2">
                  <Label className="text-xs uppercase text-gray-500">Date</Label>
                  <Input
                     type="date"
                     value={data.issueDate.toISOString().split('T')[0]}
                     onChange={e => {
                        const d = new Date(e.target.value);
                        if (!isNaN(d.getTime())) {
                           setDocument((prev: any) => ({ ...prev, data: { ...prev.data, issueDate: d } }));
                        }
                     }}
                     className="h-8 w-36 bg-white border-gray-200"
                  />
               </div>
            </div>
         )}

         {/* Header - Centered & Minimal */}
         <div className="text-center mb-16 space-y-2">
            <h1 className="text-3xl tracking-widest uppercase font-light border-b border-gray-200 pb-4 inline-block px-12">
               {!isInvoice ? (layout.id === 'de-standard' ? 'LIEFERSCHEIN' : 'PACKING LIST') : (layout.labels.invoiceTitle || 'INVOICE')}
            </h1>
            <div className="text-sm text-gray-400 uppercase tracking-widest mt-2">
               #{data.id} • {data.issueDate.toLocaleDateString()}{!isInvoice && (data as PackingList).invoiceId && ` • Invoice ID: ${(data as PackingList).invoiceId}`}
            </div>
         </div>

         {/* Grid for Addresses */}
         <div className={`grid mb-16 ${isEditing ? 'grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12' : 'grid-cols-2 gap-12'}`}>
            {/* Seller */}
            <div className={`border-gray-100 ${isEditing ? 'text-left sm:text-right border-b sm:border-b-0 sm:border-r pb-8 sm:pb-0 sm:pr-12' : 'text-right border-r pr-12'}`}>
               <div className="text-xs uppercase tracking-widest text-gray-400 mb-4">From</div>
               {isEditing ? (
                  <div className="space-y-2 text-left sm:text-right">
                     <div className="flex gap-2 items-center justify-start sm:justify-end">
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
                           value={data.seller.id || ''}
                           onChange={e => handlePartyChange('seller', 'id', e.target.value)}
                           className="text-left sm:text-right border-gray-200 w-32 h-8"
                           placeholder="ID"
                        />
                     </div>
                     <Input value={data.seller.name} onChange={e => handlePartyChange('seller', 'name', e.target.value)} className="text-left sm:text-right border-gray-200" placeholder="Seller Name" />
                     <Input value={data.seller.address?.street || ''} onChange={e => handleAddressChange('seller', 'street', e.target.value)} className="text-left sm:text-right border-gray-200" placeholder="Street" />
                     <Input value={data.seller.address?.city || ''} onChange={e => handleAddressChange('seller', 'city', e.target.value)} className="text-left sm:text-right border-gray-200" placeholder="City" />
                  </div>
               ) : (
                  <div className="space-y-1">
                     <div className="font-medium text-lg">{data.seller.name}</div>
                     <div className="text-gray-500 font-light">{data.seller.address?.street}</div>
                     <div className="text-gray-500 font-light">{data.seller.address?.city} {data.seller.address?.postcode}</div>
                     <div className="text-gray-400 text-xs mt-2 uppercase">{data.seller.address?.countryCode}</div>
                  </div>
               )}
            </div>

            {/* Buyer */}
            <div className={isEditing ? 'pt-4 sm:pt-0 sm:pl-4' : 'pl-4'}>
               <div className="text-xs uppercase tracking-widest text-gray-400 mb-4">{layout.labels.billTo || 'To'}</div>
               {isEditing ? (
                  <div className="space-y-2">
                     <div className="flex gap-2 items-center">
                        <Input
                           value={data.buyer.id || ''}
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
                     <Input value={data.buyer.name} onChange={e => handlePartyChange('buyer', 'name', e.target.value)} className="border-gray-200" placeholder="Buyer Name" />
                     <Input value={data.buyer.address?.street || ''} onChange={e => handleAddressChange('buyer', 'street', e.target.value)} className="border-gray-200" placeholder="Street" />
                     <Input value={data.buyer.address?.city || ''} onChange={e => handleAddressChange('buyer', 'city', e.target.value)} className="border-gray-200" placeholder="City" />
                  </div>
               ) : (
                  <div className="space-y-1">
                     <div className="font-medium text-lg">{data.buyer.name}</div>
                     <div className="text-gray-500 font-light">{data.buyer.address?.street}</div>
                     <div className="text-gray-500 font-light">{data.buyer.address?.city} {data.buyer.address?.postcode}</div>
                     <div className="text-gray-400 text-xs mt-2 uppercase">{data.buyer.address?.countryCode}</div>
                  </div>
               )}
            </div>
         </div>

         {/* Items Table - Clean, no vertical lines */}
         <div className="mb-16 overflow-x-auto">
            <table className="w-full min-w-[800px]">
               <thead>
                  <tr className="border-b border-gray-800">
                     <th className="py-4 text-left font-normal uppercase tracking-widest text-xs w-1/2">Item</th>
                     <th className="py-4 text-center font-normal uppercase tracking-widest text-xs">Qty</th>
                     {isInvoice && (
                        <>
                           <th className="py-4 text-right font-normal uppercase tracking-widest text-xs">Price</th>
                           <th className="py-4 text-right font-normal uppercase tracking-widest text-xs">Total</th>
                        </>
                     )}
                     {isEditing && <th className="w-10"></th>}
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {data.lines.map((line, index) => (
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
                           {isEditing ? <Input type="number" value={line.quantity} onChange={e => handleLineChange(index, 'quantity', e.target.value)} className="w-24 min-w-[80px] text-center mx-auto border-gray-200" /> : line.quantity}
                        </td>
                        {isInvoice && (
                           <>
                              <td className="py-4 text-right text-gray-500">
                                 {isEditing ? <Input type="number" value={(line as any).unitPrice} onChange={e => handleLineChange(index, 'unitPrice', e.target.value)} className="w-28 min-w-[100px] ml-auto text-right border-gray-200" /> : (line as any).unitPrice.toFixed(2)}
                              </td>
                              <td className="py-4 text-right font-medium">
                                 {(line as any).amount.toFixed(2)}
                              </td>
                           </>
                        )}
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
         <div className={`border-t border-gray-200 pt-8 flex justify-between ${isEditing ? 'flex-col sm:flex-row items-start sm:items-end gap-6 sm:gap-0' : 'items-end'}`}>
            <div className="text-sm text-gray-400 max-w-xs">
               Thank you for your business. Payment is due within 30 days.
            </div>
            {isInvoice && (
               <div className={`text-right space-y-2 ${isEditing ? 'w-full sm:w-auto' : ''}`}>
                  <div className={`flex justify-between text-gray-500 ${isEditing ? 'w-full sm:w-64' : 'w-64'}`}>
                     <span>Subtotal</span>
                     <span>{(data as Invoice).totals.lineTotalAmount.toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between text-gray-500 ${isEditing ? 'w-full sm:w-64' : 'w-64'}`}>
                     <span>{layout.labels.tax || 'VAT'}</span>
                     <span>{(data as Invoice).totals.taxTotalAmount.toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between font-medium text-2xl text-gray-900 pt-4 mt-2 border-t border-gray-100 ${isEditing ? 'w-full sm:w-64' : 'w-64'}`}>
                     <span>Total</span>
                     <span>{(data as Invoice).currency} {(data as Invoice).totals.grandTotalAmount.toFixed(2)}</span>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}
