"""
BÀI TOÁN NHÂN CHUỖI MA TRẬN (Matrix Chain-Product)
==================================================
Tham khảo: Goodrich, Tamassia, Goldwasser - Data Structures and Algorithms
in Python, Mục 13.3.1, Code Fragment 13.5.

Cho n ma trận A0, A1, ..., A(n-1); Ai có kích thước d[i] x d[i+1].
=> chỉ cần danh sách d gồm n+1 số là mô tả đủ cả chuỗi.

Mục tiêu: chọn cách đặt ngoặc sao cho TỔNG SỐ PHÉP NHÂN VÔ HƯỚNG nhỏ nhất.
(Nhân ma trận p x q với q x r tốn p*q*r phép nhân vô hướng.)

Công thức truy hồi:
    N[i][i] = 0
    N[i][j] = min_{i <= k < j} ( N[i][k] + N[k+1][j] + d[i]*d[k+1]*d[j+1] )
"""

from functools import lru_cache
from math import comb


# ---------------------------------------------------------------------------
# 1) QUY HOẠCH ĐỘNG BOTTOM-UP (giống sách) + bảng vết S để truy vết
# ---------------------------------------------------------------------------
def matrix_chain(d):
    """Trả về (N, S).

    N[i][j] : số phép nhân tối thiểu để tính Ai...Aj
    S[i][j] : vị trí k của PHÉP NHÂN CUỐI CÙNG tối ưu, tức
              (Ai..Ak) x (Ak+1..Aj). Dùng S để dựng lại cách đặt ngoặc.
    """
    n = len(d) - 1                       # số ma trận
    N = [[0] * n for _ in range(n)]      # N[i][i] = 0 sẵn
    S = [[None] * n for _ in range(n)]

    for b in range(1, n):                # ① b = j - i tăng dần = điền theo đường chéo
        for i in range(n - b):           #    điểm đầu chuỗi con
            j = i + b                    #    điểm cuối chuỗi con
            best, best_k = float("inf"), None
            for k in range(i, j):        #    thử mọi chỗ cắt k
                cost = (N[i][k] + N[k + 1][j]          # ② tra bảng, không gọi đệ quy
                        + d[i] * d[k + 1] * d[j + 1])  # ③ chi phí phép nhân cuối
                if cost < best:
                    best, best_k = cost, k
            N[i][j], S[i][j] = best, best_k   # ④ lưu k thắng để truy vết
    return N, S


def parenthesize(S, i, j):
    """VẾT NGƯỢC: dựng chuỗi đặt ngoặc tối ưu cho Ai..Aj từ bảng S (đệ quy)."""
    if i == j:
        return f"A{i}"
    k = S[i][j]
    return f"({parenthesize(S, i, k)} x {parenthesize(S, k + 1, j)})"


def split_tree(S, i, j):
    """Giống parenthesize nhưng trả về cây dạng tuple (để vẽ hình)."""
    if i == j:
        return i
    k = S[i][j]
    return (split_tree(S, i, k), split_tree(S, k + 1, j))


# ---------------------------------------------------------------------------
# 2) QUY HOẠCH ĐỘNG TOP-DOWN (đệ quy có nhớ - memoization) để so sánh
# ---------------------------------------------------------------------------
def matrix_chain_memo(d):
    n = len(d) - 1

    @lru_cache(maxsize=None)
    def best(i, j):
        if i == j:
            return 0
        return min(best(i, k) + best(k + 1, j) + d[i] * d[k + 1] * d[j + 1]
                   for k in range(i, j))

    return best(0, n - 1)


# ---------------------------------------------------------------------------
# 3) VÉT CẠN (brute force): thử TẤT CẢ cách đặt ngoặc, KHÔNG nhớ kết quả
#    Số cách đặt ngoặc = số Catalan C(n-1) ~ 4^n / n^1.5  -> hàm mũ
# ---------------------------------------------------------------------------
def matrix_chain_brute(d):
    """Trả về (chi phí tối ưu, chuỗi đặt ngoặc tối ưu, số lời gọi đệ quy)."""
    calls = [0]

    def solve(i, j):
        calls[0] += 1
        if i == j:
            return 0, f"A{i}"
        best = (float("inf"), "")
        for k in range(i, j):            # giống DP nhưng TÍNH LẠI mọi bài toán con
            cl, pl = solve(i, k)
            cr, pr = solve(k + 1, j)
            cost = cl + cr + d[i] * d[k + 1] * d[j + 1]
            if cost < best[0]:
                best = (cost, f"({pl} x {pr})")
        return best

    cost, paren = solve(0, len(d) - 2)
    return cost, paren, calls[0]


def all_parenthesizations(i, j):
    """Liệt kê TẤT CẢ cách đặt ngoặc của Ai..Aj (chỉ dùng minh họa, n nhỏ)."""
    if i == j:
        return [f"A{i}"]
    out = []
    for k in range(i, j):
        for left in all_parenthesizations(i, k):
            for right in all_parenthesizations(k + 1, j):
                out.append(f"({left} x {right})")
    return out


def catalan(m):
    """Số Catalan C(m) = (2m)! / ((m+1)! m!) = số cây nhị phân có m+1 lá."""
    return comb(2 * m, m) // (m + 1)


# ---------------------------------------------------------------------------
# 4) KIỂM CHỨNG BẰNG PHÉP NHÂN THẬT (numpy) - đếm số phép nhân vô hướng
# ---------------------------------------------------------------------------
def cost_of_order(d, tree):
    """Tính số phép nhân vô hướng của một cây đặt ngoặc bất kỳ.
    Trả về (cost, hàng, cột) của kết quả."""
    if isinstance(tree, int):
        return 0, d[tree], d[tree + 1]
    cl, p, q = cost_of_order(d, tree[0])
    cr, q2, r = cost_of_order(d, tree[1])
    assert q == q2, "kích thước không khớp"
    return cl + cr + p * q * r, p, r


def left_to_right_tree(n):
    """Cây nhân tuần tự từ trái sang phải: (((A0 A1) A2) A3)..."""
    t = 0
    for i in range(1, n):
        t = (t, i)
    return t


def multiply_by_tree(mats, tree):
    """Nhân các ma trận thật theo đúng thứ tự trong cây (dùng numpy)."""
    if isinstance(tree, int):
        return mats[tree]
    return multiply_by_tree(mats, tree[0]) @ multiply_by_tree(mats, tree[1])


if __name__ == "__main__":
    # Ví dụ 13.4 trong sách: B(2x10), C(10x50), D(50x20)
    d = [2, 10, 50, 20]
    N, S = matrix_chain(d)
    print("Ví dụ 13.4 - chi phí tối ưu:", N[0][-1], "| cách đặt:", parenthesize(S, 0, len(d) - 2))
    print("Vét cạn :", matrix_chain_brute(d)[:2])
    print("Tất cả cách đặt ngoặc:", all_parenthesizations(0, 2))
