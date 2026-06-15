import React, { useEffect, useState } from 'react';
import { ExternalLink, FilePlus, LayoutGrid, Settings, Database, Paperclip, Layers } from 'lucide-react';
import { storage } from '#imports';

type ExportMode = 'metadata' | 'attachment' | 'both';

function App() {
  const [exportMode, setExportMode] = useState<ExportMode>('both');

  useEffect(() => {
    // Load saved export mode from storage
    storage.getItem<ExportMode>('local:pdf_export_mode').then((savedMode) => {
      if (savedMode) {
        setExportMode(savedMode);
      }
    });
  }, []);

  const handleModeChange = async (mode: ExportMode) => {
    setExportMode(mode);
    await storage.setItem('local:pdf_export_mode', mode);
  };

  const openApp = async (path = '') => {
    const baseUrl = browser.runtime.getURL('/app.html');
    const fullUrl = `${baseUrl}#${path}`;
    
    // Query for any existing tabs with the app URL
    const tabs = await browser.tabs.query({ url: `${baseUrl}*` });
    
    if (tabs && tabs.length > 0) {
      // Reuse the first found tab
      const tabId = tabs[0].id;
      if (tabId) {
        await browser.tabs.update(tabId, { active: true, url: fullUrl });
        await browser.windows.update(tabs[0].windowId, { focused: true });
      }
    } else {
      // Navigate to the unlisted app page in a new tab
      browser.tabs.create({ url: fullUrl });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground p-5">
      <header className="mb-10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">T</div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none">TDO Builder</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">UN/CEFACT Compliant</p>
          </div>
        </div>
        <button 
          onClick={() => openApp('/')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-black"
          title="Open Dashboard"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </header>
      
      <main className="flex-1 space-y-6">
        <div className="grid grid-cols-1 gap-3">
          <button 
            onClick={() => openApp('/templates')}
            className="flex items-center gap-3 w-full p-3 rounded-xl border bg-white hover:bg-gray-50 hover:border-blue-200 transition-all text-left group shadow-sm cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-xs text-black">Dashboard</div>
              <div className="text-[10px] text-gray-500">Pick a starting point</div>
            </div>
          </button>

          <button 
            onClick={() => openApp('/generator')}
            className="flex items-center gap-3 w-full p-3 rounded-xl border bg-white hover:bg-gray-50 hover:border-blue-200 transition-all text-left group shadow-sm cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <FilePlus className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-xs text-black">Create New</div>
              <div className="text-[10px] text-gray-500">Start from scratch</div>
            </div>
          </button>

          <button 
            onClick={() => openApp('/documents')}
            className="flex items-center gap-3 w-full p-3 rounded-xl border bg-white hover:bg-gray-50 hover:border-blue-200 transition-all text-left group shadow-sm cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-xs text-black">My Templates</div>
              <div className="text-[10px] text-gray-500">Manage saved files</div>
            </div>
          </button>
        </div>

        {/* PDF Export Options Section */}
        <div className="space-y-3 pt-4 border-t">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">PDF Data Attachment Options</h2>
          <div className="space-y-2">
            <label 
              onClick={() => handleModeChange('metadata')}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                exportMode === 'metadata' 
                  ? 'border-blue-600 bg-blue-50/30' 
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}
            >
              <input 
                type="radio" 
                name="exportMode" 
                checked={exportMode === 'metadata'} 
                onChange={() => handleModeChange('metadata')}
                className="mt-0.5 accent-blue-600"
              />
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-xs text-black">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  XMP Metadata Only
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                  Regular PDF. XML, JSON-LD, and layout styling are embedded only inside XMP metadata.
                </p>
              </div>
            </label>

            <label 
              onClick={() => handleModeChange('attachment')}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                exportMode === 'attachment' 
                  ? 'border-blue-600 bg-blue-50/30' 
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}
            >
              <input 
                type="radio" 
                name="exportMode" 
                checked={exportMode === 'attachment'} 
                onChange={() => handleModeChange('attachment')}
                className="mt-0.5 accent-blue-600"
              />
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-xs text-black">
                  <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                  PDF/A-3 File Attachments Only
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                  Embedded files in PDF/A-3. No document-level XMP metadata fields.
                </p>
              </div>
            </label>

            <label 
              onClick={() => handleModeChange('both')}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                exportMode === 'both' 
                  ? 'border-blue-600 bg-blue-50/30' 
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}
            >
              <input 
                type="radio" 
                name="exportMode" 
                checked={exportMode === 'both'} 
                onChange={() => handleModeChange('both')}
                className="mt-0.5 accent-blue-600"
              />
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-xs text-black">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  Both (Recommended)
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                  JSON-LD & layout in XMP metadata, with XML & JSON-LD as attachments.
                </p>
              </div>
            </label>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-gray-50 border border-dashed">
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Generate PDF/A-3 invoices with embedded XML (CII) and JSON-LD metadata for full interoperability.
          </p>
        </div>
      </main>

      <footer className="mt-8 pt-4 border-t text-center">
        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
          v1.0.0
        </span>
      </footer>
    </div>
  );
}

export default App;