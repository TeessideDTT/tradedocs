import { Invoice } from './models';

/**
 * Converts an internal Invoice model (JSON) into a Schema.org compliant JSON-LD string.
 */
export function invoiceToJsonLd(invoice: Invoice): string {
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "Invoice",
    "identifier": invoice.id,
    "paymentDueDate": invoice.issueDate.toISOString(),
    "currency": invoice.currency,
    "typeCode": invoice.typeCode,
    "totalPaymentDue": {
      "@type": "PriceSpecification",
      "price": invoice.totals.duePayableAmount,
      "priceCurrency": invoice.currency,
      "valueAddedTaxIncluded": true
    },
    "provider": {
      "@type": "Organization",
      "name": invoice.seller.name,
      "taxID": invoice.seller.taxId,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": invoice.seller.address?.street,
        "addressLocality": invoice.seller.address?.city,
        "postalCode": invoice.seller.address?.postcode,
        "addressCountry": invoice.seller.address?.countryCode
      }
    },
    "customer": {
      "@type": "Organization",
      "name": invoice.buyer.name,
      "taxID": invoice.buyer.taxId,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": invoice.buyer.address?.street,
        "addressLocality": invoice.buyer.address?.city,
        "postalCode": invoice.buyer.address?.postcode,
        "addressCountry": invoice.buyer.address?.countryCode
      }
    },
    "referencesOrder": invoice.lines.map(line => ({
      "@type": "OrderItem",
      "orderedItem": {
        "@type": "Product",
        "name": line.name,
        "identifier": line.hsCode,
        "unitCode": line.unitCode
      },
      "orderQuantity": line.quantity,
      "priceCurrency": invoice.currency,
      "price": line.unitPrice,
      "taxRate": line.taxRate,
      "taxCategoryCode": line.taxCategoryCode,
      "amount": line.amount
    })),
    "totals": {
      "lineTotalAmount": invoice.totals.lineTotalAmount,
      "taxTotalAmount": invoice.totals.taxTotalAmount,
      "grandTotalAmount": invoice.totals.grandTotalAmount,
      "duePayableAmount": invoice.totals.duePayableAmount
    }
  };

  return JSON.stringify(jsonld, null, 2);
}

/**
 * Converts a parsed Schema.org JSON-LD object back into the internal Invoice model (JSON).
 */
export function jsonLdToInvoice(parsed: any): Partial<Invoice> {
  return {
    id: parsed.identifier || `INV-${Date.now()}`,
    issueDate: parsed.paymentDueDate ? new Date(parsed.paymentDueDate) : new Date(),
    currency: parsed.currency || parsed.totalPaymentDue?.priceCurrency || 'EUR',
    typeCode: parsed.typeCode || '380',
    seller: {
      name: parsed.provider?.name || '',
      taxId: parsed.provider?.taxID || '',
      address: {
        street: parsed.provider?.address?.streetAddress || '',
        city: parsed.provider?.address?.addressLocality || '',
        postcode: parsed.provider?.address?.postalCode || '',
        countryCode: parsed.provider?.address?.addressCountry || '',
      }
    },
    buyer: {
      name: parsed.customer?.name || '',
      taxId: parsed.customer?.taxID || '',
      address: {
        street: parsed.customer?.address?.streetAddress || '',
        city: parsed.customer?.address?.addressLocality || '',
        postcode: parsed.customer?.address?.postalCode || '',
        countryCode: parsed.customer?.address?.addressCountry || '',
      }
    },
    lines: (parsed.referencesOrder || []).map((item: any, i: number) => ({
      id: `line-${i}`,
      name: item.orderedItem?.name || '',
      hsCode: item.orderedItem?.identifier || '',
      unitCode: item.orderedItem?.unitCode || 'C62',
      quantity: item.orderQuantity || 1,
      unitPrice: item.price || 0,
      amount: item.amount || ((item.orderQuantity || 1) * (item.price || 0)),
      taxRate: item.taxRate || 0,
      taxCategoryCode: item.taxCategoryCode || 'S',
    })),
    totals: parsed.totals ? {
      lineTotalAmount: parsed.totals.lineTotalAmount || 0,
      taxTotalAmount: parsed.totals.taxTotalAmount || 0,
      grandTotalAmount: parsed.totals.grandTotalAmount || 0,
      duePayableAmount: parsed.totals.duePayableAmount || 0,
    } : undefined
  };
}
