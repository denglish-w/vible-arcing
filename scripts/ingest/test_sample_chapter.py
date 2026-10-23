"""Regression checks for ordering, identity, punctuation and the field whitelist."""

import importlib.util
from pathlib import Path
import unittest

SPEC = importlib.util.spec_from_file_location("sample_chapter", Path(__file__).with_name("sample_chapter.py"))
sample = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(sample)


class SampleChapterTests(unittest.TestCase):
    def test_restores_canonical_order_without_replacing_ids(self):
        xml = b'''<book id="PHP"><w ref="PHP 1:2!1" xml:id="second" after="." lemma="b" gloss="b" class="verb" mood="participle" tense="present" ln="unsafe" domain="unsafe" role="s">B</w><w ref="PHP 1:1!1" xml:id="first" after=", " lemma="a" gloss="a" class="noun" case="nominative">A</w><w ref="PHP 2:1!1" xml:id="other" after=" " lemma="c" gloss="c" class="noun">C</w></book>'''
        words = sample.extract_chapter(xml, "PHP", 1)["words"]
        self.assertEqual([word["id"] for word in words], ["first", "second"])
        self.assertEqual("".join(word["text"] + word["after"] for word in words), "A, B.")
        self.assertEqual(words[1]["m"], {"tense": "present", "mood": "participle"})
        self.assertEqual(set(words[1]), {"id", "v", "text", "after", "lemma", "gloss", "pos", "m"})

    def test_rejects_missing_or_duplicate_identity_and_positions(self):
        word = '<w ref="PHP 1:1!1" xml:id="first" after=" " lemma="a" gloss="a" class="noun">A</w>'
        for content in (word.replace('xml:id="first"', ''), word + word, word + word.replace('xml:id="first"', 'xml:id="second"')):
            with self.subTest(content=content), self.assertRaises(ValueError):
                sample.extract_chapter(f'<book id="PHP">{content}</book>'.encode(), "PHP", 1)

    def test_rejects_entity_declarations_and_missing_chapters(self):
        for xml in (b'<!DOCTYPE book [<!ENTITY x "expanded">]><book id="PHP"/>', b'<book id="PHP"/>'):
            with self.subTest(xml=xml), self.assertRaises(ValueError):
                sample.extract_chapter(xml, "PHP", 1)

    def test_missing_gloss_is_not_replaced_with_separately_licensed_english(self):
        xml = b'<book id="PHP"><w ref="PHP 1:1!1" xml:id="first" after=" " lemma="a" english="other gloss" class="noun">A</w></book>'
        self.assertEqual(sample.extract_chapter(xml, "PHP", 1)["words"][0]["gloss"], "")

    def test_attribution_covers_text_morphology_and_incorporated_glosses(self):
        notices = sample.attribution()
        self.assertEqual([notice["name"] for notice in notices], ["SBL Greek New Testament", "MACULA Greek Linguistic Datasets", "Berean Interlinear Bible"])
        self.assertTrue(all(notice["modified"] for notice in notices))
        self.assertTrue(all(notice["license"] == "CC BY 4.0" for notice in notices[:2]))


if __name__ == "__main__":
    unittest.main()
