import React from 'react';
import { LegalLayout } from './LegalLayout';

export default function Privacy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="Last updated: September 2026. How we protect your data and privacy."
    >
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">1. Information We Collect</h2>
        <p>
          Movie Wallah values user privacy. We do not require visitors to register an account or provide personal information to browse the catalog, view streaming recommendations, or watch trailers.
        </p>
        <p>
          When you submit a review or rating, we store the display name you provide and the review text. We do not collect sensitive personal data.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">2. Cookies &amp; Local Storage</h2>
        <p>
          We use browser local storage solely to remember user preferences such as your favorites list, theme settings, and UI preferences. We do not use intrusive tracking cookies.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">3. Third-Party Services &amp; Links</h2>
        <p>
          Our platform links directly to third-party streaming providers (e.g. Netflix, Prime Video, Apple TV). When clicking outbound links to external platforms, their respective privacy policies and terms of service apply.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">4. Contact Us</h2>
        <p>
          If you have questions regarding this Privacy Policy, please contact us at <a href="mailto:privacy@moviewallah.online" className="text-red-400 underline">privacy@moviewallah.online</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
