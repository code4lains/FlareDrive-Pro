import { RequestHandlerParams, ROOT_OBJECT } from "./utils";

async function handleRequestPutMultipart({
  bucket,
  path,
  request,
}: RequestHandlerParams) {
  const url = new URL(request.url);

  const uploadId = new URLSearchParams(url.search).get("uploadId");
  const partNumberStr = new URLSearchParams(url.search).get("partNumber");
  if (!uploadId || !partNumberStr || !request.body)
    return new Response("Bad Request", { status: 400 });
  const multipartUpload = bucket.resumeMultipartUpload(path, uploadId);

  const partNumber = parseInt(partNumberStr);
  const uploadedPart = await multipartUpload.uploadPart(
    partNumber,
    request.body
  );

  return new Response(null, {
    headers: { "Content-Type": "application/json", etag: uploadedPart.etag },
  });
}

export async function handleRequestPut({
  bucket,
  path,
  request,
}: RequestHandlerParams) {
  const searchParams = new URLSearchParams(new URL(request.url).search);
  if (searchParams.has("uploadId")) {
    return handleRequestPutMultipart({ bucket, path, request });
  }

  if (request.url.endsWith("/")) {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!path.startsWith("_$flaredrive$/")) {
    const parentPath = path.replace(/(\/|^)[^/]*$/, "");
    const parentDir =
      parentPath === "" ? ROOT_OBJECT : await bucket.head(parentPath);
    if (parentDir === null) return new Response("Conflict", { status: 409 });
  }

  const thumbnail = request.headers.get("fd-thumbnail");
  const customMetadata = thumbnail ? { thumbnail } : undefined;

  // 安全构造 httpMetadata
  const httpMetadata: any = {
    contentType: request.headers.get("Content-Type") || "application/octet-stream",
  };
  const disposition = request.headers.get("Content-Disposition");
  if (disposition) {
    httpMetadata.contentDisposition = disposition;
  }

  // 处理 Windows 0字节空请求的情况
  const contentLength = request.headers.get("Content-Length");
  const bodyData = contentLength === "0" ? null : request.body;

  try {
    const result = await bucket.put(path, bodyData, {
      httpMetadata,
      customMetadata,
    });

    if (!result) return new Response("Upload failed", { status: 500 });

    return new Response(null, { status: 201 });
  } catch (error) {
    console.error("PUT Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
