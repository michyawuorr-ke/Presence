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

  const params = useParams();
  const { token } = params;

  const toggleAura = async () => {
    if (!data) return;
    setNetworkingLoading(true);
    const nextStatus = !auraActive;
    await supabase.from("guest_profiles").update({ aura_active: nextStatus }).eq("id", data.id);
    setAuraActive(nextStatus);
    setNetworkingLoading(false);
  };

  useEffect(() => {
    async function initExperience() {
      const { data: entry } = await supabase.from("registrations").select("*, events(*)").ilike("guest_access_link", `%${token}`).single();
      if (entry) {
        setData(entry);
        const { data: profile } = await supabase.from("guest_profiles").select("aura_active").eq("id", entry.id).single();
        if (profile) setAuraActive(profile.aura_active);
      }
      setLoading(false);
    }
    initExperience();
  }, [token]);

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0B0A0E] text-white pb-24">
      {/* Dynamic Content */}
      <div className="p-6">
        {activeTab === "scene" && <div><h3>Live Scene</h3></div>}
        {activeTab === "networking" && (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            {!auraActive ? (
              <div className="text-center">
                <p className="text-white/30 mb-6">Status: Dissolved</p>
                <button onClick={toggleAura} className="px-8 py-3 rounded-full border border-white/10 bg-white/5">Start Networking</button>
              </div>
            ) : (
              <div className="text-center">
                <button onClick={toggleAura} className="mb-8 text-white/50 text-xs">Stop Networking</button>
                <div className="text-white/20">Radar Active (Scanning...)</div>
              </div>
            )}
          </div>
        )}
        {activeTab === "ticket" && <div><h3>Ticket View</h3></div>}
        {activeTab === "profile" && <div><h3>Profile View</h3></div>}
      </div>

      {/* Navigation Bar */}
      <div className="fixed bottom-0 w-full bg-[#0B0A0E] border-t border-white/10 p-4 flex justify-around">
        <button onClick={() => setActiveTab("scene")}>Scene</button>
        <button onClick={() => setActiveTab("networking")}>Networking</button>
        <button onClick={() => setActiveTab("ticket")}>Ticket</button>
        <button onClick={() => setActiveTab("profile")}>Profile</button>
      </div>
    </div>
  );
}
