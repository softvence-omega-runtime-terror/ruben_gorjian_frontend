import Navbar from "@/components/navbar";
import Footer from "@/components/footer-secondary";

export const metadata = {
  title: "Acceptable Use Policy - Talexia.ai",
  description: "Review Talexia.ai's acceptable use policy.",
};

// Force dynamic rendering since Navbar uses client-side hooks
export const dynamic = "force-dynamic";

export default function DataUsagePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 mt-10 lg:mt-14 text-secondary">
        <h1 className="text-4xl font-bold  mb-8 font-sora text-primary">
          Acceptable Use Policy
        </h1>
        <div className="prose prose-invert prose-slate max-w-none">
          <p className=" mb-6">
            <strong>Effective Date:</strong> December 7, 2025
          </p>

          <section className="mb-8">
            <p className=" mb-6">
              This Acceptable Use Policy outlines prohibited activities and
              content on the Talexia.ai platform. By using our services, you
              agree to comply with this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">Prohibited Content</h2>
            <p className=" mb-4">
              Users may not upload, generate, or publish content that involves:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>
                <strong>Illegal activity:</strong> Content promoting or
                facilitating illegal activities, including drug trafficking,
                weapons sales, or other criminal conduct
              </li>
              <li>
                <strong>Hate speech or discrimination:</strong> Content that
                promotes hatred, violence, or discrimination based on race,
                ethnicity, religion, gender, sexual orientation, disability, or
                other protected characteristics
              </li>
              <li>
                <strong>Violence:</strong> Graphic violence, gore, or content
                that glorifies or incites violence
              </li>
              <li>
                <strong>Explicit or pornographic content:</strong> Sexually
                explicit material, nudity, or adult content
              </li>
              <li>
                <strong>Copyright infringement:</strong> Unauthorized use of
                copyrighted images, logos, or other intellectual property
              </li>
              <li>
                <strong>Fraud or deception:</strong> Misleading claims, scams,
                phishing attempts, or fraudulent schemes
              </li>
              <li>
                <strong>Political manipulation:</strong> Coordinated inauthentic
                behavior, election interference, or voter suppression
              </li>
              <li>
                <strong>Deepfake impersonation:</strong> Creating or
                distributing manipulated media to impersonate individuals
                without consent
              </li>
              <li>
                <strong>Harassment:</strong> Bullying, stalking, doxxing, or
                targeted harassment of individuals or groups
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              Prohibited Activities
            </h2>
            <p className=" mb-4">Users may not engage in activities that:</p>
            <ul className="list-disc pl-6  space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>
                Infringe on the rights of others, including intellectual
                property rights
              </li>
              <li>
                Attempt to gain unauthorized access to our systems or other
                users&apos; accounts
              </li>
              <li>Distribute malware, viruses, or other harmful code</li>
              <li>
                Spam, send unsolicited messages, or engage in automated abuse
              </li>
              <li>
                Scrape, crawl, or harvest data from the platform without
                permission
              </li>
              <li>
                Reverse engineer, decompile, or attempt to extract source code
              </li>
              <li>Resell or redistribute our services without authorization</li>
              <li>
                Create multiple accounts to evade restrictions or abuse quotas
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              Platform Compliance
            </h2>
            <p className=" mb-4">
              All content published through Talexia.ai must comply with the
              terms of service and community guidelines of the target platforms:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>Instagram Community Guidelines and Terms of Use</li>
              <li>Facebook Community Standards and Terms of Service</li>
              <li>
                LinkedIn Professional Community Policies and User Agreement
              </li>
            </ul>
            <p className=" mt-4">
              Violations of platform policies may result in content removal,
              account suspension, or permanent bans from those platforms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              Reporting Violations
            </h2>
            <p className=" mb-4">
              If you encounter content or behavior that violates this policy,
              please report it to us:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>Email: abuse@talexia.ai</li>
              <li>
                Include details about the violation and relevant account
                information
              </li>
              <li>Provide screenshots or evidence if available</li>
            </ul>
            <p className=" mt-4">
              We review all reports and take appropriate action, which may
              include content removal, account warnings, or account termination.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">Enforcement</h2>
            <p className=" mb-4">Talexia.ai reserves the right to:</p>
            <ul className="list-disc pl-6  space-y-2">
              <li>
                Remove or refuse to publish content that violates this policy
              </li>
              <li>
                Suspend or terminate accounts that repeatedly violate this
                policy
              </li>
              <li>Report illegal activity to law enforcement authorities</li>
              <li>Cooperate with legal investigations and court orders</li>
              <li>
                Take any other action deemed necessary to protect our platform
                and users
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              Account Suspension and Termination
            </h2>
            <p className=" mb-4">Violations of this policy may result in:</p>
            <ul className="list-disc pl-6  space-y-2">
              <li>
                <strong>Warning:</strong> First-time minor violations may
                receive a warning
              </li>
              <li>
                <strong>Temporary suspension:</strong> Repeated or moderate
                violations may result in temporary account suspension
              </li>
              <li>
                <strong>Permanent termination:</strong> Severe or repeated
                violations will result in permanent account termination without
                refund
              </li>
            </ul>
            <p className=" mt-4">
              We reserve the right to terminate accounts immediately for severe
              violations without prior warning.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">Appeals</h2>
            <p className="">
              If you believe your account was suspended or terminated in error,
              you may submit an appeal to support@talexia.ai within 30 days.
              Include your account information and explanation. We will review
              appeals and respond within 10 business days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              Changes to This Policy
            </h2>
            <p className="">
              We may update this Acceptable Use Policy from time to time.
              Continued use of Talexia.ai after changes constitutes acceptance
              of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">Contact Us</h2>
            <p className="">
              If you have questions about this policy, contact us at:
            </p>
            <p className=" mt-4">
              <strong>Email:</strong> support@talexia.ai
              <br />
              <strong>Abuse Reports:</strong> abuse@talexia.ai
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
