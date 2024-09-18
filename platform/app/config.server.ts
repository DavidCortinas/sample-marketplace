import { getEnv } from './env.server';

export const API_BASE_URL = getEnv().API_BASE_URL || 'http://localhost:8000';
