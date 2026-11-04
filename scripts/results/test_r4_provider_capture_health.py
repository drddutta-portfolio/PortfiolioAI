import importlib.util,pathlib,unittest
spec=importlib.util.spec_from_file_location('health',pathlib.Path(__file__).with_name('r4-provider-capture-health.py'))
h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
class HealthTest(unittest.TestCase):
    def test_embedded_tool_errors_are_not_success(self):
        for value in ({'isError':True},{'error':'blocked'},{'success':False},'{"status":"error","message":"blocked"}'):
            self.assertEqual(h.classify(value),'PROVIDER_ERROR_ENVELOPE')
    def test_authentication_text_is_distinguished(self):
        self.assertEqual(h.classify('Authentication failed: invalid token'),'PROVIDER_AUTH_ERROR_TEXT')
    def test_empty_response_is_not_financial_coverage(self):
        self.assertEqual(h.classify('{"data":[]}'),'EMPTY_DATA_ENVELOPE')
        self.assertEqual(h.classify([]),'EMPTY_RESULT_LIST')
    def test_results_still_require_original_source_review(self):
        self.assertEqual(h.classify({'data':[{'value':123}]}),'STRUCTURED_RESPONSE_REQUIRES_SOURCE_REVIEW')
        self.assertEqual(h.classify('Revenue increased'),'TEXT_RESPONSE_REQUIRES_SOURCE_REVIEW')
if __name__=='__main__':unittest.main()
