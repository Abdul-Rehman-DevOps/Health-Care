import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Plus, Search, Users } from 'lucide-react';
import { api, type NewPatient, type Patient } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirmDelete } from '../hooks/useConfirmDelete';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ActionButtons from '../components/ActionButtons';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import {
  displayCnic,
  displayPakPhone,
  formatCnicInput,
  formatPakPhoneInput,
  CNIC_PLACEHOLDER,
  PHONE_PLACEHOLDER,
  allowDigitKey,
  validateCnic,
  validatePakPhone,
} from '../lib/pakistan-inputs';

const emptyForm: NewPatient = { name: '', gender: 'Male' };

function patientToForm(p: Patient): NewPatient {
  return {
    name: p.name,
    fatherName: p.fatherName ?? undefined,
    age: p.age ?? undefined,
    gender: (p.gender as NewPatient['gender']) ?? undefined,
    contact: p.contact ? formatPakPhoneInput(p.contact) : undefined,
    emergencyContact: p.emergencyContact
      ? formatPakPhoneInput(p.emergencyContact)
      : undefined,
    address: p.address ?? undefined,
    bloodGroup: p.bloodGroup ?? undefined,
    cnic: p.cnic ? formatCnicInput(p.cnic) : undefined,
    allergies: p.allergies ?? undefined,
    notes: p.notes ?? undefined,
  };
}

