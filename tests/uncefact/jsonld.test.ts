import { describe, expect, it } from 'vitest';
import {
  invoiceToJsonLd,
  jsonLdToInvoice,
  jsonLdToPackingList,
  packingListToJsonLd,
} from '@/lib/uncefact/jsonld';
import { DEFAULT_INVOICE, DEFAULT_PACKING_LIST } from '@/lib/uncefact/models';

describe('jsonld transforms', () => {
  it('round-trips an invoice and preserves verification fields and zero tax values', () => {
    const issueDate = new Date('2026-07-10T12:00:00.000Z');
    const invoice = {
      ...DEFAULT_INVOICE,
      id: 'INV-2026-001',
      issueDate,
      currency: 'USD',
      seller: {
        ...DEFAULT_INVOICE.seller,
        name: 'Acme Export Ltd',
      },
      buyer: {
        ...DEFAULT_INVOICE.buyer,
        name: 'Global Imports Pte',
      },
      lines: [
        {
          id: 'line-1',
          name: 'Industrial sensor',
          hsCode: '9031.80',
          unitCode: 'C62',
          quantity: 2,
          unitPrice: 125,
          amount: 250,
          taxRate: 0,
          taxCategoryCode: 'Z',
        },
      ],
      totals: {
        lineTotalAmount: 250,
        taxTotalAmount: 0,
        grandTotalAmount: 250,
        duePayableAmount: 250,
      },
    };

    const json = invoiceToJsonLd(invoice, 'hash-123', '2026-07-10T12:30:00.000Z');
    const parsed = JSON.parse(json);

    expect(parsed.verificationHash).toBe('hash-123');
    expect(parsed.verificationTimestamp).toBe('2026-07-10T12:30:00.000Z');
    expect(parsed.referencesOrder[0].taxRate).toBe(0);

    const restored = jsonLdToInvoice(parsed);

    expect(restored.id).toBe(invoice.id);
    expect(restored.issueDate.toISOString()).toBe(issueDate.toISOString());
    expect(restored.currency).toBe('USD');
    expect(restored.lines).toHaveLength(1);
    expect(restored.lines[0].hsCode).toBe('9031.80');
    expect(restored.lines[0].taxRate).toBe(0);
    expect(restored.totals.taxTotalAmount).toBe(0);
    expect(restored.totals.duePayableAmount).toBe(250);
  });

  it('rejects an invalid commercial invoice payload with missing mandatory fields', () => {
    expect(() =>
      jsonLdToInvoice({
        '@context': 'https://schema.org',
        '@type': 'Invoice',
        typeCode: '380',
        identifier: 'INV-BAD-001',
      })
    ).toThrow(/Invalid UN\/CEFACT Invoice structure/);
  });

  it('round-trips a packing list and preserves invoice reference and HS code', () => {
    const issueDate = new Date('2026-07-10T09:00:00.000Z');
    const packingList = {
      ...DEFAULT_PACKING_LIST,
      id: 'PL-2026-010',
      issueDate,
      invoiceId: 'INV-2026-001',
      lines: [
        {
          id: 'pkg-1',
          name: 'Sensor cartons',
          hsCode: '9031.80',
          unitCode: 'C62',
          quantity: 4,
        },
      ],
    };

    const json = packingListToJsonLd(packingList, 'hash-pack-1', '2026-07-10T09:30:00.000Z');
    const parsed = JSON.parse(json);

    expect(parsed.typeCode).toBe('271');
    expect(parsed.invoiceId).toBe('INV-2026-001');
    expect(parsed.verificationHash).toBe('hash-pack-1');

    const restored = jsonLdToPackingList(parsed);

    expect(restored.id).toBe(packingList.id);
    expect(restored.issueDate.toISOString()).toBe(issueDate.toISOString());
    expect(restored.invoiceId).toBe('INV-2026-001');
    expect(restored.lines[0].hsCode).toBe('9031.80');
    expect(restored.lines[0].quantity).toBe(4);
  });

  it('rejects a non-packing-list payload when parsing a packing list', () => {
    expect(() =>
      jsonLdToPackingList({
        '@context': 'https://schema.org',
        '@type': 'Invoice',
        typeCode: '380',
      })
    ).toThrow(/Invalid JSON-LD document structure for the packing list/);
  });
});
