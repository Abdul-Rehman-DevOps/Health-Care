import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Search } from 'lucide-react';
import { api, type Drug, type NewDrug } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirmDelete } from '../hooks/useConfirmDelete';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ActionButtons from '../components/ActionButtons';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import FormField, { fieldInputClass } from '../components/FormField';
import { mergeValidationErrors, requiredField } from '../lib/validation-errors';

const emptyForm: NewDrug = { name: '', stockQuantity: 0, salePrice: 0 };

function drugToForm(d: Drug): NewDrug {
  return {
    name: d.name,
    genericName: d.genericName ?? undefined,
    category: d.category ?? undefined,
    stockQuantity: d.stockQuantity,
    reorderLevel: d.reorderLevel,
    salePrice: Number(d.salePrice) || 0,
  };
}

export default function Pharmacy() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const confirmDelete = useConfirmDelete();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [stockOpen, setStockOpen] = useState<{ id: string; name: string; qty: number } | null>(
    null
  );
  const [form, setForm] = useState<NewDrug>(emptyForm);
  const [stockQty, setStockQty] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [stockFieldErrors, setStockFieldErrors] = useState<Record<string, string>>({});
  const qc = useQueryClient();

  const formModalOpen = addOpen || !!editId;

  const { data, isLoading, error } = useQuery({
    queryKey: ['drugs', search],
    queryFn: () => api.drugs.list(search || undefined),
  });

  const create = useMutation({
    mutationFn: api.drugs.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drugs'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setAddOpen(false);
      setForm(emptyForm);
      toast('Medicine added');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewDrug> }) =>
      api.drugs.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drugs'] });
      setEditId(null);
      setForm(emptyForm);
      toast('Medicine updated');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const updateStock = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) =>
      api.drugs.updateStock(id, qty),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drugs'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setStockOpen(null);
      toast('Stock updated');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const remove = useMutation({
    mutationFn: api.drugs.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drugs'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast('Medicine removed');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const closeFormModal = () => {
    setAddOpen(false);
    setEditId(null);
    setForm(emptyForm);
    setFieldErrors({});
  };

  const pending = create.isPending || update.isPending;
  const submitError = create.error ?? update.error;
  const mergedErrors = mergeValidationErrors(fieldErrors, submitError);
  const stockSubmitError = updateStock.error;
  const mergedStockErrors = mergeValidationErrors(stockFieldErrors, stockSubmitError);

  return (
    <div>
      <PageHeader
        title="Pharmacy"
        subtitle="Medicines, stock levels, and inventory"
        action={
          <button
            type="button"
            onClick={() => {
              setForm(emptyForm);
              setAddOpen(true);
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Add medicine
          </button>
        }
      />

      <div className="search-wrap mb-6">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500/70" />
        <input
          type="search"
          placeholder="Search medicines…"
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
        ) : (
          <div className="overflow-x-auto">
            <table className="table-modern min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600">Drug</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600">Category</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600">Price</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600">Stock</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((d) => (
                  <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-medium">{d.name}</td>
                    <td className="px-5 py-4 text-slate-600">{d.category ?? '—'}</td>
                    <td className="px-5 py-4">PKR {Number(d.salePrice).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      {d.stockQuantity <= (d.reorderLevel ?? 10) ? (
                        <Badge variant="warning">{d.stockQuantity} left</Badge>
                      ) : (
                        <Badge variant="success">{d.stockQuantity}</Badge>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setStockOpen({ id: d.id, name: d.name, qty: d.stockQuantity });
                            setStockQty(d.stockQuantity);
                          }}
                          className="btn-secondary inline-flex py-1.5 text-xs"
                        >
                          <Package className="h-3.5 w-3.5" />
                          Stock
                        </button>
                        <ActionButtons
                          compact
                          showDelete={isAdmin}
                          onEdit={() => {
                            setEditId(d.id);
                            setForm(drugToForm(d));
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        title={editId ? 'Edit medicine' : 'Add medicine'}
        open={formModalOpen}
        onClose={closeFormModal}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const errors: Record<string, string> = {};
            const nameErr = requiredField(form.name, 'Drug name');
            if (nameErr) errors.name = nameErr;
            if (!editId && (form.stockQuantity == null || form.stockQuantity < 0)) {
              errors.stockQuantity = 'Stock quantity cannot be negative';
            }

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
          <FormField label="Drug name" required error={mergedErrors.name}>
            <input
              value={form.name}
              onChange={(e) => {
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
                setForm({ ...form, name: e.target.value });
              }}
              className={fieldInputClass(!!mergedErrors.name)}
            />
          </FormField>
          <FormField label="Generic name" error={mergedErrors.genericName}>
            <input
              value={form.genericName ?? ''}
              onChange={(e) => setForm({ ...form, genericName: e.target.value })}
              className={fieldInputClass(!!mergedErrors.genericName)}
            />
          </FormField>
          <FormField label="Category" error={mergedErrors.category}>
            <input
              value={form.category ?? ''}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={fieldInputClass(!!mergedErrors.category)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            {!editId && (
              <FormField label="Stock qty" error={mergedErrors.stockQuantity}>
                <input
                  type="number"
                  min={0}
                  value={form.stockQuantity ?? 0}
                  onChange={(e) => {
                    setFieldErrors((prev) => ({ ...prev, stockQuantity: undefined }));
                    setForm({ ...form, stockQuantity: Number(e.target.value) });
                  }}
                  className={fieldInputClass(!!mergedErrors.stockQuantity)}
                />
              </FormField>
            )}
            <FormField
              label="Sale price"
              className={editId ? 'col-span-2' : ''}
              error={mergedErrors.salePrice}
            >
              <input
                type="number"
                min={0}
                value={form.salePrice ?? 0}
                onChange={(e) =>
                  setForm({ ...form, salePrice: Number(e.target.value) })
                }
                className={fieldInputClass(!!mergedErrors.salePrice)}
              />
            </FormField>
          </div>
          {submitError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError.message}
            </p>
          )}
          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? 'Saving…' : editId ? 'Update medicine' : 'Add to pharmacy'}
          </button>
        </form>
      </Modal>

      <Modal
        title={`Update stock: ${stockOpen?.name ?? ''}`}
        open={!!stockOpen}
        onClose={() => setStockOpen(null)}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (stockQty < 0) {
              setStockFieldErrors({ stockQuantity: 'Stock quantity cannot be negative' });
              return;
            }
            setStockFieldErrors({});
            if (stockOpen) updateStock.mutate({ id: stockOpen.id, qty: stockQty });
          }}
        >
          <FormField label="Quantity in stock" error={mergedStockErrors.stockQuantity}>
            <input
              type="number"
              min={0}
              value={stockQty}
              onChange={(e) => {
                setStockFieldErrors({});
                setStockQty(Number(e.target.value));
              }}
              className={fieldInputClass(!!mergedStockErrors.stockQuantity)}
            />
          </FormField>
          {stockSubmitError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {stockSubmitError.message}
            </p>
          )}
          <button type="submit" className="btn-primary w-full">
            Update stock
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