export default function Patients() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const confirmDelete = useConfirmDelete();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewPatient, setViewPatient] = useState<Patient | null>(null);
  const [form, setForm] = useState<NewPatient>(emptyForm);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['patients', search],
    queryFn: () => api.patients.list({ search: search || undefined }),
  });

  const create = useMutation({
    mutationFn: api.patients.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setOpen(false);
      setForm(emptyForm);
      toast('Patient added');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewPatient> }) =>
      api.patients.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      setEditId(null);
      setForm(emptyForm);
      toast('Patient updated');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const remove = useMutation({
    mutationFn: api.patients.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setViewPatient(null);
      toast('Patient deleted');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  return (
    <div>
      <PageHeader
        title="Patient details"
        subtitle="Register illness, condition, and full patient information"
        action={
          <button
            type="button"
            onClick={() => {
              setForm(emptyForm);
              setOpen(true);
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Add patient
          </button>
        }
      />

      <div className="search-wrap mb-6">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500/70" />
        <input
          type="search"
          placeholder="Search name, ID, CNIC, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {error && (
        <div className="alert-error">{error.message}</div>
      )}

      <div className="card-panel">
        {isLoading ? (
          <LoadingSpinner />
        ) : data?.items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No patients yet"
            description="Add a patient with full contact and medical details."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <colgroup>
                <col style={{ width: '112px' }} />
                <col style={{ width: '24%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '200px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Condition</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-50/40">
                    <td className="font-mono text-sm font-semibold text-brand-700">
                      {p.patientId}
                    </td>
                    <td className="font-medium">{p.name}</td>
                    <td className="font-mono text-xs">{displayPakPhone(p.contact)}</td>
                    <td className="truncate" title={p.allergies ?? ''}>
                      {p.allergies ?? p.notes ?? '—'}
                    </td>
                    <td className="col-actions">
                      <div className="flex flex-wrap justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewPatient(p)}
                          className="btn-secondary inline-flex py-1.5 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                        <ActionButtons
                          compact
                          showDelete={isAdmin}
                          onEdit={() => {
                            setEditId(p.id);
                            setForm(patientToForm(p));
                          }}
                          onDelete={() =>
                            confirmDelete.ask({
                              title: `Delete ${p.name}?`,
                              message: 'All appointments for this patient will also be removed.',
                              onConfirm: async () => {
                                await remove.mutateAsync(p.id);
                              },
                            })
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal title="Add patient details" open={open} onClose={() => setOpen(false)}>
        <PatientForm
          form={form}
          setForm={setForm}
          onSubmit={() => create.mutate(form)}
          pending={create.isPending}
          error={create.error?.message}
          submitLabel="Save patient"
        />
      </Modal>

      <Modal
        title="Edit patient"
        open={!!editId}
        onClose={() => {
          setEditId(null);
          setForm(emptyForm);
        }}
      >
        <PatientForm
          form={form}
          setForm={setForm}
          onSubmit={() => editId && update.mutate({ id: editId, data: form })}
          pending={update.isPending}
          error={update.error?.message}
          submitLabel="Update patient"
        />
      </Modal>

      <Modal
        title={viewPatient ? `${viewPatient.name} (${viewPatient.patientId})` : 'Patient'}
        open={!!viewPatient}
        onClose={() => setViewPatient(null)}
      >
        {viewPatient && (
          <div className="space-y-4">
            <DetailGrid patient={viewPatient} />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditId(viewPatient.id);
                  setForm(patientToForm(viewPatient));
                  setViewPatient(null);
                }}
                className="btn-primary flex-1"
              >
                Edit patient
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() =>
                    confirmDelete.ask({
                      title: 'Delete this patient?',
                      message: 'All appointments for this patient will also be removed.',
                      onConfirm: async () => {
                        await remove.mutateAsync(viewPatient.id);
                      },
                    })
                  }
                  className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete.pending}
        title={confirmDelete.pending?.title ?? ''}
        message={confirmDelete.pending?.message}
        loading={confirmDelete.loading}
        onConfirm={confirmDelete.confirm}
        onCancel={confirmDelete.cancel}
      />
    </div>
  );
}

function PatientForm({
  form,
  setForm,
  onSubmit,
  pending,
  error,
  submitLabel = 'Save patient',
}: {
  form: NewPatient;
  setForm: (f: NewPatient) => void;
  onSubmit: () => void;
  pending: boolean;
  error?: string;
  submitLabel?: string;
}) {
  const [fieldErrors, setFieldErrors] = useState<{
    cnic?: string;
    contact?: string;
    emergencyContact?: string;
  }>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cnicErr = validateCnic(form.cnic);
    const contactErr = validatePakPhone(form.contact, 'Contact');
    const emergencyErr = validatePakPhone(form.emergencyContact, 'Emergency contact');

    if (cnicErr || contactErr || emergencyErr) {
      setFieldErrors({
        cnic: cnicErr ?? undefined,
        contact: contactErr ?? undefined,
        emergencyContact: emergencyErr ?? undefined,
      });
      return;
    }

    setFieldErrors({});
    onSubmit();
  }

  return (
    <form
      className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
      onSubmit={handleSubmit}
    >
      <Field label="Full name" required>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input"
        />
      </Field>
      <Field label="Father / guardian name">
        <input
          value={form.fatherName ?? ''}
          onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
          className="input"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Age">
          <input
            type="number"
            min={0}
            value={form.age ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                age: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="input"
          />
        </Field>
        <Field label="Gender">
          <select
            value={form.gender ?? 'Male'}
            onChange={(e) =>
              setForm({ ...form, gender: e.target.value as NewPatient['gender'] })
            }
            className="input"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </Field>
      </div>
      <Field label="CNIC" error={fieldErrors.cnic}>
        <input
          value={form.cnic ?? ''}
          onChange={(e) => {
            const formatted = formatCnicInput(e.target.value);
            setForm({ ...form, cnic: formatted });
            setFieldErrors((prev) => ({ ...prev, cnic: undefined }));
          }}
          onKeyDown={(e) => allowDigitKey(e.nativeEvent)}
          onPaste={(e) => {
            e.preventDefault();
            const formatted = formatCnicInput(e.clipboardData.getData('text'));
            setForm({ ...form, cnic: formatted });
          }}
          onBlur={() => {
            setFieldErrors((prev) => ({
              ...prev,
              cnic: validateCnic(form.cnic) ?? undefined,
            }));
          }}
          className={`input font-mono ${fieldErrors.cnic ? 'border-red-300 focus:border-red-500 focus:ring-red-500/25' : ''}`}
          placeholder={CNIC_PLACEHOLDER}
          inputMode="numeric"
          pattern="[0-9-]*"
          maxLength={15}
        />
      </Field>
      <Field label="Contact" error={fieldErrors.contact}>
        <input
          value={form.contact ?? ''}
          onChange={(e) => {
            setFieldErrors((prev) => ({ ...prev, contact: undefined }));
            setForm({ ...form, contact: formatPakPhoneInput(e.target.value) });
          }}
          onKeyDown={(e) => allowDigitKey(e.nativeEvent)}
          onPaste={(e) => {
            e.preventDefault();
            setForm({ ...form, contact: formatPakPhoneInput(e.clipboardData.getData('text')) });
          }}
          onFocus={() => {
            if (!form.contact) setForm({ ...form, contact: '+92 ' });
          }}
          className="input font-mono"
          placeholder={PHONE_PLACEHOLDER}
          inputMode="tel"
          maxLength={16}
        />
      </Field>
      <Field label="Emergency contact" error={fieldErrors.emergencyContact}>
        <input
          value={form.emergencyContact ?? ''}
          onChange={(e) => {
            setFieldErrors((prev) => ({ ...prev, emergencyContact: undefined }));
            setForm({
              ...form,
              emergencyContact: formatPakPhoneInput(e.target.value),
            });
          }}
          onKeyDown={(e) => allowDigitKey(e.nativeEvent)}
          onPaste={(e) => {
            e.preventDefault();
            setForm({
              ...form,
              emergencyContact: formatPakPhoneInput(e.clipboardData.getData('text')),
            });
          }}
          onFocus={() => {
            if (!form.emergencyContact) setForm({ ...form, emergencyContact: '+92 ' });
          }}
          className="input font-mono"
          placeholder={PHONE_PLACEHOLDER}
          inputMode="tel"
          maxLength={16}
        />
      </Field>
      <Field label="Address">
        <textarea
          rows={2}
          value={form.address ?? ''}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="input resize-none"
        />
      </Field>
      <Field label="Blood group">
        <input
          value={form.bloodGroup ?? ''}
          onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
          className="input"
          placeholder="e.g. B+"
        />
      </Field>
      <Field label="Illness / condition">
        <input
          value={form.allergies ?? ''}
          onChange={(e) => setForm({ ...form, allergies: e.target.value })}
          className="input"
          placeholder="e.g. fever, diabetes, injury…"
        />
      </Field>
      <Field label="Patient notes">
        <textarea
          rows={3}
          value={form.notes ?? ''}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="input resize-none"
          placeholder="Visit history, treatment, other details…"
        />
      </Field>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}

function DetailGrid({ patient: p }: { patient: Patient }) {
  const rows: [string, string][] = [
    ['Patient ID', p.patientId],
    ['Father name', p.fatherName ?? '—'],
    ['Age', p.age ? `${p.age} years` : '—'],
    ['Gender', p.gender ?? '—'],
    ['CNIC', displayCnic(p.cnic)],
    ['Contact', displayPakPhone(p.contact)],
    ['Emergency', displayPakPhone(p.emergencyContact)],
    ['Address', p.address ?? '—'],
    ['Blood group', p.bloodGroup ?? '—'],
    ['Illness / condition', p.allergies ?? '—'],
    ['Patient notes', p.notes ?? '—'],
  ];
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="rounded-xl bg-slate-50 px-3 py-2">
          <dt className="text-xs font-medium text-slate-500">{k}</dt>
          <dd className="mt-0.5 text-sm font-medium text-slate-900">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Field({
  label,
  children,
  required,
  error,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {required && <span className="text-red-500"> *</span>}
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </label>
  );
}
