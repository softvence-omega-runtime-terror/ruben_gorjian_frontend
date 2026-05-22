"use client";

import { Suspense } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Navbar from "@/components/navbar";
import FooterSecondary from "@/components/footer-secondary";

const faqRows = [
  {
    q: "Can Talexia support multiple client brands?",
    a: "Yes. The product is built for agencies and operators managing several accounts with separate brand profiles.",
  },
  {
    q: "What does founder pricing include?",
    a: "Founder pricing applies the discounted plan rate for eligible early adopters and remains until cancellation.",
  },
  {
    q: "Which platforms do you support in Phase 1?",
    a: "Instagram, Facebook, and LinkedIn are supported for social connection and scheduled publishing.",
  },
  {
    q: "Do you generate AI images?",
    a: "No. Phase 1 includes text generation only: captions, hashtags, CTAs, and short descriptions.",
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-white text-[#1f2230]">
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>

      <section
        id="faq"
        className="px-4 pb-16 pt-14 sm:pt-20"
        aria-labelledby="faq-heading"
      >
        <div className="mx-auto max-w-4xl space-y-10 rounded-3xl border border-[#dfe2ec] bg-white p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#777b86]">
            FAQs
          </p>
          <h2
            id="faq-heading"
            className="mt-2 text-3xl font-bold font-sora text-primary sm:text-4xl"
          >
            Questions teams ask before switching
          </h2>
          <Accordion type="single" collapsible className="mt-6">
            {faqRows.map((item, index) => (
              <AccordionItem
                key={item.q}
                value={`faq-${index}`}
                className="mb-6 rounded-full border border-[#ebedf4] px-6 py-4"
              >
                <AccordionTrigger className="text-left text-sm font-medium">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-left text-sm text-[#55596a]">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <FooterSecondary />
    </main>
  );
}
