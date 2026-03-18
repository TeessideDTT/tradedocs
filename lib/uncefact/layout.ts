import { Invoice } from './models';

export type Alignment = 'left' | 'right' | 'center';

export interface BoxPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
  align?: Alignment;
}

export interface InvoiceLayout {
  id: string;
  name: string;
  countryCode: string; // ISO 3166-1 alpha-2
  description: string;
  
  // Design elements
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
  };
  
  font: {
    heading: string;
    body: string;
  };

  // Structural configuration
  structure: {
    logo: BoxPosition;
    senderAddress: BoxPosition;
    recipientAddress: BoxPosition;
    invoiceDetails: BoxPosition; // Invoice #, Date, etc.
    lineItems: {
      startY: number;
      columns: {
        field: keyof InvoiceLineItemDisplay; // Helper type below
        header: string;
        width: number;
        align: Alignment;
      }[];
    };
    totals: BoxPosition;
    footer: BoxPosition;
  };
  
  // Text labels localization
  labels: {
    invoiceTitle: string;
    date: string;
    dueDate: string;
    billTo: string;
    shipTo: string;
    total: string;
    tax: string;
  };
}

// Helper for column mapping
export interface InvoiceLineItemDisplay {
  name: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  total: number;
  hsCode?: string; // Add hsCode
}

export const UK_LAYOUT: InvoiceLayout = {
  id: 'uk-standard',
  name: 'UK Standard',
  countryCode: 'GB',
  description: 'Clean layout compliant with HMRC requirements',
  colors: {
    primary: '#003399',
    secondary: '#f3f4f6',
    text: '#111827',
    background: '#ffffff',
  },
  font: {
    heading: 'Helvetica-Bold',
    body: 'Helvetica',
  },
  structure: {
    logo: { x: 50, y: 750, width: 100, height: 50, align: 'left' },
    senderAddress: { x: 50, y: 700, width: 250, align: 'left' },
    invoiceDetails: { x: 350, y: 750, width: 200, align: 'right' },
    recipientAddress: { x: 50, y: 600, width: 250, align: 'left' },
    lineItems: {
      startY: 500,
      columns: [
        { field: 'name', header: 'Description', width: 200, align: 'left' },
        { field: 'hsCode', header: 'HS Code', width: 70, align: 'left' },
        { field: 'quantity', header: 'Qty', width: 40, align: 'right' },
        { field: 'unitPrice', header: 'Price', width: 70, align: 'right' },
        { field: 'tax', header: 'VAT', width: 50, align: 'right' },
        { field: 'total', header: 'Amount', width: 70, align: 'right' },
      ],
    },
    totals: { x: 350, y: 200, width: 200, align: 'right' },
    footer: { x: 50, y: 50, width: 500, align: 'center' },
  },
  labels: {
    invoiceTitle: 'INVOICE',
    date: 'Invoice Date',
    dueDate: 'Due Date',
    billTo: 'Bill To:',
    shipTo: 'Ship To:',
    total: 'Total GBP',
    tax: 'VAT',
  },
};

export const US_LAYOUT: InvoiceLayout = {
  id: 'us-corporate',
  name: 'US Corporate',
  countryCode: 'US',
  description: 'Professional US style with tax at the bottom',
  colors: {
    primary: '#2d3748',
    secondary: '#edf2f7',
    text: '#1a202c',
    background: '#ffffff',
  },
  font: {
    heading: 'Times-Bold',
    body: 'Times-Roman',
  },
  structure: {
    logo: { x: 450, y: 750, width: 100, height: 50, align: 'right' },
    senderAddress: { x: 450, y: 700, width: 200, align: 'right' },
    invoiceDetails: { x: 50, y: 750, width: 200, align: 'left' },
    recipientAddress: { x: 50, y: 650, width: 250, align: 'left' },
    lineItems: {
      startY: 550,
      columns: [
        { field: 'name', header: 'Item', width: 200, align: 'left' },
        { field: 'hsCode', header: 'HS Code', width: 70, align: 'left' },
        { field: 'quantity', header: 'Qty', width: 50, align: 'center' },
        { field: 'unitPrice', header: 'Rate', width: 90, align: 'right' },
        { field: 'total', header: 'Amount', width: 90, align: 'right' },
      ],
    },
    totals: { x: 350, y: 200, width: 200, align: 'right' },
    footer: { x: 50, y: 40, width: 500, align: 'center' },
  },
  labels: {
    invoiceTitle: 'INVOICE',
    date: 'Date',
    dueDate: 'Payment Due',
    billTo: 'Bill To',
    shipTo: 'Ship To',
    total: 'Total',
    tax: 'Tax',
  },
};

export const DE_LAYOUT: InvoiceLayout = {
  id: 'de-standard',
  name: 'German Standard',
  countryCode: 'DE',
  description: 'DIN 5008 inspired layout',
  colors: {
    primary: '#000000',
    secondary: '#e5e5e5',
    text: '#000000',
    background: '#ffffff',
  },
  font: {
    heading: 'Helvetica-Bold',
    body: 'Helvetica',
  },
  structure: {
    senderAddress: { x: 50, y: 750, width: 200, align: 'left' }, // Small sender line above address
    logo: { x: 400, y: 750, width: 150, height: 50, align: 'right' },
    recipientAddress: { x: 50, y: 680, width: 250, align: 'left' },
    invoiceDetails: { x: 350, y: 650, width: 200, align: 'left' },
    lineItems: {
      startY: 500,
      columns: [
        { field: 'name', header: 'Bezeichnung', width: 170, align: 'left' },
        { field: 'hsCode', header: 'Zolltarifnr.', width: 80, align: 'left' },
        { field: 'quantity', header: 'Menge', width: 50, align: 'right' },
        { field: 'unitPrice', header: 'Einzelpreis', width: 70, align: 'right' },
        { field: 'tax', header: 'MwSt', width: 50, align: 'right' },
        { field: 'total', header: 'Gesamt', width: 80, align: 'right' },
      ],
    },
    totals: { x: 350, y: 250, width: 200, align: 'right' },
    footer: { x: 50, y: 60, width: 500, align: 'left' },
  },
  labels: {
    invoiceTitle: 'RECHNUNG',
    date: 'Rechnungsdatum',
    dueDate: 'Fälligkeitsdatum',
    billTo: 'Rechnungsempfänger',
    shipTo: 'Lieferadresse',
    total: 'Gesamtbetrag',
    tax: 'MwSt',
  },
};

export const LAYOUTS = [UK_LAYOUT, US_LAYOUT, DE_LAYOUT];
