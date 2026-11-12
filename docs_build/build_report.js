// Dựng BÁO CÁO Word cho Đề tài 16. Chạy: node docs_build/build_report.js
const fs = require("fs");
const path = require("path");
const { B, buildDoc, d } = require("./docxlib");
const { Paragraph, TextRun, AlignmentType, Packer } = d;
const ROOT = path.resolve(__dirname, "..");

// ---- lấy NGUYÊN VĂN hàm Python từ mã nguồn (để code trong báo cáo = code chạy thật) ----
function fn(file, name) {
  const lines = fs.readFileSync(path.join(ROOT, "src", file), "utf8").split("\n");
  const start = lines.findIndex((l) => l.startsWith(`def ${name}(`));
  if (start < 0) throw new Error(name);
  let end = start + 1;
  while (end < lines.length && (lines[end] === "" || /^\s/.test(lines[end]))) end++;
  while (lines[end - 1].trim() === "") end--;
  return lines.slice(start, end).join("\n");
}
function csv(name) {
  return fs.readFileSync(path.join(ROOT, "results", name), "utf8").trim().split("\n").map((l) => l.split(","));
}
const fmt = (x) => Number(x).toLocaleString("de-DE");
const sec = (x) => { const v = Number(x); return v >= 0.01 ? v.toFixed(3).replace(".", ",") : v.toExponential(1).replace(".", ","); };

const e1 = csv("e1_matrix_chain.csv"), e2 = csv("e2_lcs.csv"), e3 = csv("e3_alignment.csv");
const e4 = csv("e4_memory.csv"), e5 = csv("e5_numpy.csv");
const envTxt = fs.readFileSync(path.join(ROOT, "results", "environment.txt"), "utf8").trim();

// =====================================================================================
// BÌA
// =====================================================================================
const cover = [
  ...B.center("[TÊN TRƯỜNG / VIỆN]", { bold: true, size: 28 }),
  ...B.center("[TÊN KHOA]", { bold: true, size: 28 }),
  ...B.center("──────── ✦ ────────", { after: 600 }),
  ...B.blank(2),
  ...B.center("BÁO CÁO ĐỀ TÀI", { bold: true, size: 36 }),
  ...B.center("Học phần: [Cấu trúc dữ liệu và giải thuật]", { size: 28, before: 120 }),
  ...B.blank(2),
  ...B.center("ĐỀ TÀI 16", { bold: true, size: 30 }),
  ...B.center("QUY HOẠCH ĐỘNG NÂNG CAO:", { bold: true, size: 34, before: 120 }),
  ...B.center("NHÂN CHUỖI MA TRẬN VÀ", { bold: true, size: 34 }),
  ...B.center("CĂN CHỈNH TRÌNH TỰ DNA (SEQUENCE ALIGNMENT)", { bold: true, size: 34 }),
  ...B.blank(3),
  new Paragraph({ indent: { left: 2600 }, children: [new TextRun({ text: "Giảng viên hướng dẫn:  [Họ và tên]", size: 28 })] }),
  new Paragraph({ indent: { left: 2600 }, children: [new TextRun({ text: "Học viên thực hiện:     Nguyễn Hữu Văn", size: 28 })] }),
  new Paragraph({ indent: { left: 2600 }, children: [new TextRun({ text: "                                   [Thành viên khác, nếu có]", size: 28 })] }),
  new Paragraph({ indent: { left: 2600 }, children: [new TextRun({ text: "Lớp:                           [Mã lớp]", size: 28 })] }),
  ...B.blank(4),
  ...B.center("[Địa điểm], tháng 10 năm 2026", { italics: true, size: 26 }),
];

// =====================================================================================
// THÂN BÁO CÁO
// =====================================================================================
const body = [];
const add = (...xs) => xs.forEach((x) => body.push(...x));

add(B.toc());

// ---------------------------------------------------------------- MỞ ĐẦU
add(B.chapter("Mở đầu"), B.setChap(0));
add(B.p("Nhiều bài toán tối ưu có không gian lời giải tăng theo hàm mũ: số cách đặt dấu ngoặc cho một tích n ma trận, hay số cách căn chỉnh hai đoạn DNA, đều vượt hàng tỉ ngay khi n chỉ cỡ vài chục. Quy hoạch động (QHĐ) là kỹ thuật biến những bài toán \"có vẻ cần thời gian mũ\" đó thành thuật toán đa thức, thường chỉ bằng vài vòng lặp lồng nhau điền vào một bảng [1, tr. 594]."));
add(B.p("Đề tài trình bày hai bài toán kinh điển của Mục 13.3 sách *Data Structures and Algorithms in Python* [1]: **nhân chuỗi ma trận** (Matrix Chain-Product) và **căn chỉnh trình tự DNA** (bắt đầu từ bài toán dãy con chung dài nhất LCS của sách, mở rộng sang thuật toán Needleman–Wunsch [3] và Smith–Waterman [4] dùng trong sinh học phân tử)."));
add(B.pn("**Mục tiêu của đề tài:**"));
add(B.bullets([
  "Nắm vững kỹ thuật QHĐ cho bài toán có cấu trúc con tối ưu và bài toán con chồng lấp.",
  "Xây dựng công thức truy hồi, bảng QHĐ và thủ tục **truy vết ngược (backtracking)** cho cả hai bài toán.",
  "Chứng minh tính tối ưu của cấu trúc con; phân tích độ phức tạp thời gian và không gian.",
  "Cài đặt bằng Python, kiểm thử và **so sánh thực nghiệm với vét cạn**; minh họa ứng dụng phân tích gen và tối ưu hóa tài nguyên tính toán.",
  "Chỉ ra hạn chế và các hướng tối ưu bộ nhớ (2 hàng, Hirschberg, dải chéo), mở rộng phạt khoảng trống affine.",
]));
add(B.pn("**Sản phẩm kèm theo:** mã nguồn (thư mục `src/`, `tests/`, `experiments/`, `visualize/`, `demo.py`), bộ dữ liệu giả lập (`data/`), kết quả thực nghiệm (`results/`), slide trình bày và sổ tay thuyết trình."));

// ---------------------------------------------------------------- CHƯƠNG 1
add(B.chapter("Chương 1. Tổng quan về quy hoạch động"), B.setChap(1));
add(B.h2("1.1. Định nghĩa"));
add(B.p("**Quy hoạch động** (dynamic programming, Bellman 1957 [7]) là kỹ thuật thiết kế thuật toán giải bài toán tối ưu bằng cách (i) chia bài toán thành các **bài toán con** được tham số hóa bởi vài chỉ số, (ii) biểu diễn lời giải tối ưu của bài toán lớn qua lời giải tối ưu của bài toán con bằng một **công thức truy hồi**, và (iii) giải mỗi bài toán con **đúng một lần**, lưu kết quả vào bảng để dùng lại."));
add(B.p("Theo [1, tr. 597], QHĐ áp dụng được khi bài toán có ba tính chất:"));
add(B.bullets([
  "**Bài toán con đơn giản** (simple subproblems): có cách chia lặp lại bài toán thành bài toán con, mỗi bài toán con mô tả bằng vài chỉ số i, j, k.",
  "**Tối ưu bài toán con** (subproblem optimization – cấu trúc con tối ưu): lời giải tối ưu toàn cục được ghép từ các lời giải tối ưu của bài toán con.",
  "**Chồng lấp bài toán con** (subproblem overlap): các bài toán con khác nhau dùng chung bài toán con nhỏ hơn – đây là chỗ \"lưu bảng\" tiết kiệm được thời gian.",
]));
add(B.h2("1.2. Động lực: vì sao cần quy hoạch động"));
add(B.p("Cách tự nhiên nhất để giải bài toán tối ưu là **vét cạn**: liệt kê mọi lời giải ứng viên rồi chọn cái tốt nhất. Với hai bài toán của đề tài, số ứng viên tăng theo hàm mũ: số cách đặt ngoặc cho n ma trận là số Catalan C(n−1) ≈ 4ⁿ/(n^1,5·√π), số cách căn chỉnh hai chuỗi dài n là số Delannoy D(n, n) ≈ 5,83ⁿ. Ngay cả đệ quy \"thông minh\" (chọn điểm chia tốt nhất ở mỗi bước) cũng vẫn mũ nếu không nhớ kết quả, vì cùng một bài toán con bị giải lặp lại rất nhiều lần (Hình 1.1). QHĐ loại bỏ sự lặp lại này."));
add(B.img("figures/fig03_overlap.png", 15.5, "Cây đệ quy vét cạn cho A0..A3: cùng màu là cùng một bài toán con bị giải lại"));
add(B.h2("1.3. Quy trình bốn bước thiết kế thuật toán QHĐ"));
add(B.img("figures/fig15_dp_recipe.png", 15.5, "Bốn bước thiết kế thuật toán quy hoạch động áp dụng xuyên suốt đề tài"));
add(B.nums([
  "**Định nghĩa bài toán con** bằng chỉ số: N[i][j] cho nhân chuỗi ma trận, L[j][k] cho LCS, F[i][j] cho căn chỉnh.",
  "**Lập công thức truy hồi**: giá trị tối ưu = min/max trên các lựa chọn ở \"bước cuối cùng\" (phép nhân cuối, cột căn chỉnh cuối).",
  "**Điền bảng theo thứ tự bottom-up**: bài toán con nhỏ trước, lớn sau, sao cho khi tính ô nào thì các ô nó phụ thuộc đã có.",
  "**Truy vết ngược**: từ ô đáp án đi ngược theo các lựa chọn đã thắng để dựng lại lời giải (cách đặt ngoặc, chuỗi căn chỉnh) chứ không chỉ giá trị.",
], "num1"));
add(B.h2("1.4. So sánh với chia để trị và tham lam"));
add(B.table([
  ["Tiêu chí", "Chia để trị", "Tham lam", "Quy hoạch động"],
  ["Bài toán con", "Độc lập, không chồng lấp", "Chỉ đi theo 1 lựa chọn", "Chồng lấp, dùng lại nhiều lần"],
  ["Cách chọn", "Không chọn – gộp kết quả", "Chọn tốt nhất cục bộ, không quay lại", "Thử mọi lựa chọn, lấy min/max"],
  ["Bảo đảm tối ưu", "–", "Chỉ khi có tính chất tham lam", "Có, khi có cấu trúc con tối ưu"],
  ["Ví dụ", "Merge sort", "Huffman (Mục 13.4 [1])", "Nhân chuỗi ma trận, LCS"],
], [2000, 2300, 2400, 2370], "So sánh quy hoạch động với hai kỹ thuật thiết kế thuật toán khác"));
add(B.p("Có hai cách cài đặt QHĐ: **bottom-up** (vòng lặp điền bảng – cách của sách, dùng trong đề tài) và **top-down có nhớ** (memoization – đệ quy như vét cạn nhưng lưu kết quả). Hai cách có cùng độ phức tạp; mã nguồn có cả hai (`matrix_chain` và `matrix_chain_memo`) để đối chiếu."));

