"""
VẼ HÌNH MINH HỌA cho slide và báo cáo (tất cả hình đều sinh từ CHÍNH mã nguồn của đề tài,
nên số trên hình = số thuật toán tính ra).
Chạy:  python visualize/make_figures.py      ->  figures/fig*.png
"""

import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "src"))
sys.path.insert(0, os.path.join(ROOT, "data"))

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, FancyArrowPatch, FancyBboxPatch

from matrix_chain import matrix_chain, parenthesize, split_tree, catalan
from sequence_alignment import (lcs_table, lcs_solution, nw_align, sw_align, identity,
                                DIAG, UP, LEFT)
from memory_efficient import nw_last_row
from extensions import gotoh_align
from generate_datasets import read_fasta

FIG = os.path.join(ROOT, "figures")
os.makedirs(FIG, exist_ok=True)

BLUE, ORANGE, AQUA, YELLOW, MAGENTA, VIOLET = "#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#6250d6"
BLUE_L, BLUE_LL, ORANGE_L = "#9ec5f4", "#cde2fb", "#fbd3c1"
INK, MUTED, GRID, SURF = "#0b0b0b", "#52514e", "#d9d8d3", "#ffffff"
GRAY_L = "#efeeea"
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 12, "figure.dpi": 160,
                     "savefig.bbox": "tight", "savefig.pad_inches": 0.15})


def save(fig, name):
    fig.savefig(os.path.join(FIG, name), facecolor=SURF)
    plt.close(fig)
    print("  ", name)


def clean(ax):
    ax.set_xticks([]); ax.set_yticks([])
    for s in ax.spines.values():
        s.set_visible(False)


# ---------------------------------------------------------------------------
# 1. Ví dụ 13.4: cùng kết quả, chi phí khác nhau
# ---------------------------------------------------------------------------
def fig01_example():
    fig, (a, b) = plt.subplots(1, 2, figsize=(12, 4.2), gridspec_kw={"width_ratios": [1.1, 1]})
    sc = 0.06
    x = 0
    for name, (r, c), col in [("B", (2, 10), BLUE), ("C", (10, 50), AQUA), ("D", (50, 20), VIOLET)]:
        a.add_patch(Rectangle((x, 0), c * sc, r * sc, color=col, alpha=0.85))
        a.text(x + c * sc / 2, -0.35, f"{name}\n{r}×{c}", ha="center", va="top", fontsize=13, color=INK)
        x += c * sc + 0.5
    a.set_xlim(-0.3, x); a.set_ylim(-1.6, 3.3); a.set_aspect("equal"); clean(a)
    a.set_title("3 ma trận (vẽ theo đúng tỉ lệ kích thước)", loc="left", color=INK)

    labels = ["B·(C·D)", "(B·C)·D"]
    vals = [10400, 3000]
    detail = ["10·50·20 + 2·10·20", "2·10·50 + 2·50·20"]
    b.barh(labels, vals, color=[ORANGE, BLUE], height=0.55)
    for i, (v, dtl) in enumerate(zip(vals, detail)):
        b.text(v + 150, i - 0.1, f"{v:,} phép nhân".replace(",", "."), va="center", fontsize=13, color=INK)
        b.text(v + 150, i + 0.2, "= " + dtl, va="center", fontsize=10.5, color=MUTED)
    b.invert_yaxis(); b.set_xlim(0, 15500); b.set_xticks([])
    for s in ("top", "right", "bottom"): b.spines[s].set_visible(False)
    b.tick_params(axis="y", labelsize=14)
    b.set_title("Cùng kết quả — chi phí chênh 3,5 lần", loc="left", color=INK)
    save(fig, "fig01_vd13_4.png")


# ---------------------------------------------------------------------------
# 2. Bùng nổ số cách đặt ngoặc (Catalan) so với n^3
# ---------------------------------------------------------------------------
def fig02_catalan():
    ns = list(range(2, 26))
    cat = [catalan(n - 1) for n in ns]
    cube = [n ** 3 for n in ns]
    fig, ax = plt.subplots(figsize=(9, 4.6))
    ax.plot(ns, cat, "-o", color=ORANGE, lw=2, ms=5, label="Vét cạn: số cách đặt ngoặc (Catalan)")
    ax.plot(ns, cube, "-o", color=BLUE, lw=2, ms=5, label="Quy hoạch động: ~n³")
    ax.set_yscale("log")
    ax.set_xlabel("Số ma trận n"); ax.set_ylabel("Số trường hợp (thang log)")
    for s in ("top", "right"): ax.spines[s].set_visible(False)
    ax.grid(color=GRID, lw=0.7)
    ax.annotate(f"n = 25: {cat[-1]:.2e} cách", (25, cat[-1]), xytext=(-150, 0), textcoords="offset points",
                va="center", color=INK)
    ax.annotate(f"n = 25: {cube[-1]:,} bước".replace(",", "."), (25, cube[-1]), xytext=(-140, 14),
                textcoords="offset points", color=INK)
    ax.legend(frameon=False, loc="upper left")
    save(fig, "fig02_catalan.png")


