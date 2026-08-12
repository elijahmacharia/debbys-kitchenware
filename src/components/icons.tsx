import type { ReactNode, SVGProps } from 'react';

/**
 * Inline SVG icon set.
 *
 * Hand-rolled rather than pulled from an icon library: the whole set below is
 * a couple of kilobytes and ships no runtime JavaScript, whereas an icon
 * package would add a dependency and a bundle for the same result. Every icon
 * is aria-hidden — the accessible name always comes from the surrounding
 * button or link text.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false" {...props}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (p: IconProps) => (<Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></Icon>);
export const CartIcon = (p: IconProps) => (<Icon {...p}><path d="M2.5 3h2l2.3 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L20 7H6" /><circle cx="9.5" cy="20" r="1.4" /><circle cx="17.5" cy="20" r="1.4" /></Icon>);
export const UserIcon = (p: IconProps) => (<Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></Icon>);
export const MenuIcon = (p: IconProps) => (<Icon {...p}><path d="M3 6h18M3 12h18M3 18h18" /></Icon>);
export const XIcon = (p: IconProps) => (<Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>);
export const PhoneIcon = (p: IconProps) => (<Icon {...p}><path d="M6.6 3h3l1.5 4-2 1.5a12 12 0 0 0 5.4 5.4l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.2 2 2 0 0 1 6.6 3Z" /></Icon>);
export const MailIcon = (p: IconProps) => (<Icon {...p}><rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><path d="m3 7 9 6 9-6" /></Icon>);
export const MapPinIcon = (p: IconProps) => (<Icon {...p}><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" /></Icon>);
export const ClockIcon = (p: IconProps) => (<Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5.2l3.2 2" /></Icon>);
export const HeartIcon = (p: IconProps) => (<Icon {...p}><path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" /></Icon>);
export const HeartFilledIcon = (p: IconProps) => (<Icon fill="currentColor" {...p}><path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" /></Icon>);
export const ChevronRightIcon = (p: IconProps) => (<Icon {...p}><path d="m9 5 7 7-7 7" /></Icon>);
export const ChevronLeftIcon = (p: IconProps) => (<Icon {...p}><path d="m15 5-7 7 7 7" /></Icon>);
export const ChevronDownIcon = (p: IconProps) => (<Icon {...p}><path d="m5 9 7 7 7-7" /></Icon>);
export const PlusIcon = (p: IconProps) => (<Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>);
export const MinusIcon = (p: IconProps) => (<Icon {...p}><path d="M5 12h14" /></Icon>);
export const TrashIcon = (p: IconProps) => (<Icon {...p}><path d="M4 7h16M9 7V5h6v2M6.5 7l.8 12.2A2 2 0 0 0 9.3 21h5.4a2 2 0 0 0 2-1.8L17.5 7" /></Icon>);
export const CheckIcon = (p: IconProps) => (<Icon {...p}><path d="m4.5 12.5 5 5 10-11" /></Icon>);
export const AlertIcon = (p: IconProps) => (<Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.2v.6" /></Icon>);
export const InfoIcon = (p: IconProps) => (<Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.6v.6" /></Icon>);
export const PackageIcon = (p: IconProps) => (<Icon {...p}><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z" /><path d="m3.5 7.5 8.5 4.6 8.5-4.6M12 12.1V21" /></Icon>);
export const TruckIcon = (p: IconProps) => (<Icon {...p}><path d="M2.5 6.5h11v9h-11z" /><path d="M13.5 9.5H17l3.5 3v3h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></Icon>);
export const StoreIcon = (p: IconProps) => (<Icon {...p}><path d="M3.5 9.5V20h17V9.5" /><path d="M2.5 9.5 4.5 4h15l2 5.5a3 3 0 0 1-5.6 1.6 3 3 0 0 1-5.7 0 3 3 0 0 1-5.7-1.6Z" /><path d="M9.5 20v-5.5h5V20" /></Icon>);
export const StarIcon = (p: IconProps) => (<Icon {...p}><path d="m12 4 2.4 5 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.8 9.6 9 12 4Z" /></Icon>);
export const FilterIcon = (p: IconProps) => (<Icon {...p}><path d="M3.5 6h17M6.5 12h11M10 18h4" /></Icon>);
export const SpinnerIcon = (p: IconProps) => (<Icon {...p} className={`animate-spin ${p.className ?? ''}`}><path d="M12 3a9 9 0 1 0 9 9" /></Icon>);
export const ArrowRightIcon = (p: IconProps) => (<Icon {...p}><path d="M4 12h15M13 6l6 6-6 6" /></Icon>);
export const DownloadIcon = (p: IconProps) => (<Icon {...p}><path d="M12 3v11M7.5 10.5 12 15l4.5-4.5M4.5 20h15" /></Icon>);
export const ShareIcon = (p: IconProps) => (<Icon {...p}><path d="M12 15V4M8.5 7.5 12 4l3.5 3.5" /><path d="M5 12v7.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V12" /></Icon>);
export const RefreshIcon = (p: IconProps) => (<Icon {...p}><path d="M20 12a8 8 0 1 1-2.6-5.9" /><path d="M20.5 3.5V9H15" /></Icon>);
export const EditIcon = (p: IconProps) => (<Icon {...p}><path d="M4 20h4.5L19 9.5a2.1 2.1 0 0 0-3-3L5.5 17 4 20Z" /></Icon>);
export const LogOutIcon = (p: IconProps) => (<Icon {...p}><path d="M9 20H5.5A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4H9" /><path d="M15 8.5 18.5 12 15 15.5M18.5 12H9" /></Icon>);
export const HomeIcon = (p: IconProps) => (<Icon {...p}><path d="m3.5 10.5 8.5-7 8.5 7V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1v-9.5Z" /></Icon>);
export const TagIcon = (p: IconProps) => (<Icon {...p}><path d="M3.5 11.5V4.5a1 1 0 0 1 1-1h7l8.5 8.5-8 8-8.5-8.5Z" /><circle cx="8" cy="8" r="1.4" /></Icon>);
export const GridIcon = (p: IconProps) => (<Icon {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></Icon>);
export const UsersIcon = (p: IconProps) => (<Icon {...p}><circle cx="9" cy="8" r="3.5" /><path d="M3 19a6 6 0 0 1 12 0" /><path d="M16 5.2a3.5 3.5 0 0 1 0 5.6M17.5 14.4A6 6 0 0 1 21 19" /></Icon>);
export const SettingsIcon = (p: IconProps) => (<Icon {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" /></Icon>);
export const ChartIcon = (p: IconProps) => (<Icon {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Icon>);
export const ImageIcon = (p: IconProps) => (<Icon {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m4.5 17.5 4.7-4.4 3.3 3 2.8-2.4 4.2 3.8" /></Icon>);
export const EyeIcon = (p: IconProps) => (<Icon {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></Icon>);
export const WifiOffIcon = (p: IconProps) => (<Icon {...p}><path d="m3 3 18 18" /><path d="M8.5 15.5a5 5 0 0 1 7 0" /><path d="M5 12a10 10 0 0 1 3.2-2.2M19 12a10 10 0 0 0-6.6-2.9" /><path d="M1.8 8.6A15 15 0 0 1 7 5.4M22.2 8.6a15 15 0 0 0-8.6-3.3" /><circle cx="12" cy="19" r=".8" fill="currentColor" /></Icon>);

/** Brand marks use their own paths and are filled rather than stroked. */
export const WhatsAppIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...p}>
    <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.74.46 3.44 1.32 4.94L2.1 22l5.35-1.4a9.85 9.85 0 0 0 4.59 1.17h.01c5.43 0 9.84-4.4 9.84-9.84C21.89 6.4 17.48 2 12.04 2Zm0 17.98h-.01a8.2 8.2 0 0 1-4.17-1.14l-.3-.18-3.1.81.83-3.02-.2-.31a8.14 8.14 0 0 1-1.25-4.3c0-4.52 3.68-8.19 8.2-8.19 2.19 0 4.25.86 5.8 2.4a8.15 8.15 0 0 1 2.4 5.8c0 4.52-3.68 8.13-8.2 8.13Zm4.5-6.1c-.25-.13-1.46-.72-1.68-.8-.23-.08-.39-.13-.56.12-.16.25-.64.8-.79.97-.14.16-.29.19-.54.06a6.7 6.7 0 0 1-1.97-1.21 7.4 7.4 0 0 1-1.36-1.7c-.14-.24-.01-.38.11-.5.11-.12.25-.29.37-.44.13-.15.17-.25.25-.42.09-.16.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.42.06-.64.31-.22.25-.84.82-.84 2s.86 2.32.98 2.48c.12.17 1.7 2.6 4.12 3.64.58.25 1.02.4 1.37.51.58.18 1.1.16 1.52.1.46-.07 1.46-.6 1.66-1.18.21-.57.21-1.07.15-1.17-.06-.1-.22-.16-.47-.29Z" />
  </svg>
);
export const InstagramIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...p}>
    <path d="M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.25.07 1.63.07 4.81s0 3.56-.07 4.81c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.25.06-1.63.07-4.85.07s-3.6 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.8 3.8 0 0 1-1.38-.9 3.8 3.8 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.2 15.56 2.2 15.18 2.2 12s0-3.56.07-4.81c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.44 2.2 8.82 2.2 12 2.2Zm0 1.8c-3.13 0-3.5.01-4.73.07-.9.04-1.39.19-1.71.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.32-.28.81-.32 1.71C3.43 8.88 3.42 9.25 3.42 12s.01 3.12.07 4.35c.04.9.19 1.39.32 1.71.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.13.81.28 1.71.32 1.23.06 1.6.07 4.73.07s3.5-.01 4.73-.07c.9-.04 1.39-.19 1.71-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.32.28-.81.32-1.71.06-1.23.07-1.6.07-4.35s-.01-3.12-.07-4.35c-.04-.9-.19-1.39-.32-1.71a2.9 2.9 0 0 0-.69-1.06 2.9 2.9 0 0 0-1.06-.69c-.32-.13-.81-.28-1.71-.32C15.5 4.01 15.13 4 12 4Zm0 3.06a4.94 4.94 0 1 1 0 9.88 4.94 4.94 0 0 1 0-9.88Zm0 8.15a3.21 3.21 0 1 0 0-6.42 3.21 3.21 0 0 0 0 6.42Zm6.3-8.35a1.15 1.15 0 1 1-2.3 0 1.15 1.15 0 0 1 2.3 0Z" />
  </svg>
);
export const FacebookIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...p}>
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22C18.34 21.24 22 17.08 22 12.06Z" />
  </svg>
);
export const TikTokIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...p}>
    <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-1.77-2.45v-3.2a5.79 5.79 0 1 0 4.86 5.71V9.01a7.35 7.35 0 0 0 4.28 1.37V7.29a4.28 4.28 0 0 1-3.22-1.47Z" />
  </svg>
);
