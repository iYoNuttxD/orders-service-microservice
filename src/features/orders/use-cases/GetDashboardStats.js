const logger = require('../../../utils/logger');

/**
 * GetDashboardStats Use Case
 * Retrieves order statistics for dashboard
 */
class GetDashboardStats {
  constructor({ orderRepository }) {
    this.orderRepository = orderRepository;
  }

  async execute() {
    try {
      logger.info('Getting dashboard statistics');
      
      const [
        totalPendentes,
        totalConfirmados,
        totalEntregues,
        totalVendas
      ] = await Promise.all([
        this.orderRepository.countByStatus('PENDENTE'),
        this.orderRepository.countByStatus('CONFIRMADO'),
        this.orderRepository.countByStatus('ENTREGUE'),
        this.orderRepository.getTotalVendas()
      ]);
      
      return {
        totalPendentes,
        totalConfirmados,
        totalEntregues,
        totalVendas
      };
    } catch (error) {
      logger.error('Error getting dashboard stats', { error: error.message });
      throw error;
    }
  }
}

module.exports = GetDashboardStats;
