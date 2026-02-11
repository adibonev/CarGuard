import { supabase } from './supabaseAuth';

export const adminService = {
  // Check if current user is admin
  async isAdmin(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data?.is_admin === true;
  },

  // Get admin statistics
  async getStats() {
    // Total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Total cars
    const { count: totalCars } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true });

    // Total services
    const { count: totalServices } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true });

    // Expiring services (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const { count: expiringServices } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .lte('expiry_date', thirtyDaysFromNow.toISOString())
      .gte('expiry_date', new Date().toISOString());

    // New users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: newUsersToday } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // New users this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { count: newUsersWeek } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    // New users this month
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const { count: newUsersMonth } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString());

    // Services this month
    const { count: servicesMonth } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString());

    return {
      totalUsers: totalUsers || 0,
      totalCars: totalCars || 0,
      totalServices: totalServices || 0,
      expiringServices: expiringServices || 0,
      newUsersToday: newUsersToday || 0,
      newUsersWeek: newUsersWeek || 0,
      newUsersMonth: newUsersMonth || 0,
      servicesMonth: servicesMonth || 0,
    };
  },

  // Get all users
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get brand distribution
  async getBrandChart() {
    const { data, error } = await supabase
      .from('cars')
      .select('brand');

    if (error) throw error;

    // Count brands
    const brandCounts = data.reduce((acc, car) => {
      acc[car.brand] = (acc[car.brand] || 0) + 1;
      return acc;
    }, {});

    // Convert to array format
    return Object.entries(brandCounts).map(([brand, count]) => ({
      brand,
      count
    }));
  },

  // Get service type distribution
  async getServiceChart() {
    const { data, error } = await supabase
      .from('services')
      .select('service_type');

    if (error) throw error;

    // Count service types
    const serviceCounts = data.reduce((acc, service) => {
      acc[service.service_type] = (acc[service.service_type] || 0) + 1;
      return acc;
    }, {});

    // Convert to array format
    return Object.entries(serviceCounts).map(([serviceType, count]) => ({
      serviceType,
      count
    }));
  },

  // Get registration chart (last 6 months)
  async getRegistrationChart() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data, error } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by month
    const monthCounts = {};
    data.forEach(user => {
      const date = new Date(user.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    // Convert to array format
    return Object.entries(monthCounts).map(([month, registrations]) => ({
      month,
      registrations
    }));
  },

  // Get user details with their cars and services
  async getUserDetails(userId) {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('*')
      .eq('user_id', userId);

    if (carsError) throw carsError;

    // Get services for all cars
    const carIds = cars.map(c => c.id);
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .in('car_id', carIds);

    if (servicesError) throw servicesError;

    return {
      user,
      cars,
      services
    };
  }
};

export default adminService;
