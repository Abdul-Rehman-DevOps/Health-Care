import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus } from 'lucide-react';
import { api, type Appointment, type UpdateAppointment } from '../lib/api';
import { EMPTY_DISPLAY } from '../lib/display';
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
  getPakistanDateString,
  getPakistanMinTime,
} from '../lib/pakistan-time';
import { mergeValidationErrors, validateAppointmentForm } from '../lib/validation-errors';

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
  Completed: 'success',
  Scheduled: 'info',
  'In Progress': 'warning',
  Cancelled: 'default',
};

const STATUSES = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];

export default function Appointments() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const confirmDelete = useConfirmDelete();
  const [date, setDate] = useState(getPakistanDateString());
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const qc = useQueryClient();

  const modalOpen = open || !!editId;

  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['appointments', date],
    queryFn: () => api.appointments.list(date),
  });

  const { data: patients } = useQuery({
    queryKey: ['patients', 'all'],
    queryFn: () => api.patients.list({ limit: 100 }),
    enabled: modalOpen,
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: api.doctors.list,
    enabled: modalOpen,
  });

  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [time, setTime] = useState('09:00');
  const [status, setStatus] = useState('Scheduled');
  const [notes, setNotes] = useState('');
  const [originalTime, setOriginalTime] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setPatientId('');
    setDoctorId('');
    setTime(date === getPakistanDateString() ? getPakistanMinTime() : '09:00');
    setStatus('Scheduled');
    setNotes('');
    setOriginalTime(null);
    setFieldErrors({});
  };

  const closeModal = () => {
    setOpen(false);
    setEditId(null);
    resetForm();
  };

  const openEdit = (a: Appointment) => {
    setEditId(a.id);
    setPatientId(a.patientId);
    setDoctorId(a.doctorId ?? '');
    setTime(a.appointmentTime ?? '09:00');
    setOriginalTime(a.appointmentTime ?? '09:00');
    setStatus(a.status);
    setNotes(a.notes ?? '');
  };

  const create = useMutation({
    mutationFn: api.appointments.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      closeModal();
      toast('Appointment booked');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppointment }) =>
      api.appointments.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      closeModal();
      toast('Appointment updated');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const remove = useMutation({
    mutationFn: api.appointments.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast('Appointment deleted');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const pending = create.isPending || update.isPending;
  const submitError = create.error ?? update.error;
  const mergedErrors = mergeValidationErrors(fieldErrors, submitError);

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle="Schedule and manage patient visits"
        action={
          <button
            type="button"
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Book appointment
          </button>
        }
      />

      <div className="card card-interactive mb-6 inline-flex items-center gap-3 px-4 py-3">
        <Calendar className="h-5 w-5 text-brand-600" />
        <label className="text-sm font-medium text-slate-600">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input ml-2 inline-block w-auto"
          />
        </label>
      </div>

      {error && (
        <div className="alert-error">{error.message}</div>
      )}

      <div className="card-panel">
        {isLoading ? (
          <LoadingSpinner />
        ) : appointments?.length === 0 ? (
          <EmptyState icon={Calendar} title="No appointments" description="None for this date." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-modern min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-5 py-3.5 text-left font-semibold">Patient</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Doctor</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Time</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments?.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50">
                    <td className="px-5 py-4">
                      <span className="font-medium">{a.patient.name}</span>
                      <span className="ml-2 font-mono text-xs text-brand-600">
                        {a.patient.patientId}
                      </span>
                    </td>
                    <td className="px-5 py-4">{a.doctor?.name ?? EMPTY_DISPLAY}</td>
                    <td className="px-5 py-4">{a.appointmentTime ?? EMPTY_DISPLAY}</td>
                    <td className="px-5 py-4">
                      <Badge variant={statusVariant[a.status] ?? 'default'}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <ActionButtons
                        compact
                        showDelete={isAdmin}
                        onEdit={() => openEdit(a)}
                        onDelete={() =>
                          confirmDelete.ask({
                            title: 'Delete appointment?',
                            onConfirm: async () => {
                              await remove.mutateAsync(a.id);
                            },
                          })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        title={editId ? 'Edit appointment' : 'Book appointment'}
        open={modalOpen}
        onClose={closeModal}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const errors = validateAppointmentForm({
              patientId,
              appointmentDate: date,
              appointmentTime: time,
              existingAppointments: appointments,
              excludeId: editId,
              originalTime,
            });

            if (Object.keys(errors).length > 0) {
              setFieldErrors(errors);
              return;
            }

            setFieldErrors({});
            if (editId) {
              update.mutate({
                id: editId,
                data: {
                  doctorId: doctorId || undefined,
                  appointmentTime: time,
                  status,
                  notes: notes || undefined,
                },
              });
            } else {
              create.mutate({
                patientId,
                doctorId: doctorId || undefined,
                appointmentDate: date,
                appointmentTime: time,
              });
            }
          }}
        >
          <FormField label="Patient" required error={mergedErrors.patientId}>
            <select
              disabled={!!editId}
              value={patientId}
              onChange={(e) => {
                setFieldErrors((prev) => ({ ...prev, patientId: undefined }));
                setPatientId(e.target.value);
              }}
              className={fieldInputClass(!!mergedErrors.patientId, 'disabled:bg-slate-50 disabled:text-slate-500')}
            >
              <option value="">Select patient</option>
              {patients?.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.patientId} · {p.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Doctor" error={mergedErrors.doctorId}>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className={fieldInputClass(!!mergedErrors.doctorId)}
            >
              <option value="">Any / TBD</option>
              {doctors?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Time" error={mergedErrors.appointmentTime}>
            <input
              type="time"
              value={time}
              min={date === getPakistanDateString() ? getPakistanMinTime() : undefined}
              onChange={(e) => {
                setFieldErrors((prev) => ({ ...prev, appointmentTime: undefined }));
                setTime(e.target.value);
              }}
              className={fieldInputClass(!!mergedErrors.appointmentTime)}
            />
          </FormField>
          {!editId && date === getPakistanDateString() && (
            <p className="text-xs text-slate-500">
              Appointments use Pakistan time (PKT). Past times cannot be booked.
            </p>
          )}
          {editId && (
            <>
              <label className="block text-sm font-medium">
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input mt-1.5"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Notes
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="input mt-1.5"
                />
              </label>
            </>
          )}
          {submitError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError.message}
            </p>
          )}
          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? 'Saving…' : editId ? 'Update appointment' : 'Confirm booking'}
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
