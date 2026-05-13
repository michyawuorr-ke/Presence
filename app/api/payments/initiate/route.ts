import{NextRequest,NextResponse}from'next/server';
import{createClient}from'@supabase/supabase-js';

const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function getToken(){
  const auth=Buffer.from(process.env.MPESA_CONSUMER_KEY+':'+process.env.MPESA_CONSUMER_SECRET).toString('base64');
  const res=await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',{headers:{Authorization:'Basic '+auth}});
  const data=await res.json();
  return data.access_token;
}

export async function POST(req:NextRequest){
  try{
    const{phone,amount,registration_id}=await req.json();
    if(!phone||!amount||!registration_id)return NextResponse.json({error:'Missing fields'},{status:400});

    const token=await getToken();
    const shortcode=process.env.MPESA_SHORTCODE!;
    const passkey=process.env.MPESA_PASSKEY!;
    const timestamp=new Date().toISOString().replace(/[-T:.Z]/g,'').slice(0,14);
    const password=Buffer.from(shortcode+passkey+timestamp).toString('base64');

    const body={
      BusinessShortCode:shortcode,
      Password:password,
      Timestamp:timestamp,
      TransactionType:'CustomerBuyGoodsOnline',
      Amount:Math.ceil(amount),
      PartyA:phone,
      PartyB:shortcode,
      PhoneNumber:phone,
      CallBackURL:process.env.MPESA_CALLBACK_URL,
      AccountReference:'Presence',
      TransactionDesc:'Event Ticket'
    };

    const stkRes=await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',{
      method:'POST',
      headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });

    const stkData=await stkRes.json();

    if(stkData.ResponseCode==='0'){
      await supabase.from('payments').insert({
        registration_id,
        amount,
        phone_number:phone,
        status:'pending',
        mpesa_receipt:stkData.CheckoutRequestID
      });
      return NextResponse.json({success:true,checkout_request_id:stkData.CheckoutRequestID});
    }else{
      return NextResponse.json({error:stkData.errorMessage||'STK push failed'},{status:400});
    }
  }catch(err){
    console.error('M-Pesa initiate error:',err);
    return NextResponse.json({error:'Server error'},{status:500});
  }
}
