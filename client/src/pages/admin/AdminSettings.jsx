import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Settings, Save, CheckCircle, AlertCircle, MessageCircle, Mail, ExternalLink, Send } from 'lucide-react';

export default function AdminSettings() {
  const [formData, setFormData] = useState({
    collegeName: '',
    whatsappCommunityUrl: '',
    adminWhatsAppNumber: '',
    upiId: '',
    upiPayeeName: '',
    upiAid: '',
    announcementBanner: '',
    contactEmail: '',
    brevoSenderEmail: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Test email state
  const [testEmail, setTestEmail] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        if (res.success && res.settings) {
          setFormData({
            collegeName: res.settings.collegeName || '',
            whatsappCommunityUrl: res.settings.whatsappCommunityUrl || '',
            adminWhatsAppNumber: res.settings.adminWhatsAppNumber || '',
            upiId: res.settings.upiId || '',
            upiPayeeName: res.settings.upiPayeeName || '',
            upiAid: res.settings.upiAid || '',
            announcementBanner: res.settings.announcementBanner || '',
            contactEmail: res.settings.contactEmail || '',
            brevoSenderEmail: res.settings.brevoSenderEmail || '',
          });
        }
      } catch (err) {
        setMessage({ type: 'error', text: err.message || 'Unable to load settings' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSendTestEmail = async () => {
    if (!testEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail.trim())) { setTestEmailStatus({ type: 'error', text: 'Enter a valid recipient email before sending a test.' }); return; }
    setTestingEmail(true);
    setTestEmailStatus(null);
    try {
      const res = await api.post('/admin/settings/test-email', { targetEmail: testEmail });
      setTestEmailStatus({ type: 'success', text: res.message || 'Test email dispatched successfully! Check inbox.' });
    } catch (err) {
      setTestEmailStatus({ 
        type: 'error', 
        text: err.response?.data?.message || err.message || 'Brevo email delivery failed.' 
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.put('/admin/settings', formData);
      if (res.success) {
        setMessage({ type: 'success', text: 'Site settings updated successfully' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-extrabold uppercase text-white tracking-wide">
          Community & Payment Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure the official WhatsApp community URL, Admin WhatsApp receipt contact, and organizer UPI details.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
          message.type === 'error' ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300' : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
        }`}>
          {message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl bg-[#24171e] border border-[#49303a] space-y-5 text-xs">
        
        <div>
          <label className="block font-semibold text-slate-300 uppercase mb-1">
            Platform / College Name
          </label>
          <input
            type="text"
            required
            value={formData.collegeName}
            onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#160e13] border border-[#49303a] text-sm text-white focus:outline-none focus:border-brand-orange"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-300 uppercase mb-1">
            Official WhatsApp Community Invite URL *
          </label>
          <input
            type="url"
            required
            placeholder="https://chat.whatsapp.com/..."
            value={formData.whatsappCommunityUrl}
            onChange={(e) => setFormData({ ...formData, whatsappCommunityUrl: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#160e13] border border-[#49303a] text-sm text-white focus:outline-none focus:border-brand-orange"
          />
          <span className="text-[10px] text-slate-500 mt-1 block">
            Used in the top navigation bar, homepage callout, and footer.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 uppercase mb-1">
              Admin WhatsApp Contact Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 919876543210"
              value={formData.adminWhatsAppNumber}
              onChange={(e) => setFormData({ ...formData, adminWhatsAppNumber: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#160e13] border border-[#49303a] text-sm text-white font-mono focus:outline-none focus:border-brand-orange"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Number used for pre-filled payment confirmation chat links.
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 uppercase mb-1">
              Admin UPI ID (Entry Fees) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. organizer@oksbi"
              value={formData.upiId}
              onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#160e13] border border-[#49303a] text-sm text-white font-mono focus:outline-none focus:border-brand-orange"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Receiver VPA address for UPI transactions (e.g. ritesports@oksbi).
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 uppercase mb-1">
              UPI Payee Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Srikant Panda"
              value={formData.upiPayeeName}
              onChange={(e) => setFormData({ ...formData, upiPayeeName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#160e13] border border-[#49303a] text-sm text-white focus:outline-none focus:border-brand-orange"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Merchant / Account holder name registered on UPI.
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 uppercase mb-1">
              UPI AID / Merchant Parameter
            </label>
            <input
              type="text"
              placeholder="e.g. uGICAgIDP-4HlSw"
              value={formData.upiAid}
              onChange={(e) => setFormData({ ...formData, upiAid: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#160e13] border border-[#49303a] text-sm text-white font-mono focus:outline-none focus:border-brand-orange"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Optional UPI aid parameter used for direct Google Pay / PhonePe deep-links.
            </span>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-300 uppercase mb-1">
            Brevo Verified Sender Email *
          </label>
          <input
            type="email"
            required
            value={formData.brevoSenderEmail}
            onChange={(e) => setFormData({ ...formData, brevoSenderEmail: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#160e13] border border-[#49303a] text-sm text-white font-mono focus:outline-none focus:border-brand-orange"
          />
          <span className="text-[10px] text-slate-400 mt-1 block">
            Must match an active, verified sender address in your <a href="https://app.brevo.com/senders" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-0.5">Brevo Senders Dashboard <ExternalLink className="w-2.5 h-2.5" /></a>.
          </span>
        </div>

        <div>
          <label className="block font-semibold text-slate-300 uppercase mb-1">
            Announcement Banner Text
          </label>
          <input
            type="text"
            value={formData.announcementBanner}
            onChange={(e) => setFormData({ ...formData, announcementBanner: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#160e13] border border-[#49303a] text-sm text-white focus:outline-none focus:border-brand-orange"
          />
        </div>

        <div className="pt-3 border-t border-[#49303a] flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-brand-orange text-white font-bold uppercase shadow-glow-orange flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>

      </form>

      {/* Live Brevo Email Delivery Test Box */}
      <div className="p-6 rounded-2xl bg-[#24171e] border border-[#49303a] space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-cyan-400" />
          <h3 className="font-display text-lg font-bold uppercase text-white">Live Brevo Email Delivery Tester</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Send a live test email through Brevo to verify whether Brevo accepts and delivers to your inbox, or returns a sender validation requirement.
        </p>

        {testEmailStatus && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
              testEmailStatus.type === 'error'
                ? 'bg-rose-950/70 border border-rose-500/50 text-rose-200'
                : 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-200'
            }`}
          >
            {testEmailStatus.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" /> : <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />}
            <div>
              <p className="font-bold">{testEmailStatus.type === 'error' ? 'Delivery Error' : 'Success!'}</p>
              <p className="mt-0.5 leading-relaxed">{testEmailStatus.text}</p>
              {testEmailStatus.type === 'error' && testEmailStatus.text.includes('Validate your sender') && (
                <a
                  href="https://app.brevo.com/senders"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-cyan-400 hover:underline mt-1.5"
                >
                  Open Brevo Senders Page to Verify <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Enter destination email address"
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#160e13] border border-[#49303a] text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
          />
          <button
            type="button"
            onClick={handleSendTestEmail}
            disabled={testingEmail || !testEmail}
            className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-md shrink-0"
          >
            {testingEmail ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Checking Relay...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Send Test Email
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