// ---------------------------------------------------------------- CHƯƠNG 2
add(B.chapter("Chương 2. Bài toán nhân chuỗi ma trận"), B.setChap(2));
add(B.h2("2.1. Phát biểu bài toán và động lực"));
add(B.p("Cho n ma trận A₀, A₁, …, Aₙ₋₁, trong đó Aᵢ có kích thước dᵢ × dᵢ₊₁ (cả chuỗi được mô tả bằng một dãy d gồm n + 1 số). Nhân ma trận p × q với ma trận q × r theo định nghĩa tốn **p·q·r phép nhân vô hướng**. Vì phép nhân ma trận có tính kết hợp, mọi cách đặt ngoặc đều cho **cùng một kết quả**, nhưng số phép nhân lại có thể chênh lệch rất lớn."));
add(B.p("**Ví dụ 13.4 [1].** B là 2 × 10, C là 10 × 50, D là 50 × 20. Tính B·(C·D) tốn 10·50·20 + 2·10·20 = 10.400 phép nhân; tính (B·C)·D chỉ tốn 2·10·50 + 2·50·20 = 3.000 phép nhân – ít hơn 3,5 lần (Hình 2.1)."));
add(B.img("figures/fig01_vd13_4.png", 15.5, "Ví dụ 13.4: cùng kết quả nhưng chi phí hai cách đặt ngoặc chênh 3,5 lần"));
add(B.p("**Bài toán:** tìm cách đặt ngoặc biểu thức A = A₀·A₁·…·Aₙ₋₁ sao cho tổng số phép nhân vô hướng là nhỏ nhất. Đầu ra gồm (1) chi phí tối thiểu và (2) cách đặt ngoặc đạt chi phí đó."));
add(B.h3("Vét cạn và sự bùng nổ tổ hợp"));
add(B.p("Số cách đặt ngoặc P(n) thỏa P(1) = 1, P(n) = Σₖ₌₁ⁿ⁻¹ P(k)·P(n−k) (chọn vị trí phép nhân cuối cùng, rồi đặt ngoặc độc lập hai bên). Nghiệm là số Catalan P(n) = C(n−1) = (2n−2)! / (n!·(n−1)!) = Ω(4ⁿ/n^1,5), đúng bằng số cây nhị phân có n lá [1, tr. 595]. Với n = 25 đã có khoảng 1,29·10¹² cách (Hình 2.2), nên vét cạn là bất khả thi."));
add(B.img("figures/fig02_catalan.png", 14, "Số cách đặt ngoặc (vét cạn) tăng theo hàm mũ, trong khi QHĐ chỉ cần cỡ n³ bước"));

add(B.h2("2.2. Định nghĩa bài toán con"));
add(B.p("Gọi **N[i][j]** (0 ≤ i ≤ j ≤ n−1) là số phép nhân vô hướng **tối thiểu** để tính tích con Aᵢ·Aᵢ₊₁·…·Aⱼ. Bài toán gốc là tính N[0][n−1]. Có n(n+1)/2 bài toán con – chỉ là đa thức. Để dựng lại cách đặt ngoặc, ta lưu thêm **S[i][j]** = vị trí k của phép nhân cuối cùng trong lời giải tối ưu của N[i][j]."));

add(B.h2("2.3. Chứng minh tính tối ưu của cấu trúc con"));
add(B.p("**Nhận xét 1 (phép nhân cuối cùng).** Mọi cách đặt ngoặc đầy đủ của Aᵢ…Aⱼ (i < j) đều có một phép nhân thực hiện **sau cùng**, có dạng (Aᵢ…Aₖ)·(Aₖ₊₁…Aⱼ) với k ∈ {i, …, j−1}. Tích bên trái luôn có kích thước dᵢ × dₖ₊₁, tích bên phải luôn là dₖ₊₁ × dⱼ₊₁, **bất kể** bên trong được đặt ngoặc thế nào. Do đó chi phí phép nhân cuối là dᵢ·dₖ₊₁·dⱼ₊₁ – chỉ phụ thuộc k."));
add(B.p("**Bổ đề (cấu trúc con tối ưu).** Nếu P là cách đặt ngoặc tối ưu của Aᵢ…Aⱼ và phép nhân cuối của P tách tại k, thì phần P_L ứng với Aᵢ…Aₖ là cách đặt ngoặc tối ưu của Aᵢ…Aₖ, và phần P_R ứng với Aₖ₊₁…Aⱼ là tối ưu cho Aₖ₊₁…Aⱼ."));
add(B.p("*Chứng minh (phản chứng – kỹ thuật \"cắt và dán\").* Chi phí của P là cost(P) = cost(P_L) + cost(P_R) + dᵢ·dₖ₊₁·dⱼ₊₁. Giả sử P_L không tối ưu, tức tồn tại P'_L cho Aᵢ…Aₖ với cost(P'_L) < cost(P_L). Thay P_L bằng P'_L trong P (\"cắt\" P_L, \"dán\" P'_L), ta được cách đặt ngoặc hợp lệ P' của Aᵢ…Aⱼ. Theo Nhận xét 1, số hạng dᵢ·dₖ₊₁·dⱼ₊₁ không đổi, nên cost(P') = cost(P'_L) + cost(P_R) + dᵢ·dₖ₊₁·dⱼ₊₁ < cost(P) – mâu thuẫn với tính tối ưu của P. Lập luận tương tự cho P_R. ∎"));
add(B.p("**Định lý (đúng đắn của công thức truy hồi).** Với mọi 0 ≤ i ≤ j ≤ n−1:"));
add(B.formulas([
  "N[i][i] = 0",
  "N[i][j] = min { N[i][k] + N[k+1][j] + dᵢ · dₖ₊₁ · dⱼ₊₁ :  i ≤ k < j },   với i < j",
]));
add(B.p("*Chứng minh* (quy nạp theo độ dài b = j − i). Với b = 0, một ma trận không cần phép nhân nào nên N[i][i] = 0. Giả sử công thức đúng với mọi chuỗi con ngắn hơn b. (≥) Theo Bổ đề, lời giải tối ưu tách tại một k* nào đó và hai nửa đều tối ưu, nên giá trị tối ưu bằng N[i][k*] + N[k*+1][j] + dᵢdₖ*₊₁dⱼ₊₁ ≥ vế phải (vì vế phải là min trên mọi k). (≤) Với mỗi k, ghép lời giải tối ưu của hai nửa cho một cách đặt ngoặc hợp lệ có chi phí đúng bằng số hạng thứ k, nên giá trị tối ưu ≤ mọi số hạng, tức ≤ min. Vậy dấu bằng xảy ra. ∎"));
add(B.p("**Chồng lấp bài toán con.** Bài toán con N[1][2] được dùng bởi cả N[0][2] lẫn N[1][3]; nói chung N[i][j] được dùng bởi mọi N[i'][j'] chứa nó. Vì vậy không thể chia để trị độc lập mà phải lưu bảng [1, tr. 596]."));

add(B.h2("2.4. Mô tả giải thuật chi tiết"));
add(B.h3("Thứ tự điền bảng"));
add(B.p("N[i][j] chỉ phụ thuộc vào các ô có chuỗi con **ngắn hơn** (N[i][k] và N[k+1][j]). Vì vậy ta điền bảng **theo từng đường chéo** b = j − i = 1, 2, …, n−1: đường chéo b = 0 bằng 0, sau đó các ô N[i][i+1], rồi N[i][i+2], … cho đến N[0][n−1] ở góc trên bên phải (Hình 2.3)."));
add(B.h3("Mã giả"));
add(B.code(
`THUẬT TOÁN MatrixChain(d[0..n])            ▷ Aᵢ có kích thước d[i] × d[i+1]
  n ← len(d) − 1
  for i ← 0 to n−1 do  N[i][i] ← 0
  for b ← 1 to n−1 do                          ▷ độ dài chuỗi con − 1
      for i ← 0 to n−1−b do                    ▷ điểm đầu
          j ← i + b                            ▷ điểm cuối
          N[i][j] ← +∞
          for k ← i to j−1 do                  ▷ thử mọi vị trí phép nhân cuối
              q ← N[i][k] + N[k+1][j] + d[i]·d[k+1]·d[j+1]
              if q < N[i][j] then
                  N[i][j] ← q ;  S[i][j] ← k   ▷ ghi nhớ lựa chọn thắng
  return N, S

THUẬT TOÁN Parenthesize(S, i, j)             ▷ TRUY VẾT NGƯỢC
  if i = j then return "Aᵢ"
  k ← S[i][j]
  return "(" + Parenthesize(S, i, k) + " × " + Parenthesize(S, k+1, j) + ")"`, "Mã giả QHĐ bottom-up và truy vết cho bài toán nhân chuỗi ma trận"));
