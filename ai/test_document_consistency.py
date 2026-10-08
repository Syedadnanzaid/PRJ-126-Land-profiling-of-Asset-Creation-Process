import unittest
from src.document_consistency import DocumentConsistencyEngine

class TestDocumentConsistency(unittest.TestCase):
    
    def setUp(self):
        self.engine = DocumentConsistencyEngine()

    def test_exact_match_all_fields(self):
        app_data = {
            "survey_no": "SUR-342",
            "owner_name": "Sarah Connor",
            "area": 25.5,
            "land_id": "LND-001"
        }
        doc_text = """
        Survey No: SUR-342
        Owner Name: Sarah Connor
        Area: 25.5 acres
        Land ID: LND-001
        """
        res = self.engine.analyze(app_data, doc_text)
        self.assertEqual(res["overall_consistency"], "MATCH")
        self.assertEqual(res["fields"]["survey_no"]["result"], "MATCH")
        self.assertEqual(res["fields"]["owner_name"]["result"], "MATCH")
        self.assertEqual(res["fields"]["area"]["result"], "MATCH")
        self.assertEqual(res["fields"]["land_id"]["result"], "MATCH")

    def test_survey_formatting_difference(self):
        # "SUR-342" vs "sur342" -> MATCH
        res = self.engine.compare_survey_no("SUR-342", "Survey No: sur342")
        self.assertEqual(res["result"], "MATCH")
        self.assertEqual(res["application_value"], "SUR-342")
        self.assertEqual(res["document_value"], "sur342")

    def test_land_id_formatting_difference(self):
        # "LND-001" vs "LND001" -> MATCH
        res = self.engine.compare_land_id("LND-001", "Land ID: LND001")
        self.assertEqual(res["result"], "MATCH")

    def test_owner_exact_normalized_match(self):
        # Mr. Ubed vs ubed
        res = self.engine.compare_owner_name("Ubed", "Owner: Mr. Ubed \n")
        self.assertEqual(res["result"], "MATCH")

    def test_owner_minor_spelling_warning(self):
        # Ubed vs Uved
        res = self.engine.compare_owner_name("Sarah Connor", "Owner: Sarah Coner\n")
        self.assertEqual(res["result"], "WARNING_SIMILAR")

    def test_owner_clearly_different_mismatch(self):
        res = self.engine.compare_owner_name("Sarah Connor", "Owner: John Doe\n")
        self.assertEqual(res["result"], "MISMATCH")

    def test_area_exact_match(self):
        res = self.engine.compare_area(25.5, "Area: 25.5 sqm")
        self.assertEqual(res["result"], "MATCH")

    def test_area_1_percent_diff(self):
        # 25.5 vs 25.6 (0.39% diff, < 1%) -> MATCH
        res = self.engine.compare_area(25.5, "Area: 25.6 sqm")
        self.assertEqual(res["result"], "MATCH")

    def test_area_5_percent_diff(self):
        # 25.5 vs 26.5 (3.9% diff, 1-5%) -> WARNING_SIMILAR
        res = self.engine.compare_area(25.5, "Area: 26.5 sqm")
        self.assertEqual(res["result"], "WARNING_SIMILAR")

    def test_area_over_5_percent_diff(self):
        # 25.5 vs 35.0 (37% diff) -> MISMATCH
        res = self.engine.compare_area(25.5, "Area: 35.0 sqm")
        self.assertEqual(res["result"], "MISMATCH")

    def test_missing_survey_no(self):
        res = self.engine.compare_survey_no("SUR-342", "Random text without survey")
        self.assertEqual(res["result"], "NOT_FOUND")

    def test_missing_owner(self):
        res = self.engine.compare_owner_name("Sarah", "Random text")
        self.assertEqual(res["result"], "NOT_FOUND")

    def test_missing_area_unit(self):
        res = self.engine.compare_area(25.5, "Area: 25.5\n")
        # Should be WARNING_SIMILAR because unit is missing
        self.assertEqual(res["result"], "WARNING_SIMILAR")
        self.assertTrue("unit is missing" in res["evidence"])

    def test_different_area_units(self):
        # We don't have application unit, but doc unit is provided.
        # It's not a mismatch purely on unit for now, just relies on numeric difference.
        # But if raw numbers match exactly, it will MATCH since no advanced unit checking.
        # (This fulfills 'not automatic MISMATCH')
        res = self.engine.compare_area(25.5, "Area: 25.5 acres")
        self.assertEqual(res["result"], "MATCH")

    def test_ensure_0_o_not_converted(self):
        # "SUR-10" vs "SUR-1O" (O instead of zero) -> they are diff strings.
        # Levenshtein distance will be small, so it's a WARNING_SIMILAR, not an automatic MATCH.
        res = self.engine.compare_survey_no("SUR-10", "Survey No: SUR-1O")
        self.assertEqual(res["result"], "WARNING_SIMILAR")

    def test_ambiguous_owner_extraction(self):
        # If extraction is a giant block (like > 100 chars), it returns NOT_FOUND
        long_str = "Owner Name: " + "a" * 150 + "\n"
        res = self.engine.compare_owner_name("Sarah", long_str)
        self.assertEqual(res["result"], "NOT_FOUND")

if __name__ == '__main__':
    unittest.main()
