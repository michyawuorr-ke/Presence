'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateEvent() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  return (
    <div style={{ padding: "40px 24px", background: "#060608", minHeight: "100vh" }}>
      <p style={{ fontSize: "11px", letterSpacing: "0.4em", color: "#666", textTransform: "uppercase", marginBottom: "40px", textAlign: "center", fontWeight: "600" }}>
        Event Engine
      </p>

      <div style={{ background: "#111015", borderRadius: "28px", padding: "32px 24px", border: "1px solid rgba(255,255,255,0.03)", boxShadow: "0 20px 40px rgba(0,0,0,0.7)" }}>
        
        <div className="premium-form-group">
          <label className="premium-label">Event Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Nairobi Tech Meetup" className="premium-input-well" />
        </div>

        <div className="premium-form-group">
          <label className="premium-label">Venue / Location</label>
          <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. iHub, Nairobi" className="premium-input-well" />
        </div>

        <div className="premium-form-group">
          <label className="premium-label">Description</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What should guests expect?" className="premium-input-well" />
        </div>

        <div className="premium-form-group">
          <label className="premium-label">Start Time</label>
          <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="premium-input-well" />
        </div>

        <div className="premium-form-group">
          <label className="premium-label">End Time</label>
          <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="premium-input-well" />
        </div>

      </div>
    </div>
  );
}
