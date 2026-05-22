import Navbar from "@/components/navbar";
import Footer from "@/components/footer-secondary";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - Talexia.ai",
  description:
    "Learn how Talexia.ai collects, stores, and protects user data, including social media API permissions, AI-generated content, and account information.",
};

// Force dynamic rendering since Navbar uses client-side hooks
export const dynamic = "force-dynamic";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 mt-10 lg:mt-14 text-secondary">
        <h1 className="text-4xl font-bold  mb-8 font-sora text-primary">
          Privacy Policy
        </h1>
        <div className="prose prose-invert prose-slate max-w-none">
          <p className=" mb-6">
            <em>Last updated: December 2025</em>
          </p>
          <p className=" mb-6">
            Talexia.ai (“Talexia”, “we”, “our”) is committed to protecting your
            privacy. This Privacy Policy describes how we collect, use, and
            protect your information.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              1. Information We Collect
            </h2>
            <p className=" mb-4">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6  space-y-2 mb-4">
              <li>Account information (name, email, password)</li>
              <li>Brand profile information (business details, preferences)</li>
              <li>Content you upload (images, videos, captions)</li>
              <li>Social media account connections</li>
              <li>Payment information (processed securely through Stripe)</li>
            </ul>
            <h3 className="text-2xl font-semibold  mb-4">
              1.1 Personal Information
            </h3>
            <ul className="list-disc pl-6  space-y-2 mb-4">
              <li>Name, email, company name</li>
              <li>Billing information</li>
              <li>IP address & device details</li>
              <li>Platform usage logs</li>
            </ul>
            <h3 className="text-2xl font-semibold  mb-4">
              1.2 Uploaded Content
            </h3>
            <ul className="list-disc pl-6  space-y-2 mb-4">
              <ul>
                <li>Images, videos, captions</li>
                <li>Product data, metadata</li>
              </ul>
            </ul>
            <h3 className="text-2xl font-semibold  mb-4">
              1.3 Social Media API Data
            </h3>
            <p className=" mb-4">
              When connecting your social accounts, we may access:
            </p>
            <ul className="list-disc pl-6  space-y-2 mb-4">
              <li>Page/Account ID</li>
              <li>Publishing permissions</li>
              <li>Media library</li>
              <li>Scheduled posts</li>
              <li>Basic profile data</li>
              <li>Authentication tokens</li>
            </ul>
            <p className=" mb-4">
              <strong>We do not store your passwords.</strong>
            </p>
            <h3 className="text-2xl font-semibold  mb-4">1.4 Analytics Data</h3>
            <p className=" mb-4">Collected via cookies and tracking scripts.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              2. How We Use Your Information
            </h2>
            <p className=" mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6  space-y-2 mb-4">
              <li>Deliver AI-generated content</li>
              <li>Schedule and publish posts</li>
              <li>Manage your account and subscription</li>
              <li>Improve platform performance</li>
              <li>Customer support & notifications</li>
              <li>Provide, maintain, and improve our services</li>
              <li>Generate AI-powered captions and content recommendations</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send you service updates and marketing communications</li>
              <li>Analyze usage patterns to improve our platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              3. Information Sharing
            </h2>
            <p className=" mb-4">
              We do not sell your personal information. We may share your
              information with:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>
                Service providers (Stripe for payments, cloud storage providers)
              </li>
              <li>
                Social media platforms (to publish content on your behalf)
              </li>
              <li>
                AI service providers (to generate captions and analyze content)
              </li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">4. Data Security</h2>
            <p className="">
              We implement industry-standard security measures to protect your
              data, including encryption, secure authentication, and regular
              security audits. However, no method of transmission over the
              internet is 100% secure.
            </p>
            <p className="">
              Users may revoke permissions anytime via the Talexia dashboard or
              their social media account settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              5. Cookies and Tracking
            </h2>
            <p className=" mb-4">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>Maintain your login session</li>
              <li>Remember your preferences</li>
              <li>
                Analyze site traffic and usage (Google Analytics, Meta Pixel)
              </li>
              <li>Improve our marketing efforts</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">6. Your Rights</h2>
            <p className=" mb-4">You have the right to:</p>
            <ul className="list-disc pl-6  space-y-2">
              <li>Access and download your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of marketing communications</li>
              <li>Withdraw consent for data processing</li>
            </ul>
            You may request access, deletion, corrections, or export of your
            data by contacting us at:
            <a href="mailto:support@talexia.ai">support@talexia.ai</a>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">7. Data Retention</h2>
            <p className="">
              We retain your information for as long as your account is active
              or as needed to provide services. After account deletion, we may
              retain certain information for legal compliance, fraud prevention,
              and backup purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              8. Third-Party Services
            </h2>
            <p className=" mb-4">
              Our platform integrates with third-party services including:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>Instagram, Facebook, LinkedIn (for content publishing)</li>
              <li>Stripe (for payment processing)</li>
              <li>OpenAI/Claude/Gemini (for AI content generation)</li>
              <li>Cloudflare R2/AWS S3 (for file storage)</li>
            </ul>
            <p className=" mt-4">
              These services have their own privacy policies governing their use
              of your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              9. Children&apos;s Privacy
            </h2>
            <p className="">
              Our services are not intended for users under 18 years of age. We
              do not knowingly collect information from children.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              10. Changes to This Policy
            </h2>
            <p className="">
              We may update this privacy policy from time to time. We will
              notify you of any material changes by email or through our
              platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">11. Contact Us</h2>
            <p className="">
              If you have questions about this privacy policy or our data
              practices, contact us at:
            </p>
            <p className=" mt-4">
              <strong>Email:</strong>{" "}
              <a
                href="mailto:privact@talexia.ai"
                className="text-lime-400 hover:text-lime-300"
              >
                privacy@talexia.ai{" "}
              </a>
              <br />
              <strong>Website:</strong>{" "}
              <Link
                href="https://talexia.ai"
                className="text-lime-400 hover:text-lime-300"
              >
                https://talexia.ai
              </Link>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
