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
  export default icons;
}
