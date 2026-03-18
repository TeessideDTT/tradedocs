import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Templates from './Templates';
import Editor from './Editor';
import InvoiceGenerator from './InvoiceGenerator';
import MyDocuments from './MyDocuments';
import { Button } from '@/components/ui/button';
import { FileText, LayoutGrid, Settings, Plus } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="p-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Welcome to TradeDocs</h1>
        <p className="text-xl text-gray-500">Create UN/CEFACT compliant invoices with embedded data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="flex flex-col p-8 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">Templates</h3>
          <p className="text-gray-500 mb-8 flex-1">Browse and select from default UN/CEFACT invoice templates to get started quickly.</p>
          <Link to="/templates">
            <Button className="w-full" variant="outline">Browse Templates</Button>
          </Link>
        </div>

        <div className="flex flex-col p-8 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all group border-blue-200">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">Create New</h3>
          <p className="text-gray-500 mb-8 flex-1">Start creating a new trade document from scratch with our intuitive editor.</p>
          <Link to="/generator">
            <Button className="w-full">Create Invoice</Button>
          </Link>
        </div>

        <div className="flex flex-col p-8 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">My Documents</h3>
          <p className="text-gray-500 mb-8 flex-1">View, edit, and manage your saved trade documents and export history.</p>
          <Link to="/documents">
            <Button className="w-full" variant="outline">Manage Documents</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-black font-sans antialiased">
        <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
          <div className="container mx-auto px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">T</div>
                <span className="text-2xl font-bold tracking-tight">TradeDocs</span>
              </Link>
              <div className="hidden md:flex gap-6 text-sm font-medium">
                <Link to="/templates" className="transition-colors hover:text-blue-600 text-gray-500">Dashboard</Link>
                <Link to="/generator" className="transition-colors hover:text-blue-600 text-gray-500">Generator</Link>
                <Link to="/documents" className="transition-colors hover:text-blue-600 text-gray-500">My Templates</Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </nav>
        
        <main className="container mx-auto pb-20">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/generator" element={<InvoiceGenerator />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/documents" element={<MyDocuments />} />
          </Routes>
        </main>

        <footer className="border-t py-12 bg-white">
          <div className="container mx-auto px-8 text-center">
            <p className="text-sm text-gray-500">
              &copy; 2026 TradeDocs. All documents generated are UN/CEFACT CII and PDF/A-3 compliant.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
