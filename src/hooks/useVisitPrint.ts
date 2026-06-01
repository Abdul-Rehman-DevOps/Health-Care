import { useState } from 'react';
import { flushSync } from 'react-dom';
import { api, type VisitDetail } from '../lib/api';
import { printElementByIframe } from '../lib/print-document';
import { buildPrintFilename } from '../lib/print-filename';

export type PrintMode = 'prescription' | 'bill' | 'both';

export function useVisitPrint() {
  const [savedVisit, setSavedVisit] = useState<VisitDetail | null>(null);
  const [printMode, setPrintMode] = useState<PrintMode>('prescription');
  const [printOpen, setPrintOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  function closePrint() {
    setPrintOpen(false);
  }

  async function openVisitPrint(visitId: string, mode: PrintMode = 'prescription') {
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

  function showVisit(visit: VisitDetail, mode: PrintMode = 'prescription') {
    setSavedVisit(visit);
    setPrintMode(mode);
    setPrintOpen(true);
  }

  /** Keep last visit for sidebar reprint buttons without opening the modal. */
  function rememberVisit(visit: VisitDetail) {
    setSavedVisit(visit);
    setPrintOpen(false);
  }

  async function executePrint(visit: VisitDetail, mode: PrintMode, onDone?: () => void) {
    setLoading(true);
    let fresh = visit;
    try {
      fresh = await api.visits.get(visit.id);
    } catch {
      /* use provided visit */
    } finally {
      setLoading(false);
    }

    flushSync(() => {
      setSavedVisit(fresh);
      setPrintMode(mode);
    });

    await new Promise<void>((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => r()))
    );

    const filename = buildPrintFilename(fresh.patient.name, fresh.visitNumber);
    const previousTitle = document.title;

    await new Promise<void>((resolve) => {
      printElementByIframe('#health-care-print-root', filename, () => {
        document.title = previousTitle;
        onDone?.();
        resolve();
      });
    });
  }

  async function printNow() {
    if (!savedVisit) return;
    await executePrint(savedVisit, printMode, closePrint);
  }

  /** After save: open print dialog once, then close (no preview modal). */
  async function autoPrintVisit(visit: VisitDetail, mode: PrintMode = 'prescription') {
    setPrintOpen(false);
    await executePrint(visit, mode, closePrint);
  }

  return {
    savedVisit,
    printMode,
    setPrintMode,
    printOpen,
    loading,
    openVisitPrint,
    showVisit,
    rememberVisit,
    closePrint,
    printNow,
    autoPrintVisit,
  };
}
