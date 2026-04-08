import Navbar from "@/components/navbar";
import Footer from "@/components/footer-secondary";

export const metadata = {
  title: "AI Content Disclaimer - Talexia.ai",
  description: "Review Talexia.ai's AI Content Disclaimer.",
};

// Force dynamic rendering since Navbar uses client-side hooks
export const dynamic = "force-dynamic";

export default function AiContentDisclaimerPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 mt-10 lg:mt-14 text-secondary">
        <h1 className="text-4xl font-bold  mb-8 font-sora text-primary">
          AI Content Disclaimer
        </h1>
        <div className="prose prose-invert prose-slate max-w-none">
          <p className="text-slate-300 mb-6">
            <strong>Effective Date:</strong> December 7, 2025
          </p>

          <section className="mb-8">
            <p className="text-slate-300 mb-6">
              Talexia.ai uses artificial intelligence to generate captions,
              hashtags, and content recommendations. This disclaimer outlines
              important information about AI-generated content and your
              responsibilities as a user.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              AI Output Variability
            </h2>
            <p className="text-slate-300 mb-4">
              AI-generated content may vary in quality and accuracy based on:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
              <li>Input quality and clarity of uploaded images</li>
              <li>AI model behavior and training data</li>
              <li>Brand profile completeness and accuracy</li>
              <li>Style instructions and preferences provided</li>
              <li>Context and industry-specific terminology</li>
            </ul>
            <p className="text-slate-300 mt-4">
              Results may not always perfectly match your expectations or brand
              voice. We continuously improve our AI models, but variations are
              inherent to AI technology.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              User Verification Responsibility
            </h2>
            <p className="text-slate-300 mb-4">
              You are solely responsible for reviewing and verifying all
              AI-generated content before publishing. You must confirm:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
              <li>Accuracy of product descriptions and specifications</li>
              <li>Correctness of brand names, terminology, and messaging</li>
              <li>Appropriateness of tone and language for your audience</li>
              <li>
                Compliance with platform guidelines and advertising standards
              </li>
              <li>
                Absence of offensive, misleading, or inappropriate content
              </li>
              <li>Factual accuracy of any claims or statements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              Industry-Specific Considerations
            </h2>

            <h3 className="text-xl font-semibold  mb-3 mt-6">
              Jewelry & Luxury Goods
            </h3>
            <p className="text-slate-300 mb-4">Verify accuracy of:</p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
              <li>Metal types, gemstones, and materials</li>
              <li>Pricing and product specifications</li>
              <li>Craftsmanship details and certifications</li>
            </ul>

            <h3 className="text-xl font-semibold  mb-3 mt-6">
              Food & Beverage
            </h3>
            <p className="text-slate-300 mb-4">Verify accuracy of:</p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
              <li>Ingredients and allergen information</li>
              <li>Nutritional claims and health statements</li>
              <li>Menu items and pricing</li>
            </ul>

            <h3 className="text-xl font-semibold  mb-3 mt-6">
              E-commerce & Retail
            </h3>
            <p className="text-slate-300 mb-4">Verify accuracy of:</p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
              <li>Product features and specifications</li>
              <li>Availability and shipping information</li>
              <li>Promotional terms and conditions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              No Performance Guarantees
            </h2>
            <p className="text-slate-300 mb-4">
              Talexia.ai does not guarantee any specific results or improvements
              in:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
              <li>Social media reach or impressions</li>
              <li>Engagement rates (likes, comments, shares)</li>
              <li>Follower growth or audience expansion</li>
              <li>Sales, conversions, or revenue</li>
              <li>Brand awareness or recognition</li>
              <li>Website traffic or click-through rates</li>
            </ul>
            <p className="text-slate-300 mt-4">
              Social media performance depends on many factors beyond content
              quality, including platform algorithms, audience behavior, posting
              timing, and market conditions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              Content Ownership and Rights
            </h2>
            <p className="text-slate-300 mb-4">You retain ownership of:</p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
              <li>All original images and media you upload</li>
              <li>Your brand profile and business information</li>
              <li>Final published content after your review and approval</li>
            </ul>
            <p className="text-slate-300 mt-4">
              You are responsible for ensuring you have the rights to use all
              uploaded content and that published content does not infringe on
              third-party intellectual property.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">
              Limitation of Liability
            </h2>
            <p className="text-slate-300">
              Talexia.ai is not liable for any damages, losses, or consequences
              resulting from:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2 mt-4">
              <li>Inaccurate or inappropriate AI-generated content</li>
              <li>Publishing errors or scheduling mistakes</li>
              <li>Platform policy violations or account suspensions</li>
              <li>Lost business opportunities or revenue</li>
              <li>Reputational harm or brand damage</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">Best Practices</h2>
            <p className="text-slate-300 mb-4">
              To get the best results from Talexia.ai:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
              <li>
                Complete your brand profile with detailed, accurate information
              </li>
              <li>Upload high-quality images with clear subjects</li>
              <li>
                Review and edit all AI-generated captions before publishing
              </li>
              <li>
                Test different caption styles to find what works for your
                audience
              </li>
              <li>Monitor performance and adjust your strategy accordingly</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold  mb-4">Contact Us</h2>
            <p className="text-slate-300">
              If you have questions about AI-generated content or this
              disclaimer, contact us at:
            </p>
            <p className="text-slate-300 mt-4">
              <strong>Email:</strong> support@talexia.ai
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
