import{NextRequest,NextResponse}from'next/server';
import{createClient}from'@supabase/supabase-js';

const supabase=createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Safaricom sandbox and production IP ranges
const SAFARICOM_IPS=[
  '196.201.214.200','196.201.214.206','196.201.213.114',
  '196.201.214.207','196.201.214.208','196.201.213.44',
  '196.201.212.127','196.201.212.138','196.201.212.129',
  '196.201.212.136','196.201.212.74','196.201.212.69',
];

async function verifyWithDaraja(checkoutRequestId:string):Promise<boolean>{
  try{
    // Get OAuth token
    const auth=Buffer.from(
      process.env.MPESA_CONSUMER_KEY+':'+process.env.MPESA_CONSUMER_SECRET
    ).toString('base64');

    const tokenRes=await fetch(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {headers:{Authorization:'Basic '+auth}}
    );
    const tokenData=await tokenRes.json();
    const token=tokenData.access_token;
    if(!token)return false;

    // Query transaction status
    const shortcode=process.env.MPESA_SHORTCODE!;
    const passkey=process.env.MPESA_PASSKEY!;
    const timestamp=new Date().toISOString().replace(/[-T:.Z]/g,'').slice(0,14);
    const password=Buffer.from(shortcode+passkey+timestamp).toString('base64');

    const queryRes=await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      {
        method:'POST',
        headers:{
          Authorization:'Bearer '+token,
          'Content-Type':'application/json',
        },
        body:JSON.stringify({
          BusinessShortCode:shortcode,
          Password:password,
          Timestamp:timestamp,
          CheckoutRequestID:checkoutRequestId,
        }),
      }
    );

    const queryData=await queryRes.json();
    // ResultCode 0 = success
    return queryData.ResultCode==='0'||queryData.ResultCode===0;
  }catch(err){
    console.error('Daraja verification error:',err);
    return false;
  }
}

export async function POST(req:NextRequest){
  try{
    // Step 1: Verify request comes from Safaricom IP
    const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'';
    const isDev=process.env.NODE_ENV==='development';

    if(!isDev&&!SAFARICOM_IPS.includes(ip)){
      console.warn('Callback from unknown IP:',ip);
      // Log but don't block yet in sandbox — Safaricom sandbox IPs vary
      // In production: return NextResponse.json({success:false},{status:403});
    }

    // Step 2: Parse callback body
    const body=await req.json();
    const result=body?.Body?.stkCallback;
    if(!result){
      return NextResponse.json({success:true});
    }

    const checkoutId=result.CheckoutRequestID;
    const resultCode=result.ResultCode;

    if(!checkoutId){
      return NextResponse.json({success:true});
    }

    // Step 3: Verify payment exists in our DB before processing
    const{data:existingPayment}=await supabase
      .from('payments')
      .select('id,status,registration_id,amount')
      .eq('mpesa_receipt',checkoutId)
      .single();

    if(!existingPayment){
      console.warn('Callback for unknown checkout ID:',checkoutId);
      return NextResponse.json({success:true});
    }

    // Step 4: Prevent double processing
    if(existingPayment.status==='success'){
      console.log('Payment already processed:',checkoutId);
      return NextResponse.json({success:true});
    }

    if(resultCode===0||resultCode==='0'){
      // Step 5: Verify with Daraja before confirming
      const verified=await verifyWithDaraja(checkoutId);

      if(!verified){
        console.error('Payment verification failed for:',checkoutId);
        // Don't mark as failed immediately — could be Daraja delay
        // Mark as pending_verification for manual review
        await supabase
          .from('payments')
          .update({status:'pending_verification'})
          .eq('mpesa_receipt',checkoutId);
        return NextResponse.json({success:true});
      }

      // Step 6: Extract receipt and update
      const meta=result.CallbackMetadata?.Item||[];
      const receipt=meta.find((i:any)=>i.Name==='MpesaReceiptNumber')?.Value;
      const amount=meta.find((i:any)=>i.Name==='Amount')?.Value;

      // Step 7: Verify amount matches what was expected
      if(amount&&existingPayment.amount&&Number(amount)<Number(existingPayment.amount)){
        console.error('Amount mismatch:',{expected:existingPayment.amount,received:amount});
        await supabase
          .from('payments')
          .update({status:'amount_mismatch'})
          .eq('mpesa_receipt',checkoutId);
        return NextResponse.json({success:true});
      }

      // Step 8: Confirm payment
      await supabase
        .from('payments')
        .update({status:'success',mpesa_receipt:receipt||checkoutId})
        .eq('mpesa_receipt',checkoutId);

      // Step 9: Confirm registration
      await supabase
        .from('registrations')
        .update({paid:true,status:'confirmed'})
        .eq('id',existingPayment.registration_id);

      console.log('Payment confirmed:',receipt,'for registration:',existingPayment.registration_id);

    }else{
      // Payment failed or cancelled
      await supabase
        .from('payments')
        .update({status:'failed'})
        .eq('mpesa_receipt',checkoutId);
    }

    return NextResponse.json({success:true});

  }catch(err){
    console.error('M-Pesa callback error:',err);
    // Always return success to Safaricom — they retry on failure
    return NextResponse.json({success:true});
  }
}
