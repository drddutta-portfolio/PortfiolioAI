import test from 'node:test';
import assert from 'node:assert/strict';
import {readR4ProviderToolResult as read} from '../../supabase/functions/_shared/r4-provider-result.ts';
const text=value=>({content:[{type:'text',text:value}]});
test('reject HTTP-success tool errors before budget accounting marks success',()=>{
  for (const value of [{isError:true,...text('blocked')},text('{"status":"error","message":"blocked"}'),text('{"success":false}'),text('Error: failed'),text('Authentication failed')])
    assert.throws(()=>read(value),/PROVIDER_(?:TOOL_RESULT|AUTHENTICATION)_ERROR/);
});
test('retain successful original response for private source review',()=>{
  for(const value of ['{"data":[]}','{"data":[{"value":123}]}','Issuer filing search result'])
    assert.equal(read(text(value)),value);
});
test('reject missing and unknown tool results',()=>{
  for(const value of [null,{},text('Unknown tool: absent')]) assert.throws(()=>read(value),/PROVIDER_/);
});
test('distinguish upstream quota rejection from successful provider results',()=>{
  assert.throws(()=>read(text('{"status":"error","message":"API quota exceeded"}')),/PROVIDER_QUOTA_ERROR/);
});
