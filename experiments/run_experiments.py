"""
THỰC NGHIỆM: Quy hoạch động (QHĐ) vs Vét cạn + Tối ưu bộ nhớ
=============================================================
Chạy:  python experiments/run_experiments.py      (từ thư mục gốc dự án)
Kết quả: results/*.csv  và  figures/exp_*.png
Mỗi thí nghiệm đều KIỂM TRA KẾT QUẢ QHĐ == KẾT QUẢ VÉT CẠN trước khi ghi số liệu.
"""

import csv
import os
import platform
import random
import sys
import time
import tracemalloc

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "src"))
sys.setrecursionlimit(10000)

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker
import numpy as np

from matrix_chain import (matrix_chain, matrix_chain_brute, catalan, split_tree,
                          left_to_right_tree, cost_of_order, multiply_by_tree)
from sequence_alignment import lcs_table, lcs_solution, lcs_brute, nw_align, nw_brute, delannoy
from memory_efficient import hirschberg, nw_score_linear

RES = os.path.join(ROOT, "results")
FIG = os.path.join(ROOT, "figures")
os.makedirs(RES, exist_ok=True)
os.makedirs(FIG, exist_ok=True)

BLUE, ORANGE, AQUA = "#2a78d6", "#eb6834", "#1baf7a"
INK, MUTED, GRID = "#0b0b0b", "#52514e", "#e4e3df"
plt.rcParams.update({
    "font.family": "DejaVu Sans", "font.size": 12, "axes.edgecolor": MUTED,
    "axes.labelcolor": INK, "xtick.color": MUTED, "ytick.color": MUTED,
    "axes.spines.top": False, "axes.spines.right": False,
    "axes.grid": True, "grid.color": GRID, "grid.linewidth": 0.8,
    "figure.dpi": 150, "savefig.bbox": "tight", "legend.frameon": False,
})
rng = random.Random(16)


def timeit(fn, *args, repeat=3):
    """Thời gian chạy nhỏ nhất trong `repeat` lần (giảm nhiễu), đơn vị giây."""
    best, out = float("inf"), None
    for _ in range(repeat):
        t = time.perf_counter()
        out = fn(*args)
        best = min(best, time.perf_counter() - t)
    return best, out


def save_csv(name, header, rows):
    with open(os.path.join(RES, name), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)


def plot_vs(name, title, xs, t_brute, t_dp, xlabel, extra_note=None):
    fig, ax = plt.subplots(figsize=(8, 4.6))
    ax.plot(xs[:len(t_brute)], t_brute, "-o", color=ORANGE, lw=2, ms=6, label="Vét cạn")
    ax.plot(xs, t_dp, "-o", color=BLUE, lw=2, ms=6, label="Quy hoạch động")
    ax.set_yscale("log")
    ax.xaxis.set_major_locator(matplotlib.ticker.MaxNLocator(integer=True))
    ax.set_xlabel(xlabel)
    ax.set_ylabel("Thời gian chạy (giây, thang log)")
    ax.set_title(title, loc="left", fontsize=14, color=INK)
    # nhãn trực tiếp ở điểm cuối
    ax.annotate(f"{t_brute[-1]:.3g} s", (xs[len(t_brute) - 1], t_brute[-1]),
                xytext=(6, 0), textcoords="offset points", color=INK, va="center")
    ax.annotate(f"{t_dp[len(t_brute) - 1]:.3g} s", (xs[len(t_brute) - 1], t_dp[len(t_brute) - 1]),
                xytext=(6, -10), textcoords="offset points", color=INK, va="center")
    if extra_note:
        ax.text(0.02, 0.95, extra_note, transform=ax.transAxes, color=MUTED, va="top", fontsize=10)
    ax.legend(loc="center left")
    fig.savefig(os.path.join(FIG, name))
    plt.close(fig)


