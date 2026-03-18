import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Bookmark, Trash2, Edit, Eye } from 'lucide-react';
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
        <h1 className="text-3xl font-bold">My Templates</h1>
        <p className="text-gray-500">Manage your custom saved templates.</p>
      </div>

      {myTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myTemplates.map((template) => {
            const layout = LAYOUTS.find(l => l.id === template.layoutId) || LAYOUTS[0];
            return (
              <Card key={template.id} className="hover:shadow-md transition-shadow relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-4">
                      <Bookmark className="w-6 h-6" />
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-500 hover:text-green-600 hover:bg-green-50"
                        onClick={() => navigate('/editor', { 
                          state: { 
                            templateId: template.id,
                            initialIsEditing: false
                          } 
                        })}
                        title="View Template"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => navigate('/editor', { 
                          state: { 
                            templateId: template.id,
                            initialIsEditing: true
                          } 
                        })}
                        title="Edit Template"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50" 
                        onClick={() => setTemplateToDelete(template.id)}
                        title="Delete Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>Saved on {new Date(template.createdAt).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Base Layout:</span>
                      <span>{layout.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Seller:</span>
                      <span className="truncate ml-4">{template.invoiceData.seller?.name || 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => navigate('/generator', { 
                      state: { 
                        layoutId: template.layoutId, 
                        importedData: template.invoiceData
                      } 
                    })}
                  >
                    Create Invoice
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
