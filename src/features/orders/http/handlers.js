/**
 * Orders HTTP Handlers
 * Thin handlers that delegate to use cases
 */
class OrdersHandlers {
  constructor({ 
    createOrder, 
    getOrder, 
    listOrders, 
    payOrder, 
    cancelOrder, 
    updateOrderStatus,
    getDashboardStats
  }) {
    this.createOrder = createOrder;
    this.getOrder = getOrder;
    this.listOrders = listOrders;
    this.payOrder = payOrder;
    this.cancelOrder = cancelOrder;
    this.updateOrderStatus = updateOrderStatus;
    this.getDashboardStats = getDashboardStats;
  }

  async handleCreate(req, res, next) {
    try {
      const order = await this.createOrder.execute(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Pedido criado com sucesso',
        data: order.toPrimitives ? order.toPrimitives() : order
      });
    } catch (error) {
      next(error);
    }
  }

  async handleGetById(req, res, next) {
    try {
      const order = await this.getOrder.execute(req.params.id);
      
      res.json({
        success: true,
        data: order.toPrimitives ? order.toPrimitives() : order
      });
    } catch (error) {
      next(error);
    }
  }

  async handleList(req, res, next) {
    try {
      const { clienteId, restauranteId, status, dataInicio, dataFim } = req.query;
      const orders = await this.listOrders.execute({ 
        clienteId, 
        restauranteId, 
        status,
        dataInicio,
        dataFim
      });
      
      const ordersData = orders.map(o => o.toPrimitives ? o.toPrimitives() : o);
      
      res.json({
        success: true,
        data: ordersData,
        total: ordersData.length
      });
    } catch (error) {
      next(error);
    }
  }

  async handlePay(req, res, next) {
    try {
      const { paymentMethod, ...paymentData } = req.body;
      const idempotencyKey = req.get('Idempotency-Key');
      
      const result = await this.payOrder.execute({
        orderId: req.params.id,
        paymentMethod,
        paymentData,
        idempotencyKey
      });
      
      res.json({
        success: true,
        message: 'Pagamento processado com sucesso',
        data: {
          order: result.order.toPrimitives ? result.order.toPrimitives() : result.order,
          payment: result.payment
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async handleCancel(req, res, next) {
    try {
      const { reason, canceledBy } = req.body;
      const order = await this.cancelOrder.execute({
        orderId: req.params.id,
        reason,
        canceledBy
      });
      
      res.json({
        success: true,
        message: 'Pedido cancelado com sucesso',
        data: order.toPrimitives ? order.toPrimitives() : order
      });
    } catch (error) {
      next(error);
    }
  }

  async handleUpdateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const order = await this.updateOrderStatus.execute({
        orderId: req.params.id,
        status
      });
      
      res.json({
        success: true,
        message: 'Status do pedido atualizado com sucesso',
        data: order.toPrimitives ? order.toPrimitives() : order
      });
    } catch (error) {
      next(error);
    }
  }

  async handleDashboard(req, res, next) {
    try {
      const stats = await this.getDashboardStats.execute();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrdersHandlers;
