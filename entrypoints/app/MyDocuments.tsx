import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function MyDocuments() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Documents</h1>
        <p className="text-gray-500">Manage your saved trade documents.</p>
      </div>

      <Card className="bg-gray-50 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No documents saved yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
