'use client';
import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase/client";
import { useRouter, useParams } from 'next/navigation';

export default function TicketsRevenueHub({ params }: { params: { id: string } }) {
  const router = useRouter();
  const paramsHook = useParams();
  const eventId = (paramsHook?.id || params?.id) as string;
  const [stats, setStats] = useState({ revenue: 0, tickets: 0, registrations: 0, checkins: 0 });
  const [regs, setRegs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadData() {
    const { data: allRegs } = await supabase
      .from('registrations')
      .select('*, ticket_types(name, price)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (allRegs) {
      setRegs(allRegs);
      const paidTickets = allRegs.filter(r => r.status === 'confirmed' || r.paid);
      const grossRev = paidTickets.reduce((sum: number, r: any) => sum + (r.amount || r.ticket_types?.price || 0), 0);
      setStats({
        revenue: Math.round(grossRev * 0.95),
        tickets: paidTickets.length,
        registrations: allRegs.length,
        checkins: allRegs.filter(r => r.checked_in).length
      });
    }
  }

  useEffect(() => { loadData(); }, [eventId]);

  async function togglePaymentStatus(r: any) {
    setUpdatingId(r.id);
    const targetStatus = r.status === 'confirmed' ? 'pending' : 'confirmed';
    const targetPaid = r.status !== 'confirmed';
    const { error } = await supabase
      .from('registrations')
      .update({ status: targetStatus, paid: targetPaid })
      .eq('id', r.id);
    if (!error) await loadData();
    setUpdatingId(null);
  }

  const filteredRegs = regs.filter(r => {
    if (!search.trim()) return true;
    const term = search.toLowerCase().trim();
    const name = (r.guest_name || r.full_name || r.name || "").toLowerCase();
    const phone = (r.guest_phone || r.phone_number || "").toLowerCase();
    const ticket = (r.ticket_types?.name || "").toLowerCase();
    const code = (r.mpesa_receipt || "").toLowerCase();
    return name.includes(term) || phone.includes(term) || ticket.includes(term) || code.includes(term);
  });

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#f3f4f6', padding: '24px 16px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
        </div>

        {/* STATS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '20px' }}>
          {[
            { label: 'Net Rev', value: `KES ${stats.revenue.toLocaleString()}`, color: '#D4AF37' },
            { label: 'Sold', value: stats.tickets },
            { label: 'Reg', value: stats.registrations },
            { label: 'In', value: stats.checkins },
          ].map((card, i) => (
            <div key={i} style={{ background: '#121115', padding: '10px 6px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: '0 0 2px' }}>{card.label}</p>
              <p style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: (card as any).color || '#fff' }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* SEARCH */}
        <div style={{ marginBottom: '16px' }}>
          <input type="text" placeholder="Search name, phone, M-Pesa code..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: '#121115', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* PENDING VERIFICATION BANNER */}
        {regs.filter(r => r.status === 'pending' && r.mpesa_receipt).length > 0 && (
          <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#D4AF37' }}>
            ⚠ {regs.filter(r => r.status === 'pending' && r.mpesa_receipt).length} registration(s) awaiting payment verification
          </div>
        )}

        {/* ATTENDEE ROWS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredRegs.map(r => {
            const isConfirmed = r.status === 'confirmed' || r.paid;
            const hasMpesaCode = !!r.mpesa_receipt;
            const needsVerification = r.status === 'pending' && hasMpesaCode;
            const isExpanded = expandedId === r.id;

            return (
              <div key={r.id} style={{ background: '#0c0b0f', borderRadius: '12px', border: needsVerification ? '1px solid rgba(212,175,55,0.2)' : '1px solid rgba(255,255,255,0.03)', overflow: 'hidden' }}>
                <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  {/* INFO */}
                  <div style={{ flex: 1, minWidth: 0 }} onClick={() => setExpandedId(isExpanded ? null : r.id)} >
                    <div style={{ fontWeight: '600', fontSize: '13px', color: '#f3f4f6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}>
                      {r.guest_name || r.full_name || r.name || r.id.substring(0,8) + ' (Guest)'}
                      {needsVerification && <span style={{ marginLeft: '6px', fontSize: '9px', color: '#D4AF37', background: 'rgba(212,175,55,0.1)', padding: '1px 5px', borderRadius: '4px' }}>CODE SUBMITTED</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '2px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', flexWrap: 'wrap' }}>
                      <span>{r.guest_phone || r.phone_number || 'No Phone'}</span>
                      <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                      <span style={{ color: '#D4AF37', fontWeight: '500' }}>{(r.ticket_types?.name || 'General') + ' — KES ' + (r.amount || r.ticket_types?.price || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* APPROVE BUTTON */}
                  <button disabled={updatingId === r.id} onClick={() => togglePaymentStatus(r)}
                    style={{ padding: '6px 12px', borderRadius: '8px', background: isConfirmed ? 'rgba(255,255,255,0.02)' : needsVerification ? 'rgba(212,175,55,0.1)' : 'rgba(212,175,55,0.05)', border: isConfirmed ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(212,175,55,0.2)', color: isConfirmed ? 'rgba(255,255,255,0.4)' : '#D4AF37', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {updatingId === r.id ? '...' : isConfirmed ? 'PAID ✓' : needsVerification ? 'VERIFY & APPROVE' : 'Approve'}
                  </button>
                </div>

                {/* EXPANDED: SHOW M-PESA CODE */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '12px', background: 'rgba(0,0,0,0.2)' }}>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>M-Pesa Receipt Code</p>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: hasMpesaCode ? '#D4AF37' : 'rgba(255,255,255,0.2)', letterSpacing: '0.08em', margin: '0 0 8px 0', fontFamily: 'monospace' }}>
                      {r.mpesa_receipt || 'No code submitted yet'}
                    </p>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                      Registered: {new Date(r.created_at).toLocaleString('en-KE')}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {filteredRegs.length === 0 && (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '20px' }}>No registrations yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
