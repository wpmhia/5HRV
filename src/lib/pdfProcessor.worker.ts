/// <reference lib="webworker" />

// Web Worker that performs heavy PDF text extraction and OCR off the main
// thread. All data stays in the browser. Tesseract worker/core/language assets
// are served from /tesseract so no third-party runtime dependency is used.

import { hasHrvContent } from "@/lib/parseHrvReport";

type WorkerRequest = {
  id: number;
  kind: "pdf" | "image";
  buffer?: ArrayBuffer;
  dataUrl?: string;
};

async function loadPdfJs() {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return pdfjsLib;
}

async function ocr(image: string | HTMLCanvasElement): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract/tesseract-core.wasm.js",
    langPath: "/tesseract/",
  });
  try {
    const { data } = await worker.recognize(image);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const pdfjsLib = await loadPdfJs();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    pages.push(text);
  }
  return pages.join("\n");
}

async function renderFirstPageToCanvas(
  buffer: ArrayBuffer,
): Promise<HTMLCanvasElement> {
  const pdfjsLib = await loadPdfJs();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = new OffscreenCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable in worker.");
  // pdfjs accepts a canvas-like target in its render params; OffscreenCanvas is
  // the worker-appropriate equivalent.
  await (page.render as (params: unknown) => { promise: Promise<void> })({
    canvas,
    viewport,
  }).promise;
  return canvas as unknown as HTMLCanvasElement;
}

async function processPdf(buffer: ArrayBuffer): Promise<string> {
  const text = await extractPdfText(buffer);
  if (text.trim() && hasHrvContent(text)) return text;
  const canvas = await renderFirstPageToCanvas(buffer);
  return await ocr(canvas);
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, kind, buffer, dataUrl } = event.data;
  try {
    const text =
      kind === "pdf" && buffer
        ? await processPdf(buffer)
        : await ocr(dataUrl ?? "");
    self.postMessage({ id, ok: true, text });
  } catch (err) {
    self.postMessage({
      id,
      ok: false,
      error: err instanceof Error ? err.message : "Could not process the file.",
    });
  }
};
