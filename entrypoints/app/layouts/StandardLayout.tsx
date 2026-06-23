import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { LayoutProps } from './types';
import { Invoice, PackingList } from '@/lib/uncefact/models';
import { COUNTRIES, CURRENCIES, DEFAULT_IDS } from '@/lib/uncefact/constants';

export function StandardLayout({ document: doc, layout, isEditing, handlers }: LayoutProps) {
  const { handlePartyChange, handleAddressChange, handleLineChange, handleLookup, lookupParty, isLookingUp, addLineItem, removeLineItem } = handlers;

  const isInvoice = doc.type === 'invoice';
  const data = doc.data;

  return (
    <div className={`space-y-12 font-sans ${!isEditing ? 'min-w-[800px]' : ''}`} style={{ fontFamily: layout.font.body }}>
      {/* Top Section: Meta Info */}
      <div className={`grid gap-6 bg-gray-50 p-6 rounded-lg ${isEditing ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-' + (!isInvoice ? '4' : '3') : (!isInvoice ? 'grid-cols-4' : 'grid-cols-3')}`} style={{ backgroundColor: layout.colors.secondary }}>
        <div>
          <Label className="text-gray-500 text-xs uppercase" style={{ color: layout.colors.text }}>
            {!isInvoice ? 'Packing List Number' : (layout.labels.invoiceTitle || 'Invoice Number')}
          </Label>
          {isEditing ? (
            <Input
              value={data.id}
              onChange={e => {
                const val = e.target.value;
                handlers.setDocument((prev: any) => ({ ...prev, data: { ...prev.data, id: val } }));
              }}
              className="mt-1 bg-white"
            />
          ) : <p className="font-medium mt-1">{data.id}</p>}
        </div>
        <div>
          <Label className="text-gray-500 text-xs uppercase" style={{ color: layout.colors.text }}>{layout.labels.date || 'Issue Date'}</Label>
          {isEditing ? (
            <Input
              type="date"
              value={data.issueDate.toISOString().split('T')[0]}
              onChange={e => {
                const d = new Date(e.target.value);
                if (!isNaN(d.getTime())) {
                  handlers.setDocument((prev: any) => ({ ...prev, data: { ...prev.data, issueDate: d } }));
                }
              }}
              className="mt-1 bg-white"
            />
          ) : <p className="font-medium mt-1">{data.issueDate.toLocaleDateString()}</p>}
        </div>
        {isInvoice ? (
          <div>
            <Label className="text-gray-500 text-xs uppercase" style={{ color: layout.colors.text }}>Currency</Label>
            {isEditing ? (
              <Select
                value={(data as Invoice).currency}
                onValueChange={(value) => {
                  handlers.setDocument((prev: any) => ({ ...prev, data: { ...prev.data, currency: value } }));
                }}
              >
                <SelectTrigger className="mt-1 bg-white">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : <p className="font-medium mt-1">{(data as Invoice).currency}</p>}
          </div>
        ) : (
          <div>
            <Label className="text-gray-500 text-xs uppercase" style={{ color: layout.colors.text }}>Invoice ID</Label>
            {isEditing ? (
              <Input
                value={(data as PackingList).invoiceId || ''}
                onChange={e => {
                  const val = e.target.value;
                  handlers.setDocument((prev: any) => ({ ...prev, data: { ...prev.data, invoiceId: val } }));
                }}
                className="mt-1 bg-white"
                placeholder="e.g. INV-9876"
              />
            ) : <p className="font-medium mt-1">{(data as PackingList).invoiceId || 'N/A'}</p>}
          </div>
        )}
      </div>

      {/* Parties Section */}
      <div className={`grid gap-12 ${isEditing ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2'}`}>
        {/* Seller Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b pb-2" style={{ color: layout.colors.primary, borderColor: layout.colors.secondary }}>Seller (Supplier)</h3>
          <div className="space-y-4">
            <div className="flex gap-2 items-end">
              {isEditing && (
                <div className="flex-1">
                  <Label className="text-gray-500 text-xs uppercase">Company ID (v-no)</Label>
                  <Input
                    value={data.seller.id || ''}
                    onChange={e => handlePartyChange('seller', 'id', e.target.value)}
                    placeholder={`e.g. ${DEFAULT_IDS.seller}`}
                    className="mt-1"
                  />
                </div>
              )}
              {isEditing && (
                <div className="flex items-center space-x-2 pb-2">
                  <input
                    type="checkbox"
                    id="seller-lookup"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleLookup('seller');
                        e.target.checked = false; // Reset after trigger
                      }
                    }}
                    disabled={isLookingUp}
                  />
                  <Label htmlFor="seller-lookup" className="text-xs cursor-pointer flex items-center gap-1">
                    {isLookingUp && lookupParty === 'seller' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />} Lookup
                  </Label>
                </div>
              )}
            </div>
            <div>
              <Label className="text-gray-500 text-xs uppercase">Company Name</Label>
              {isEditing ? <Input value={data.seller.name} onChange={e => handlePartyChange('seller', 'name', e.target.value)} className="mt-1" /> : <p className="font-medium">{data.seller.name}</p>}
            </div>
            <div>
              <Label className="text-gray-500 text-xs uppercase">Tax ID / VAT Number</Label>
              {isEditing ? <Input value={data.seller.taxId || ''} onChange={e => handlePartyChange('seller', 'taxId', e.target.value)} className="mt-1" /> : <p className="font-medium">{data.seller.taxId || 'N/A'}</p>}
            </div>
            <div className={`grid gap-4 ${isEditing ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2'}`}>
              <div className={isEditing ? 'col-span-1 sm:col-span-2' : 'col-span-2'}>
                <Label className="text-gray-500 text-xs uppercase">Street</Label>
                {isEditing ? <Input value={data.seller.address?.street || ''} onChange={e => handleAddressChange('seller', 'street', e.target.value)} className="mt-1" /> : <p className="font-medium">{data.seller.address?.street}</p>}
              </div>
              <div>
                <Label className="text-gray-500 text-xs uppercase">City</Label>
                {isEditing ? <Input value={data.seller.address?.city || ''} onChange={e => handleAddressChange('seller', 'city', e.target.value)} className="mt-1" /> : <p className="font-medium">{data.seller.address?.city}</p>}
              </div>
              <div>
                <Label className="text-gray-500 text-xs uppercase">Postcode</Label>
                {isEditing ? <Input value={data.seller.address?.postcode || ''} onChange={e => handleAddressChange('seller', 'postcode', e.target.value)} className="mt-1" /> : <p className="font-medium">{data.seller.address?.postcode}</p>}
              </div>
              <div className={isEditing ? 'col-span-1 sm:col-span-2' : 'col-span-2'}>
                <Label className="text-gray-500 text-xs uppercase">Country (ISO 3166-1)</Label>
                {isEditing ? (
                  <Select value={data.seller.address?.countryCode || ''} onValueChange={(value) => handleAddressChange('seller', 'countryCode', value)}>
                    <SelectTrigger className="mt-1 bg-white">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : <p className="font-medium">{data.seller.address?.countryCode}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Buyer Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b pb-2" style={{ color: layout.colors.primary, borderColor: layout.colors.secondary }}>Buyer (Recipient)</h3>
          <div className="space-y-4">
            <div className="flex gap-2 items-end">
              {isEditing && (
                <div className="flex-1">
                  <Label className="text-gray-500 text-xs uppercase">Company ID (v-no)</Label>
                  <Input
                    value={data.buyer.id || ''}
                    onChange={e => handlePartyChange('buyer', 'id', e.target.value)}
                    placeholder={`e.g. ${DEFAULT_IDS.buyer}`}
                    className="mt-1"
                  />
                </div>
              )}
              {isEditing && (
                <div className="flex items-center space-x-2 pb-2">
                  <input
                    type="checkbox"
                    id="buyer-lookup"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleLookup('buyer');
                        e.target.checked = false; // Reset after trigger
                      }
                    }}
                    disabled={isLookingUp}
                  />
                  <Label htmlFor="buyer-lookup" className="text-xs cursor-pointer flex items-center gap-1">
                    {isLookingUp && lookupParty === 'buyer' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />} Lookup
                  </Label>
                </div>
              )}
            </div>
            <div>
              <Label className="text-gray-500 text-xs uppercase">Company Name</Label>
              {isEditing ? <Input value={data.buyer.name} onChange={e => handlePartyChange('buyer', 'name', e.target.value)} className="mt-1" /> : <p className="font-medium">{data.buyer.name}</p>}
            </div>
            <div>
              <Label className="text-gray-500 text-xs uppercase">Tax ID / VAT Number</Label>
              {isEditing ? <Input value={data.buyer.taxId || ''} onChange={e => handlePartyChange('buyer', 'taxId', e.target.value)} className="mt-1" /> : <p className="font-medium">{data.buyer.taxId || 'N/A'}</p>}
            </div>
            <div className={`grid gap-4 ${isEditing ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2'}`}>
              <div className={isEditing ? 'col-span-1 sm:col-span-2' : 'col-span-2'}>
                <Label className="text-gray-500 text-xs uppercase">Street</Label>
                {isEditing ? <Input value={data.buyer.address?.street || ''} onChange={e => handleAddressChange('buyer', 'street', e.target.value)} className="mt-1" /> : <p className="font-medium">{data.buyer.address?.street}</p>}
              </div>
              <div>
                <Label className="text-gray-500 text-xs uppercase">City</Label>
                {isEditing ? <Input value={data.buyer.address?.city || ''} onChange={e => handleAddressChange('buyer', 'city', e.target.value)} className="mt-1" /> : <p className="font-medium">{data.buyer.address?.city}</p>}
              </div>
              <div>
                <Label className="text-gray-500 text-xs uppercase">Postcode</Label>
                {isEditing ? <Input value={data.buyer.address?.postcode || ''} onChange={e => handleAddressChange('buyer', 'postcode', e.target.value)} className="mt-1" /> : <p className="font-medium">{data.buyer.address?.postcode}</p>}
              </div>
              <div className={isEditing ? 'col-span-1 sm:col-span-2' : 'col-span-2'}>
                <Label className="text-gray-500 text-xs uppercase">Country (ISO 3166-1)</Label>
                {isEditing ? (
                  <Select value={data.buyer.address?.countryCode || ''} onValueChange={(value) => handleAddressChange('buyer', 'countryCode', value)}>
                    <SelectTrigger className="mt-1 bg-white">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : <p className="font-medium">{data.buyer.address?.countryCode}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Section */}
      <div className="space-y-4 pt-8 border-t" style={{ borderColor: layout.colors.secondary }}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold" style={{ color: layout.colors.primary }}>Line Items</h3>
          {isEditing && (
            <Button size="sm" variant="outline" onClick={addLineItem}>
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm text-left">
            <thead className="text-xs uppercase" style={{ backgroundColor: layout.colors.secondary, color: layout.colors.text }}>
              <tr>
                <th className="px-4 py-3 min-w-[200px]">Description</th>
                <th className="px-4 py-3 w-40 min-w-[120px]" title="Harmonized System Code for customs">HS Code</th>
                <th className="px-4 py-3 w-24">Qty</th>
                <th className="px-4 py-3 w-32 min-w-[100px]" title="UN/CEFACT Rec 20">Unit</th>
                {isInvoice && (
                  <>
                    <th className="px-4 py-3 w-32">Price</th>
                    <th className="px-4 py-3 w-20 min-w-[60px]">Tax %</th>
                    <th className="px-4 py-3 w-32 text-right">Amount</th>
                  </>
                )}
                {isEditing && <th className="px-4 py-3 w-16"></th>}
              </tr>
            </thead>
            <tbody>
              {data.lines.map((line: any, index: number) => (
                <tr key={index} className="border-b last:border-0" style={{ borderColor: layout.colors.secondary }}>
                  <td className="px-4 py-3">
                    {isEditing ? <Input value={line.name} onChange={e => handleLineChange(index, 'name', e.target.value)} className="h-8" /> : line.name}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? <Input value={line.hsCode || ''} onChange={e => handleLineChange(index, 'hsCode', e.target.value)} className="h-8 min-w-[120px]" placeholder="e.g. 8517.62" /> : (line.hsCode || '-')}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? <Input type="number" min="1" step="1" value={line.quantity} onChange={e => handleLineChange(index, 'quantity', e.target.value)} className="h-8 min-w-[80px]" /> : line.quantity}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? <Input value={line.unitCode} onChange={e => handleLineChange(index, 'unitCode', e.target.value)} className="h-8 min-w-[100px]" title="e.g. C62 (pieces), H87 (hours)" /> : line.unitCode}
                  </td>
                  {isInvoice && (
                    <>
                      <td className="px-4 py-3">
                        {isEditing ? <Input type="number" min="0" step="0.01" value={line.unitPrice} onChange={e => handleLineChange(index, 'unitPrice', e.target.value)} className="h-8 min-w-[100px]" /> : line.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? <Input type="number" min="0" step="0.1" value={line.taxRate || 0} onChange={e => handleLineChange(index, 'taxRate', e.target.value)} className="h-8 min-w-[60px]" /> : `${line.taxRate || 0}%`}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {line.amount.toFixed(2)}
                      </td>
                    </>
                  )}
                  {isEditing && (
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => removeLineItem(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
              {data.lines.length === 0 && (
                <tr>
                  <td colSpan={!isInvoice ? (isEditing ? 5 : 4) : (isEditing ? 8 : 7)} className="px-4 py-8 text-center text-gray-500">
                    No line items added.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals Section */}
      {isInvoice && (
        <div className="flex justify-end pt-8 border-t" style={{ borderColor: layout.colors.secondary }}>
          <div className="w-full max-w-md space-y-3 p-6 rounded-lg" style={{ backgroundColor: layout.colors.secondary }}>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Line Total Amount:</span>
              <span className="font-medium">{(data as Invoice).currency} {(data as Invoice).totals.lineTotalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{layout.labels.tax || 'Tax Total Amount'}:</span>
              <span className="font-medium">{(data as Invoice).currency} {(data as Invoice).totals.taxTotalAmount.toFixed(2)}</span>
            </div>
            <div className="pt-3 border-t flex justify-between items-center" style={{ borderColor: layout.colors.background }}>
              <span className="font-bold" style={{ color: layout.colors.primary }}>{layout.labels.total || 'Due Payable Amount'}:</span>
              <span className="font-bold text-xl">{(data as Invoice).currency} {(data as Invoice).totals.duePayableAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
