import { Invoice } from './models';

/**
 * Converts an internal Invoice model (JSON) into a Schema.org compliant JSON-LD string.
 */
export function invoiceToJsonLd(invoice: Invoice, hash?: string, timestamp?: string): string {
  const jsonld: any = {
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

  if (hash && timestamp) {
    jsonld["verificationHash"] = hash;
    jsonld["verificationTimestamp"] = timestamp;
  }

  return JSON.stringify(jsonld, null, 2);
}

/**
 * Converts a parsed Schema.org JSON-LD object back into the internal Invoice model (JSON).
 */
export function jsonLdToInvoice(parsed: any): Partial<Invoice> {
  // Validate that this is actually an Invoice JSON-LD document
  if (
    !parsed || 
    typeof parsed !== 'object' || 
    parsed['@context'] !== 'https://schema.org' || 
    parsed['@type'] !== 'Invoice'
  ) {
    throw new Error("Invalid JSON-LD document structure for the invoice. Missing required Schema.org context or type.");
  }

  // Basic validation for required fields
  const missingFields: string[] = [];

  // Core UN/CEFACT requirements mapped to our JSON-LD structure
  if (!parsed.identifier) missingFields.push("Invoice Number (identifier)");
  if (!parsed.paymentDueDate) missingFields.push("Issue Date (paymentDueDate)");
  if (!parsed.currency && !parsed.totalPaymentDue?.priceCurrency) missingFields.push("Currency (currency or totalPaymentDue.priceCurrency)");
  
  if (!parsed.provider?.name) missingFields.push("Seller Name (provider.name)");
  if (!parsed.provider?.address?.addressCountry) missingFields.push("Seller Country Code (provider.address.addressCountry)");
  
  if (!parsed.customer?.name) missingFields.push("Buyer Name (customer.name)");
  if (!parsed.customer?.address?.addressCountry) missingFields.push("Buyer Country Code (customer.address.addressCountry)");

  if (!parsed.referencesOrder || !Array.isArray(parsed.referencesOrder) || parsed.referencesOrder.length === 0) {
     missingFields.push("Line Items (referencesOrder)");
  } else {
     // Validate that at least the first line item has mandatory fields
     const firstLine = parsed.referencesOrder[0];
     if (!firstLine.orderedItem?.name) missingFields.push("Line Item Description (orderedItem.name)");
     if (firstLine.price === undefined) missingFields.push("Line Item Price (price)");
     if (firstLine.orderQuantity === undefined) missingFields.push("Line Item Quantity (orderQuantity)");
  }

  if (!parsed.totals || parsed.totals.duePayableAmount === undefined) {
      if (!parsed.totalPaymentDue?.price) {
          missingFields.push("Total Amount (totals.duePayableAmount or totalPaymentDue.price)");
      }
  }

  if (missingFields.length > 0) {
    throw new Error(`Invalid UN/CEFACT CII document structure. Missing mandatory fields:\n- ${missingFields.join('\n- ')}`);
  }

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
      amount: item.amount !== undefined ? item.amount : ((item.orderQuantity || 1) * (item.price || 0)),
      taxRate: item.taxRate !== undefined ? item.taxRate : 0,
      taxCategoryCode: item.taxCategoryCode || 'S',
    })),
    totals: parsed.totals ? {
      lineTotalAmount: parsed.totals.lineTotalAmount !== undefined ? parsed.totals.lineTotalAmount : 0,
      taxTotalAmount: parsed.totals.taxTotalAmount !== undefined ? parsed.totals.taxTotalAmount : 0,
      grandTotalAmount: parsed.totals.grandTotalAmount !== undefined ? parsed.totals.grandTotalAmount : 0,
      duePayableAmount: parsed.totals.duePayableAmount !== undefined ? parsed.totals.duePayableAmount : 0,
    } : undefined
  };
}
