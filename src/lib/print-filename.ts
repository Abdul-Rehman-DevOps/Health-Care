/** Safe PDF / print document title: PatientName_VisitNo (used by Save as PDF on Windows). */
export function buildPrintFilename(patientName: string, visitNumber: string): string {
  const safeName =
    patientName
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
      .replace(/\s+/g, ' ')
      .slice(0, 80) || 'Patient';

  const safeId =
    visitNumber
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
      .slice(0, 40) || 'visit';

  return `${safeName}_${safeId}`;
}
