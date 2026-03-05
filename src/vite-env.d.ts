/// <reference types="vite/client" />

// Firebase env vars injected via .env.local (see src/utils/firebase.ts)
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

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
  export const refreshOutline: string;
  export const trophyOutline: string;
  export const shareOutline: string;
  export const starOutline: string;
  export const flameOutline: string;
  export const ribbonOutline: string;
  export const checkmarkCircle: string;
  export const ellipseOutline: string;
  export const fingerprintOutline: string;
  export const fingerPrintOutline: string;
  export const backspaceOutline: string;
  export const checkmarkOutline: string;
  export const lockClosedOutline: string;
  export const trashOutline: string;
  export const warningOutline: string;
  export const brushOutline: string;
  export const barbellOutline: string;
  export const shieldCheckmark: string;
  export const shieldCheckmarkOutline: string;
  export const sparkles: string;
  export const sparklesOutline: string;
  export const banOutline: string;
  export const diamondOutline: string;
  export const keyOutline: string;
  export const videocamOutline: string;
  export const closeCircleOutline: string;
  export const mailOutline: string;
  export default icons;
}
