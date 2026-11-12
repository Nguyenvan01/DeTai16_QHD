# Giải thích mã nguồn – Đề tài 16: Quy hoạch động nâng cao

Tài liệu này đi theo đúng thứ tự slide trình bày, chỉ ra **mỗi slide ứng với hàm nào trong code** và giải thích từng hàm bằng lời đơn giản.

---

## 0. Cấu trúc thư mục

| Thư mục / file | Nội dung |
|---|---|
| `src/matrix_chain.py` | Nhân chuỗi ma trận (slide 02) |
| `src/sequence_alignment.py` | LCS, Needleman–Wunsch, Smith–Waterman, vét cạn (slide 03) |
| `src/memory_efficient.py` | Tối ưu bộ nhớ: hai hàng, Hirschberg (slide 06) |
| `src/extensions.py` | Phạt khoảng trống affine – Gotoh (slide 06, hạn chế) |
| `demo.py` | Demo khi thuyết trình, in bảng và vết ngược từng bước |
| `experiments/run_experiments.py` | Đo thời gian QHĐ vs vét cạn (slide 04) |
| `visualize/make_figures.py` | Vẽ hình cho slide/báo cáo |
| `data/generate_datasets.py` | Sinh dữ liệu DNA giả lập (có đột biến cài sẵn) |
| `tests/test_all.py` | Kiểm thử: so QHĐ với vét cạn trên hàng trăm bộ ngẫu nhiên |

Cách chạy:

```bash
python demo.py            # chạy cả 6 phần demo
python demo.py 3          # chỉ phần 3 (LCS)
python -m unittest discover -s tests -v
```

---

## 1. Ý tưởng QHĐ (slide 3–4)

Mọi bài trong code đều theo **bốn bước**:

1. **Định nghĩa bài toán con** – ví dụ `N[i][j]` = chi phí nhỏ nhất để nhân `Ai..Aj`.
2. **Công thức truy hồi** – nhìn vào *bước cuối cùng*, thử mọi khả năng.
3. **Điền bảng** từ bài nhỏ đến bài lớn (bottom-up, vòng lặp) – không bao giờ tính lại.
4. **Truy vết** – lưu lựa chọn thắng (bảng `S`, bảng mũi tên `P`) để dựng lại lời giải.

Code có cả hai kiểu:
- Bottom-up (vòng lặp điền bảng, cách của sách): `matrix_chain`, `lcs_table`, `nw_align`.
- Top-down (đệ quy + ghi nhớ): `matrix_chain_memo` dùng `@lru_cache`.

---

## 2. Nhân chuỗi ma trận – `src/matrix_chain.py` (slide 5, 6, 13, 26)

**Đầu vào:** danh sách `d` gồm n+1 số; ma trận `Ai` có kích thước `d[i] × d[i+1]`.

**Công thức (slide 26):**

```
N[i][i] = 0
N[i][j] = min over i ≤ k < j of ( N[i][k] + N[k+1][j] + d[i]·d[k+1]·d[j+1] )
           chi phí khúc trái + chi phí khúc phải + phép nhân cuối ghép hai khúc
```

### `matrix_chain(d)` → `(N, S)` — đúng code trên slide 13

```python
for b in range(1, n):                # ① b = j - i tăng dần = điền theo đường chéo
    for i in range(n - b):
        j = i + b
        best, best_k = float("inf"), None
        for k in range(i, j):        #    thử mọi chỗ cắt k
            cost = (N[i][k] + N[k + 1][j]          # ② tra bảng, không gọi đệ quy
                    + d[i] * d[k + 1] * d[j + 1])  # ③ chi phí phép nhân cuối
            if cost < best:
                best, best_k = cost, k
        N[i][j], S[i][j] = best, best_k   # ④ lưu k thắng để truy vết
```

