import unittest
from chatterbox import chunks


class ChunkTests(unittest.TestCase):
    def test_preserves_all_words_in_order(self):
        text = ("Nobel Prize Outreach ve TED-Ed yeni bir seri başlattı.\n"
                "İlk bölüm, beynin yön ve konum belirleme sistemini açıklıyor! " * 30)
        result = list(chunks(text))
        self.assertEqual(" ".join(result).split(), text.split())
        self.assertTrue(all(len(part) <= 280 for part in result))

    def test_splits_sentence_without_punctuation(self):
        text = "Teknoloji " * 200
        result = list(chunks(text))
        self.assertGreater(len(result), 1)
        self.assertEqual(" ".join(result).split(), text.split())
        self.assertTrue(all(len(part) <= 280 for part in result))

    def test_empty_input_produces_no_chunks(self):
        self.assertEqual(list(chunks(" \n ")), [])


if __name__ == "__main__":
    unittest.main()