add(B.h3("Ví dụ minh họa đầy đủ"));
add(B.p("Xét 6 ma trận với d = [30, 35, 15, 5, 10, 20, 25] (ví dụ kinh điển trong [2]). Một vài ô tiêu biểu:"));
add(B.bullets([
  "b = 1: N[0][1] = 30·35·15 = 15.750; N[1][2] = 35·15·5 = 2.625; N[2][3] = 750; N[3][4] = 1.000; N[4][5] = 5.000.",
  "b = 2: N[0][2] = min{ N[0][0]+N[1][2]+30·35·5 = 7.875 (k=0);  N[0][1]+N[2][2]+30·15·5 = 18.000 (k=1) } = **7.875**, S[0][2] = 0.",
  "b = 2: N[3][5] = min{ 0 + 5.000 + 5·10·25 = 6.250 (k=3);  1.000 + 0 + 5·20·25 = 3.500 (k=4) } = **3.500**, S[3][5] = 4.",
  "b = 5: N[0][5] = min trên k = 0..4; giá trị nhỏ nhất đạt tại k = 2: N[0][2] + N[3][5] + 30·5·25 = 7.875 + 3.500 + 3.750 = **15.125**.",
]));
add(B.img("figures/fig04_mc_table.png", 13, "Bảng N[i][j] và S[i][j] (k=…) cho d = [30, 35, 15, 5, 10, 20, 25]; khung cam là các ô dùng khi truy vết"));
add(B.p("**Truy vết ngược:** S[0][5] = 2 ⇒ (A₀..A₂)·(A₃..A₅); S[0][2] = 0 ⇒ A₀·(A₁..A₂); S[1][2] = 1 ⇒ A₁·A₂; S[3][5] = 4 ⇒ (A₃..A₄)·A₅; S[3][4] = 3 ⇒ A₃·A₄. Kết quả: **((A₀·(A₁·A₂))·((A₃·A₄)·A₅))** với 15.125 phép nhân, so với 40.500 nếu nhân tuần tự từ trái sang phải (Hình 2.4)."));
add(B.img("figures/fig05_mc_tree.png", 15, "Cây nhân tối ưu dựng từ bảng S; mỗi nút × ghi chi phí phép nhân tại nút đó"));

add(B.h2("2.5. Phân tích độ phức tạp"));
add(B.p("**Thời gian.** Vòng trong cùng (biến k) chạy b lần cho mỗi cặp (i, j) có j − i = b, và có n − b cặp như vậy. Tổng số lần thử k là"));
add(B.formula("T(n) = Σ_{b=1}^{n−1} (n − b)·b = (n³ − n)/6 = Θ(n³)"));
add(B.p("(ví dụ n = 6 cho 35 lần thử, khớp cột \"QHD_so_lan_thu_k\" trong kết quả thực nghiệm). Mỗi lần thử O(1), nên thời gian là **Θ(n³)** [1, tr. 596]. Truy vết thăm mỗi nút trong của cây đúng một lần: **O(n)**."));
add(B.p("**Không gian.** Hai bảng N và S kích thước n × n: **Θ(n²)**."));
add(B.p("**Vét cạn.** Hàm đệ quy không nhớ `matrix_chain_brute` có số lời gọi C(n) thỏa C(1) = 1, C(n) = 1 + Σₖ₌₁ⁿ⁻¹ [C(k) + C(n−k)] = 1 + 2·Σₜ₌₁ⁿ⁻¹ C(t). Trừ hai đẳng thức liên tiếp được C(n) − C(n−1) = 2·C(n−1), tức C(n) = 3·C(n−1) ⇒ **C(n) = 3ⁿ⁻¹**. Thực nghiệm đếm được đúng 4.782.969 = 3¹⁴ lời gọi khi n = 15. Nếu liệt kê toàn bộ cách đặt ngoặc thì cần Ω(4ⁿ/n^1,5)."));
add(B.table([
  ["Phương pháp", "Thời gian", "Bộ nhớ", "Ghi chú"],
  ["Liệt kê mọi cách đặt ngoặc", "Θ(n · C(n−1)) = Ω(4ⁿ/n^1,5)", "O(n)", "Số Catalan"],
  ["Đệ quy chọn k, không nhớ", "Θ(3ⁿ)", "O(n)", "3ⁿ⁻¹ lời gọi"],
  ["QHĐ top-down có nhớ", "Θ(n³)", "Θ(n²)", "Thêm chi phí đệ quy"],
  ["QHĐ bottom-up (sách)", "Θ(n³)", "Θ(n²)", "Cài đặt của đề tài"],
  ["Hu–Shing [8]", "O(n log n)", "O(n)", "Thuật toán chuyên biệt, phức tạp"],
], [3000, 2700, 1300, 2070], "Độ phức tạp các cách giải bài toán nhân chuỗi ma trận"));

// ---------------------------------------------------------------- CHƯƠNG 3
add(B.chapter("Chương 3. Căn chỉnh trình tự DNA"), B.setChap(3));
add(B.h2("3.1. Bối cảnh sinh học và động lực"));
add(B.p("DNA được biểu diễn như một chuỗi trên bảng chữ cái {A, C, G, T}. Qua tiến hóa hoặc ở các cá thể khác nhau, một gen có thể bị **thay thế** một base (SNP – đa hình đơn nucleotide), **chèn** hoặc **xóa** một đoạn base (indel). Để biết hai đoạn DNA giống nhau đến đâu và khác ở đâu, ta **căn chỉnh** (align) chúng: xếp hai chuỗi thành hai hàng, có thể chèn ký hiệu khoảng trống \"–\", sao cho các base tương ứng nằm cùng cột. Bài toán tương tự xuất hiện trong phần mềm: so sánh hai phiên bản mã nguồn (lệnh `diff` của Unix) [1, tr. 597]."));
add(B.p("Sách [1] tiếp cận qua bài toán **dãy con chung dài nhất (LCS)**; đề tài trình bày LCS đúng như sách, rồi tổng quát hóa thành **căn chỉnh toàn cục có hệ điểm** (Needleman–Wunsch [3]) và **căn chỉnh cục bộ** (Smith–Waterman [4]) – các thuật toán nền tảng của tin sinh học [10]."));

add(B.h2("3.2. Bài toán LCS"));
add(B.h3("Định nghĩa"));
add(B.p("Cho chuỗi X = x₀x₁…xₙ₋₁. Một **dãy con** của X là chuỗi xᵢ₁xᵢ₂…xᵢₖ với i₁ < i₂ < … < iₖ – các ký tự không nhất thiết liền nhau nhưng giữ đúng thứ tự. Bài toán LCS: cho X (độ dài n) và Y (độ dài m), tìm chuỗi dài nhất là dãy con của cả X và Y. Hình 3.1 là ví dụ Hình 13.8 của sách: LCS của GTTCCTAATA và CGATAATTGAGA có độ dài 6."));
add(B.img("figures/fig06_lcs_concept.png", 15.5, "LCS của X = GTTCCTAATA và Y = CGATAATTGAGA: các cặp ký tự chung được nối, không cắt chéo nhau"));
add(B.p("**Vét cạn:** X có 2ⁿ dãy con, mỗi dãy con kiểm tra có là dãy con của Y trong O(m) ⇒ **O(2ⁿ·m)** [1, tr. 597]."));
add(B.h3("Bài toán con và công thức truy hồi"));
add(B.p("Gọi **L[j][k]** là độ dài LCS của hai tiền tố X[0:j] (j ký tự đầu của X) và Y[0:k]. Hàng 0 và cột 0 ứng với chuỗi rỗng nên L[j][0] = L[0][k] = 0. Xét hai ký tự cuối xⱼ₋₁ và yₖ₋₁:"));
add(B.formulas([
  "L[j][k] = L[j−1][k−1] + 1                       nếu xⱼ₋₁ = yₖ₋₁",
  "L[j][k] = max( L[j−1][k],  L[j][k−1] )          nếu xⱼ₋₁ ≠ yₖ₋₁",
]));
add(B.h3("Chứng minh tính tối ưu của cấu trúc con"));
add(B.p("Gọi Z = z₁…z_r là một LCS của X[0:j] và Y[0:k]."));
add(B.p("**Trường hợp 1: xⱼ₋₁ = yₖ₋₁ = c.** (a) Có thể giả sử z_r = c: nếu z_r ≠ c thì ký tự cuối của Z được ghép với các vị trí trước xⱼ₋₁ và trước yₖ₋₁, ta nối thêm c vào Z được dãy con chung dài r + 1 – mâu thuẫn; nếu Z kết thúc bằng c nhưng ghép với vị trí sớm hơn thì ta chuyển phép ghép sang xⱼ₋₁, yₖ₋₁ mà Z không đổi [1, tr. 598]. (b) Khi đó z₁…z_{r−1} là dãy con chung của X[0:j−1] và Y[0:k−1]; nếu nó không dài nhất, tồn tại dãy con chung W dài hơn r − 1, và W + c là dãy con chung của X[0:j], Y[0:k] dài hơn r – mâu thuẫn. Vậy L[j][k] = L[j−1][k−1] + 1."));
add(B.p("**Trường hợp 2: xⱼ₋₁ ≠ yₖ₋₁.** Ký tự cuối của Z không thể vừa ghép với xⱼ₋₁ vừa ghép với yₖ₋₁, nên ít nhất một trong hai ký tự đó không được dùng: Z là dãy con chung của X[0:j−1] và Y[0:k], hoặc của X[0:j] và Y[0:k−1]. Do đó r ≤ max(L[j−1][k], L[j][k−1]); chiều ngược lại hiển nhiên vì LCS của tiền tố ngắn hơn cũng là dãy con chung của tiền tố dài hơn. ∎"));
add(B.h3("Mã giả và truy vết"));
add(B.code(
`THUẬT TOÁN LCS(X[0..n−1], Y[0..m−1])                  ▷ Code Fragment 13.6 [1]
  tạo bảng L[0..n][0..m] toàn 0
  for j ← 0 to n−1 do
      for k ← 0 to m−1 do
          if X[j] = Y[k] then L[j+1][k+1] ← L[j][k] + 1          ▷ đi chéo
          else L[j+1][k+1] ← max(L[j][k+1], L[j+1][k])            ▷ bỏ 1 ký tự
  return L

THUẬT TOÁN LCS_Solution(X, Y, L)                       ▷ Code Fragment 13.7 – TRUY VẾT
  S ← [ ] ;  j ← n ;  k ← m
  while L[j][k] > 0 do
      if X[j−1] = Y[k−1] then  thêm X[j−1] vào S ; j ← j−1 ; k ← k−1   ▷ chéo
      else if L[j−1][k] ≥ L[j][k−1] then j ← j−1                        ▷ lên
      else k ← k−1                                                         ▷ trái
  return đảo ngược(S)`, "Mã giả LCS và truy vết ngược theo sách"));
