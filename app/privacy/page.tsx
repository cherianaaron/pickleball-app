"use client";

import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-white/60">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        {/* Content */}
        <div className="glass rounded-3xl p-8 sm:p-12 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
            <p className="text-white/70 leading-relaxed">
              Welcome to PickleBracket ("we," "our," or "us"). We are committed to protecting your personal information 
              and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your 
              information when you use our tournament management application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
            <div className="space-y-4 text-white/70 leading-relaxed">
              <div>
                <h3 className="text-lg font-semibold text-white/90 mb-2">Personal Information</h3>
                <p>When you create an account, we may collect:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Name and email address (via Google or Apple sign-in)</li>
                  <li>Profile picture (if provided by your authentication provider)</li>
                  <li>Account preferences and settings</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white/90 mb-2">Tournament Data</h3>
                <p>When you use our service, we collect:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Tournament names and configurations</li>
                  <li>Player/team names you enter</li>
                  <li>Match scores and results</li>
                  <li>Tournament history</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white/90 mb-2">Usage Information</h3>
                <p>We automatically collect:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Device and browser information</li>
                  <li>IP address and general location</li>
                  <li>Pages visited and features used</li>
                  <li>Time spent on the application</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-white/70 leading-relaxed mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-white/70">
              <li>Provide and maintain our tournament management service</li>
              <li>Process your account registration and authentication</li>
              <li>Save and sync your tournament data across devices</li>
              <li>Process subscription payments (via Stripe)</li>
              <li>Send important service-related notifications</li>
              <li>Improve our application and user experience</li>
              <li>Analyze usage patterns to enhance features</li>
              <li>Respond to your inquiries and support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Information Sharing</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-white/70">
              <li><strong className="text-white/90">Service Providers:</strong> Supabase (database), Stripe (payments), Vercel (hosting), PostHog (analytics)</li>
              <li><strong className="text-white/90">Tournament Collaborators:</strong> When you share a tournament invite code, collaborators can see tournament data</li>
              <li><strong className="text-white/90">Legal Requirements:</strong> If required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
            <p className="text-white/70 leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information. 
              This includes encryption of data in transit (HTTPS), secure authentication via OAuth providers, and 
              regular security assessments. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Data Retention</h2>
            <p className="text-white/70 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide you 
              services. Tournament data is retained until you delete it or close your account. You can request 
              deletion of your data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Your Rights</h2>
            <p className="text-white/70 leading-relaxed mb-4">Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-white/70">
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability (receive your data in a structured format)</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Children's Privacy</h2>
            <p className="text-white/70 leading-relaxed">
              Our service is not directed to children under 13. We do not knowingly collect personal information 
              from children under 13. If you believe we have collected information from a child under 13, 
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Changes to This Policy</h2>
            <p className="text-white/70 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Contact Us</h2>
            <p className="text-white/70 leading-relaxed">
              If you have questions about this Privacy Policy or our privacy practices, please contact us through 
              the bug report feature in the Settings page or reach out to us directly.
            </p>
          </section>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="text-lime-400 hover:text-lime-300 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
