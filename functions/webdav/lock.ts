import { RequestHandlerParams } from "./utils";

export async function handleRequestLock({ request }: RequestHandlerParams) {
  // 伪造 Lock-Token 欺骗 Windows
  const token = "urn:uuid:" + crypto.randomUUID();
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<D:prop xmlns:D="DAV:"><D:lockdiscovery><D:activelock>
<D:locktype><D:write/></D:locktype><D:lockscope><D:exclusive/></D:lockscope>
<D:depth>Infinity</D:depth><D:locktoken><D:href>${token}</D:href></D:locktoken>
</D:activelock></D:lockdiscovery></D:prop>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Lock-Token": `<${token}>`,
    },
  });
}