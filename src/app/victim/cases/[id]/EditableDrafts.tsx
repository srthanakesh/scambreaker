'use client';

import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';

export type DraftDoc = {
  title?: string;
  type?: string;
  content?: string;
};

export default function EditableDrafts({ documents }: { documents: DraftDoc[] }) {
  const filteredDocs = useMemo(
    () =>
      documents.filter(
        (d) => d.type === 'bank_dispute_draft' || d.type === 'police_report_draft'
      ),
    [documents]
  );

  if (filteredDocs.length === 0) return null;

  return (
    <div className="mt-8 bg-white shadow rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Generated Document Drafts
      </h3>

      <div className="space-y-6">
        {filteredDocs.map((doc, i) => (
          <DraftItem key={i} doc={doc} />
        ))}
      </div>
    </div>
  );
}

function DraftItem({ doc }: { doc: DraftDoc }) {
  const [content, setContent] = useState(doc.content || '');

  const documentLabel =
    doc.type === 'bank_dispute_draft'
      ? 'Bank Dispute Letter'
      : doc.type === 'police_report_draft'
        ? 'Police Report'
        : doc.title || 'Document Draft';

  const handleExportPdf = () => {
    const printWindow = window.open('', '', 'width=900,height=700');
    if (!printWindow) return;

    const html =
      doc.type === 'bank_dispute_draft'
        ? buildBankDisputeHtml(documentLabel, content)
        : buildPoliceReportHtml(documentLabel, content);

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
        <h4 className="font-medium text-slate-900">{documentLabel}</h4>
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
          className="w-full min-h-[260px] p-4 text-slate-800 text-sm border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 resize-y leading-relaxed font-mono"
        />
      </div>
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatBodyAsHtml(content: string) {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const htmlParts: string[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length > 0) {
      htmlParts.push(
        `<ul>${bulletBuffer.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
      );
      bulletBuffer = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith('- ')) {
      bulletBuffer.push(line.slice(2));
    } else {
      flushBullets();
      htmlParts.push(`<p>${escapeHtml(line)}</p>`);
    }
  }

  flushBullets();

  return htmlParts.join('');
}

function getTodayString() {
  return new Date().toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function baseDocumentShell(title: string, body: string) {
  return `
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          @page {
            size: A4;
            margin: 22mm 18mm;
          }

          body {
            font-family: "Times New Roman", Georgia, serif;
            color: #111827;
            line-height: 1.55;
            font-size: 14px;
            margin: 0;
          }

          .document {
            width: 100%;
          }

          .header {
            text-align: center;
            margin-bottom: 28px;
          }

          .header h1 {
            margin: 0;
            font-size: 20px;
            letter-spacing: 0.4px;
            text-transform: uppercase;
          }

          .header .subtitle {
            margin-top: 6px;
            font-size: 12px;
            color: #475569;
          }

          .meta {
            margin-bottom: 22px;
            font-size: 13px;
          }

          .meta div {
            margin-bottom: 4px;
          }

          .section-title {
            font-weight: bold;
            margin-top: 18px;
            margin-bottom: 8px;
            text-transform: uppercase;
            font-size: 13px;
          }

          p {
            margin: 0 0 10px 0;
            white-space: normal;
          }

          ul {
            margin: 0 0 12px 20px;
            padding: 0;
          }

          li {
            margin-bottom: 6px;
          }

          .signature {
            margin-top: 34px;
          }

          .signature-line {
            margin-top: 42px;
            width: 240px;
            border-top: 1px solid #111827;
            padding-top: 6px;
          }
        </style>
      </head>
      <body>
        <div class="document">
          ${body}
        </div>
      </body>
    </html>
  `;
}

function buildBankDisputeHtml(title: string, content: string) {
  const bodyHtml = formatBodyAsHtml(content);

  return baseDocumentShell(
    title,
    `
      <div class="header">
        <h1>${escapeHtml(title)}</h1>
        <div class="subtitle">Fraud Transaction Dispute Request</div>
      </div>

      <div class="meta">
        <div><strong>Date:</strong> ${escapeHtml(getTodayString())}</div>
        <div><strong>Subject:</strong> Request for urgent review of suspected scam transaction</div>
      </div>

      <p>To whom it may concern,</p>

      <p>
        I am writing to formally notify the bank of a suspected fraudulent transaction
        and to request urgent review, protective action, and any available recovery measures.
      </p>

      <div class="section-title">Incident Details</div>
      ${bodyHtml}

      <div class="section-title">Request to the Bank</div>
      <p>
        I respectfully request that the bank review this transaction immediately, flag any
        suspicious activity associated with the transfer, and advise on the next steps required
        for dispute handling and account protection.
      </p>

      <p>
        I am prepared to provide any supporting documents, screenshots, receipts, or statements
        required for investigation.
      </p>

      <div class="signature">
        <p>Thank you.</p>
        <p>Yours faithfully,</p>
        <div class="signature-line">Account Holder / Complainant</div>
      </div>
    `
  );
}

function buildPoliceReportHtml(title: string, content: string) {
  const bodyHtml = formatBodyAsHtml(content);

  return baseDocumentShell(
    title,
    `
      <div class="header">
        <h1>${escapeHtml(title)}</h1>
        <div class="subtitle">Statement for reporting a scam incident</div>
      </div>

      <div class="meta">
        <div><strong>Date:</strong> ${escapeHtml(getTodayString())}</div>
        <div><strong>Purpose:</strong> Report of suspected scam / fraud incident</div>
      </div>

      <p>To the Officer in Charge,</p>

      <p>
        I wish to lodge a police report regarding a scam incident that caused financial loss
        and requires investigation.
      </p>

      <div class="section-title">Statement of Facts</div>
      ${bodyHtml}

      <div class="section-title">Supporting Evidence</div>
      <p>
        Relevant supporting evidence may include transaction receipts, screenshots of messages,
        call records, account details, and any other related documents.
      </p>

      <p>
        I respectfully request that this matter be recorded and investigated accordingly.
      </p>

      <div class="signature">
        <p>Thank you.</p>
        <div class="signature-line">Complainant</div>
      </div>
    `
  );
}