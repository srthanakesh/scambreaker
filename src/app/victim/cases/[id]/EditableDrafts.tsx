'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

export default function EditableDrafts({ documents }: { documents: any[] }) {
  const filteredDocs = documents.filter(d => d.type === 'bank_dispute_draft' || d.type === 'police_report_draft');

  if (filteredDocs.length === 0) return null;

  return (
    <div className="mt-8 bg-white shadow rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Generated Document Drafts
      </h3>

      <div className="space-y-6">
        {filteredDocs.map((doc: any, i: number) => (
          <DraftItem key={i} doc={doc} />
        ))}
      </div>
    </div>
  );
}

function DraftItem({ doc }: { doc: any }) {
  const [content, setContent] = useState(doc.content);

  const handleExportPdf = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${doc.title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; white-space: pre-wrap; font-size: 14px; }
            h1 { text-align: center; font-size: 18px; margin-bottom: 20px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
          </style>
        </head>
        <body>
          <h1>${doc.title}</h1>
          <div>${content}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
        <h4 className="font-medium text-slate-900">{doc.title}</h4>
        <button 
          onClick={handleExportPdf}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded border border-blue-200 hover:bg-blue-100 transition"
        >
          <Download className="w-4 h-4 mr-1.5" />
          Export as PDF
        </button>
      </div>
      <div className="p-0">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[250px] p-4 text-slate-800 text-sm border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 resize-y leading-relaxed font-mono"
        />
      </div>
    </div>
  );
}
