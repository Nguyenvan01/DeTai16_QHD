"""
HƯỚNG MỞ RỘNG: phạt khoảng trống AFFINE (thuật toán Gotoh, 1982)
================================================================
Hạn chế của phạt tuyến tính (mỗi '-' trừ cùng một mức): một đoạn xóa 4 base liền nhau
có cùng điểm với 4 khoảng trống rải rác  ->  căn chỉnh có thể "rải" khoảng trống,
trái với sinh học (đột biến chèn/xóa thường xảy ra theo CẢ ĐOẠN).

Phạt affine: khoảng trống dài L tốn  gap_open + (L - 1) * gap_extend
(mở khoảng trống đắt, kéo dài rẻ)  ->  ưu tiên 1 khoảng trống dài thay vì nhiều khoảng ngắn.

Cần 3 bảng thay vì 1 (vẫn O(n*m) thời gian và bộ nhớ):
  M[i][j]  : căn chỉnh X[:i], Y[:j] kết thúc bằng cặp (Xi, Yj)
  Ix[i][j] : ... kết thúc bằng (Xi, '-')   - đang ở trong 1 khoảng trống trên Y
  Iy[i][j] : ... kết thúc bằng ('-', Yj)   - đang ở trong 1 khoảng trống trên X
"""

NEG = float("-inf")


def gotoh_align(X, Y, match=1, mismatch=-1, gap_open=-4, gap_extend=-1):
    n, m = len(X), len(Y)
    M = [[NEG] * (m + 1) for _ in range(n + 1)]
    Ix = [[NEG] * (m + 1) for _ in range(n + 1)]
    Iy = [[NEG] * (m + 1) for _ in range(n + 1)]
    M[0][0] = 0
    for i in range(1, n + 1):
        Ix[i][0] = gap_open + (i - 1) * gap_extend
    for j in range(1, m + 1):
        Iy[0][j] = gap_open + (j - 1) * gap_extend

    for i in range(1, n + 1):
        for j in range(1, m + 1):
            s = match if X[i - 1] == Y[j - 1] else mismatch
            M[i][j] = s + max(M[i - 1][j - 1], Ix[i - 1][j - 1], Iy[i - 1][j - 1])
            Ix[i][j] = max(M[i - 1][j] + gap_open, Ix[i - 1][j] + gap_extend, Iy[i - 1][j] + gap_open)
            Iy[i][j] = max(M[i][j - 1] + gap_open, Iy[i][j - 1] + gap_extend, Ix[i][j - 1] + gap_open)

    # ---- vết ngược: phải nhớ đang ở BẢNG nào (M, X hay Y) ----
    # Ở mỗi bước: ghép 1 cột, lùi i/j, rồi hỏi "bảng nào ở ô trước sinh ra giá trị hiện tại?"
    tables = {"M": M, "X": Ix, "Y": Iy}
    state = max(("M", "X", "Y"), key=lambda t: tables[t][n][m])
    score = tables[state][n][m]
    i, j, ax, ay = n, m, [], []
    while i > 0 or j > 0:
        if state == "M":                            # cặp (X[i-1], Y[j-1])
            s = match if X[i - 1] == Y[j - 1] else mismatch
            cur = M[i][j] - s
            ax.append(X[i - 1]); ay.append(Y[j - 1]); i -= 1; j -= 1
            if M[i][j] == cur:
                state = "M"
            elif Ix[i][j] == cur:
                state = "X"
            else:
                state = "Y"
        elif state == "X":                          # cặp (X[i-1], '-')
            cur = Ix[i][j]
            ax.append(X[i - 1]); ay.append("-"); i -= 1
            if Ix[i][j] + gap_extend == cur:        # khoảng trống còn kéo dài
                state = "X"
            elif M[i][j] + gap_open == cur:         # khoảng trống vừa mở
                state = "M"
            else:
                state = "Y"
        else:                                       # cặp ('-', Y[j-1])
            cur = Iy[i][j]
            ax.append("-"); ay.append(Y[j - 1]); j -= 1
            if Iy[i][j] + gap_extend == cur:
                state = "Y"
            elif M[i][j] + gap_open == cur:
                state = "M"
            else:
                state = "X"
    return {"score": score, "aligned_x": "".join(reversed(ax)), "aligned_y": "".join(reversed(ay))}


def affine_score(ax, ay, match=1, mismatch=-1, gap_open=-4, gap_extend=-1):
    """Chấm điểm một căn chỉnh theo phạt affine (để kiểm chứng)."""
    total, prev = 0, None                          # prev: 'X' / 'Y' / None (loại khoảng trống trước)
    for a, b in zip(ax, ay):
        if a == "-":
            total += gap_extend if prev == "Y" else gap_open
            prev = "Y"
        elif b == "-":
            total += gap_extend if prev == "X" else gap_open
            prev = "X"
        else:
            total += match if a == b else mismatch
            prev = None
    return total


def all_alignments(X, Y):
    """Liệt kê mọi căn chỉnh (chỉ dùng kiểm thử với chuỗi rất ngắn)."""
    if not X and not Y:
        yield "", ""
        return
    if X and Y:
        for a, b in all_alignments(X[:-1], Y[:-1]):
            yield a + X[-1], b + Y[-1]
    if X:
        for a, b in all_alignments(X[:-1], Y):
            yield a + X[-1], b + "-"
    if Y:
        for a, b in all_alignments(X, Y[:-1]):
            yield a + "-", b + Y[-1]
