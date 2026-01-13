const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
};

export class Logger {
  static error(message: string): void {
    console.error(`${colors.red}${message}${colors.reset}`);
  }

  static progress(message: string): void {
    console.log(`${colors.yellow}${message}${colors.reset}`);
  }

  static success(message: string): void {
    console.log(`${colors.green}${message}${colors.reset}`);
  }
}