add(B.img("figures/fig07_lcs_table.png", 14, "Bảng L của ví dụ sách; mũi tên cam là đường truy vết, ô xanh đậm là bước chéo (ký tự chung)"));
add(B.p("Truy vết bắt đầu ở ô L[10][12] = 6. Mỗi bước chéo ghi nhận một ký tự chung; bước lên/trái đi theo ô có giá trị lớn hơn (ưu tiên \"lên\" khi bằng nhau – quy ước của sách). Đọc ngược các ký tự thu được ta có LCS = **GTTTAA**. Chú ý: LCS có thể **không duy nhất** – quy ước ưu tiên khác cho một LCS khác nhưng cùng độ dài."));
add(B.p("**Độ phức tạp:** điền bảng O(n·m) thời gian (hai vòng lặp lồng nhau, mỗi ô O(1)), bảng (n+1)(m+1) ô nên **O(n·m)** bộ nhớ; truy vết **O(n + m)** vì mỗi bước giảm j hoặc k [1, tr. 599–600]."));

add(B.h2("3.3. Căn chỉnh toàn cục Needleman–Wunsch"));
add(B.h3("Hệ điểm và định nghĩa"));
add(B.p("LCS chỉ đếm số ký tự chung. Trong sinh học, ta cần chấm điểm cả **thay thế** và **khoảng trống**. Một **căn chỉnh** của X và Y là hai chuỗi X', Y' cùng độ dài, thu được bằng cách chèn \"–\" vào X và Y, không có cột nào gồm hai dấu \"–\". Điểm của căn chỉnh là tổng điểm các cột. Đề tài dùng hệ điểm: **khớp +1, thay thế −1, khoảng trống −2**. Bài toán: tìm căn chỉnh có điểm **lớn nhất**."));
add(B.p("Gọi **F[i][j]** là điểm căn chỉnh tốt nhất của X[0:i] và Y[0:j]. Cột cuối cùng của một căn chỉnh chỉ có thể là một trong ba loại (Hình 3.3):"));
add(B.img("figures/fig08_three_moves.png", 14.5, "Ba khả năng cho cột cuối cùng của căn chỉnh tương ứng ba hướng đi vào ô F[i][j]"));
add(B.formulas([
  "F[0][0] = 0 ;   F[i][0] = i·g ;   F[0][j] = j·g                 (g = −2)",
  "F[i][j] = max {  F[i−1][j−1] + s(xᵢ₋₁, yⱼ₋₁)     ▷ chéo : khớp / thay thế",
  "                 F[i−1][j]   + g                 ▷ xuống: xᵢ₋₁ ghép với –",
  "                 F[i][j−1]   + g  }              ▷ ngang: – ghép với yⱼ₋₁",
]));
add(B.p("**Chứng minh cấu trúc con tối ưu.** Xét căn chỉnh tối ưu A của X[0:i], Y[0:j]. Bỏ cột cuối của A ta được căn chỉnh A' của cặp tiền tố tương ứng với loại cột cuối (ví dụ X[0:i−1], Y[0:j−1] nếu cột cuối là cặp xᵢ₋₁/yⱼ₋₁). Vì điểm là **tổng theo cột**, score(A) = score(A') + điểm(cột cuối). Nếu A' không tối ưu cho cặp tiền tố đó thì thay bằng căn chỉnh tốt hơn A'' rồi nối lại cột cuối, ta được căn chỉnh tốt hơn A – mâu thuẫn. Vậy F[i][j] bằng max của ba trường hợp. ∎"));
add(B.p("**LCS là trường hợp riêng:** với hệ điểm khớp = 1, thay thế = 0, khoảng trống = 0, điểm căn chỉnh tối ưu đúng bằng độ dài LCS (mã nguồn kiểm thử điều này trên 100 cặp ngẫu nhiên)."));
add(B.h3("Mã giả"));
add(B.code(
`THUẬT TOÁN NeedlemanWunsch(X[0..n−1], Y[0..m−1], khớp, thay_thế, g)
  F[0][0] ← 0
  for i ← 1 to n do  F[i][0] ← i·g ;  P[i][0] ← "↑"
  for j ← 1 to m do  F[0][j] ← j·g ;  P[0][j] ← "←"
  for i ← 1 to n do
      for j ← 1 to m do
          s ← (X[i−1] = Y[j−1]) ? khớp : thay_thế
          (F[i][j], P[i][j]) ← max theo điểm của
                ( F[i−1][j−1] + s , "↖" ),       ▷ thứ tự ưu tiên khi hòa:
                ( F[i−1][j]   + g , "↑" ),       ▷   chéo > lên > trái
                ( F[i][j−1]   + g , "←" )
  return F, P

THUẬT TOÁN Traceback(X, Y, P)                       ▷ TRUY VẾT NGƯỢC
  i ← n ; j ← m ; X' ← "" ; Y' ← ""
  while i > 0 or j > 0 do
      if P[i][j] = "↖" then  X' ← X[i−1] + X' ; Y' ← Y[j−1] + Y' ; i−− ; j−−
      else if P[i][j] = "↑" then  X' ← X[i−1] + X' ; Y' ← "–" + Y' ; i−−
      else  X' ← "–" + X' ; Y' ← Y[j−1] + Y' ; j−−
  return X', Y'`, "Mã giả Needleman–Wunsch với bảng mũi tên P và truy vết ngược"));
add(B.p("Khác với LCS của sách (truy vết bằng cách so sánh lại giá trị), ở đây ta **lưu mũi tên** P[i][j] ngay khi điền bảng. Cách này làm truy vết đơn giản, không phải tính lại điểm, và cho phép kiểm soát quy tắc phá hòa. Hình 3.4 minh họa với X = ACGGTAG, Y = ACTGTCAG: đường truy vết đi chéo 5 bước, một bước ngang (khoảng trống trong X đối diện C), rồi chéo 2 bước. Căn chỉnh thu được có 6 cột khớp, 1 thay thế G/T và 1 khoảng trống: điểm = 6 − 1 − 2 = 3 = F[7][8]."));
add(B.img("figures/fig09_nw_table.png", 13.5, "Bảng F của Needleman–Wunsch, ký hiệu nhỏ là mũi tên lưu trong P; ô xanh là đường truy vết; bên dưới là căn chỉnh thu được"));
add(B.h3("Số căn chỉnh và vét cạn"));
add(B.p("Mỗi căn chỉnh tương ứng một đường đi từ (0,0) tới (n,m) trên lưới với ba loại bước →, ↓, ↘. Số đường đi này là **số Delannoy** D(n, m), thỏa D(i, j) = D(i−1, j) + D(i, j−1) + D(i−1, j−1). Với n = m = 10 đã có 8.097.453 căn chỉnh; D(n, n) tăng xấp xỉ (3 + 2√2)ⁿ ≈ 5,83ⁿ. Hàm `nw_brute` duyệt mọi căn chỉnh bằng đệ quy không nhớ."));

add(B.h2("3.4. Căn chỉnh cục bộ Smith–Waterman"));
add(B.p("Khi cần tìm một **đoạn** giống nhau nằm bên trong hai chuỗi dài (ví dụ tìm một gen trong hệ gen), căn chỉnh toàn cục không phù hợp vì nó phạt toàn bộ phần dư hai đầu. Smith–Waterman [4] sửa ba điểm: (1) thêm lựa chọn **0** vào công thức – \"bắt đầu lại từ đầu\" nếu điểm âm; (2) hàng 0, cột 0 bằng 0; (3) truy vết bắt đầu từ **ô có điểm lớn nhất** và dừng khi gặp ô bằng 0. Độ phức tạp vẫn O(n·m)."));
add(B.formula("H[i][j] = max { 0,  H[i−1][j−1] + s(xᵢ₋₁, yⱼ₋₁),  H[i−1][j] + g,  H[i][j−1] + g }"));

