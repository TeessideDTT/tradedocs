import React from 'react';
import { Invoice, InvoiceLine } from '@/lib/uncefact/models';
import { InvoiceLayout } from '@/lib/uncefact/layout';
import { StandardLayout } from './layouts/StandardLayout';
import { ModernLayout } from './layouts/ModernLayout';
import { MinimalLayout } from './layouts/MinimalLayout';
import { InvoiceHandlers } from './layouts/types';

interface InvoiceFormProps {
  invoice: Invoice;
  layout: InvoiceLayout;
  isEditing: boolean;
  setInvoice: React.Dispatch<React.SetStateAction<Invoice>>;
}

export function InvoiceForm({ invoice, layout, isEditing, setInvoice }: InvoiceFormProps) {

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
        address: { ...(prev[party].address || { countryCode: '' }), [field]: value }
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

  const handlers: InvoiceHandlers = {
    handlePartyChange,
    handleAddressChange,
    handleLineChange,
    addLineItem,
    removeLineItem,
    setInvoice
  };

  // Render the appropriate layout based on the layout ID
  // Default to StandardLayout if no match
  if (layout.id === 'us-corporate') {
    return <ModernLayout invoice={invoice} layout={layout} isEditing={isEditing} handlers={handlers} />;
  }
  
  if (layout.id === 'de-standard') {
    return <MinimalLayout invoice={invoice} layout={layout} isEditing={isEditing} handlers={handlers} />;
  }

  // uk-standard and fallback
  return <StandardLayout invoice={invoice} layout={layout} isEditing={isEditing} handlers={handlers} />;
}
