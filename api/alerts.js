// Vercel Function. Public threat data only; never trust upstream text as instructions.
const SOURCES={threats:'https://neptun.in.ua/api/v1/threats',alerts:'https://neptun.in.ua/api/v1/alerts'};
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const type=String(req.query.type||'');
  if(!Object.hasOwn(SOURCES,type))return res.status(400).json({error:'Invalid type'});
  try{
    const response=await fetch(SOURCES[type],{signal:AbortSignal.timeout(8000),headers:{Accept:'application/json'}});
    if(!response.ok)return res.status(502).json({error:'Upstream unavailable'});
    const body=await response.text();
    if(body.length>1500000)return res.status(502).json({error:'Payload too large'});
    const data=JSON.parse(body);
    if(!data||typeof data!=='object')throw Error('Invalid payload');
    // Reject arbitrary alert descriptions containing unsafe control characters.
    const safe=(v,depth=0)=>{
      if(depth>8)return null;
      if(typeof v==='string')return v.replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,400);
      if(Array.isArray(v))return v.slice(0,2000).map(x=>safe(x,depth+1));
      if(v&&typeof v==='object'){const out={};for(const [k,val] of Object.entries(v).slice(0,45)){if(/^[a-zA-Z0-9_-]{1,64}$/.test(k))out[k]=safe(val,depth+1)}return out}
      return typeof v==='number'&&Number.isFinite(v)||typeof v==='boolean'||v===null?v:null;
    };
    return res.status(200).json({data:safe(data),fetchedAt:new Date().toISOString()});
  }catch(e){return res.status(502).json({error:'Data source unavailable'});}
}
