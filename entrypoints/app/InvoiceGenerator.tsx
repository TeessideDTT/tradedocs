import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LAYOUTS, UK_LAYOUT } from '@/lib/uncefact/layout';
import { DEFAULT_INVOICE, Invoice } from '@/lib/uncefact/models';
import { generateInvoicePdf } from '@/lib/uncefact/pdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Loader2, Edit2, Save, Bookmark, X } from 'lucide-react';
import { storage } from '#imports';
import { InvoiceForm } from './InvoiceForm';

export default function InvoiceGenerator() {
  const location = useLocation();
  const navigate = useNavigate();
  const { layoutId, importedData } = location.state || {};
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
  const [templateNameInput, setTemplateNameInput] = useState("");

  const [invoice, setInvoice] = useState<Invoice>(() => {
    // If we have imported data from a PDF or Custom Template, merge it with defaults
    if (importedData) {
      return {
        ...DEFAULT_INVOICE,
        ...importedData,
        // Re-hydrate dates if they came from JSON/local storage as strings
        issueDate: importedData.issueDate ? new Date(importedData.issueDate) : DEFAULT_INVOICE.issueDate,
        // Ensure nested objects merge correctly
        seller: {
          ...DEFAULT_INVOICE.seller,
          ...(importedData.seller || {}),
          address: {
            ...DEFAULT_INVOICE.seller.address,
            ...(importedData.seller?.address || { countryCode: defaultCountry })
          }
        },
        buyer: {
          ...DEFAULT_INVOICE.buyer,
          ...(importedData.buyer || {}),
          address: {
            ...DEFAULT_INVOICE.buyer.address,
            ...(importedData.buyer?.address || { countryCode: defaultCountry })
          }
        },
        lines: importedData.lines?.length ? importedData.lines : DEFAULT_INVOICE.lines,
        totals: importedData.totals || DEFAULT_INVOICE.totals,
      };
    }

    // Otherwise use standard defaults
    return {
      ...DEFAULT_INVOICE,
      currency: defaultCurrency,
      seller: { 
        ...DEFAULT_INVOICE.seller, 
        address: { ...(DEFAULT_INVOICE.seller.address || {}), countryCode: defaultCountry } 
      },
      buyer: { 
        ...DEFAULT_INVOICE.buyer, 
        address: { ...(DEFAULT_INVOICE.buyer.address || {}), countryCode: defaultCountry } 
      }
    };
  });

  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Auto-calculate compliant totals whenever lines change
  useEffect(() => {
    const lineTotalAmount = invoice.lines.reduce((sum, line) => sum + (line.amount || 0), 0);
    const taxTotalAmount = invoice.lines.reduce((sum, line) => sum + ((line.amount || 0) * (line.taxRate || 0) / 100), 0);
    const grandTotalAmount = lineTotalAmount + taxTotalAmount;

    setInvoice(prev => ({
      ...prev,
      totals: {
        lineTotalAmount,
        taxTotalAmount,
        grandTotalAmount,
        duePayableAmount: grandTotalAmount,
      }
    }));
  }, [invoice.lines]);

  const handleSaveAsTemplate = async () => {
    if (!templateNameInput.trim()) return;

    try {
      setIsSavingTemplate(true);
      
      // Serialize dates properly before saving
      const serializableInvoice = {
        ...invoice,
        issueDate: invoice.issueDate.toISOString() // Store as ISO string
      };

      const existingTemplates: any[] = await storage.getItem('local:custom_templates') || [];
      let updatedTemplates = Array.isArray(existingTemplates) ? [...existingTemplates] : [];

      // Create new template
      const newTemplate = {
        id: `template-${Date.now()}`,
        name: templateNameInput.trim(),
        createdAt: Date.now(),
        layoutId: selectedLayout.id,
        invoiceData: serializableInvoice
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
      const pdfBytes = await generateInvoicePdf(invoice, selectedLayout, invoiceRef.current, dataWasEdited);
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.id}-${Date.now()}.pdf`;
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

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">UN/CEFACT Invoice Editor</h1>
          <p className="text-sm text-gray-500 mt-1">Edit compliant standard fields and layout.</p>
        </div>
        <div className="flex gap-4 items-center">
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsTemplateModalOpen(true)} disabled={isSavingTemplate}>
              <Bookmark className="w-4 h-4 mr-2" /> Save Template
            </Button>
          )}
          <Button variant="outline" onClick={handleToggleEdit}>
            {isEditing ? <><Save className="w-4 h-4 mr-2" /> Save Details</> : <><Edit2 className="w-4 h-4 mr-2" /> Edit Invoice</>}
          </Button>
          <Button onClick={handleDownloadPdf} disabled={isGenerating || isEditing}>
            {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Download className="w-4 h-4 mr-2" /> Download PDF</>}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              // Smart navigation: go back if possible, otherwise dashboard
              if (window.history.length > 2) {
                navigate(-1);
              } else {
                navigate('/documents');
              }
            }} 
            className="text-gray-500 hover:text-gray-900 ml-2"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>
      
      <div ref={invoiceRef} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
        <InvoiceForm 
          invoice={invoice} 
          layout={selectedLayout} 
          isEditing={isEditing} 
          setInvoice={(val) => {
            setDataWasEdited(true);
            setInvoice(val);
          }} 
        />
      </div>
    </div>
  );
}