- Vì sao điền theo đường chéo? Khi tính `N[i][j]` cần `N[i][k]` và `N[k+1][j]` – đều là chuỗi **ngắn hơn**, nên đã có sẵn.
- Độ phức tạp: 3 vòng lồng nhau → **O(n³)** thời gian, **O(n²)** bộ nhớ.

### `parenthesize(S, i, j)` — truy vết (slide 6)

Đọc `k = S[i][j]` → biết phép nhân cuối là `(Ai..Ak) × (Ak+1..Aj)` → đệ quy hai nửa.
Ví dụ CLRS `d = [30, 35, 15, 5, 10, 20, 25]`:

```
S[0][5]=2 → (A0..A2)(A3..A5)
S[0][2]=0 → A0·(A1·A2)
S[3][5]=4 → (A3·A4)·A5
Kết quả: ((A0 x (A1 x A2)) x ((A3 x A4) x A5)) = 15.125 phép nhân  (trái→phải: 40.500)
```

### Các hàm phụ

| Hàm | Làm gì |
|---|---|
| `split_tree` | Như `parenthesize` nhưng trả cây dạng tuple (để vẽ hình, nhân thật) |
| `matrix_chain_memo` | Phiên bản top-down: đệ quy + `lru_cache` |
| `matrix_chain_brute` | Vét cạn: đệ quy **không nhớ**, đếm số lời gọi → thấy hàm mũ |
| `all_parenthesizations` | Liệt kê mọi cách đặt ngoặc (chỉ dùng với n nhỏ) |
| `catalan(m)` | Số cách đặt ngoặc = số Catalan `C(2m, m) / (m+1)` |
| `cost_of_order` | Đếm số phép nhân của một cây đặt ngoặc bất kỳ (để kiểm chứng) |
| `left_to_right_tree` | Cây nhân tuần tự trái→phải (để so sánh) |
| `multiply_by_tree` | Nhân ma trận numpy thật theo cây (slide phụ lục 679×) |

---

## 3. Căn chỉnh trình tự DNA – `src/sequence_alignment.py` (slide 7–12, 14)

Quy ước chỉ số giống sách: `L[j][k]` ứng với `X[0:j]` và `Y[0:k]`; **hàng 0 / cột 0 là chuỗi rỗng**, nên ký tự thứ j của X là `X[j-1]`.

### 3.1 LCS – dãy con chung dài nhất (slide 8, 9)

**`lcs_table(X, Y)`** – điền bảng L:

```
L[j][k] = L[j−1][k−1] + 1             nếu hai ký tự cuối giống nhau  (đi chéo)
L[j][k] = max(L[j−1][k], L[j][k−1])   nếu khác                        (bỏ 1 ký tự)
```

**`lcs_solution(X, Y, L)`** – đi ngược từ góc dưới phải:
- Ký tự giống → đi chéo ↖, ghi ký tự.
- Khác → sang ô lớn hơn (hòa thì đi lên ↑).
- Gặp `L = 0` → dừng, **đảo ngược** chuỗi đã ghi.

Điền bảng O(n·m), truy vết O(n + m). `lcs(X, Y)` gọi gộp hai hàm trên.

### 3.2 Needleman–Wunsch – căn chỉnh toàn cục (slide 10, 11, 14)

Điểm: khớp **+1**, thay thế **−1**, khoảng trống **−2**. Ba cách kết thúc một căn chỉnh:

```
F[i][j] = max( F[i-1][j-1] + s(Xi, Yj),   # chéo ↖: khớp / thay thế
               F[i-1][j]   + gap,         # lên  ↑: X[i-1] đối với '-'  (xóa)
               F[i][j-1]   + gap )        # trái ←: '-' đối với Y[j-1]  (chèn)
```

**`nw_align(X, Y)`** – khởi tạo hàng/cột 0 bằng `i·gap`, `j·gap` (ghép toàn khoảng trống), rồi điền bảng `F` (điểm) và `P` (mũi tên):