add(B.h2("3.5. Phân tích độ phức tạp"));
add(B.table([
  ["Thuật toán", "Thời gian", "Bộ nhớ", "Truy vết"],
  ["LCS vét cạn (2ⁿ dãy con)", "O(2ⁿ · m)", "O(n)", "–"],
  ["Căn chỉnh vét cạn", "Θ(D(n,m)) ≈ 5,83ⁿ khi n = m", "O(n + m)", "–"],
  ["LCS – QHĐ (sách)", "Θ(n·m)", "Θ(n·m)", "O(n + m)"],
  ["Needleman–Wunsch", "Θ(n·m)", "Θ(n·m)", "O(n + m)"],
  ["Smith–Waterman", "Θ(n·m)", "Θ(n·m)", "O(n + m)"],
  ["Chỉ tính điểm, giữ 2 hàng", "Θ(n·m)", "Θ(min(n, m))", "Không có"],
  ["Hirschberg [5]", "Θ(n·m) (≤ 2 lần)", "Θ(n + m)", "Có, đầy đủ"],
], [2900, 2600, 1800, 1770], "Độ phức tạp các thuật toán căn chỉnh trình tự"));

// ---------------------------------------------------------------- CHƯƠNG 4
add(B.chapter("Chương 4. Cài đặt Python và thực nghiệm"), B.setChap(4));
add(B.h2("4.1. Tổ chức mã nguồn"));
add(B.table([
  ["Tệp", "Nội dung chính"],
  ["src/matrix_chain.py", "matrix_chain (bottom-up, bảng N và S), parenthesize / split_tree (truy vết), matrix_chain_memo (top-down), matrix_chain_brute (vét cạn), catalan, cost_of_order, multiply_by_tree (kiểm chứng bằng numpy)"],
  ["src/sequence_alignment.py", "lcs_table, lcs_solution (đúng Code Fragment 13.6, 13.7), nw_align + nw_traceback, sw_align, lcs_brute, nw_brute, delannoy"],
  ["src/memory_efficient.py", "lcs_length_two_rows, nw_last_row, nw_score_linear, hirschberg, banded_nw_score"],
  ["src/extensions.py", "gotoh_align (phạt khoảng trống affine), affine_score, all_alignments"],
  ["data/generate_datasets.py", "Sinh dữ liệu giả lập với seed cố định = 16"],
  ["tests/test_all.py", "12 nhóm kiểm thử, so QHĐ với vét cạn trên dữ liệu ngẫu nhiên"],
  ["experiments/run_experiments.py", "5 thí nghiệm, ghi results/*.csv và figures/exp_*.png"],
  ["visualize/make_figures.py, demo.py", "Hình minh họa trong báo cáo/slide; demo từng bước khi trình bày"],
], [3300, 5770], "Các tệp mã nguồn của đề tài", { size: 22 }));
add(B.p("Toàn bộ hình minh họa bảng QHĐ trong báo cáo được vẽ **trực tiếp từ kết quả của chính mã nguồn**, nên số liệu trên hình luôn khớp với chương trình."));

add(B.h2("4.2. Giải thích các đoạn mã chính"));
add(B.h3("a) Nhân chuỗi ma trận – điền bảng"));
add(B.code(fn("matrix_chain.py", "matrix_chain"), "matrix_chain – QHĐ bottom-up (mở rộng Code Fragment 13.5 với bảng S)"));
add(B.bullets([
  "`n = len(d) - 1`: d có n+1 số vì kích thước ma trận thứ i là d[i] × d[i+1].",
  "`N = [[0] * n ...]`: khởi tạo cả bảng bằng 0 – đồng thời đặt luôn trường hợp cơ sở N[i][i] = 0.",
  "Vòng `b` là **độ dài chuỗi con − 1**; duyệt b tăng dần chính là điền bảng theo đường chéo, bảo đảm N[i][k] và N[k+1][j] (chuỗi ngắn hơn) đã được tính.",
  "Vòng `k` cài đặt đúng công thức truy hồi; `cost` gồm chi phí hai nửa đã tối ưu (tra bảng) cộng chi phí phép nhân cuối `d[i]*d[k+1]*d[j+1]`.",
  "So với sách (dùng `min(...)` một dòng), bản này lưu thêm `S[i][j] = best_k` – **thông tin bắt buộc để truy vết**.",
]));
add(B.code(fn("matrix_chain.py", "parenthesize"), "parenthesize – truy vết đệ quy từ bảng S"));
add(B.p("Hàm truy vết chỉ đọc bảng S, không tính lại gì: ô (i, j) cho biết phép nhân cuối tách tại k, sau đó đệ quy hai nửa. Mỗi lời gọi tạo một nút của cây nhị phân có n lá nên tổng cộng O(n) lời gọi."));
add(B.h3("b) LCS – bảng L và vết ngược"));
add(B.code(fn("sequence_alignment.py", "lcs_table"), "lcs_table – Code Fragment 13.6"));
add(B.code(fn("sequence_alignment.py", "lcs_solution"), "lcs_solution – Code Fragment 13.7, bổ sung trả về đường đi để vẽ hình"));
add(B.bullets([
  "Bảng có kích thước (n+1) × (m+1): **dịch chỉ số đi 1** để hàng/cột 0 biểu diễn chuỗi rỗng, nhờ vậy không cần xử lý biên riêng. Vì thế trong vòng lặp ta so `X[j]`, `Y[k]` nhưng ghi vào ô `L[j+1][k+1]`.",
  "Trong truy vết, điều kiện dừng `L[j][k] > 0`: khi giá trị bằng 0 thì không còn ký tự chung nào phía trước.",
  "`L[j-1][k] >= L[j][k-1]`: chọn đi lên khi hòa – đây là quy tắc phá hòa, quyết định LCS nào được in ra khi có nhiều LCS.",
  "Các ký tự được thu thập **từ cuối về đầu**, nên phải `reversed` trước khi trả về.",
]));
add(B.h3("c) Needleman–Wunsch – bảng điểm, bảng mũi tên và truy vết"));
add(B.code(fn("sequence_alignment.py", "nw_align"), "nw_align – điền bảng F và bảng mũi tên P"));
add(B.code(fn("sequence_alignment.py", "nw_traceback"), "nw_traceback – truy vết ngược theo bảng mũi tên"));
add(B.bullets([
  "Hàng 0 / cột 0 được khởi tạo `i * gap`, `j * gap`: ghép một tiền tố với chuỗi rỗng chỉ có thể bằng toàn khoảng trống; mũi tên biên là ↑ hoặc ← để truy vết đi về đúng (0,0).",
  "`max(cands, key=...)`: hàm `max` của Python trả về phần tử **đầu tiên** khi hòa, nên thứ tự trong `cands` chính là quy tắc ưu tiên Chéo > Lên > Trái.",
  "Truy vết đọc mũi tên P[i][j]: ↖ ghép hai ký tự, ↑ ghép ký tự của X với \"–\", ← ghép \"–\" với ký tự của Y. Vòng `while i > 0 or j > 0` chạy đúng n + m − (số bước chéo) lần.",
  "`alignment_score` chấm lại căn chỉnh thu được; kiểm thử khẳng định điểm này **bằng** F[n][m] – tức đường truy vết là hợp lệ và tối ưu.",
]));
add(B.h3("d) Vét cạn để đối chứng"));
add(B.code(fn("matrix_chain.py", "matrix_chain_brute"), "matrix_chain_brute – cùng công thức nhưng không lưu bảng"));
add(B.p("Điểm then chốt khi giải thích: hàm vét cạn dùng **đúng công thức truy hồi** như QHĐ; khác biệt duy nhất là **không lưu kết quả** nên `solve(i, k)` bị gọi lại nhiều lần với cùng tham số. Biến `calls` đếm số lời gọi để đối chiếu với lý thuyết 3ⁿ⁻¹."));

add(B.h2("4.3. Bộ dữ liệu giả lập"));
add(B.p("Do dữ liệu gen thật có kích thước lớn và cần xử lý định dạng phức tạp, đề tài **sinh dữ liệu giả lập có kiểm soát** bằng `data/generate_datasets.py` (seed cố định nên chạy lại cho đúng dữ liệu cũ). Ưu điểm lớn nhất của dữ liệu giả lập là **biết trước đáp án** (vị trí, loại đột biến; vị trí gen được cài) để kiểm tra thuật toán."));
add(B.table([
  ["Tệp", "Cách sinh", "Dùng cho"],
  ["dna_family.fasta", "Tổ tiên 240 base → 2 nhánh A, B (thay thế 10%, indel 2%) → 5 loài con (thay thế 4%, indel 1%) + 1 loài ngoài nhóm (thay thế 35%)", "Ma trận tương đồng, cây phân nhóm"],
  ["gene_variants.fasta", "Gen 60 base + 4 biến thể cài sẵn: SNP tại 25; chèn GGG tại 30; xóa 4 base tại 40; hỗn hợp", "Phát hiện đột biến"],
  ["genome_with_gene.fasta", "Hệ gen ngẫu nhiên 3.000 base, cài bản sao gen (thay thế 5%) tại vị trí 1734", "Smith–Waterman tìm gen"],
  ["matrix_chains.csv", "Ví dụ sách, CLRS, chuỗi \"mạng nơ-ron\" [1000, 4096, 1024, 4096, 64, 1], ngẫu nhiên n = 5…50", "Nhân chuỗi ma trận"],
  ["benchmark_pairs.csv", "Cặp DNA ngẫu nhiên đều trên {A,C,G,T}, độ dài 2…2000", "Đo thời gian"],
  ["mutations_log.csv", "Nhật ký mọi đột biến đã cài", "Đáp án đối chiếu"],
], [2400, 4470, 2200], "Bộ dữ liệu giả lập", { size: 22 }));
add(B.p("Hàm `mutate` duyệt từng base: với xác suất indel/2 thì xóa base đó, với xác suất indel/2 thì chèn một base ngẫu nhiên trước nó, và với xác suất sub_rate thì thay base bằng một base khác. Dữ liệu được lưu dạng **FASTA** – định dạng chuẩn của tin sinh học (dòng tiêu đề bắt đầu bằng \">\", chuỗi được ngắt 60 ký tự/dòng)."));

