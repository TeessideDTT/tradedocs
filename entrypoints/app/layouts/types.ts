import { Invoice, InvoiceLine } from '@/lib/uncefact/models';
import { InvoiceLayout } from '@/lib/uncefact/layout';

export interface InvoiceHandlers {
  handlePartyChange: (party: 'seller' | 'buyer', field: string, value: string) => void;
  handleAddressChange: (party: 'seller' | 'buyer', field: string, value: string) => void;
  handleLineChange: (index: number, field: keyof InvoiceLine, value: any) => void;
  handleLookup: (party: 'seller' | 'buyer') => Promise<void>;
  lookupParty: 'seller' | 'buyer' | null;
  isLookingUp: boolean;
  addLineItem: () => void;
  removeLineItem: (index: number) => void;
  setInvoice: React.Dispatch<React.SetStateAction<Invoice>>;
}

export interface LayoutProps {
  invoice: Invoice;
  layout: InvoiceLayout;
  isEditing: boolean;
  handlers: InvoiceHandlers;
}
