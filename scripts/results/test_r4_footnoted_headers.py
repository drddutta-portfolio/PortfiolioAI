"""Quarter dates retain printed digits while cumulative dates remain ineligible."""
import unittest
from r4_pdf_geometry import dated_headers

def words(y,values):
    return [(x,y-2,x+width,y+2,text) for x,width,text in values]

def header(corrupt=False):
    rows=[(5,words(5,[(510,55,'June 23,')])),
          (10,words(10,[(10,55,'December 31,'),(110,65,'September 30,'),(210,55,'December 31,'),(310,55,'December 31,'),(410,55,'December 31,'),(510,55,'March 31,')])),
          (20,words(20,[(10,55,'2025'),(110,65,'2025'),(210,55,'2024*' if not corrupt else '202x*'),(310,55,'2025'),(410,55,'2024*'),(510,55,'2025*')]))]
    return rows

class FootnotedHeadersTest(unittest.TestCase):
    def test_literal_footnoted_year_is_available_only_in_new_replay(self):
        old=list(dated_headers(header(),True,True))
        self.assertFalse(any(len(d)>2 and d[2][0]=='2024-12-31' for _,_,d in old))
        new=list(dated_headers(header(),True,True,True))
        self.assertTrue(any([x[0] for x in dates[:3]]==['2025-12-31','2025-09-30','2024-12-31'] for _,_,dates in new))

    def test_corrupt_year_never_becomes_requested_quarter(self):
        new=list(dated_headers(header(True),True,True,True))
        self.assertFalse(any(len(d)>2 and d[2][0]=='2024-12-31' for _,_,d in new))

    def test_ambiguous_selected_date_remains_rejected(self):
        rows=header()
        rows.append((25,words(25,[(210,55,'2023')])))
        new=list(dated_headers(sorted(rows),True,True,True))
        self.assertFalse(any(len(d)>2 and d[2][0]=='2024-12-31' for _,_,d in new))

if __name__=='__main__':unittest.main()
