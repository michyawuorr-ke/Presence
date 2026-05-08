"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/dashboard/events");
      } else {
        router.replace("/login");
      }
      setChecking(false);
    });
  }, [router]);

  return (
    <div style={{minHeight:"100vh",background:"#000",display:"flex",
      alignItems:"center",justifyContent:"center"}}>
      <p style={{color:"#666",fontSize:"13px",letterSpacing:"0.2em"}}>
        PRESENCE
      </p>
    </div>
  );
}