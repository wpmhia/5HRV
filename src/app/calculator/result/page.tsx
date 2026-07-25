import type { Metadata } from "next";
import { pages } from "@/lib/seo";
import CalculatorResultPageContent from "./page-content";

export const metadata: Metadata = {
  title: pages.calculatorResult.title,
  description: pages.calculatorResult.description,
};

export default function CalculatorResultPage() {
  return <CalculatorResultPageContent />;
}
