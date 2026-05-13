import{NextRequest,NextResponse}from'next/server';
import{createClient}from'@supabase/supabase-js';

const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req:NextRequest){
  try{
    const body=await req.json();
    const result=body?.Body?.stkCallback;
    if(!result)return NextResponse.json({success:true});

    const checkoutId=result.CheckoutRequestID;
    const resultCode=result.ResultCode;

    if(resultCode===0){
      const meta=result.CallbackMetadata?.Item||[];
      const receipt=meta.find((i:any)=>i.Name==='MpesaReceiptNumber')?.Value;
      await supabase.from('payments').update({status:'success',mpesa_receipt:receipt}).eq('mpesa_receipt',checkoutId);
      const{data:payment}=await supabase.from('payments').select('registration_id').eq('mpesa_receipt',receipt).single();
      if(payment){
        await supabase.from('registrations').update({paid:true,status:'confirmed'}).eq('id',payment.registration_id);
      }
    }else{
      await supabase.from('payments').update({status:'failed'}).eq('mpesa_receipt',checkoutId);
    }

    return NextResponse.json({success:true});
  }catch(err){
    console.error('M-Pesa callback error:',err);
    return NextResponse.json({success:true});
  }
}
