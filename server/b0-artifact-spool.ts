import {mkdtemp,open,rm} from 'node:fs/promises'
import {createReadStream} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {Readable} from 'node:stream'
import {captureByteStream} from '../supabase/functions/_shared/v14-master-capture.ts'

// Only raw bytes are staged, never the parsed master. Storage is private and
// bounded; staging gives R2 the exact decoded length regardless of compression.
export async function spoolArtifact(chunks:AsyncIterable<Uint8Array>,maxBytes:number){
  const directory=await mkdtemp(join(tmpdir(),'portfolioai-b0-'))
  const path=join(directory,'master.json')
  const file=await open(path,'wx',0o600)
  let closed=false
  try{
    const result=await captureByteStream(chunks,{
      async write(chunk){await file.writeFile(chunk)},
      async close(){await file.close();closed=true},
    },maxBytes)
    return{...result,
      stream:()=>Readable.toWeb(createReadStream(path)),
      cleanup:()=>rm(directory,{recursive:true,force:true}),
    }
  }catch(error){
    if(!closed)await file.close()
    await rm(directory,{recursive:true,force:true})
    throw error
  }
}
