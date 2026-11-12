"""Kiểm thử tính đúng: so DP với vét cạn trên hàng trăm bộ dữ liệu ngẫu nhiên.
Chạy:  python -m unittest discover -s tests -v   (từ thư mục gốc dự án)"""

import os
import random
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from matrix_chain import (matrix_chain, matrix_chain_memo, matrix_chain_brute,
                          parenthesize, split_tree, cost_of_order,
                          all_parenthesizations, catalan)
from sequence_alignment import (lcs_table, lcs_solution, lcs_brute, is_subsequence,
                                nw_align, nw_brute, alignment_score, sw_align, delannoy)
from extensions import gotoh_align, affine_score, all_alignments
from memory_efficient import (lcs_length_two_rows, nw_score_linear, hirschberg,
                              banded_nw_score)

rng = random.Random(2026)


def rand_dna(k):
    return "".join(rng.choice("ACGT") for _ in range(k))


class TestMatrixChain(unittest.TestCase):
    def test_book_example_13_4(self):
        N, S = matrix_chain([2, 10, 50, 20])
        self.assertEqual(N[0][2], 3000)                 # (B·C)·D = 3000
        self.assertEqual(parenthesize(S, 0, 2), "((A0 x A1) x A2)")

    def test_clrs_classic(self):                        # ví dụ kinh điển CLRS 15.2
        d = [30, 35, 15, 5, 10, 20, 25]
        N, S = matrix_chain(d)
        self.assertEqual(N[0][5], 15125)
        self.assertEqual(parenthesize(S, 0, 5), "((A0 x (A1 x A2)) x ((A3 x A4) x A5))")

    def test_dp_equals_brute_and_memo(self):
        for _ in range(200):
            n = rng.randint(1, 8)
            d = [rng.randint(1, 60) for _ in range(n + 1)]
            N, S = matrix_chain(d)
            self.assertEqual(N[0][n - 1], matrix_chain_brute(d)[0])
            self.assertEqual(N[0][n - 1], matrix_chain_memo(d))
            # cây truy vết thực sự có chi phí bằng N[0][n-1]
            self.assertEqual(cost_of_order(d, split_tree(S, 0, n - 1))[0], N[0][n - 1])

    def test_catalan_counts(self):
        for n in range(1, 8):
            self.assertEqual(len(all_parenthesizations(0, n - 1)), catalan(n - 1))


class TestLCS(unittest.TestCase):
    def test_book_figure_13_8(self):
        X, Y = "GTTCCTAATA", "CGATAATTGAGA"
        L = lcs_table(X, Y)
        self.assertEqual(L[10][12], 6)
        s = lcs_solution(X, Y, L)
        self.assertEqual(len(s), 6)
        self.assertTrue(is_subsequence(s, X) and is_subsequence(s, Y))

    def test_dp_equals_brute(self):
        for _ in range(300):
            X, Y = rand_dna(rng.randint(0, 10)), rand_dna(rng.randint(0, 10))
            L = lcs_table(X, Y)
            s = lcs_solution(X, Y, L)
            self.assertEqual(len(s), L[-1][-1])
            self.assertEqual(len(s), len(lcs_brute(X, Y)[0]))
            self.assertTrue(is_subsequence(s, X) and is_subsequence(s, Y))
            self.assertEqual(lcs_length_two_rows(X, Y), L[-1][-1])


class TestAlignment(unittest.TestCase):
    def test_nw_vs_brute(self):
        for _ in range(150):
            X, Y = rand_dna(rng.randint(0, 6)), rand_dna(rng.randint(0, 6))
            r = nw_align(X, Y)
            self.assertEqual(r["score"], nw_brute(X, Y)[0])
            # vết ngược cho ra căn chỉnh hợp lệ, có đúng điểm số
            self.assertEqual(r["aligned_x"].replace("-", ""), X)
            self.assertEqual(r["aligned_y"].replace("-", ""), Y)
            self.assertEqual(alignment_score(r["aligned_x"], r["aligned_y"]), r["score"])

    def test_lcs_is_special_case(self):
        """match=1, mismatch=0, gap=0  ==> điểm NW = độ dài LCS."""
        for _ in range(100):
            X, Y = rand_dna(rng.randint(0, 12)), rand_dna(rng.randint(0, 12))
            self.assertEqual(nw_align(X, Y, 1, 0, 0)["score"], lcs_table(X, Y)[-1][-1])

    def test_hirschberg_and_linear(self):
        for _ in range(150):
            X, Y = rand_dna(rng.randint(0, 40)), rand_dna(rng.randint(0, 40))
            best = nw_align(X, Y)["score"]
            ax, ay = hirschberg(X, Y)
            self.assertEqual(ax.replace("-", ""), X)
            self.assertEqual(ay.replace("-", ""), Y)
            self.assertEqual(alignment_score(ax, ay), best)
            self.assertEqual(nw_score_linear(X, Y), best)
            self.assertLessEqual(banded_nw_score(X, Y, 3), best)        # cận dưới
            self.assertEqual(banded_nw_score(X, Y, max(len(X), len(Y))), best)

    def test_smith_waterman_finds_motif(self):
        motif = "ACGTTGCAAGGT"
        genome = rand_dna(80) + motif + rand_dna(80)
        r = sw_align(genome, motif)
        self.assertEqual(r["x_range"], (80, 92))
        self.assertEqual(r["score"], 2 * len(motif))

    def test_gotoh_affine_vs_brute(self):
        for _ in range(200):
            X, Y = rand_dna(rng.randint(0, 5)), rand_dna(rng.randint(0, 5))
            r = gotoh_align(X, Y)
            best = max(affine_score(a, b) for a, b in all_alignments(X, Y))
            self.assertEqual(r["score"], best)
            self.assertEqual(affine_score(r["aligned_x"], r["aligned_y"]), best)

    def test_delannoy(self):
        self.assertEqual(delannoy(3, 3), 63)
        self.assertEqual(delannoy(10, 10), 8097453)


if __name__ == "__main__":
    unittest.main(verbosity=2)