add(B.h2("4.4. Kiểm thử tính đúng"));
add(B.p("Tiêu chí đánh giá riêng của đề tài là **tính chính xác của bảng QHĐ và vết ngược**. Bộ kiểm thử (`python -m unittest discover -s tests`) gồm 12 nhóm, tất cả đều đạt:"));
add(B.bullets([
  "Ví dụ 13.4 của sách (3.000 phép nhân, cách đặt ((A0×A1)×A2)) và ví dụ CLRS (15.125).",
  "200 chuỗi ma trận ngẫu nhiên: QHĐ bottom-up = top-down = vét cạn; **cây truy vết có chi phí đúng bằng N[0][n−1]**.",
  "Số cách đặt ngoặc liệt kê được = số Catalan.",
  "Hình 13.8 của sách: L[10][12] = 6; 300 cặp chuỗi ngẫu nhiên: LCS truy vết được **thực sự là dãy con của cả X và Y** và có độ dài bằng vét cạn 2ⁿ.",
  "150 cặp: điểm NW = vét cạn; chuỗi truy vết bỏ dấu \"–\" cho lại đúng X, Y; chấm lại điểm căn chỉnh = F[n][m].",
  "Hirschberg, 2 hàng, dải chéo cho cùng điểm với bảng đầy đủ; Gotoh = vét cạn với phạt affine; Smith–Waterman tìm đúng vị trí motif cài sẵn.",
]));

add(B.h2("4.5. So sánh thực nghiệm với vét cạn"));
add(B.p(`Môi trường: ${envTxt}. Thời gian là giá trị nhỏ nhất của 3 lần chạy (1 lần với các trường hợp vét cạn lâu); mọi thí nghiệm đều \`assert\` kết quả QHĐ trùng kết quả vét cạn trước khi ghi số liệu.`));
add(B.h3("Thí nghiệm 1 – Nhân chuỗi ma trận"));
const e1rows = [["n", "Số cách đặt ngoặc", "Lời gọi vét cạn", "Vét cạn (s)", "QHĐ (s)", "Nhanh hơn"]];
for (const r of e1.slice(1)) if ([4, 6, 8, 10, 12, 13, 14, 15].includes(+r[0]))
  e1rows.push([r[0], fmt(r[1]), fmt(r[5]), sec(r[6]), sec(r[3]), fmt(r[7]) + "×"]);
add(B.table(e1rows, [700, 2000, 1900, 1500, 1500, 1470], "Thời gian vét cạn và QHĐ cho bài toán nhân chuỗi ma trận (kích thước ngẫu nhiên 5..100)", { center: [0, 1, 2, 3, 4, 5], size: 22 }));
add(B.img("figures/exp_matrix_chain.png", 14, "Thời gian chạy (thang log) – nhân chuỗi ma trận"));
add(B.p(`Trên thang log, đường vét cạn là đường thẳng (tăng mũ, mỗi khi n tăng 1 thời gian nhân khoảng 3 lần – khớp lý thuyết 3ⁿ⁻¹), trong khi QHĐ gần như nằm ngang. Với n = 15, vét cạn mất ${sec(e1[14][6])} s còn QHĐ mất ${sec(e1[14][3])} s; dừng vét cạn ở n = 15 vì n = 20 ước tính mất hơn 9 phút, còn QHĐ vẫn dưới 1 ms.`));
add(B.h3("Thí nghiệm 2 – LCS"));
const e2rows = [["n = m", "Dãy con đã thử (2ⁿ)", "Ô bảng QHĐ", "Vét cạn (s)", "QHĐ (s)", "Nhanh hơn"]];
for (const r of e2.slice(1)) if ([4, 8, 12, 16, 18, 20].includes(+r[0]))
  e2rows.push([r[0], fmt(r[4]), fmt(r[2]), sec(r[5]), sec(r[3]), fmt(r[6]) + "×"]);
add(B.table(e2rows, [900, 2100, 1500, 1500, 1500, 1570], "Vét cạn 2ⁿ dãy con và QHĐ cho LCS trên DNA ngẫu nhiên", { center: [0, 1, 2, 3, 4, 5], size: 22 }));
add(B.img("figures/exp_lcs.png", 14, "Thời gian chạy (thang log) – LCS"));
add(B.h3("Thí nghiệm 3 – Căn chỉnh toàn cục"));
const e3rows = [["n = m", "Số căn chỉnh (Delannoy)", "Lời gọi vét cạn", "Vét cạn (s)", "QHĐ (s)", "Nhanh hơn"]];
for (const r of e3.slice(1)) if ([3, 5, 7, 8, 9].includes(+r[0]))
  e3rows.push([r[0], fmt(r[1]), fmt(r[4]), sec(r[5]), sec(r[3]), fmt(r[6]) + "×"]);
add(B.table(e3rows, [900, 2200, 1900, 1400, 1300, 1370], "Vét cạn mọi căn chỉnh và Needleman–Wunsch", { center: [0, 1, 2, 3, 4, 5], size: 22 }));
add(B.img("figures/exp_alignment.png", 14, "Thời gian chạy (thang log) – căn chỉnh toàn cục"));
add(B.p("Vét cạn căn chỉnh tăng nhanh nhất (≈ 5,5–6 lần mỗi khi n tăng 1): chỉ với hai chuỗi 9 base đã cần hơn 2 triệu lời gọi, trong khi bảng QHĐ chỉ có 100 ô. Hai chuỗi gen thực tế dài hàng nghìn base thì vét cạn hoàn toàn không khả thi."));
add(B.h3("Thí nghiệm 4 – Tối ưu tài nguyên với ma trận thật"));
const c1 = +e5[1][1], c2 = +e5[2][1];
add(B.p(`Tính tích X·W₁·W₂·W₃·w với kích thước d = [1000, 4096, 1024, 4096, 64, 1] (giống lan truyền qua các lớp của một mạng nơ-ron) bằng numpy (float32). Nhân tuần tự trái → phải tốn ${fmt(c1)} phép nhân vô hướng; thứ tự do QHĐ chọn – X·(W₁·(W₂·(W₃·w))), tức nhân từ phải sang trái để luôn nhân ma trận với vectơ – chỉ tốn ${fmt(c2)}, **ít hơn ${Math.round(c1 / c2)} lần**. Thời gian đo thực tế giảm từ ${(e5[1][2]*1000).toFixed(1).replace('.', ',')} ms xuống ${(e5[2][2]*1000).toFixed(1).replace('.', ',')} ms (khoảng ${Math.round(e5[1][2] / e5[2][2])} lần – nhỏ hơn tỉ lệ lý thuyết vì thư viện BLAS tối ưu phép nhân ma trận lớn tốt hơn ma trận–vectơ). Hai kết quả chỉ sai khác cỡ 10⁻⁶ (sai số làm tròn float32).`));
add(B.img("figures/exp_numpy.png", 15.5, "Cùng một tích ma trận, chỉ đổi thứ tự nhân theo QHĐ"));
add(B.h2("4.6. Nhận xét"));
add(B.bullets([
  "Kết quả QHĐ trùng 100% với vét cạn trên mọi bộ thử – khẳng định tính đúng của công thức truy hồi và thủ tục truy vết.",
  "Độ dốc các đường vét cạn trên thang log khớp với phân tích lý thuyết: 3ⁿ (nhân chuỗi ma trận), 2ⁿ (LCS), ≈ 5,8ⁿ (căn chỉnh).",
  "Với n nhỏ (n ≤ 3), vét cạn có thể nhanh ngang QHĐ do chi phí tạo bảng; QHĐ vượt trội rất nhanh khi n tăng.",
  "Lợi ích của nhân chuỗi ma trận không chỉ là lý thuyết: một lần chạy QHĐ O(n³) với n nhỏ giúp tiết kiệm hàng tỉ phép tính thực tế.",
]));

