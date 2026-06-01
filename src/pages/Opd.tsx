import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  History,
  Plus,
  Printer,
  Receipt,
  Stethoscope,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {
  api,
  type Patient,
  type PrescriptionLineInput,
} from '../lib/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import VisitPrintModal from '../components/VisitPrintModal';
import { useVisitPrint } from '../hooks/useVisitPrint';
import FormField, { fieldInputClass } from '../components/FormField';
import SearchableDropdown, { type SearchableOption } from '../components/SearchableDropdown';
import { formatPakPhoneInput, PHONE_PLACEHOLDER } from '../lib/pakistan-inputs';
import { getPakistanDateString } from '../lib/pakistan-time';
import { getValidationFields } from '../lib/validation-errors';

type DraftLine = PrescriptionLineInput & { key: string };

function newLine(partial?: Partial<DraftLine>): DraftLine {
  return {
    key: crypto.randomUUID(),
    lineType: 'drug',
    name: '',
    dosage: '',
    quantity: 1,
    unitPrice: 0,
    ...partial,
  };
}

export default function Opd() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [patientMode, setPatientMode] = useState<'existing' | 'new'>('existing');
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGender, setNewGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newAge, setNewAge] = useState('');

  const [doctorId, setDoctorId] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [temperature, setTemperature] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [pulse, setPulse] = useState('');
  const [spo2, setSpo2] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [discount, setDiscount] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  const [lines, setLines] = useState<DraftLine[]>([]);
  const [drugSearch, setDrugSearch] = useState('');
  const [drugPickerOpen, setDrugPickerOpen] = useState(false);
  const [customMedName, setCustomMedName] = useState('');
  const [customDosage, setCustomDosage] = useState('');
  const [labSearch, setLabSearch] = useState('');
  const [customLabName, setCustomLabName] = useState('');
  const [customLabPrice, setCustomLabPrice] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const print = useVisitPrint();
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data: doctors } = useQuery({ queryKey: ['doctors'], queryFn: api.doctors.list });
  const { data: drugs, isFetching: loadingDrugs } = useQuery({
    queryKey: ['drugs', 'opd', drugSearch],
    queryFn: () => api.drugs.list(drugSearch.trim() || undefined),
    enabled: true,
  });
  const { data: labTests, isFetching: loadingLabs } = useQuery({
    queryKey: ['lab-tests', 'opd', labSearch],
    queryFn: () => api.labTests.list(labSearch.trim() || undefined),
  });
  const { data: patientResults, isFetching: searchingPatients } = useQuery({
    queryKey: ['patients', 'opd', patientSearch],
    queryFn: () =>
      api.patients.list({
        search: patientSearch.trim() || undefined,
        limit: 50,
      }),
    enabled: patientMode === 'existing',
  });
  const { data: todayVisits } = useQuery({
    queryKey: ['visits', 'today', getPakistanDateString()],
    queryFn: () => api.visits.list({ date: getPakistanDateString() }),
  });
  const { data: patientHistory } = useQuery({
    queryKey: ['visits', 'history', selectedPatient?.id],
    queryFn: () => api.visits.patientHistory(selectedPatient!.id),
    enabled: !!selectedPatient && historyOpen,
  });

  useEffect(() => {
    if (!doctorId) return;
    const doc = doctors?.find((d) => d.id === doctorId);
    if (doc && !consultationFee) {
      setConsultationFee(String(Number(doc.fee) || 0));
    }
  }, [doctorId, doctors, consultationFee]);

  const lineTotal = useMemo(
    () => lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    [lines]
  );
  const feeNum = Number(consultationFee) || 0;
  const discountNum = Number(discount) || 0;
  const grandTotal = Math.max(0, feeNum + lineTotal - discountNum);

  const createVisit = useMutation({
    mutationFn: api.visits.create,
    onSuccess: (visit) => {
      qc.invalidateQueries({ queryKey: ['visits'] });
      qc.invalidateQueries({ queryKey: ['drugs'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['patients'] });
      print.showVisit(visit);
      toast(`Visit ${visit.visitNumber} saved`);
    },
  });

  const serverFields = getValidationFields(createVisit.error) ?? {};
  const mergedErrors = { ...fieldErrors, ...serverFields };

  function addDrug(drug: { id: string; name: string; salePrice: string | number }) {
    setLines((prev) => [
      ...prev,
      newLine({
        lineType: 'drug',
        drugId: drug.id,
        name: drug.name,
        unitPrice: Number(drug.salePrice) || 0,
        dosage: 'As directed',
      }),
    ]);
    setDrugSearch('');
    setDrugPickerOpen(false);
    toast(`${drug.name} added to prescription`);
  }

  const patientOptions: SearchableOption[] = useMemo(
    () =>
      (patientResults?.items ?? []).map((p) => ({
        id: p.id,
        label: p.name,
        hint: `${p.patientId}${p.contact ? ` · ${p.contact}` : ''}`,
      })),
    [patientResults]
  );

  const drugOptions: SearchableOption[] = useMemo(
    () =>
      (drugs ?? []).map((d) => ({
        id: d.id,
        label: d.name,
        hint: `PKR ${Number(d.salePrice).toLocaleString('en-PK')}${d.stockQuantity != null ? ` · Stock: ${d.stockQuantity}` : ''}`,
      })),
    [drugs]
  );

  function addLab(test: { id: string; name: string; price: number }) {
    setLines((prev) => [
      ...prev,
      newLine({
        lineType: 'lab',
        labTestId: test.id,
        name: test.name,
        unitPrice: test.price,
        dosage: 'Lab',
      }),
    ]);
    setLabSearch('');
    toast(`${test.name} added to prescription`);
  }

  const labOptions: SearchableOption[] = useMemo(
    () =>
      (labTests ?? []).map((t) => ({
        id: t.id,
        label: t.name,
        hint: `PKR ${Number(t.price).toLocaleString('en-PK')}${t.code ? ` · ${t.code}` : ''}`,
      })),
    [labTests]
  );

  function addCustomMed() {
    if (!customMedName.trim()) return;
    const name = customMedName.trim();
    setLines((prev) => [
      ...prev,
      newLine({
        lineType: 'custom',
        name,
        dosage: customDosage.trim() || 'As directed',
        unitPrice: 0,
      }),
    ]);
    setCustomMedName('');
    setCustomDosage('');
    toast(`${name} added to prescription`);
  }

  function addCustomLab() {
    if (!customLabName.trim()) return;
    const name = customLabName.trim();
    setLines((prev) => [
      ...prev,
      newLine({
        lineType: 'lab',
        labTestId: null,
        name,
        dosage: 'Lab',
        unitPrice: Number(customLabPrice) || 0,
      }),
    ]);
    setCustomLabName('');
    setCustomLabPrice('');
    toast(`${name} added as lab test`);
  }

  function handleSubmit(printAfter: boolean) {
    const errors: Record<string, string> = {};
    if (patientMode === 'existing' && !selectedPatient) {
      errors.patientId = 'Select a patient from search results';
    }
    if (patientMode === 'new') {
      if (!newName.trim()) errors.newName = 'Patient name is required';
      if (!newPhone.trim()) errors.newPhone = 'Phone number is required';
    }
    if (!doctorId) errors.doctorId = 'Select a doctor';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    const payload = {
      patientId: patientMode === 'existing' ? selectedPatient!.id : undefined,
      newPatient:
        patientMode === 'new'
          ? {
              name: newName.trim(),
              contact: newPhone.trim(),
              gender: newGender,
              age: newAge ? Number(newAge) : undefined,
            }
          : undefined,
      doctorId: doctorId || null,
      weightKg: weightKg ? Number(weightKg) : null,
      bloodPressure: bloodPressure || null,
      temperature: temperature ? Number(temperature) : null,
      bloodSugar: bloodSugar ? Number(bloodSugar) : null,
      pulse: pulse ? Number(pulse) : null,
      spo2: spo2 ? Number(spo2) : null,
      diagnosis: diagnosis || null,
      advice: advice || null,
      consultationFee: feeNum,
      discount: discountNum,
      isPaid,
      lines: lines.map(({ lineType, drugId, labTestId, name, dosage, quantity, unitPrice }) => ({
        lineType,
        drugId,
        labTestId,
        name,
        dosage,
        quantity,
        unitPrice,
      })),
    };

    if (printAfter) print.setPrintMode('both');
    createVisit.mutate(payload);
  }

  function resetForm() {
    setSelectedPatient(null);
    setPatientSearch('');
    setNewName('');
    setNewPhone('');
    setLines([]);
    setDiagnosis('');
    setAdvice('');
    setWeightKg('');
    setBloodPressure('');
    setTemperature('');
    setBloodSugar('');
    setPulse('');
    setSpo2('');
    setDiscount('');
    setIsPaid(false);
    print.closePrint();
    setFieldErrors({});
    createVisit.reset();
  }

  return (
    <div className="page-enter mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="OPD & Prescription"
        subtitle="Register patient, record vitals, prescribe medicines and labs, print prescription and bill"
        action={
          <button type="button" onClick={resetForm} className="btn-secondary">
            New visit
          </button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Patient */}
          <section className="card-panel overflow-visible p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
              <UserPlus className="h-5 w-5 text-brand-600" />
              Patient
            </h2>
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setPatientMode('existing')}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  patientMode === 'existing'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Existing patient
              </button>
              <button
                type="button"
                onClick={() => {
                  setPatientMode('new');
                  setSelectedPatient(null);
                }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  patientMode === 'new'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                New patient
              </button>
            </div>

            {patientMode === 'existing' ? (
              <div className="space-y-3">
                <SearchableDropdown
                  label="Select patient"
                  placeholder="Search or choose from list (name, ID, phone)"
                  options={patientOptions}
                  value={patientSearch}
                  selectedId={selectedPatient?.id ?? null}
                  loading={searchingPatients}
                  emptyText="No patients found. Try another search or register as new patient."
                  error={mergedErrors.patientId}
                  onChange={(v) => {
                    setPatientSearch(v);
                    if (selectedPatient && v !== selectedPatient.name) {
                      setSelectedPatient(null);
                    }
                  }}
                  onSelect={(opt) => {
                    const p = patientResults?.items.find((x) => x.id === opt.id);
                    if (p) setSelectedPatient(p);
                  }}
                />
                {selectedPatient && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-200 bg-brand-50/80 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-brand-900">
                        Selected: {selectedPatient.name}
                      </p>
                      <p className="text-xs text-brand-700/80">
                        {selectedPatient.patientId}
                        {selectedPatient.contact ? ` · ${selectedPatient.contact}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHistoryOpen(true)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
                    >
                      <History className="h-4 w-4" />
                      History
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Full name" required error={mergedErrors.newName}>
                  <input
                    className={fieldInputClass(!!mergedErrors.newName)}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </FormField>
                <FormField label="Phone" required error={mergedErrors.newPhone}>
                  <input
                    className={fieldInputClass(!!mergedErrors.newPhone)}
                    value={newPhone}
                    onChange={(e) => setNewPhone(formatPakPhoneInput(e.target.value))}
                    placeholder={PHONE_PLACEHOLDER}
                  />
                </FormField>
                <FormField label="Gender">
                  <select
                    className="input"
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as typeof newGender)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </FormField>
                <FormField label="Age">
                  <input
                    type="number"
                    className="input"
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    min={1}
                  />
                </FormField>
              </div>
            )}
          </section>

          {/* Vitals & doctor */}
          <section className="card-panel p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
              <Stethoscope className="h-5 w-5 text-brand-600" />
              Vitals & doctor
            </h2>
            <div className="mb-4">
              <FormField label="Consulting doctor" required error={mergedErrors.doctorId}>
                <select
                  className={fieldInputClass(!!mergedErrors.doctorId)}
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                >
                  <option value="">Select doctor</option>
                  {doctors?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {d.specialization ? ` (${d.specialization})` : ''}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Weight (kg)">
                <input className="input" type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
              </FormField>
              <FormField label="Blood pressure">
                <input className="input" placeholder="120/80" value={bloodPressure} onChange={(e) => setBloodPressure(e.target.value)} />
              </FormField>
              <FormField label="Temperature (°F)">
                <input className="input" type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} />
              </FormField>
              <FormField label="Blood sugar">
                <input className="input" type="number" value={bloodSugar} onChange={(e) => setBloodSugar(e.target.value)} />
              </FormField>
              <FormField label="Pulse">
                <input className="input" type="number" value={pulse} onChange={(e) => setPulse(e.target.value)} />
              </FormField>
              <FormField label="SpO2 (%)">
                <input className="input" type="number" max={100} value={spo2} onChange={(e) => setSpo2(e.target.value)} />
              </FormField>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField label="Diagnosis">
                <textarea className="input min-h-[80px]" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
              </FormField>
              <FormField label="Advice / notes">
                <textarea className="input min-h-[80px]" value={advice} onChange={(e) => setAdvice(e.target.value)} />
              </FormField>
            </div>
          </section>

          {/* Prescription lines */}
          <section className="card-panel overflow-visible p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
              <FileText className="h-5 w-5 text-brand-600" />
              Prescription & billing
            </h2>

            <div className="mb-4">
              <SearchableDropdown
                label="Medicine from pharmacy"
                placeholder="Search pharmacy stock and select to add"
                options={drugOptions}
                value={drugSearch}
                loading={loadingDrugs}
                emptyText="No medicines in pharmacy match your search."
                onOpen={() => setDrugPickerOpen(true)}
                onChange={(v) => {
                  setDrugSearch(v);
                  setDrugPickerOpen(true);
                }}
                onSelect={(opt) => {
                  const d = drugs?.find((x) => x.id === opt.id);
                  if (d) addDrug(d);
                }}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Click the arrow or focus the field to open the pharmacy list. Select a row to add it to the prescription.
              </p>
            </div>

            <div className="mb-4 flex flex-wrap items-end gap-2">
              <input
                className="input min-w-[140px] flex-1"
                placeholder="Custom medicine name"
                value={customMedName}
                onChange={(e) => setCustomMedName(e.target.value)}
              />
              <input
                className="input w-32"
                placeholder="Dosage"
                value={customDosage}
                onChange={(e) => setCustomDosage(e.target.value)}
              />
              <button type="button" onClick={addCustomMed} className="btn-secondary">
                <Plus className="h-4 w-4" />
                Add medicine
              </button>
            </div>

            <div className="mb-4 border-t border-slate-100 pt-4">
              <SearchableDropdown
                label="Lab test from catalog"
                placeholder="Search lab tests and select to add"
                options={labOptions}
                value={labSearch}
                loading={loadingLabs}
                emptyText="No lab tests match your search."
                onChange={(v) => setLabSearch(v)}
                onSelect={(opt) => {
                  const t = labTests?.find((x) => x.id === opt.id);
                  if (t) addLab(t);
                }}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Click the arrow or focus the field to open the lab list. Select a row to add it to the prescription.
              </p>
            </div>

            <div className="mb-4 flex flex-wrap items-end gap-2">
              <input
                className="input min-w-[140px] flex-1"
                placeholder="Custom lab test name"
                value={customLabName}
                onChange={(e) => setCustomLabName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomLab();
                  }
                }}
              />
              <input
                type="number"
                min={0}
                className="input w-32"
                placeholder="Price PKR"
                value={customLabPrice}
                onChange={(e) => setCustomLabPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomLab();
                  }
                }}
              />
              <button type="button" onClick={addCustomLab} className="btn-secondary">
                <Plus className="h-4 w-4" />
                Add lab test
              </button>
            </div>

            {lines.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="py-2">Item</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Dosage / note</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2">Price</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.key} className="border-b border-slate-50">
                      <td className="py-2 font-medium">{l.name}</td>
                      <td className="py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            l.lineType === 'lab'
                              ? 'bg-violet-100 text-violet-800'
                              : l.lineType === 'custom'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-brand-100 text-brand-800'
                          }`}
                        >
                          {l.lineType === 'lab' ? 'Lab' : l.lineType === 'custom' ? 'Custom' : 'Med'}
                        </span>
                      </td>
                      <td className="py-2">
                        <input
                          className="input py-1 text-xs"
                          value={l.dosage ?? ''}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((x) =>
                                x.key === l.key ? { ...x, dosage: e.target.value } : x
                              )
                            )
                          }
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          min={1}
                          className="input w-16 py-1 text-xs"
                          value={l.quantity}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((x) =>
                                x.key === l.key
                                  ? { ...x, quantity: Math.max(1, Number(e.target.value) || 1) }
                                  : x
                              )
                            )
                          }
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          min={0}
                          className="input w-24 py-1 text-xs"
                          value={l.unitPrice}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((x) =>
                                x.key === l.key
                                  ? { ...x, unitPrice: Number(e.target.value) || 0 }
                                  : x
                              )
                            )
                          }
                        />
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-slate-500">No medicines or labs added yet.</p>
            )}

            <div className="mt-6 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
              <FormField label="Consultation fee (PKR)">
                <input className="input" type="number" min={0} value={consultationFee} onChange={(e) => setConsultationFee(e.target.value)} />
              </FormField>
              <FormField label="Discount (PKR)">
                <input className="input" type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </FormField>
              <label className="flex items-center gap-2 pt-6 text-sm font-medium">
                <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} />
                Mark bill as paid
              </label>
            </div>

            <p className="mt-4 text-right text-lg font-bold text-brand-800">
              Total: PKR {grandTotal.toLocaleString('en-PK')}
            </p>

            {createVisit.error && (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {createVisit.error.message}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={createVisit.isPending}
                onClick={() => handleSubmit(true)}
                className="btn-primary"
              >
                <Printer className="h-4 w-4" />
                {createVisit.isPending ? 'Saving…' : 'Save & print'}
              </button>
              <button
                type="button"
                disabled={createVisit.isPending}
                onClick={() => handleSubmit(false)}
                className="btn-secondary"
              >
                Save visit only
              </button>
              {print.savedVisit && (
                <>
                  <button
                    type="button"
                    onClick={() => print.openVisitPrint(print.savedVisit!.id, 'prescription')}
                    className="btn-secondary"
                  >
                    <FileText className="h-4 w-4" />
                    Prescription
                  </button>
                  <button
                    type="button"
                    onClick={() => print.openVisitPrint(print.savedVisit!.id, 'bill')}
                    className="btn-secondary"
                  >
                    <Receipt className="h-4 w-4" />
                    Bill
                  </button>
                </>
              )}
            </div>
          </section>
        </div>

        {/* Today's visits */}
        <aside className="card-panel h-fit p-5">
          <h3 className="font-bold text-slate-900">Today&apos;s OPD visits</h3>
          <p className="mt-1 text-xs text-slate-500">{getPakistanDateString()} (PKT)</p>
          <ul className="mt-4 max-h-[480px] space-y-2 overflow-y-auto">
            {todayVisits?.length === 0 && (
              <li className="text-sm text-slate-500">No visits yet today.</li>
            )}
            {todayVisits?.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => print.openVisitPrint(v.id, 'both')}
                  className="w-full rounded-xl border border-slate-100 px-3 py-2 text-left text-sm hover:bg-brand-50"
                >
                  <p className="font-semibold">{v.patient.name}</p>
                  <p className="text-xs text-slate-500">
                    {v.visitNumber} · PKR {v.bill?.total ?? v.consultationFee}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <Modal title="Visit history" open={historyOpen} onClose={() => setHistoryOpen(false)}>
        {patientHistory?.length === 0 && (
          <p className="text-sm text-slate-500">No previous visits for this patient.</p>
        )}
        <ul className="max-h-96 space-y-3 overflow-y-auto">
          {patientHistory?.map((h) => (
            <li key={h.id} className="rounded-xl border border-slate-100 p-3 text-sm">
              <p className="font-semibold">
                {h.visitNumber} · {new Date(h.visitDate).toLocaleDateString('en-PK')}
              </p>
              <p className="text-slate-600">{h.doctor?.name ?? 'No doctor'}</p>
              {h.diagnosis && <p className="text-slate-500">{h.diagnosis}</p>}
              <p className="mt-1 text-xs text-slate-400">
                {h.lineCount} items · Bill: {h.bill?.billNumber ?? 'N/A'}
              </p>
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-brand-700 hover:underline"
                onClick={() => {
                  setHistoryOpen(false);
                  print.openVisitPrint(h.id, 'both');
                }}
              >
                View & print this visit
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      <VisitPrintModal
        visit={print.savedVisit}
        open={print.printOpen}
        mode={print.printMode}
        onClose={print.closePrint}
        onModeChange={print.setPrintMode}
        onPrint={print.printNow}
      />
    </div>
  );
}
