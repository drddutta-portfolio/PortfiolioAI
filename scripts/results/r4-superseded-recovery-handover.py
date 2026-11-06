"""One bounded Development recovery handover; never touches financial data."""
import json,os,time
from urllib.request import Request,urlopen
from urllib.error import HTTPError

REPO='drddutta-portfolio/PortfiolioAI'
BRANCH='PortfolioAI-Development'
OFFICIAL='.github/workflows/results-r4-official-issuer-recovery.yml'
ALLOWED={
    42278536520:('f3c86452fdc81b3566ff96818fc29c5f6ef1dae9',OFFICIAL),
    42278536590:('f3c86452fdc81b3566ff96818fc29c5f6ef1dae9','.github/workflows/results-r4-trendlyne-history.yml'),
    42279627444:('66bb3b310c28e80132106e9a03d62f39695ca984','.github/workflows/results-r4-verified-seed-recovery.yml'),
    42274372727:('b9a727ad1b132336fcde13ce7f6ef6d7fc60c116',OFFICIAL),
    42274372805:('b9a727ad1b132336fcde13ce7f6ef6d7fc60c116','.github/workflows/results-r4-trendlyne-history.yml'),
    42275751248:('bc5f38bf53e2a97326cefca56603efc9d235c185',OFFICIAL),
    42275890289:('dc9ca859e100827bd5326cf8e0715b5a00d231f2','.github/workflows/results-r4-verified-seed-recovery.yml'),
    41964478291:('1ab13a124980e602bf55ccf0ede918347967722e','.github/workflows/results-r4-trendlyne-history.yml'),
    41970171948:('c7fabc44f6a6009e363a313aca9e9b92e9dec557',OFFICIAL),
    41970421564:('1f8d9544c010d9339f3dc5ed3756f6b684aec771','.github/workflows/results-r4-verified-seed-recovery.yml'),
    41969704973:('8978e547e3316b19dff9881a437c74274b64136f',OFFICIAL),
}
ACTIVE={'queued','pending','in_progress','waiting','requested'}

def development_run(run):
    return (run.get('head_branch')==BRANCH
        and (run.get('head_repository') or {}).get('full_name')==REPO)

def replacement_ready(runs,sha):
    return any(development_run(r) and r.get('head_sha')==sha
        and r.get('path')==OFFICIAL and r.get('status') in ACTIVE for r in runs)

def obsolete_run(run):
    expected=ALLOWED.get(run.get('id'))
    return bool(expected and development_run(run) and run.get('head_sha')==expected[0]
        and run.get('path')==expected[1] and run.get('status') in ACTIVE)

def api(path,method='GET'):
    if not path.startswith('/actions/'):raise ValueError('ACTIONS_API_ONLY')
    request=Request('https://api.github.com/repos/'+REPO+path,method=method,
        headers={'Authorization':'Bearer '+os.environ['GITHUB_TOKEN'],
                 'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'})
    with urlopen(request,timeout=30) as response:
        raw=response.read()
        return json.loads(raw) if raw else {}

def main():
    if os.getenv('GITHUB_REPOSITORY')!=REPO or os.getenv('GITHUB_REF')!='refs/heads/'+BRANCH:
        raise RuntimeError('DEVELOPMENT_ONLY')
    ready=False
    for attempt in range(3):
        runs=api('/actions/runs?branch='+BRANCH+'&per_page=50')['workflow_runs']
        if replacement_ready(runs,os.environ['GITHUB_SHA']):ready=True;break
        if attempt<2:time.sleep(10)
    if not ready:
        print('R4_HANDOVER_NO_CANCELLATION_REPLACEMENT_NOT_READY');return
    cancelled=0;skipped=0
    for rid in ALLOWED:
        run=api('/actions/runs/'+str(rid))
        if not obsolete_run(run):skipped+=1;continue
        if rid==41964478291:
            jobs=api('/actions/runs/'+str(rid)+'/jobs?per_page=100')['jobs']
            if not any(j.get('name')=='history (0)' and j.get('conclusion')=='success' for j in jobs):
                skipped+=1;continue
        try:api('/actions/runs/'+str(rid)+'/cancel','POST');cancelled+=1
        except HTTPError as error:
            if error.code not in (409,422):raise
            skipped+=1 # The allowlisted run may finish between read and cancellation.
    print('R4_BOUNDED_HANDOVER',json.dumps({'cancelled_obsolete_runs':cancelled,'unchanged_runs':skipped}))

if __name__=='__main__':main()
