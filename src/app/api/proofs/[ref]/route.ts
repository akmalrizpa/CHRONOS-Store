import { getSession, isStaffUser } from "@/lib/auth";
import { getOrder, readProof } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Payment proofs are private: only the buyer and staff can open them. */
export async function GET(_request: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const [user, order] = await Promise.all([getSession(), getOrder(ref)]);

  if (!order || !order.proofPath) return new Response("Not found", { status: 404 });

  const staff = user ? await isStaffUser(user.id) : false;
  const allowed = Boolean(user && (order.buyerDiscordId === user.id || staff));
  if (!allowed) return new Response("Forbidden", { status: 403 });

  const file = await readProof(order.proofPath);
  if (!file) return new Response("Not found", { status: 404 });

  return new Response(file.bytes, {
    headers: {
      "content-type": file.contentType,
      "content-disposition": "inline",
      "cache-control": "private, max-age=60",
    },
  });
}
