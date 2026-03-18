import { PDFDocument } from 'pdf-lib';
import { getDocumentProxy } from 'unpdf';
import { Invoice } from './models';
import { InvoiceLayout, UK_LAYOUT } from './layout';
import { generateCIIXML } from './xml';
import { invoiceToJsonLd, jsonLdToInvoice } from './jsonld';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

export async function generateInvoicePdf(
  invoice: Invoice,
  layout: InvoiceLayout = UK_LAYOUT,
  elementToCapture?: HTMLElement | null
): Promise<Uint8Array> {
  
  let basePdfBytes: ArrayBuffer;

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
    
    // We need to calculate dimensions manually because the base64 doesn't give us raw element sizes
    // We'll use the element's actual DOM sizes to determine aspect ratio
    const elementWidth = elementToCapture.offsetWidth;
    const elementHeight = elementToCapture.offsetHeight;
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    // Scale height proportionally to fit the PDF width
    const pdfHeight = (elementHeight * pdfWidth) / elementWidth;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    basePdfBytes = pdf.output('arraybuffer');
  } else {
    // Fallback empty document if no HTML element is provided
    const fallbackPdf = await PDFDocument.create();
    fallbackPdf.addPage();
    const fallbackBytes = await fallbackPdf.save();
    // Convert Uint8Array to ArrayBuffer safely
    basePdfBytes = fallbackBytes.buffer.slice(fallbackBytes.byteOffset, fallbackBytes.byteOffset + fallbackBytes.byteLength) as ArrayBuffer;
  }

  // Load the generated PDF into pdf-lib to attach metadata
  const pdfDoc = await PDFDocument.load(basePdfBytes);

  // Embed JSON-LD and CII XML for PDF/A-3 Compliance
  const ciiXmlStr = generateCIIXML(invoice);
  const jsonLdStr = invoiceToJsonLd(invoice);

  await pdfDoc.attach(new TextEncoder().encode(ciiXmlStr), 'factur-x.xml', {
    mimeType: 'application/xml',
    description: 'UN/CEFACT Cross Industry Invoice (CII)',
    creationDate: new Date(),
    modificationDate: new Date(),
  });

  await pdfDoc.attach(new TextEncoder().encode(jsonLdStr), 'metadata.jsonld', {
    mimeType: 'application/ld+json',
    description: 'Schema.org JSON-LD Metadata',
    creationDate: new Date(),
    modificationDate: new Date(),
  });

  const finalPdfBytes = await pdfDoc.save();
  return finalPdfBytes;
}

export async function extractInvoiceDataFromPdf(fileBuffer: ArrayBuffer): Promise<Partial<Invoice>> {
  let pdf;
  try {
    const uint8Array = new Uint8Array(fileBuffer);
    pdf = await getDocumentProxy(uint8Array);
  } catch (error) {
    throw new Error("Invalid or corrupted PDF file.");
  }
  
  // PDF/A-3 stores files in the Attachments (EmbeddedFiles) tree
  const attachments = await pdf.getAttachments();
  
  if (!attachments || Object.keys(attachments).length === 0) {
     throw new Error("No attachments found in this PDF. Please ensure it is a valid PDF/A-3 document with embedded metadata.");
  }
  
  // Look for any file ending in .jsonld or metadata.jsonld
  const jsonFileName = Object.keys(attachments).find(name => name.endsWith('.jsonld') || name.endsWith('.json'));
  
  if (!jsonFileName) {
      throw new Error("No JSON-LD metadata attachment found. Ensure the document was exported with TradeDocs or contains standard 'metadata.jsonld'.");
  }
  
  try {
    const attachment = attachments[jsonFileName];
    const decoder = new TextDecoder();
    const jsonLdString = decoder.decode(attachment.content);

    if (!jsonLdString) {
      throw new Error("The attached JSON-LD file is empty.");
    }

    const parsed = JSON.parse(jsonLdString);
    return jsonLdToInvoice(parsed);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("The embedded JSON-LD metadata is malformed and could not be parsed.");
    }
    throw new Error(`Failed to extract invoice data: ${(error as Error).message}`);
  }
}
