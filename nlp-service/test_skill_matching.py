"""Regression tests for SmartHire's deterministic skill recognition.

Run from this directory with: python -m unittest test_skill_matching.py
The FastEmbed model is stubbed so these tests do not download a model.
"""
import sys
import types
import unittest
from unittest.mock import patch

class _DummyEmbedding:
    def __init__(self, *args, **kwargs):
        pass

    def embed(self, texts):
        return []

sys.modules["fastembed"] = types.SimpleNamespace(TextEmbedding=_DummyEmbedding)

import app as app_module
from app import canonical_skill, skill_is_present, extract_required_skills


class SkillAliasTests(unittest.TestCase):
    def test_javascript_variants_share_canonical_name(self):
        for value in ("JS", "JavaScript", "ECMAScript", "ES6", "ES2015"):
            with self.subTest(value=value):
                self.assertEqual(canonical_skill(value), "javascript")

    def test_node_and_react_variants_are_recognized(self):
        self.assertTrue(skill_is_present("Built APIs with NodeJS", "node.js"))
        self.assertTrue(skill_is_present("Created a React.js interface", "react"))

    def test_machine_learning_alias_is_recognized(self):
        self.assertTrue(
            skill_is_present("Project included NLP and machine-learning", "machine learning")
        )

    def test_new_python_ml_tools_are_recognized(self):
        self.assertTrue(skill_is_present("Used sklearn for model evaluation", "scikit-learn"))
        self.assertTrue(skill_is_present("Built a service with Fast API", "fastapi"))
        self.assertTrue(skill_is_present("Model trained with PyTorch", "pytorch"))

    def test_rest_api_wording_is_recognized(self):
        self.assertTrue(
            skill_is_present("Implemented RESTful endpoints", "rest api")
        )

    def test_office_and_admin_aliases_are_recognized(self):
        self.assertTrue(skill_is_present("Reports created in MS Word", "microsoft word"))
        self.assertTrue(skill_is_present("Prepared data in Google Sheets", "google sheets"))
        self.assertTrue(skill_is_present("Created slides in PowerPoint", "microsoft powerpoint"))
        self.assertTrue(skill_is_present("Managed calendar management tasks", "calendar management"))
        self.assertTrue(skill_is_present("Provided virtual assistant support", "virtual assistance"))
        self.assertTrue(skill_is_present("Handled social media management", "social media management"))
        self.assertTrue(skill_is_present("Produced short-form content", "content creation"))

    def test_word_boundaries_avoid_javascript_false_positive(self):
        self.assertFalse(skill_is_present("Experience with Java only", "javascript"))

    def test_required_skills_are_deduplicated_by_canonical_name(self):
        result = extract_required_skills(
            "Required Skills: JavaScript, JS, React.js, NodeJS\n"
            "Responsibilities: Build and maintain the product"
        )
        canonical = [canonical_skill(skill) for skill in result]
        self.assertEqual(canonical.count("javascript"), 1)
        self.assertEqual(canonical.count("react"), 1)
        self.assertEqual(canonical.count("node.js"), 1)



    def test_skill_score_reports_partial_coverage(self):
        score = app_module.calculate_skill_score(
            "Experienced JS developer using React",
            ["JavaScript", "React.js", "Node.js"],
        )
        self.assertAlmostEqual(score, 2 / 3)

    def test_match_endpoint_returns_explanations_and_weighted_score(self):
        resume_text = (
            "Experienced JS developer using React.js to build interfaces "
            "and collaborate on software projects."
        )
        job_text = (
            "Required Skills: JavaScript, React.js, NodeJS\n"
            "Responsibilities: Build and maintain web features for customers."
        )

        with app_module.app.test_client() as client:
            with patch.object(
                app_module, "calculate_semantic_score", return_value=0.5
            ), patch.object(
                app_module, "calculate_tfidf_score", return_value=0.25
            ):
                response = client.post(
                    "/match",
                    json={"resumeText": resume_text, "jobText": job_text},
                )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["matchedSkills"], ["JavaScript", "React.js"])
        self.assertEqual(payload["missingSkills"], ["NodeJS"])
        self.assertAlmostEqual(payload["skillScore"], 0.6667, places=4)
        self.assertAlmostEqual(payload["finalScore"], 0.5167, places=4)

if __name__ == "__main__":
    unittest.main()
