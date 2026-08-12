'use client';

import { useState } from 'react';
import { AdminForm } from './AdminForm';
import { ActionButton } from './ActionButton';
import { TextField, TextAreaField, SelectField, CheckboxField } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChevronDownIcon, GridIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { deleteCategoryAction, reorderCategoryAction, saveCategoryAction } from '@/app/(admin)/admin/actions';

export interface AdminCategory {
  id: string; name: string; slug: string; description: string | null; imageUrl: string | null;
  parentId: string | null; sortOrder: number; isActive: boolean; productCount: number;
  children: AdminCategory[];
}

export function CategoryManager({ categories, flatOptions }: { categories: AdminCategory[]; flatOptions: { id: string; label: string }[] }) {
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [creating, setCreating] = useState(false);

  const close = () => { setEditing(null); setCreating(false); };

  const renderRow = (category: AdminCategory, depth: number) => (
    <div key={category.id}>
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5 last:border-0" style={{ paddingLeft: `${0.75 + depth * 1.25}rem` }}>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
            {category.name}
            {!category.isActive ? <Badge tone="danger">Hidden</Badge> : null}
          </span>
          <span className="block text-[11px] text-subtle">
            /{category.slug} · {category.productCount} product{category.productCount === 1 ? '' : 's'}
          </span>
        </span>

        <div className="flex flex-wrap gap-1">
          <ActionButton action={async () => reorderCategoryAction(category.id, 'up')} title="Move up" variant="ghost">↑</ActionButton>
          <ActionButton action={async () => reorderCategoryAction(category.id, 'down')} title="Move down" variant="ghost">↓</ActionButton>
          <button type="button" onClick={() => { setEditing(category); setCreating(false); }} className="btn-secondary btn-sm">Edit</button>
          <ActionButton
            variant="ghost"
            className="text-danger"
            action={async () => deleteCategoryAction(category.id)}
            confirmMessage={`Delete the category "${category.name}"?`}
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </ActionButton>
        </div>
      </div>
      {category.children.map((child) => renderRow(child, depth + 1))}
    </div>
  );

  const form = (category: AdminCategory | null) => (
    <AdminForm
      action={(data) => saveCategoryAction(category?.id ?? null, data)}
      submitLabel={category ? 'Save changes' : 'Create category'}
      onSuccess={close}
      className="card mt-4 p-4 sm:p-5"
      secondary={<Button type="button" variant="secondary" onClick={close}>Cancel</Button>}
    >
      {(errors) => (
        <div className="space-y-4">
          <h2 className="text-base font-bold">{category ? `Edit ${category.name}` : 'New category'}</h2>
          <TextField name="name" label="Name" required defaultValue={category?.name} error={errors.name} placeholder="e.g. Cooking Utensils" />
          <TextAreaField
            name="description" label="Description" rows={2} defaultValue={category?.description ?? ''} error={errors.description}
            hint="Shown at the top of the category page and used for search engines."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField name="parentId" label="Inside which category" defaultValue={category?.parentId ?? ''} error={errors.parentId} hint="Leave blank to make it a top-level department.">
              <option value="">— Top level —</option>
              {flatOptions.filter((option) => option.id !== category?.id).map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </SelectField>
            <TextField
              name="sortOrder" label="Sort order" type="number" min={0} defaultValue={category?.sortOrder ?? 0} error={errors.sortOrder}
              hint="Lower numbers appear first."
            />
          </div>
          <TextField name="imageUrl" label="Image path or URL" defaultValue={category?.imageUrl ?? ''} error={errors.imageUrl} placeholder="/uploads/category-kitchen.jpg" />
          <CheckboxField name="isActive" label="Visible in the shop" defaultChecked={category?.isActive ?? true} />
        </div>
      )}
    </AdminForm>
  );

  return (
    <div>
      {categories.length === 0 && !creating ? (
        <EmptyState
          icon={<GridIcon className="h-8 w-8" />}
          title="No categories yet"
          description="Categories group your products so customers can find things. Create at least one before adding products."
          action={<Button onClick={() => setCreating(true)}><PlusIcon className="h-4 w-4" />Add a category</Button>}
        />
      ) : null}

      {categories.length > 0 ? (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          {categories.map((category) => renderRow(category, 0))}
        </div>
      ) : null}

      {!creating && !editing ? (
        <Button className="mt-4" variant="secondary" onClick={() => setCreating(true)}>
          <PlusIcon className="h-4 w-4" /> Add a category
        </Button>
      ) : null}

      {creating ? form(null) : null}
      {editing ? form(editing) : null}
    </div>
  );
}
