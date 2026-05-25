"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function GuestExperienceEngine() {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"scene" | "networking" | "ticket" | "profile">("scene");
  const [loading, setLoading] = useState(true);
  const [auraActive, setAuraActive] = useState(false);
  const [networkingLoading, setNetworkingLoading] = useState(false);
  const [auraActiveCount, setAuraActiveCount] = useState(0);

  const params = useParams();
  const { token } = params;

  async function syncSceneMetrics(eventId: string) {
    const { count } = await supabase.from("guest_profiles").select("id", { count: "exact", head: true }).eq("event_id", eventId).eq("aura_active", true);
    setAuraActiveCount(count ?? 0);
  }

  const toggleAura = async () => {
    if (!data) return;
    setNetworkingLoading(true);
    const nextStatus = !auraActive;
    await supabase.from("guest_profiles").update({ aura_active: nextStatus }).eq("id", data.id);
    setAuraActive(nextStatus);
    syncSceneMetrics(data.event_id);
    setNetworkingLoading(false);
  };

  useEffect(() => {
    async function initExperience() {
      const { data: entry } = await supabase.from("registrations").select("*, events(*)").ilike("guest_access_link", `%${token}`).single();
      if (entry?.events) {
        setData(entry);
        await syncSceneMetrics(entry.event_id);
      }
      setLoading(false);
    }
    initExperience();
  }, [token]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0B0A0E] text-white">
      {activeTab === "networking" && (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          {!auraActive ? (
            <button onClick={toggleAura} className="px-8 py-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
              Start Networking
            </button>
          ) : (
            <div className="w-full text-center">
              <button onClick={toggleAura} className="mb-4 text-white/50 underline text-xs">Stop Networking</button>
              <div className="text-white/20">Radar Active...</div>
            </div>
          )}
        </div>
      )}
      
      {/* NAVIGATION BAR */}
      <div className="fixed bottom-8 left-4 right-4 bg-[#0B0A0E]/90 border border-white/10 backdrop-blur-xl p-4 rounded-2xl flex justify-around">
        <button onClick={() => setActiveTab("scene")}>Scene</button>
        <button onClick={() => setActiveTab("networking")}>Networking</button>
      </div>
    </div>
  );
}
