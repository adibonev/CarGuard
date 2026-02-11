import { supabase } from './supabaseAuth';

export const carsService = {
  // Get all cars for current user
  async getAllCars(userId) {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get single car
  async getCar(carId) {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', carId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new car
  async createCar(userId, carData) {
    const { data, error } = await supabase
      .from('cars')
      .insert({
        user_id: userId,
        ...carData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update car
  async updateCar(carId, carData) {
    const { data, error } = await supabase
      .from('cars')
      .update(carData)
      .eq('id', carId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete car
  async deleteCar(carId) {
    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', carId);

    if (error) throw error;
  },

  // Decode VIN (using external API через Edge Function в бъдеще)
  async decodeVin(vin) {
    // За сега използваме директно NHTSA API
    // В бъдеще може да създадем Edge Function за това
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
    const result = await response.json();

    if (!result.Results) {
      throw new Error('Invalid VIN or API error');
    }

    const results = result.Results;
    
    // Извлечи важните данни
    const getMakeModel = (variableName) => {
      const item = results.find(r => r.Variable === variableName);
      return item?.Value || '';
    };

    return {
      brand: getMakeModel('Make'),
      model: getMakeModel('Model'),
      year: getMakeModel('Model Year'),
      engineType: getMakeModel('Engine Model'),
      horsepower: getMakeModel('Engine Brake (hp) From'),
      transmission: getMakeModel('Transmission Style'),
      fuelType: getMakeModel('Fuel Type - Primary'),
    };
  }
};

export default carsService;
