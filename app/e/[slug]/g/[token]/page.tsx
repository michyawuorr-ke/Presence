'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase/client";
import { 
  User, 
  QrCode, 
  Users, 
  MapPin, 
  Lock, 
  Loader2
} from 'lucide-react';

export default function GuestExperience({ params }) {
  const [screen, setScreen] = useState('splash');
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [networkingActive, setNetworkingActive] = useState(false);
  const [guest, setGuest] = useState(null);
  const [event, setEvent] = useState(null);
  const [entryQr, setEntryQr] = useState('');
  const [networkQr, setNetworkQr] = useState('');

  useEffect(() => {
    async function init() {
      // Presence Manifested Splash (2.2s)
      setTimeout(() => setScreen(prev => prev === 'splash' ? 'identity' : prev), 2200);

      const { data: profile, error } = await supabase
        .from('guest_profiles')
        .select('*, registration:registrations!inner(*, event:events!inner(*))')
        .eq('token', params.token)
        .single();

      if (profile && !error) {
        setGuest(profile);
        setEvent(profile.registration.event);

        // Professional QR Generation using the installed library
        const QRCode = (await import('qrcode')).default;
        const entryData = await QRCode.toDataURL(profile.registration.id);
        const networkData = await QRCode.toDataURL('unlock:' + profile.id);
        
        setEntryQr(entryData);
        setNetworkQr(networkData);

        if (profile.name) setScreen('scene');
      }
      setLoading(false);
    }
    init();
  }, [params.token]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>;
  
  if (screen === 'splash') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <h1 className="text-white text-xl tracking-[0.4em] font-light animate-pulse">
          PRESENCE MANIFESTED
        </h1>
      </div>
    );
  }

  const handleSaveIdentity = async (formData) => {
    const { error } = await supabase.from('guest_profiles').update({
      name: formData.name,
      role_title: formData.role,
      organisation: formData.org,
      bio: formData.bio,
      platform_link: formData.link
    }).eq('id', guest.id);
    
    if (!error) {
      setGuest({ ...guest, ...formData });
      setScreen('scene');
    }
  };

  if (screen === 'identity') return <IdentityForm onSave={handleSaveIdentity} initialData={guest} />;

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-sans">
      {/* SCENE TAB */}
      {activeTab === 'home' && (
        <div className="p-6 space-y-8 animate-in slide-in-from-bottom-4">
          <header>
            <p className="text-zinc-500 uppercase tracking-widest text-[10px] mb-1">Live Event</p>
            <h1 className="text-3xl font-light">{event?.title || 'Event'}</h1>
          </header>
          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-light mb-1">Live</p>
                <p className="text-zinc-500 text-xs">Aura is open</p>
              </div>
              <button 
                onClick={() => { setNetworkingActive(true); setActiveTab('network'); }} 
                className="bg-white text-black px-6 py-2 rounded-full text-xs font-bold"
              >
                Ignite Aura
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <MapPin size={14} /> {event?.venue}
          </div>
        </div>
      )}

      {/* TICKET TAB */}
      {activeTab === 'ticket' && (
        <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] space-y-10">
          <div className="text-center space-y-4">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Entry Ticket</p>
            {entryQr && <img src={entryQr} className="w-40 h-40 rounded-lg bg-white p-2" alt="Entry" />}
          </div>
          <div className="w-12 h-[1px] bg-white/20" />
          <div className="text-center space-y-4">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Networking QR</p>
            {!networkingActive ? (
              <div className="w-40 h-40 bg-zinc-900 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-zinc-600">
                <Lock size={20} className="mb-2" />
                <p className="text-[10px]">Ignite Aura to reveal</p>
              </div>
            ) : (
              networkQr && <img src={networkQr} className="w-40 h-40 rounded-lg bg-white p-2 border-4 border-blue-500/20" alt="Networking" />
            )}
          </div>
        </div>
      )}

      {/* NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/10 px-8 py-6 flex justify-between items-center">
        <button onClick={() => setActiveTab('home')} className={activeTab === 'home' ? 'text-white' : 'text-zinc-600'}><MapPin size={22} /></button>
        <button onClick={() => setActiveTab('network')} className={activeTab === 'network' ? 'text-white' : 'text-zinc-600'}><Users size={22} /></button>
        <button onClick={() => setActiveTab('ticket')} className={activeTab === 'ticket' ? 'text-white' : 'text-zinc-600'}><QrCode size={22} /></button>
        <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'text-white' : 'text-zinc-600'}><User size={22} /></button>
      </nav>
    </div>
  );
}

function IdentityForm({ onSave, initialData }) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    role: initialData?.role_title || '',
    org: initialData?.organisation || '',
    bio: initialData?.bio || '',
    link: initialData?.platform_link || ''
  });

  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col justify-center">
      <h1 className="text-2xl font-light mb-8 italic">Presence Manifested</h1>
      <div className="space-y-6">
        <input placeholder="Name" className="w-full bg-transparent border-b border-white/20 py-2 outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        <input placeholder="Role" className="w-full bg-transparent border-b border-white/20 py-2 outline-none" value={form.role} onChange={e => setForm({...form, role: e.target.value})} />
        <input placeholder="Organisation" className="w-full bg-transparent border-b border-white/20 py-2 outline-none" value={form.org} onChange={e => setForm({...form, org: e.target.value})} />
        <button onClick={() => onSave(form)} className="w-full bg-white text-black py-4 mt-8 font-bold tracking-widest uppercase text-xs">Enter</button>
      </div>
    </div>
  );
}
