import { redirect } from "next/navigation";

export default async function ClaimRedirectPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/watch?claim=${encodeURIComponent(token || "")}`);
}
