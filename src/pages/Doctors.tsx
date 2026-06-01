import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Stethoscope } from 'lucide-react';
import { api, type Doctor, type NewDoctor, type PrescriptionTemplate } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirmDelete } from '../hooks/useConfirmDelete';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ActionButtons from '../components/ActionButtons';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import FormField, { fieldInputClass } from '../components/FormField';
import {
  displayPakPhone,
  formatPakPhoneInput,
  PHONE_PLACEHOLDER,
  allowDigitKey,
  validatePakPhone,
} from '../lib/pakistan-inputs';
import {
  mergeValidationErrors,
  requiredField,
} from '../lib/validation-errors';

const emptyForm: NewDoctor = {
  name: '',
  prescriptionTemplate: 'full',
};

const PAD_STYLE_OPTIONS: { value: PrescriptionTemplate; label: string }[] = [
  { value: 'full', label: 'Full clinical pad (e.g. Dr. Waqas Satti)' },
  { value: 'standard', label: 'Standard pad (e.g. Dr. Muhammad Usman)' },
  { value: 'minimal', label: 'Simple pad — logo + patient row only (e.g. Dr. Memoona)' },
  { value: 'pediatric', label: 'Pediatrics pad (e.g. Dr. Ammara Tanweer)' },
  { value: 'banner', label: 'General pad — LifeCare logo + doctor (e.g. Dr. Komal Usman)' },
];

function doctorToForm(d: Doctor): NewDoctor {
  return {
    name: d.name,
    qualification: d.qualification ?? undefined,
    qualificationsExtra: d.qualificationsExtra ?? undefined,
    specialization: d.specialization ?? undefined,
    prescriptionTemplate: d.prescriptionTemplate ?? 'full',
    departmentId: d.departmentId ?? undefined,
    contact: d.contact ? formatPakPhoneInput(d.contact) : undefined,
    email: d.email ?? undefined,
    fee: Number(d.fee) || undefined,
  };
}

