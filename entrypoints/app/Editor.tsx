import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Invoice } from '@/lib/uncefact/models';
import { Button } from '@/components/ui/button';
import { Save, Edit2, X, Loader2 } from 'lucide-react';
import { storage } from '#imports';
import { InvoiceForm } from './InvoiceForm';
import { LAYOUTS, UK_LAYOUT } from '@/lib/uncefact/layout';

export default function Editor() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get template ID from state
  const { templateId, initialIsEditing } = location.state || {};

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(initialIsEditing || false);
  const [isSaving, setIsSaving] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [layoutId, setLayoutId] = useState("");
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  const selectedLayout = LAYOUTS.find(l => l.id === layoutId) || UK_LAYOUT;

  useEffect(() => {
    async function loadTemplate() {
      if (!templateId) {
        navigate('/documents');
        return;
      }
      
      try {
        const templates: any[] = await storage.getItem('local:custom_templates') || [];
        const template = templates.find(t => t.id === templateId);
        
        if (template && template.invoiceData) {
          setTemplateName(template.name);
          setLayoutId(template.layoutId);
          setInvoice({
            ...template.invoiceData,
            issueDate: new Date(template.invoiceData.issueDate)
          });
        } else {
          navigate('/documents');
        }
      } catch (error) {
        console.error("Failed to load template:", error);
        navigate('/documents');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTemplate();
  }, [templateId, navigate]);

  // Auto-calculate compliant totals whenever lines change
  useEffect(() => {
    if (!invoice) return;
    
    const lineTotalAmount = invoice.lines.reduce((sum, line) => sum + (line.amount || 0), 0);
    const taxTotalAmount = invoice.lines.reduce((sum, line) => sum + ((line.amount || 0) * (line.taxRate || 0) / 100), 0);
    const grandTotalAmount = lineTotalAmount + taxTotalAmount;

    setInvoice(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        totals: {
          lineTotalAmount,
          taxTotalAmount,
          grandTotalAmount,
          duePayableAmount: grandTotalAmount,
        }
      };
    });
  }, [invoice?.lines]);

  const handleSave = async () => {
    if (!invoice || !templateId) return;

    try {
      setIsSaving(true);
      
      // Serialize dates properly before saving
      const serializableInvoice = {
        ...invoice,
        issueDate: invoice.issueDate.toISOString() // Store as ISO string
      };

      const existingTemplates: any[] = await storage.getItem('local:custom_templates') || [];
      const updatedTemplates = [...existingTemplates];
      
      const index = updatedTemplates.findIndex(t => t.id === templateId);
      if (index !== -1) {
        updatedTemplates[index] = {
          ...updatedTemplates[index],
          invoiceData: serializableInvoice,
          updatedAt: Date.now()
        };
        await storage.setItem('local:custom_templates', updatedTemplates);
        setIsEditing(false);
        // Optional: show a success toast here
      }
    } catch (error) {
      console.error("Failed to save template:", error);
      alert("Failed to save template. Check console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/documents');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto pb-24 relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{isEditing ? "Edit Template" : templateName}</h1>
          <p className="text-gray-500">{isEditing ? "Editing custom template" : "Viewing custom template"}</p>
        </div>
        <div className="flex gap-4 items-center">
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)} disabled={isSaving}>
            {isEditing ? <><X className="w-4 h-4 mr-2" /> Cancel</> : <><Edit2 className="w-4 h-4 mr-2" /> Edit Template</>}
          </Button>
          {isEditing && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save</>}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose} 
            className="text-gray-500 hover:text-gray-900 ml-2"
            title="Close"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
        <InvoiceForm invoice={invoice} layout={selectedLayout} isEditing={isEditing} setInvoice={setInvoice as React.Dispatch<React.SetStateAction<Invoice>>} />
      </div>
    </div>
  );
}
