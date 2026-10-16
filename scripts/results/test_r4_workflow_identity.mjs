import test from 'node:test';
import assert from 'node:assert/strict';
import {validR4WorkflowClaims} from '../../supabase/functions/_shared/r4-workflow-claims.ts';

const valid={iss:'https://token.actions.githubusercontent.com',aud:'portfolioai-results-r4',
  repository_id:'1357024254',repository:'drddutta-portfolio/PortfiolioAI',
  ref:'refs/heads/PortfolioAI-Development',
  workflow_ref:'drddutta-portfolio/PortfiolioAI/.github/workflows/results-r4-trendlyne-history.yml@refs/heads/PortfolioAI-Development',
  event_name:'push',exp:2000,nbf:900,run_id:'123',run_attempt:'1'};
test('accept only the exact push and dispatched Development workflow',()=>{
  for(const event_name of ['push','workflow_dispatch'])
    assert.equal(validR4WorkflowClaims({alg:'RS256'},{...valid,event_name},1000),true);
});
test('reject foreign repository, branch, workflow, audience, event and invalid time',()=>{
  for(const [key,value] of Object.entries({iss:'https://example.com',aud:'other',repository_id:'2',
    repository:'other/repo',ref:'refs/heads/main',workflow_ref:'other.yml',event_name:'pull_request',
    exp:999,nbf:1031,run_id:'1;bad',run_attempt:undefined}))
    assert.equal(validR4WorkflowClaims({alg:'RS256'},{...valid,[key]:value},1000),false,key);
  assert.equal(validR4WorkflowClaims({alg:'none'},valid,1000),false);
});
