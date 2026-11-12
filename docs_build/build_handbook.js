// SỔ TAY THUYẾT TRÌNH: kịch bản, giải thích code từng dòng, câu hỏi phản biện.
// Chạy: node docs_build/build_handbook.js
const fs = require("fs");
const path = require("path");
const { B, buildDoc, d } = require("./docxlib");
const { Packer } = d;
const ROOT = path.resolve(__dirname, "..");

const body = [];
const add = (...xs) => xs.forEach((x) => body.push(...x));

// bảng giải thích code: [dòng code, ý nghĩa, liên hệ bài toán]
const explain = (rows, caption) =>
  B.table([["Dòng / đoạn code", "Làm gì", "Liên quan gì đến bài toán"], ...rows], [3300, 2950, 2820], caption, { size: 21 });

const cover = [
  ...B.blank(6),
  ...B.center("SỔ TAY THUYẾT TRÌNH", { bold: true, size: 40 }),
  ...B.center("Đề tài 16 – Quy hoạch động nâng cao:", { size: 30, before: 200 }),
  ...B.center("Nhân chuỗi ma trận và Căn chỉnh trình tự DNA", { size: 30 }),
  ...B.blank(3),
  ...B.center("Kịch bản nói · Giải thích mã nguồn từng dòng · Kịch bản demo · Câu hỏi phản biện", { italics: true, size: 26 }),
  ...B.blank(10),
  ...B.center("Tài liệu nội bộ cho người trình bày – không nộp kèm", { italics: true, size: 24 }),
];

add(B.toc());

// ------------------------------------------------------------------ 1. NGUYÊN TẮC
add(B.chapter("1. Nguyên tắc trình bày"), B.setChap(1));
add(B.bullets([
  "**Slide là hình, lời nói là nội dung.** Slide chỉ có hình minh họa, con số lớn, công thức. Không đọc chữ trên slide; mỗi slide có ghi chú người nói (speaker notes) với lời giảng chi tiết – mở chế độ Present để xem.",
  "**Mỗi slide một ý.** Trước khi chuyển slide, nói một câu chốt ý (\"vậy là ta có công thức\", \"vậy là vét cạn không khả thi\").",
  "**Luôn chỉ vào hình.** Khi nói về bảng QHĐ, chỉ vào ô cụ thể (ví dụ ô N[0][2], ô L[10][12]) – tiêu chí chấm riêng là độ chính xác của bảng và vết ngược.",
  "**Lặp lại khung bốn bước** ở cả hai bài: bài toán con → truy hồi (nhìn bước cuối) → điền bảng → truy vết. Người nghe sẽ thấy hai bài là một kỹ thuật.",
  "**Số liệu nói ra phải khớp slide:** 3.000 vs 10.400; 15.125; GTTTAA; điểm 3; ×9.514; 679×; 183,7 MB vs 0,32 MB.",
]));
add(B.h2("1.1. Phân bổ thời gian gợi ý (khoảng 20 phút)"));
add(B.table([
  ["Phần", "Slide", "Thời gian", "Ý chốt"],
  ["Mở đầu", "1–2", "1 phút", "Hai bài toán, một kỹ thuật"],
  ["Ý tưởng QHĐ", "3–4", "2 phút", "Không giải lại bài toán con; 4 bước"],
  ["Nhân chuỗi ma trận", "5–11", "6 phút", "Nhìn phép nhân cuối; chứng minh cắt–dán; bảng theo đường chéo; truy vết S"],
  ["Căn chỉnh DNA", "12–17", "5 phút", "LCS → Needleman–Wunsch → Smith–Waterman; bảng mũi tên"],
  ["Code & thực nghiệm", "18–21", "3 phút", "Vét cạn = cùng công thức nhưng không lưu bảng; đo thật"],
  ["Ứng dụng", "22–25", "2 phút", "Đột biến, phân nhóm loài, tìm gen, multi_dot"],
  ["Hạn chế & bộ nhớ", "26–28", "2 phút", "n·m ô; hai hàng; Hirschberg"],
  ["Kết luận, hỏi đáp", "29–30", "1 phút + hỏi đáp", "Ba điều mang về"],
], [2400, 1100, 1500, 4070], "Phân bổ thời gian", { center: [1, 2], size: 22 }));

