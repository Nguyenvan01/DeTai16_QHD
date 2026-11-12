"""
DEMO TRÌNH BÀY - Đề tài 16: Quy hoạch động nâng cao
Chạy:  python demo.py          (chạy hết 6 phần)
       python demo.py 3        (chỉ chạy phần 3)

Mỗi phần in ra từng bước để người nghe THẤY bảng QHĐ được điền và vết ngược đi thế nào.
"""

import os
import sys
import time

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ROOT, "src"))
sys.path.insert(0, os.path.join(ROOT, "data"))

from matrix_chain import (matrix_chain, parenthesize, matrix_chain_brute, all_parenthesizations,
                          split_tree, left_to_right_tree, cost_of_order, catalan)
from sequence_alignment import (lcs_table, lcs_solution, lcs_brute, nw_align, match_line,
                                sw_align, identity)
from memory_efficient import hirschberg, nw_score_linear
from extensions import gotoh_align
from generate_datasets import read_fasta


def title(t):
    print("\n" + "=" * 78 + f"\n  {t}\n" + "=" * 78)


def print_table(T, row_lbl, col_lbl, mark=frozenset(), width=6):
    print(" " * 4 + "".join(f"{c:>{width}}" for c in col_lbl))
    for i, row in enumerate(T):
        cells = []
        for j, v in enumerate(row):
            s = "" if v is None else str(v)
            cells.append(f"{('*' + s) if (i, j) in mark else s:>{width}}")
        print(f"{row_lbl[i]:>4}" + "".join(cells))


def part1():
    title("PHẦN 1. Nhân chuỗi ma trận - Ví dụ 13.4 trong sách")
    d = [2, 10, 50, 20]
    print("B: 2x10, C: 10x50, D: 50x20  ->  d =", d)
    for p in all_parenthesizations(0, 2):
        tree = (0, (1, 2)) if p.startswith("(A0 x (") else ((0, 1), 2)
        print(f"   {p:<22} -> {cost_of_order(d, tree)[0]:>6} phép nhân")
    N, S = matrix_chain(d)
    print("QHĐ chọn:", parenthesize(S, 0, 2), "=", N[0][2])


def part2():
    title("PHẦN 2. Nhân chuỗi ma trận - bảng N, bảng S và VẾT NGƯỢC (d của CLRS)")
    d = [30, 35, 15, 5, 10, 20, 25]
    n = len(d) - 1
    N, S = matrix_chain(d)
    lbl = [f"i={i}" for i in range(n)]
    print("Bảng N[i][j] (số phép nhân tối thiểu của Ai..Aj):")
    print_table([[N[i][j] if j >= i else None for j in range(n)] for i in range(n)], lbl,
                [f"j={j}" for j in range(n)], width=8)
    print("\nBảng S[i][j] (vị trí k của phép nhân cuối cùng):")
    print_table([[S[i][j] if j > i else None for j in range(n)] for i in range(n)], lbl,
                [f"j={j}" for j in range(n)], width=6)

    print("\nTruy vết ngược từ S[0][5]:")
    def trace(i, j, depth=0):
        if i == j:
            return
        k = S[i][j]
        print("   " * depth + f"A{i}..A{j}: S={k}  ->  (A{i}..A{k}) x (A{k+1}..A{j})")
        trace(i, k, depth + 1); trace(k + 1, j, depth + 1)
    trace(0, n - 1)
    print("Kết quả:", parenthesize(S, 0, n - 1), "=", N[0][n - 1], "phép nhân")
    print("So với nhân trái->phải:", cost_of_order(d, left_to_right_tree(n))[0], "phép nhân")
    cost_b, paren_b, calls = matrix_chain_brute(d)
    print(f"Vét cạn: {cost_b} (đúng bằng QHĐ) sau {calls} lời gọi đệ quy; "
          f"có tất cả {catalan(n - 1)} cách đặt ngoặc")


def part3():
    title("PHẦN 3. LCS - ví dụ Hình 13.8 trong sách")
    X, Y = "GTTCCTAATA", "CGATAATTGAGA"
    L = lcs_table(X, Y)
    s, path = lcs_solution(X, Y, L, return_path=True)
    print("Dấu * = ô nằm trên đường vết ngược")
    print_table(L, ["ε"] + list(X), ["ε"] + list(Y), mark=set(path), width=4)
    print(f"\nLCS = {s}  (độ dài L[{len(X)}][{len(Y)}] = {L[-1][-1]})")
    print("Vét cạn 2^n dãy con cho cùng độ dài:", len(lcs_brute(X, Y)[0]))


