'use client';
import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';

interface Registration {
  id: string;
  guest_name: string;
  guest_phone: string;
  ticket_type_id: string;
  amount: number;
  status: string;
  checked_in: boolean;
}

export default function TicketsRevenueHub({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [stats, setStats] = useState({ revenue: 0, tickets: 0, registrations: 0, checkins: 0 });
  const [regs, setRegs] = useState<Registration[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      const { data: allRegs } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', params.id);

      if (allRegs) {
        const typedRegs = allRegs as Registration[];
        setRegs(typedRegs);
        const confirmed = typedRegs.filter((r) => r.status === 'confirmed');
        const rev = confirmed.reduce((sum: number, r: Registration) => sum + (r.amount || 0), 0);
        const check = typedRegs.filter((r) => r.checked_in).length;
        
        setStats({
          revenue: Math.round(rev * 0.95),
          tickets: confirmed.length,
          registrations: typedRegs.length,
          checkins: check
        });
      }
    }
    loadData();
  }, [params.id]);

  const filteredRegs = regs.filter((r: Registration) => 
    (r.guest_name?.toLowerCase().includes(search.toLowerCase()) || '') ||
    (r.ticket_type_id?.toLowerCase().includes(search.toLowerCase()) || '')
  );

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', padding: '40px 24px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', marginBottom: '20px' }}>← Back to Dashboard</button>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '32px' }}>Tickets & Revenue <span style={{ color: '#FFD700' }}>Hub</span></h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {[
            { label: 'Net Revenue', value: `KES ${stats.revenue.toLocaleString()}` },
            { label: 'Tickets Sold', value: stats.tickets },
            { label: 'Total Registered', value: stats.registrations },
            { label: 'Checked In', value: stats.checkins },
          ].map((card, i) => (
            <div key={i} style={{ background: '#0a0a0c', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '8px' }}>{card.label}</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: i === 0 ? '#FFD700' : '#fff' }}>{card.value}</p>
            </div>
          ))}
        </div>

        <div style={{ background: '#0a0a0c', borderRadius: '20px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px' }}>Attendee List</h2>
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ background: '#161618', padding: '10px', borderRadius: '10px', color: '#fff', border: '1px solid #222' }} />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #222' }}>
                <th style={{ padding: '12px', color: '#666', fontSize: '12px', textAlign: 'left' }}>ATTENDEE</th>
                <th style={{ padding: '12px', color: '#666', fontSize: '12px', textAlign: 'left' }}>TICKET</th>
                <th style={{ padding: '12px', color: '#666', fontSize: '12px', textAlign: 'left' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegs.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '16px' }}>{r.guest_name}<div style={{ color: '#666', fontSize: '12px' }}>{r.guest_phone}</div></td>
                  <td style={{ padding: '16px' }}>{r.ticket_type_id}</td>
                  <td style={{ padding: '16px' }}><span style={{ color: r.checked_in ? '#4ade80' : '#60a5fa' }}>{r.checked_in ? 'Checked In' : r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
