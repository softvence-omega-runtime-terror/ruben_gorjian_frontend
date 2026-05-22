import Navbar from "@/components/navbar";
import Footer from "@/components/footer-secondary";

export const metadata = {
  title: "Refund Policy - Talexia.ai",
  description: "Review Talexia.ai's refund policy.",
};

// Force dynamic rendering since Navbar uses client-side hooks
export const dynamic = "force-dynamic";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 mt-10 lg:mt-14 text-secondary">
        <h1 className="text-4xl font-bold text-primary mb-8 font-sora">
          Refund Policy
        </h1>
        <div className="prose prose-invert prose-slate max-w-none">
          <p className=" mb-6">
            <strong>Effective Date:</strong> December 7, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">No Refund Policy</h2>
            <p className=" mb-4">
              All purchases and subscription payments on Talexia.ai are{" "}
              <strong>non-refundable</strong>. This policy applies to all plans,
              including Calendar-Only, Visual Add-Ons, and Full Management
              subscriptions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              Reasons for No Refunds
            </h2>
            <p className=" mb-4">
              Due to the nature of our digital services, refunds cannot be
              provided because:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>
                <strong>Immediate activation:</strong> Your subscription and
                features are activated instantly upon payment
              </li>
              <li>
                <strong>AI processing costs:</strong> AI caption generation and
                content analysis incur immediate computational costs
              </li>
              <li>
                <strong>Scheduling begins immediately:</strong> Content
                scheduling and posting services start as soon as you subscribe
              </li>
              <li>
                <strong>Custom content creation:</strong> AI-generated captions
                and recommendations are custom-created for your brand and cannot
                be returned
              </li>
              <li>
                <strong>Digital service consumption:</strong> Once accessed,
                digital services cannot be &quot;returned&quot; like physical
                products
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              Subscription Cancellation
            </h2>
            <p className=" mb-4">
              You may cancel your subscription at any time through your account
              settings. When you cancel:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>
                Your subscription remains active until the end of the current
                billing period
              </li>
              <li>
                You retain access to all features until the subscription expires
              </li>
              <li>
                No refund will be issued for the remaining days in the current
                billing period
              </li>
              <li>
                Your subscription will not automatically renew for the next
                billing cycle
              </li>
              <li>You can resubscribe at any time in the future</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">Billing Errors</h2>
            <p className=" mb-4">
              If you believe you were charged in error, contact us within 7 days
              at billing@talexia.ai. We will investigate and, if an error is
              confirmed, issue a refund for:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>Duplicate charges</li>
              <li>Charges after subscription cancellation</li>
              <li>Incorrect billing amounts</li>
              <li>Technical payment processing errors</li>
            </ul>
            <p className=" mt-4">
              Refunds for billing errors will be processed within 10 business
              days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              Service Interruptions
            </h2>
            <p className=" mb-4">
              In the event of extended service outages or technical issues that
              prevent you from using Talexia.ai:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>We will work to resolve issues as quickly as possible</li>
              <li>
                Service credits may be issued for extended outages (24+ hours)
              </li>
              <li>Credits will be applied to your next billing cycle</li>
              <li>Cash refunds will not be issued for service interruptions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              Account Termination
            </h2>
            <p className=" mb-4">
              If your account is terminated for violating our Terms of Service
              or Acceptable Use Policy:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>
                No refund will be issued for the remaining subscription period
              </li>
              <li>
                You forfeit access to all features and content immediately
              </li>
              <li>Scheduled posts will not be published</li>
              <li>You may not create a new account without our permission</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">Founder Pricing</h2>
            <p className=" mb-4">
              Users on founder pricing plans are subject to the same no-refund
              policy:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>
                Founder pricing is a lifetime discount, not a trial period
              </li>
              <li>
                Cancelling a founder plan forfeits the founder pricing
                permanently
              </li>
              <li>
                Resubscribing after cancellation will be at standard pricing
              </li>
              <li>No refunds will be issued if you cancel a founder plan</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              Free Trial (If Applicable)
            </h2>
            <p className=" mb-4">
              If we offer a free trial period in the future:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>You must cancel before the trial ends to avoid charges</li>
              <li>
                Once the trial converts to a paid subscription, the no-refund
                policy applies
              </li>
              <li>Trial periods are clearly disclosed at signup</li>
              <li>You will receive a reminder before the trial ends</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">Chargebacks</h2>
            <p className=" mb-4">
              Initiating a chargeback instead of contacting us directly may
              result in:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>Immediate account suspension</li>
              <li>Loss of access to all content and features</li>
              <li>Permanent ban from creating future accounts</li>
              <li>Legal action to recover costs and fees</li>
            </ul>
            <p className=" mt-4">
              Please contact us first to resolve any billing disputes before
              initiating a chargeback.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">Contact Us</h2>
            <p className="">
              If you have questions about this refund policy or need assistance
              with billing, contact us at:
            </p>
            <p className=" mt-4">
              <strong>Email:</strong> billing@talexia.ai
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
