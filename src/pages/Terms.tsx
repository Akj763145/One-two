import React from 'react';
import { LegalLayout } from './LegalLayout';

export default function Terms() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="Terms and conditions governing the use of Movie Wallah streaming directory."
    >
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">1. Acceptance of Terms</h2>
        <p>
          By accessing or using Movie Wallah (moviewallah.online), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may discontinue use of the platform.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">2. Informational Purpose Only</h2>
        <p>
          Movie Wallah provides aggregated metadata, ratings, reviews, and links to verified streaming distributors. Movie Wallah does not operate a streaming host or file server. Content availability on third-party platforms is determined solely by the respective streaming providers and distributors.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">3. User Conduct &amp; Reviews</h2>
        <p>
          Users posting reviews agree to refrain from submitting abusive, hateful, defamatory, or unlawful content. Movie Wallah reserves the right to moderate or remove reviews that violate community standards.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">4. Disclaimers &amp; Limitation of Liability</h2>
        <p>
          Movie Wallah is provided on an "as is" and "as available" basis without warranties of any kind. Movie Wallah will not be liable for any indirect, incidental, or consequential damages resulting from the use of this service or links to third-party providers.
        </p>
      </section>
    </LegalLayout>
  );
}
