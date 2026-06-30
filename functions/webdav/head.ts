import { notFound } from "./utils";
import { RequestHandlerParams } from "./utils";

export async function handleRequestHead({
  bucket,
  path,
  request,
}: RequestHandlerParams) {
  const obj = await bucket.head(path);
  if (obj === null) return notFound();

  if (!path.startsWith("_$flaredrive$/thumbnails/")) {
    const url = new URL(request.url);
    const t = url.searchParams.get("t");
    if (t) {
      const expectedToken = `${obj.size.toString(36)}-${Math.floor(obj.uploaded.getTime() / 1000).toString(36)}`;
      if (t !== expectedToken) {
        return new Response("Not Found", { status: 404 });
      }
    }
  }

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  return new Response(null, { headers });
}