// ------------------------------------------------------------------ 2. KỊCH BẢN THEO SLIDE
add(B.chapter("2. Kịch bản tóm tắt theo slide"), B.setChap(2));
add(B.p("Bảng dưới là phiên bản rút gọn để ôn nhanh; lời giảng đầy đủ nằm trong ghi chú người nói của từng slide."));
const script = [
  ["1", "Bìa", "Giới thiệu đề tài; hình bên phải là một căn chỉnh thật do chương trình tạo ra (xanh lá khớp, cam thay thế, gạch là khoảng trống)."],
  ["2", "Lộ trình", "3 phần lý thuyết + 3 phần thực hành; hai bài cùng một khung 4 bước."],
  ["3", "Đừng giải lại cái đã giải", "Chỉ các nút cùng màu trong cây đệ quy: bài toán con bị giải lặp. Ba điều kiện của sách."],
  ["4", "Bốn bước", "Bài toán con – truy hồi (nhìn bước cuối) – điền bảng – truy vết. Bottom-up vs top-down."],
  ["5", "Ví dụ 13.4", "Tính tay 10.000+400 và 1.000+2.000. Cùng kết quả, chi phí chênh 3,5 lần."],
  ["6", "Bùng nổ tổ hợp", "Số cách = Catalan ≈ 4ⁿ; n = 25 → 1,29·10¹². Nhưng số bài toán con chỉ n(n+1)/2."],
  ["7", "Phép nhân cuối", "N[i][j] = min theo k của 3 phần (xanh, cam, xanh lá). Phép nhân cuối không phụ thuộc cách đặt ngoặc bên trong."],
  ["8", "Cắt và dán", "Phản chứng 3 bước; suy ra công thức đúng bằng quy nạp theo j − i."],
  ["9", "Điền bảng", "Điền theo đường chéo b. Tính mẫu N[0][2]: k=0 → 7.875; k=1 → 18.000."],
  ["10", "Truy vết", "S[0][5]=2, S[0][2]=0, S[3][5]=4 → cây; tổng các nút = 15.125; so 40.500."],
  ["11", "Độ phức tạp", "3ⁿ⁻¹ lời gọi (chứng minh C(n)=3C(n−1)); (n³−n)/6 lần thử k; Θ(n²) bộ nhớ; đo 2,31 s vs 0,24 ms."],
  ["12", "Ba kiểu đột biến", "SNP, chèn, xóa; chèn/xóa làm lệch → phải căn chỉnh."],
  ["13", "LCS", "Định nghĩa dãy con; truy hồi 2 trường hợp; chứng minh cắt–dán tương tự."],
  ["14", "Bảng L", "Truy vết: giống → chéo + ghi; khác → ô lớn hơn (hòa → lên); gặp 0 → dừng, đảo ngược → GTTTAA."],
  ["15", "Ba hướng", "Hệ điểm +1/−1/−2; ba khả năng cột cuối; lưu mũi tên; LCS là trường hợp riêng."],
  ["16", "Bảng F", "Truy vết theo mũi tên; kiểm tra tay 6 − 1 − 2 = 3 = F[7][8]."],
  ["17", "Smith–Waterman", "Ba thay đổi: thêm 0, biên 0, truy vết từ ô lớn nhất."],
  ["18", "Code nhân chuỗi", "4 điểm đánh số ①–④ (giải thích chi tiết ở Mục 3.1)."],
  ["19", "Code NW", "Luật phá hòa qua thứ tự cands; truy vết O(n+m)."],
  ["20", "Thực nghiệm", "Thang log: vét cạn là đường thẳng; ×9.514, ×21.767, ×12.534; luôn assert cùng đáp án."],
  ["21", "Ma trận thật", "679× ít phép nhân, ≈30× nhanh hơn; vì sao không đủ 679× (BLAS, ma trận–vectơ)."],
  ["22", "Đột biến", "4/4 đúng; vị trí 18 vs 20 do đoạn lặp GTGT (left-normalization)."],
  ["23", "Phân nhóm loài", "Không cho chương trình biết cây; khôi phục đúng nhóm A, B, ngoài nhóm."],
  ["24", "Tìm gen", "Smith–Waterman tìm đúng 1734–1794 dù có 4 base đột biến; BLAST, minimap2."],
  ["25", "Tối ưu tài nguyên", "multi_dot, tensor, JOIN order, diff."],
  ["26", "Hạn chế", "10¹⁰ ô ≈ 40 GB; phạt tuyến tính rải khoảng trống → Gotoh affine."],
  ["27", "Hai hàng", "prev/cur; O(min(n,m)); mất truy vết."],
  ["28", "Hirschberg", "Đường tối ưu cắt hàng giữa tại k; quét xuôi + quét ngược; ≤ 2nm; 183,7 MB → 0,32 MB."],
  ["29", "Kết luận", "Ba điều mang về; hướng phát triển."],
  ["30", "Tài liệu, hỏi đáp", "Để slide trong lúc hỏi đáp."],
];
add(B.table([["#", "Slide", "Cần nói"], ...script], [600, 2400, 6070], "Kịch bản tóm tắt", { center: [0], size: 21 }));

