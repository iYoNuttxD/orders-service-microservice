# 📦 Orders Service Microservice

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)
![Express](https://img.shields.io/badge/Express-4.18-blue.svg)
![Azure](https://img.shields.io/badge/Azure-App%20Service-blue.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

**Cloud-native Orders Microservice with Clean Architecture, NATS messaging, OPA policy authorization, and integrated payment processing.**

Developed by: **[@iYoNuttxD](https://github.com/iYoNuttxD)**

---

## 🎯 Features

✅ **Clean Architecture** - Domain-driven design with vertical slices  
✅ **Orders Management** - Complete CRUD with payment processing  
✅ **Customers & Restaurants** - Full management system  
✅ **Payment Gateway Integration** - External payment processing  
✅ **NATS Messaging** - Event-driven architecture  
✅ **OPA Authorization** - Policy-based access control  
✅ **Prometheus Metrics** - Observable & production-ready  
✅ **Health Checks** - Integration status monitoring  
✅ **Azure-Ready** - Graceful degradation & robust startup  
✅ **OpenAPI/Swagger** - Complete API documentation  
✅ **Jest Tests** - Unit & integration testing  

---

## 🏗️ Architecture

### Clean Architecture Layers
```
src/
├── domain/              # Business logic & entities
│   ├── entities/        # Order, OrderItem, PaymentTransaction
│   ├── value-objects/   # Money, OrderStatus
│   ├── events/          # OrderCreated, OrderPaid, OrderCanceled
│   └── ports/           # Interfaces (OrderRepository, PaymentGateway, etc.)
├── infra/               # Infrastructure implementations
│   ├── repositories/    # MongoDB implementations
│   └── adapters/        # NATS, OPA, Payment Gateway
├── features/            # Vertical slices
│   ├── orders/          # Orders feature
│   │   ├── http/        # Handlers & routes
│   │   └── use-cases/   # Business use-cases
│   └── system/          # Health & metrics
└── main/                # Application bootstrap
    ├── app.js           # Express app setup
    └── container.js     # Dependency injection
```

### Integration Points
- **NATS** - Event publishing (optional)
- **OPA** - Policy authorization (optional, fail-open)
- **Payment Gateway** - External payment API (optional)
- **MongoDB Atlas** - Primary database (required)

---

## 🛠️ Tech Stack

- **Node.js 18+** - Runtime
- **Express.js** - HTTP framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - ODM
- **NATS** - Messaging
- **Axios** - HTTP client
- **Winston** - Logging
- **Prom-client** - Prometheus metrics
- **Jest** - Testing
- **Docker** - Containerization

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- MongoDB Atlas account (free tier available)
- (Optional) NATS server or demo.nats.io
- (Optional) OPA server for authorization
- (Optional) Payment gateway mock/sandbox

### 1. Clone Repository

```bash
git clone https://github.com/iYoNuttxD/orders-service-microservice.git
cd orders-service-microservice
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

**Minimal configuration (MongoDB only):**
```env
NODE_ENV=production
PORT=3002
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ordersdb
```

**Full configuration (all integrations):**
```env
NODE_ENV=production
PORT=3002

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ordersdb

# NATS (leave empty to disable)
NATS_URL=nats://demo.nats.io:4222

# OPA (leave empty to disable)
OPA_URL=https://your-opa-worker.workers.dev
OPA_POLICY_PATH=/v1/data/orders/allow
OPA_FAIL_OPEN=true

# Payment Gateway (leave empty to simulate)
PAYMENT_BASE_URL=https://payment-api.example.com/api
PAYMENT_API_KEY=your_api_key

# Optional
LOG_LEVEL=info
METRICS_ENABLED=true
```

### 4. Run the Service

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The service will start on `http://localhost:3002`

---

## 📡 API Endpoints

### System
- `GET /api/v1/health` - Health check with integration statuses
- `GET /api/v1/metrics` - Prometheus metrics
- `GET /api-docs` - Swagger UI documentation

### Orders
- `GET /api/v1/pedidos` - List orders (with filters)
- `GET /api/v1/pedidos/dashboard` - Statistics
- `GET /api/v1/pedidos/:id` - Get order by ID
- `POST /api/v1/pedidos` - Create new order
- `POST /api/v1/pedidos/:id/pay` - Process payment
- `PATCH /api/v1/pedidos/:id/status` - Update status
- `PATCH /api/v1/pedidos/:id/cancelar` - Cancel order

### Legacy Endpoints (Backward Compatible)
- `/api/v1/clientes` - Customers CRUD
- `/api/v1/restaurantes` - Restaurants CRUD
- `/api/v1/cardapios` - Menu items CRUD
- `/api/v1/avaliacoes` - Reviews CRUD
- `/api/v1/pagamentos` - Payments CRUD

---

## 💻 Usage Examples

### Linux / Mac / PowerShell

**Create Order:**
```bash
curl -X POST http://localhost:3002/api/v1/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "clienteId": "64abc123...",
    "restauranteId": "64def456...",
    "items": [
      {
        "cardapioId": "64ghi789...",
        "quantidade": 2
      }
    ],
    "enderecoEntrega": {
      "rua": "Rua Example",
      "numero": "123",
      "bairro": "Centro",
      "cidade": "São Paulo",
      "estado": "SP",
      "cep": "01000-000"
    }
  }'
```

**Pay Order:**
```bash
curl -X POST http://localhost:3002/api/v1/pedidos/64abc123.../pay \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "credit_card"
  }'
```

**Health Check:**
```bash
curl http://localhost:3002/api/v1/health
```

### Windows CMD

**Create Order:**
```cmd
curl -X POST http://localhost:3002/api/v1/pedidos ^
  -H "Content-Type: application/json" ^
  -d "{\"clienteId\":\"64abc123...\",\"restauranteId\":\"64def456...\",\"items\":[{\"cardapioId\":\"64ghi789...\",\"quantidade\":2}]}"
```

**Note:** In Windows CMD, use `^` for line continuation and escape quotes with `\"`

---

## 🐳 Docker

### Build Image

```bash
docker build -t orders-service:latest .
```

### Run Container

```bash
docker run -p 3002:3002 \
  -e MONGODB_URI="mongodb+srv://..." \
  -e NATS_URL="nats://demo.nats.io:4222" \
  orders-service:latest
```

### Docker Compose

```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose up -d
```

### Docker Hub

```bash
# Pull pre-built image
docker pull iyonuttxd/orders-service:latest

# Run
docker run -p 3002:3002 iyonuttxd/orders-service:latest
```

---

## ☁️ Azure Deployment

### Azure App Service

1. **Create App Service:**
```bash
az webapp create \
  --resource-group orders-rg \
  --plan orders-plan \
  --name orders-service \
  --runtime "NODE|18-lts"
```

2. **Configure Environment Variables:**
```bash
az webapp config appsettings set \
  --resource-group orders-rg \
  --name orders-service \
  --settings \
    MONGODB_URI="mongodb+srv://..." \
    NATS_URL="nats://..." \
    OPA_URL="https://..." \
    PAYMENT_BASE_URL="https://..." \
    PAYMENT_API_KEY="..."
```

3. **Deploy:**
```bash
# Using Azure CLI
az webapp deployment source config-zip \
  --resource-group orders-rg \
  --name orders-service \
  --src orders-service.zip

# Or using GitHub Actions (see .github/workflows/)
```

4. **Verify:**
```bash
curl https://orders-service.azurewebsites.net/api/v1/health
```

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Specific Tests

```bash
# Unit tests only
npm test tests/unit

# Use case tests
npm test tests/unit/use-cases

# Integration tests (requires MongoDB)
npm test tests/integration
```

### Coverage Report

```bash
npm test -- --coverage
```

View HTML report: `coverage/lcov-report/index.html`

---

## 🔍 Troubleshooting

### Issue: CORS errors in browser
**Solution:** CORS is enabled by default. Check that your frontend origin is allowed.

### Issue: JSON parse errors in Windows CMD
**Solution:** 
- Use PowerShell instead of CMD
- Or escape quotes properly: `\"`
- Or use a JSON file: `curl -X POST ... -d @request.json`

### Issue: MongoDB connection timeout
**Solution:**
- Check your MongoDB Atlas IP whitelist
- Verify connection string format
- Check firewall settings

### Issue: NATS connection failed
**Solution:**
- NATS is optional - service will work without it
- Verify NATS_URL is correct
- Check network connectivity

### Issue: Payment gateway errors
**Solution:**
- Payment gateway is optional - service simulates payments when disabled
- Verify API key and base URL
- Check gateway documentation

### Issue: OPA authorization denied
**Solution:**
- OPA is optional with fail-open by default
- Set `OPA_FAIL_OPEN=true` to allow on errors
- Verify policy path is correct

---

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3002/api/v1/health
```

Response:
```json
{
  "status": "UP",
  "timestamp": "2025-01-07T12:00:00Z",
  "service": "Orders Service",
  "version": "1.0.0",
  "database": "MongoDB Atlas",
  "integrations": {
    "nats": { "status": "healthy", "message": "..." },
    "opa": { "status": "disabled", "message": "..." },
    "payment": { "status": "healthy", "message": "..." }
  }
}
```

### Metrics (Prometheus)
```bash
curl http://localhost:3002/api/v1/metrics
```

**Custom metrics:**
- `orders_service_orders_created_total` - Total orders created
- `orders_service_orders_paid_total` - Total orders paid
- `orders_service_orders_canceled_total` - Total orders canceled
- `orders_service_http_request_duration_seconds` - HTTP request latency

---

## 📝 License

MIT

---

## 👤 Author

**iYoNuttxD**
- GitHub: [@iYoNuttxD](https://github.com/iYoNuttxD)
- Service: [Orders Microservice](https://github.com/iYoNuttxD/orders-service-microservice)