# ---------------------------------------------------------------------------
# 3. Cây đệ quy vét cạn: bài toán con bị TÍNH LẠI nhiều lần
# ---------------------------------------------------------------------------
def fig03_overlap():
    n = 4
    pos, edges, counts = {}, [], {}
    # duyệt cây đệ quy (chỉ vẽ nút có >= 2 ma trận)
    nodes = []

    def build(i, j, depth, parent):
        idx = len(nodes)
        nodes.append((i, j, depth))
        counts[(i, j)] = counts.get((i, j), 0) + 1
        if parent is not None:
            edges.append((parent, idx))
        for k in range(i, j):
            for (a, b) in ((i, k), (k + 1, j)):
                if b > a:
                    build(a, b, depth + 1, idx)

    build(0, n - 1, 0, None)
    # bố trí x theo thứ tự lá
    leaves_x = [0]

    def layout(idx):
        kids = [c for p, c in edges if p == idx]
        if not kids:
            x = leaves_x[0]; leaves_x[0] += 1
        else:
            xs = [layout(c) for c in kids]
            x = sum(xs) / len(xs)
        pos[idx] = (x, -nodes[idx][2])
        return x

    layout(0)
    palette = {(1, 2): ORANGE, (2, 3): VIOLET, (0, 1): AQUA}
    fig, ax = plt.subplots(figsize=(11, 4.6))
    for p, c in edges:
        ax.plot([pos[p][0], pos[c][0]], [pos[p][1], pos[c][1]], color=GRID, lw=1.6, zorder=1)
    for idx, (i, j, d) in enumerate(nodes):
        col = palette.get((i, j), BLUE if (i, j) == (0, n - 1) else "#8a8984")
        x, y = pos[idx]
        ax.add_patch(FancyBboxPatch((x - 0.42, y - 0.2), 0.84, 0.4, boxstyle="round,pad=0.02,rounding_size=0.12",
                                    fc=col, ec="white", lw=2, zorder=2))
        ax.text(x, y, f"A{i}..A{j}", ha="center", va="center", color="white", fontsize=12,
                fontweight="bold", zorder=3)
    ax.set_xlim(-0.7, leaves_x[0] - 0.3); ax.set_ylim(-2.6, 0.5); clean(ax)
    ax.text(-0.6, -2.45, "Cùng màu = cùng một bài toán con bị giải lại.  "
                        "QHĐ: giải mỗi ô (i, j) đúng 1 lần rồi LƯU vào bảng.",
            color=MUTED, fontsize=11)
    save(fig, "fig03_overlap.png")


# ---------------------------------------------------------------------------
# 4. Bảng N (thứ tự điền theo đường chéo) + ô được dùng khi truy vết
# ---------------------------------------------------------------------------
D_CLRS = [30, 35, 15, 5, 10, 20, 25]


def fig04_mc_table():
    d = D_CLRS
    n = len(d) - 1
    N, S = matrix_chain(d)
    trace = []

    def walk(i, j):
        if i < j:
            trace.append((i, j)); walk(i, S[i][j]); walk(S[i][j] + 1, j)
    walk(0, n - 1)
    shades = ["#ffffff", "#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef", "#6da7ec"]
    fig, ax = plt.subplots(figsize=(8.6, 7.4))
    for i in range(n):
        for j in range(n):
            if j < i:
                continue
            b = j - i
            ax.add_patch(Rectangle((j, i), 1, 1, fc=shades[b], ec="white", lw=2))
            if (i, j) in trace:
                ax.add_patch(Rectangle((j + 0.04, i + 0.04), 0.92, 0.92, fc="none", ec=ORANGE, lw=3.2))
            ax.text(j + 0.5, i + 0.44, f"{N[i][j]:,}".replace(",", "."), ha="center", va="center",
                    fontsize=13, color=INK, fontweight="bold" if (i, j) in trace else "normal")
            if i < j:
                ax.text(j + 0.5, i + 0.78, f"k={S[i][j]}", ha="center", va="center", fontsize=9.5, color=MUTED)
    for t in range(n):
        ax.text(t + 0.5, -0.25, f"j={t}", ha="center", color=MUTED)
        ax.text(-0.15, t + 0.5, f"i={t}", ha="right", va="center", color=MUTED)
    for b in range(1, n):
        ax.text(n + 0.15, n - b - 0.5 + 0.02, f"b = {b}", color=MUTED, fontsize=10, va="center")
    ax.text(0, n - 0.6, "Điền lần lượt từng đường chéo\nb = 1, 2, …, 5  (màu đậm dần)", color=MUTED, fontsize=11)
    ax.set_xlim(-0.9, n + 0.9); ax.set_ylim(n + 0.1, -0.6); ax.set_aspect("equal"); clean(ax)
    ax.set_title(f"Bảng N[i][j] — d = {d}\nkhung cam = các ô dùng khi truy vết; đáp án N[0][5] = " + f"{N[0][n-1]:,}".replace(",", "."),
                 loc="left", color=INK, fontsize=12)
    save(fig, "fig04_mc_table.png")


