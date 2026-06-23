import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LAYOUTS, UK_LAYOUT } from '@/lib/uncefact/layout';
import { DEFAULT_INVOICE, DEFAULT_PACKING_LIST, TradeDocument } from '@/lib/uncefact/models';
import { generateInvoicePdf } from '@/lib/uncefact/pdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Loader2, Edit2, Save, Bookmark, X } from 'lucide-react';
import { storage } from '#imports';
import { InvoiceForm } from './InvoiceForm';
import { DEFAULT_IDS } from '@/lib/uncefact/constants';

export default function InvoiceGenerator() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    layoutId,
    importedData,
    hasVerification = false,
    verificationHash,
    verificationTimestamp,
    isTemplate = false,
  } = location.state || {};
  const selectedLayout = LAYOUTS.find(l => l.id === layoutId) || UK_LAYOUT;

  // Set default currency based on layout, fallback to EUR
  const defaultCurrency = selectedLayout.id === 'uk-standard' ? 'GBP' :
    selectedLayout.id === 'us-corporate' ? 'USD' : 'EUR';

  // Set default country code based on layout
  const defaultCountry = selectedLayout.countryCode;

  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dataWasEdited, setDataWasEdited] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const [documentState, setDocumentState] = useState<TradeDocument>(() => {
    // If we have imported data from a PDF or Custom Template, check if it's a packing list
    const isPackList = importedData ?
      (importedData.typeCode === '271' || importedData.type === 'packing_list') :
      (location.state?.documentType === 'packing_list');

    if (isPackList) {
      const pData = importedData ? (importedData.type === 'packing_list' ? importedData.data : importedData) : null;
      return {
        type: 'packing_list',
        data: {
          ...DEFAULT_PACKING_LIST,
          ...pData,
          issueDate: pData?.issueDate ? new Date(pData.issueDate) : DEFAULT_PACKING_LIST.issueDate,
          seller: {
            ...DEFAULT_PACKING_LIST.seller,
            id: pData?.seller?.id !== undefined ? pData.seller.id : DEFAULT_IDS.seller,
            ...(pData?.seller || {}),
            address: {
              ...DEFAULT_PACKING_LIST.seller.address,
              ...(pData?.seller?.address || { countryCode: defaultCountry })
            }
          },
          buyer: {
            ...DEFAULT_PACKING_LIST.buyer,
            id: pData?.buyer?.id !== undefined ? pData.buyer.id : DEFAULT_IDS.buyer,
            ...(pData?.buyer || {}),
            address: {
              ...DEFAULT_PACKING_LIST.buyer.address,
              ...(pData?.buyer?.address || { countryCode: defaultCountry })
            }
          },
          lines: pData?.lines?.length ? pData.lines : DEFAULT_PACKING_LIST.lines,
        }
      };
    }

    const invData = importedData ? (importedData.type === 'invoice' ? importedData.data : importedData) : null;
    return {
      type: 'invoice',
      data: {
        ...DEFAULT_INVOICE,
        ...invData,
        issueDate: invData?.issueDate ? new Date(invData.issueDate) : DEFAULT_INVOICE.issueDate,
        seller: {
          ...DEFAULT_INVOICE.seller,
          id: invData?.seller?.id !== undefined ? invData.seller.id : DEFAULT_IDS.seller,
          ...(invData?.seller || {}),
          address: {
            ...DEFAULT_INVOICE.seller.address,
            ...(invData?.seller?.address || { countryCode: defaultCountry })
          }
        },
        buyer: {
          ...DEFAULT_INVOICE.buyer,
          id: invData?.buyer?.id !== undefined ? invData.buyer.id : DEFAULT_IDS.buyer,
          ...(invData?.buyer || {}),
          address: {
            ...DEFAULT_INVOICE.buyer.address,
            ...(invData?.buyer?.address || { countryCode: defaultCountry })
          }
        },
        lines: invData?.lines?.length ? invData.lines : DEFAULT_INVOICE.lines,
        totals: invData?.totals || DEFAULT_INVOICE.totals,
      }
    };
  });

  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Auto-calculate compliant totals whenever lines change (only for invoices)
  useEffect(() => {
    if (documentState.type !== 'invoice') return;
    const inv = documentState.data;
    const lineTotalAmount = inv.lines.reduce((sum, line) => sum + (line.amount || 0), 0);
    const taxTotalAmount = inv.lines.reduce((sum, line) => sum + ((line.amount || 0) * (line.taxRate || 0) / 100), 0);
    const grandTotalAmount = lineTotalAmount + taxTotalAmount;

    setDocumentState(prev => {
      if (prev.type !== 'invoice') return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          totals: {
            lineTotalAmount,
            taxTotalAmount,
            grandTotalAmount,
            duePayableAmount: grandTotalAmount,
          }
        }
      };
    });
  }, [documentState.data.lines]);

  const handleSaveAsTemplate = async () => {
    if (!templateNameInput.trim()) return;

    try {
      setIsSavingTemplate(true);

      // Serialize dates properly before saving
      const serializableDoc = {
        ...documentState,
        data: {
          ...documentState.data,
          issueDate: documentState.data.issueDate.toISOString() // Store as ISO string
        }
      };

      const existingTemplates: any[] = await storage.getItem('local:custom_templates') || [];
      let updatedTemplates = Array.isArray(existingTemplates) ? [...existingTemplates] : [];

      // Create new template
      const newTemplate = {
        id: `template-${Date.now()}`,
        name: templateNameInput.trim(),
        createdAt: Date.now(),
        layoutId: selectedLayout.id,
        documentType: documentState.type,
        documentData: serializableDoc.data,
        invoiceData: serializableDoc.data // Legacy support
      };
      updatedTemplates.push(newTemplate);

      await storage.setItem('local:custom_templates', updatedTemplates);
      setIsTemplateModalOpen(false);
      setIsEditing(false); // Exit edit mode
      alert(`Template "${templateNameInput.trim()}" saved successfully! You can find it in the Templates page.`);
    } catch (error) {
      console.error("Failed to save template:", error);
      alert("Failed to save template. Check console for details.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleToggleEdit = async () => {
    setIsEditing(!isEditing);
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      const pdfBytes = await generateInvoicePdf(documentState, selectedLayout, invoiceRef.current, {
        wasEdited: dataWasEdited,
        isTemplate,
        hasExistingVerification: hasVerification,
        existingVerificationHash: verificationHash,
        existingVerificationTimestamp: verificationTimestamp,
      });
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentState.type === 'packing_list' ? 'packing-list' : 'invoice'}-${documentState.data.id}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const [templateNameInput, setTemplateNameInput] = useState("");

  return (
    <div className="p-8 max-w-5xl mx-auto pb-24 relative">
      {/* Template Save Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">Save as Template</h2>
            <p className="text-sm text-gray-500 mb-6">Give your template a name so you can easily reuse these details later.</p>

            <div className="space-y-4 mb-6">
              <div>
                <Label>Template Name</Label>
                <Input
                  value={templateNameInput}
                  onChange={(e) => setTemplateNameInput(e.target.value)}
                  placeholder="e.g. Acme Corp UK"
                  className="mt-1"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsTemplateModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveAsTemplate} disabled={isSavingTemplate || !templateNameInput.trim()}>
                {isSavingTemplate ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Template"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Row: Title, Doc Type Select, and Close Button */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-bold">UN/CEFACT Document Editor</h1>
          <p className="text-sm text-gray-500 mt-1">Edit compliant standard fields and layout.</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Only show the type selector if we didn't land here via a specific template/preset document type */}
          {(!layoutId && !(importedData && importedData.typeCode)) && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">Document Type:</span>
              <Select
                value={documentState.type === 'invoice' ? '380' : '271'}
                onValueChange={(value) => {
                  setDocumentState(prev => {
                    if (value === '271') {
                      return {
                        type: 'packing_list',
                        data: {
                          ...DEFAULT_PACKING_LIST,
                          issueDate: new Date(),
                          seller: {
                            ...DEFAULT_PACKING_LIST.seller,
                            id: DEFAULT_IDS.seller,
                            address: { ...(DEFAULT_PACKING_LIST.seller.address || {}), countryCode: defaultCountry }
                          },
                          buyer: {
                            ...DEFAULT_PACKING_LIST.buyer,
                            id: DEFAULT_IDS.buyer,
                            address: { ...(DEFAULT_PACKING_LIST.buyer.address || {}), countryCode: defaultCountry }
                          }
                        }
                      };
                    } else {
                      return {
                        type: 'invoice',
                        data: {
                          ...DEFAULT_INVOICE,
                          issueDate: new Date(),
                          currency: defaultCurrency,
                          seller: {
                            ...DEFAULT_INVOICE.seller,
                            id: DEFAULT_IDS.seller,
                            address: { ...(DEFAULT_INVOICE.seller.address || {}), countryCode: defaultCountry }
                          },
                          buyer: {
                            ...DEFAULT_INVOICE.buyer,
                            id: DEFAULT_IDS.buyer,
                            address: { ...(DEFAULT_INVOICE.buyer.address || {}), countryCode: defaultCountry }
                          }
                        }
                      };
                    }
                  });
                }}
              >
                <SelectTrigger className="w-44 bg-white border-gray-200 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="380">Commercial Invoice</SelectItem>
                  <SelectItem value="271">Packing List</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (window.history.length > 2) {
                navigate(-1);
              } else {
                navigate('/documents');
              }
            }}
            className="text-gray-400 hover:text-gray-900 ml-2"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Second Header Row: Actions */}
      <div className="flex justify-end gap-3 mb-8">
        {!isEditing && (
          <Button variant="outline" onClick={() => setIsTemplateModalOpen(true)} disabled={isSavingTemplate}>
            <Bookmark className="w-4 h-4 mr-2" /> Save Template
          </Button>
        )}
        <Button variant="outline" onClick={handleToggleEdit}>
          {isEditing ? <><Save className="w-4 h-4 mr-2" /> Save Details</> : <><Edit2 className="w-4 h-4 mr-2" /> Edit Document</>}
        </Button>
        <Button onClick={handleDownloadPdf} disabled={isGenerating || isEditing}>
          {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Download className="w-4 h-4 mr-2" /> Download PDF</>}
        </Button>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-4">
        <div ref={invoiceRef} className={`bg-white p-4 sm:p-8 rounded-xl border border-gray-200 shadow-sm ${!isEditing ? 'w-fit min-w-full' : ''}`}>
          <InvoiceForm
            document={documentState}
            layout={selectedLayout}
            isEditing={isEditing}
            setDocument={(val) => {
              setDataWasEdited(true);
              setDocumentState(val);
            }}
          />
        </div>
      </div>
    </div>
  );
}
