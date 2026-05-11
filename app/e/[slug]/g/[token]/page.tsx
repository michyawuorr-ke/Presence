'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase/client";
import { 
  User, 
  QrCode, 
  Users, 
  MapPin, 
  Loader2
} from 'lucide-react';

export default function GuestExperience({ params }) {
  const [screen, setScreen] = useState('splash');
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(null);
  const [event, setEvent] = useState(null);

  useEffect(() => {
    async function init() {
      setTimeout(() => setScreen(prev => prev === 'splash' ? 'identity' : prev), 2200);
      const { data: profile } = await supabase
        .from('guest_profiles')
        .select('*, registration:registrations!inner(*, event:events!inner(*))')
        .eq('token', params.token)
        .single();

      if (profile) {
        setGuest(profile);
        setEvent(profile.registration.event);
        if (profile.name) setScreen('scene');
      }
      setLoading(false);
    }
    init();
  }, [params.token]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>;
  if (screen === 'splash') return <div className="min-h-screen bg-black flex items-center justify-center font-light tracking-[0.4em] text-white">PRESENCE MANIFESTED</div>;

  if (screen === 'identity') return (
    <div className="min-h-screen bg-black text-white p-10 flex flex-col justify-center">
      <h1 className="text-2xl font-light mb-10 italic">Establish Presence</h1>
      <div className="space-y-6">
        <input placeholder="Name" className="w-full bg-transparent border-b border-white/10 py-3 outline-none" />
        <button onClick={() => setScreen('scene')} className="w-full bg-white text-black py-4 mt-10 font-bold uppercase text-[10px] tracking-widest">Enter</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="p-8">
        <h1 className="text-3xl font-light">{event?.title || 'Presence'}</h1>
        <p className="text-zinc-500 text-xs mt-2 uppercase tracking-widest">{activeTab} Mode</p>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/5 px-10 py-8 flex justify-between items-center">
        <button onClick={() => setActiveTab('home')} className={activeTab === 'home' ? 'text-white' : 'text-zinc-600'}><MapPin size={24} /></button>
        <button onClick={() => setActiveTab('network')} className={activeTab === 'network' ? 'text-white' : 'text-zinc-600'}><Users size={24} /></button>
        <button onClick={() => setActiveTab('ticket')} className={activeTab === 'ticket' ? 'text-white' : 'text-zinc-600'}><QrCode size={24} /></button>
        <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'text-white' : 'text-zinc-600'}><User size={24} /></button>
      </nav>
    </div>
  );
}