// ------------------------------------------------------------------ 3. GIẢI THÍCH CODE
add(B.chapter("3. Giải thích mã nguồn từng dòng"), B.setChap(3));
add(B.p("Mỗi bảng gồm ba cột: dòng code, nó làm gì, và nó tương ứng với phần nào của lý thuyết. Nếu bị hỏi về một dòng bất kỳ, trả lời theo đúng ba ý này: **làm gì – vì sao cần – ứng với công thức nào**."));

add(B.h2("3.1. matrix_chain(d) – bảng N và S"));
add(explain([
  ["`n = len(d) - 1`", "Số ma trận.", "Ai có kích thước d[i] × d[i+1] nên n ma trận cần n+1 số."],
  ["`N = [[0] * n for _ in range(n)]`", "Tạo bảng n×n toàn 0. Dùng list comprehension để mỗi hàng là list riêng (tránh lỗi `[[0]*n]*n` dùng chung một hàng).", "Đặt luôn trường hợp cơ sở N[i][i] = 0."],
  ["`S = [[None] * n ...]`", "Bảng lưu lựa chọn.", "S[i][j] = k của phép nhân cuối – dùng để truy vết."],
  ["`for b in range(1, n):`", "b = j − i chạy 1, 2, …, n−1.", "Điền theo đường chéo: chuỗi ngắn trước, dài sau – bảo đảm ô phụ thuộc đã có."],
  ["`for i in range(n - b):` / `j = i + b`", "Duyệt mọi chuỗi con có độ dài b+1.", "Mỗi (i, j) là một bài toán con."],
  ["`best, best_k = float(\"inf\"), None`", "Khởi tạo min = +∞.", "Chuẩn bị lấy min theo k."],
  ["`for k in range(i, j):`", "Thử mọi vị trí phép nhân cuối (i ≤ k < j).", "Chính là \"min theo k\" trong công thức."],
  ["`cost = N[i][k] + N[k+1][j] + d[i]*d[k+1]*d[j+1]`", "Chi phí nếu tách tại k.", "Công thức truy hồi: hai nửa tối ưu (tra bảng) + phép nhân cuối."],
  ["`if cost < best: best, best_k = cost, k`", "Cập nhật min và k thắng.", "Dùng `<` nên khi hòa giữ k nhỏ nhất (quy tắc phá hòa)."],
  ["`N[i][j], S[i][j] = best, best_k`", "Ghi kết quả.", "Lưu cả giá trị và lựa chọn."],
  ["`return N, S`", "Trả hai bảng.", "Đáp án là N[0][n−1]."],
], "Giải thích matrix_chain"));
add(B.p("**Độ phức tạp từ code:** ba vòng lồng nhau b, i, k → (n³ − n)/6 lần chạy dòng `cost` → Θ(n³); hai bảng n×n → Θ(n²)."));
add(B.h2("3.2. parenthesize(S, i, j) – truy vết đặt ngoặc"));
add(explain([
  ["`if i == j: return f\"A{i}\"`", "Điểm dừng đệ quy: một ma trận.", "Lá của cây nhân."],
  ["`k = S[i][j]`", "Đọc vị trí phép nhân cuối.", "Truy vết: không tính lại, chỉ đọc lựa chọn đã lưu."],
  ["`return f\"({parenthesize(S, i, k)} x {parenthesize(S, k+1, j)})\"`", "Đệ quy hai nửa rồi bao ngoặc.", "Dựng cây nhị phân có n lá → O(n) lời gọi."],
], "Giải thích parenthesize"));
add(B.h2("3.3. matrix_chain_brute(d) – vét cạn đối chứng"));
add(explain([
  ["`calls = [0]`", "Bộ đếm (dùng list để hàm con sửa được).", "Đếm số lời gọi để so với lý thuyết 3ⁿ⁻¹."],
  ["`def solve(i, j):` … `calls[0] += 1`", "Hàm đệ quy cho đoạn Ai..Aj.", "Mỗi lời gọi = giải một bài toán con."],
  ["`for k in range(i, j):` … `solve(i, k)`, `solve(k+1, j)`", "Thử mọi k, gọi đệ quy hai nửa.", "CÙNG công thức với QHĐ nhưng KHÔNG lưu → giải lại nhiều lần."],
  ["`best = (cost, f\"({pl} x {pr})\")`", "Giữ chi phí và chuỗi ngoặc tốt nhất.", "Để so sánh cả đáp án lẫn cách đặt ngoặc với QHĐ."],
], "Giải thích matrix_chain_brute"));
add(B.p("**Câu chốt khi demo:** \"Hai hàm khác nhau đúng một điều: QHĐ tra bảng N[i][k], vét cạn gọi solve(i, k). Chỉ vậy mà 3ⁿ thành n³.\""));

