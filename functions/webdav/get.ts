import { notFound } from "./utils";
import { RequestHandlerParams } from "./utils";

export async function handleRequestGet({
  bucket,
  path,
  request,
}: RequestHandlerParams) {
  const obj = await bucket.get(path, {
    onlyIf: request.headers,
    range: request.headers,
  });
  if (obj === null) return notFound();

  if (!path.startsWith("_$flaredrive$/thumbnails/")) {
    const url = new URL(request.url);
    const t = url.searchParams.get("t");
    if (t) {
      // 生成校验 Token
      const expectedToken = `${obj.size.toString(36)}-${Math.floor(obj.uploaded.getTime() / 1000).toString(36)}`;
      
      if (t !== expectedToken) {
        return new Response("Not Found", { status: 404 });
      }
    }
  }

  if (!("body" in obj))
    return new Response("Preconditions failed", { status: 412 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  if (path.startsWith("_$flaredrive$/thumbnails/"))
    headers.set("Cache-Control", "max-age=31536000");
  return new Response(obj.body, { headers });
}
