"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">5HRV</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              A practical clinical and research framework for assessing
              autonomic function from a standardized five-minute HRV recording.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Pages</h3>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li><Link href="/method" className="hover:text-foreground">Method</Link></li>
              <li><Link href="/parameters" className="hover:text-foreground">HRV Parameters</Link></li>
              <li><Link href="/interpretation" className="hover:text-foreground">Interpretation</Link></li>
              <li><Link href="/applications" className="hover:text-foreground">Clinical Use</Link></li>
              <li><Link href="/evidence" className="hover:text-foreground">Evidence</Link></li>
              <li><Link href="/calculator" className="hover:text-foreground">Calculator</Link></li>
              <li><Link href="/about" className="hover:text-foreground">About</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Clinical framework</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Developed by Willem Gielen, Cardiologist and Internist, as a
              practical approach to standardized five-minute HRV assessment in
              clinical practice and research.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              5HRV provides contextual interpretation of HRV measurements for
              educational and professional reference. It does not diagnose
              disease, replace ECG review or substitute for clinical assessment.
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} 5HRV. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