# ---------------------------------------------------------------------------
def exp1_matrix_chain():
    print("\n[E1] Nhân chuỗi ma trận: vét cạn vs QHĐ")
    rows, ns, tb, td = [], [], [], []
    for n in range(2, 19):
        d = [rng.randint(5, 100) for _ in range(n + 1)]
        t_dp, (N, S) = timeit(matrix_chain, d)
        dp_ops = sum(j - i for i in range(n) for j in range(i + 1, n))   # số lần thử k
        ns.append(n); td.append(t_dp)
        row = [n, catalan(n - 1), dp_ops, f"{t_dp:.6f}", N[0][n - 1]]
        if n <= 15:
            t_b, (cost_b, _, calls) = timeit(matrix_chain_brute, d, repeat=1 if n > 11 else 3)
            assert cost_b == N[0][n - 1], "QHĐ khác vét cạn!"
            tb.append(t_b)
            row += [calls, f"{t_b:.6f}", f"{t_b / t_dp:.0f}"]
        else:
            row += ["", "", ""]
        rows.append(row)
        print("  ", row)
    save_csv("e1_matrix_chain.csv",
             ["n", "so_cach_dat_ngoac_Catalan", "QHD_so_lan_thu_k", "QHD_giay", "chi_phi_toi_uu",
              "VetCan_so_loi_goi", "VetCan_giay", "lan_nhanh_hon"], rows)
    plot_vs("exp_matrix_chain.png", "Nhân chuỗi ma trận: vét cạn (≈3ⁿ) vs QHĐ (n³)",
            ns, tb, td, "Số ma trận n", "Kết quả 2 cách luôn trùng nhau (đã assert)")
    return rows


def exp2_lcs():
    print("\n[E2] LCS: vét cạn 2^n vs QHĐ n·m")
    rows, ns, tb, td = [], [], [], []
    for n in range(2, 21):
        X = "".join(rng.choice("ACGT") for _ in range(n))
        Y = "".join(rng.choice("ACGT") for _ in range(n))
        t_dp, L = timeit(lcs_table, X, Y)
        ns.append(n); td.append(t_dp)
        t_b, (s_b, checked) = timeit(lcs_brute, X, Y, repeat=1 if n > 14 else 3)
        assert len(s_b) == L[n][n]
        tb.append(t_b)
        rows.append([n, L[n][n], (n + 1) ** 2, f"{t_dp:.6f}", checked, f"{t_b:.6f}", f"{t_b / t_dp:.0f}"])
        print("  ", rows[-1])
    save_csv("e2_lcs.csv", ["n=m", "do_dai_LCS", "QHD_so_o_bang", "QHD_giay",
                            "VetCan_so_day_con_da_thu", "VetCan_giay", "lan_nhanh_hon"], rows)
    plot_vs("exp_lcs.png", "LCS (DNA ngẫu nhiên): vét cạn O(2ⁿ·m) vs QHĐ O(n·m)",
            ns, tb, td, "Độ dài mỗi chuỗi n = m")
    return rows


def exp3_alignment():
    print("\n[E3] Needleman-Wunsch: vét cạn mọi căn chỉnh vs QHĐ")
    rows, ns, tb, td = [], [], [], []
    for n in range(1, 10):
        X = "".join(rng.choice("ACGT") for _ in range(n))
        Y = "".join(rng.choice("ACGT") for _ in range(n))
        t_dp, r = timeit(nw_align, X, Y)
        t_b, (score_b, _, _, calls) = timeit(nw_brute, X, Y, repeat=1 if n > 7 else 3)
        assert score_b == r["score"]
        ns.append(n); td.append(t_dp); tb.append(t_b)
        rows.append([n, delannoy(n, n), (n + 1) ** 2, f"{t_dp:.6f}", calls, f"{t_b:.6f}", f"{t_b / t_dp:.0f}"])
        print("  ", rows[-1])
    save_csv("e3_alignment.csv", ["n=m", "so_can_chinh_Delannoy", "QHD_so_o_bang", "QHD_giay",
                                  "VetCan_so_loi_goi", "VetCan_giay", "lan_nhanh_hon"], rows)
    plot_vs("exp_alignment.png", "Căn chỉnh toàn cục: vét cạn vs Needleman-Wunsch",
            ns, tb, td, "Độ dài mỗi chuỗi n = m")
    return rows