def draw_tree(ax, tree, d, x0, x1, y, dy, labels_cost=True):
    """Vẽ cây đặt ngoặc đệ quy; trả về (x tâm, khoảng chỉ số (i,j))."""
    if isinstance(tree, int):
        x = (x0 + x1) / 2
        ax.add_patch(FancyBboxPatch((x - 0.32, y - 0.22), 0.64, 0.44, boxstyle="round,pad=0.02,rounding_size=0.1",
                                    fc=AQUA, ec="white", lw=2))
        ax.text(x, y + 0.02, f"A{tree}", ha="center", va="center", color="white", fontweight="bold")
        ax.text(x, y - 0.4, f"{d[tree]}×{d[tree+1]}", ha="center", va="top", color=MUTED, fontsize=9)
        return x, (tree, tree)

    def leaves(t):
        return 1 if isinstance(t, int) else leaves(t[0]) + leaves(t[1])
    nl, nr = leaves(tree[0]), leaves(tree[1])
    xm = x0 + (x1 - x0) * nl / (nl + nr)
    xl, (i, k) = draw_tree(ax, tree[0], d, x0, xm, y - dy, dy)
    xr, (k1, j) = draw_tree(ax, tree[1], d, xm, x1, y - dy, dy)
    x = (xl + xr) / 2
    for xc in (xl, xr):
        ax.plot([x, xc], [y - 0.2, y - dy + 0.22], color=GRID, lw=2, zorder=0)
    cost = d[i] * d[k + 1] * d[j + 1]
    ax.add_patch(FancyBboxPatch((x - 0.55, y - 0.22), 1.1, 0.44, boxstyle="round,pad=0.02,rounding_size=0.1",
                                fc=BLUE, ec="white", lw=2))
    ax.text(x, y + 0.02, "×", ha="center", va="center", color="white", fontsize=16, fontweight="bold")
    if labels_cost:
        ax.text(x + 0.62, y + 0.05, f"{d[i]}·{d[k+1]}·{d[j+1]} = {cost:,}".replace(",", "."),
                va="center", fontsize=9.5, color=INK)
    return x, (i, j)


def fig05_mc_tree():
    d = D_CLRS
    n = len(d) - 1
    N, S = matrix_chain(d)
    fig, ax = plt.subplots(figsize=(10, 4.8))
    draw_tree(ax, split_tree(S, 0, n - 1), d, 0, 9, 3, 1.05)
    ax.set_xlim(-0.2, 9.8); ax.set_ylim(-0.6, 3.5); clean(ax)
    ax.set_title(f"Cây nhân tối ưu: {parenthesize(S, 0, n-1).replace(' x ', '·')}   —   tổng {N[0][n-1]:,} phép nhân".replace(",", "."),
                 loc="left", color=INK, fontsize=12)
    save(fig, "fig05_mc_tree.png")


# ---------------------------------------------------------------------------
# 6. LCS: nối các ký tự chung (ví dụ Hình 13.8 của sách)
# ---------------------------------------------------------------------------
X_B, Y_B = "GTTCCTAATA", "CGATAATTGAGA"


def lcs_pairs(X, Y):
    L = lcs_table(X, Y)
    s, path = lcs_solution(X, Y, L, return_path=True)
    pairs = []
    for (j, k), (j2, k2) in zip(path, path[1:]):
        if j2 == j + 1 and k2 == k + 1:
            pairs.append((j, k))         # X[j] khớp Y[k]
    return L, s, path, pairs


def fig06_lcs_concept():
    L, s, path, pairs = lcs_pairs(X_B, Y_B)
    fig, ax = plt.subplots(figsize=(11, 2.8))
    used_x = {p[0] for p in pairs}; used_y = {p[1] for p in pairs}
    for t, c in enumerate(X_B):
        ax.text(t + 1, 1, c, ha="center", va="center", fontsize=20, family="DejaVu Sans Mono",
                color=BLUE if t in used_x else "#b5b4ae", fontweight="bold" if t in used_x else "normal")
    for t, c in enumerate(Y_B):
        ax.text(t, 0, c, ha="center", va="center", fontsize=20, family="DejaVu Sans Mono",
                color=BLUE if t in used_y else "#b5b4ae", fontweight="bold" if t in used_y else "normal")
    for a, b in pairs:
        ax.plot([a + 1, b], [0.82, 0.18], color=BLUE, lw=1.8)
    ax.text(-1.2, 1, "X", fontsize=16, va="center", color=MUTED)
    ax.text(-1.2, 0, "Y", fontsize=16, va="center", color=MUTED)
    ax.text(12.6, 0.5, f"LCS = {s}\n(độ dài {len(s)})", fontsize=15, va="center", color=INK)
    ax.set_xlim(-1.5, 16.5); ax.set_ylim(-0.4, 1.4); clean(ax)
    save(fig, "fig06_lcs_concept.png")