add(B.h2("3.4. lcs_table(X, Y) – Code Fragment 13.6"));
add(explain([
  ["`n, m = len(X), len(Y)`", "Độ dài hai chuỗi.", ""],
  ["`L = [[0] * (m + 1) for _ in range(n + 1)]`", "Bảng (n+1)×(m+1) toàn 0.", "Hàng/cột 0 = chuỗi rỗng → LCS = 0 (trường hợp cơ sở)."],
  ["`for j in range(n):` `for k in range(m):`", "Duyệt từng cặp ký tự X[j], Y[k].", "Điền từng hàng, trái sang phải: ô trên, trái, chéo đã có."],
  ["`if X[j] == Y[k]: L[j+1][k+1] = L[j][k] + 1`", "Hai ký tự cuối giống: lấy ô chéo + 1.", "Trường hợp 1 của truy hồi. Chỉ số lệch 1 vì L[j+1][k+1] ứng với tiền tố X[0:j+1], Y[0:k+1]."],
  ["`else: L[j+1][k+1] = max(L[j][k+1], L[j+1][k])`", "Khác nhau: max của ô trên và ô trái.", "Trường hợp 2: bỏ ký tự cuối của X hoặc Y."],
], "Giải thích lcs_table"));
add(B.h2("3.5. lcs_solution(X, Y, L) – Code Fragment 13.7"));
add(explain([
  ["`j, k = len(X), len(Y)`", "Bắt đầu ở ô góc dưới phải.", "L[n][m] là độ dài LCS."],
  ["`while L[j][k] > 0:`", "Lặp khi còn ký tự chung.", "Ô = 0 nghĩa là phía trước không còn ký tự chung."],
  ["`if X[j-1] == Y[k-1]: solution.append(X[j-1]); j -= 1; k -= 1`", "Ký tự giống: ghi lại, đi chéo.", "Ô này sinh ra từ trường hợp 1."],
  ["`elif L[j-1][k] >= L[j][k-1]: j -= 1`", "Đi lên nếu ô trên ≥ ô trái.", "Ô sinh ra từ trường hợp 2; `>=` là quy tắc phá hòa (ưu tiên lên)."],
  ["`else: k -= 1`", "Đi sang trái.", ""],
  ["`''.join(reversed(solution))`", "Đảo ngược rồi nối thành chuỗi.", "Ký tự được thu từ cuối về đầu."],
  ["`path.append((j, k))` (bản của đề tài)", "Ghi lại các ô đã đi qua.", "Chỉ để vẽ hình đường truy vết; không ảnh hưởng thuật toán."],
], "Giải thích lcs_solution"));
add(B.h2("3.6. nw_align và nw_traceback – Needleman–Wunsch"));
add(explain([
  ["`F = [[0]*(m+1) ...]`, `P = [[STOP]*(m+1) ...]`", "Bảng điểm F và bảng mũi tên P.", "F[i][j] = điểm tốt nhất của X[0:i], Y[0:j]."],
  ["`F[i][0], P[i][0] = i * gap, UP`", "Cột 0: X[0:i] ghép toàn khoảng trống.", "Trường hợp cơ sở; mũi tên ↑ để truy vết đi về (0,0)."],
  ["`F[0][j], P[0][j] = j * gap, LEFT`", "Hàng 0 tương tự.", ""],
  ["`s = match if X[i-1] == Y[j-1] else mismatch`", "Điểm của cặp ký tự.", "s(xᵢ₋₁, yⱼ₋₁) trong công thức."],
  ["`cands = ((F[i-1][j-1] + s, DIAG), (F[i-1][j] + gap, UP), (F[i][j-1] + gap, LEFT))`", "Ba ứng viên (điểm, mũi tên).", "Ba khả năng của cột cuối."],
  ["`F[i][j], P[i][j] = max(cands, key=lambda t: t[0])`", "Lấy ứng viên điểm cao nhất; khi hòa, `max` giữ phần tử ĐẦU.", "Thứ tự trong cands = quy tắc phá hòa Chéo > Lên > Trái."],
  ["`while i > 0 or j > 0:` (nw_traceback)", "Truy vết tới (0,0).", "Dùng `or` vì có thể còn đi dọc biên khi một chỉ số đã bằng 0."],
  ["`if arrow == DIAG: ax.append(X[i-1]); ay.append(Y[j-1]); i -= 1; j -= 1`", "Ghép hai ký tự.", "Cột khớp/thay thế."],
  ["`elif arrow == UP: ax.append(X[i-1]); ay.append(\"-\"); i -= 1`", "Ký tự X đối diện gạch.", "Xóa (so với Y)."],
  ["`else: ax.append(\"-\"); ay.append(Y[j-1]); j -= 1`", "Gạch đối diện ký tự Y.", "Chèn."],
  ["`\"\".join(reversed(ax))`", "Đảo ngược.", "Các cột được ghép từ cuối."],
], "Giải thích nw_align / nw_traceback"));
add(B.h2("3.7. sw_align – Smith–Waterman"));
add(explain([
  ["`H[i][j] = max(0, H[i-1][j-1] + s, H[i-1][j] + gap, H[i][j-1] + gap)`", "Thêm lựa chọn 0.", "Điểm âm → bắt đầu lại: không cõng đoạn không giống phía trước."],
  ["`if H[i][j] > best: best, bi, bj = ...`", "Nhớ ô lớn nhất.", "Truy vết bắt đầu từ đây, không phải góc."],
  ["`while i > 0 and j > 0 and H[i][j] > 0:`", "Dừng khi gặp ô 0.", "Ô 0 là nơi đoạn giống nhau bắt đầu."],
  ["`if H[i][j] == H[i-1][j-1] + s:` …", "Truy vết bằng cách kiểm tra ô nào sinh ra giá trị (không lưu mũi tên).", "Cách truy vết thứ hai, giống LCS của sách."],
  ["`\"x_range\": (i, bi)`", "Đoạn [i, bi) trên X.", "Vị trí gen tìm được trong hệ gen."],
], "Giải thích sw_align"));
add(B.h2("3.8. Tối ưu bộ nhớ: nw_last_row và hirschberg"));
add(explain([
  ["`prev = [j * gap for j in range(len(Y) + 1)]`", "Hàng 0.", "Chỉ giữ một hàng thay vì cả bảng."],
  ["`cur = [i * gap] + [0] * len(Y)`", "Hàng đang tính, phần tử đầu là cột 0.", ""],
  ["`cur[j] = max(prev[j-1] + s, prev[j] + gap, cur[j-1] + gap)`", "Đúng công thức NW.", "prev[j−1] = ô chéo, prev[j] = ô trên, cur[j−1] = ô trái."],
  ["`prev = cur`", "Đổi vai; hàng cũ bị giải phóng.", "Bộ nhớ O(m)."],
  ["`mid = len(X) // 2`", "Cắt X làm đôi.", "Hàng giữa trên lưới."],
  ["`left = nw_last_row(X[:mid], Y)`", "Điểm X[:mid] với mọi tiền tố Y[:k].", "Vế trái của tổng."],
  ["`right = nw_last_row(X[mid:][::-1], Y[::-1])[::-1]`", "Quét NGƯỢC: đảo hai chuỗi, rồi đảo kết quả.", "right[k] = điểm X[mid:] với hậu tố Y[k:]."],
  ["`k = max(range(len(Y) + 1), key=lambda j: left[j] + right[j])`", "Cột cắt tối ưu.", "Đường đi tối ưu cắt hàng giữa tại k."],
  ["`hirschberg(X[:mid], Y[:k])` + `hirschberg(X[mid:], Y[k:])`", "Đệ quy hai nửa, nối kết quả.", "Chia để trị; tổng thời gian ≤ 2·n·m."],
  ["`if len(X) == 1 or len(Y) == 1: nw_align(...)`", "Trường hợp cơ sở dùng NW thường.", "Bảng rất nhỏ (≤ 2 hàng) nên không tốn bộ nhớ."],
], "Giải thích nw_last_row / hirschberg"));
add(B.h2("3.9. gotoh_align – phạt affine (mở rộng)"));
add(B.p("Ba bảng: `M` (kết thúc bằng cặp ký tự), `Ix` (kết thúc bằng ký tự X đối diện gạch), `Iy` (gạch đối diện ký tự Y). Công thức `Ix[i][j] = max(M[i-1][j] + gap_open, Ix[i-1][j] + gap_extend, Iy[i-1][j] + gap_open)`: đang ở trong một khoảng trống thì chỉ tốn `gap_extend` (−1), mở khoảng trống mới tốn `gap_open` (−4). Truy vết phải nhớ **đang ở bảng nào** (biến `state`). Kiểm thử so với liệt kê mọi căn chỉnh (`all_alignments`) trên 200 cặp ngẫu nhiên."));
add(B.h2("3.10. Sinh dữ liệu và đo thời gian"));
add(explain([
  ["`rng = random.Random(16)`", "Bộ sinh ngẫu nhiên có seed cố định.", "Chạy lại luôn ra đúng dữ liệu cũ → kết quả tái lập được."],
  ["`mutate(seq, sub_rate, indel_rate)`", "Đi qua từng base: xóa (xác suất indel/2), chèn trước nó (indel/2), thay thế (sub_rate).", "Mô phỏng ba kiểu đột biến; ghi nhật ký làm đáp án."],
  ["`write_fasta` / `read_fasta`", "Ghi/đọc định dạng FASTA (dòng \">\" + chuỗi 60 ký tự/dòng).", "Định dạng chuẩn của tin sinh học."],
  ["`timeit(fn, *args, repeat=3)`", "Lấy thời gian NHỎ NHẤT của 3 lần chạy (`time.perf_counter`).", "Giảm nhiễu do hệ điều hành."],
  ["`assert cost_b == N[0][n-1]`", "Dừng ngay nếu QHĐ khác vét cạn.", "Bảo đảm mọi số liệu đều đo trên đáp án đúng."],
  ["`tracemalloc.start()` … `get_traced_memory()[1]`", "Đo bộ nhớ đỉnh của Python.", "Thí nghiệm bộ nhớ (đo riêng, không đo giờ cùng lúc vì tracemalloc làm chậm)."],
], "Giải thích sinh dữ liệu và thực nghiệm"));

