# Đề tài 16 — Quy hoạch động nâng cao: Nhân chuỗi ma trận & Căn chỉnh trình tự DNA

Tài liệu gốc: Goodrich, Tamassia, Goldwasser — *Data Structures and Algorithms in Python*, Mục 13.3
(Code Fragment 13.5, 13.6, 13.7).

## Cài đặt & chạy (Python ≥ 3.8)

```bash
pip install -r requirements.txt            # numpy, matplotlib, scipy (chỉ để vẽ hình)
python data/generate_datasets.py           # 1) sinh dữ liệu giả lập (seed cố định)
python -m unittest discover -s tests -v    # 2) kiểm thử: QHĐ == vét cạn trên hơn 1.000 bộ ngẫu nhiên
python demo.py                             # 3) demo trình bày (hoặc: python demo.py 2)
python experiments/run_experiments.py      # 4) thực nghiệm QHĐ vs vét cạn (~6 phút)
python visualize/make_figures.py           # 5) vẽ lại toàn bộ hình minh họa
```

## Cấu trúc

| Thư mục / tệp | Nội dung |
|---|---|
| `src/matrix_chain.py` | Nhân chuỗi ma trận: QHĐ bottom-up (bảng N, S), top-down có nhớ, vét cạn, truy vết đặt ngoặc, kiểm chứng bằng numpy |
| `src/sequence_alignment.py` | LCS (đúng code sách) + truy vết; Needleman–Wunsch (toàn cục); Smith–Waterman (cục bộ); vét cạn |
| `src/memory_efficient.py` | Tối ưu bộ nhớ: 2 hàng, Hirschberg O(n+m), căn chỉnh trong dải (banded) |
| `src/extensions.py` | Mở rộng: phạt khoảng trống affine (Gotoh) |
| `data/` | Bộ sinh dữ liệu + dữ liệu giả lập (FASTA, CSV), `mutations_log.csv` là đáp án đột biến |
| `tests/test_all.py` | 12 nhóm kiểm thử, so QHĐ với vét cạn |
| `experiments/run_experiments.py` | 5 thí nghiệm → `results/*.csv`, `figures/exp_*.png` |
| `visualize/make_figures.py` | Hình minh họa bảng QHĐ, vết ngược, cây đặt ngoặc… → `figures/fig*.png` |
| `demo.py` | Demo từng bước khi thuyết trình |

## Dữ liệu giả lập

| Tệp | Mô tả |
|---|---|
| `dna_family.fasta` | 1 tổ tiên (240 base) tiến hóa thành 6 "loài" theo cây 2 nhánh A/B + 1 loài ngoài nhóm |
| `gene_variants.fasta` | Gen tham chiếu 60 base + 4 biến thể: SNP, chèn 3, xóa 4, hỗn hợp |
| `genome_with_gene.fasta` | Hệ gen 3.000 base, cài 1 bản sao đột biến nhẹ của gen tại vị trí 1734 |
| `matrix_chains.csv` | Chuỗi kích thước ma trận: ví dụ sách, CLRS, mạng nơ-ron, ngẫu nhiên n = 5…50 |
| `benchmark_pairs.csv` | Cặp chuỗi DNA ngẫu nhiên độ dài 2…2000 |
| `mutations_log.csv` | Đáp án: loại và vị trí từng đột biến đã cài |


cd "/Users/ccm/Documents/Học thạc/Giải thuật nâng cao/DeTai16_QHD"
python3 demo.py        # chạy cả 6 phần
python3 demo.py 3      # chỉ chạy phần 3
python3 demo.py 1 3 5  # chạy nhiều phần theo thứ tự bạn chọn
