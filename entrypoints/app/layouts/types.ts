import { Invoice, InvoiceLine, PackingList, PackingListLine, TradeDocument } from '@/lib/uncefact/models';
import { InvoiceLayout } from '@/lib/uncefact/layout';

export interface DocumentHandlers {
  handlePartyChange: (party: 'seller' | 'buyer', field: string, value: string) => void;
  handleAddressChange: (party: 'seller' | 'buyer', field: string, value: string) => void;
  handleLineChange: (index: number, field: string, value: any) => void;
  handleLookup: (party: 'seller' | 'buyer') => Promise<void>;
  lookupParty: 'seller' | 'buyer' | null;
  isLookingUp: boolean;
  addLineItem: () => void;
  removeLineItem: (index: number) => void;
  setDocument: React.Dispatch<React.SetStateAction<TradeDocument>>;
}

export interface LayoutProps {
  document: TradeDocument;
  layout: InvoiceLayout;
  isEditing: boolean;
  handlers: DocumentHandlers;
}
