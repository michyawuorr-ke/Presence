'use client';
import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase/client";
import { useRouter, useParams } from 'next/navigation';

interface Registration {
  id: string;
  full_name: string;
  phone_number: string;
  ticket_type: string;
  amount: number;
  status: string;
  checked_in: boolean;
  paid: boolean;
}

export default function TicketsRevenueHub({ params }: { params: { id: string } }) {
  const router = useRouter();
  const paramsHook = useParams();
  const eventId = (paramsHook?.id || params?.id) as string;
  const [stats, setStats] = useState({ revenue: 0, tickets: 0, registrations: 0, checkins: 0 });
  const [regs, setRegs] = useState<Registration[]>([]);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadData() {
    const { data: allRegs } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId);

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
  }, [eventId]);

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

  const filteredRegs = regs.filter((r: Registration) => {
    if (!search || search.trim() === "") return true;
    const term = search.toLowerCase().trim();
    const nameMatch = (r.full_name || "").toLowerCase().includes(term);
    const typeMatch = (r.ticket_type || "").toLowerCase().includes(term);
    const phoneMatch = (r.phone_number || "").includes(term);
    return nameMatch || typeMatch || phoneMatch;
  });

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
            { label: 'Net Rev', value: `KES ${stats.revenue.toLocaleString()}`, color: '#D4AF37' },
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
                    {(r.full_name || r.id.substring(0,8) + ' (Guest)')}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '2px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                    <span>{r.phone_number || 'No Phone'}</span>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                    <span style={{ color: '#D4AF37', fontWeight: '500' }}>{r.ticket_type || 'General'}</span>
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
