import React from 'react';
import { createRoot } from 'react-dom/client';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';
import App from './App';
import { initDatabase } from './db/database';

async function bootstrap() {
  // Register the jeep-sqlite web component (required before initDatabase)
  await jeepSqlite(window);

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