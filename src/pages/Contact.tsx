import React, { useState } from 'react';
import { LegalLayout } from './LegalLayout';
import { Mail, Send, CheckCircle2 } from 'lucide-react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <LegalLayout
      title="Contact Us"
      subtitle="Have questions, suggestions, or streaming provider updates? Reach out to the Movie Wallah team."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <p>
            Whether you want to suggest missing legal streaming links, report metadata inaccuracies, or inquire about editorial partnerships, we would love to hear from you.
          </p>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <div className="flex items-center gap-3 text-red-500 font-bold">
              <Mail size={20} />
              <span>Direct Email Inquiries</span>
            </div>
            <p className="text-sm text-white/60">
              For general support and partnerships:
            </p>
            <a href="mailto:support@moviewallah.online" className="text-white font-mono hover:text-red-400 block transition-colors">
              support@moviewallah.online
            </a>
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
              <h3 className="text-xl font-bold text-white">Message Received</h3>
              <p className="text-sm text-white/60">
                Thank you for contacting Movie Wallah! Our editorial team will review your message shortly.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold uppercase tracking-wider text-white"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Your Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Your Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Subject</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Provider update / feedback"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Message</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us what you'd like to share..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
              >
                <Send size={16} /> Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </LegalLayout>
  );
}