def part4():
    title("PHẦN 4. Needleman-Wunsch: căn chỉnh + phát hiện đột biến trên gen giả lập")
    X, Y = "ACGGTAG", "ACTGTCAG"
    r = nw_align(X, Y)
    print("Bảng F (khớp +1, thay thế -1, khoảng trống -2), * = vết ngược:")
    print_table(r["F"], ["-"] + list(X), ["-"] + list(Y), mark=set(r["path"]), width=5)
    print("\n  " + r["aligned_x"] + "\n  " + match_line(r["aligned_x"], r["aligned_y"]) +
          "\n  " + r["aligned_y"] + f"\n  điểm = {r['score']}")

    recs = read_fasta(os.path.join(ROOT, "data", "gene_variants.fasta"))
    ref = recs[0][1]
    print("\nGen tham chiếu vs các biến thể (phạt affine):")
    for name, seq in recs[1:]:
        g = gotoh_align(ref, seq)
        events, pos = [], -1                  # gom các cột khác nhau LIÊN TIẾP cùng loại thành 1 sự kiện
        for a, b in zip(g["aligned_x"], g["aligned_y"]):
            if a != "-":
                pos += 1
            if a == b:
                continue
            kind = "chèn" if a == "-" else ("xóa" if b == "-" else "thay thế")
            where = pos + 1 if a == "-" else pos
            last = events[-1] if events else None
            liền_xóa = kind == "xóa" and last and last[0] == "xóa" and where == last[1] + last[2]
            liền_chèn = kind == "chèn" and last and last[0] == "chèn" and where == last[1]
            if liền_xóa or liền_chèn:
                last[2] += 1
            else:
                events.append([kind, where, 1])
        txt = [f"{k} {c} base tại vị trí {w}" if c > 1 else f"{k} tại vị trí {w}" for k, w, c in events]
        print(f"  {name:<16} -> {'; '.join(txt)}")
    print("  (đối chiếu đáp án trong data/mutations_log.csv)")


def part5():
    title("PHẦN 5. Ứng dụng: so sánh 6 'loài' & tìm gen trong hệ gen (Smith-Waterman)")
    recs = read_fasta(os.path.join(ROOT, "data", "dna_family.fasta"))
    names = [n for n, _ in recs]
    short = [n.replace("Loai_", "").replace("Ngoai_nhom", "Ngoài") for n in names]
    print(" " * 12 + "".join(f"{n:>9}" for n in short))
    for a in range(len(recs)):
        row = []
        for b in range(len(recs)):
            r = nw_align(recs[a][1], recs[b][1])
            row.append(f"{identity(r['aligned_x'], r['aligned_y']) * 100:8.0f}%")
        print(f"{names[a]:>12}" + "".join(row))
    genome = read_fasta(os.path.join(ROOT, "data", "genome_with_gene.fasta"))[0][1]
    gene = read_fasta(os.path.join(ROOT, "data", "gene_variants.fasta"))[0][1]
    t = time.perf_counter()
    r = sw_align(genome, gene)
    print(f"\nSmith-Waterman: gen nằm ở vị trí {r['x_range']} trên hệ gen {len(genome)} base "
          f"(điểm {r['score']}, {time.perf_counter() - t:.2f}s). Gen thật được cài tại 1734.")


def part6():
    title("PHẦN 6. Tối ưu bộ nhớ: Hirschberg")
    import random
    rng = random.Random(1)
    X = "".join(rng.choice("ACGT") for _ in range(1500))
    Y = "".join(rng.choice("ACGT") for _ in range(1500))
    print(f"2 chuỗi dài 1500: bảng đầy đủ cần {(len(X) + 1) * (len(Y) + 1):,} ô;"
          f" Hirschberg chỉ giữ cỡ {2 * (len(Y) + 1):,} ô")
    t = time.perf_counter(); ax, ay = hirschberg(X, Y); t1 = time.perf_counter() - t
    full = nw_align(X, Y)["score"]
    from sequence_alignment import alignment_score
    print(f"Điểm Hirschberg = {alignment_score(ax, ay)}, điểm bảng đầy đủ = {full}, "
          f"điểm 2 hàng = {nw_score_linear(X, Y)}  (Hirschberg chạy {t1:.2f}s)")


PARTS = [part1, part2, part3, part4, part5, part6]

if __name__ == "__main__":
    chosen = [int(a) for a in sys.argv[1:]] or range(1, 7)
    for c in chosen:
        PARTS[c - 1]()
