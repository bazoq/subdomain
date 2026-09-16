/** Browser-side upload helper: presign -> PUT to R2 -> confirm. */
export async function uploadFile(
  file: File,
  opts: { visibility?: "PUBLIC" | "PRIVATE"; folder?: string; alt?: string; tenantId?: string; onProgress?: (pct: number) => void } = {},
): Promise<{ id: string; url: string | null }> {
  const presign = await fetch("/api/media/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mime: file.type || "application/octet-stream",
      size: file.size,
      visibility: opts.visibility ?? "PUBLIC",
      folder: opts.folder ?? "general",
      alt: opts.alt,
      tenantId: opts.tenantId,
    }),
  });
  if (!presign.ok) {
    const j = await presign.json().catch(() => ({}));
    throw new Error(j.error ?? "Could not start upload");
  }
  const { mediaId, uploadUrl } = (await presign.json()) as { mediaId: string; uploadUrl: string };

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && opts.onProgress) opts.onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });

  const confirm = await fetch("/api/media/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mediaId }),
  });
  if (!confirm.ok) {
    const j = await confirm.json().catch(() => ({}));
    throw new Error(j.error ?? "Could not confirm upload");
  }
  const j = (await confirm.json()) as { id: string; url: string | null };
  return { id: j.id, url: j.url };
}
