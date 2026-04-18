"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Navbar from "@/components/navbar";
import FooterSecondary from "@/components/footer-secondary";
import { apiGet } from "@/lib/api";

type Faq = {
  id: string;
  question: string;
  answer: string;
  displayOrder: number;
  isActive: boolean;
};

type FaqListResponse = {
  success: boolean;
  data: Faq[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const fallbackFaqRows = [
  {
    id: "fallback-1",
    question: "Can Talexia support multiple client brands?",
    answer:
      "Yes. The product is built for agencies and operators managing several accounts with separate brand profiles.",
  },
  {
    id: "fallback-2",
    question: "What does founder pricing include?",
    answer:
      "Founder pricing applies the discounted plan rate for eligible early adopters and remains until cancellation.",
  },
  {
    id: "fallback-3",
    question: "Which platforms do you support in Phase 1?",
    answer:
      "Instagram, Facebook, and LinkedIn are supported for social connection and scheduled publishing.",
  },
  {
    id: "fallback-4",
    question: "Do you generate AI images?",
    answer:
      "No. Phase 1 includes text generation only: captions, hashtags, CTAs, and short descriptions.",
  },
];

export default function FAQPage() {
  const [faqRows, setFaqRows] = useState(fallbackFaqRows);

  useEffect(() => {
    let isActive = true;
    apiGet<FaqListResponse>("/api/faq?page=1&limit=10")
      .then((res) => {
        if (!isActive) return;
        const rows = Array.isArray(res?.data) ? res.data : [];
        const mapped = rows
          .filter((r) => r.isActive)
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
          .map((r) => ({
            id: r.id,
            question: r.question,
            answer: r.answer,
          }));
        if (mapped.length) {
          setFaqRows(mapped);
        }
      })
      .catch(() => {});
    return () => {
      isActive = false;
    };
  }, []);

  const accordionItems = useMemo(() => faqRows, [faqRows]);

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
            {accordionItems.map((item) => (
              <AccordionItem
                key={item.id}
                value={`faq-${item.id}`}
                className="mb-6 rounded-full border border-[#ebedf4] px-6 py-4"
              >
                <AccordionTrigger className="text-left text-sm font-medium">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-left text-sm text-[#55596a]">
                  {item.answer}
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
