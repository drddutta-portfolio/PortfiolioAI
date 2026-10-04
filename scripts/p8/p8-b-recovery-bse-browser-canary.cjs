const { chromium } = require('playwright');
const fs = require('fs');
(async()=>{
  const out={version:"P8_B_RECOVERY_BSE_BROWSER_CANARY_V1",status:"BLOCKED",generated_at:new Date().toISOString()};
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({locale:'en-IN',timezoneId:'Asia/Kolkata'});
  const page=await context.newPage();
  try{
    const landing=await page.goto('https://www.bseindia.com/corporates/ann.html',{waitUntil:'domcontentloaded',timeout:60000});
    out.landing_status=landing && landing.status();
    await page.waitForTimeout(3000);
    const result=await page.evaluate(async()=>{
      const u=new URL('https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w');
      u.searchParams.set('pageno','1');
      u.searchParams.set('strCat','-1');
      u.searchParams.set('strPrevDate','20250102');
      u.searchParams.set('strScrip','');
      u.searchParams.set('strSearch','P');
      u.searchParams.set('strToDate','20250102');
      u.searchParams.set('strType','C');
      try{
        const r=await fetch(u.toString(),{credentials:'include',headers:{'accept':'application/json, text/plain, */*'}});
        const text=await r.text();
        let json=null;try{json=JSON.parse(text)}catch{}
        return {status:r.status,ok:r.ok,contentType:r.headers.get('content-type'),json:!!json,keys:json&&typeof json==='object'?Object.keys(json):[],tableRows:json&&Array.isArray(json.Table)?json.Table.length:null,bodyPrefix:text.slice(0,200)};
      }catch(e){return {error:e.name+':'+e.message}}
    });
    out.api=result;
    out.status=(out.landing_status===200 && result && result.status===200 && result.json)?'PASS':'BLOCKED';
  }catch(e){out.error=e.name+':'+e.message}
  await browser.close();
  fs.mkdirSync('docs/p8',{recursive:true});
  fs.writeFileSync('docs/p8/PortfolioAI_P8_B_RECOVERY_BSE_BROWSER_CANARY_2026-10-04.json',JSON.stringify(out,null,2)+'\n');
  console.log(JSON.stringify(out,null,2));
  process.exit(out.status==='PASS'?0:2);
})();