```python
cands = ((F[i-1][j-1] + s, DIAG),    # ① thứ tự trong cands = luật phá hòa:
         (F[i-1][j]   + gap, UP),    #    chéo > lên > trái
         (F[i][j-1]   + gap, LEFT))
F[i][j], P[i][j] = max(cands, key=lambda t: t[0])
```

`max(..., key=...)` so sánh theo điểm và **giữ phần tử đầu tiên khi bằng nhau**, nên thứ tự viết trong `cands` chính là luật phá hòa.

**`nw_traceback(X, Y, P)`** – đi theo mũi tên đã lưu từ `(n, m)` về `(0, 0)`:
- `DIAG` → ghép `X[i-1]/Y[j-1]`, lùi cả i và j.
- `UP` → ghép `X[i-1]/'-'`, lùi i.
- `LEFT` → ghép `'-'/Y[j-1]`, lùi j.
- ② Mỗi bước giảm i hoặc j → O(n + m). ③ Ghép từ cuối nên phải đảo ngược.

Ví dụ slide 11 (`X = ACGGTAG`, `Y = ACTGTCAG`):

```
ACGGT-AG
||.|| ||
ACTGTCAG      6 khớp − 1 thay thế − 2 (1 khoảng trống) = 3 = F[7][8]
```

Hàm phụ: `alignment_score` (chấm điểm lại để kiểm chứng), `match_line` (dòng `| . ` ở giữa), `identity` (% cột khớp – dùng cho “ai họ hàng với ai”, slide 18).

### 3.3 Smith–Waterman – căn chỉnh cục bộ (slide 12, 19)

**`sw_align(X, Y)`** khác NW đúng 3 điểm:

| | Needleman–Wunsch | Smith–Waterman |
|---|---|---|
| Công thức | `max(chéo, lên, trái)` | `max(0, chéo, lên, trái)` – số 0 = “bắt đầu lại” |
| Hàng/cột 0 | `i·g`, `j·g` | `0` |
| Truy vết | từ góc `(n, m)` về `(0, 0)` | từ **ô lớn nhất**, dừng khi gặp ô 0 |

Kết quả trả thêm `x_range`, `y_range` = vị trí đoạn tìm được (dùng để tìm gen trong hệ gen).

### 3.4 Vét cạn – để so sánh (slide 15)

| Hàm | Cách làm | Độ phức tạp |
|---|---|---|
| `lcs_brute` | Liệt kê **mọi** dãy con của X, giữ dãy dài nhất cũng là dãy con của Y | O(2ⁿ · m) |
| `is_subsequence` | Đi dọc Y, gặp ký tự cần tìm của S thì tiến một bước | O(m) |
| `nw_brute` | Đệ quy 3 nhánh **không nhớ** | số Delannoy D(n, m) – hàm mũ |
| `delannoy(n, m)` | Đếm số căn chỉnh có thể có | – |

---

## 4. Tối ưu bộ nhớ – `src/memory_efficient.py` (slide 21–23)

**Vấn đề (slide 21):** 2 chuỗi × 100.000 base → 10¹⁰ ô ≈ 40 GB.

### Hai hàng (slide 22)

Hàng `i` chỉ cần hàng `i − 1` → giữ `prev` và `cur`, xong hàng thì `prev = cur`.

- `lcs_length_two_rows(X, Y)` – độ dài LCS, bộ nhớ O(min(n, m)).
- `nw_last_row(X, Y)` – trả **hàng cuối** của bảng NW, chỉ dùng 2 hàng.
- `nw_score_linear(X, Y)` – điểm NW = phần tử cuối của hàng cuối.

Cái giá: **mất đường truy vết** (các hàng cũ đã bị bỏ).

### Hirschberg – chia đôi + hai hàng (slide 23)

**`hirschberg(X, Y)`** lấy lại được căn chỉnh mà vẫn O(n + m) bộ nhớ:

