import Customer from '../models/Customer.js';
import Payment from '../models/Payment.js';
import Plan from '../models/Plan.js';

class MetricsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cached data or compute if not cached
  async getCachedOrCompute(key, computeFn) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await computeFn();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  // Calculate Monthly Recurring Revenue (MRR)
  async calculateMRR(userId, date = new Date()) {
    const key = `mrr_${userId}_${date.toISOString().slice(0, 7)}`;
    
    return this.getCachedOrCompute(key, async () => {
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const activeCustomers = await Customer.find({
        userId,
        status: 'active',
        subscriptionDate: { $lte: endOfMonth }
      }).populate('plan');

      const mrr = activeCustomers.reduce((total, customer) => {
        const monthlyPrice = customer.plan.getMonthlyPrice();
        return total + monthlyPrice;
      }, 0);

      return {
        current: mrr,
        previous: await this.getPreviousMRR(userId, date),
        growth: 0 // Will be calculated below
      };
    });
  }

  // Get previous month's MRR for comparison
  async getPreviousMRR(userId, currentDate) {
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    const activeCustomers = await Customer.find({
      userId,
      status: 'active',
      subscriptionDate: { $lte: prevMonthEnd }
    }).populate('plan');

    return activeCustomers.reduce((total, customer) => {
      const monthlyPrice = customer.plan.getMonthlyPrice();
      return total + monthlyPrice;
    }, 0);
  }

  // Calculate Annual Recurring Revenue (ARR)
  async calculateARR(userId, date = new Date()) {
    const mrrData = await this.calculateMRR(userId, date);
    return {
      current: mrrData.current * 12,
      previous: mrrData.previous * 12,
      growth: mrrData.growth
    };
  }

  // Calculate Churn Rate
  async calculateChurnRate(userId, date = new Date()) {
    const key = `churn_${userId}_${date.toISOString().slice(0, 7)}`;
    
    return this.getCachedOrCompute(key, async () => {
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Get customers who were active at the start of the month
      const customersAtStart = await Customer.countDocuments({
        userId,
        status: 'active',
        subscriptionDate: { $lt: startOfMonth }
      });

      // Get customers who churned during the month
      const churnedCustomers = await Customer.countDocuments({
        userId,
        status: 'churned',
        churnDate: { $gte: startOfMonth, $lte: endOfMonth }
      });

      const churnRate = customersAtStart > 0 ? (churnedCustomers / customersAtStart) * 100 : 0;

      // Get previous month's churn rate
      const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
      const prevMonthEnd = new Date(date.getFullYear(), date.getMonth(), 0);
      
      const prevCustomersAtStart = await Customer.countDocuments({
        userId,
        status: 'active',
        subscriptionDate: { $lt: prevMonth }
      });

      const prevChurnedCustomers = await Customer.countDocuments({
        userId,
        status: 'churned',
        churnDate: { $gte: prevMonth, $lte: prevMonthEnd }
      });

      const prevChurnRate = prevCustomersAtStart > 0 ? (prevChurnedCustomers / prevCustomersAtStart) * 100 : 0;

      return {
        current: churnRate,
        previous: prevChurnRate,
        growth: churnRate - prevChurnRate
      };
    });
  }

  // Calculate Customer Lifetime Value (LTV)
  async calculateLTV(userId, date = new Date()) {
    const key = `ltv_${userId}_${date.toISOString().slice(0, 7)}`;
    
    return this.getCachedOrCompute(key, async () => {
      const churnData = await this.calculateChurnRate(userId, date);
      const mrrData = await this.calculateMRR(userId, date);

      // Get average revenue per user
      const activeCustomers = await Customer.find({
        userId,
        status: 'active'
      }).populate('plan');

      const totalRevenue = activeCustomers.reduce((total, customer) => {
        return total + customer.plan.getMonthlyPrice();
      }, 0);

      const avgRevenuePerUser = activeCustomers.length > 0 ? totalRevenue / activeCustomers.length : 0;
      const monthlyChurnRate = churnData.current / 100;

      const ltv = monthlyChurnRate > 0 ? avgRevenuePerUser / monthlyChurnRate : 0;

      return {
        current: ltv,
        previous: 0, // Simplified for now
        growth: 0
      };
    });
  }

  // Calculate Customer Acquisition Cost (CAC)
  async calculateCAC(userId, date = new Date()) {
    const key = `cac_${userId}_${date.toISOString().slice(0, 7)}`;
    
    return this.getCachedOrCompute(key, async () => {
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Get new customers this month
      const newCustomers = await Customer.find({
        userId,
        subscriptionDate: { $gte: startOfMonth, $lte: endOfMonth }
      });

      // Calculate total acquisition cost
      const totalAcquisitionCost = newCustomers.reduce((total, customer) => {
        return total + (customer.acquisitionCost || 0);
      }, 0);

      const cac = newCustomers.length > 0 ? totalAcquisitionCost / newCustomers.length : 0;

      return {
        current: cac,
        previous: 0, // Simplified for now
        growth: 0
      };
    });
  }

  // Get comprehensive metrics
  async getAllMetrics(userId, date = new Date()) {
    const [mrr, arr, churn, ltv, cac] = await Promise.all([
      this.calculateMRR(userId, date),
      this.calculateARR(userId, date),
      this.calculateChurnRate(userId, date),
      this.calculateLTV(userId, date),
      this.calculateCAC(userId, date)
    ]);

    // Calculate growth percentages
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      mrr: {
        ...mrr,
        growth: calculateGrowth(mrr.current, mrr.previous)
      },
      arr: {
        ...arr,
        growth: calculateGrowth(arr.current, arr.previous)
      },
      churn: {
        ...churn,
        growth: calculateGrowth(churn.current, churn.previous)
      },
      ltv: {
        ...ltv,
        growth: calculateGrowth(ltv.current, ltv.previous)
      },
      cac: {
        ...cac,
        growth: calculateGrowth(cac.current, cac.previous)
      }
    };
  }

  // Get historical data for charts
  async getHistoricalData(userId, months = 12) {
    const key = `historical_${userId}_${months}`;
    
    return this.getCachedOrCompute(key, async () => {
      const data = [];
      const currentDate = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const metrics = await this.getAllMetrics(userId, date);
        
        data.push({
          month: date.toISOString().slice(0, 7),
          date: date,
          ...metrics
        });
      }

      return data;
    });
  }

  // Get customer growth data
  async getCustomerGrowth(userId, months = 12) {
    const key = `customer_growth_${userId}_${months}`;
    
    return this.getCachedOrCompute(key, async () => {
      const data = [];
      const currentDate = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);

        const totalCustomers = await Customer.countDocuments({
          userId,
          subscriptionDate: { $lte: endOfMonth }
        });

        const activeCustomers = await Customer.countDocuments({
          userId,
          status: 'active',
          subscriptionDate: { $lte: endOfMonth }
        });

        const churnedCustomers = await Customer.countDocuments({
          userId,
          status: 'churned',
          churnDate: { $lte: endOfMonth }
        });

        data.push({
          month: date.toISOString().slice(0, 7),
          date: date,
          total: totalCustomers,
          active: activeCustomers,
          churned: churnedCustomers
        });
      }

      return data;
    });
  }
}

export default new MetricsService();
