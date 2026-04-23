'use client';

import React, { useState, useRef } from 'react';
import { Paperclip, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { extractTextFromFile } from '@/lib/ocr';

interface EvidenceUploaderProps {
  onExtractionComplete: (extractedTextBlock: string) => void;
  onFileUploaded?: (fileName: string, dataUrl: string) => void;
  language?: string;
}

export default function EvidenceUploader({ onExtractionComplete, onFileUploaded, language = 'en' }: EvidenceUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    en: {
      upload: "Upload Document / Receipt",
      processing: "Extracting text...",
      success: "Text extracted successfully!",
      error: "Failed to extract text. Please try again or type manually."
    },
    ms: {
      upload: "Muat Naik Dokumen / Resit",
      processing: "Mengekstrak teks...",
      success: "Teks berjaya diekstrak!",
      error: "Gagal mengekstrak teks. Sila cuba lagi atau taip secara manual."
    },
    zh: {
      upload: "上传文件/收据",
      processing: "正在提取文本...",
      success: "文本提取成功！",
      error: "无法提取文本。请重试或手动输入。"
    },
    ta: {
      upload: "ஆவணம் / ரசீதைப் பதிவேற்றவும்",
      processing: "உரையைப் பிரித்தெடுக்கிறது...",
      success: "உரை வெற்றிகரமாகப் பிரித்தெடுக்கப்பட்டது!",
      error: "உரையைப் பிரித்தெடுக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும் அல்லது கைமுறையாகத் தட்டச்சு செய்யவும்."
    }
  }[language] || {
    upload: "Upload Document / Receipt",
    processing: "Extracting text...",
    success: "Text extracted successfully!",
    error: "Failed to extract text. Please try again or type manually."
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setSuccess(false);

    try {
      const { text, confidence } = await extractTextFromFile(file, (pct) => {
        setProgress(pct);
      });

      const extractedBlock = `
[EXTRACTED FROM UPLOADED FILE: ${file.name}]
Confidence: ${Math.round(confidence)}%
--- BEGIN EXTRACTED TEXT ---
${text}
--- END EXTRACTED TEXT ---
      `.trim();

      setSuccess(true);
      onExtractionComplete(extractedBlock);

      // Convert file to base64 data URL for storage
      if (onFileUploaded) {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            onFileUploaded(file.name, reader.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      setError(err.message || t.error);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative flex items-center justify-center pl-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,application/pdf"
        className="hidden"
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        title={error || success ? t.success : t.upload}
        className={`w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-full transition-colors focus:outline-none ${
          error ? 'text-red-500 hover:bg-red-50' :
          success ? 'text-green-600 hover:bg-green-50' :
          'text-slate-400 hover:text-blue-600 hover:bg-slate-100'
        }`}
        type="button"
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        ) : error ? (
          <AlertCircle className="w-5 h-5" />
        ) : success ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <Paperclip className="w-5 h-5" />
        )}
      </button>

      {isProcessing && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-600 bg-white border border-blue-100 shadow-sm px-2 py-1 rounded-full whitespace-nowrap z-10">
          {progress}% OCR
        </span>
      )}
    </div>
  );
}
