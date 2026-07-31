import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

const routes = [
  "",
  "/about",
  "/applications",
  "/calculator",
  "/evidence",
  "/interpretation",
  "/method",
  "/methodology",
  "/parameters",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1.0 : 0.7,
  }));
}
