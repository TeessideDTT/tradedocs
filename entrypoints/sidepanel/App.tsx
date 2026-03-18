import React from 'react';
import { ExternalLink, FilePlus, LayoutGrid, Settings } from 'lucide-react';

function App() {
  const openApp = (path = '') => {
    // Navigate to the unlisted app page in a new tab
    const url = browser.runtime.getURL(`/app.html#${path}`);
    browser.tabs.create({ url });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground p-5">
      <header className="mb-10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">T</div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none">TradeDocs</h1>
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
      
      <main className="flex-1 space-y-3">
        <div className="grid grid-cols-1 gap-3">
          <button 
            onClick={() => openApp('/templates')}
            className="flex items-center gap-3 w-full p-3 rounded-xl border bg-white hover:bg-gray-50 hover:border-blue-200 transition-all text-left group shadow-sm"
          >
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-xs text-black">Templates</div>
              <div className="text-[10px] text-gray-500">Pick a starting point</div>
            </div>
          </button>

          <button 
            onClick={() => openApp('/editor')}
            className="flex items-center gap-3 w-full p-3 rounded-xl border bg-white hover:bg-gray-50 hover:border-blue-200 transition-all text-left group shadow-sm"
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
            className="flex items-center gap-3 w-full p-3 rounded-xl border bg-white hover:bg-gray-50 hover:border-blue-200 transition-all text-left group shadow-sm"
          >
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-xs text-black">My Documents</div>
              <div className="text-[10px] text-gray-500">Manage saved files</div>
            </div>
          </button>
        </div>
        
        <div className="mt-8 p-4 rounded-xl bg-gray-50 border border-dashed">
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