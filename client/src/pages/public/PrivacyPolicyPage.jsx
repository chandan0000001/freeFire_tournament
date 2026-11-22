import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowUpRight } from 'lucide-react';
import { site } from '../../config/site.js';
import usePageMeta from '../../hooks/usePageMeta.js';

export default function PrivacyPolicyPage() {
  usePageMeta(`Privacy & community play | ${site.name}`, 'How our friendly Free Fire community matches use player information.');
  return <article className="privacy-page arena-container">
    <header><span className="eyebrow"><ShieldCheck size={16}/> COMMUNITY FIRST</span><h1>Privacy & friendly play.</h1><p>What you share. How we use it.</p></header>
    <section className="community-policy-note">
      <h2>A local community, playing together.</h2>
      <p>{site.name} organizes friendly, community-run Free Fire custom-room matches for solo players and squads. These are independent community events, not an official Garena league or a government-endorsed competition.</p>
      <p>Match details disclose any entry fee and prize. Calling an event “friendly” does not create a legal exemption. Participation and event operation remain subject to applicable Indian law and the game publisher’s terms; this page does not certify a paid event as legally approved. Wagering on other players’ results is not permitted.</p>
      <a href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2254606&lang=1&reg=3" target="_blank" rel="noreferrer" className="text-link">India’s online gaming framework <ArrowUpRight size={15}/></a>
    </section>
    <div className="privacy-sections">
      <section><h2>Information you provide</h2><p>Account name, email and mobile number; player names, in-game names, Free Fire UIDs and squad details; match entries and payment references where applicable. Account passwords are stored as hashes. Never send your UPI PIN, OTP or banking password.</p></section>
      <section><h2>How it is used</h2><p>To manage accounts, verify entries and payment references, coordinate rooms, record scores, resolve disputes and maintain organizer audit records. Public standings may show participant names, team names, game IDs and match performance. Email, phone numbers and private payment references are not part of public scorecards.</p></section>
      <section><h2>Services involved</h2><p>Hosting, database, cache, email and analytics providers may process information needed to operate the site. Email notifications use Brevo. Opening WhatsApp or a payment app shares information with that service under its own policy. QR-code generation may send the organizer’s payment details and match amount to the configured QR provider.</p></section>
      <section><h2>Storage and access</h2><p>The browser stores your sign-in token so you can stay signed in. Sign out on shared devices. Organizer access is restricted by account roles. Room credentials are excluded from ordinary public responses. No system can guarantee absolute security.</p></section>
      <section><h2>Your choices</h2><p>Contact the organizer to request access, corrections or deletion of your personal information, or to report a privacy concern. Some registration, payment and audit records may need to be retained to resolve disputes or meet legal obligations; deletion is not automatic when a match ends.</p></section>
      <section><h2>Play responsibly</h2><p>Follow the publisher’s eligibility rules and the published match conditions. Take breaks, respect other players and do not treat prizes as assured income. A friendly match description is not a promise of winnings or a substitute for applicable legal requirements.</p></section>
    </div>
    <footer><div><h2>Questions or a correction?</h2><p>Contact the organizer before sharing sensitive information.</p></div>{site.contactEmail ? <a className="arena-button secondary" href={`mailto:${site.contactEmail}`}>Email the organizer<ArrowUpRight size={16}/></a> : <Link className="arena-button secondary" to="/contact">Contact organizer<ArrowUpRight size={16}/></Link>}</footer>
  </article>;
}
