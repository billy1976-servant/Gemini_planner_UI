// Convert a slider (0–1) into the real output value
export function sliderToValue(slider: number, min: number, max: number) {
    return min + (max - min) * slider;
  }
  
  
  // Determine if the slider means "OFF"
  export function sliderIsOff(slider: number) {
    return slider > 1;
  }
  
  
  // Convert slider to actual output OR null if off
  export function sliderActual(slider: number, min: number, max: number) {
    if (sliderIsOff(slider)) return null;
    return sliderToValue(slider, min, max);
  }
  
  
  