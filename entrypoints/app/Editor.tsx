import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { LAYOUTS, UK_LAYOUT } from '@/lib/uncefact/layout';
import { DEFAULT_INVOICE, Invoice, InvoiceLine } from '@/lib/uncefact/models';
import { generateInvoicePdf } from '@/lib/uncefact/pdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Loader2, Edit2, Save, Plus, Trash2 } from 'lucide-react';

const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'IN', name: 'India' },
];

const CURRENCIES = [
  { code: 'GBP', name: 'British Pound' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'INR', name: 'Indian Rupee' },
];

export default function Editor() {
  const location = useLocation();
  const { layoutId, importedData } = location.state || {};
  const selectedLayout = LAYOUTS.find(l => l.id === layoutId) || UK_LAYOUT;
  
  // Set default currency based on layout, fallback to EUR
  const defaultCurrency = selectedLayout.id === 'uk-standard' ? 'GBP' : 
                          selectedLayout.id === 'us-corporate' ? 'USD' : 'EUR';
                          
  // Set default country code based on layout
  const defaultCountry = selectedLayout.countryCode;

  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [invoice, setInvoice] = useState<Invoice>(() => {
    // If we have imported data from a PDF, merge it with defaults
    if (importedData) {
      return {
        ...DEFAULT_INVOICE,
        ...importedData,
        // Ensure nested objects merge correctly
        seller: {
          ...DEFAULT_INVOICE.seller,
          ...(importedData.seller || {}),
          address: {
            ...DEFAULT_INVOICE.seller.address,
            ...(importedData.seller?.address || { countryCode: defaultCountry })
          }
        },
        buyer: {
          ...DEFAULT_INVOICE.buyer,
          ...(importedData.buyer || {}),
          address: {
            ...DEFAULT_INVOICE.buyer.address,
            ...(importedData.buyer?.address || { countryCode: defaultCountry })
          }
        },
        lines: importedData.lines?.length ? importedData.lines : DEFAULT_INVOICE.lines
      };
    }

    // Otherwise use standard defaults
    return {
      ...DEFAULT_INVOICE,
      currency: defaultCurrency,
      seller: { 
        ...DEFAULT_INVOICE.seller, 
        address: { ...(DEFAULT_INVOICE.seller.address || {}), countryCode: defaultCountry } 
      },
      buyer: { 
        ...DEFAULT_INVOICE.buyer, 
        address: { ...(DEFAULT_INVOICE.buyer.address || {}), countryCode: defaultCountry } 
      }
    };
  });

  // Auto-calculate compliant totals whenever lines change
  useEffect(() => {
    const lineTotalAmount = invoice.lines.reduce((sum, line) => sum + (line.amount || 0), 0);
    const taxTotalAmount = invoice.lines.reduce((sum, line) => sum + ((line.amount || 0) * (line.taxRate || 0) / 100), 0);
    const grandTotalAmount = lineTotalAmount + taxTotalAmount;

    setInvoice(prev => ({
      ...prev,
      totals: {
        lineTotalAmount,
        taxTotalAmount,
        grandTotalAmount,
        duePayableAmount: grandTotalAmount,
      }
    }));
  }, [invoice.lines]);

  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      const pdfBytes = await generateInvoicePdf(invoice, selectedLayout, invoiceRef.current);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.id}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePartyChange = (party: 'seller' | 'buyer', field: string, value: string) => {
    setInvoice(prev => ({
      ...prev,
      [party]: { ...prev[party], [field]: value }
    }));
  };

  const handleAddressChange = (party: 'seller' | 'buyer', field: string, value: string) => {
    setInvoice(prev => ({
      ...prev,
      [party]: {
        ...prev[party],
        address: { ...(prev[party].address || { countryCode: defaultCountry }), [field]: value }
      }
    }));
  };

  const handleLineChange = (index: number, field: keyof InvoiceLine, value: any) => {
    setInvoice(prev => {
      const newLines = [...prev.lines];
      
      let parsedValue = value;
      // Enforce number boundaries
      if (field === 'quantity') {
        parsedValue = Math.max(1, parseFloat(value) || 1);
      } else if (field === 'unitPrice' || field === 'taxRate') {
        parsedValue = Math.max(0, parseFloat(value) || 0);
      }
      
      newLines[index] = { ...newLines[index], [field]: parsedValue };
      
      // Auto-calculate amount for the line item
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = newLines[index].quantity || 1;
        const price = newLines[index].unitPrice || 0;
        newLines[index].amount = qty * price;
      }
      
      return { ...prev, lines: newLines };
    });
  };

  const addLineItem = () => {
    setInvoice(prev => ({
      ...prev,
      lines: [
        ...prev.lines,
        { id: Math.random().toString(36).substr(2, 9), name: 'New Item', quantity: 1, unitCode: 'C62', unitPrice: 0, amount: 0, taxCategoryCode: 'S', taxRate: 0, hsCode: '' }
      ]
    }));
  };

  const removeLineItem = (index: number) => {
    setInvoice(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">UN/CEFACT Invoice Editor</h1>
          <p className="text-gray-500">Edit compliant standard fields and layout.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? <><Save className="w-4 h-4 mr-2" /> Save Details</> : <><Edit2 className="w-4 h-4 mr-2" /> Edit Invoice</>}
          </Button>
          <Button onClick={handleDownloadPdf} disabled={isGenerating || isEditing}>
            {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Download className="w-4 h-4 mr-2" /> Download PDF</>}
          </Button>
        </div>
      </div>
      
      <div ref={invoiceRef} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-12">
        
        {/* Top Section: Meta Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-gray-50 p-6 rounded-lg">
          <div>
            <Label className="text-gray-500 text-xs uppercase">Invoice Number</Label>
            {isEditing ? (
              <Input value={invoice.id} onChange={e => setInvoice(prev => ({...prev, id: e.target.value}))} className="mt-1 bg-white" />
            ) : <p className="font-medium mt-1">{invoice.id}</p>}
          </div>
          <div>
            <Label className="text-gray-500 text-xs uppercase">Issue Date</Label>
            {isEditing ? (
              <Input 
                type="date" 
                value={invoice.issueDate.toISOString().split('T')[0]} 
                onChange={e => {
                  const d = new Date(e.target.value);
                  if(!isNaN(d.getTime())) setInvoice(prev => ({...prev, issueDate: d}));
                }} 
                className="mt-1 bg-white" 
              />
            ) : <p className="font-medium mt-1">{invoice.issueDate.toLocaleDateString()}</p>}
          </div>
          <div>
            <Label className="text-gray-500 text-xs uppercase">Currency (ISO 4217)</Label>
            {isEditing ? (
              <Select value={invoice.currency} onValueChange={(value) => setInvoice(prev => ({...prev, currency: value}))}>
                <SelectTrigger className="mt-1 bg-white">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : <p className="font-medium mt-1">{invoice.currency}</p>}
          </div>
          <div>
            <Label className="text-gray-500 text-xs uppercase">Type Code</Label>
            {isEditing ? (
              <Input value={invoice.typeCode} onChange={e => setInvoice(prev => ({...prev, typeCode: e.target.value}))} className="mt-1 bg-white" />
            ) : <p className="font-medium mt-1">{invoice.typeCode} <span className="text-gray-400 text-sm">(380 = Commercial)</span></p>}
          </div>
        </div>

        {/* Parties Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Seller Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Seller (Supplier)</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-500 text-xs uppercase">Company Name</Label>
                {isEditing ? <Input value={invoice.seller.name} onChange={e => handlePartyChange('seller', 'name', e.target.value)} className="mt-1" /> : <p className="font-medium">{invoice.seller.name}</p>}
              </div>
              <div>
                <Label className="text-gray-500 text-xs uppercase">Tax ID / VAT Number</Label>
                {isEditing ? <Input value={invoice.seller.taxId || ''} onChange={e => handlePartyChange('seller', 'taxId', e.target.value)} className="mt-1" /> : <p className="font-medium">{invoice.seller.taxId || 'N/A'}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-gray-500 text-xs uppercase">Street</Label>
                  {isEditing ? <Input value={invoice.seller.address?.street || ''} onChange={e => handleAddressChange('seller', 'street', e.target.value)} className="mt-1" /> : <p className="font-medium">{invoice.seller.address?.street}</p>}
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase">City</Label>
                  {isEditing ? <Input value={invoice.seller.address?.city || ''} onChange={e => handleAddressChange('seller', 'city', e.target.value)} className="mt-1" /> : <p className="font-medium">{invoice.seller.address?.city}</p>}
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase">Postcode</Label>
                  {isEditing ? <Input value={invoice.seller.address?.postcode || ''} onChange={e => handleAddressChange('seller', 'postcode', e.target.value)} className="mt-1" /> : <p className="font-medium">{invoice.seller.address?.postcode}</p>}
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-500 text-xs uppercase">Country (ISO 3166-1)</Label>
                  {isEditing ? (
                    <Select value={invoice.seller.address?.countryCode || ''} onValueChange={(value) => handleAddressChange('seller', 'countryCode', value)}>
                      <SelectTrigger className="mt-1 bg-white">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map(c => (
                          <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : <p className="font-medium">{invoice.seller.address?.countryCode}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Buyer Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Buyer (Customer)</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-500 text-xs uppercase">Company Name</Label>
                {isEditing ? <Input value={invoice.buyer.name} onChange={e => handlePartyChange('buyer', 'name', e.target.value)} className="mt-1" /> : <p className="font-medium">{invoice.buyer.name}</p>}
              </div>
              <div>
                <Label className="text-gray-500 text-xs uppercase">Tax ID / VAT Number</Label>
                {isEditing ? <Input value={invoice.buyer.taxId || ''} onChange={e => handlePartyChange('buyer', 'taxId', e.target.value)} className="mt-1" /> : <p className="font-medium">{invoice.buyer.taxId || 'N/A'}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-gray-500 text-xs uppercase">Street</Label>
                  {isEditing ? <Input value={invoice.buyer.address?.street || ''} onChange={e => handleAddressChange('buyer', 'street', e.target.value)} className="mt-1" /> : <p className="font-medium">{invoice.buyer.address?.street}</p>}
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase">City</Label>
                  {isEditing ? <Input value={invoice.buyer.address?.city || ''} onChange={e => handleAddressChange('buyer', 'city', e.target.value)} className="mt-1" /> : <p className="font-medium">{invoice.buyer.address?.city}</p>}
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase">Postcode</Label>
                  {isEditing ? <Input value={invoice.buyer.address?.postcode || ''} onChange={e => handleAddressChange('buyer', 'postcode', e.target.value)} className="mt-1" /> : <p className="font-medium">{invoice.buyer.address?.postcode}</p>}
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-500 text-xs uppercase">Country (ISO 3166-1)</Label>
                  {isEditing ? (
                    <Select value={invoice.buyer.address?.countryCode || ''} onValueChange={(value) => handleAddressChange('buyer', 'countryCode', value)}>
                      <SelectTrigger className="mt-1 bg-white">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map(c => (
                          <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : <p className="font-medium">{invoice.buyer.address?.countryCode}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Section */}
        <div className="space-y-4 pt-8 border-t">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Line Items</h3>
            {isEditing && (
              <Button size="sm" variant="outline" onClick={addLineItem}>
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3 min-w-[200px]">Description</th>
                  <th className="px-4 py-3 w-32" title="Harmonized System Code for customs">HS Code</th>
                  <th className="px-4 py-3 w-24">Qty</th>
                  <th className="px-4 py-3 w-24" title="UN/CEFACT Rec 20">Unit</th>
                  <th className="px-4 py-3 w-32">Price</th>
                  <th className="px-4 py-3 w-24">Tax %</th>
                  <th className="px-4 py-3 w-32 text-right">Amount</th>
                  {isEditing && <th className="px-4 py-3 w-16"></th>}
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      {isEditing ? <Input value={line.name} onChange={e => handleLineChange(index, 'name', e.target.value)} className="h-8" /> : line.name}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? <Input value={line.hsCode || ''} onChange={e => handleLineChange(index, 'hsCode', e.target.value)} className="h-8" placeholder="e.g. 8517.62" /> : (line.hsCode || '-')}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? <Input type="number" min="1" step="1" value={line.quantity} onChange={e => handleLineChange(index, 'quantity', e.target.value)} className="h-8" /> : line.quantity}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? <Input value={line.unitCode} onChange={e => handleLineChange(index, 'unitCode', e.target.value)} className="h-8" title="e.g. C62 (pieces), H87 (hours)" /> : line.unitCode}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? <Input type="number" min="0" step="0.01" value={line.unitPrice} onChange={e => handleLineChange(index, 'unitPrice', e.target.value)} className="h-8" /> : line.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? <Input type="number" min="0" step="0.1" value={line.taxRate || 0} onChange={e => handleLineChange(index, 'taxRate', e.target.value)} className="h-8" /> : `${line.taxRate || 0}%`}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {line.amount.toFixed(2)}
                    </td>
                    {isEditing && (
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => removeLineItem(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
                {invoice.lines.length === 0 && (
                  <tr>
                    <td colSpan={isEditing ? 8 : 7} className="px-4 py-8 text-center text-gray-500">
                      No line items added.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end pt-8 border-t">
          <div className="w-full max-w-md space-y-3 bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Line Total Amount:</span>
              <span className="font-medium">{invoice.currency} {invoice.totals.lineTotalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax Total Amount:</span>
              <span className="font-medium">{invoice.currency} {invoice.totals.taxTotalAmount.toFixed(2)}</span>
            </div>
            <div className="pt-3 border-t flex justify-between items-center">
              <span className="font-bold text-gray-700">Due Payable Amount:</span>
              <span className="font-bold text-xl">{invoice.currency} {invoice.totals.duePayableAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
