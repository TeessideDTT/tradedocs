export interface Party {
  id?: string;
  name: string;
  address?: {
    street?: string;
    city?: string;
    postcode?: string;
    countryCode: string; // ISO 3166-1 alpha-2
  };
  taxId?: string;
}

export interface InvoiceLine {
  id: string;
  name: string;
  quantity: number;
  unitCode: string; // e.g., C62 for pieces, H87 for hours
  unitPrice: number;
  amount: number;
  taxCategoryCode?: string; // e.g., S for standard
  taxRate?: number;
  hsCode?: string; // Harmonized System Code for cross-border trade
}

export interface Invoice {
  id: string;
  issueDate: Date;
  typeCode: string; // 380 for Commercial Invoice
  currency: string; // ISO 4217
  
  seller: Party;
  buyer: Party;
  
  lines: InvoiceLine[];
  
  totals: {
    lineTotalAmount: number;
    taxTotalAmount: number;
    grandTotalAmount: number;
    duePayableAmount: number;
  };
}

export const DEFAULT_INVOICE: Invoice = {
  id: 'INV-001',
  issueDate: new Date(),
  typeCode: '380',
  currency: 'EUR',
  seller: {
    name: 'Seller Name',
    address: {
      street: 'Seller Street',
      city: 'Seller City',
      postcode: '12345',
      countryCode: 'DE',
    },
  },
  buyer: {
    name: 'Buyer Name',
    address: {
      street: 'Buyer Street',
      city: 'Buyer City',
      postcode: '67890',
      countryCode: 'FR',
    },
  },
  lines: [
    {
      id: '1',
      name: 'Item 1',
      quantity: 1,
      unitCode: 'C62',
      unitPrice: 100,
      amount: 100,
      taxCategoryCode: 'S',
      taxRate: 19,
      hsCode: '8517.62', // Example HS Code
    },
  ],
  totals: {
    lineTotalAmount: 100,
    taxTotalAmount: 19,
    grandTotalAmount: 119,
    duePayableAmount: 119,
  },
};
