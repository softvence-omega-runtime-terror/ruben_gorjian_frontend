import Navbar from "@/components/navbar";
import Footer from "@/components/footer-secondary";

export const metadata = {
  title: "Terms & Conditions - Talexia.ai",
  description:
    "Review Talexia.ai's legal terms for subscriptions, revisions, API usage, posting liability, and platform rules.",
};

// Force dynamic rendering since Navbar uses client-side hooks
export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 mt-10 lg:mt-14 text-secondary">
        <h1 className="text-4xl font-bold text-primary mb-8 font-sora">
          Terms & Conditions
        </h1>
        <div className="prose prose-invert prose-slate max-w-none">
          <p className="mb-6">
            <strong>Effective Date:</strong> December 7, 2025
          </p>

          <section className="mb-8">
            <p className=" mb-6">
              These Terms and Conditions (&quot;Terms&quot;) govern your use of
              Talexia.ai (&quot;Platform&quot;, &quot;Service&quot;,
              &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By accessing
              or using our services, you agree to be bound by these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              1. Subscriptions & Billing
            </h2>
            <p className=" mb-4">
              Talexia.ai operates on a subscription-based model:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Monthly auto-renewal:</strong> All plans automatically
                renew each month unless cancelled
              </li>
              <li>
                <strong>No pausing:</strong> Subscriptions cannot be paused or
                put on hold
              </li>
              <li>
                <strong>Non-refundable:</strong> All payments are non-refundable
                (see Refund Policy)
              </li>
              <li>
                <strong>Founder pricing:</strong> Cancelling a founder plan
                forfeits the discounted rate permanently
              </li>
              <li>
                <strong>Payment processing:</strong> Payments are processed
                securely through Stripe
              </li>
              <li>
                <strong>Price changes:</strong> We reserve the right to change
                pricing with 30 days notice
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">2. Plan Inclusions</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              Calendar-Only Plans
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Content scheduling and calendar management</li>
              <li>Automated posting to connected social accounts</li>
              <li>Platform limits based on plan tier (1-3 accounts)</li>
              <li>No AI-generated visuals or captions included</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              Visual Add-On Plans
            </h3>
            <ul className="list-disc pl-6  space-y-2">
              <li>
                AI-enhanced visuals based on plan quota (20-100 per month)
              </li>
              <li>1 revision per visual included</li>
              <li>Additional revisions may incur extra charges</li>
              <li>Does not include scheduling or posting</li>
            </ul>

            <h3 className="text-xl font-semibold  mb-3 mt-6">
              Full Management Plans
            </h3>
            <ul className="list-disc pl-6  space-y-2">
              <li>
                AI-generated visuals based on plan quota (25-120 per month)
              </li>
              <li>AI-generated captions, hashtags, and CTAs</li>
              <li>1 revision per visual included</li>
              <li>1 revision per caption set included</li>
              <li>Manual caption editing available before posting</li>
              <li>Content scheduling and automated posting</li>
              <li>Platform limits based on plan tier (1-5 accounts)</li>
            </ul>

            <h3 className="text-xl font-semibold  mb-3 mt-6">
              Jewelry-Specific Plans
            </h3>
            <p className=" mb-4">
              Jewelry plans (JCO, JV, JFM) include specialized features:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>Precision AI training for jewelry and luxury goods</li>
              <li>Enhanced product accuracy verification</li>
              <li>Same revision rules as standard plans</li>
              <li>
                Users must verify gemstone, metal, and specification accuracy
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              3. User Responsibilities
            </h2>
            <p className=" mb-4">
              As a user of Talexia.ai, you are responsible for:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>
                Providing accurate brand information and content instructions
              </li>
              <li>Uploading high-quality images and assets</li>
              <li>Reviewing and approving all content before publishing</li>
              <li>Maintaining valid social media API connections</li>
              <li>Ensuring content complies with platform guidelines</li>
              <li>Verifying accuracy of product descriptions and claims</li>
              <li>
                Responding to revision requests within reasonable timeframes
              </li>
              <li>Keeping account credentials secure</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              4. API Posting & Liability
            </h2>
            <p className=" mb-4">
              By connecting your social media accounts, you authorize Talexia.ai
              to publish content on your behalf. However, we are not liable for:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>Failed posts due to API errors or platform issues</li>
              <li>Expired or revoked authentication tokens</li>
              <li>Social media platform outages or API changes</li>
              <li>Account suspensions or penalties from social platforms</li>
              <li>Content that violates platform community guidelines</li>
              <li>Timing delays or scheduling errors</li>
              <li>Loss of engagement or reach due to algorithm changes</li>
            </ul>
            <p className=" mt-4">
              You remain solely responsible for all content published through
              your accounts.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              5. Intellectual Property & Ownership
            </h2>

            <h3 className="text-xl font-semibold  mb-3 mt-6">Your Content</h3>
            <ul className="list-disc pl-6  space-y-2">
              <li>You retain ownership of all original content you upload</li>
              <li>
                You grant us a license to process and enhance your content
              </li>
              <li>
                You receive commercial rights to AI-generated captions and
                recommendations
              </li>
              <li>
                You are responsible for ensuring you have rights to uploaded
                content
              </li>
            </ul>

            <h3 className="text-xl font-semibold  mb-3 mt-6">Our Platform</h3>
            <ul className="list-disc pl-6  space-y-2">
              <li>
                Talexia.ai retains all rights to platform technology and systems
              </li>
              <li>AI models, prompts, and templates are proprietary</li>
              <li>You may not reverse engineer or copy our platform</li>
              <li>Trademarks and branding remain our property</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              6. Prohibited Content & Activities
            </h2>
            <p className=" mb-4">
              You may not use Talexia.ai to create or distribute content that:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>Violates any laws or regulations</li>
              <li>Infringes on intellectual property rights</li>
              <li>Contains hate speech, discrimination, or harassment</li>
              <li>Includes explicit, violent, or illegal content</li>
              <li>Promotes fraud, scams, or deceptive practices</li>
              <li>Violates social media platform policies</li>
            </ul>
            <p className=" mt-4">
              See our Acceptable Use Policy for complete details.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              7. Account Termination
            </h2>
            <p className=" mb-4">
              We reserve the right to suspend or terminate accounts that:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>Violate these Terms or our policies</li>
              <li>Engage in abusive or fraudulent behavior</li>
              <li>Fail to pay subscription fees</li>
              <li>Create multiple accounts to abuse quotas</li>
              <li>Attempt to hack or compromise our systems</li>
            </ul>
            <p className=" mt-4">
              Terminated accounts forfeit all remaining subscription time
              without refund.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              8. Limitation of Liability
            </h2>
            <p className=" mb-4">
              To the maximum extent permitted by law, Talexia.ai shall not be
              liable for:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>Indirect, incidental, or consequential damages</li>
              <li>Loss of profits, revenue, or business opportunities</li>
              <li>Data loss or corruption</li>
              <li>Service interruptions or downtime</li>
              <li>Third-party actions or platform changes</li>
            </ul>
            <p className=" mt-4">
              Our total liability shall not exceed the amount you paid in the
              last 12 months.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              9. Warranty Disclaimer
            </h2>
            <p className="">
              Talexia.ai is provided &quot;as is&quot; without warranties of any
              kind. We do not guarantee uninterrupted service, error-free
              operation, or specific results from using our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              10. Changes to Terms
            </h2>
            <p className="">
              We may update these Terms from time to time. Material changes will
              be communicated via email or platform notification. Continued use
              after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">11. Governing Law</h2>
            <p className="">
              These Terms are governed by the laws of the jurisdiction where
              Talexia.ai operates. Any disputes shall be resolved through
              binding arbitration.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">12. Contact Us</h2>
            <p className="">
              If you have questions about these Terms, contact us at:
            </p>
            <p className=" mt-4">
              <strong>Email:</strong> legal@talexia.ai
              <br />
              <strong>Support:</strong> support@talexia.ai
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
