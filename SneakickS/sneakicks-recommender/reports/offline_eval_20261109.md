Dữ liệu: 53,894 tương tác, 1,503 user đăng nhập, 340 sản phẩm, mật độ 6.43%. Mốc chia 26/10/2026, test = 14 ngày cuối; 745 user (kịch bản A), 717 user (kịch bản B).

**Kịch bản A — mọi sản phẩm**

| Mô hình | P@10 | R@10 | NDCG@10 | HitRate@10 | Coverage |
| :--- | ---: | ---: | ---: | ---: | ---: |
| Random | 0.0295 | 0.0267 | 0.0345 | 0.2309 | 100.0% |
| Popularity | 0.0840 | 0.0817 | 0.1042 | 0.4013 | 2.9% |
| Trending (half-life 7 ngày) | 0.0800 | 0.0751 | 0.0988 | 0.3852 | 2.9% |
| Content-based (TF-IDF) | 0.1337 | 0.1286 | 0.1515 | 0.5611 | 95.9% |
| Recently Viewed | 0.1318 | 0.1237 | 0.1562 | 0.5557 | 100.0% |

**Kịch bản B — chỉ sản phẩm mới**

| Mô hình | P@10 | R@10 | NDCG@10 | HitRate@10 | Coverage |
| :--- | ---: | ---: | ---: | ---: | ---: |
| Random | 0.0223 | 0.0292 | 0.0290 | 0.1883 | 100.0% |
| Popularity | 0.0453 | 0.0626 | 0.0640 | 0.2929 | 8.8% |
| Trending (half-life 7 ngày) | 0.0441 | 0.0599 | 0.0634 | 0.2762 | 8.5% |
| Content-based (TF-IDF) | 0.1128 | 0.1670 | 0.1521 | 0.5397 | 96.5% |
| Recently Viewed | — | — | — | — | — |
