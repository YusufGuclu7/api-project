# API Project

API'den veri çeken ve PostgreSQL database'e kaydeden Node.js uygulaması.

## Kurulum

1. **Docker ile PostgreSQL başlatın:**
```bash
docker-compose up -d postgres
```

2. **Backend dependencies:**
```bash
cd backend
npm install
```

3. **Prisma migrate:**
```bash
cd backend
npx prisma migrate dev
```

4. **Backend çalıştırın:**
```bash
cd backend
npm run dev
```

## Konfigürasyon

`.env` dosyasını backend klasöründe düzenleyin:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/apiproject?schema=public"
PORT=3001
API_USERNAME=your_api_username
API_PASSWORD=your_api_password
API_TOKEN_URL=your_token_endpoint
API_DATA_URL=your_data_endpoint
```

## Services

- **Backend API**: http://localhost:3001
- **Database Admin (Adminer)**: http://localhost:8080
- **PostgreSQL**: localhost:5432

## API Endpoints

- `GET /health` - Health check
- `GET /api/data` - Tüm veriyi getir
- `GET /api/data/grouped` - Gruplu veriyi getir
- `POST /api/data/sync` - Manuel senkronizasyon

## Features

- Otomatik 5 dakikada bir API senkronizasyonu
- PostgreSQL ile veri saklama
- API token yönetimi
- Hata yönetimi ve logging