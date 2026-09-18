import React from 'react';
import { LegalLayout } from './LegalLayout';

export default function DMCA() {
  return (
    <LegalLayout
      title="DMCA &amp; Copyright Policy"
      subtitle="Digital Millennium Copyright Act Compliance and Takedown Requests"
    >
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Copyright Compliance</h2>
        <p>
          Movie Wallah respects the intellectual property rights of creators, studios, and copyright holders worldwide.
        </p>
        <p>
          <strong>Notice:</strong> Movie Wallah is an informational directory and streaming guide. We <strong>do not store, host, encode, or stream copyrighted video files</strong> on our servers. All video trailers are embedded directly from official, verified YouTube studio channels under YouTube's Terms of Service and API Guidelines.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Filing a DMCA Notice</h2>
        <p>
          If you are a copyright owner or an agent thereof and believe that any content or metadata on Movie Wallah infringes upon your copyright, please provide written notice containing:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-white/80">
          <li>Identification of the copyrighted work claimed to have been infringed.</li>
          <li>Identification of the material that is claimed to be infringing, with precise URLs.</li>
          <li>Your contact information (name, address, telephone number, and email address).</li>
          <li>A statement that you have a good faith belief that use of the material is unauthorized.</li>
          <li>A statement made under penalty of perjury that the information is accurate and you are authorized to act.</li>
        </ul>
        <p className="mt-4">
          Send all notices to: <a href="mailto:dmca@moviewallah.online" className="text-red-400 underline">dmca@moviewallah.online</a>. Inquiries are processed within 24 to 48 hours.
        </p>
      </section>
    </LegalLayout>
  );
}
