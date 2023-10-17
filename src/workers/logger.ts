export default class Logger {
  constructor(private readonly name: string) {}

  log(...message: any) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[${this.name}]`, ...message);
    }
  }
}
