"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

/** Ends this browser's session (only this one) and goes home. */
export function LogoutButton({ className }: { className: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    if (pending) return;
    setPending(true);
    await signOut();
    // the server cleared this browser's cookies even if Supabase didn't answer
    router.replace("/");
    router.refresh();
  };

  return (
    <button type="button" onClick={onClick} disabled={pending} aria-busy={pending} className={className}>
      {pending ? "Çıkış yapılıyor…" : "Çıkış Yap"}
    </button>
  );
}
