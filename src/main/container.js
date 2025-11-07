require('dotenv').config();

// Infrastructure
const MongoOrderRepository = require('../infra/repositories/mongodb/MongoOrderRepository');
const PaymentIntegrationAdapter = require('../infra/adapters/PaymentIntegrationAdapter');
const StripePaymentAdapter = require('../infra/adapters/StripePaymentAdapter');
const OPAPolicyClient = require('../infra/adapters/OPAPolicyClient');
const NatsMessageBus = require('../infra/adapters/NatsMessageBus');
const MongoIdGenerator = require('../infra/adapters/MongoIdGenerator');
const SystemClock = require('../infra/adapters/SystemClock');

// Existing repositories (for backward compatibility)
const ClienteRepository = require('../repositories/ClienteRepository');
const RestauranteRepository = require('../repositories/RestauranteRepository');
const CardapioRepository = require('../repositories/CardapioRepository');

// Use cases
const CreateOrder = require('../features/orders/use-cases/CreateOrder');
const GetOrder = require('../features/orders/use-cases/GetOrder');
const ListOrders = require('../features/orders/use-cases/ListOrders');
const PayOrder = require('../features/orders/use-cases/PayOrder');
const CancelOrder = require('../features/orders/use-cases/CancelOrder');
const UpdateOrderStatus = require('../features/orders/use-cases/UpdateOrderStatus');
const GetDashboardStats = require('../features/orders/use-cases/GetDashboardStats');

// Handlers
const OrdersHandlers = require('../features/orders/http/handlers');
const { SystemHandlers } = require('../features/system/http/handlers');

const logger = require('../utils/logger');

/**
 * Dependency Injection Container
 * Wires all dependencies based on environment configuration
 */
class Container {
  constructor() {
    this.instances = {};
  }

  // Singleton getter pattern
  _getSingleton(key, factory) {
    if (!this.instances[key]) {
      this.instances[key] = factory();
    }
    return this.instances[key];
  }

  // Infrastructure - Adapters
  getPaymentGateway() {
    return this._getSingleton('paymentGateway', () => {
      const provider = process.env.PAYMENT_PROVIDER || 'http';
      if (provider === 'stripe') {
        const config = {
          secretKey: process.env.STRIPE_SECRET_KEY,
          currency: process.env.STRIPE_CURRENCY || 'usd',
          timeout: parseInt(process.env.PAYMENT_TIMEOUT || '10000')
        };
        const adapter = new StripePaymentAdapter(config, logger);
        if (adapter.isEnabled()) {
          logger.info('Payment gateway enabled (Stripe)', { currency: config.currency });
        } else {
          logger.warn('Stripe configured as provider but no STRIPE_SECRET_KEY provided; payment disabled');
        }
        return adapter;
      }

      // Default: HTTP mock/integration adapter
      const config = {
        baseUrl: process.env.PAYMENT_BASE_URL,
        apiKey: process.env.PAYMENT_API_KEY,
        timeout: parseInt(process.env.PAYMENT_TIMEOUT || '10000')
      };
      const adapter = new PaymentIntegrationAdapter(config, logger);
      if (adapter.isEnabled()) {
        logger.info('Payment gateway enabled (HTTP)', { baseUrl: config.baseUrl });
      } else {
        logger.warn('Payment gateway disabled - no config provided');
      }
      return adapter;
    });
  }

  getPolicyClient() {
    return this._getSingleton('policyClient', () => {
      const config = {
        baseUrl: process.env.OPA_URL,
        policyPath: process.env.OPA_POLICY_PATH,
        timeout: parseInt(process.env.OPA_TIMEOUT || '5000'),
        failOpen: process.env.OPA_FAIL_OPEN !== 'false' // Default to fail-open
      };

      const client = new OPAPolicyClient(config);

      if (client.isEnabled()) {
        logger.info('OPA policy client enabled', {
          baseUrl: config.baseUrl,
          failOpen: config.failOpen
        });
      } else {
        logger.warn('OPA policy client disabled - no config provided');
      }

      return client;
    });
  }

