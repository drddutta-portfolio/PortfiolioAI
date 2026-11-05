import importlib.util,pathlib,unittest
spec=importlib.util.spec_from_file_location('handover',pathlib.Path(__file__).with_name('r4-superseded-recovery-handover.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class HandoverTest(unittest.TestCase):
    def sample(self):
        rid=41970171948;sha,path=m.ALLOWED[rid]
        return {'id':rid,'head_branch':m.BRANCH,'head_repository':{'full_name':m.REPO},
                'head_sha':sha,'path':path,'status':'in_progress'}
    def test_only_exact_obsolete_run_is_eligible(self):
        row=self.sample();self.assertTrue(m.obsolete_run(row))
        for field,value in (('id',41961166369),('head_sha','different'),('path','another.yml'),
                            ('head_branch','main'),('status','completed')):
            with self.subTest(field=field):self.assertFalse(m.obsolete_run({**row,field:value}))
    def test_current_monitor_and_foreign_repository_are_never_cancelled(self):
        row=self.sample()
        self.assertFalse(m.obsolete_run({**row,'id':41961166369}))
        self.assertFalse(m.obsolete_run({**row,'head_repository':{'full_name':'someone/else'}}))
    def test_replacement_must_be_active_exact_head_and_official_workflow(self):
        row={**self.sample(),'head_sha':'current'}
        self.assertTrue(m.replacement_ready([row],'current'))
        self.assertFalse(m.replacement_ready([row],'other'))
        self.assertFalse(m.replacement_ready([{**row,'status':'completed'}],'current'))
        self.assertFalse(m.replacement_ready([{**row,'path':'another.yml'}],'current'))
if __name__=='__main__':unittest.main()
