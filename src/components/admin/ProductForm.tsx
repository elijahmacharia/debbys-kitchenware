'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AdminForm } from './AdminForm';
import { TextField, TextAreaField, SelectField, CheckboxField } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Alert';
import { PlusIcon, TrashIcon } from '@/components/icons';
import { centsToInput } from '@/lib/money';
import { saveProductAction } from '@/app/(admin)/admin/actions';

export interface ProductFormValues {
  id: string;
  name: string; sku: string; description: string; keywords: string; categoryId: string;
  priceCents: number; salePriceCents: number | null; stock: number; lowStockAt: number; unit: string;
  isActive: boolean; isFeatured: boolean; isNewArrival: boolean;
  metaTitle: string | null; metaDescription: string | null;
  images: { url: string; alt: string }[];
}

export function ProductForm({
  product, categoryOptions,
}: {
  product?: ProductFormValues;
  categoryOptions: { id: string; label: string; isActive: boolean }[];
}) {
  const [images, setImages] = useState<{ url: string; alt: string }[]>(
    product?.images.length ? product.images : [{ url: '', alt: '' }],
  );

  const setImage = (index: number, key: 'url' | 'alt', value: string) =>
    setImages((current) => current.map((image, i) => (i === index ? { ...image, [key]: value } : image)));

  return (
    <AdminForm
      action={(form) => saveProductAction(product?.id ?? null, form)}
      submitLabel={product ? 'Save changes' : 'Create product'}
      redirectTo="/admin/products"
      secondary={<Link href="/admin/products" className="btn-secondary">Cancel</Link>}
    >
      {(errors) => (
        <div className="space-y-4">
          <section className="card space-y-4 p-4 sm:p-5">
            <h2 className="text-base font-bold">Basics</h2>
            <TextField name="name" label="Product name" required defaultValue={product?.name} error={errors.name} placeholder="e.g. 20L Plastic Bucket" />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="sku" label="SKU" required defaultValue={product?.sku} error={errors.sku}
                placeholder="e.g. DK-BKT-020" hint="Your own code for this item. Must be unique."
              />
              <SelectField name="categoryId" label="Category" required defaultValue={product?.categoryId} error={errors.categoryId}>
                <option value="">Choose a category…</option>
                {categoryOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}{option.isActive ? '' : ' (hidden)'}</option>
                ))}
              </SelectField>
            </div>
            <TextAreaField
              name="description" label="Description" required rows={5} defaultValue={product?.description} error={errors.description}
              hint="What it is, what size, what it is good for. This is what convinces someone to buy."
            />
            <TextField
              name="keywords" label="Search keywords" defaultValue={product?.keywords} error={errors.keywords}
              placeholder="ndoo, pail, water bucket"
              hint="Comma separated. Other words customers might search for, including Swahili names."
            />
          </section>

          <section className="card space-y-4 p-4 sm:p-5">
            <h2 className="text-base font-bold">Price and stock</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="price" label="Price (KSh)" required inputMode="decimal"
                defaultValue={product ? centsToInput(product.priceCents) : ''} error={errors.priceCents}
                placeholder="450" hint="Just the number, e.g. 450 or 450.50"
              />
              <TextField
                name="salePrice" label="Sale price (KSh)" inputMode="decimal"
                defaultValue={product?.salePriceCents ? centsToInput(product.salePriceCents) : ''} error={errors.salePriceCents}
                placeholder="Leave blank if not on sale"
                hint="Must be lower than the normal price. Leave blank to remove a sale."
              />
              <TextField name="stock" label="Stock" required inputMode="numeric" type="number" min={0} defaultValue={product?.stock ?? 0} error={errors.stock} />
              <TextField
                name="lowStockAt" label="Warn me at" inputMode="numeric" type="number" min={0}
                defaultValue={product?.lowStockAt ?? 5} error={errors.lowStockAt}
                hint="Flag this product as low when stock drops to this number."
              />
              <TextField name="unit" label="Sold by" defaultValue={product?.unit ?? 'each'} error={errors.unit} placeholder="each, pack, set, dozen" />
            </div>
          </section>

          <section className="card space-y-3 p-4 sm:p-5">
            <h2 className="text-base font-bold">Images</h2>
            <Alert tone="info">
              Upload is not built yet. Put an image file in <code>public/uploads/</code> and enter its path
              here, for example <code>/uploads/bucket-20l.jpg</code>, or paste a full https:// URL. The
              first image is the one shown on product cards.
            </Alert>

            {images.map((image, index) => (
              <div key={index} className="grid gap-3 rounded-card border border-line p-3 sm:grid-cols-[1fr_1fr_auto]">
                <TextField
                  name="imageUrl" label={`Image ${index + 1} path or URL`} hideLabel={index > 0}
                  value={image.url} onChange={(e) => setImage(index, 'url', e.target.value)}
                  placeholder="/uploads/my-photo.jpg"
                />
                <TextField
                  name="imageAlt" label="Alt text (describes the photo)" hideLabel={index > 0}
                  value={image.alt} onChange={(e) => setImage(index, 'alt', e.target.value)}
                  placeholder="20 litre blue plastic bucket with handle"
                />
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => setImages((c) => (c.length === 1 ? [{ url: '', alt: '' }] : c.filter((_, i) => i !== index)))}
                    className="btn-ghost btn-sm border border-line text-danger"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {images.length < 8 ? (
              <button type="button" onClick={() => setImages((c) => [...c, { url: '', alt: '' }])} className="btn-secondary btn-sm">
                <PlusIcon className="h-4 w-4" /> Add another image
              </button>
            ) : null}
          </section>

          <section className="card space-y-3 p-4 sm:p-5">
            <h2 className="text-base font-bold">Where it appears</h2>
            <CheckboxField
              name="isActive" label="Visible in the shop" defaultChecked={product?.isActive ?? true}
              hint="Uncheck to hide it from customers without deleting it."
            />
            <CheckboxField name="isFeatured" label="Featured on the homepage" defaultChecked={product?.isFeatured ?? false} />
            <CheckboxField name="isNewArrival" label="Show in New arrivals" defaultChecked={product?.isNewArrival ?? false} />
          </section>

          <section className="card space-y-4 p-4 sm:p-5">
            <h2 className="text-base font-bold">Search engine listing</h2>
            <p className="text-xs text-muted">Optional. Leave blank and we use the product name and description.</p>
            <TextField name="metaTitle" label="Page title" defaultValue={product?.metaTitle ?? ''} error={errors.metaTitle} maxLength={70} hint="Up to about 70 characters." />
            <TextAreaField name="metaDescription" label="Meta description" rows={2} defaultValue={product?.metaDescription ?? ''} error={errors.metaDescription} maxLength={180} hint="Up to about 180 characters." />
          </section>
        </div>
      )}
    </AdminForm>
  );
}
