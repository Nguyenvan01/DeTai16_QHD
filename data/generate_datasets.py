"""
SINH DỮ LIỆU GIẢ LẬP (seed cố định -> chạy lại luôn ra đúng dữ liệu cũ)
=====================================================================
1. dna_family.fasta     : 1 "tổ tiên" tiến hóa thành 6 "loài" (đột biến thay thế,
                          chèn, xóa) theo cây phát sinh  -> dùng tính độ tương đồng.
2. gene_variants.fasta  : 1 gen tham chiếu + 4 biến thể có SNP / chèn / xóa đã biết
                          -> dùng kiểm tra căn chỉnh phát hiện đúng vị trí đột biến.
3. genome_with_gene.fasta: hệ gen 3000 base có cài 1 bản sao (đã đột biến nhẹ)
                          của gen tham chiếu -> dùng Smith-Waterman tìm gen.
4. matrix_chains.csv    : các chuỗi kích thước ma trận (ví dụ sách, CLRS,
                          ngẫu nhiên, và chuỗi kiểu "mạng nơ-ron").
5. benchmark_pairs.csv  : cặp chuỗi DNA ngẫu nhiên nhiều độ dài cho thực nghiệm.
6. mutations_log.csv    : nhật ký các đột biến đã cài (đáp án để đối chiếu).
"""

import csv
import os
import random

HERE = os.path.dirname(os.path.abspath(__file__))
rng = random.Random(16)          # đề tài 16
BASES = "ACGT"


def random_dna(n):
    return "".join(rng.choice(BASES) for _ in range(n))


def mutate(seq, sub_rate, indel_rate, log=None, tag=""):
    """Đột biến từng vị trí: thay thế (SNP) với xác suất sub_rate,
    chèn / xóa với xác suất indel_rate (mỗi loại một nửa)."""
    out = []
    for i, b in enumerate(seq):
        r = rng.random()
        if r < indel_rate / 2:                                   # xóa base này
            if log is not None: log.append((tag, "xoa", i, b, "-"))
            continue
        if r < indel_rate:                                       # chèn 1 base trước nó
            ins = rng.choice(BASES)
            out.append(ins)
            if log is not None: log.append((tag, "chen", i, "-", ins))
        if rng.random() < sub_rate:                              # thay thế
            nb = rng.choice([x for x in BASES if x != b])
            out.append(nb)
            if log is not None: log.append((tag, "thay_the", i, b, nb))
        else:
            out.append(b)
    return "".join(out)


def write_fasta(path, records):
    with open(path, "w") as f:
        for name, seq in records:
            f.write(f">{name}\n")
            for i in range(0, len(seq), 60):
                f.write(seq[i:i + 60] + "\n")


def read_fasta(path):
    recs, name, buf = [], None, []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line.startswith(">"):
                if name: recs.append((name, "".join(buf)))
                name, buf = line[1:], []
            elif line:
                buf.append(line)
    if name: recs.append((name, "".join(buf)))
    return recs


def main():
    log = []

    # 1) Cây tiến hóa giả lập:   Tổ tiên
    #                          /         \
    #                     Nhánh_A       Nhánh_B
    #                    /   |   \      /     \
    #                  A1   A2   A3   B1      B2       (+ 1 loài ngoài nhóm)
    ancestor = random_dna(240)
    branch_a = mutate(ancestor, 0.10, 0.02)
    branch_b = mutate(ancestor, 0.10, 0.02)
    family = [
        ("Loai_A1", mutate(branch_a, 0.04, 0.01)),
        ("Loai_A2", mutate(branch_a, 0.04, 0.01)),
        ("Loai_A3", mutate(branch_a, 0.04, 0.01)),
        ("Loai_B1", mutate(branch_b, 0.04, 0.01)),
        ("Loai_B2", mutate(branch_b, 0.04, 0.01)),
        ("Ngoai_nhom", mutate(ancestor, 0.35, 0.05)),
    ]
    write_fasta(os.path.join(HERE, "dna_family.fasta"), family)

    # 2) Gen tham chiếu + biến thể có đột biến CÀI SẴN (biết đáp án)
    ref = random_dna(60)
    def snp(s, i):
        nb = "A" if s[i] != "A" else "G"
        log.append(("BienThe_SNP", "thay_the", i, s[i], nb))
        return s[:i] + nb + s[i + 1:]
    v_snp = snp(ref, 25)
    v_ins = ref[:30] + "GGG" + ref[30:]; log.append(("BienThe_Chen3", "chen", 30, "-", "GGG"))
    v_del = ref[:40] + ref[44:];        log.append(("BienThe_Xoa4", "xoa", 40, ref[40:44], "-"))
    v_mix = snp(snp(ref, 10), 50); v_mix = v_mix[:20] + v_mix[22:]
    log.append(("BienThe_HonHop", "xoa", 20, ref[20:22], "-"))
    log[-3] = ("BienThe_HonHop",) + log[-3][1:]
    log[-2] = ("BienThe_HonHop",) + log[-2][1:]
    write_fasta(os.path.join(HERE, "gene_variants.fasta"),
                [("Gen_ThamChieu", ref), ("BienThe_SNP", v_snp), ("BienThe_Chen3", v_ins),
                 ("BienThe_Xoa4", v_del), ("BienThe_HonHop", v_mix)])

    # 3) Hệ gen dài có chứa 1 bản sao đột biến nhẹ của gen tham chiếu
    pos = 1734
    copy = mutate(ref, 0.05, 0.0, log, "BanSao_TrongHeGen")
    genome = random_dna(pos) + copy + random_dna(3000 - pos - len(copy))
    write_fasta(os.path.join(HERE, "genome_with_gene.fasta"),
                [(f"HeGen_GiaLap vi_tri_gen_that={pos}", genome)])

    # 4) Chuỗi ma trận
    chains = [
        ("Sach_VD13.4", [2, 10, 50, 20]),
        ("CLRS_15.2", [30, 35, 15, 5, 10, 20, 25]),
        ("MangNoron_5lop", [1000, 4096, 1024, 4096, 64, 1]),   # X·W1·W2·W3·w
        ("DoHoa_BienDoi", [4, 4, 4, 4, 1, 4, 4]),
    ]
    for n in (5, 8, 10, 12, 15, 20, 30, 50):
        chains.append((f"NgauNhien_n{n}", [rng.randint(5, 100) for _ in range(n + 1)]))
    with open(os.path.join(HERE, "matrix_chains.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["ten", "so_ma_tran", "kich_thuoc_d"])
        for name, d in chains:
            w.writerow([name, len(d) - 1, " ".join(map(str, d))])

    # 5) Cặp chuỗi cho thực nghiệm
    with open(os.path.join(HERE, "benchmark_pairs.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["do_dai", "X", "Y"])
        for n in list(range(2, 21)) + [50, 100, 200, 500, 1000, 2000]:
            w.writerow([n, random_dna(n), random_dna(n)])

    # 6) Nhật ký đột biến
    with open(os.path.join(HERE, "mutations_log.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["chuoi", "loai", "vi_tri_tren_goc", "goc", "moi"])
        w.writerows(log)

    print("Đã sinh dữ liệu trong", HERE)
    for fn in sorted(os.listdir(HERE)):
        if not fn.endswith(".py"):
            print("  ", fn, os.path.getsize(os.path.join(HERE, fn)), "bytes")


if __name__ == "__main__":
    main()
