# SneakickS Marketplace

Sàn giao dịch giày sneaker & collectibles theo mô hình **Bid/Ask** (tương tự StockX) — đồ án nghiên cứu GR1.

| | |
|---|---|
| **Repo** | [github.com/ToanNguyen1308/SneakickS-Marketplace](https://github.com/ToanNguyen1308/SneakickS-Marketplace) |
| **Trạng thái** | Backend MVP — Tuần 4 (PostgreSQL, JWT, Matching Engine) |
| **Frontend** | Dự kiến Tuần 5 |

## Cấu trúc repository

```
SneakickS-Marketplace/
├── README.md                 ← Bạn đang đọc file này
└── SneakickS/
    └── sneakicks-backend/    ← API server (Node.js + Express + PostgreSQL)
```

Chi tiết API, cấu trúc code và hướng dẫn đầy đủ: **[SneakickS/sneakicks-backend/README.md](SneakickS/sneakicks-backend/README.md)**

## Tech stack

- **Backend:** Node.js 18+, Express 4, PostgreSQL 13+
- **Auth:** JWT + bcrypt
- **Đặc điểm:** Matching engine với `FOR UPDATE` row locking

## Quick start

```bash
cd SneakickS/sneakicks-backend

npm install
cp .env.example .env
# Chỉnh .env: DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET, ...

# Tạo database (PostgreSQL)
# psql -U postgres -c "CREATE DATABASE sneakicks;"

npm run db:migrate
npm run dev
```

Server: `http://localhost:3000`

## API (tóm tắt)

| Nhóm | Ví dụ |
|------|--------|
| Public | `GET /api/products`, `GET /api/categories`, `POST /api/auth/login` |
| Cần JWT | `POST /api/bids`, `POST /api/asks`, `GET /api/bids/me` |

Xem bảng endpoint đầy đủ trong [README backend](SneakickS/sneakicks-backend/README.md#api-endpoints-summary).

## Tài khoản test (sau migrate)

| Email | Mật khẩu |
|-------|----------|
| `buyer1@sneakicks.com` | `buyer123` |
| `seller1@sneakicks.com` | `seller123` |
| `admin@sneakicks.com` | `admin123` |

## Roadmap

- [x] Tuần 3–4: Backend scaffold, PostgreSQL, auth, bid/ask, matching
- [ ] Tuần 5: Frontend React (Vite + Tailwind)
- [ ] Verification Center & Seller Trust score

## License

Dự án học tập — chưa cấp phép thương mại.
