// Client-side wrapper that runs PDF/image text extraction in a Web Worker so
// the main thread is never blocked by pdf.js or OCR work. Falls back to the
// caller if workers are unavailable or fail.

const PROCESS_TIMEOUT_MS = 90_000;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

export async function extractTextFromFileInWorker(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const kind = ext === "pdf" ? "pdf" : "image";

  return new Promise<string>((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./pdfProcessor.worker.ts", import.meta.url), {
        type: "module",
      });
    } catch (err) {
      reject(err instanceof Error ? err : new Error("Worker unavailable."));
      return;
    }

    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error("Processing timed out."));
    }, PROCESS_TIMEOUT_MS);

    worker.onerror = (event) => {
      clearTimeout(timer);
      worker.terminate();
      reject(event.error ?? new Error("Worker failed."));
    };

    worker.onmessage = (event: MessageEvent) => {
      clearTimeout(timer);
      worker.terminate();
      const { ok, text, error } = event.data as {
        ok: boolean;
        text?: string;
        error?: string;
      };
      if (ok) resolve(text ?? "");
      else reject(new Error(error ?? "Could not process the file."));
    };

    void (async () => {
      const buffer = kind === "pdf" ? await file.arrayBuffer() : undefined;
      const dataUrl = kind === "image" ? await fileToDataUrl(file) : undefined;
      worker.postMessage({ id: 1, kind, buffer, dataUrl });
    })().catch((err) => {
      clearTimeout(timer);
      worker.terminate();
      reject(err instanceof Error ? err : new Error("Could not read the file."));
    });
  });
}
