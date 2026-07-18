import { HashRouter, Route, Routes } from 'react-router-dom';
import { ArchiveScreen } from './components/ArchiveScreen';
import { GameScreen } from './components/GameScreen';
import { HomeScreen } from './components/HomeScreen';
import { StatsScreen } from './components/StatsScreen';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/game/:gameId" element={<GameScreen />} />
        <Route path="/game/:gameId/:dateKey" element={<GameScreen />} />
        <Route path="/archive" element={<ArchiveScreen />} />
        <Route path="/stats" element={<StatsScreen />} />
        <Route path="*" element={<HomeScreen />} />
      </Routes>
    </HashRouter>
  );
}
