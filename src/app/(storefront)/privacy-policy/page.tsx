import type { Metadata } from 'next';
import { getPublicSettings } from '@/lib/settings';
import { business } from '@/lib/config';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: `How ${business.name} collects, uses and protects your personal information.`,
  alternates: { canonical: '/privacy-policy' },
};

export default async function PrivacyPolicyPage() {
  const settings = await getPublicSettings();

  return (
    <LegalPage
      title="Privacy policy"
      description="What we collect, why, and what we do with it."
      breadcrumb="Privacy policy"
      custom={settings.privacyPolicy}
    >
      <h2>What we collect</h2>
      <p>When you place an order we collect your name, phone number and, if you give it, your email
        address. For delivery we also collect your county, town, area and any estate, building, landmark
        or directions you provide. If you create an account we store the same details plus your order
        history, saved addresses and wishlist.</p>
      <p>We do not collect or store card details. No card payment is taken on this website.</p>

      <h2>Why we collect it</h2>
      <ul>
        <li>To take, pack and deliver your order.</li>
        <li>To contact you about that order, by phone or WhatsApp.</li>
        <li>To keep a record of what we have sold, as any shop must.</li>
        <li>To send you offers, but only if you tick the box asking for them. You can turn that off at any time in your account settings.</li>
      </ul>

      <h2>Who can see it</h2>
      <p>Your information is visible to you, and to {business.name} staff who need it to fulfil your
        order. We do not sell it or share it with advertisers. Where a delivery rider needs your address
        and phone number to reach you, they are given only that.</p>

      <h2>How it is protected</h2>
      <p>Passwords are stored only as one-way hashes and can never be read back, by us or by anyone who
        obtained a copy of the database. Sessions use signed, HTTP-only cookies. Account pages and order
        details are checked on the server against who you are signed in as, so one customer cannot open
        another customer&apos;s order.</p>

      <h2>Cookies</h2>
      <p>We use a small number of cookies that are necessary for the site to work: one to keep you signed
        in, and one that lets a guest reopen the order they just placed. Your shopping cart is stored in
        your own browser, not on our servers, unless you are signed in. We do not use advertising
        cookies. [If Google Analytics is switched on, it will also set its own cookies, the business
        must confirm whether it is in use.]</p>

      <h2>How long we keep it</h2>
      <p>[The business must decide and state a retention period, for example, order records kept for
        [NUMBER] years for accounting purposes, and account data kept until you ask us to delete it.]</p>

      <h2>Your rights</h2>
      <p>Under the Kenyan Data Protection Act, 2019 you can ask us for a copy of the personal data we
        hold about you, ask us to correct it, or ask us to delete it. Contact us and we will action it.
        [The business should confirm whether it is registered with the Office of the Data Protection
        Commissioner, and name a contact person for data requests.]</p>

      <h2>Changes</h2>
      <p>If this policy changes we will update this page. [Add a &ldquo;last updated&rdquo; date once the
        final version is approved.]</p>
    </LegalPage>
  );
}
