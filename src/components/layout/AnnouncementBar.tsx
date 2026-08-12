export function AnnouncementBar({ message }: { message: string }) {
  if (!message.trim()) return null;
  return (
    <div className="bg-brand-800 px-4 py-2 text-center text-xs text-brand-50 sm:text-[13px]">{message}</div>
  );
}
