'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase/client";
import QRCode from 'qrcode';
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
      // 2.2s Splash for brand manifestation
      setTimeout(() => setScreen(prev => prev === 'splash' ? 'identity' : prev), 2200);

      const { data: profile, error } = await supabase
        .from('guest_profiles')
        .select('*, registration:registrations!inner(*, event:events!inner(*))')
        .eq('token', params.token)
        .single();

      if (profile && !error) {
        setGuest(profile);
        setEvent(profile.registration.event);
        
        // Generate high-fidelity QR data URLs locally
        const entryData = await QRCode.toDataURL(profile.registration.id, { margin: 2, scale: 10 });
        const networkData = await QRCode.toDataURL('unlock:' + profile.id, { margin: 2, scale: 10 });
        
        setEntryQr(entryData);
        setNetworkQr(networkData);

        if (profile.name) setScreen('scene');
      }
      setLoading(false);
    }
    init();
  }, [params.token]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>;
  if (screen === 'splash') return <div className="min-h-screen bg-black flex items-center justify-center"><h1 className="text-white text-xl tracking-[0.4em] font-light italic">PRESENCE MANIFESTED</h1></div>;

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
    <div className="min-h-screen bg-black text-white pb-24 font-sans select-none">
      {/* HOME / SCENE */}
      {activeTab === 'home' && (
        <div className="p-6 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          <header>
            <p className="text-zinc-500 uppercase tracking-widest text-[10px] mb-1">Live Event</p>
            <h1 className="text-3xl font-light">{event?.title || 'Event'}</h1>
          </header>
          <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl backdrop-blur-sm">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-4xl font-light mb-2">Live</p>
                <p className="text-zinc-500 text-xs tracking-wide">Aura system is active</p>
              </div>
              <button 
                onClick={() => { setNetworkingActive(true); setActiveTab('network'); }} 
                className="bg-white text-black px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-95 transition-transform"
              >
                Ignite Aura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TICKET / QR */}
      {activeTab === 'ticket' && (
        <div className="p-6 flex flex-col items-center justify-center min-h-[75vh] space-y-12 animate-in fade-in duration-500">
          <div className="text-center space-y-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Entry Access</p>
            {entryQr && <img src={entryQr} className="w-44 h-44 rounded-2xl bg-white p-3 shadow-2xl shadow-white/5" alt="Entry" />}
          </div>
          <div className="w-8 h-[1px] bg-white/10" />
          <div className="text-center space-y-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Networking Identity</p>
            {!networkingActive ? (
              <div className="w-44 h-44 bg-zinc-900/50 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-zinc-600">
                <Lock size={18} className="mb-3 opacity-20" />
                <p className="text-[9px] tracking-widest uppercase opacity-40">Ignite Aura to reveal</p>
              </div>
            ) : (
              networkQr && <img src={networkQr} className="w-44 h-44 rounded-2xl bg-white p-3 border-2 border-zinc-800 shadow-2xl shadow-white/5" alt="Networking" />
            )}
          </div>
        </div>
      )}

      {/* BOTTOM NAV - 40% THUMB ZONE OPTIMIZED */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xl border-t border-white/5 px-10 py-8 flex justify-between items-center z-50">
        <button onClick={() => setActiveTab('home')} className={activeTab === 'home' ? 'text-white scale-110 transition-all' : 'text-zinc-600'}><MapPin size={24} strokeWidth={1.5} /></button>
        <button onClick={() => setActiveTab('network')} className={activeTab === 'network' ? 'text-white scale-110 transition-all' : 'text-zinc-600'}><Users size={24} strokeWidth={1.5} /></button>
        <button onClick={() => setActiveTab('ticket')} className={activeTab === 'ticket' ? 'text-white scale-110 transition-all' : 'text-zinc-600'}><QrCode size={24} strokeWidth={1.5} /></button>
        <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'text-white scale-110 transition-all' : 'text-zinc-600'}><User size={24} strokeWidth={1.5} /></button>
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
    <div className="min-h-screen bg-black text-white p-10 flex flex-col justify-center animate-in fade-in duration-1000">
      <h1 className="text-3xl font-light mb-12 italic tracking-tight">Establish Presence</h1>
      <div className="space-y-8">
        <div className="group border-b border-white/10 focus-within:border-white/40 transition-colors">
          <input placeholder="Name" className="w-full bg-transparent py-3 outline-none text-lg font-light" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        </div>
        <div className="group border-b border-white/10 focus-within:border-white/40 transition-colors">
          <input placeholder="Professional Title" className="w-full bg-transparent py-3 outline-none text-lg font-light" value={form.role} onChange={e => setForm({...form, role: e.target.value})} />
        </div>
        <div className="group border-b border-white/10 focus-within:border-white/40 transition-colors">
          <input placeholder="Organization" className="w-full bg-transparent py-3 outline-none text-lg font-light" value={form.org} onChange={e => setForm({...form, org: e.target.value})} />
        </div>
        <button 
          onClick={() => onSave(form)} 
          className="w-full bg-white text-black py-5 mt-10 font-bold tracking-[0.3em] uppercase text-[10px] hover:bg-zinc-200 transition-colors"
        >
          Manifest
        </button>
      </div>
    </div>
  );
}