// ---------------------------------------------------------------- CHƯƠNG 5
add(B.chapter("Chương 5. Ứng dụng thực tiễn"), B.setChap(5));
add(B.h2("5.1. Công nghệ sinh học phân tử – phân tích gen"));
add(B.h3("a) Phát hiện đột biến so với gen tham chiếu"));
add(B.p("Căn chỉnh trình tự của một mẫu (bệnh nhân, giống cây trồng…) với gen tham chiếu cho biết chính xác base nào bị thay thế, đoạn nào bị chèn/xóa. Trên dữ liệu giả lập, chương trình phát hiện đúng 4/4 biến thể: SNP tại vị trí 25, chèn 3 base tại 30, xóa 4 base tại 40, và biến thể hỗn hợp (2 SNP + xóa 2 base) (Hình 5.1, `python demo.py 4`)."));
add(B.img("figures/fig10_mutations.png", 16, "Căn chỉnh gen tham chiếu với 4 biến thể: màu cho biết loại đột biến được phát hiện"));
add(B.p("Một chi tiết thú vị: ở biến thể hỗn hợp, đoạn xóa \"GT\" được cài tại vị trí 20, nhưng chương trình báo vị trí 18. Lý do: gen gốc có đoạn lặp …G**TGT**… tại 18–21, nên xóa \"GT\" ở 18 hay ở 20 đều cho **cùng một chuỗi kết quả** – hai căn chỉnh có điểm bằng nhau. Đây là hiện tượng có thật trong phân tích biến dị: các công cụ chuẩn hóa indel (ví dụ \"left-normalization\" trong định dạng VCF) quy ước luôn đẩy indel về vị trí trái nhất để mọi phần mềm báo cáo giống nhau."));
add(B.h3("b) So sánh loài và xây dựng cây phát sinh"));
add(B.p("Tỉ lệ giống nhau (% identity) giữa các trình tự sau căn chỉnh là cơ sở để dựng cây phát sinh loài. Với 6 \"loài\" giả lập, ma trận tương đồng và cây phân nhóm UPGMA dựng từ kết quả Needleman–Wunsch khôi phục **đúng cấu trúc tiến hóa đã cài**: nhóm A (92–94%), nhóm B (90%), hai nhóm giống nhau 71–75%, loài ngoài nhóm chỉ 54–58% (Hình 5.2). Các chương trình căn chỉnh đa trình tự như Clustal cũng bắt đầu bằng việc căn chỉnh từng cặp như thế này."));
add(B.img("figures/fig11_family.png", 16, "Ma trận tương đồng và cây phân nhóm của 6 loài giả lập"));
add(B.h3("c) Tìm gen trong hệ gen dài"));
add(B.p("Smith–Waterman tìm được bản sao gen (đã đột biến 4 base) tại đúng vị trí 1734–1794 trong hệ gen 3.000 base (Hình 5.3). Các công cụ tìm kiếm cơ sở dữ liệu như BLAST [9] dùng heuristic \"hạt giống – mở rộng\" để tăng tốc, nhưng bước mở rộng vẫn là căn chỉnh QHĐ; các trình căn chỉnh đoạn đọc giải trình tự thế hệ mới như minimap2 [12] dùng QHĐ trong dải chéo và phạt khoảng trống affine."));
add(B.img("figures/fig12_sw_genome.png", 16, "Smith–Waterman định vị gen trong hệ gen giả lập 3.000 base"));
add(B.h2("5.2. Tối ưu hóa tài nguyên tính toán"));
add(B.bullets([
  "**Thư viện số học:** hàm `numpy.linalg.multi_dot` dùng chính thuật toán QHĐ nhân chuỗi ma trận để chọn thứ tự nhân nhanh nhất cho nhiều ma trận [13]. Thí nghiệm 4 cho thấy mức tiết kiệm có thể lên tới hàng trăm lần.",
  "**Học sâu và tính toán tensor:** việc chọn thứ tự co tensor (einsum) và thứ tự nhân trong lan truyền qua các lớp là bài toán tổng quát của nhân chuỗi ma trận; chọn sai thứ tự làm tăng thời gian và bộ nhớ trung gian.",
  "**Cơ sở dữ liệu:** bộ tối ưu truy vấn của System R chọn thứ tự JOIN nhiều bảng bằng QHĐ trên các tập con bảng [14] – cùng tư tưởng \"chọn thứ tự kết hợp có chi phí nhỏ nhất\".",
  "**So sánh văn bản và mã nguồn:** `diff`, `git diff`, kiểm tra đạo văn, gợi ý sửa chính tả đều dựa trên LCS / khoảng cách chỉnh sửa – cùng họ với căn chỉnh trình tự [1, 15].",
]));

// ---------------------------------------------------------------- CHƯƠNG 6
add(B.chapter("Chương 6. Hạn chế và hướng mở rộng tối ưu bộ nhớ"), B.setChap(6));
add(B.h2("6.1. Hạn chế"));
add(B.bullets([
  "**Bộ nhớ O(n·m) của căn chỉnh:** hai chuỗi 100.000 base cần 10¹⁰ ô; ngay cả 4 byte/ô đã là 40 GB. Thí nghiệm đo được bảng đầy đủ (gồm bảng điểm và bảng mũi tên) của hai chuỗi 2.000 base trong Python đã chiếm khoảng 184 MB. Đây là giới hạn chính, thường gặp **trước** giới hạn thời gian.",
  "**Thời gian vẫn bậc hai/bậc ba:** O(n·m) không đủ nhanh để so một chuỗi với cơ sở dữ liệu hàng tỉ base; O(n³) cho nhân chuỗi ma trận chậm khi n rất lớn (dù trong thực tế n thường nhỏ).",
  "**Phạt khoảng trống tuyến tính không sát sinh học:** một đoạn xóa 4 base liền nhau có cùng điểm với 4 khoảng trống rải rác, nên căn chỉnh có thể \"rải\" khoảng trống (Hình 6.1).",
  "**Nhiều lời giải tối ưu:** LCS và căn chỉnh tối ưu thường không duy nhất; kết quả phụ thuộc quy tắc phá hòa (ví dụ vị trí indel trong đoạn lặp ở Mục 5.1).",
  "**Tham số chấm điểm:** kết quả phụ thuộc hệ điểm (khớp/thay thế/khoảng trống); thực tế dùng ma trận thay thế thống kê (PAM, BLOSUM cho protein).",
  "**Chỉ căn chỉnh hai chuỗi:** căn chỉnh đồng thời k chuỗi bằng QHĐ cần O(nᵏ) – bài toán NP-khó, phải dùng heuristic.",
]));
add(B.img("figures/fig16_linear_vs_affine.png", 16, "Phạt tuyến tính rải khoảng trống; phạt affine (Gotoh) gom thành một đoạn xóa liền"));
add(B.h2("6.2. Tối ưu bộ nhớ"));
add(B.h3("a) Chỉ giữ hai hàng – khi chỉ cần giá trị tối ưu"));
add(B.p("Trong công thức truy hồi, hàng i chỉ phụ thuộc hàng i − 1. Nếu chỉ cần **điểm** (hoặc độ dài LCS), ta chỉ giữ hai hàng `prev` và `cur`, đổi vai sau mỗi hàng: bộ nhớ giảm từ O(n·m) xuống **O(min(n, m))** (đổi chỗ X, Y để hàng là chuỗi ngắn hơn). Nhược điểm: mất thông tin để truy vết (Hình 6.2)."));
add(B.img("figures/fig13_two_rows.png", 15, "Bảng đầy đủ so với kỹ thuật giữ hai hàng"));
add(B.code(fn("memory_efficient.py", "nw_last_row"), "nw_last_row – điểm căn chỉnh với 2 hàng bộ nhớ"));
add(B.h3("b) Thuật toán Hirschberg – vừa O(n + m) bộ nhớ, vừa có truy vết"));
add(B.p("Hirschberg [5] (cho LCS, sau được Myers–Miller [11] áp dụng cho căn chỉnh) kết hợp kỹ thuật hai hàng với **chia để trị**. Cắt X tại hàng giữa mid. Đường đi tối ưu trên lưới chắc chắn đi qua hàng mid tại một cột k nào đó; khi đó"));
add(B.formula("OPT(X, Y) = max_k [ F(X[:mid], Y[:k]) + F(X[mid:], Y[k:]) ]"));
add(B.p("Vế trái là hàng cuối khi quét **xuôi** X[:mid] với Y; vế phải là hàng cuối khi quét **ngược** (đảo cả hai chuỗi) X[mid:] với Y – cả hai chỉ cần 2 hàng bộ nhớ. Tìm được k, ta đệ quy trên hai hình chữ nhật nhỏ (X[:mid], Y[:k]) và (X[mid:], Y[k:]) rồi nối hai căn chỉnh con (Hình 6.3)."));
add(B.img("figures/fig14_hirschberg.png", 12, "Hirschberg: chọn cột cắt k trên hàng giữa, phần xám bị loại khỏi tìm kiếm"));
add(B.code(fn("memory_efficient.py", "hirschberg"), "hirschberg – căn chỉnh tối ưu với bộ nhớ tuyến tính"));
add(B.p("**Phân tích.** Mỗi mức đệ quy quét tổng diện tích bằng một nửa mức trước (hai hình chữ nhật con có tổng diện tích bằng nửa hình cha), nên tổng thời gian ≤ n·m·(1 + 1/2 + 1/4 + …) = **2·n·m = O(n·m)**. Bộ nhớ: hai hàng O(m) cộng ngăn xếp đệ quy O(log n) và chuỗi kết quả O(n + m) ⇒ **O(n + m)**."));
const last = e4[e4.length - 1];
const e4rows = [["n = m", "Bảng đầy đủ (MB)", "Hirschberg (MB)", "Chỉ điểm 2 hàng (MB)", "Bảng đầy đủ (s)", "Hirschberg (s)"]];
for (const r of e4.slice(1)) e4rows.push([r[0], r[1].replace(".", ","), r[2].replace(".", ","), r[3].replace(".", ","), r[4].replace(".", ","), r[5].replace(".", ",")]);
add(B.table(e4rows, [1000, 1700, 1600, 1900, 1500, 1370], "Bộ nhớ đỉnh (đo bằng tracemalloc) và thời gian chạy", { center: [0, 1, 2, 3, 4, 5], size: 22 }));
add(B.img("figures/exp_memory.png", 16, "Bộ nhớ và thời gian: bảng đầy đủ so với Hirschberg"));
add(B.p(`Ở n = m = ${last[0]}, Hirschberg chỉ dùng ${last[2].replace(".", ",")} MB so với ${last[1].replace(".", ",")} MB của bảng đầy đủ (ít hơn khoảng ${Math.round(last[1] / last[2])} lần) và cho **cùng điểm tối ưu**. Về lý thuyết Hirschberg làm khoảng gấp đôi số phép tính; trong cài đặt Python này nó lại chạy nhanh hơn vì vòng lặp gọn (không tạo bộ (điểm, mũi tên) cho từng ô, không cấp phát bảng lớn) – một ví dụ cho thấy hằng số và chi phí cấp phát bộ nhớ cũng ảnh hưởng thời gian thực.`));
add(B.h3("c) Căn chỉnh trong dải chéo (banded alignment)"));
add(B.p("Khi hai chuỗi rất giống nhau (ít indel), đường đi tối ưu nằm gần đường chéo chính. Chỉ tính các ô có |i − j| ≤ w giảm thời gian và bộ nhớ xuống **O(n·w)**. Kết quả là tối ưu nếu đường đi tối ưu nằm trong dải, ngược lại chỉ là cận dưới – hàm `banded_nw_score` cài đặt ý tưởng này; các trình căn chỉnh hiện đại dùng nó rộng rãi."));
add(B.h3("d) Bộ nhớ cho nhân chuỗi ma trận"));
add(B.p("Bảng N và S chỉ dùng nửa trên đường chéo, có thể lưu dạng mảng tam giác (n(n+1)/2 phần tử) để giảm một nửa bộ nhớ. Với n lớn, thuật toán Hu–Shing [8] giải đúng trong O(n log n) thời gian, O(n) bộ nhớ."));
add(B.h2("6.3. Các hướng mở rộng khác"));
add(B.bullets([
  "**Phạt khoảng trống affine (Gotoh [6])** – đã cài đặt trong `extensions.py`: khoảng trống dài L tốn g_open + (L − 1)·g_extend; dùng 3 bảng M, Ix, Iy, vẫn O(n·m). Hình 6.1 cho thấy nó gom đúng đoạn xóa 4 base.",
  "**Song song hóa:** các ô trên cùng một đường chéo phụ (i + j = hằng số) độc lập với nhau nên tính song song được; các cài đặt SIMD/GPU của Smith–Waterman (ví dụ kỹ thuật \"striped\" của Farrar [16]) nhanh hơn nhiều lần.",
  "**Heuristic cho cơ sở dữ liệu lớn:** BLAST [9] – lọc bằng hạt giống k-mer rồi mới căn chỉnh QHĐ cục bộ.",
  "**Căn chỉnh đa trình tự:** căn chỉnh tiến dần (progressive) dựa trên cây phân nhóm từ căn chỉnh cặp.",
]));

