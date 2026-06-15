import React, { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Plus, Upload, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LAYOUTS } from '@/lib/uncefact/layout';
import { extractInvoiceDataFromPdf } from '@/lib/uncefact/pdf';

export default function Templates() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsExtracting(true);
      const buffer = await file.arrayBuffer();
      const extractedData = await extractInvoiceDataFromPdf(buffer);

      if (extractedData.hasVerification) {
        if (extractedData.isTampered) {
          const proceed = window.confirm("SECURITY WARNING: The document data appears to have been tampered with or corrupted since generation (Verification Hash Mismatch). Do you still want to proceed with importing?");
          if (!proceed) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            setIsExtracting(false);
            return;
          }
        } else {
          window.alert("SUCCESS: The document data's cryptographic signature has been verified. The file is authentic and unaltered.");
        }
      } else {
        window.alert("NOTICE: This document does not contain a verifiable hash signature. It has been imported as standard data.");
      }

      // Navigate to editor with the extracted data and the layout ID if it was preserved
      navigate('/generator', {
        state: {
          importedData: extractedData.document,
          layoutId: extractedData.layoutId,
          hasVerification: extractedData.hasVerification,
          verificationHash: extractedData.verificationHash,
          verificationTimestamp: extractedData.verificationTimestamp,
          isTemplate: false,
        }
      });
    } catch (error) {
      console.error(error);
      alert((error as Error).message || "Failed to parse the PDF file.");
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Choose a starting point for your invoice.</p>
        </div>
        <Button onClick={() => navigate('/generator')}>
          <Plus className="w-4 h-4 mr-2" />
          Create From Scratch
        </Button>
      </div>

      <div className="space-y-8">
        {/* Commercial Invoices Section */}
        <div>
          <h2 className="text-base font-bold text-gray-900 border-b pb-1.5 mb-4">Commercial Invoice Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LAYOUTS.map((layout) => (
              <Card key={`${layout.id}-invoice`} className="hover:shadow-md transition-shadow">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold">{layout.name}</CardTitle>
                      <CardDescription className="text-xs truncate max-w-[200px]">{layout.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 py-2">
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Country:</span>
                      <span className="font-medium">{layout.countryCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Style:</span>
                      <span className="font-medium">{layout.font.heading.split('-')[0]}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full h-8 text-xs font-semibold text-slate-900 bg-slate-200 hover:bg-slate-300 border border-slate-300"
                    onClick={() => navigate('/generator', { state: { layoutId: layout.id, importedData: { typeCode: '380' } } })}
                  >
                    Use Invoice Layout
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Packing Lists Section */}
        <div>
          <h2 className="text-base font-bold text-gray-900 border-b pb-1.5 mb-4">Packing List Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LAYOUTS.map((layout) => (
              <Card key={`${layout.id}-packing`} className="hover:shadow-md transition-shadow">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold">{layout.name} Packing List</CardTitle>
                      <CardDescription className="text-xs">UN/CEFACT Type 271 compliant slip.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 py-2">
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Country:</span>
                      <span className="font-medium">{layout.countryCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Style:</span>
                      <span className="font-medium">{layout.font.heading.split('-')[0]}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full h-8 text-xs font-semibold text-slate-900 bg-slate-200 hover:bg-slate-300 border border-slate-300"
                    onClick={() => navigate('/generator', { state: { layoutId: layout.id, importedData: { typeCode: '271' } } })}
                  >
                    Use Packing List Layout
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 bg-white p-8 rounded-2xl border shadow-sm">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-6">
            <Upload className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-3">Import Existing Document</h2>
          <p className="text-sm text-gray-500 mb-8">
            Have a compliant PDF/A-3 Commercial Invoice or Packing List? Upload it here. The application will automatically detect the document type, extract the structured metadata, and open it in the editor.
          </p>

          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />

          <Button
            size="lg"
            className="w-full md:w-auto"
            onClick={() => fileInputRef.current?.click()}
            disabled={isExtracting}
          >
            {isExtracting ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Extracting Data...</>
            ) : (
              <><Upload className="w-5 h-5 mr-2" /> Select Trade Document PDF</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