  getMessageBus() {
    return this._getSingleton('messageBus', () => {
      const config = {
        url: process.env.NATS_URL,
        timeout: parseInt(process.env.NATS_TIMEOUT || '5000')
      };

      const bus = new NatsMessageBus(config);

      if (bus.isEnabled()) {
        logger.info('NATS message bus enabled', { url: config.url });
      } else {
        logger.warn('NATS message bus disabled - no config provided');
      }

      return bus;
    });
  }

  getOrderRepository() {
    return this._getSingleton('orderRepository', () => {
      return new MongoOrderRepository();
    });
  }

  getIdGenerator() {
    return this._getSingleton('idGenerator', () => {
      return new MongoIdGenerator();
    });
  }

  getClock() {
    return this._getSingleton('clock', () => {
      return new SystemClock();
    });
  }

  // Legacy repositories (for backward compatibility during migration)
  getClienteRepository() {
    return ClienteRepository;
  }

  getRestauranteRepository() {
    return RestauranteRepository;
  }

  getCardapioRepository() {
    return CardapioRepository;
  }

  // Use Cases
  getCreateOrderUseCase() {
    return this._getSingleton('createOrderUseCase', () => {
      return new CreateOrder({
        orderRepository: this.getOrderRepository(),
        clienteRepository: this.getClienteRepository(),
        restauranteRepository: this.getRestauranteRepository(),
        cardapioRepository: this.getCardapioRepository(),
        messageBus: this.getMessageBus(),
        policyClient: this.getPolicyClient()
      });
    });
  }

  getGetOrderUseCase() {
    return this._getSingleton('getOrderUseCase', () => {
      return new GetOrder({
        orderRepository: this.getOrderRepository()
      });
    });
  }

  getListOrdersUseCase() {
    return this._getSingleton('listOrdersUseCase', () => {
      return new ListOrders({
        orderRepository: this.getOrderRepository()
      });
    });
  }

  getPayOrderUseCase() {
    return this._getSingleton('payOrderUseCase', () => {
      return new PayOrder({
        orderRepository: this.getOrderRepository(),
        paymentGateway: this.getPaymentGateway(),
        messageBus: this.getMessageBus()
      });
    });
  }

  getCancelOrderUseCase() {
    return this._getSingleton('cancelOrderUseCase', () => {
      return new CancelOrder({
        orderRepository: this.getOrderRepository(),
        messageBus: this.getMessageBus(),
        policyClient: this.getPolicyClient()
      });
    });
  }

  getUpdateOrderStatusUseCase() {
    return this._getSingleton('updateOrderStatusUseCase', () => {
      return new UpdateOrderStatus({
        orderRepository: this.getOrderRepository()
      });
    });
  }

  getDashboardStatsUseCase() {
    return this._getSingleton('dashboardStatsUseCase', () => {
      return new GetDashboardStats({
        orderRepository: this.getOrderRepository()
      });
    });
  }

  // HTTP Handlers
  getOrdersHandlers() {
    return this._getSingleton('ordersHandlers', () => {
      return new OrdersHandlers({
        createOrder: this.getCreateOrderUseCase(),
        getOrder: this.getGetOrderUseCase(),
        listOrders: this.getListOrdersUseCase(),
        payOrder: this.getPayOrderUseCase(),
        cancelOrder: this.getCancelOrderUseCase(),
        updateOrderStatus: this.getUpdateOrderStatusUseCase(),
        getDashboardStats: this.getDashboardStatsUseCase()
      });
    });
  }

  getSystemHandlers() {
    return this._getSingleton('systemHandlers', () => {
      return new SystemHandlers({
        orderRepository: this.getOrderRepository(),
        messageBus: this.getMessageBus(),
        policyClient: this.getPolicyClient(),
        paymentGateway: this.getPaymentGateway()
      });
    });
  }

  // Cleanup
  async close() {
    const messageBus = this.instances.messageBus;
    if (messageBus) {
      await messageBus.close();
    }
  }
}

// Export singleton instance
module.exports = new Container();