# ---------------------------------------------------------------------------
# 7. Bảng L của LCS + đường vết ngược
# ---------------------------------------------------------------------------
def fig07_lcs_table():
    X, Y = X_B, Y_B
    L, s, path, pairs = lcs_pairs(X, Y)
    n, m = len(X), len(Y)
    on_path = set(path)
    diag_cells = {(j + 1, k + 1) for j, k in pairs}
    fig, ax = plt.subplots(figsize=(10.5, 9.2))
    for j in range(n + 1):
        for k in range(m + 1):
            fc = GRAY_L if (j == 0 or k == 0) else "white"
            if (j, k) in on_path:
                fc = BLUE_LL
            if (j, k) in diag_cells:
                fc = BLUE
            ax.add_patch(Rectangle((k, j), 1, 1, fc=fc, ec=GRID, lw=0.8))
            ax.text(k + 0.5, j + 0.5, str(L[j][k]), ha="center", va="center", fontsize=12,
                    color="white" if (j, k) in diag_cells else INK)
    for k, c in enumerate(Y):
        ax.text(k + 1.5, -0.35, c, ha="center", va="center", fontsize=15, fontweight="bold",
                color=BLUE if k in {p[1] for p in pairs} else INK, family="DejaVu Sans Mono")
    for j, c in enumerate(X):
        ax.text(-0.35, j + 1.5, c, ha="center", va="center", fontsize=15, fontweight="bold",
                color=BLUE if j in {p[0] for p in pairs} else INK, family="DejaVu Sans Mono")
    ax.text(0.5, -0.35, "ε", ha="center", va="center", color=MUTED)
    ax.text(-0.35, 0.5, "ε", ha="center", va="center", color=MUTED)
    rev = path[::-1]
    for (j, k), (j2, k2) in zip(rev, rev[1:]):
        ax.add_patch(FancyArrowPatch((k + 0.5, j + 0.5), (k2 + 0.5, j2 + 0.5), arrowstyle="-|>",
                                     mutation_scale=12, color=ORANGE, lw=2, shrinkA=9, shrinkB=9))
    ax.set_xlim(-0.8, m + 1.1); ax.set_ylim(n + 1.1, -0.8); ax.set_aspect("equal"); clean(ax)
    ax.set_title(f"Bảng L (sách, Hình 13.8)  X = {X}, Y = {Y}\n"
                 f"Mũi tên cam: vết ngược từ L[{n}][{m}] = {L[n][m]};  ô xanh đậm = ký tự chung  →  LCS = {s}",
                 loc="left", fontsize=12, color=INK)
    save(fig, "fig07_lcs_table.png")


# ---------------------------------------------------------------------------
# 8. Ba hướng đi vào một ô
# ---------------------------------------------------------------------------
def fig08_three_moves():
    fig, ax = plt.subplots(figsize=(10, 4.6))
    cells = {(0, 0): "F[i-1][j-1]", (0, 1): "F[i-1][j]", (1, 0): "F[i][j-1]", (1, 1): "F[i][j]"}
    for (r, c), t in cells.items():
        ax.add_patch(Rectangle((c * 2, -r * 1.6), 1.9, 1.5, fc=BLUE if (r, c) == (1, 1) else BLUE_LL,
                               ec="white", lw=3))
        ax.text(c * 2 + 0.95, -r * 1.6 + 0.75, t, ha="center", va="center", fontsize=13,
                color="white" if (r, c) == (1, 1) else INK, fontweight="bold")
    arr = dict(arrowstyle="-|>", mutation_scale=22, lw=3)
    ax.add_patch(FancyArrowPatch((1.7, 0.1), (2.25, -0.25), color=AQUA, **arr))
    ax.add_patch(FancyArrowPatch((2.95, 0.02), (2.95, -0.15), color=ORANGE, **arr))
    ax.add_patch(FancyArrowPatch((1.85, -0.85), (2.08, -0.85), color=VIOLET, **arr))
    tx = 4.4
    rows = [(AQUA, "↘ Chéo", "Xᵢ ghép với Yⱼ", "khớp +1  /  thay thế −1"),
            (ORANGE, "↓ Xuống", "Xᵢ ghép với  –", "khoảng trống −2  (xóa ở Y)"),
            (VIOLET, "→ Ngang", " –  ghép với Yⱼ", "khoảng trống −2  (chèn ở Y)")]
    for t, (col, a, b, c) in enumerate(rows):
        y = 1.0 - t * 1.05
        ax.add_patch(Rectangle((tx, y - 0.32), 0.18, 0.64, color=col))
        ax.text(tx + 0.35, y + 0.12, a, fontsize=14, fontweight="bold", color=INK, va="center")
        ax.text(tx + 2.0, y + 0.12, b, fontsize=14, color=INK, va="center", family="DejaVu Sans Mono")
        ax.text(tx + 0.35, y - 0.2, c, fontsize=11, color=MUTED, va="center")
    ax.text(0, -2.05, "F[i][j] = max của 3 lựa chọn  →  lưu lại MŨI TÊN đã thắng để truy vết",
            fontsize=13, color=INK)
    ax.set_xlim(-0.2, 9.3); ax.set_ylim(-2.3, 1.6); ax.set_aspect("equal"); clean(ax)
    save(fig, "fig08_three_moves.png")


