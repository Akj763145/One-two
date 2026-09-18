import React from 'react';
import { LegalLayout } from './LegalLayout';

export default function About() {
  return (
    <LegalLayout
      title="About Movie Wallah"
      subtitle="Your trusted guide to finding legal streaming platforms, official trailers, and authentic movie reviews."
    >
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Our Mission</h2>
        <p>
          Movie Wallah was built for cinephiles and everyday movie lovers who want an effortless way to discover where their favorite films and series are legally available to stream. With dozens of digital platforms including Netflix, Amazon Prime Video, Disney+ Hotstar, Apple TV, and YouTube, finding who holds the official streaming license can be exhausting.
        </p>
        <p>
          Movie Wallah solves this by aggregating real-time streaming availability, official high-definition trailers, verified ratings, and cast information in one clean, lightning-fast destination.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Strict Legal &amp; Anti-Piracy Commitment</h2>
        <p>
          Movie Wallah <strong>does not host, distribute, upload, or link to pirated content</strong>, illegal downloads, or unauthorized media streams of any kind. Every link provided on our platform connects directly to certified, licensed subscription video on demand (SVOD), advertising video on demand (AVOD), or transactional (rent/buy) services.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Data &amp; Technology</h2>
        <p>
          Our catalog data is powered by The Movie Database (TMDb) and verified streaming provider feeds. We also offer community-driven reviews and discussions to celebrate cinematic art responsibly.
        </p>
      </section>
    </LegalLayout>
  );
}
