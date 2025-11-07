const Stripe = require('stripe');

class StripePaymentAdapter {
  constructor({ secretKey, currency = 'usd', timeout = 5000 } = {}, logger, metrics) {
    this.logger = logger;
    this.metrics = metrics;
    this.currency = currency;
    this.timeout = timeout;
    this.enabled = !!secretKey;

    this.stripe = this.enabled
      ? new Stripe(secretKey, { httpClient: Stripe.createFetchHttpClient() })
      : null;
  }

  isEnabled() {
    return this.enabled;
  }

  async getStatus() {
    if (!this.enabled) {
      return { status: 'disabled', message: 'Stripe not configured' };
    }
    // Health rápido e barato: tentar recuperar a conta
    try {
      const account = await this.stripe.accounts.retrieve();
      return {
        status: 'healthy',
        message: 'Stripe is operational',
        details: {
          accountId: account.id,
          displayName: account?.settings?.dashboard?.display_name
        }
      };
    } catch (e) {
      this.logger?.warn?.('Stripe health check failed', { error: e.message });
      return {
        status: 'unhealthy',
        message: e.message
      };
    }
  }

  // Contrato esperado pelo PayOrder use-case
  async processPayment({ orderId, amount, idempotencyKey }) {
    if (!this.enabled) return { success: false, disabled: true };

    const started = Date.now();
    try {
      const amountInMinor = Math.round(Number(amount) * 100);

      const intent = await this.stripe.paymentIntents.create(
        {
          amount: amountInMinor,
          currency: this.currency,
          description: `Order ${orderId}`,
          confirm: true,
          payment_method: 'pm_card_visa'
        },
        {
          idempotencyKey,
          timeout: this.timeout
        }
      );

      this.metrics?.observe?.('payment_latency_ms', Date.now() - started);

      const success = intent.status === 'succeeded';
      return {
        success,
        transactionId: intent.id,
        providerStatus: intent.status,
        raw: {
          charges: intent.charges?.data?.length || 0
        }
      };
    } catch (e) {
      this.metrics?.observe?.('payment_latency_ms', Date.now() - started);
      this.logger?.warn?.('Stripe payment failed', { error: e.message, code: e.code });
      return { success: false, error: e.message, providerStatus: e.code };
    }
  }
}

module.exports = StripePaymentAdapter;
