import { Invoice, PackingList } from './models';

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
    "typeCode": "380",
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
 * Converts an internal PackingList model (JSON) into a Schema.org compliant JSON-LD string.
 */
export function packingListToJsonLd(packingList: PackingList, hash?: string, timestamp?: string): string {
  const jsonld: any = {
    "@context": "https://schema.org",
    "@type": "Invoice", // Schema.org does not have a distinct PackingList type; we reuse Invoice structure but strip financial details and tag TypeCode 271
    "identifier": packingList.id,
    "paymentDueDate": packingList.issueDate.toISOString(),
    "typeCode": "271",
    "invoiceId": packingList.invoiceId, // Standard key referencing commercial invoice
    "provider": {
      "@type": "Organization",
      "name": packingList.seller.name,
      "taxID": packingList.seller.taxId,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": packingList.seller.address?.street,
        "addressLocality": packingList.seller.address?.city,
        "postalCode": packingList.seller.address?.postcode,
        "addressCountry": packingList.seller.address?.countryCode
      }
    },
    "customer": {
      "@type": "Organization",
      "name": packingList.buyer.name,
      "taxID": packingList.buyer.taxId,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": packingList.buyer.address?.street,
        "addressLocality": packingList.buyer.address?.city,
        "postalCode": packingList.buyer.address?.postcode,
        "addressCountry": packingList.buyer.address?.countryCode
      }
    },
    "referencesOrder": packingList.lines.map(line => ({
      "@type": "OrderItem",
      "orderedItem": {
        "@type": "Product",
        "name": line.name,
        "identifier": line.hsCode,
        "unitCode": line.unitCode
      },
      "orderQuantity": line.quantity
    }))
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
export function jsonLdToInvoice(parsed: any): Invoice {
  if (
    !parsed || 
    typeof parsed !== 'object' || 
    parsed['@context'] !== 'https://schema.org' || 
    parsed['@type'] !== 'Invoice' ||
    parsed.typeCode === '271'
  ) {
    throw new Error("Invalid JSON-LD document structure for the commercial invoice.");
  }

  const missingFields: string[] = [];

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
    throw new Error(`Invalid UN/CEFACT Invoice structure. Missing fields:\n- ${missingFields.join('\n- ')}`);
  }

  return {
    id: parsed.identifier,
    issueDate: new Date(parsed.paymentDueDate),
    currency: parsed.currency || parsed.totalPaymentDue?.priceCurrency || 'EUR',
    typeCode: '380',
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
      id: item.id || `line-${i}`,
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
    } : {
      lineTotalAmount: 0,
      taxTotalAmount: 0,
      grandTotalAmount: 0,
      duePayableAmount: 0
    }
  };
}

/**
 * Converts a parsed Schema.org JSON-LD object back into the internal PackingList model (JSON).
 */
export function jsonLdToPackingList(parsed: any): PackingList {
  if (
    !parsed || 
    typeof parsed !== 'object' || 
    parsed['@context'] !== 'https://schema.org' || 
    parsed['@type'] !== 'Invoice' ||
    parsed.typeCode !== '271'
  ) {
    throw new Error("Invalid JSON-LD document structure for the packing list.");
  }

  const missingFields: string[] = [];

  if (!parsed.identifier) missingFields.push("Packing List Number (identifier)");
  if (!parsed.paymentDueDate) missingFields.push("Issue Date (paymentDueDate)");
  if (!parsed.provider?.name) missingFields.push("Seller Name (provider.name)");
  if (!parsed.provider?.address?.addressCountry) missingFields.push("Seller Country Code (provider.address.addressCountry)");
  if (!parsed.customer?.name) missingFields.push("Buyer Name (customer.name)");
  if (!parsed.customer?.address?.addressCountry) missingFields.push("Buyer Country Code (customer.address.addressCountry)");

  if (!parsed.referencesOrder || !Array.isArray(parsed.referencesOrder) || parsed.referencesOrder.length === 0) {
     missingFields.push("Line Items (referencesOrder)");
  } else {
     const firstLine = parsed.referencesOrder[0];
     if (!firstLine.orderedItem?.name) missingFields.push("Line Item Description (orderedItem.name)");
     if (firstLine.orderQuantity === undefined) missingFields.push("Line Item Quantity (orderQuantity)");
  }

  if (missingFields.length > 0) {
    throw new Error(`Invalid UN/CEFACT Packing List structure. Missing fields:\n- ${missingFields.join('\n- ')}`);
  }

  return {
    id: parsed.identifier,
    issueDate: new Date(parsed.paymentDueDate),
    typeCode: '271',
    invoiceId: parsed.invoiceId || undefined,
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
      id: item.id || `line-${i}`,
      name: item.orderedItem?.name || '',
      hsCode: item.orderedItem?.identifier || '',
      unitCode: item.orderedItem?.unitCode || 'C62',
      quantity: item.orderQuantity || 1
    }))
  };
}
