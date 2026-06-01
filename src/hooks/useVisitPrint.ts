import { useRef, useState } from 'react';
import { api, type VisitDetail } from '../lib/api';
import { printElementByIframe } from '../lib/print-document';
import { buildPrintFilename } from '../lib/print-filename';

export type PrintMode = 'prescription' | 'bill' | 'both';

export function useVisitPrint() {
  const [savedVisit, setSavedVisit] = useState<VisitDetail | null>(null);
  const [printMode, setPrintMode] = useState<PrintMode>('both');
  const [printOpen, setPrintOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const titleBeforePrintRef = useRef<string | null>(null);

  async function openVisitPrint(visitId: string, mode: PrintMode = 'both') {
    setLoading(true);
    try {
      const visit = await api.visits.get(visitId);
      setSavedVisit(visit);
      setPrintMode(mode);
      setPrintOpen(true);
    } finally {
      setLoading(false);
    }
  }

  function showVisit(visit: VisitDetail, mode: PrintMode = 'both') {
    setSavedVisit(visit);
    setPrintMode(mode);
    setPrintOpen(true);
  }

  function closePrint() {
    setPrintOpen(false);
  }

  function printNow() {
    if (!savedVisit) return;

    const filename = buildPrintFilename(
      savedVisit.patient.name,
      savedVisit.visitNumber
    );

    titleBeforePrintRef.current = document.title;
    document.title = filename;

    const restoreTitle = () => {
      if (titleBeforePrintRef.current != null) {
        document.title = titleBeforePrintRef.current;
        titleBeforePrintRef.current = null;
      }
    };

    printElementByIframe('#health-care-print-root', filename);

    // Iframe handles print; restore main tab title shortly after dialog opens
    setTimeout(restoreTitle, 500);
  }

  return {
    savedVisit,
    printMode,
    setPrintMode,
    printOpen,
    loading,
    openVisitPrint,
    showVisit,
    closePrint,
    printNow,
  };
}
