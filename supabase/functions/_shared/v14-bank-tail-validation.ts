import type {AngelDailyCandle} from "./angel-one.ts"
export const bankTailDay=(iso:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(iso))
const decimal=(s:string):[bigint,number]=>{
 if(!/^\d+(?:\.\d+)?$/u.test(s))throw new Error("BANK_TAIL_NUMERIC_INVALID")
 const [whole,fraction=""]=s.split(".");return[BigInt(whole+fraction),fraction.length]
}
const compare=(a:string,b:string)=>{const[x,xs]=decimal(a),[y,ys]=decimal(b);return x*10n**BigInt(ys)-y*10n**BigInt(xs)}
/** Validate the full returned window; never silently drop out-of-scope or contradictory rows. */
export function validateBankTail(candles:readonly AngelDailyCandle[],from:string,to:string):void{
 if(!candles.length)throw new Error("BANK_TAIL_EMPTY")
 const sessions=new Set<string>()
 for(const c of candles){
  const day=bankTailDay(c.periodStart)
  if(day<from||day>to||sessions.has(day))throw new Error("BANK_TAIL_SESSION_SCOPE_INVALID")
  sessions.add(day)
  for(const price of [c.open,c.high,c.low,c.close])if(compare(price,"0")<=0)throw new Error("BANK_TAIL_PRICE_INVALID")
  if(compare(c.high,c.low)<0||compare(c.high,c.open)<0||compare(c.high,c.close)<0||compare(c.low,c.open)>0||compare(c.low,c.close)>0)throw new Error("BANK_TAIL_OHLC_INVALID")
  if(c.volume!==null&&compare(c.volume,"0")<0)throw new Error("BANK_TAIL_VOLUME_INVALID")
 }
 if(!sessions.has(to))throw new Error("BANK_TAIL_END_SESSION_MISSING")
}
