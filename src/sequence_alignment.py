"""
CĂN CHỈNH TRÌNH TỰ DNA (Sequence Alignment)
==========================================
Phần A - Dãy con chung dài nhất (LCS): đúng như sách Goodrich, Mục 13.3.2,
         Code Fragment 13.6 (bảng L) và 13.7 (vết ngược).
Phần B - Căn chỉnh toàn cục Needleman-Wunsch (có điểm khớp / lệch / khoảng trống).
         LCS chính là một trường hợp riêng của căn chỉnh.
Phần C - Căn chỉnh cục bộ Smith-Waterman (tìm đoạn gen giống nhau trong chuỗi dài).
Phần D - Vét cạn (brute force) để so sánh thực nghiệm.

Quy ước chỉ số giống sách: L[j][k] ứng với tiền tố X[0:j] và Y[0:k]
(j ký tự đầu của X, k ký tự đầu của Y). Hàng 0 / cột 0 = chuỗi rỗng.
"""

from itertools import combinations

DIAG, UP, LEFT, STOP = "D", "U", "L", "."   # mũi tên vết ngược


# ===========================================================================
# PHẦN A. LCS - Longest Common Subsequence
# ===========================================================================
def lcs_table(X, Y):
    """Code Fragment 13.6: trả về bảng L, L[j][k] = độ dài LCS của X[0:j], Y[0:k]."""
    n, m = len(X), len(Y)
    L = [[0] * (m + 1) for _ in range(n + 1)]   # (n+1) x (m+1), hàng/cột 0 = 0
    for j in range(n):
        for k in range(m):
            if X[j] == Y[k]:                    # 2 ký tự cuối khớp -> đi chéo
                L[j + 1][k + 1] = L[j][k] + 1
            else:                               # bỏ 1 ký tự của X hoặc của Y
                L[j + 1][k + 1] = max(L[j][k + 1], L[j + 1][k])
    return L


def lcs_solution(X, Y, L, return_path=False):
    """Code Fragment 13.7: VẾT NGƯỢC từ ô L[n][m] về ô có giá trị 0."""
    solution, path = [], []
    j, k = len(X), len(Y)
    while L[j][k] > 0:                          # còn ký tự chung
        path.append((j, k))
        if X[j - 1] == Y[k - 1]:                # ô này sinh ra từ đường chéo
            solution.append(X[j - 1])
            j -= 1
            k -= 1
        elif L[j - 1][k] >= L[j][k - 1]:        # giá trị đến từ ô phía trên
            j -= 1
        else:                                   # giá trị đến từ ô bên trái
            k -= 1
    path.append((j, k))
    lcs = "".join(reversed(solution))           # đảo lại cho đúng thứ tự trái->phải
    return (lcs, path[::-1]) if return_path else lcs


def lcs(X, Y):
    return lcs_solution(X, Y, lcs_table(X, Y))


# ===========================================================================
# PHẦN B. Needleman-Wunsch: căn chỉnh TOÀN CỤC
# ===========================================================================
def nw_align(X, Y, match=1, mismatch=-1, gap=-2):
    """Trả về dict gồm: score, aligned_x, aligned_y, F (bảng điểm), P (bảng mũi tên), path.

    F[i][j] = điểm căn chỉnh tốt nhất của X[0:i] và Y[0:j]
    F[i][j] = max( F[i-1][j-1] + s(Xi, Yj),   # chéo  : khớp / thay thế
                   F[i-1][j]   + gap,         # lên   : X[i-1] đối với '-'  (xóa)
                   F[i][j-1]   + gap )        # trái  : '-' đối với Y[j-1]  (chèn)
    """
    n, m = len(X), len(Y)
    F = [[0] * (m + 1) for _ in range(n + 1)]
    P = [[STOP] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):                   # cột 0: X ghép toàn khoảng trống
        F[i][0], P[i][0] = i * gap, UP
    for j in range(1, m + 1):                   # hàng 0: Y ghép toàn khoảng trống
        F[0][j], P[0][j] = j * gap, LEFT

    for i in range(1, n + 1):
        for j in range(1, m + 1):
            s = match if X[i - 1] == Y[j - 1] else mismatch
            cands = ((F[i - 1][j - 1] + s, DIAG),    # ① thứ tự trong cands = luật phá hòa:
                     (F[i - 1][j] + gap, UP),        #    chéo > lên > trái
                     (F[i][j - 1] + gap, LEFT))      #    (max giữ phần tử ĐẦU khi bằng nhau)
            F[i][j], P[i][j] = max(cands, key=lambda t: t[0])

    ax, ay, path = nw_traceback(X, Y, P)
    return {"score": F[n][m], "aligned_x": ax, "aligned_y": ay,
            "F": F, "P": P, "path": path}


def nw_traceback(X, Y, P):
    """VẾT NGƯỢC theo bảng mũi tên P, từ ô (n, m) về (0, 0)."""
    i, j = len(X), len(Y)
    ax, ay, path = [], [], [(i, j)]
    while i > 0 or j > 0:                   # ② mỗi bước giảm i hoặc j: O(n + m)
        arrow = P[i][j]
        if arrow == DIAG:
            ax.append(X[i - 1]); ay.append(Y[j - 1]); i -= 1; j -= 1
        elif arrow == UP:
            ax.append(X[i - 1]); ay.append("-"); i -= 1
        else:  # LEFT
            ax.append("-"); ay.append(Y[j - 1]); j -= 1
        path.append((i, j))
    # ③ ghép từ cuối lên nên phải đảo ngược
    return "".join(reversed(ax)), "".join(reversed(ay)), path[::-1]


