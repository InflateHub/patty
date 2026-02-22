/// <reference types="vite/client" />

// ionicons 7.x does not ship .d.ts files in this install;
// declare the module so TypeScript accepts the import.
// Icons are typed as `string` (they are SVG path strings at runtime).
declare module 'ionicons/icons' {
  const icons: Record<string, string>;
  export const add: string;
  export const trash: string;
  export const createOutline: string;
  export const pulseOutline: string;
  export const restaurantOutline: string;
  export const calendarOutline: string;
  export const trendingUpOutline: string;
  export const waterOutline: string;
  export const settingsOutline: string;
  export const moonOutline: string;
  export const timeOutline: string;
  export const cameraOutline: string;
  export const fastFoodOutline: string;
  export const closeOutline: string;
  export const addOutline: string;
  export const removeCircleOutline: string;
  export const chevronBackOutline: string;
  export const chevronForwardOutline: string;
  export const imageOutline: string;
  export const swapHorizontalOutline: string;
  export const albumsOutline: string;
  export const homeOutline: string;
  export const scaleOutline: string;
  export const bedOutline: string;
  export const personCircleOutline: string;
  export const nutritionOutline: string;
  export const notificationsOutline: string;
  export const alarmOutline: string;
  export default icons;
}
