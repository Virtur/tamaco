export const API_URL = 'http://localhost:3001/api';
export const APP_NAME = 'Tamaco';
export const APP_VERSION = '1.0.0';


// Для разработки
const development = {
  API_URL: 'http://localhost:3001/api',
  APP_NAME: 'Tamaco (Dev)',
  VERSION: '1.0.0'
};

// Для продакшена
const production = {
  API_URL: 'https://ваш-сервер.ру/api',
  APP_NAME: 'Tamaco',
  VERSION: '1.0.0'
};

const config = process.env.NODE_ENV === 'production' ? production : development;

export default config;