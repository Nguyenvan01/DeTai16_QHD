"""
TỐI ƯU BỘ NHỚ cho căn chỉnh trình tự
====================================
Bảng đầy đủ tốn O(n*m) ô. Với 2 chuỗi 100.000 base -> 10^10 ô (~ hàng chục GB).

Quan sát: hàng i của bảng CHỈ phụ thuộc hàng i-1  ==>  chỉ cần giữ 2 hàng.
  - Tính ĐIỂM (hoặc độ dài LCS): O(min(n,m)) bộ nhớ.
  - Muốn cả CĂN CHỈNH (vết ngược) mà vẫn O(n+m) bộ nhớ: thuật toán Hirschberg (1975)
    = chia để trị + 2 lần quét "2 hàng" (xuôi và ngược).
"""

from sequence_alignment import nw_align


def lcs_length_two_rows(X, Y):
    """Độ dài LCS với bộ nhớ O(min(n, m)): chỉ giữ hàng trước và hàng hiện tại."""
    if len(Y) > len(X):
        X, Y = Y, X                       # để hàng ngắn hơn
    prev = [0] * (len(Y) + 1)
    for x in X:
        cur = [0] * (len(Y) + 1)
        for k, y in enumerate(Y):
            cur[k + 1] = prev[k] + 1 if x == y else max(prev[k + 1], cur[k])
        prev = cur                        # hàng cũ bị bỏ đi -> giải phóng bộ nhớ
    return prev[-1]


def nw_last_row(X, Y, match=1, mismatch=-1, gap=-2):
    """Trả về HÀNG CUỐI của bảng NW (điểm của X với mọi tiền tố Y[0:j]),
    chỉ dùng 2 hàng bộ nhớ."""
    prev = [j * gap for j in range(len(Y) + 1)]
    for i in range(1, len(X) + 1):
        cur = [i * gap] + [0] * len(Y)
        xi = X[i - 1]
        for j in range(1, len(Y) + 1):
            s = match if xi == Y[j - 1] else mismatch
            cur[j] = max(prev[j - 1] + s, prev[j] + gap, cur[j - 1] + gap)
        prev = cur
    return prev


def nw_score_linear(X, Y, match=1, mismatch=-1, gap=-2):
    return nw_last_row(X, Y, match, mismatch, gap)[-1]


def hirschberg(X, Y, match=1, mismatch=-1, gap=-2):
    """Căn chỉnh toàn cục tối ưu với bộ nhớ O(n + m), thời gian vẫn O(n*m).

    Ý tưởng: cắt X làm đôi tại mid. Đường đi tối ưu phải cắt hàng mid tại cột
    k nào đó. Tìm k bằng:  điểm(X[:mid], Y[:k]) + điểm(X[mid:], Y[k:]) lớn nhất
      - vế trái : quét xuôi  X[:mid]  với Y           (nw_last_row)
      - vế phải : quét NGƯỢC X[mid:] với Y (đảo chuỗi) (nw_last_row)
    Rồi đệ quy 2 nửa (X[:mid], Y[:k]) và (X[mid:], Y[k:]).
    """
    if len(X) == 0:
        return "-" * len(Y), Y
    if len(Y) == 0:
        return X, "-" * len(X)
    if len(X) == 1 or len(Y) == 1:       # trường hợp cơ sở: dùng NW thường (bảng nhỏ)
        r = nw_align(X, Y, match, mismatch, gap)
        return r["aligned_x"], r["aligned_y"]

    mid = len(X) // 2
    left = nw_last_row(X[:mid], Y, match, mismatch, gap)
    right = nw_last_row(X[mid:][::-1], Y[::-1], match, mismatch, gap)[::-1]
    k = 0                                  # cột cắt tối ưu: tổng hai vế lớn nhất
    for j in range(1, len(Y) + 1):
        if left[j] + right[j] > left[k] + right[k]:
            k = j

    ax1, ay1 = hirschberg(X[:mid], Y[:k], match, mismatch, gap)
    ax2, ay2 = hirschberg(X[mid:], Y[k:], match, mismatch, gap)
    return ax1 + ax2, ay1 + ay2


def banded_nw_score(X, Y, band, match=1, mismatch=-1, gap=-2):
    """Căn chỉnh trong DẢI chéo |i - j| <= band: thời gian O(n * band).
    Hợp lý khi 2 chuỗi rất giống nhau (ít indel). Kết quả là tối ưu
    NẾU đường đi tối ưu nằm trong dải; nếu không thì chỉ là xấp xỉ (cận dưới)."""
    NEG = float("-inf")
    n, m = len(X), len(Y)
    prev = {j: j * gap for j in range(0, min(m, band) + 1)}
    for i in range(1, n + 1):
        cur = {}
        for j in range(max(0, i - band), min(m, i + band) + 1):
            if j == 0:
                cur[j] = i * gap
                continue
            s = match if X[i - 1] == Y[j - 1] else mismatch
            cur[j] = max(prev.get(j - 1, NEG) + s, prev.get(j, NEG) + gap,
                         cur.get(j - 1, NEG) + gap)
        prev = cur
    return prev.get(m, NEG)