# ---------------------------------------------------------------------------
# 9. Bảng Needleman-Wunsch + mũi tên + căn chỉnh
# ---------------------------------------------------------------------------
X_NW, Y_NW = "ACGGTAG", "ACTGTCAG"


def fig09_nw_table():
    X, Y = X_NW, Y_NW
    r = nw_align(X, Y)
    F, P, path = r["F"], r["P"], r["path"]
    n, m = len(X), len(Y)
    on = set(path)
    glyph = {DIAG: "↖", UP: "↑", LEFT: "←", ".": ""}
    fig, ax = plt.subplots(figsize=(10, 9.4))
    for i in range(n + 1):
        for j in range(m + 1):
            fc = BLUE if (i, j) in on else (GRAY_L if i == 0 or j == 0 else "white")
            ax.add_patch(Rectangle((j, i), 1, 1, fc=fc, ec=GRID, lw=0.8))
            colr = "white" if (i, j) in on else INK
            ax.text(j + 0.56, i + 0.6, str(F[i][j]), ha="center", va="center", fontsize=13, color=colr,
                    fontweight="bold" if (i, j) in on else "normal")
            ax.text(j + 0.2, i + 0.25, glyph[P[i][j]], ha="center", va="center", fontsize=10,
                    color="white" if (i, j) in on else "#9a9994")
    for j, c in enumerate(Y):
        ax.text(j + 1.5, -0.35, c, ha="center", fontsize=15, fontweight="bold", family="DejaVu Sans Mono", va="center")
    for i, c in enumerate(X):
        ax.text(-0.35, i + 1.5, c, ha="center", fontsize=15, fontweight="bold", family="DejaVu Sans Mono", va="center")
    ax.text(0.5, -0.35, "–", ha="center", va="center", color=MUTED)
    ax.text(-0.35, 0.5, "–", ha="center", va="center", color=MUTED)
    # căn chỉnh in bên dưới
    ax_, ay_ = r["aligned_x"], r["aligned_y"]
    base = n + 1.9
    for t, (a, b) in enumerate(zip(ax_, ay_)):
        col = AQUA if a == b else (VIOLET if "-" in (a, b) else ORANGE)
        ax.add_patch(Rectangle((t * 1.0 + 0.5, base - 0.05), 0.9, 1.9, fc=col, alpha=0.18, ec="none"))
        ax.text(t + 0.95, base + 0.4, a, ha="center", va="center", fontsize=17, family="DejaVu Sans Mono", fontweight="bold")
        ax.text(t + 0.95, base + 1.4, b, ha="center", va="center", fontsize=17, family="DejaVu Sans Mono", fontweight="bold")
    ax.text(len(ax_) + 1.0, base + 0.9, f"điểm = {r['score']}", fontsize=14, va="center", color=INK)
    ax.set_xlim(-0.8, m + 1.2); ax.set_ylim(base + 2.2, -0.8); ax.set_aspect("equal"); clean(ax)
    ax.set_title("Needleman–Wunsch  (khớp +1, thay thế −1, khoảng trống −2)\n"
                 "Ô xanh = đường vết ngược từ góc dưới-phải về (0,0); ký hiệu nhỏ = mũi tên đã lưu",
                 loc="left", fontsize=12, color=INK)
    save(fig, "fig09_nw_table.png")


# ---------------------------------------------------------------------------
# 10. Phát hiện đột biến trên gen (dữ liệu giả lập gene_variants.fasta)
# ---------------------------------------------------------------------------
def fig10_mutations():
    recs = read_fasta(os.path.join(ROOT, "data", "gene_variants.fasta"))
    ref = recs[0][1]
    fig, ax = plt.subplots(figsize=(13, 4.4))
    y = 0
    for name, seq in recs[1:]:
        r = gotoh_align(ref, seq)
        ax_, ay_ = r["aligned_x"], r["aligned_y"]
        for t, (a, b) in enumerate(zip(ax_, ay_)):
            if a == b:
                col = "#e4e3df"
            elif a == "-":
                col = VIOLET
            elif b == "-":
                col = MAGENTA
            else:
                col = ORANGE
            ax.add_patch(Rectangle((t, y), 0.92, 0.8, fc=col, ec="none"))
        ax.text(-1, y + 0.4, name.replace("BienThe_", "Biến thể: ").replace("Chen3", "chèn 3")
                .replace("Xoa4", "xóa 4").replace("HonHop", "hỗn hợp"),
                ha="right", va="center", fontsize=11, color=INK)
        y += 1.25
    for lab, col, xx in [("khớp", "#e4e3df", 0), ("thay thế (SNP)", ORANGE, 8), ("chèn", VIOLET, 22), ("xóa", MAGENTA, 30)]:
        ax.add_patch(Rectangle((xx, y + 0.2), 1.2, 0.6, fc=col))
        ax.text(xx + 1.6, y + 0.5, lab, va="center", fontsize=11, color=INK)
    ax.set_xlim(-14, 66); ax.set_ylim(y + 1.1, -0.4); clean(ax)
    ax.set_title("Căn chỉnh gen tham chiếu (60 base) với 4 biến thể (phạt khoảng trống affine) — chỉ ra loại và vị trí đột biến",
                 loc="left", fontsize=12, color=INK)
    save(fig, "fig10_mutations.png")


