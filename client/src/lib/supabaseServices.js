import { supabase } from './supabaseAuth';

// Helper function to convert snake_case to camelCase
const snakeToCamel = (service) => {
  if (!service) return null;
  return {
    ...service,
    serviceType: service.service_type,
    expiryDate: service.expiry_date,
    pricePerLiter: service.price_per_liter,
    fuelType: service.fuel_type,
    reminderSent: service.reminder_sent,
    carId: service.car_id,
    userId: service.user_id,
    createdAt: service.created_at,
    updatedAt: service.updated_at
  };
};

// Helper function to convert camelCase to snake_case
const camelToSnake = (service) => {
  if (!service) return null;
  return {
    ...service,
    service_type: service.serviceType,
    expiry_date: service.expiryDate,
    price_per_liter: service.pricePerLiter,
    fuel_type: service.fuelType,
    reminder_sent: service.reminderSent,
    car_id: service.carId,
    user_id: service.userId,
    created_at: service.createdAt,
    updated_at: service.updatedAt
  };
};

export const servicesService = {
  // Get all services for a car
  async getServices(carId) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('car_id', carId)
      .order('expiry_date', { ascending: false });

    if (error) throw error;
    return data.map(snakeToCamel);
  },

  // Get single service
  async getService(serviceId) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (error) throw error;
    return snakeToCamel(data);
  },

  // Create new service
  async createService(serviceData) {
    const dbData = camelToSnake(serviceData);
    const { data, error } = await supabase
      .from('services')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return snakeToCamel(data);
  },

  // Update service
  async updateService(serviceId, serviceData) {
    const dbData = camelToSnake(serviceData);
    const { data, error } = await supabase
      .from('services')
      .update(dbData)
      .eq('id', serviceId)
      .select()
      .single();

    if (error) throw error;
    return snakeToCamel(data);
  },

  // Delete service
  async deleteService(serviceId) {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId);

    if (error) throw error;
  }
};

export default servicesService;