// ------------------------------------------------------------------ 4. DEMO
add(B.chapter("4. Kịch bản demo trực tiếp"), B.setChap(4));
add(B.p("Chuẩn bị trước: mở terminal ở thư mục `DeTai16_QHD`, đã `pip install -r requirements.txt`, phóng to cỡ chữ terminal. Không chạy `run_experiments.py` khi đang trình bày (mất khoảng 6 phút) – dùng hình đã có."));
add(B.table([
  ["Lệnh", "Chỉ cho người nghe thấy gì"],
  ["`python demo.py 1`", "Ví dụ 13.4: hai cách đặt ngoặc, 10.400 và 3.000."],
  ["`python demo.py 2`", "Bảng N, bảng S in ra; từng bước truy vết từ S[0][5]; kết quả 15.125 so với 40.500; vét cạn 243 lời gọi = 3⁵, 42 cách = Catalan."],
  ["`python demo.py 3`", "Bảng L với dấu * trên đường truy vết; LCS = GTTTAA; vét cạn cùng độ dài 6."],
  ["`python demo.py 4`", "Bảng F có dấu *; căn chỉnh ACGGT-AG / ACTGTCAG, điểm 3; danh sách đột biến phát hiện được."],
  ["`python demo.py 5`", "Ma trận % giống nhau của 6 loài; Smith–Waterman tìm gen tại 1734."],
  ["`python -m unittest discover -s tests -v`", "12 nhóm kiểm thử đều OK (khoảng 1 giây) – chứng tỏ bảng và vết ngược đúng."],
], [3600, 5470], "Các lệnh demo", { size: 22 }));
add(B.p("**Nếu demo lỗi** (máy không có Python…): mở `results/demo_output.txt` – là đầu ra đã chạy sẵn – và giải thích trên đó."));

