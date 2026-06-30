import { RequestHandlerParams } from "./utils";

export async function handleRequestProppatch({ path, request }: RequestHandlerParams) {
  // 伪造 PROPPATCH 绕过 Windows Webdav 核查机制
  
  const xml = `<?xml version="1.0" encoding="utf-8" ?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>${new URL(request.url).pathname}</D:href>
    <D:propstat>
      <D:prop>
        <D:creationdate/>
        <D:getlastmodified/>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>`;

  return new Response(xml, {
    status: 207,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}