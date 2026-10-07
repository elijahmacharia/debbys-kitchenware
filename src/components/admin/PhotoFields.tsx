'use client';

import { useRef, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { PlusIcon, TrashIcon } from '@/components/icons';

export interface PhotoValue { url: string; alt: string }

const MAX_EDGE = 1600;

async function preparePhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
    throw new Error('Choose a JPG, PNG or WEBP photo.');
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('That photo could not be read. Save it as a JPG and try again.');
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare that photo.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
  if (!blob) throw new Error('Could not prepare that photo.');
  if (blob.size > 2_400_000) throw new Error('That photo is still too large. Try a smaller one.');
  return blob;
}

/**
 * Photo picker for products and categories.
 *
 * The file is resized in the browser, uploaded, and the returned path is what
 * the form submits. A pasted https link is still accepted for a photo that
 * already lives somewhere else.
 */
export function PhotoFields({
  images, onChange, max = 8, urlName = 'imageUrl', altName = 'imageAlt', showAlt = true,
}: {
  images: PhotoValue[];
  onChange: (images: PhotoValue[]) => void;
  max?: number;
  urlName?: string;
  altName?: string;
  showAlt?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState('');

  const uploadFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setBusy(true);
    setError(null);
    const next = [...images];
    try {
      for (const file of Array.from(list)) {
        if (next.length >= max) break;
        const blob = await preparePhoto(file);
        const body = new FormData();
        body.append('file', blob, 'photo.jpg');
        const response = await fetch('/api/admin/uploads', { method: 'POST', body });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'The photo could not be saved.');
        if (typeof data.url !== 'string') throw new Error('The photo could not be saved.');
        next.push({ url: data.url, alt: '' });
      }
      onChange(next);
    } catch (caught) {
      onChange(next);
      setError(caught instanceof Error ? caught.message : 'The photo could not be saved.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const addLink = () => {
    const url = link.trim();
    if (!url) return;
    if (!/^https:\/\//i.test(url) && !url.startsWith('/media/') && !url.startsWith('/demo-images/')) {
      setError('Paste a link that starts with https://');
      return;
    }
    if (images.length >= max) return;
    setError(null);
    onChange([...images, { url, alt: '' }]);
    setLink('');
  };

  const update = (index: number, patch: Partial<PhotoValue>) =>
    onChange(images.map((image, i) => (i === index ? { ...image, ...patch } : image)));

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    const [row] = next.splice(index, 1);
    next.splice(target, 0, row);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {error ? <Alert tone="error">{error}</Alert> : null}

      {images.map((image, index) => (
        <div key={`${image.url}-${index}`} className="flex flex-wrap items-start gap-3 rounded-3xl border border-line p-3">
          <img src={image.url} alt="" className="h-20 w-20 shrink-0 rounded-2xl bg-canvas object-cover" />
          <div className="min-w-0 flex-1 space-y-2">
            <input type="hidden" name={urlName} value={image.url} />
            {showAlt ? (
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-muted">
                  {index === 0 ? 'Description of the photo' : `Description of photo ${index + 1}`}
                  {index === 0 ? ' · this photo is the one on the product card' : ''}
                </span>
                <input
                  name={altName}
                  value={image.alt}
                  onChange={(event) => update(index, { alt: event.target.value })}
                  placeholder="20 litre blue plastic bucket with handle"
                  className="input"
                />
              </label>
            ) : (
              <p className="truncate text-xs text-muted">{image.url}</p>
            )}
            <div className="flex flex-wrap gap-1">
              {images.length > 1 ? (
                <>
                  <button type="button" className="btn-ghost btn-sm border border-line" onClick={() => move(index, -1)} disabled={index === 0}>Move up</button>
                  <button type="button" className="btn-ghost btn-sm border border-line" onClick={() => move(index, 1)} disabled={index === images.length - 1}>Move down</button>
                </>
              ) : null}
              <button
                type="button"
                className="btn-ghost btn-sm border border-line text-danger"
                onClick={() => onChange(images.filter((_, i) => i !== index))}
                aria-label={`Remove photo ${index + 1}`}
              >
                <TrashIcon className="h-4 w-4" /> Remove
              </button>
            </div>
          </div>
        </div>
      ))}

      {images.length < max ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp"
            multiple={max > 1}
            className="sr-only"
            onChange={(event) => { void uploadFiles(event.target.files); }}
          />
          <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            <PlusIcon className="h-4 w-4" /> {busy ? 'Uploading…' : images.length === 0 ? 'Add a photo' : 'Add another photo'}
          </button>
        </div>
      ) : null}

      {images.length < max ? (
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="photo-link">Image link</label>
          <input
            id="photo-link"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="Or paste an https:// link"
            className="input max-w-sm"
          />
          <button type="button" className="btn-ghost btn-sm border border-line" onClick={addLink}>Use link</button>
        </div>
      ) : null}
    </div>
  );
}
