import type { Metadata } from "next";
import { pages } from "@/lib/seo";
import CalculatorPageContent from "./page-content";

export const metadata: Metadata = {
  title: pages.calculator.title,
  description: pages.calculator.description,
};

export default function CalculatorPage() {
  return <CalculatorPageContent />;
}
