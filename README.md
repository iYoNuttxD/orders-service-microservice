# 📦 Microserviço de Pedidos (Orders Service)

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg) ![Express](https://img.shields.io/badge/Express-4.18-blue.svg) ![Azure](https://img.shields.io/badge/Azure-App%20Service-blue.svg) ![License](https://img.shields.io/badge/License-MIT-yellow.svg) ![Docker Hub](https://img.shields.io/badge/Docker-Hub-blue.svg)

**Microserviço cloud-native para gestão de Pedidos, Clientes, Restaurantes e Cardápios, com arquitetura limpa, mensageria NATS, autorização via OPA e integração de pagamentos (Stripe / HTTP).**

Autor: **[@iYoNuttxD](https://github.com/iYoNuttxD)**  
Imagem Docker: **[iyonuttxd/orders-service (Docker Hub)](https://hub.docker.com/r/iyonuttxd/orders-service)**

---

## 🎯 Funcionalidades

✅ **Arquitetura Limpa (Clean Architecture)**  
✅ **Gestão de Pedidos** (CRUD completo + pagamento)  
✅ **Clientes & Restaurantes** (CRUD)  
✅ **Integração de Pagamentos** (Stripe ou gateway HTTP)  
✅ **Mensageria NATS** (event-driven)  
✅ **Autorização via OPA** (políticas dinâmicas)  
✅ **Métricas Prometheus** (observabilidade)  
✅ **Health Checks** (status de integrações)  
✅ **Pronto para Azure App Service** (degradação graciosa)  
✅ **OpenAPI / Swagger** (documentação viva)  
✅ **Testes (Jest)** unidade e integração  

---

## 🏗️ Arquitetura

### Camadas
```
src/
├── domain/              # Regras de negócio e entidades
│   ├── entities/        # Order, etc.
│   ├── value-objects/   # Money, OrderStatus
│   ├── events/          # OrderCreated, OrderPaid, OrderCanceled
│   └── ports/           # Interfaces (OrderRepository, PaymentGateway, ...)
├── infra/               # Implementações infra
│   ├── repositories/    # MongoDB
│   └── adapters/        # NATS, OPA, Pagamento
├── features/            # Slices verticais (orders, system)
│   ├── orders/
│   │   ├── http/        # Handlers & rotas
│   │   └── use-cases/   # Casos de uso
│   └── system/          # Health & métricas
└── main/                # Bootstrap
    ├── app.js
    └── container.js
```

### Pontos de Integração
- **MongoDB Atlas** (obrigatório)  
- **NATS** (opcional)  
- **OPA** (opcional, fail-open padrão)  
- **Gateway de Pagamento** (opcional; simula se não configurado)  

---

## 🛠️ Stack
- Node.js 18+
- Express
- MongoDB Atlas + Mongoose
- NATS
- Axios
- Winston (logs)
- Prom-client (métricas)
- Jest (testes)
- Docker

---

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- Conta MongoDB Atlas
- (Opcional) Servidor NATS
- (Opcional) OPA
- (Opcional) Stripe ou gateway HTTP

### 1. Clonar
```bash
git clone https://github.com/iYoNuttxD/orders-service-microservice.git
cd orders-service-microservice
```

### 2. Instalar
```bash
npm install
```

### 3. Configurar Ambiente
```bash
cp .env.example .env
# Edite .env
```

**Mínimo (somente MongoDB):**
```env
NODE_ENV=production
PORT=3002
MONGODB_URI=
```

**Completo (todas integrações):**
```env
NODE_ENV=production
PORT=3002

# MongoDB Atlas
MONGODB_URI=

# NATS (deixe vazio para desabilitar)
NATS_URL=nats://demo.nats.io:4222

# OPA (deixe vazio para desabilitar)
OPA_URL=https://seu-opa.worker.dev
OPA_POLICY_PATH=/v1/data/orders/allow
OPA_FAIL_OPEN=true

# Pagamento - 'stripe' ou 'http'
PAYMENT_PROVIDER=stripe

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_CURRENCY=brl
STRIPE_WEBHOOK_SECRET=whsec_xxx

# HTTP Payment (quando PAYMENT_PROVIDER=http)
PAYMENT_BASE_URL=https://payment-api.example.com/api
PAYMENT_API_KEY=xxx

# Outras
LOG_LEVEL=info
METRICS_ENABLED=true
PAYMENT_TIMEOUT=5000
```

### 4. Rodar
**Dev:**
```bash
npm run dev
```
**Prod:**
```bash
npm start
```
Acesse: `http://localhost:3002`

---

## 📡 Endpoints Principais
### Sistema
- `GET /api/v1/health`
- `GET /api/v1/metrics`
- `GET /api-docs`

### Pedidos
- `GET /api/v1/pedidos`
- `GET /api/v1/pedidos/:id`
- `POST /api/v1/pedidos`
- `POST /api/v1/pedidos/:id/pagar` (Idempotency-Key)
- `PATCH /api/v1/pedidos/:id/status`
- `POST /api/v1/pedidos/:id/cancelar`

### Webhook Stripe
- `POST /api/v1/stripe/webhook`

### Legado
- `/api/v1/clientes`, `/restaurantes`, `/cardapios`, `/avaliacoes`, `/pagamentos`

---

## 💻 Exemplos
**Criar Pedido:**
```bash
curl -X POST http://localhost:3002/api/v1/pedidos \
  -H "Content-Type: application/json" \
  -d '{"clienteId":"64abc123","restauranteId":"64def456","items":[{"cardapioId":"64ghi789","quantidade":2}]}''
```

**Pagar Pedido:**
```bash
curl -X POST http://localhost:3002/api/v1/pedidos/64abc123/pagar \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: chave-unica-123" \
  -d '{"paymentMethod":"credit_card"}'
```

---

## 🐳 Docker
### Build
```bash
docker build -t orders-service:latest .
```
### Run
```bash
docker run -p 3002:3002 \
  -e MONGODB_URI="mongodb+srv://..." \
  orders-service:latest
```
### Docker Hub
```bash
docker pull iyonuttxd/orders-service:latest
docker run -p 3002:3002 iyonuttxd/orders-service:latest
```
Link: https://hub.docker.com/r/iyonuttxd/orders-service

---

## ☁️ Deploy Azure
```bash
az webapp create \
  --resource-group pedidos-rg \
  --plan pedidos-plan \
  --name pedidos-service \
  --runtime "NODE|18-lts"
```
Configurar variáveis e publicar; verificar com:
```bash
curl https://pedidos-service.azurewebsites.net/api/v1/health
```

---

## 🧪 Testes
```bash
npm test
npm test -- --coverage
```
Relatório: `coverage/lcov-report/index.html`

---

## 🔍 Troubleshooting
- Conexão Mongo: verifique whitelist do Atlas.
- NATS falhou: opcional, pode deixar desabilitado.
- Pagamento falhou: checar chave/API e provider.
- OPA nega tudo: revise policy path.

---

## 💳 Stripe
Webhook local (Stripe CLI):
```bash
stripe listen --forward-to localhost:3002/api/v1/stripe/webhook
stripe trigger payment_intent.succeeded
```
Idempotência: use header `Idempotency-Key`.

---

## 📊 Métricas
```bash
curl http://localhost:3002/api/v1/metrics
```
Principais:
- orders_service_orders_created_total
- orders_service_orders_paid_total
- orders_service_payment_latency_seconds

---

## 📝 Licença
MIT

## 👤 Autor
[@iYoNuttxD](https://github.com/iYoNuttxD) | [Docker Hub](https://hub.docker.com/r/iyonuttxd/orders-service)
