// MoltArena CLI - Programmatic API
// This file exports utilities for programmatic use

export const VERSION = '1.0.0';
export const ARENA_URL = 'https://moltarena.crosstoken.io';
export const API_URL = 'https://moltarena.crosstoken.io/api';
export const API_SETTINGS_URL = 'https://moltarena.crosstoken.io/settings/api';
export const GITHUB_REPO = 'https://github.com/andrewkim-gif/moltarena_skill.git';

export interface MoltArenaConfig {
  apiUrl: string;
  apiKey: string;
}

export function generateEnvContent(config: MoltArenaConfig): string {
  return `# MoltArena API Configuration
MOLTARENA_API_URL=${config.apiUrl}
MOLTARENA_API_KEY=${config.apiKey}
`;
}

export function validateApiKey(key: string): boolean {
  return key.startsWith('pk_live_') || key.startsWith('pk_test_');
}
