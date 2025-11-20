// Emission factors (kg CO2e per unit)
const EMISSION_FACTORS = {
  transportation: {
    car: 0.21, // per km
    bus: 0.08, // per km
    train: 0.04, // per km
    plane: 0.25, // per km
    motorcycle: 0.11, // per km
    bicycle: 0, // per km
    walking: 0 // per km
  },
  energy: {
    electricity: 0.5, // per kWh
    natural_gas: 2.0, // per m³
    heating_oil: 2.7, // per liter
    propane: 1.5 // per liter
  },
  diet: {
    beef: 27.0, // per kg
    chicken: 6.9, // per kg
    pork: 12.1, // per kg
    fish: 5.1, // per kg
    eggs: 4.5, // per kg
    dairy: 3.2, // per kg
    vegetables: 2.0, // per kg
    fruits: 1.1 // per kg
  },
  shopping: {
    electronics: 50.0, // per item
    clothing: 15.0, // per item
    furniture: 100.0, // per item
    plastic: 6.0 // per kg
  },
  waste: {
    plastic: 3.0, // per kg
    paper: 1.5, // per kg
    food: 2.5, // per kg
    glass: 1.0 // per kg
  }
};

class EmissionCalculator {
  static calculateTransportation(mode, distance, passengers = 1) {
    const baseEmission = distance * EMISSION_FACTORS.transportation[mode];
    return passengers > 0 ? baseEmission / passengers : baseEmission;
  }

  static calculateEnergy(type, consumption) {
    return consumption * EMISSION_FACTORS.energy[type];
  }

  static calculateDiet(foodType, quantity) {
    return quantity * EMISSION_FACTORS.diet[foodType];
  }

  static calculateShopping(category, quantity = 1) {
    return quantity * EMISSION_FACTORS.shopping[category];
  }

  static calculateWaste(type, weight) {
    return weight * EMISSION_FACTORS.waste[type];
  }

  static getAvailableActivities(category) {
    return Object.keys(EMISSION_FACTORS[category] || {});
  }

  static getEmissionFactor(category, activity) {
    return EMISSION_FACTORS[category]?.[activity] || 1;
  }
}

export default EmissionCalculator;