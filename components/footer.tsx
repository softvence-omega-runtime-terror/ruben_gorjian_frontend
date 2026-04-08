import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-slate-950 text-lime-500 font-poppins">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lime-300">
          © {year} Talexia.ai. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/privacy-policy" className="hover:text-lime-300">
            Privacy Policy
          </Link>
          <a href="#" className="hover:text-lime-300">
            Terms of Service
          </a>
          <a href="mailto:support@talexia.ai" className="hover:text-lime-300">
            support@talexia.ai
          </a>
        </div>
      </div>
    </footer>
  );
}
