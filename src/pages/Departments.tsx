import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus } from 'lucide-react';
import { api, type Department, type NewDepartment } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirmDelete } from '../hooks/useConfirmDelete';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ActionButtons from '../components/ActionButtons';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const COLORS = ['#0D9488', '#0891B2', '#7C3AED', '#BE185D', '#2563EB', '#059669'];

const emptyForm: NewDepartment = { name: '', code: '', color: COLORS[0] };

function departmentToForm(d: Department): NewDepartment {
  return {
    name: d.name,
    code: d.code,
    description: d.description ?? undefined,
    color: d.color,
  };
}

export default function Departments() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const confirmDelete = useConfirmDelete();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<NewDepartment>(emptyForm);
  const qc = useQueryClient();

  const modalOpen = open || !!editId;

  const { data, isLoading, error } = useQuery({
    queryKey: ['departments'],
    queryFn: api.departments.list,
    staleTime: 60_000,
  });

  const create = useMutation({
    mutationFn: api.departments.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast('Department added');
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewDepartment> }) =>
      api.departments.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      setEditId(null);
      setForm(emptyForm);
      toast('Department updated');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const remove = useMutation({
    mutationFn: api.departments.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast('Department removed');
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
        title="Departments"
        subtitle="Hospital units and outpatient sections"
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
            Add department
          </button>
        }
      />

      {error && (
        <div className="alert-error">{error.message}</div>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : data?.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Building2}
            title="No departments"
            description="Add your first hospital department."
          />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((d, i) => (
            <div
              key={d.id}
              className="card card-interactive overflow-hidden hover:-translate-y-1"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="h-1.5" style={{ backgroundColor: d.color }} />
              <div className="flex items-start justify-between gap-3 p-5">
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-11 w-11 shrink-0 animate-float items-center justify-center rounded-xl text-white shadow-md"
                    style={{ backgroundColor: d.color, animationDelay: `${i * 0.2}s` }}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{d.name}</p>
                    <p className="mt-1 font-mono text-xs font-semibold text-slate-400">
                      {d.code}
                    </p>
                  </div>
                </div>
                <ActionButtons
                  compact
                  showDelete={isAdmin}
                  onEdit={() => {
                    setEditId(d.id);
                    setForm(departmentToForm(d));
                  }}
                  onDelete={() =>
                    confirmDelete.ask({
                      title: `Remove ${d.name}?`,
                      message: 'Doctors linked to this department will be unassigned.',
                      onConfirm: async () => {
                        await remove.mutateAsync(d.id);
                      },
                    })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        title={editId ? 'Edit department' : 'Add department'}
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
          <label className="block text-sm font-medium">
            Department name *
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input mt-1.5"
              placeholder="e.g. Cardiology"
            />
          </label>
          <label className="block text-sm font-medium">
            Code *
            <input
              required
              maxLength={10}
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
              className="input mt-1.5 font-mono"
              placeholder="e.g. CARD"
            />
          </label>
          <label className="block text-sm font-medium">
            Description
            <input
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input mt-1.5"
            />
          </label>
          <label className="block text-sm font-medium">
            Color
            <div className="mt-2 flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`h-8 w-8 rounded-full transition ring-offset-2 ${
                    form.color === c ? 'ring-2 ring-brand-600 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </label>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? 'Saving…' : editId ? 'Update department' : 'Add department'}
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
