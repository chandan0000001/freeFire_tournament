import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageCircle } from 'lucide-react';
import { site } from '../../config/site.js';
import usePageMeta from '../../hooks/usePageMeta.js';
export default function ContactPage() {
 usePageMeta('Player support', 'Contact the tournament organizer for registration and match support.');
 return <div className="arena-container home-section"><span className="eyebrow">PLAYER SUPPORT</span><div className="section-heading"><div><h1 className="text-3xl font-bold text-white">How can we help?</h1><p>Include your tournament name and registration reference when contacting the organizer.</p></div></div><div className="steps-grid">{site.contactEmail && <article><Mail/><h2>Email the organizer</h2><a className="text-link" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a></article>}{site.communityUrl && <article><MessageCircle/><h2>Community updates</h2><a className="text-link" href={site.communityUrl} target="_blank" rel="noreferrer">Open community</a></article>}<article><h2>Registration help</h2><p>Check your payment and entry status using your registration reference.</p><Link className="text-link" to="/status">Track registration</Link></article></div>{!site.contactEmail && !site.communityUrl && <p className="mt-6 text-slate-400">Organizer contact details have not been configured yet.</p>}</div>;
}
