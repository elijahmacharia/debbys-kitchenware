'use client';

import { ActionButton } from './ActionButton';
import { deleteMessageAction, markMessageReadAction } from '@/app/(admin)/admin/actions';

export function MessageActions({ id, isRead }: { id: string; isRead: boolean }) {
  return (
    <>
      {!isRead ? <ActionButton action={() => markMessageReadAction(id)}>Mark as read</ActionButton> : null}
      <ActionButton
        action={() => deleteMessageAction(id)}
        confirmMessage="Delete this message? This cannot be undone."
        className="text-danger"
      >
        Delete
      </ActionButton>
    </>
  );
}