// ---------------------------------------------------------------- KẾT LUẬN
add(B.chapter("Kết luận"), B.setChap(7));
add(B.p("Đề tài đã trình bày quy hoạch động qua hai bài toán của Mục 13.3 [1] theo đúng quy trình bốn bước: định nghĩa bài toán con N[i][j] và L[j][k]/F[i][j], chứng minh tính tối ưu của cấu trúc con bằng lập luận cắt–dán, xây dựng công thức truy hồi, điền bảng bottom-up theo thứ tự phù hợp và truy vết ngược để dựng lời giải (cách đặt ngoặc, chuỗi căn chỉnh). Độ phức tạp giảm từ hàm mũ (Catalan ≈ 4ⁿ, 3ⁿ, 2ⁿ, Delannoy ≈ 5,8ⁿ) xuống đa thức Θ(n³) và Θ(n·m)."));
add(B.p("Cài đặt Python được kiểm thử đối chiếu với vét cạn trên hàng nghìn bộ dữ liệu ngẫu nhiên và dữ liệu giả lập có đáp án; thực nghiệm khẳng định tốc độ tăng mũ của vét cạn đúng như lý thuyết. Các ứng dụng minh họa – phát hiện đột biến, phân nhóm loài, tìm gen, chọn thứ tự nhân ma trận giảm hàng trăm lần số phép tính – cho thấy giá trị thực tiễn của kỹ thuật. Hạn chế lớn nhất là bộ nhớ O(n·m) của căn chỉnh; kỹ thuật hai hàng và thuật toán Hirschberg giảm bộ nhớ xuống tuyến tính mà vẫn giữ được lời giải tối ưu."));
add(B.p("**Hướng phát triển:** cài đặt căn chỉnh bằng numpy/numba hoặc song song theo đường chéo để xử lý chuỗi dài; kết hợp Hirschberg với phạt affine; thử nghiệm trên dữ liệu gen thật (ví dụ các trình tự từ GenBank) và ma trận thay thế BLOSUM cho protein."));

// ---------------------------------------------------------------- TÀI LIỆU THAM KHẢO
add(B.chapter("Tài liệu tham khảo"), B.setChap(8));
const refs = [
  "M. T. Goodrich, R. Tamassia, M. H. Goldwasser (2013). *Data Structures and Algorithms in Python*. John Wiley & Sons. Chương 13, Mục 13.3 – Dynamic Programming, tr. 594–600.",
  "T. H. Cormen, C. E. Leiserson, R. L. Rivest, C. Stein (2009). *Introduction to Algorithms*, 3rd ed. MIT Press. Chương 15: Dynamic Programming (15.2 Matrix-chain multiplication, 15.4 Longest common subsequence).",
  "S. B. Needleman, C. D. Wunsch (1970). A general method applicable to the search for similarities in the amino acid sequence of two proteins. *Journal of Molecular Biology*, 48(3), 443–453.",
  "T. F. Smith, M. S. Waterman (1981). Identification of common molecular subsequences. *Journal of Molecular Biology*, 147(1), 195–197.",
  "D. S. Hirschberg (1975). A linear space algorithm for computing maximal common subsequences. *Communications of the ACM*, 18(6), 341–343.",
  "O. Gotoh (1982). An improved algorithm for matching biological sequences. *Journal of Molecular Biology*, 162(3), 705–708.",
  "R. Bellman (1957). *Dynamic Programming*. Princeton University Press.",
  "T. C. Hu, M. T. Shing (1982, 1984). Computation of matrix chain products, Part I & Part II. *SIAM Journal on Computing*, 11(2), 362–373 và 13(2), 228–251.",
  "S. F. Altschul, W. Gish, W. Miller, E. W. Myers, D. J. Lipman (1990). Basic local alignment search tool. *Journal of Molecular Biology*, 215(3), 403–410.",
  "R. Durbin, S. Eddy, A. Krogh, G. Mitchison (1998). *Biological Sequence Analysis: Probabilistic Models of Proteins and Nucleic Acids*. Cambridge University Press.",
  "E. W. Myers, W. Miller (1988). Optimal alignments in linear space. *Computer Applications in the Biosciences (CABIOS)*, 4(1), 11–17.",
  "H. Li (2018). Minimap2: pairwise alignment for nucleotide sequences. *Bioinformatics*, 34(18), 3094–3100.",
  "NumPy Developers. numpy.linalg.multi_dot – NumPy Manual. https://numpy.org/doc/stable/reference/generated/numpy.linalg.multi_dot.html",
  "P. G. Selinger, M. M. Astrahan, D. D. Chamberlin, R. A. Lorie, T. G. Price (1979). Access path selection in a relational database management system. *Proceedings of ACM SIGMOD 1979*, 23–34.",
  "J. Kleinberg, É. Tardos (2006). *Algorithm Design*. Pearson/Addison-Wesley. Chương 6: Dynamic Programming (6.6 Sequence Alignment, 6.7 Sequence Alignment in Linear Space).",
  "M. Farrar (2007). Striped Smith–Waterman speeds database searches six times over other SIMD implementations. *Bioinformatics*, 23(2), 156–161.",
  "Nguyễn Văn Hậu, Nguyễn Duy Tân, Nguyễn Thị Hải Năng, Nguyễn Hoàng Điệp. *Python cơ bản*. NXB Đại học Quốc gia Hà Nội. ISBN 978-604-62-7914-3. (Tham khảo cú pháp Python dùng trong cài đặt.)",
];
refs.forEach((r) => body.push(new Paragraph({ numbering: { reference: "ref", level: 0 }, alignment: AlignmentType.JUSTIFIED, children: require("./docxlib").runs(r) })));

// ---------------------------------------------------------------- PHỤ LỤC
add(B.chapter("Phụ lục. Hướng dẫn chạy chương trình"), B.setChap(9));
add(B.code(
`pip install -r requirements.txt            # numpy, matplotlib, scipy
python data/generate_datasets.py           # sinh dữ liệu giả lập
python -m unittest discover -s tests -v    # 12 nhóm kiểm thử
python demo.py                             # demo 6 phần (hoặc: python demo.py 2)
python experiments/run_experiments.py      # thực nghiệm (khoảng 6 phút)
python visualize/make_figures.py           # vẽ lại hình minh họa`));
add(B.pn("Trích kết quả `python demo.py 2` (bảng N, bảng S và truy vết của ví dụ CLRS):"));
const demo = fs.readFileSync(path.join(ROOT, "results", "demo_output.txt"), "utf8");
const part2 = demo.split("PHẦN 2")[1].split("=====")[1] || "";
const p2 = demo.slice(demo.indexOf("Bảng N[i][j]"), demo.indexOf("Vét cạn: 15125"));
add(B.code(p2.replace(/\n+$/, "")));

const doc = buildDoc(cover, body);
Packer.toBuffer(doc).then((buf) => {
  const out = path.join(ROOT, "BaoCao_DeTai16_QuyHoachDong.docx");
  fs.writeFileSync(out, buf);
  console.log("OK", out, buf.length);
});