// ------------------------------------------------------------------ 5. HỎI ĐÁP
add(B.chapter("5. Câu hỏi phản biện thường gặp"), B.setChap(5));
const qa = [
  ["QHĐ khác chia để trị ở đâu?", "Chia để trị chia thành bài toán con ĐỘC LẬP (merge sort). QHĐ dùng khi bài toán con CHỒNG LẤP: cùng một bài toán con được nhiều bài lớn dùng, nên lưu bảng để giải một lần."],
  ["Vì sao nhân chuỗi ma trận không dùng tham lam được (ví dụ luôn nhân cặp có chi phí nhỏ nhất trước)?", "Lựa chọn cục bộ tốt có thể làm kích thước ma trận trung gian xấu cho các bước sau. QHĐ thử mọi k nên luôn đúng; bộ test so với vét cạn trên 200 chuỗi ngẫu nhiên để khẳng định."],
  ["Tại sao chi phí phép nhân cuối không phụ thuộc cách đặt ngoặc bên trong?", "Tích Ai..Ak luôn có kích thước dᵢ × dₖ₊₁ (số hàng của ma trận đầu × số cột của ma trận cuối), bất kể thứ tự nhân. Đây là mấu chốt của chứng minh cắt–dán."],
  ["Thứ tự điền bảng có thể khác không?", "Được, miễn là ô phụ thuộc đã có. Nhân chuỗi ma trận: theo đường chéo, hoặc i giảm dần và j tăng dần. LCS/NW: theo hàng, theo cột hoặc theo đường chéo phụ."],
  ["Bottom-up và top-down cái nào tốt hơn?", "Cùng độ phức tạp. Bottom-up không tốn ngăn xếp đệ quy và dễ tối ưu bộ nhớ (hai hàng); top-down chỉ giải các bài toán con thực sự cần và viết gần công thức hơn. Code có cả hai (matrix_chain, matrix_chain_memo)."],
  ["LCS có duy nhất không?", "Không. Độ dài thì duy nhất, chuỗi thì có thể nhiều; quy tắc phá hòa (`>=` → ưu tiên đi lên) quyết định chuỗi nào được in ra."],
  ["Truy vết bằng mũi tên và truy vết bằng so sánh giá trị khác gì?", "Mũi tên: tốn thêm một bảng nhưng truy vết đơn giản, không tính lại. So sánh giá trị (như sách, như sw_align): không cần bảng phụ nhưng phải tính lại điều kiện. Cả hai O(n+m)."],
  ["Vì sao dùng thời gian NHỎ NHẤT của 3 lần chạy?", "Thời gian đo bị nhiễu tăng thêm bởi tiến trình khác; giá trị nhỏ nhất gần với chi phí thật của thuật toán nhất."],
  ["Kết quả vét cạn n = 15 mất 2,3 s, vậy n = 20 mất bao lâu?", "Mỗi ma trận nhân thời gian khoảng 3 lần: 2,3 × 3⁵ ≈ 560 s ≈ 9 phút; n = 30 thì khoảng 3,8 năm. QHĐ với n = 30 vẫn dưới 1 ms."],
  ["Vì sao thí nghiệm numpy nhanh 30 lần chứ không phải 679 lần?", "BLAS tối ưu nhân ma trận lớn rất tốt (dùng cache, SIMD, đa luồng), còn ma trận × vectơ bị giới hạn bởi tốc độ đọc bộ nhớ. Số phép nhân không phải yếu tố duy nhất của thời gian thực."],
  ["Vì sao Hirschberg lại chạy nhanh hơn bảng đầy đủ trong khi lý thuyết làm gấp đôi?", "Cài đặt bảng đầy đủ tạo một bộ (điểm, mũi tên) cho mỗi ô và cấp phát hai bảng lớn; Hirschberg chỉ có vòng lặp gọn trên list nhỏ. Hằng số và cấp phát bộ nhớ ảnh hưởng thời gian thực; về bậc thì cả hai O(n·m)."],
  ["Dữ liệu giả lập có đáng tin không? Sao không dùng gen thật?", "Giả lập cho phép BIẾT TRƯỚC ĐÁP ÁN (vị trí, loại đột biến; vị trí gen) nên kiểm tra được thuật toán có đúng không – điều gen thật không cho. Bước tiếp theo là chạy trên trình tự thật từ GenBank."],
  ["Đột biến hỗn hợp cài xóa ở vị trí 20, sao chương trình báo 18?", "Gen gốc có đoạn lặp GTGT ở 18–21; xóa GT ở 18 hay 20 cho cùng một chuỗi, hai căn chỉnh bằng điểm. Phân tích biến dị thực tế quy ước đẩy indel về vị trí trái nhất (left-normalization)."],
  ["Hệ điểm +1/−1/−2 lấy từ đâu? Đổi thì sao?", "Là hệ điểm minh họa phổ biến. Đổi hệ điểm thì căn chỉnh tối ưu có thể khác. Thực tế dùng ma trận thay thế thống kê (BLOSUM, PAM cho protein) và phạt affine."],
  ["Phạt affine khác tuyến tính thế nào?", "Tuyến tính: mỗi gạch trừ như nhau → 4 gạch rời = 4 gạch liền. Affine: mở −4, kéo dài −1 → một đoạn liền rẻ hơn nhiều đoạn rời, sát sinh học hơn. Cần 3 bảng (M, Ix, Iy), vẫn O(n·m)."],
  ["Smith–Waterman có phải luôn tìm được gen?", "Nó luôn tìm đoạn có điểm căn chỉnh cục bộ cao nhất. Nếu gen đột biến quá nhiều hoặc có đoạn ngẫu nhiên giống tình cờ thì có thể sai; thực tế đánh giá bằng ý nghĩa thống kê của điểm (E-value trong BLAST)."],
  ["Có cách nào nhanh hơn O(n·m) cho căn chỉnh không?", "Trong trường hợp tổng quát thì không biết thuật toán nhanh hơn đáng kể. Thực tế dùng: dải chéo O(n·w) khi hai chuỗi giống nhau, song song theo đường chéo phụ / SIMD / GPU, heuristic hạt giống (BLAST)."],
  ["Có cách nào nhanh hơn O(n³) cho nhân chuỗi ma trận không?", "Có: Hu–Shing O(n log n), nhưng rất phức tạp. Với n thực tế nhỏ (vài chục) thì O(n³) chạy dưới 1 ms nên không cần."],
  ["Bộ nhớ nhân chuỗi ma trận có tối ưu như hai hàng được không?", "Không trực tiếp: N[i][j] cần cả hàng i lẫn cột j ở mọi độ dài nhỏ hơn. Có thể lưu nửa tam giác (giảm một nửa) – nhưng n² với n nhỏ không phải vấn đề."],
  ["Code tham khảo AI, bạn có hiểu không?", "Trả lời bằng cách chỉ vào code: mỗi hàm có tương ứng một công thức trong báo cáo; bộ test so với vét cạn; có thể sửa trực tiếp (ví dụ đổi thứ tự cands để đổi luật phá hòa, đổi `>=` thành `>` trong lcs_solution) và chạy lại để cho thấy kết quả thay đổi như dự đoán."],
];
qa.forEach(([q, a], i) => add(B.pn(`**Câu ${i + 1}. ${q}**`), B.p(a)));

