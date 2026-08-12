import type { Metadata } from 'next';
import Link from 'next/link';
import { getCategoryTree } from '@/lib/queries/categories';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { ChevronRightIcon, GridIcon } from '@/components/icons';

export const metadata: Metadata = {
  title: 'All categories',
  description: 'Browse every department: kitchenware, household goods, plastic products, storage and cleaning items.',
  alternates: { canonical: '/categories' },
};

export default async function CategoriesPage() {
  const tree = await getCategoryTree();

  return (
    <div className="container-site py-6">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Categories' }]} />
      <h1 className="mt-3">All categories</h1>
      <p className="mt-1 text-sm text-muted">Everything in the shop, grouped by department.</p>

      {tree.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No categories yet"
            description="Categories will appear here once they are added."
            action={<ButtonLink href="/shop">Browse all products</ButtonLink>}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tree.map((category) => (
            <section key={category.id} className="card p-4">
              <Link href={`/category/${category.slug}`} className="group flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700"><GridIcon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-base font-semibold text-ink group-hover:text-brand-700">
                    {category.name}
                    <ChevronRightIcon className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
                  </span>
                  <span className="block text-xs text-muted">{category.productCount} products</span>
                </span>
              </Link>

              {category.description ? <p className="mt-2.5 text-sm leading-relaxed text-muted">{category.description}</p> : null}

              {category.children.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                  {category.children.map((child) => (
                    <li key={child.id}>
                      <Link href={`/category/${child.slug}`} className="inline-block rounded-full border border-line px-2.5 py-1 text-xs text-ink hover:border-brand-300 hover:bg-brand-50">
                        {child.name} <span className="text-subtle">({child.productCount})</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