def exp4_memory():
    print("\n[E4] Bộ nhớ: bảng đầy đủ vs Hirschberg (O(n+m))")
    rows = []
    from sequence_alignment import alignment_score

    def peak_mb(fn, *args):
        """Bộ nhớ đỉnh (MB) đo bằng tracemalloc (tracemalloc làm chậm nên KHÔNG đo giờ ở đây)."""
        tracemalloc.start()
        out = fn(*args)
        peak = tracemalloc.get_traced_memory()[1]
        tracemalloc.stop()
        return peak / 2**20, out

    for n in (250, 500, 1000, 1500, 2000):
        X = "".join(rng.choice("ACGT") for _ in range(n))
        Y = "".join(rng.choice("ACGT") for _ in range(n))
        m_full, r = peak_mb(nw_align, X, Y)
        m_h, (ax, ay) = peak_mb(hirschberg, X, Y)
        m_lin, sc = peak_mb(nw_score_linear, X, Y)
        assert alignment_score(ax, ay) == r["score"] == sc
        del r
        t_full = timeit(nw_align, X, Y, repeat=1)[0]
        t_h = timeit(hirschberg, X, Y, repeat=1)[0]
        t_lin = timeit(nw_score_linear, X, Y, repeat=1)[0]
        rows.append([n, round(m_full, 2), round(m_h, 3), round(m_lin, 3),
                     round(t_full, 3), round(t_h, 3), round(t_lin, 3)])
        print("  ", rows[-1])
    save_csv("e4_memory.csv", ["n=m", "BangDayDu_MB", "Hirschberg_MB", "ChiDiem_2hang_MB",
                               "BangDayDu_giay", "Hirschberg_giay", "ChiDiem_2hang_giay"], rows)
    plot_memory(rows)
    return rows


def plot_memory(rows):
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(11, 4.4))
    ns = [r[0] for r in rows]
    a1.plot(ns, [r[1] for r in rows], "-o", color=ORANGE, lw=2, label="Bảng đầy đủ O(n·m)")
    a1.plot(ns, [r[2] for r in rows], "-o", color=BLUE, lw=2, label="Hirschberg O(n+m)")
    a1.set_title("Bộ nhớ đỉnh (MB)", loc="left", color=INK)
    a1.set_xlabel("Độ dài mỗi chuỗi"); a1.legend()
    a1.annotate(f"{rows[-1][1]} MB", (ns[-1], rows[-1][1]), xytext=(-60, 4), textcoords="offset points")
    a1.annotate(f"{rows[-1][2]} MB", (ns[-1], rows[-1][2]), xytext=(-50, 8), textcoords="offset points")
    a2.plot(ns, [r[4] for r in rows], "-o", color=ORANGE, lw=2, label="Bảng đầy đủ")
    a2.plot(ns, [r[5] for r in rows], "-o", color=BLUE, lw=2, label="Hirschberg")
    a2.set_title("Thời gian (giây)", loc="left", color=INK)
    a2.set_xlabel("Độ dài mỗi chuỗi"); a2.legend()
    ratio = rows[-1][1] / rows[-1][2]
    fig.suptitle(f"Hirschberg: bộ nhớ ít hơn ~{ratio:.0f} lần ở n = {rows[-1][0]}, thời gian vẫn cùng bậc O(n·m)",
                 x=0.01, ha="left", fontsize=13, color=INK)
    fig.tight_layout()
    fig.savefig(os.path.join(FIG, "exp_memory.png"))
    plt.close(fig)