# ---------------------------------------------------------------------------
# 16. Hạn chế: phạt tuyến tính "rải" khoảng trống; affine (Gotoh) gom lại
# ---------------------------------------------------------------------------
def fig16_linear_vs_affine():
    recs = dict(read_fasta(os.path.join(ROOT, "data", "gene_variants.fasta")))
    ref, var = recs["Gen_ThamChieu"], recs["BienThe_Xoa4"]
    lo, hi = 32, 52                                   # vùng quanh chỗ xóa (vị trí 40-43)
    rows = [("Phạt tuyến tính (gap −2)", nw_align(ref, var)),
            ("Phạt affine (mở −4, kéo dài −1)", gotoh_align(ref, var))]
    fig, ax = plt.subplots(figsize=(12, 3.9))
    y = 0
    for title, r in rows:
        ax_, ay_ = r["aligned_x"], r["aligned_y"]
        # cột ứng với vị trí lo..hi trên gen gốc
        pos, cols = -1, []
        for t, a in enumerate(ax_):
            if a != "-":
                pos += 1
            if lo <= pos <= hi:
                cols.append(t)
        ax.text(-0.5, y + 0.9, title, ha="right", va="center", fontsize=12, color=INK)
        for c, t in enumerate(cols):
            a, b = ax_[t], ay_[t]
            col = "#e4e3df" if a == b else (MAGENTA if b == "-" else (VIOLET if a == "-" else ORANGE))
            ax.add_patch(Rectangle((c, y), 0.92, 1.8, fc=col, ec="none", alpha=0.55 if a == b else 0.9))
            ax.text(c + 0.46, y + 0.45, a, ha="center", va="center", family="DejaVu Sans Mono", fontsize=13)
            ax.text(c + 0.46, y + 1.35, b, ha="center", va="center", family="DejaVu Sans Mono", fontsize=13)
        y += 2.6
    ax.set_xlim(-12, len(cols) + 0.5); ax.set_ylim(y, -0.4); clean(ax)
    ax.set_title("Cùng biến thể “xóa 4 base liền nhau”: hai cách phạt khoảng trống cho hai căn chỉnh khác nhau",
                 loc="left", fontsize=12, color=INK)
    save(fig, "fig16_linear_vs_affine.png")


# ---------------------------------------------------------------------------
# 11. Ma trận tương đồng giữa 6 "loài" + cây phân nhóm
# ---------------------------------------------------------------------------
def similarity_matrix():
    recs = read_fasta(os.path.join(ROOT, "data", "dna_family.fasta"))
    names = [r[0] for r in recs]
    k = len(recs)
    M = [[1.0] * k for _ in range(k)]
    for a in range(k):
        for b in range(a + 1, k):
            r = nw_align(recs[a][1], recs[b][1])
            M[a][b] = M[b][a] = identity(r["aligned_x"], r["aligned_y"])
    return names, M


def fig11_family():
    from scipy.cluster.hierarchy import linkage, dendrogram
    from scipy.spatial.distance import squareform
    import numpy as np
    names, M = similarity_matrix()
    M = np.array(M)
    Z = linkage(squareform(1 - M, checks=False), method="average")
    fig = plt.figure(figsize=(12, 5.2))
    a1 = fig.add_axes([0.0, 0.08, 0.27, 0.8])
    dn = dendrogram(Z, orientation="left", no_labels=True, ax=a1, color_threshold=0,
                    above_threshold_color=BLUE)
    order = dn["leaves"][::-1]
    for s in a1.spines.values(): s.set_visible(False)
    a1.set_xticks([])
    a1.set_title("Cây phân nhóm (UPGMA)", loc="left", fontsize=12, color=INK)
    a2 = fig.add_axes([0.40, 0.08, 0.5, 0.8])
    Mo = M[np.ix_(order, order)]
    im = a2.imshow(Mo, cmap=matplotlib.colors.LinearSegmentedColormap.from_list(
        "b", ["#ffffff", "#9ec5f4", "#2a78d6", "#0d366b"]), vmin=0.4, vmax=1, aspect="auto")
    for i in range(len(order)):
        for j in range(len(order)):
            a2.text(j, i, f"{Mo[i, j]*100:.0f}%", ha="center", va="center",
                    color="white" if Mo[i, j] > 0.8 else INK, fontsize=11)
    a2.set_xticks(range(len(order))); a2.set_yticks(range(len(order)))
    a2.set_xticklabels([names[i] for i in order], rotation=30, ha="right")
    a2.set_yticklabels([names[i] for i in order])
    for s in a2.spines.values(): s.set_visible(False)
    a2.set_title("% giống nhau sau căn chỉnh Needleman–Wunsch", loc="left", fontsize=12, color=INK)
    save(fig, "fig11_family.png")
    return names, M


