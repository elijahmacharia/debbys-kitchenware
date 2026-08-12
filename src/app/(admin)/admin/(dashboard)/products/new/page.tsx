import type { Metadata } from 'next';
import Link from 'next/link';
import { getCategoryOptions } from '@/lib/queries/categories';
import { ProductForm } from '@/components/admin/ProductForm';
import { Alert } from '@/components/ui/Alert';
import { ChevronLeftIcon } from '@/components/icons';

export const metadata: Metadata = { title: 'Add a product', robots: { index: false, follow: false } };

export default async function NewProductPage() {
  const categoryOptions = await getCategoryOptions();

  return (
    <div className="max-w-3xl">
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand-700">
        <ChevronLeftIcon className="h-4 w-4" /> Back to products
      </Link>
      <h1 className="mt-3">Add a product</h1>

      {categoryOptions.length === 0 ? (
        <Alert tone="warning" className="mt-4" title="Create a category first">
          A product must belong to a category. <Link href="/admin/categories" className="font-semibold underline">Add a category</Link> and then come back.
        </Alert>
      ) : (
        <div className="mt-5"><ProductForm categoryOptions={categoryOptions} /></div>
      )}
    </div>
  );
}