export default function Doctors() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const confirmDelete = useConfirmDelete();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<NewDoctor>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const qc = useQueryClient();

  const modalOpen = open || !!editId;

  const { data: doctors, isLoading, error } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => api.doctors.list({ all: true }),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: api.departments.list,
    enabled: modalOpen,
  });

  const create = useMutation({
    mutationFn: api.doctors.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['visits'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setOpen(false);
      setForm(emptyForm);
      toast('Doctor added');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewDoctor> }) =>
      api.doctors.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['visits'] });
      setEditId(null);
      setForm(emptyForm);
      toast('Doctor updated');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const remove = useMutation({
    mutationFn: api.doctors.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['visits'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast('Doctor removed');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const closeModal = () => {
    setOpen(false);
    setEditId(null);
    setForm(emptyForm);
    setFieldErrors({});
  };

  const pending = create.isPending || update.isPending;
  const submitError = create.error ?? update.error;
  const mergedErrors = mergeValidationErrors(fieldErrors, submitError);

  return (
    <div>
      <PageHeader
        title="Doctors"
        subtitle="Medical staff directory"
        action={
          isAdmin ? (
            <button
              type="button"
              onClick={() => {
                setForm(emptyForm);
                setOpen(true);
              }}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
              Add doctor
            </button>
          ) : undefined
        }
      />

      {!isAdmin && (
        <div className="alert-warning mb-6">
          <p className="text-sm text-amber-800">
            View only. Only an admin can add, edit, or remove doctors.
          </p>
        </div>
      )}

      {error && (
        <div className="alert-error">{error.message}</div>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : doctors?.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Stethoscope}
            title="No doctors yet"
            description="Add your first doctor to the system."
          />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {doctors?.map((d) => (
            <div key={d.id} className="card card-interactive group p-5">
              <div className="flex items-start gap-4">
                <div className="icon-badge h-12 w-12 bg-gradient-to-br from-violet-500 to-violet-700">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">{d.name}</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {d.specialization ?? 'General physician'}
                  </p>
                  {d.department && (
                    <div className="mt-2">
                      <Badge variant="info">{d.department.name}</Badge>
                    </div>
                  )}
                  <p className="mt-3 text-sm font-semibold text-brand-700">
                    Fee: PKR {Number(d.fee).toLocaleString()}
                  </p>
                  {d.contact && (
                    <p className="mt-1 font-mono text-xs text-slate-500">
                      {displayPakPhone(d.contact)}
                    </p>
                  )}
                  {d.email && (
                    <p className="mt-0.5 text-xs text-slate-500">{d.email}</p>
                  )}
                  <div className="mt-3">
                    <ActionButtons
                      compact
                      showEdit={isAdmin}
                      showDelete={isAdmin}
                      onEdit={() => {
                        setEditId(d.id);
                        setForm(doctorToForm(d));
                      }}
                      onDelete={() =>
                        confirmDelete.ask({
                          title: `Remove ${d.name}?`,
                          onConfirm: async () => {
                            await remove.mutateAsync(d.id);
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        title={editId ? 'Edit doctor' : 'Add new doctor'}
        open={isAdmin && modalOpen}
        onClose={closeModal}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const errors: Record<string, string> = {};
            const nameErr = requiredField(form.name, 'Full name');
            if (nameErr) errors.name = nameErr;
            const contactErr = form.contact?.trim()
              ? validatePakPhone(form.contact, 'Contact')
              : null;
            if (contactErr) errors.contact = contactErr;

            if (Object.keys(errors).length > 0) {
              setFieldErrors(errors);
              return;
            }
            setFieldErrors({});
            if (editId) {
              update.mutate({ id: editId, data: form });
            } else {
              create.mutate(form);
            }
          }}
        >
          <FormField label="Full name" required error={mergedErrors.name}>
            <input
              value={form.name}
              onChange={(e) => {
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
                setForm({ ...form, name: e.target.value });
              }}
              className={fieldInputClass(!!mergedErrors.name)}
            />
          </FormField>
          <FormField label="Specialization (on prescription)" error={mergedErrors.specialization}>
            <input
              value={form.specialization ?? ''}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              placeholder="e.g. Neurologist / Diabetologist"
              className={fieldInputClass(!!mergedErrors.specialization)}
            />
          </FormField>
          <FormField label="Primary qualification" error={mergedErrors.qualification}>
            <input
              value={form.qualification ?? ''}
              onChange={(e) => setForm({ ...form, qualification: e.target.value })}
              placeholder="e.g. MBBS, MD (Neurology)"
              className={fieldInputClass(!!mergedErrors.qualification)}
            />
          </FormField>
          <FormField
            label="Extra qualifications (one per line)"
            error={mergedErrors.qualificationsExtra}
          >
            <textarea
              className={`${fieldInputClass(!!mergedErrors.qualificationsExtra)} min-h-[72px]`}
              value={form.qualificationsExtra ?? ''}
              onChange={(e) => setForm({ ...form, qualificationsExtra: e.target.value })}
              placeholder="Diploma in Diabetes…&#10;Fellowship…"
            />
          </FormField>
          <FormField label="Prescription pad style" error={mergedErrors.prescriptionTemplate}>
            <select
              value={form.prescriptionTemplate ?? 'full'}
              onChange={(e) =>
                setForm({
                  ...form,
                  prescriptionTemplate: e.target.value as PrescriptionTemplate,
                })
              }
              className={fieldInputClass(!!mergedErrors.prescriptionTemplate)}
            >
              {PAD_STYLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Department" error={mergedErrors.departmentId}>
            <select
              value={form.departmentId ?? ''}
              onChange={(e) =>
                setForm({ ...form, departmentId: e.target.value || undefined })
              }
              className={fieldInputClass(!!mergedErrors.departmentId)}
            >
              <option value="">Select department</option>
              {departments?.map((dep) => (
                <option key={dep.id} value={dep.id}>
                  {dep.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Phone (on prescription)" error={mergedErrors.contact}>
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
              className={fieldInputClass(!!mergedErrors.contact, 'font-mono')}
              placeholder={PHONE_PLACEHOLDER}
              inputMode="tel"
              maxLength={16}
            />
          </FormField>
          <FormField label="Email (on prescription)" error={mergedErrors.email}>
            <input
              type="email"
              value={form.email ?? ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={fieldInputClass(!!mergedErrors.email)}
              placeholder="lifecarehospital.islamabad@gmail.com"
            />
          </FormField>
          <FormField label="Consultation fee (PKR)" error={mergedErrors.fee}>
            <input
              type="number"
              min={0}
              value={form.fee ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  fee: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className={fieldInputClass(!!mergedErrors.fee)}
            />
          </FormField>
          {submitError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError.message}
            </p>
          )}
          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? 'Saving…' : editId ? 'Update doctor' : 'Add doctor'}
          </button>
        </form>
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
