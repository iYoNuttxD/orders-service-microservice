# 📦 Orders Service Microservice

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)
![Express](https://img.shields.io/badge/Express-4.18-blue.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

**Microservice de Pedidos com MongoDB Atlas - Gestão completa de clientes, restaurantes, cardápios e pedidos.**

Desenvolvido por: **[@iYoNuttxD](https://github.com/iYoNuttxD)**

---

## 🎯 Funcionalidades

✅ **Gestão de Clientes** - CRUD completo
✅ **Gestão de Restaurantes** - CRUD completo
✅ **Gestão de Cardápios** - CRUD completo
✅ **Gestão de Pedidos** - CRUD completo com cálculo automático
✅ **Validações** - Express Validator
✅ **Logging** - Winston
✅ **Documentação** - OpenAPI/Swagger
✅ **Testes** - Jest

---

## 🛠️ Tecnologias

- Node.js 18+
- Express.js
- MongoDB Atlas
- Mongoose
- Winston (Logs)
- Jest (Testes)
- Docker

---

## 🚀 Como Executar

### 1. Clonar Repositório

```bash
git clone https://github.com/iYoNuttxD/orders-service-microservice.git
cd orders-service-microservice
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar .env

```bash
cp .env.example .env
# Edite o .env com suas credenciais do MongoDB Atlas
```

### 4. Testar Conexão

```bash
npm run test:db
```

### 5. Popular Banco (Opcional)

```bash
npm run seed
```

### 6. Executar

```bash
npm run dev
```

---

## 📡 Endpoints

### Clientes
- `GET /api/v1/clientes` - Listar todos
- `GET /api/v1/clientes/:id` - Buscar por ID
- `POST /api/v1/clientes` - Criar novo
- `PUT /api/v1/clientes/:id` - Atualizar
- `DELETE /api/v1/clientes/:id` - Deletar

### Restaurantes
- `GET /api/v1/restaurantes` - Listar todos
- `GET /api/v1/restaurantes/:id` - Buscar por ID
- `POST /api/v1/restaurantes` - Criar novo
- `PUT /api/v1/restaurantes/:id` - Atualizar
- `DELETE /api/v1/restaurantes/:id` - Deletar

### Pedidos
- `GET /api/v1/pedidos` - Listar todos
- `GET /api/v1/pedidos/dashboard` - Estatísticas
- `GET /api/v1/pedidos/:id` - Buscar por ID
- `POST /api/v1/pedidos` - Criar novo
- `PATCH /api/v1/pedidos/:id/status` - Atualizar status
- `PATCH /api/v1/pedidos/:id/cancelar` - Cancelar

## 🧪 Testes

### Executar todos os testes

```bash
npm test
```

### Testes unitários

```bash
npm run test:unit
```

### Testes de integração

```bash
npm run test:integration
```

### Coverage

Os testes geram relatório de cobertura em:
- **Console**: Resumo após execução
- **HTML**: `coverage/lcov-report/index.html`

```bash
# Abrir relatório HTML
open coverage/lcov-report/index.html  # Mac
start coverage/lcov-report/index.html # Windows
xdg-open coverage/lcov-report/index.html # Linux
```

### Estrutura de Testes

```
tests/
├── setup.js                    # Configuração global
├── unit/                       # Testes unitários (isolados)
│   ├── ClienteService.test.js
│   ├── PedidoService.test.js
│   └── ...
└── integration/                # Testes de integração (API)
    ├── clientes.test.js
    ├── pedidos.test.js
    └── ...
```

### Boas Práticas

- ✅ Testes isolados (cada teste é independente)
- ✅ MongoDB em memória (não precisa de banco real)
- ✅ Mocks para dependências externas
- ✅ Asserções claras e específicas
- ✅ Coverage mínimo: 80%

---

## 📄 Licença

MIT

---

## 👤 Autor

**iYoNuttxD**
- GitHub: [@iYoNuttxD](https://github.com/iYoNuttxD)