# ---------------------------------------------------------------------------
# 12. Smith-Waterman: tìm gen trong hệ gen dài
# ---------------------------------------------------------------------------
def fig12_sw():
    genome = read_fasta(os.path.join(ROOT, "data", "genome_with_gene.fasta"))[0][1]
    gene = read_fasta(os.path.join(ROOT, "data", "gene_variants.fasta"))[0][1]
    r = sw_align(genome, gene)
    s0, s1 = r["x_range"]
    fig, ax = plt.subplots(figsize=(12, 3.4))
    ax.add_patch(Rectangle((0, 0), len(genome), 1, fc=GRAY_L, ec="none"))
    ax.add_patch(Rectangle((s0, -0.25), max(s1 - s0, 25), 1.5, fc=ORANGE, ec="none"))
    ax.text(0, 1.5, f"Hệ gen giả lập: {len(genome):,} base".replace(",", "."), fontsize=12, color=INK)
    ax.annotate(f"Smith–Waterman tìm thấy gen tại vị trí {s0}–{s1}\n(điểm {r['score']}, gen thật được cài tại 1734)",
                (s0 + 30, 1.25), xytext=(s0 - 1500, 2.6), fontsize=12, color=INK,
                arrowprops=dict(arrowstyle="-|>", color=ORANGE, lw=1.8))
    ax.text(0, -1.0, "Gen   : " + r["aligned_y"][:60], family="DejaVu Sans Mono", fontsize=10.5, color=INK)
    ml = "".join("|" if a == b else "." for a, b in zip(r["aligned_x"], r["aligned_y"]))
    ax.text(0, -1.55, "        " + ml[:60], family="DejaVu Sans Mono", fontsize=10.5, color=MUTED)
    ax.text(0, -2.1, "Hệ gen: " + r["aligned_x"][:60], family="DejaVu Sans Mono", fontsize=10.5, color=INK)
    ax.set_xlim(-20, len(genome) + 20); ax.set_ylim(-2.5, 3.6); clean(ax)
    save(fig, "fig12_sw_genome.png")
    return r


# ---------------------------------------------------------------------------
# 13. Tối ưu bộ nhớ: chỉ giữ 2 hàng
# ---------------------------------------------------------------------------
def fig13_two_rows():
    n, m = 9, 14
    fig, axs = plt.subplots(1, 2, figsize=(12, 4.4))
    for ax, title, mode in [(axs[0], "Bảng đầy đủ: giữ (n+1)×(m+1) ô", "full"),
                            (axs[1], "Chỉ giữ 2 hàng: O(m) ô", "two")]:
        cur = 5
        for i in range(n + 1):
            for j in range(m + 1):
                if mode == "full":
                    fc = BLUE_L if i <= cur else "white"
                    if i == cur and j > 8: fc = "white"
                else:
                    fc = ("#e7e6e2" if i < cur - 1 else BLUE_L if i == cur - 1 else
                          (BLUE if (i == cur and j <= 8) else ("white" if i == cur else "white")))
                ax.add_patch(Rectangle((j, i), 1, 1, fc=fc, ec=GRID, lw=0.8))
        if mode == "two":
            ax.text(m + 1.3, cur - 0.5, "hàng trước (prev)", va="center", fontsize=11, color=INK)
            ax.text(m + 1.3, cur + 0.5, "hàng đang tính (cur)", va="center", fontsize=11, color=INK)
            ax.text(m / 2, cur - 3, "đã bỏ — không cần nữa", ha="center", va="center", fontsize=11, color=MUTED)
        ax.set_xlim(-0.3, m + 8); ax.set_ylim(n + 1.3, -0.5); ax.set_aspect("equal"); clean(ax)
        ax.set_title(title, loc="left", fontsize=12, color=INK)
    save(fig, "fig13_two_rows.png")


