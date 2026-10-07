// Re-export the native module. On web, it will be resolved to TijoriSmsModule.web.ts
// and on native platforms to TijoriSmsModule.ts
export { default } from './src/TijoriSmsModule';
export * from './src/TijoriSms.types';
