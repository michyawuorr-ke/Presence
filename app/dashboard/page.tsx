"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  useEffect(() => {
    router.push("/dashboard/events");
  }, [router]);
  return <div style={{minHeight:"100vh",background:"#fafafa"}}></div>;
}