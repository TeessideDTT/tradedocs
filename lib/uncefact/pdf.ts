import { PDFDocument, PDFName, decodePDFRawStream } from 'pdf-lib';
import { getDocumentProxy } from 'unpdf';
import { Invoice, PackingList, TradeDocument } from './models';
import { InvoiceLayout, UK_LAYOUT } from './layout';
import { generateInvoiceXML, generatePackingListXML } from './xml';
import { invoiceToJsonLd, jsonLdToInvoice, packingListToJsonLd, jsonLdToPackingList } from './jsonld';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import stringify from 'json-stringify-deterministic';
import { storage } from '#imports';

function wrapCdata(value: string): string {
  return value.replaceAll(']]>', ']]]]><![CDATA[>');
}

function escapeXml(value: string | undefined): string {
  if (!value) return '';
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function buildVerificationXmpMetadata(
  jsonLdStr: string,
  doc: TradeDocument,
  layoutId: string,
  hash?: string,
  timestamp?: string,
  ciiXmlStr?: string,
) {
  const metadataDate = new Date().toISOString();
  const docId = escapeXml(doc.data.id);
  const currency = doc.type === 'invoice' ? escapeXml((doc.data as Invoice).currency) : '';
  const safeLayoutId = escapeXml(layoutId);
  const safeHash = hash ? escapeXml(hash) : '';
  const safeTimestamp = timestamp ? escapeXml(timestamp) : '';
  const title = doc.type === 'invoice' ? `Invoice ${docId}` : `Packing List ${docId}`;

  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:xmp="http://ns.adobe.com/xap/1.0/"
      xmlns:pdf="http://ns.adobe.com/pdf/1.3/"
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:tradedocs="https://tradedocs.app/ns/pdf/1.0/">
      <xmp:MetadataDate>${metadataDate}</xmp:MetadataDate>
      <xmp:ModifyDate>${metadataDate}</xmp:ModifyDate>
      <pdf:Producer>TradeDocs</pdf:Producer>
      <dc:format>application/pdf</dc:format>
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${title}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <tradedocs:invoiceId>${docId}</tradedocs:invoiceId>
      ${currency ? `<tradedocs:currency>${currency}</tradedocs:currency>` : ''}
      <tradedocs:layoutId>${safeLayoutId}</tradedocs:layoutId>
      ${hash ? `<tradedocs:verificationHash>${safeHash}</tradedocs:verificationHash>` : ''}
      ${timestamp ? `<tradedocs:verificationTimestamp>${safeTimestamp}</tradedocs:verificationTimestamp>` : ''}
      <tradedocs:jsonld><![CDATA[${wrapCdata(jsonLdStr)}]]></tradedocs:jsonld>
      ${ciiXmlStr ? `<tradedocs:ciiXml><![CDATA[${wrapCdata(ciiXmlStr)}]]></tradedocs:ciiXml>` : ''}
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

function setPdfXmpMetadata(pdfDoc: PDFDocument, xmpMetadata: string) {
  const metadataStream = pdfDoc.context.stream(xmpMetadata, {
    Type: 'Metadata',
    Subtype: 'XML',
  });
  const metadataRef = pdfDoc.context.register(metadataStream);
  pdfDoc.catalog.set(PDFName.of('Metadata'), metadataRef);
}

function normalizeForHashing(val: any, parentKey?: string): any {
  if (val === null || val === undefined) {
    return undefined;
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (Array.isArray(val)) {
    return val.map(v => normalizeForHashing(v, parentKey)).filter(v => v !== undefined);
  }
  if (typeof val === 'object') {
    const res: any = {};
    for (const key of Object.keys(val)) {
      if ((parentKey === 'buyer' || parentKey === 'seller') && key === 'id') {
        continue;
      }
      const normalized = normalizeForHashing(val[key], key);
      if (normalized !== undefined && normalized !== '') {
        res[key] = normalized;
      }
    }
    return res;
  }
  return val;
}


export async function generateInvoicePdf(
  doc: TradeDocument,
  layout: InvoiceLayout = UK_LAYOUT,
  elementToCapture?: HTMLElement | null,
  options: {
    wasEdited?: boolean;
    isTemplate?: boolean;
    hasExistingVerification?: boolean;
    existingVerificationHash?: string;
    existingVerificationTimestamp?: string;
  } = {}
): Promise<Uint8Array> {
  let basePdfBytes: ArrayBuffer;

  const {
    wasEdited = false,
    isTemplate = false,
    hasExistingVerification = false,
    existingVerificationHash,
    existingVerificationTimestamp,
  } = options;

  let hashHex = existingVerificationHash;
  let timestamp = existingVerificationTimestamp;

  const shouldGenerateVerification = !isTemplate && (wasEdited || !hasExistingVerification);

  if (shouldGenerateVerification) {
    timestamp = new Date().toISOString();
    const docJson = stringify({ ...normalizeForHashing(doc.data), timestamp });
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(docJson));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log("GENERATION DEBUG:");
    console.log("Generated HashHex:", hashHex);
    console.log("Serialized JSON being hashed during generation:", docJson);
  }

  if (elementToCapture) {
    // Capture the HTML element directly using modern html-to-image which supports new CSS
    const imgData = await htmlToImage.toJpeg(elementToCapture, {
      quality: 1.0,
      backgroundColor: '#ffffff',
      pixelRatio: 2,
    });
    
    // Create PDF with exact aspect ratio
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });
    
    // Calculate dimensions manually
    const elementWidth = elementToCapture.offsetWidth;
    const elementHeight = elementToCapture.offsetHeight;
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (elementHeight * pdfWidth) / elementWidth;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    if (hashHex && timestamp) {
      const pageHeight = pdf.internal.pageSize.getHeight();
      const qrData = `Document Hash: ${hashHex}\nGenerated: ${timestamp}`;
      const qrDataUrl = await QRCode.toDataURL(qrData, { margin: 1, scale: 4 });
      
      const qrSize = 50; 
      const x = pdfWidth - qrSize - 20; 
      const y = pageHeight - qrSize - 20; 
      
      pdf.addImage(qrDataUrl, 'PNG', x, y, qrSize, qrSize);
    }
    
    basePdfBytes = pdf.output('arraybuffer');
  } else {
    // Fallback empty document if no HTML element is provided
    const fallbackPdf = await PDFDocument.create();
    fallbackPdf.addPage();
    const fallbackBytes = await fallbackPdf.save();
    basePdfBytes = fallbackBytes.buffer.slice(fallbackBytes.byteOffset, fallbackBytes.byteOffset + fallbackBytes.byteLength) as ArrayBuffer;
  }

  // Load the generated PDF into pdf-lib to attach metadata
  const pdfDoc = await PDFDocument.load(basePdfBytes);

  // Retrieve user's preferred export mode from storage
  const exportMode = await storage.getItem<string>('local:pdf_export_mode') || 'both';

  // Embed JSON-LD and CII XML depending on configuration
  const ciiXmlStr = doc.type === 'invoice' ? generateInvoiceXML(doc.data) : generatePackingListXML(doc.data);
  const jsonLdStr = doc.type === 'invoice' ? invoiceToJsonLd(doc.data, hashHex, timestamp) : packingListToJsonLd(doc.data, hashHex, timestamp);

  if (exportMode === 'metadata' || exportMode === 'both') {
    const includeXmlInMeta = exportMode === 'metadata';
    const xmpMetadata = buildVerificationXmpMetadata(
      jsonLdStr,
      doc,
      layout.id,
      hashHex,
      timestamp,
      includeXmlInMeta ? ciiXmlStr : undefined
    );
    setPdfXmpMetadata(pdfDoc, xmpMetadata);
  }

  if (exportMode === 'attachment' || exportMode === 'both') {
    await pdfDoc.attach(new TextEncoder().encode(ciiXmlStr), doc.type === 'invoice' ? 'factur-x.xml' : 'packing-list-cii.xml', {
      mimeType: 'application/xml',
      description: doc.type === 'invoice' ? 'UN/CEFACT Cross Industry Invoice (CII)' : 'UN/CEFACT CII Packing List',
      creationDate: new Date(),
      modificationDate: new Date(),
    });

    await pdfDoc.attach(new TextEncoder().encode(jsonLdStr), 'metadata.jsonld', {
      mimeType: 'application/ld+json',
      description: 'Schema.org JSON-LD Metadata',
      creationDate: new Date(),
      modificationDate: new Date(),
    });

    const tradedocsMeta = JSON.stringify({ layoutId: layout.id, documentType: doc.type });
    await pdfDoc.attach(new TextEncoder().encode(tradedocsMeta), 'tradedocs.json', {
      mimeType: 'application/json',
      description: 'TradeDocs App Metadata',
      creationDate: new Date(),
      modificationDate: new Date(),
    });
  }

  const finalPdfBytes = await pdfDoc.save();

  return finalPdfBytes;
}

