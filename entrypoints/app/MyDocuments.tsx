import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Bookmark, Trash2, Edit, Eye, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LAYOUTS } from '@/lib/uncefact/layout';
import { CustomTemplate } from '@/lib/uncefact/models';
import { storage } from '#imports';

export default function MyDocuments() {
  const navigate = useNavigate();
  const [myTemplates, setMyTemplates] = useState<CustomTemplate[]>([]);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadMyTemplates();
  }, []);

  const loadMyTemplates = async () => {
    try {
      const stored = await storage.getItem('local:custom_templates');
      if (Array.isArray(stored)) {
        setMyTemplates(stored as CustomTemplate[]);
      }
    } catch (e) {
      console.error("Failed to load templates from storage", e);
    }
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;
    try {
      const updated = myTemplates.filter(t => t.id !== templateToDelete);
      await storage.setItem('local:custom_templates', updated);
      setMyTemplates(updated);
      setTemplateToDelete(null);
    } catch (e) {
      console.error("Failed to delete template", e);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Templates</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your custom saved templates.</p>
      </div>

      {myTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myTemplates.map((template) => {
            const layout = LAYOUTS.find(l => l.id === template.layoutId) || LAYOUTS[0];
            const isPacking = (template as any).documentType === 'packing_list' || (template as any).invoiceData?.typeCode === '271';
            return (
              <Card key={template.id} className="hover:shadow-md transition-shadow relative">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isPacking ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                        <LayoutGrid className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold">{template.name}</CardTitle>
                        <CardDescription className="text-[10px]">Saved on {new Date(template.createdAt).toLocaleDateString()}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-gray-500 hover:text-green-600 hover:bg-green-50"
                        onClick={() => navigate('/editor', { 
                          state: { 
                            templateId: template.id,
                            initialIsEditing: false
                          } 
                        })}
                        title="View Template"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => navigate('/editor', { 
                          state: { 
                            templateId: template.id,
                            initialIsEditing: true
                          } 
                        })}
                        title="Edit Template"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-gray-500 hover:text-red-600 hover:bg-red-50" 
                        onClick={() => setTemplateToDelete(template.id)}
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 py-2">
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="font-semibold capitalize text-gray-700">{(template as any).documentType === 'packing_list' || (template as any).invoiceData?.typeCode === '271' ? 'Packing List' : 'Invoice'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Base Layout:</span>
                      <span className="text-gray-700">{layout.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Seller:</span>
                      <span className="truncate ml-4 text-gray-700">{((template as any).documentData || (template as any).invoiceData)?.seller?.name || 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-2">
                  <Button 
                    variant="secondary"
                    size="sm"
                    className="w-full h-8 text-xs font-semibold text-slate-900 bg-slate-200 hover:bg-slate-300 border border-slate-300" 
                    onClick={() => navigate('/generator', { 
                      state: { 
                        layoutId: template.layoutId, 
                        importedData: (template as any).documentData || (template as any).invoiceData,
                        documentType: (template as any).documentType || ((template as any).invoiceData?.typeCode === '271' ? 'packing_list' : 'invoice'),
                        isTemplate: true,
                        hasVerification: false,
                      } 
                    })}
                  >
                    Create {(template as any).documentType === 'packing_list' || (template as any).invoiceData?.typeCode === '271' ? 'Packing List' : 'Invoice'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bookmark className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No custom templates saved yet.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/templates')}>
              Browse Default Templates
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {templateToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-2">Delete Template?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to permanently delete this template? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" className="flex-1" onClick={() => setTemplateToDelete(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={confirmDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
