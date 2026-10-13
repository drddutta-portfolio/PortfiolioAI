import {describe,it,expect} from 'vitest'
import {G02_ORIGINAL_PINS as pins,G02_OWNER_POLICY as policy,g02SourceExecutorQualified,g02ReadUrlAllowed,g02R2Key,g02SourcePin,prepareG02Source,hashG02,verifyG02Original} from './v14-g02-source-import'
const claims={repository:'drddutta-portfolio/PortfiolioAI',repository_id:'1357024254',ref:'refs/heads/codex/g02-industry-evidence',environment:'PortfolioAI-Development',sub:'repo:drddutta-portfolio@324877535/PortfiolioAI@1357024254:environment:PortfolioAI-Development',workflow_ref:'drddutta-portfolio/PortfiolioAI/.github/workflows/g02-source-qualification.yml@refs/heads/codex/g02-industry-evidence',event_name:'push'}
describe('G02 signed original import cannot fabricate acceptance or widen source scope',()=>{
 it('requires the exact protected branch/workflow/environment and repository identity',()=>{
  expect(g02SourceExecutorQualified(claims)).toBe(true)
  for(const change of [{ref:'refs/heads/main'},{environment:'Production'},{workflow_ref:'attacker'},{repository_id:'wrong'},{sub:'repo:other'},{event_name:'pull_request'}])expect(g02SourceExecutorQualified({...claims,...change})).toBe(false)
 })
 it('binds all source pins only to the three owner-authorized frozen targets',()=>{
  expect(new Set(pins.map(p=>p.symbol))).toEqual(new Set(['CGPOWER','AVALON','TDPOWERSYS']))
  expect(pins.every(p=>policy.securityIds.includes(p.security_id)&&p.original_bytes>0&&p.original_bytes<=64*1024*1024)).toBe(true)
  expect(()=>g02SourcePin('0'.repeat(64))).toThrow('EXACT_ORIGINAL')
 })
 it('allows only the hash-addressed Development object and bounded signed read URL',()=>{
  const p=pins[0]!,path='/portfolioai-history-dev/'+g02R2Key(p.original_sha256),u='https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com'+path+'?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=240'
  expect(g02ReadUrlAllowed(p.original_sha256,u)).toBe(true)
  for(const bad of [u.replace('https:','http:'),u.replace('portfolioai-history-dev','portfolioai-history-prod'),u.replace('Expires=240','Expires=3600'),u+'#secret',u.replace('cloudflarestorage.com','cloudflarestorage.com.evil.test')])expect(g02ReadUrlAllowed(p.original_sha256,bad)).toBe(false)
 })
 it('fails corrupt/truncated bytes before source or financial admission',async()=>{await expect(verifyG02Original(pins[0]!.original_sha256,new TextEncoder().encode('%PDF-corrupt'))).rejects.toThrow('BYTES_MISMATCH')})
 it('preserves unknown publication and separates source registration from financial review',async()=>{
  const at='2026-11-01T00:00:00Z',source=await prepareG02Source(pins[0]!.original_sha256,at)
  expect(source.published_at).toBeNull();expect(source.raw_payload).toMatchObject({publication_precision:'UNKNOWN',proven_availability_at:at,financial_admission:false})
  expect(source.payload_hash).toBe(await hashG02(source.raw_payload))
  expect(await prepareG02Source(pins[0]!.original_sha256,at)).toEqual(source)
  await expect(prepareG02Source(pins[0]!.original_sha256,'2020-01-01T00:00:00Z')).rejects.toThrow('VERIFICATION_TIME_INVALID')
 })
})
