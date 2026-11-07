import ast,unittest
from pathlib import Path
class RollingSourceExportTests(unittest.TestCase):
 def test_visible_september_quarter_and_both_comparison_baselines_are_exported(self):
  tree=ast.parse(Path(__file__).with_name('r5-g-live-input.py').read_text())
  periods=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='PERIODS' for t in n.targets))
  self.assertIn('2026-09-30',periods)
  self.assertIn('2026-06-30',periods)
  self.assertIn('2025-09-30',periods)
  self.assertEqual(len(periods),len(set(periods)))
if __name__=='__main__':unittest.main()
