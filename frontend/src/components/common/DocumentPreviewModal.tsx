import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { ExternalLink, FileText, Download } from 'lucide-react';
import { DocumentModel } from '../../types';

interface DocumentPreviewModalProps {
  document: DocumentModel | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  isOpen,
  onClose
}) => {
  if (!document) return null;

  const previewUrl = api.documents.getPreviewUrl(document.id);
  const isImage = document.fileType?.startsWith('image/') || document.fileName.match(/\.(jpg|jpeg|png)$/i);
  const isPdf = document.fileType === 'application/pdf' || document.fileName.match(/\.pdf$/i);
  const isMatched = document.status === 'MATCHED' || (document.matchScore !== null && document.matchScore !== undefined && document.matchScore >= 85);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Document Preview: ${document.type.replace(/_/g, ' ')}`}
      description={`File: ${document.fileName} • ${document.status}`}
      maxWidth="4xl"
    >
      <div className="flex flex-col items-center justify-center min-h-[400px] max-h-[600px] w-full bg-slate-100 rounded-lg border border-slate-200 overflow-hidden relative p-2">
        {isImage ? (
          <img
            src={previewUrl}
            alt={document.fileName}
            className="max-h-[560px] max-w-full object-contain rounded"
          />
        ) : isPdf ? (
          <iframe
            src={`${previewUrl}#toolbar=0`}
            title={document.fileName}
            className="w-full h-[560px] rounded border-0"
          />
        ) : (
          <div className="text-center p-8">
            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">
              {document.fileName}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Preview may not be supported directly in browser for this file type.
            </p>
            <div className="mt-4">
              <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                  Download Document
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-slate-600 font-medium">
          Status:{' '}
          <span className={isMatched ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>
            {isMatched ? 'Matched with Student Details' : 'Needs Staff Review'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a href={previewUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>
              Open in New Tab
            </Button>
          </a>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
