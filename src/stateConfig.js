export const STATE_CONFIG = {
  michigan: {
    key: "michigan",
    label: "Michigan",
    minimumAge: 21,
    requiresResidencyCheck: false,
    requiresIdVerification: true,
    limits: {
      maxTotalGrams: 70.87,
      maxConcentrateGrams: 15
    }
  },
  illinois: {
    key: "illinois",
    label: "Illinois",
    minimumAge: 21,
    requiresResidencyCheck: true,
    requiresIdVerification: true,
    limits: {
      resident: {
        maxFlowerGrams: 30,
        maxConcentrateGrams: 5,
        maxInfusedMg: 500
      },
      nonResident: {
        maxFlowerGrams: 15,
        maxConcentrateGrams: 2.5,
        maxInfusedMg: 250
      }
    }
  }
};