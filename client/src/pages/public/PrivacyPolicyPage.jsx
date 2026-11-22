import { site } from '../../config/site.js';
import React from 'react';
import { ShieldCheck, Lock, Eye, FileText, CheckCircle, Mail } from 'lucide-react';
import usePageMeta from '../../hooks/usePageMeta.js';

export default function PrivacyPolicyPage() {
  usePageMeta('Privacy Policy | Rahul Esports Arena', 'Privacy and data protection terms for Rahul Esports Free Fire competitive league participants.');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="border-b border-[#393236] pb-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" /> Gamer Data Protection
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-white tracking-wide">
          Privacy Policy & Fair Play Consent
        </h1>
        <p className="text-xs text-slate-400">
          Last updated: November 2026 • Official {site.name} policy.
        </p>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
        
        {/* Section 1 */}
        <div className="p-6 rounded-2xl bg-[#1c1b1e] border border-[#393236] space-y-3">
          <h2 className="font-display text-lg font-bold uppercase text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-orange" /> 1. Information We Collect
          </h2>
          <p>
            {site.name} is a competitive esports tournament platform. When registering for a Squad or Solo Free Fire tournament, we collect only necessary competition details:
          </p>
          <ul className="space-y-2 pl-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Player Identity:</strong> Captain / player full name, email address, phone number, and location (city/state) for verification.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Free Fire In-Game Details:</strong> Player In-Game Names (IGNs) and 6–17 digit Free Fire UIDs for custom room slot assignments.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Payment Data:</strong> 12-digit UPI UTR Transaction IDs provided to confirm tournament slot entry and match scheduling.</span>
            </li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="p-6 rounded-2xl bg-[#1c1b1e] border border-[#393236] space-y-3">
          <h2 className="font-display text-lg font-bold uppercase text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" /> 2. How Your Data Is Used
          </h2>
          <p>Your information is used exclusively to facilitate fair and transparent tournament operations:</p>
          <ul className="space-y-1.5 pl-2">
            <li>• Verifying that all participants are registered with legitimate Free Fire mobile accounts.</li>
            <li>• Securely dispatching Custom Room ID and Password via Brevo transactional emails and WhatsApp to verified team leaders.</li>
            <li>• Tracking match kills and placement scores via referee observations.</li>
            <li>• Displaying leaderboard ranks and Hall of Fame winner honors.</li>
            <li>• Releasing UPI cash prize payouts directly to winning players.</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="p-6 rounded-2xl bg-[#1c1b1e] border border-[#393236] space-y-3">
          <h2 className="font-display text-lg font-bold uppercase text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" /> 3. Data Confidentiality & Zero Third-Party Sharing
          </h2>
          <p>
            We adhere to strict data security standards:
          </p>
          <ul className="space-y-1.5 pl-2">
            <li>• <strong>No Data Selling:</strong> We never sell, rent, or trade gamer data, phone numbers, or emails to third parties or marketing advertisers.</li>
            <li>• <strong>Protected Room Passwords:</strong> Room credentials are encrypted and visible only to verified participants and match administrators.</li>
            <li>• <strong>Payment Evidence Security:</strong> Payment verification screenshots are reviewed solely by the authorized tournament administrator.</li>
          </ul>
        </div>

        {/* Section 4 */}
        <div className="p-6 rounded-2xl bg-[#1c1b1e] border border-[#393236] space-y-3">
          <h2 className="font-display text-lg font-bold uppercase text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-400" /> 4. Contact Tournament Administration
          </h2>
          <p>
            If you have questions regarding data privacy, tournament registrations, or leaderboard rankings, contact our administration:
          </p>
          <div className="p-3 rounded-lg bg-[#111214] border border-[#393236] space-y-1 font-mono text-slate-300">
            <p>Admin Email: <span className="text-white">{site.contactEmail || 'Contact the organizer through the support page'}</span></p>
            <p>Admin Support: <span className="text-white">Official Helpdesk via WhatsApp Community</span></p>
            <p>Platform: <span className="text-white">{site.name}</span></p>
          </div>
        </div>

      </div>

    </div>
  );
}
