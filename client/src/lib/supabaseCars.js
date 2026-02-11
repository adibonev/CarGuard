import { supabase } from './supabaseAuth';

// Helper function to convert snake_case to camelCase
const snakeToCamel = (car) => {
  if (!car) return null;
  return {
    ...car,
    licensePlate: car.license_plate,
    engineType: car.engine_type,
    euroStandard: car.euro_standard,
    fuelType: car.fuel_type,
    tireWidth: car.tire_width,
    tireHeight: car.tire_height,
    tireDiameter: car.tire_diameter,
    tireSeason: car.tire_season,
    tireBrand: car.tire_brand,
    tireDot: car.tire_dot
  };
};

export const carsService = {
  // Get all cars for current user
  async getAllCars(userId) {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    // Convert snake_case to camelCase
    return data.map(snakeToCamel);
  },

  // Get single car
  async getCar(carId) {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', carId)
      .single();

    if (error) throw error;
    // Convert snake_case to camelCase
    return snakeToCamel(data);
  },

  // Create new car
  async createCar(userId, carData) {
    // Convert camelCase to snake_case for Supabase
    // Also convert empty strings to null for numeric fields
    const dbData = {
      user_id: userId,
      brand: carData.brand || null,
      model: carData.model || null,
      year: carData.year || null,
      license_plate: carData.licensePlate || null,
      vin: carData.vin || null,
      engine_type: carData.engineType || null,
      horsepower: carData.horsepower ? parseInt(carData.horsepower) : null,
      transmission: carData.transmission || null,
      euro_standard: carData.euroStandard || null,
      mileage: carData.mileage ? parseInt(carData.mileage) : null,
      fuel_type: carData.fuelType || null,
      tire_width: carData.tireWidth ? parseInt(carData.tireWidth) : null,
      tire_height: carData.tireHeight ? parseInt(carData.tireHeight) : null,
      tire_diameter: carData.tireDiameter ? parseInt(carData.tireDiameter) : null,
      tire_season: carData.tireSeason || null,
      tire_brand: carData.tireBrand || null,
      tire_dot: carData.tireDot || null
    };

    const { data, error } = await supabase
      .from('cars')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update car
  async updateCar(carId, carData) {
    // Convert camelCase to snake_case for Supabase
    // Also convert empty strings to null for numeric fields
    const dbData = {
      brand: carData.brand || null,
      model: carData.model || null,
      year: carData.year || null,
      license_plate: carData.licensePlate || null,
      vin: carData.vin || null,
      engine_type: carData.engineType || null,
      horsepower: carData.horsepower ? parseInt(carData.horsepower) : null,
      transmission: carData.transmission || null,
      euro_standard: carData.euroStandard || null,
      mileage: carData.mileage ? parseInt(carData.mileage) : null,
      fuel_type: carData.fuelType || null,
      tire_width: carData.tireWidth ? parseInt(carData.tireWidth) : null,
      tire_height: carData.tireHeight ? parseInt(carData.tireHeight) : null,
      tire_diameter: carData.tireDiameter ? parseInt(carData.tireDiameter) : null,
      tire_season: carData.tireSeason || null,
      tire_brand: carData.tireBrand || null,
      tire_dot: carData.tireDot || null
    };

    const { data, error } = await supabase
      .from('cars')
      .update(dbData)
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
