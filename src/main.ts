import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { API_BASE_URL } from './app/core/config/api-base-url.token';
import { loadApiBaseUrl } from './app/core/config/load-api-base-url';

loadApiBaseUrl('http://localhost:8000')
  .then((apiBaseUrl) =>
    bootstrapApplication(App, {
      providers: [...appConfig.providers, { provide: API_BASE_URL, useValue: apiBaseUrl }],
    }),
  )
  .catch((err) => console.error(err));
