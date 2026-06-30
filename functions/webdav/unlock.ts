import { RequestHandlerParams } from "./utils";

export async function handleRequestUnlock({ request }: RequestHandlerParams) {
  // 直接返回 204 No Content，表示成功解锁
  return new Response(null, { status: 204 });
}