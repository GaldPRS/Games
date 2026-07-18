import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { addDays, todayKey } from './core/date';
import { pruneOldEntries } from './core/storage';
import './styles/global.css';

// keep the cache bounded: puzzles >30 days old, sessions >60 days old
pruneOldEntries('dg.puzzle.v1.', addDays(todayKey(), -30));
pruneOldEntries('dg.session.v1.', addDays(todayKey(), -60));

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
