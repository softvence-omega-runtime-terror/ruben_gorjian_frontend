import Navbar from "@/components/navbar";
import Footer from "@/components/footer-secondary";

export const metadata = {
  title: "Cookie Policy - Talexia.ai",
  description: "Review Talexia.ai's Cookie Policy and how we use cookies.",
};

// Force dynamic rendering since Navbar uses client-side hooks
export const dynamic = "force-dynamic";

export default function CookiePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 mt-10 lg:mt-14 text-secondary">
        <h1 className="text-4xl font-bold  mb-8 font-sora text-primary">
          Cookie Policy
        </h1>
        <div className="prose prose-invert prose-slate max-w-none">
          <p className=" mb-6">
            <strong>Effective Date:</strong> December 7, 2025
          </p>

          <section className="mb-8">
            <p className=" mb-6">
              This Cookie Policy explains how Talexia.ai uses cookies and
              similar tracking technologies on our website and platform. By
              using our services, you consent to the use of cookies as described
              in this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">What Are Cookies?</h2>
            <p className="">
              Cookies are small text files stored on your device when you visit
              a website. They help websites remember your preferences,
              authenticate your session, and provide analytics about how the
              site is used.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              Types of Cookies We Use
            </h2>

            <h3 className="text-xl font-semibold  mb-3 mt-6">
              1. Essential Cookies
            </h3>
            <p className=" mb-4">
              These cookies are necessary for the platform to function properly.
              They enable core functionality such as:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>User authentication and session management</li>
              <li>Security and fraud prevention</li>
              <li>Load balancing and performance optimization</li>
              <li>Remembering your login state</li>
            </ul>
            <p className=" mt-4">
              <strong>Duration:</strong> Session or up to 30 days
              <br />
              <strong>Can be disabled:</strong> No (required for platform
              functionality)
            </p>

            <h3 className="text-xl font-semibold  mb-3 mt-6">
              2. Analytics Cookies
            </h3>
            <p className=" mb-4">
              We use analytics cookies to understand how visitors interact with
              our platform:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>
                Google Analytics - Track page views, user behavior, and traffic
                sources
              </li>
              <li>
                Vercel Analytics - Monitor performance and user experience
              </li>
              <li>Session recordings and heatmaps (anonymized)</li>
            </ul>
            <p className=" mt-4">
              <strong>Duration:</strong> Up to 2 years
              <br />
              <strong>Can be disabled:</strong> Yes (via cookie preferences)
            </p>

            <h3 className="text-xl font-semibold  mb-3 mt-6">
              3. Marketing Cookies
            </h3>
            <p className=" mb-4">
              Marketing cookies help us deliver relevant advertisements and
              measure campaign effectiveness:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>
                Meta Pixel - Track conversions and optimize Facebook/Instagram
                ads
              </li>
              <li>Google Ads - Measure ad performance and retargeting</li>
              <li>LinkedIn Insight Tag - Track B2B conversions</li>
            </ul>
            <p className=" mt-4">
              <strong>Duration:</strong> Up to 1 year
              <br />
              <strong>Can be disabled:</strong> Yes (via cookie preferences)
            </p>

            <h3 className="text-xl font-semibold  mb-3 mt-6">
              4. Preference Cookies
            </h3>
            <p className=" mb-4">
              These cookies remember your preferences and settings:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>Language and region preferences</li>
              <li>Theme and display settings</li>
              <li>Dashboard layout preferences</li>
              <li>Cookie consent choices</li>
            </ul>
            <p className=" mt-4">
              <strong>Duration:</strong> Up to 1 year
              <br />
              <strong>Can be disabled:</strong> Yes (but may affect user
              experience)
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              Third-Party Cookies
            </h2>
            <p className=" mb-4">
              We use services from third-party providers that may set their own
              cookies:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>
                <strong>Stripe:</strong> Payment processing and fraud prevention
              </li>
              <li>
                <strong>Google:</strong> Analytics, authentication, and
                advertising
              </li>
              <li>
                <strong>Meta (Facebook):</strong> Pixel tracking and advertising
              </li>
              <li>
                <strong>Vercel:</strong> Hosting and analytics
              </li>
            </ul>
            <p className=" mt-4">
              These third parties have their own privacy policies governing
              their use of cookies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">Managing Cookies</h2>
            <p className=" mb-4">
              You can control and manage cookies in several ways:
            </p>

            <h3 className="text-xl font-semibold  mb-3 mt-6">
              Cookie Consent Banner
            </h3>
            <p className=" mb-4">
              When you first visit Talexia.ai, you&apos;ll see a cookie consent
              banner where you can:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>Accept all cookies</li>
              <li>Reject non-essential cookies</li>
              <li>Customize your cookie preferences</li>
            </ul>

            <h3 className="text-xl font-semibold  mb-3 mt-6">
              Browser Settings
            </h3>
            <p className=" mb-4">Most browsers allow you to:</p>
            <ul className="list-disc pl-6  space-y-2">
              <li>View and delete cookies</li>
              <li>Block third-party cookies</li>
              <li>Block all cookies (may affect functionality)</li>
              <li>Set preferences for specific websites</li>
            </ul>
            <p className=" mt-4">
              Refer to your browser&apos;s help documentation for specific
              instructions.
            </p>

            <h3 className="text-xl font-semibold  mb-3 mt-6">Opt-Out Tools</h3>
            <p className=" mb-4">
              You can opt out of specific tracking services:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>
                Google Analytics:{" "}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  className="text-lime-400 hover:text-lime-300"
                >
                  Browser Add-on
                </a>
              </li>
              <li>
                Meta Pixel:{" "}
                <a
                  href="https://www.facebook.com/help/568137493302217"
                  className="text-lime-400 hover:text-lime-300"
                >
                  Facebook Settings
                </a>
              </li>
              <li>
                Network Advertising Initiative:{" "}
                <a
                  href="https://optout.networkadvertising.org/"
                  className="text-lime-400 hover:text-lime-300"
                >
                  NAI Opt-Out
                </a>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              Impact of Disabling Cookies
            </h2>
            <p className=" mb-4">
              Disabling certain cookies may affect your experience:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>
                <strong>Essential cookies:</strong> Platform may not function
                properly
              </li>
              <li>
                <strong>Analytics cookies:</strong> We can&apos;t improve user
                experience based on data
              </li>
              <li>
                <strong>Marketing cookies:</strong> You may see less relevant
                advertisements
              </li>
              <li>
                <strong>Preference cookies:</strong> Settings won&apos;t be
                remembered between sessions
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              Updates to This Policy
            </h2>
            <p className="">
              We may update this Cookie Policy from time to time to reflect
              changes in our practices or legal requirements. We will notify you
              of any material changes by posting the updated policy on this page
              with a new effective date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">Contact Us</h2>
            <p className="">
              If you have questions about our use of cookies, contact us at:
            </p>
            <p className=" mt-4">
              <strong>Email:</strong> privacy@talexia.ai
              <br />
              <strong>Website:</strong> https://talexia.ai
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