// ------------------------------------------------------------------ 6. CHECKLIST
add(B.chapter("6. Checklist trước buổi trình bày"), B.setChap(6));
add(B.bullets([
  "Đã chạy `python -m unittest discover -s tests` trên máy trình bày: 12 OK.",
  "Đã chạy thử `python demo.py 2` và `python demo.py 4`; terminal phóng to đủ đọc.",
  "Mở slide ở chế độ Present, kiểm tra ghi chú người nói hiển thị trên màn hình phụ (hoặc in Mục 2 ra giấy).",
  "Tự tính tay được: 10.400/3.000; ô N[0][2] = 7.875; truy vết S ra cây; điểm căn chỉnh 3.",
  "Nói được chứng minh cắt–dán trong 30 giây không nhìn slide.",
  "Giải thích được 4 điểm ①–④ trong code nhân chuỗi và luật phá hòa trong code NW.",
  "Điền tên trường, giảng viên, lớp trên bìa báo cáo; cập nhật mục lục (Word: chuột phải mục lục → Update Field).",
]));

const doc = buildDoc(cover, body);
Packer.toBuffer(doc).then((buf) => {
  const out = path.join(ROOT, "SoTay_ThuyetTrinh_DeTai16.docx");
  fs.writeFileSync(out, buf);
  console.log("OK", out, buf.length);
});
