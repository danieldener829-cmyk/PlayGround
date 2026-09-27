import './style.css';
import { Game } from './systems/game.js';
import { mountUI } from './ui/ui.js';
import { Logger } from './core/utils.js';

// FASE 1 → fundação: câmera, jogador, movimentação, mundo voxel básico.
// As fases seguintes (2–11) vivem nos módulos world/player/systems/ui.

const canvas = document.getElementById('c');
const game = new Game(canvas, {
  worldName: localStorage.getItem('lumivale_last') || 'Vale Inicial',
  seed: 'vale-1',
  mode: 'survival',
  renderDist: 4,
  volume: 0.7,
  fov: 75,
  shadows: false,
  dayLen: 600,
  lang: 'pt-BR',
});
mountUI(game, canvas);
window.__game = game; // para depuração/testes

function loop() {
  try {
    game.frame();
  } catch (e) {
    Logger.error('Loop', e);
  }
  requestAnimationFrame(loop);
}
loop();
addEventListener('error', (e) => Logger.error('Global', e.message));
