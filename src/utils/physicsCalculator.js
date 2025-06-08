/**
 * Calculates beam deformation based on mass and angle
 * Uses the cantilever beam deflection formula
 * 
 * @param {number} masse - Applied mass in grams
 * @param {number} angle - Servomotor angle in degrees
 * @returns {number} - Deformation in meters
 */
/**
 * Calculates force applied based on mass and angle
 * 
 * @param {number} masse - Applied mass in grams
 * @param {number} angle - Servomotor angle in degrees
 * @returns {number} - Force in Newtons
 */
/**
 * 
 * @param {number} totalMass - Total mass in grams
 * @returns {Array} - Array of weight objects to show
 */
export function getVisibleWeights(totalMass) {
  // Available weights
  const availableWeights = [
    { id: 'weight-50g', type: '50g', value: 50 },
    { id: 'weight-20gL', type: '20gL', value: 20 },
    { id: 'weight-20gR', type: '20gR', value: 20 },
    { id: 'weight-10g', type: '10g', value: 10 }
  ];
  
  // Array to hold visible weights
  const visibleWeights = [];
  
  // Logic for showing weights based on mass
  if (totalMass >= 20 && totalMass < 40) {
    // Show only 20gL
    visibleWeights.push(availableWeights.find(w => w.type === '20gL'));
  } 
  else if (totalMass >= 40 && totalMass < 50) {
    // Show 20gL and 20gR
    visibleWeights.push(availableWeights.find(w => w.type === '20gL'));
    visibleWeights.push(availableWeights.find(w => w.type === '20gR'));
  }
  else if (totalMass >= 50 && totalMass < 70) {
    // Show only 50g
    visibleWeights.push(availableWeights.find(w => w.type === '50g'));
  }
  else if (totalMass >= 70 && totalMass < 90) {
    // Show 50g and 20gL
    visibleWeights.push(availableWeights.find(w => w.type === '50g'));
    visibleWeights.push(availableWeights.find(w => w.type === '20gL'));
  }
  else if (totalMass >= 90 && totalMass < 100) {
    // Show 50g, 20gL, and 20gR
    visibleWeights.push(availableWeights.find(w => w.type === '50g'));
    visibleWeights.push(availableWeights.find(w => w.type === '20gL'));
    visibleWeights.push(availableWeights.find(w => w.type === '20gR'));
  }
  else if (totalMass >= 100) {
    // Show all weights
    visibleWeights.push(...availableWeights);
  }
  
  return visibleWeights.filter(w => w !== undefined);
}