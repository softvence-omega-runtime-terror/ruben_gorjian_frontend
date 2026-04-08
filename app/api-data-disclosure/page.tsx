import Navbar from "@/components/navbar";
import Footer from "@/components/footer-secondary";

export const metadata = {
  title: "API Data Usage Disclosure - Talexia.ai",
  description: "Review Talexia.ai's API Data Usage Disclosure.",
};

// Force dynamic rendering since Navbar uses client-side hooks
export const dynamic = "force-dynamic";

export default function ApiDataUsageDisclosurePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 mt-10 lg:mt-14 text-secondary">
        <h1 className="text-4xl font-bold text-primary font-sora mb-8">
          API Data Usage Disclosure
        </h1>
        <div className="prose prose-invert prose-slate max-w-none">
          <p className=" mb-6">
            <strong>Effective Date:</strong> December 7, 2025
          </p>

          <section className="mb-8">
            <p className=" mb-6">
              Talexia.ai uses official APIs from Instagram, Facebook, and
              LinkedIn to schedule and publish content on your behalf. This
              disclosure outlines what data we access and how we use it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">What We Access</h2>
            <p className=" mb-4">
              When you connect your social media accounts, we request access to:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>Account/Page ID and basic profile information</li>
              <li>Publishing permissions to post content on your behalf</li>
              <li>Media library access to upload images and videos</li>
              <li>Scheduled posts to manage your content calendar</li>
              <li>Authentication tokens to maintain secure connections</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              What We Do NOT Access
            </h2>
            <p className=" mb-4">We do not access or store:</p>
            <ul className="list-disc pl-6  space-y-2">
              <li>Your social media passwords</li>
              <li>Private messages or direct messages</li>
              <li>Personal data of your followers or audience</li>
              <li>Financial information from your social accounts</li>
              <li>
                Any data beyond what&apos;s necessary for content publishing
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              How We Use This Data
            </h2>
            <p className=" mb-4">The data we access is used exclusively to:</p>
            <ul className="list-disc pl-6  space-y-2">
              <li>Publish posts to your connected social media accounts</li>
              <li>Schedule content according to your preferences</li>
              <li>Display your account information in the Talexia dashboard</li>
              <li>Maintain secure connections to your social platforms</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              Data Storage and Security
            </h2>
            <p className="">
              Authentication tokens are encrypted and stored securely. We
              implement industry-standard security measures to protect your
              connected accounts. Tokens are automatically refreshed and never
              shared with third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">Revoking Access</h2>
            <p className=" mb-4">
              You can revoke Talexia&apos;s access to your social media accounts
              at any time through:
            </p>
            <ul className="list-disc pl-6  space-y-2">
              <li>Your Talexia dashboard settings page</li>
              <li>Your Instagram/Facebook/LinkedIn account settings</li>
            </ul>
            <p className=" mt-4">
              Revoking access will immediately stop all scheduled posts and
              disconnect the account from Talexia.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              Platform-Specific Permissions
            </h2>

            <h3 className="text-xl font-semibold  mb-3 mt-6">
              Instagram Business
            </h3>
            <ul className="list-disc pl-6  space-y-2">
              <li>instagram_basic - View profile information</li>
              <li>instagram_content_publish - Publish posts and stories</li>
              <li>pages_read_engagement - Read page data</li>
            </ul>

            <h3 className="text-xl font-semibold  mb-3 mt-6">Facebook Pages</h3>
            <ul className="list-disc pl-6  space-y-2">
              <li>pages_manage_posts - Create and manage posts</li>
              <li>pages_read_engagement - Read page insights</li>
            </ul>

            <h3 className="text-xl font-semibold  mb-3 mt-6">LinkedIn</h3>
            <ul className="list-disc pl-6  space-y-2">
              <li>w_member_social - Share content on your behalf</li>
              <li>r_basicprofile - Read basic profile information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">Contact Us</h2>
            <p className="">
              If you have questions about our API data usage, contact us at:
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