export async function extractInvoiceDataFromPdf(fileBuffer: ArrayBuffer): Promise<{
  document: TradeDocument,
  layoutId?: string,
  isTampered?: boolean,
  hasVerification?: boolean,
  verificationHash?: string,
  verificationTimestamp?: string
}> {
  const fileBufferCopy = fileBuffer.slice(0);

  let pdf;
  try {
    const uint8Array = new Uint8Array(fileBuffer);
    pdf = await getDocumentProxy(uint8Array);
  } catch (error) {
    throw new Error("Invalid or corrupted PDF file.");
  }
  
  let jsonLdString = '';
  let layoutId: string | undefined;

  let attachmentJsonLd = '';
  // 1. Try to read from PDF/A-3 Attachments first
  let attachments;
  try {
    attachments = await pdf.getAttachments();
  } catch (e) {
    console.warn("Failed to read attachments, trying XMP metadata fallback", e);
  }

  if (attachments && Object.keys(attachments).length > 0) {
    const jsonFileName = Object.keys(attachments).find(name => name.endsWith('.jsonld') || (name.endsWith('.json') && name !== 'tradedocs.json'));
    if (jsonFileName) {
      try {
        const attachment = attachments[jsonFileName];
        attachmentJsonLd = new TextDecoder().decode(attachment.content);
        jsonLdString = attachmentJsonLd;
      } catch (e) {
        console.warn("Failed to decode JSON-LD attachment content", e);
      }
    }
    if (attachments['tradedocs.json']) {
      try {
        const tdMetaStr = new TextDecoder().decode(attachments['tradedocs.json'].content);
        const parsed = JSON.parse(tdMetaStr);
        layoutId = parsed.layoutId;
      } catch (e) {
        console.warn("Could not parse tradedocs.json metadata", e);
      }
    }
  }

  // 2. Read from XMP stream regardless to compare
  let xmpJsonLd = '';
  let rawXmp = '';
  try {
    const pdfDoc = await PDFDocument.load(fileBufferCopy);
    const catalog = pdfDoc.catalog;
    const metadataRef = catalog.get(PDFName.of('Metadata'));
    if (metadataRef) {
      const stream = pdfDoc.context.lookup(metadataRef);
      if (stream && typeof (stream as any).getContents === 'function') {
        const contents = (stream as any).getContents();
        const filter = (stream as any).dict?.get(PDFName.of('Filter'));
        if (filter === PDFName.of('FlateDecode')) {
          try {
            const decodedStream = decodePDFRawStream(stream as any);
            const bytes = (decodedStream as any).getBytes();
            rawXmp = new TextDecoder('utf-8').decode(bytes);
          } catch (decompError) {
            console.error("decodePDFRawStream failed", decompError);
          }
        } else {
          rawXmp = new TextDecoder('utf-8').decode(contents);
        }
      }
    }
  } catch (e) {
    console.warn("pdf-lib metadata extraction failed, trying raw text scan fallback", e);
  }

  if (!rawXmp) {
    try {
      const text = new TextDecoder().decode(new Uint8Array(fileBufferCopy));
      const start = text.indexOf('<x:xmpmeta');
      const end = text.indexOf('</x:xmpmeta>');
      if (start !== -1 && end !== -1) {
        rawXmp = text.slice(start, end + 12);
      }
    } catch (e) {
      console.warn("Buffer decoding failed", e);
    }
  }

  if (rawXmp) {
    const jsonLdMatch = rawXmp.match(/<tradedocs:jsonld>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/tradedocs:jsonld>/);
    if (jsonLdMatch && jsonLdMatch[1]) {
      xmpJsonLd = jsonLdMatch[1].trim();
    } else {
      const simpleMatch = rawXmp.match(/<tradedocs:jsonld>([\s\S]*?)<\/tradedocs:jsonld>/);
      if (simpleMatch && simpleMatch[1]) {
        xmpJsonLd = simpleMatch[1].trim();
      }
    }
    if (!layoutId) {
      const layoutMatch = rawXmp.match(/<tradedocs:layoutId>(.*?)<\/tradedocs:layoutId>/);
      if (layoutMatch && layoutMatch[1]) {
        layoutId = layoutMatch[1].trim();
      }
    }
  }

  console.log("COMPARISON DEBUG:");
  console.log("Attachment JSON-LD string:", JSON.stringify(attachmentJsonLd));
  console.log("XMP JSON-LD string:", JSON.stringify(xmpJsonLd));
  console.log("Are they equal?:", attachmentJsonLd === xmpJsonLd);

  if (!jsonLdString) {
    jsonLdString = xmpJsonLd;
  }
  
  if (!jsonLdString) {
      throw new Error("No trade document metadata found. Ensure the document was exported with TradeDocs metadata or attachments.");
  }
  
  try {
    const parsed = JSON.parse(jsonLdString);
    const documentType = parsed.typeCode === '271' ? 'packing_list' : 'invoice';
    
    let doc: TradeDocument;
    if (documentType === 'invoice') {
      doc = { type: 'invoice', data: jsonLdToInvoice(parsed) };
    } else {
      doc = { type: 'packing_list', data: jsonLdToPackingList(parsed) };
    }

    let isTampered = false;
    let hasVerification = false;

    if (parsed.verificationHash && parsed.verificationTimestamp) {
       hasVerification = true;
       const docJson = stringify({ ...normalizeForHashing(doc.data), timestamp: parsed.verificationTimestamp });
       const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(docJson));
       const hashArray = Array.from(new Uint8Array(hashBuffer));
       const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
       
       console.log("VERIFICATION DEBUG:");
       console.log("Parsed Verification Hash from PDF:", parsed.verificationHash);
       console.log("Calculated Hash:", hashHex);
       console.log("Serialized JSON being hashed:", docJson);
       
       if (hashHex !== parsed.verificationHash) {
          isTampered = true;
       }
    }

    return {
      document: doc,
      layoutId,
      isTampered,
      hasVerification,
      verificationHash: parsed.verificationHash,
      verificationTimestamp: parsed.verificationTimestamp,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("The embedded JSON-LD metadata is malformed and could not be parsed.");
    }
    throw new Error(`Failed to extract trade document data: ${(error as Error).message}`);
  }
}