def exp5_real_matrices():
    print("\n[E5] Nhân ma trận THẬT bằng numpy: thứ tự trái->phải vs thứ tự tối ưu")
    d = [1000, 4096, 1024, 4096, 64, 1]           # X·W1·W2·W3·w  (giống chuỗi 'MangNoron_5lop')
    nrng = np.random.default_rng(16)
    mats = [nrng.standard_normal((d[i], d[i + 1])).astype(np.float32) for i in range(len(d) - 1)]
    N, S = matrix_chain(d)
    t_opt_tree = split_tree(S, 0, len(d) - 2)
    t_l2r = left_to_right_tree(len(d) - 1)
    c_opt, c_l2r = cost_of_order(d, t_opt_tree)[0], cost_of_order(d, t_l2r)[0]
    t_l2r_s, R1 = timeit(multiply_by_tree, mats, t_l2r)
    t_opt_s, R2 = timeit(multiply_by_tree, mats, t_opt_tree)
    rel_err = float(np.abs(R1 - R2).max() / np.abs(R1).max())
    rows = [["trai_sang_phai", c_l2r, round(t_l2r_s, 4)], ["toi_uu_QHD", c_opt, round(t_opt_s, 4)]]
    save_csv("e5_numpy.csv", ["thu_tu", "so_phep_nhan_vo_huong", "giay"], rows)
    print("  ", rows, "| sai số tương đối giữa 2 kết quả:", rel_err)

    fig, (a1, a2) = plt.subplots(1, 2, figsize=(11, 3.8))
    labels = ["Trái → phải", "Tối ưu (QHĐ)"]
    a1.barh(labels, [c_l2r / 1e9, c_opt / 1e9], color=[ORANGE, BLUE], height=0.55)
    a1.set_title("Số phép nhân vô hướng (tỉ)", loc="left", color=INK)
    for i, v in enumerate([c_l2r, c_opt]):
        a1.text(v / 1e9, i, f"  {v / 1e9:.3g} tỉ", va="center", color=INK)
    a2.barh(labels, [t_l2r_s, t_opt_s], color=[ORANGE, BLUE], height=0.55)
    a2.set_title("Thời gian thực đo bằng numpy (giây)", loc="left", color=INK)
    for i, v in enumerate([t_l2r_s, t_opt_s]):
        a2.text(v, i, f"  {v:.3g} s", va="center", color=INK)
    for a in (a1, a2):
        a.grid(axis="y", visible=False); a.invert_yaxis()
        a.set_xlim(0, a.get_xlim()[1] * 1.25)
    fig.suptitle(f"Cùng một kết quả X·W1·W2·W3·w — chỉ đổi thứ tự nhân: số phép nhân giảm {c_l2r / c_opt:.0f} lần",
                 x=0.01, ha="left", fontsize=13, color=INK)
    fig.tight_layout()
    fig.savefig(os.path.join(FIG, "exp_numpy.png"))
    plt.close(fig)
    return {"cost_l2r": c_l2r, "cost_opt": c_opt, "t_l2r": t_l2r_s, "t_opt": t_opt_s, "rel_err": rel_err}


if __name__ == "__main__":
    # Có thể chọn chạy riêng:  python experiments/run_experiments.py 2 4
    chosen = set(sys.argv[1:]) or {"1", "2", "3", "4", "5"}
    print("Máy chạy:", platform.processor() or platform.machine(), "| Python", platform.python_version())
    if "1" in chosen: exp1_matrix_chain()
    if "2" in chosen: exp2_lcs()
    if "3" in chosen: exp3_alignment()
    if "4" in chosen: exp4_memory()
    if "5" in chosen: exp5_real_matrices()
    if "plot4" in chosen:                       # vẽ lại hình E4 từ CSV, không chạy lại
        with open(os.path.join(RES, "e4_memory.csv")) as f:
            rr = list(csv.reader(f))[1:]
        plot_memory([[int(r[0])] + [float(x) for x in r[1:]] for r in rr])
    with open(os.path.join(RES, "environment.txt"), "w") as f:
        f.write(f"Python {platform.python_version()} | {platform.platform()} | numpy {np.__version__}\n")
    print("\nXong. Xem thư mục results/ và figures/")
