"use client";

import Link from "next/link";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Cookie Policy</h1>
          <p className="text-white/60">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        {/* Content */}
        <div className="glass rounded-3xl p-8 sm:p-12 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. What Are Cookies</h2>
            <p className="text-white/70 leading-relaxed">
              Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you 
              visit a website. They are widely used to make websites work more efficiently, provide a better user 
              experience, and give website owners useful information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Cookies</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              PickleBracket uses cookies and similar technologies for the following purposes:
            </p>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-lime-400 mb-2">Essential Cookies</h3>
                <p className="text-white/70 text-sm">
                  These cookies are necessary for the website to function properly. They enable core functionality 
                  such as user authentication, session management, and security features. You cannot opt out of 
                  these cookies as the service would not work without them.
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-lime-400 mb-2">Authentication Cookies</h3>
                <p className="text-white/70 text-sm">
                  We use cookies to keep you signed in to your account and maintain your session. These are set 
                  when you log in via Google authentication and are essential for accessing your 
                  tournaments and settings.
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-lime-400 mb-2">Analytics Cookies</h3>
                <p className="text-white/70 text-sm">
                  We use analytics tools (PostHog, Vercel Analytics) to understand how visitors interact with our 
                  website. These cookies collect information about page views, feature usage, and performance 
                  metrics to help us improve the application.
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-lime-400 mb-2">Preference Cookies</h3>
                <p className="text-white/70 text-sm">
                  These cookies remember your preferences and settings, such as tournament configurations and 
                  display options, to provide a more personalized experience.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Third-Party Cookies</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              Some cookies are placed by third-party services that appear on our pages:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4 text-white font-semibold">Provider</th>
                    <th className="text-left py-3 px-4 text-white font-semibold">Purpose</th>
                    <th className="text-left py-3 px-4 text-white font-semibold">Type</th>
                  </tr>
                </thead>
                <tbody className="text-white/70">
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Supabase</td>
                    <td className="py-3 px-4">Authentication & Database</td>
                    <td className="py-3 px-4">Essential</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Stripe</td>
                    <td className="py-3 px-4">Payment Processing</td>
                    <td className="py-3 px-4">Essential</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Vercel</td>
                    <td className="py-3 px-4">Hosting & Analytics</td>
                    <td className="py-3 px-4">Analytics</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">PostHog</td>
                    <td className="py-3 px-4">Product Analytics</td>
                    <td className="py-3 px-4">Analytics</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Google</td>
                    <td className="py-3 px-4">OAuth Authentication</td>
                    <td className="py-3 px-4">Essential</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Local Storage</h2>
            <p className="text-white/70 leading-relaxed">
              In addition to cookies, we use browser local storage to save certain data locally on your device. 
              This includes temporary tournament data for offline access and user interface preferences. 
              Local storage data remains on your device until you clear your browser data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Managing Cookies</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              You can control and manage cookies in several ways:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-white/70">
              <li>
                <strong className="text-white/90">Browser Settings:</strong> Most browsers allow you to refuse 
                or accept cookies, delete existing cookies, and set preferences for certain websites.
              </li>
              <li>
                <strong className="text-white/90">Private Browsing:</strong> Using private/incognito mode will 
                prevent cookies from being stored after your session ends.
              </li>
              <li>
                <strong className="text-white/90">Third-Party Tools:</strong> Various browser extensions can 
                help manage cookies and tracking.
              </li>
            </ul>
            <p className="text-white/70 leading-relaxed mt-4">
              Please note that disabling essential cookies may prevent you from using certain features of 
              PickleBracket, including signing in to your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Cookie Retention</h2>
            <p className="text-white/70 leading-relaxed">
              Different cookies have different lifespans:
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-2 text-white/70">
              <li><strong className="text-white/90">Session cookies:</strong> Deleted when you close your browser</li>
              <li><strong className="text-white/90">Persistent cookies:</strong> Remain until they expire or you delete them</li>
              <li><strong className="text-white/90">Authentication cookies:</strong> Typically last for 7-30 days depending on your session settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Updates to This Policy</h2>
            <p className="text-white/70 leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for 
              operational, legal, or regulatory reasons. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Contact Us</h2>
            <p className="text-white/70 leading-relaxed">
              If you have questions about our use of cookies, please contact us through the bug report feature 
              in the Settings page.
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
