export const dynamic = 'force-dynamic';
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.push("/dashboard/events");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/dashboard/events");
      else router.push("/login");
    });
  }, [router]);

  return (
    <div style={{minHeight:"100vh",background:"#000",display:"flex",
      alignItems:"center",justifyContent:"center"}}>
      <p style={{color:"#666",fontSize:"13px",letterSpacing:"0.2em"}}>
        Signing in...
      </p>
    </div>
  );
}