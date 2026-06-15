import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceLine, PackingList, PackingListLine, TradeDocument } from '@/lib/uncefact/models';
import { InvoiceLayout } from '@/lib/uncefact/layout';
import { StandardLayout } from './layouts/StandardLayout';
import { ModernLayout } from './layouts/ModernLayout';
import { MinimalLayout } from './layouts/MinimalLayout';
import { DocumentHandlers } from './layouts/types';
import { fetchCompanyDetails, fetchCityFromPostcode } from '@/lib/uncefact/api';
import { CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InvoiceFormProps {
  document: TradeDocument;
  layout: InvoiceLayout;
  isEditing: boolean;
  setDocument: React.Dispatch<React.SetStateAction<TradeDocument>>;
}

export function InvoiceForm({ document: doc, layout, isEditing, setDocument }: InvoiceFormProps) {
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupParty, setLookupParty] = useState<'seller' | 'buyer' | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error';
    details?: {
      status: string;
      identifiers: string;
    }
  } | null>(null);

  const isInvoice = doc.type === 'invoice';
  const data = doc.data;

  const mapCountryToCode = (countryName: string): string => {
    const name = countryName.toLowerCase();
    const gbCountries = ['england', 'scotland', 'wales', 'northern ireland', 'united kingdom', 'gb'];
    if (gbCountries.some(c => name.includes(c))) return 'GB';

    // Fallback or more mappings can be added here
    return countryName;
  };

  // Debounced postcode lookup for seller
  useEffect(() => {
    const postcode = data.seller.address?.postcode;
    const country = data.seller.address?.countryCode;
    
    if (!postcode || !country || postcode.length < 3) return;

    const timer = setTimeout(async () => {
      // Only auto-fill if city is empty
      if (!data.seller.address?.city) {
        const city = await fetchCityFromPostcode(postcode, country);
        if (city) {
          handleAddressChange('seller', 'city', city);
        }
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [data.seller.address?.postcode, data.seller.address?.countryCode]);

  // Debounced postcode lookup for buyer
  useEffect(() => {
    const postcode = data.buyer.address?.postcode;
    const country = data.buyer.address?.countryCode;
    
    if (!postcode || !country || postcode.length < 3) return;

    const timer = setTimeout(async () => {
      // Only auto-fill if city is empty
      if (!data.buyer.address?.city) {
        const city = await fetchCityFromPostcode(postcode, country);
        if (city) {
          handleAddressChange('buyer', 'city', city);
        }
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [data.buyer.address?.postcode, data.buyer.address?.countryCode]);

  const handlePartyChange = (party: 'seller' | 'buyer', field: string, value: string) => {
    setDocument((prev: any) => ({
      ...prev,
      data: {
        ...prev.data,
        [party]: { ...prev.data[party], [field]: value }
      }
    }));
  };

  const handleAddressChange = (party: 'seller' | 'buyer', field: string, value: string) => {
    setDocument((prev: any) => ({
      ...prev,
      data: {
        ...prev.data,
        [party]: {
          ...prev.data[party],
          address: { ...(prev.data[party].address || { countryCode: '' }), [field]: value }
        }
      }
    }));
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    setDocument(prev => {
      const newLines = [...prev.data.lines] as any[];
      let parsedValue = value;

      if (field === 'quantity') {
        parsedValue = Math.max(1, parseFloat(value) || 1);
      } else if (field === 'unitPrice' || field === 'taxRate') {
        parsedValue = Math.max(0, parseFloat(value) || 0);
      }

      newLines[index] = { ...newLines[index], [field]: parsedValue };

      // Calculate totals for invoice line
      if (prev.type === 'invoice') {
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = newLines[index].quantity || 1;
          const price = newLines[index].unitPrice || 0;
          newLines[index].amount = qty * price;
        }

        // Recalculate totals for invoice
        const lineTotal = newLines.reduce((sum, line) => sum + (line.amount || 0), 0);
        const taxTotal = newLines.reduce((sum, line) => sum + ((line.amount || 0) * (line.taxRate || 0) / 100), 0);
        const grandTotal = lineTotal + taxTotal;

        return {
          ...prev,
          data: {
            ...prev.data,
            lines: newLines,
            totals: {
              lineTotalAmount: lineTotal,
              taxTotalAmount: taxTotal,
              grandTotalAmount: grandTotal,
              duePayableAmount: grandTotal
            }
          }
        };
      }

      return {
        ...prev,
        data: {
          ...prev.data,
          lines: newLines
        }
      };
    });
  };

  const addLineItem = () => {
    setDocument(prev => {
      if (prev.type === 'invoice') {
        const newLine = { id: Math.random().toString(36).substr(2, 9), name: 'New Item', quantity: 1, unitCode: 'C62', unitPrice: 0, amount: 0, taxCategoryCode: 'S', taxRate: 0, hsCode: '' };
        const newLines = [...prev.data.lines, newLine];
        const lineTotal = newLines.reduce((sum, line) => sum + (line.amount || 0), 0);
        const taxTotal = newLines.reduce((sum, line) => sum + ((line.amount || 0) * (line.taxRate || 0) / 100), 0);
        const grandTotal = lineTotal + taxTotal;
        return {
          ...prev,
          data: {
            ...prev.data,
            lines: newLines,
            totals: {
              lineTotalAmount: lineTotal,
              taxTotalAmount: taxTotal,
              grandTotalAmount: grandTotal,
              duePayableAmount: grandTotal
            }
          }
        };
      } else {
        const newLine = { id: Math.random().toString(36).substr(2, 9), name: 'New Item', quantity: 1, unitCode: 'C62', hsCode: '' };
        return {
          ...prev,
          data: {
            ...prev.data,
            lines: [...prev.data.lines, newLine]
          }
        };
      }
    });
  };

  const removeLineItem = (index: number) => {
    setDocument(prev => {
      const newLines = prev.data.lines.filter((_, i) => i !== index);
      if (prev.type === 'invoice') {
        const lineTotal = newLines.reduce((sum, line) => sum + ((line as InvoiceLine).amount || 0), 0);
        const taxTotal = newLines.reduce((sum, line) => sum + (((line as InvoiceLine).amount || 0) * ((line as InvoiceLine).taxRate || 0) / 100), 0);
        const grandTotal = lineTotal + taxTotal;
        return {
          ...prev,
          data: {
            ...prev.data,
            lines: newLines as InvoiceLine[],
            totals: {
              lineTotalAmount: lineTotal,
              taxTotalAmount: taxTotal,
              grandTotalAmount: grandTotal,
              duePayableAmount: grandTotal
            }
          }
        };
      } else {
        return {
          ...prev,
          data: {
            ...prev.data,
            lines: newLines as PackingListLine[]
          }
        };
      }
    });
  };

  const handleLookup = async (party: 'seller' | 'buyer') => {
    const companyId = data[party].id;
    if (!companyId) return;

    setIsLookingUp(true);
    setLookupParty(party);

    try {
      const details = await fetchCompanyDetails(companyId);
      if (details) {
        const countryCode = mapCountryToCode(details.registered_address_country);

        setDocument((prev: any) => ({
          ...prev,
          data: {
            ...prev.data,
            [party]: {
              ...prev.data[party],
              name: details.name,
              address: {
                ...prev.data[party].address,
                street: (details.registered_address_street_address || '').replace(/\\n/g, ' ').replace(/\n/g, ' '),
                postcode: details.registered_address_postal_code || '',
                city: details.city || prev.data[party].address?.city || '',
                countryCode: countryCode
              }
            }
          }
        }));

        setModalContent({
          title: 'Company Found',
          message: `Successfully retrieved details for ${details.name}`,
          type: 'success',
          details: {
            status: details.status,
            identifiers: (details.ocid || details.plei)
              ? `Identifiers available: ${[details.ocid, details.plei].filter(Boolean).join(', ')}`
              : 'No identifiers (OCID/PLEI) found'
          }
        });
      } else {
        setModalContent({
          title: 'Lookup Failed',
          message: `Could not find any company with ID ${companyId}`,
          type: 'error'
        });
      }
    } catch (error) {
      setModalContent({
        title: 'Error',
        message: 'An unexpected error occurred during company lookup.',
        type: 'error'
      });
    } finally {
      setIsLookingUp(false);
      setLookupParty(null);
      setModalOpen(true);
    }
  };

  const handlers: DocumentHandlers = {
    handlePartyChange,
    handleAddressChange,
    handleLineChange,
    handleLookup,
    lookupParty,
    isLookingUp,
    addLineItem,
    removeLineItem,
    setDocument
  };

  const renderModal = () => {
    if (!modalOpen || !modalContent) return null;

    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className={`p-6 ${modalContent.type === 'success' ? 'bg-green-50' : 'bg-red-50'} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              {modalContent.type === 'success' ?
                <CheckCircle2 className="w-6 h-6 text-green-600" /> :
                <AlertCircle className="w-6 h-6 text-red-600" />
              }
              <h3 className={`text-lg font-bold ${modalContent.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                {modalContent.title}
              </h3>
            </div>
            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-gray-600">{modalContent.message}</p>

            {modalContent.details && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Operational Status</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${modalContent.details.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {modalContent.details.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed italic border-t pt-2">
                  {modalContent.details.identifiers}
                </p>
              </div>
            )}

            <Button
              className="w-full"
              variant={modalContent.type === 'success' ? 'default' : 'destructive'}
              onClick={() => setModalOpen(false)}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const layoutElement = (() => {
    if (layout.id === 'us-corporate') {
      return <ModernLayout document={doc} layout={layout} isEditing={isEditing} handlers={handlers} />;
    }

    if (layout.id === 'de-standard') {
      return <MinimalLayout document={doc} layout={layout} isEditing={isEditing} handlers={handlers} />;
    }

    return <StandardLayout document={doc} layout={layout} isEditing={isEditing} handlers={handlers} />;
  })();

  return (
    <>
      {layoutElement}
      {renderModal()}
    </>
  );
}
