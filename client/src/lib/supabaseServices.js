import { supabase } from './supabaseAuth';

export const servicesService = {
  // Get all services for a car
  async getServices(carId) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('car_id', carId)
      .order('service_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get single service
  async getService(serviceId) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new service
  async createService(serviceData) {
    const { data, error } = await supabase
      .from('services')
      .insert(serviceData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update service
  async updateService(serviceId, serviceData) {
    const { data, error } = await supabase
      .from('services')
      .update(serviceData)
      .eq('id', serviceId)
      .select()
      .single();

    if (error) throw error;
    return data;
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
