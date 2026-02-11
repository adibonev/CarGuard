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
  const result = {};
  
  // Map only the fields we know about, converting to snake_case
  if (service.carId !== undefined) result.car_id = service.carId;
  if (service.userId !== undefined) result.user_id = service.userId;
  if (service.serviceType !== undefined) result.service_type = service.serviceType;
  if (service.expiryDate !== undefined) result.expiry_date = service.expiryDate;
  if (service.cost !== undefined) result.cost = service.cost;
  if (service.liters !== undefined) result.liters = service.liters;
  if (service.pricePerLiter !== undefined) result.price_per_liter = service.pricePerLiter;
  if (service.fuelType !== undefined) result.fuel_type = service.fuelType;
  if (service.notes !== undefined) result.notes = service.notes;
  if (service.reminderSent !== undefined) result.reminder_sent = service.reminderSent;
  if (service.createdAt !== undefined) result.created_at = service.createdAt;
  if (service.updatedAt !== undefined) result.updated_at = service.updatedAt;
  
  return result;
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