def alignment_score(ax, ay, match=1, mismatch=-1, gap=-2):
    """Chấm điểm 1 căn chỉnh cho trước (dùng để kiểm chứng kết quả)."""
    total = 0
    for a, b in zip(ax, ay):
        if a == "-" or b == "-":
            total += gap
        else:
            total += match if a == b else mismatch
    return total


def match_line(ax, ay):
    """Dòng giữa khi in căn chỉnh: '|' khớp, '.' thay thế, ' ' khoảng trống."""
    line = ""
    for a, b in zip(ax, ay):
        if a == b:
            line += "|"
        elif a == "-" or b == "-":
            line += " "
        else:
            line += "."
    return line


def identity(ax, ay):
    """Tỉ lệ cột khớp trên tổng số cột căn chỉnh (% identity)."""
    return sum(a == b for a, b in zip(ax, ay)) / max(len(ax), 1)


# ===========================================================================
# PHẦN C. Smith-Waterman: căn chỉnh CỤC BỘ (tìm đoạn giống nhau nhất)
# ===========================================================================
def sw_align(X, Y, match=2, mismatch=-1, gap=-2):
    """Khác NW ở 3 điểm: (1) có lựa chọn 0 -> 'bắt đầu lại';
    (2) hàng/cột 0 bằng 0; (3) vết ngược bắt đầu từ ô LỚN NHẤT và dừng ở ô 0."""
    n, m = len(X), len(Y)
    H = [[0] * (m + 1) for _ in range(n + 1)]
    best, bi, bj = 0, 0, 0
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            s = match if X[i - 1] == Y[j - 1] else mismatch
            H[i][j] = max(0, H[i - 1][j - 1] + s, H[i - 1][j] + gap, H[i][j - 1] + gap)
            if H[i][j] > best:
                best, bi, bj = H[i][j], i, j
    # vết ngược
    i, j, ax, ay = bi, bj, [], []
    while i > 0 and j > 0 and H[i][j] > 0:
        s = match if X[i - 1] == Y[j - 1] else mismatch
        if H[i][j] == H[i - 1][j - 1] + s:
            ax.append(X[i - 1]); ay.append(Y[j - 1]); i -= 1; j -= 1
        elif H[i][j] == H[i - 1][j] + gap:
            ax.append(X[i - 1]); ay.append("-"); i -= 1
        else:
            ax.append("-"); ay.append(Y[j - 1]); j -= 1
    return {"score": best, "aligned_x": "".join(reversed(ax)),
            "aligned_y": "".join(reversed(ay)),
            "x_range": (i, bi), "y_range": (j, bj)}   # đoạn [start, end) trên X và Y


# ===========================================================================
# PHẦN D. VÉT CẠN
# ===========================================================================
def is_subsequence(S, Y):
    """Kiểm tra S có là dãy con của Y không - O(m): đi dọc Y, gặp ký tự cần tìm thì tiến."""
    t = 0                                 # số ký tự của S đã tìm thấy
    for c in Y:
        if t < len(S) and c == S[t]:
            t += 1
    return t == len(S)


def lcs_brute(X, Y):
    """Đúng như sách mô tả: liệt kê TẤT CẢ 2^n dãy con của X, giữ dãy dài nhất
    cũng là dãy con của Y  ->  O(2^n * m)."""
    best, checked = "", 0
    for size in range(len(X) + 1):
        for idx in combinations(range(len(X)), size):   # mọi tập chỉ số có `size` phần tử
            checked += 1
            S = "".join(X[t] for t in idx)
            if len(S) > len(best) and is_subsequence(S, Y):
                best = S
    return best, checked


def nw_brute(X, Y, match=1, mismatch=-1, gap=-2):
    """Vét cạn TẤT CẢ các căn chỉnh (đệ quy không nhớ).
    Số căn chỉnh = số Delannoy D(n, m) - tăng theo hàm mũ."""
    calls = [0]

    def best(i, j):                       # căn chỉnh tốt nhất của X[0:i], Y[0:j]
        calls[0] += 1
        if i == 0:
            return j * gap, "-" * j, Y[:j]
        if j == 0:
            return i * gap, X[:i], "-" * i
        s = match if X[i - 1] == Y[j - 1] else mismatch
        a = best(i - 1, j - 1)
        b = best(i - 1, j)
        c = best(i, j - 1)
        return max((a[0] + s, a[1] + X[i - 1], a[2] + Y[j - 1]),
                   (b[0] + gap, b[1] + X[i - 1], b[2] + "-"),
                   (c[0] + gap, c[1] + "-", c[2] + Y[j - 1]),
                   key=lambda t: t[0])

    score, ax, ay = best(len(X), len(Y))
    return score, ax, ay, calls[0]


def delannoy(n, m):
    """D(n,m) = số đường đi từ (0,0) tới (n,m) với bước →, ↓, ↘ = số căn chỉnh."""
    D = [[1] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            D[i][j] = D[i - 1][j] + D[i][j - 1] + D[i - 1][j - 1]
    return D[n][m]


if __name__ == "__main__":
    # Ví dụ Hình 13.8 trong sách
    X, Y = "GTTCCTAATA", "CGATAATTGAGA"
    print("LCS (DP)      :", lcs(X, Y))
    print("LCS (vét cạn) :", lcs_brute(X, Y)[0])
    r = nw_align("GATTACA", "GCATGCU".replace("U", "T"))
    print(r["aligned_x"]); print(match_line(r["aligned_x"], r["aligned_y"])); print(r["aligned_y"])
    print("score =", r["score"])