# ---------------------------------------------------------------------------
# 14. Hirschberg: chia đôi X, tìm cột cắt k, đệ quy 2 hình chữ nhật nhỏ
# ---------------------------------------------------------------------------
def fig14_hirschberg():
    X = "AGTACGCATGCATTCAGT"
    Y = "TATGCATGCAGTACCGAT"
    r = nw_align(X, Y)
    n, m = len(X), len(Y)
    mid = n // 2
    left = nw_last_row(X[:mid], Y)
    right = nw_last_row(X[mid:][::-1], Y[::-1])[::-1]
    k = max(range(m + 1), key=lambda j: left[j] + right[j])
    fig, ax = plt.subplots(figsize=(8.5, 8.3))
    ax.add_patch(Rectangle((0, 0), k, mid, fc=BLUE_LL, ec=BLUE, lw=2))
    ax.add_patch(Rectangle((k, mid), m - k, n - mid, fc=BLUE_LL, ec=BLUE, lw=2))
    ax.add_patch(Rectangle((k, 0), m - k, mid, fc="#f3f2ee", ec="none"))
    ax.add_patch(Rectangle((0, mid), k, n - mid, fc="#f3f2ee", ec="none"))
    ax.text((k + m) / 2, mid * 0.2, "bỏ qua", ha="center", va="center", color=MUTED, fontsize=13)
    ax.text(k / 2, (mid + n) / 2, "bỏ qua", ha="center", va="center", color=MUTED, fontsize=13)
    ax.plot([0, m], [mid, mid], color=ORANGE, lw=2, ls="--")
    ax.text(m + 0.3, mid, "hàng giữa", color=ORANGE, va="center", fontsize=12)
    px = [p[1] for p in r["path"]]; py = [p[0] for p in r["path"]]
    ax.plot(px, py, color=INK, lw=2.2)
    ax.plot([k], [mid], "o", ms=13, color=ORANGE, mec="white", mew=2)
    ax.annotate(f"điểm cắt k = {k}\n= argmax(trái[k] + phải[k])", (k, mid), xytext=(k + 3.6, mid - 3.2),
                fontsize=12, arrowprops=dict(arrowstyle="-|>", color=ORANGE, lw=1.6),
                bbox=dict(fc="white", ec="none", alpha=0.9, pad=3))
    box = dict(fc="white", ec="none", alpha=0.9, pad=3)
    ax.text(k * 0.72, mid * 0.18, "đệ quy 1\nX[:mid], Y[:k]", ha="center", va="center", fontsize=12, color=BLUE, bbox=box)
    ax.text(k + (m - k) * 0.3, n - 1.3, "đệ quy 2\nX[mid:], Y[k:]", ha="center", va="center",
            fontsize=12, color=BLUE, bbox=box)
    ax.set_xlim(-0.5, m + 4); ax.set_ylim(n + 0.5, -0.5); ax.set_aspect("equal"); clean(ax)
    ax.set_title("Hirschberg: đường đi tối ưu (đen) chắc chắn cắt hàng giữa tại một cột k", loc="left",
                 fontsize=12, color=INK)
    save(fig, "fig14_hirschberg.png")


# ---------------------------------------------------------------------------
# 15. Bốn bước thiết kế thuật toán QHĐ (sơ đồ)
# ---------------------------------------------------------------------------
def fig15_dp_recipe():
    steps = [("1", "Định nghĩa\nbài toán con", "N[i][j], L[j][k]"),
             ("2", "Công thức\ntruy hồi", "min / max\ncác lựa chọn"),
             ("3", "Điền bảng\nbottom-up", "nhỏ → lớn"),
             ("4", "Truy vết\nngược", "dựng lời giải")]
    fig, ax = plt.subplots(figsize=(12, 2.9))
    cols = [BLUE, AQUA, VIOLET, ORANGE]
    for t, ((num, title, sub), c) in enumerate(zip(steps, cols)):
        x = t * 3.1
        ax.add_patch(FancyBboxPatch((x, 0), 2.6, 1.9, boxstyle="round,pad=0.02,rounding_size=0.18", fc=c, ec="none"))
        ax.text(x + 0.25, 1.62, num, fontsize=18, color="white", fontweight="bold", va="center")
        ax.text(x + 1.3, 1.08, title, ha="center", va="center", fontsize=14, color="white", fontweight="bold")
        ax.text(x + 1.3, -0.45, sub, ha="center", va="center", fontsize=11, color=MUTED)
        if t < 3:
            ax.add_patch(FancyArrowPatch((x + 2.65, 0.95), (x + 3.05, 0.95), arrowstyle="-|>",
                                         mutation_scale=20, color=MUTED, lw=2))
    ax.set_xlim(-0.1, 12.1); ax.set_ylim(-1.0, 2.0); clean(ax)
    save(fig, "fig15_dp_recipe.png")


if __name__ == "__main__":
    fig01_example(); fig02_catalan(); fig03_overlap(); fig04_mc_table(); fig05_mc_tree()
    fig06_lcs_concept(); fig07_lcs_table(); fig08_three_moves(); fig09_nw_table()
    fig10_mutations(); names, M = fig11_family(); r = fig12_sw()
    fig13_two_rows(); fig14_hirschberg(); fig15_dp_recipe(); fig16_linear_vs_affine()
    print("SW:", r["x_range"], r["score"])
