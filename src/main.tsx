import React from 'react';
import { createRoot } from 'react-dom/client';
import 'jeep-sqlite';
import App from './App';
import { initDatabase } from './db/database';

async function bootstrap() {
  try {
    await initDatabase();
  } catch (err) {
    console.error('Database initialisation failed:', err);
  }

  const container = document.getElementById('root');
  const root = createRoot(container!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();