1. Cắt X làm đôi tại `mid`.
2. `left` = quét xuôi `X[:mid]` với Y; `right` = quét **ngược** `X[mid:]` với Y (đảo chuỗi).
3. Cột cắt `k` = cột có `left[k] + right[k]` lớn nhất (đường tối ưu đi qua ô `(mid, k)`).
4. Đệ quy hai nửa `(X[:mid], Y[:k])` và `(X[mid:], Y[k:])`, nối kết quả.
5. Trường hợp cơ sở (chuỗi rỗng hoặc dài 1) dùng `nw_align` thường.

Đo được với n = m = 2.000: bảng đầy đủ 183,7 MB, Hirschberg 0,32 MB, cùng điểm tối ưu.

`banded_nw_score(X, Y, band)` – chỉ tính trong dải chéo `|i − j| ≤ band`, nhanh O(n·band); đúng tối ưu nếu đường tối ưu nằm trong dải, nếu không thì chỉ là cận dưới.

---

## 5. Phạt affine – Gotoh – `src/extensions.py` (slide 21)

**Hạn chế của phạt tuyến tính:** 1 đoạn xóa 4 base liền nhau bị trừ điểm như 4 khoảng trống rải rác → căn chỉnh có thể “rải” khoảng trống, trái với sinh học.

**Phạt affine:** khoảng trống dài L tốn `gap_open + (L − 1)·gap_extend` (mở đắt, kéo dài rẻ).

**`gotoh_align(X, Y)`** dùng **3 bảng**:

| Bảng | Căn chỉnh `X[:i]`, `Y[:j]` kết thúc bằng |
|---|---|
| `M[i][j]` | cặp `(Xi, Yj)` |
| `Ix[i][j]` | `(Xi, '-')` – đang trong khoảng trống trên Y |
| `Iy[i][j]` | `('-', Yj)` – đang trong khoảng trống trên X |

Truy vết phải nhớ **đang ở bảng nào**: mỗi bước ghép 1 cột, lùi i/j, rồi hỏi “bảng nào ở ô trước sinh ra giá trị hiện tại?” (cộng `gap_extend` = khoảng trống kéo dài, cộng `gap_open` = vừa mở).

`affine_score` chấm điểm lại một căn chỉnh; `all_alignments` liệt kê mọi căn chỉnh để test với chuỗi rất ngắn.

---

## 6. Kiểm thử – `tests/test_all.py`

Mỗi thuật toán QHĐ được so với **vét cạn** trên hàng trăm bộ dữ liệu ngẫu nhiên (seed cố định 2026):

- Nhân chuỗi ma trận: DP = vét cạn = top-down; cây truy vết có đúng chi phí `N[0][n-1]`; số cách đặt ngoặc = Catalan.
- LCS: DP = vét cạn 2ⁿ; kết quả là dãy con của cả X và Y; bản hai hàng cho cùng độ dài.
- NW: DP = vét cạn; căn chỉnh bỏ `-` ra đúng chuỗi gốc; chấm lại đúng điểm.
- LCS là trường hợp riêng của NW với `match=1, mismatch=0, gap=0`.
- Hirschberg, hai hàng, dải chéo cho cùng điểm với bảng đầy đủ.
- Smith–Waterman tìm đúng vị trí đoạn gen cài vào.
- Gotoh = vét cạn mọi căn chỉnh theo điểm affine.

---

## 7. Tóm tắt độ phức tạp

| Thuật toán | Thời gian | Bộ nhớ | Vét cạn |
|---|---|---|---|
| Nhân chuỗi ma trận | O(n³) | O(n²) | Catalan ~ 4ⁿ |
| LCS | O(n·m) | O(n·m) | O(2ⁿ·m) |
| Needleman–Wunsch / Smith–Waterman | O(n·m) | O(n·m) | Delannoy – hàm mũ |
| Hai hàng (chỉ điểm) | O(n·m) | O(min(n, m)) | – |
| Hirschberg (có căn chỉnh) | ≤ 2·n·m | O(n + m) | – |
| Gotoh (affine) | O(n·m) | O(n·m), 3 bảng | – |
