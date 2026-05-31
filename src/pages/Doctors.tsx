import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Stethoscope } from 'lucide-react';
import { api, type Doctor, type NewDoctor } from '../lib/api';
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

const emptyForm: NewDoctor = { name: '' };

function doctorToForm(d: Doctor): NewDoctor {
  return {
    name: d.name,
    qualification: d.qualification ?? undefined,
    specialization: d.specialization ?? undefined,
    departmentId: d.departmentId ?? undefined,
    contact: d.contact ?? undefined,
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
  const qc = useQueryClient();

  const modalOpen = open || !!editId;

  const { data: doctors, isLoading, error } = useQuery({
    queryKey: ['doctors'],
    queryFn: api.doctors.list,
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
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast('Doctor removed');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const closeModal = () => {
    setOpen(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const pending = create.isPending || update.isPending;
  const formError = create.error?.message ?? update.error?.message;

  return (
    <div>
      <PageHeader
        title="Doctors"
        subtitle="Medical staff directory"
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
            Add doctor
          </button>
        }
      />

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
                  <div className="mt-3">
                    <ActionButtons
                      compact
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
        open={modalOpen}
        onClose={closeModal}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (editId) {
              update.mutate({ id: editId, data: form });
            } else {
              create.mutate(form);
            }
          }}
        >
          <label className="block text-sm font-medium text-slate-700">
            Full name *
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input mt-1.5"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Specialization
            <input
              value={form.specialization ?? ''}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              className="input mt-1.5"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Department
            <select
              value={form.departmentId ?? ''}
              onChange={(e) =>
                setForm({ ...form, departmentId: e.target.value || undefined })
              }
              className="input mt-1.5"
            >
              <option value="">Select department</option>
              {departments?.map((dep) => (
                <option key={dep.id} value={dep.id}>
                  {dep.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Contact
            <input
              value={form.contact ?? ''}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="input mt-1.5"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Consultation fee (PKR)
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
              className="input mt-1.5"
            />
          </label>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
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
