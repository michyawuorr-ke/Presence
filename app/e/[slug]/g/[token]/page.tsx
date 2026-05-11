'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase/client";
import QRCode from 'qrcode';
import { 
  User, 
  QrCode, 
  Users, 
  MapPin, 
  CheckCircle2, 
  Lock, 
  Loader2,
  Copy,
  ExternalLink
} from 'lucide-react';

// --- HELPERS (OUTSIDE JSX) ---
function cleanUrl(url) {
  if (!url) return '';
  return url.replace('https://', '').replace('http://', '').replace('www.', '');
}

function copyToClipboard(text) {
  const el = document.createElement('textarea');
  el.value = text;
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.focus();
  el.select();
  try { document.execCommand('copy'); } catch(e) {}
  document.body.removeChild(el);
}

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
        
        // Generate QRs
        QRCode.toDataURL(profile.registration.id).then(setEntryQr);
        QRCode.toDataURL('unlock:' + profile.id).then(setNetworkQr);
      }

      setLoading(false);
    }
    init();
  }, [params.token]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>;
  if (screen === 'splash') return <div className="min-h-screen bg-black flex items-center justify-center animate-pulse"><h1 className="text-white text-xl tracking-[0.4em]">PRESENCE MANIFESTED</h1></div>;

  // --- SUB-COMPONENTS ---
  const Onboarding = () => {
    const [form, setForm] = useState({
      name: guest?.name || '',
      role: guest?.role_title || '',
      org: guest?.organisation || '',
      bio: guest?.bio || '',
      link: guest?.platform_link || ''
    });

    const handleSave = async () => {
      const { error } = await supabase.from('guest_profiles').update({
        name: form.name,
        role_title: form.role,
        organisation: form.org,
        bio: form.bio,
        platform_link: form.link
      }).eq('id', guest.id);
      if (!error) setScreen('scene');
    };

    return (
      <div className="min-h-screen bg-black text-white p-8 flex flex-col justify-center animate-in fade-in duration-700">
        <h1 className="text-2xl font-light mb-8">Who are you?</h1>
        <div className="space-y-6">
          <input placeholder="Full Name" className="w-full bg-transparent border-b border-white/20 py-2 outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <input placeholder="Role / Title" className="w-full bg-transparent border-b border-white/20 py-2 outline-none" value={form.role} onChange={e => setForm({...form, role: e.target.value})} />
          <input placeholder="Organisation" className="w-full bg-transparent border-b border-white/20 py-2 outline-none" value={form.org} onChange={e => setForm({...form, org: e.target.value})} />
          <textarea placeholder="Short Bio / Vibe" className="w-full bg-transparent border-b border-white/20 py-4 outline-none resize-none" value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} />
          <input placeholder="Social Link (LinkedIn/IG)" className="w-full bg-transparent border-b border-white/20 py-2 outline-none" value={form.link} onChange={e => setForm({...form, link: e.target.value})} />
          <button onClick={handleSave} className="w-full bg-white text-black py-4 mt-8 font-medium">Enter Presence</button>
        </div>
      </div>
    );
  };

  if (screen === 'identity') return <Onboarding />;

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-sans">
      {/* SCENE TAB */}
      {activeTab === 'home' && (
        <div className="p-6 space-y-8 animate-in slide-in-from-bottom-4">
          <header>
            <p className="text-zinc-500 uppercase tracking-widest text-[10px] mb-1">Live Event</p>
            <h1 className="text-3xl font-light">{event?.title}</h1>
          </header>
          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-light mb-1">34</p>
                <p className="text-zinc-500 text-xs">Networking now</p>
              </div>
              <button onClick={() => { setNetworkingActive(true); setActiveTab('network'); }} className="bg-white text-black px-6 py-2 rounded-full text-xs font-bold">Start Networking</button>
            </div>
          </div>
          <div className="space-y-2 text-sm text-zinc-400">
            <div className="flex items-center gap-2"><MapPin size={14} /> {event?.venue}</div>
          </div>
        </div>
      )}

      {/* TICKET TAB */}
      {activeTab === 'ticket' && (
        <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] space-y-10 animate-in fade-in">
          <div className="text-center space-y-4">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Entry Ticket</p>
            <div className="bg-white p-3 rounded-xl"><img src={entryQr} className='w-40 h-40' alt='Entry QR' /></div>
          </div>
          <div className="w-12 h-[1px] bg-white/20" />
          <div className="text-center space-y-4">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Networking QR</p>
            {!networkingActive ? (
              <div className="bg-zinc-900 border border-dashed border-white/10 p-6 rounded-xl text-zinc-600"><Lock size={20} className="mx-auto mb-2" /><p className="text-[10px]">Start networking to reveal</p></div>
            ) : (
              <div className="bg-white p-3 rounded-xl border-4 border-blue-500/20"><img src={networkQr} className='w-40 h-40' alt='Network QR' /></div>
            )}
          </div>
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="p-6 space-y-8 animate-in fade-in">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center"><User className="text-zinc-500" /></div>
            <div><h2 className="text-lg font-light">{guest?.name}</h2><p className="text-xs text-zinc-500">{guest?.role_title} @ {guest?.organisation}</p></div>
          </div>
          <div>
            <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4">Connections</h3>
            <div className="space-y-3">
              <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex justify-between items-center opacity-50">
                <div><p className="text-sm font-medium italic">Scanning logic coming next...</p></div>
                <QrCode size={16} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NETWORK TAB */}
      {activeTab === 'network' && (
        <div className="h-[70vh] flex items-center justify-center p-6 text-center">
          {!networkingActive ? (
            <button onClick={() => setNetworkingActive(true)} className="bg-white text-black px-12 py-4 rounded-full font-bold">Start Networking</button>
          ) : (
            <div className="space-y-2 animate-pulse"><p className="text-zinc-500 text-sm">Searching for attendees...</p></div>
          )}
        </div>
      )}

      {/* NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 px-8 py-6 flex justify-between items-center">
        <button onClick={() => setActiveTab('home')} className={activeTab === 'home' ? 'text-white' : 'text-zinc-600'}><MapPin size={22} /></button>
        <button onClick={() => setActiveTab('network')} className={activeTab === 'network' ? 'text-white' : 'text-zinc-600'}><Users size={22} /></button>
        <button onClick={() => setActiveTab('ticket')} className={activeTab === 'ticket' ? 'text-white' : 'text-zinc-600'}><QrCode size={22} /></button>
        <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'text-white' : 'text-zinc-600'}><User size={22} /></button>
      </nav>
    </div>
  );
}
