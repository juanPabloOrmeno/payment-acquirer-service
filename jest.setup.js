// Suprimir logs de error de NestJS durante tests
const originalConsoleError = console.error;

// Capturar excepciones no manejadas que ocurren después de los tests
process.on('unhandledRejection', (reason) => {
  if (reason?.toString().includes('Issuer service unavailable')) {
    // Ignorar silenciosamente este error conocido
    return;
  }
});

process.on('uncaughtException', (error) => {
  if (error?.toString().includes('Issuer service unavailable')) {
    // Ignorar silenciosamente este error conocido
    return;
  }
  throw error;
});

beforeAll(() => {
  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    // Suprimir solo los logs de ExceptionsHandler y HttpException
    if (
      message.includes('ExceptionsHandler') ||
      message.includes('HttpException') ||
      message.includes('Issuer service unavailable')
    ) {
      return;
    }
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});
