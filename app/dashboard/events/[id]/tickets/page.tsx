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
  paid: boolean;
}

export default function TicketsRevenueHub({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [stats, setStats] = useState({ revenue: 0, tickets: 0, registrations: 0, checkins: 0 });
  const [regs, setRegs] = useState<Registration[]>([]);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadData() {
    const { data: allRegs } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', params.id);

    if (allRegs) {
      const typedRegs = allRegs as Registration[];
      setRegs(typedRegs);
      
      // Calculate revenue from verified paid or confirmed entries
      const paidTickets = typedRegs.filter(r => r.status === 'confirmed' || r.paid);
      const grossRev = paidTickets.reduce((sum, r) => sum + (r.amount || 0), 0);
      
      setStats({
        revenue: Math.round(grossRev * 0.95), // 5% Infrastructure Fee subtracted
        tickets: paidTickets.length,
        registrations: typedRegs.length,
        checkins: typedRegs.filter(r => r.checked_in).length
      });
    }
  }

  useEffect(() => {
    loadData();
  }, [params.id]);

  const togglePaymentStatus = async (registration: Registration) => {
    setUpdatingId(registration.id);
    const targetStatus = registration.status === 'confirmed' ? 'pending' : 'confirmed';
    const targetPaidStatus = !registration.paid;

    const { error } = await supabase
      .from('registrations')
      .update({ status: targetStatus, paid: targetPaidStatus })
      .eq('id', registration.id);

    if (!error) {
      await loadData();
    }
    setUpdatingId(null);
  };

  const filteredRegs = regs.filter((r: Registration) => 
    (r.guest_name?.toLowerCase().includes(search.toLowerCase()) || '') ||
    (r.ticket_type_id?.toLowerCase().includes(search.toLowerCase()) || '') ||
    (r.guest_phone?.includes(search) || '')
  );

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#f3f4f6', padding: '24px 16px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        
        {/* TOP COMPACT NAV */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
          <h1 style={{ fontSize: '14px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>
            Revenue & Access <span style={{ color: '#D4AF37' }}>Hub</span>
          </h1>
        </div>

        {/* ULTRA-COMPACT TELEMETRY ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '20px' }}>
          {[
            { label: 'Net Rev', value: `${(stats.revenue / 1000).toFixed(1)}k`, color: '#D4AF37' },
            { label: 'Sold', value: stats.tickets },
            { label: 'Reg', value: stats.registrations },
            { label: 'In', value: stats.checkins },
          ].map((card, i) => (
            <div key={i} style={{ background: '#121115', padding: '10px 6px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: '0 0 2px' }}>{card.label}</p>
              <p style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: card.color || '#fff' }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* CONTROLS ZONE: RAZOR THIN SEARCH */}
        <div style={{ marginBottom: '16px' }}>
          <input 
            type="text" 
            placeholder="Search guest, ticket, or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: '100%', 
              background: '#121115', 
              border: '1px solid rgba(255,255,255,0.06)', 
              borderRadius: '8px', 
              padding: '8px 12px', 
              color: '#fff', 
              fontSize: '12px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* HIGH-DENSITY ATTENDEE ROWS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredRegs.map((r) => {
            const isConfirmed = r.status === 'confirmed' || r.paid;
            return (
              <div 
                key={r.id} 
                style={{ 
                  background: '#0c0b0f', 
                  borderRadius: '12px', 
                  padding: '12px', 
                  border: '1px solid rgba(255,255,255,0.03)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                {/* GUEST INFO BLOCK */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#f3f4f6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.guest_name}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '2px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                    <span>{r.guest_phone || 'No Phone'}</span>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                    <span style={{ color: '#D4AF37', fontWeight: '500' }}>{r.ticket_type_id}</span>
                  </div>
                </div>

                {/* MANUAL STATE INTERACTION CORNER */}
                <button
                  disabled={updatingId === r.id}
                  onClick={() => togglePaymentStatus(r)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: isConfirmed ? 'rgba(74, 222, 128, 0.04)' : 'rgba(212, 175, 55, 0.04)',
                    border: isConfirmed ? '1px solid rgba(74, 222, 128, 0.2)' : '1px solid rgba(212, 175, 55, 0.2)',
                    color: isConfirmed ? '#4ade80' : '#D4AF37',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {updatingId === r.id ? '...' : isConfirmed ? 'Paid ✓' : 'Approve'}
                </button>
              </div>
            );
          })}

          {filteredRegs.length === 0 && (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '20px' }}>
              No matching records mapped into this viewport.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
