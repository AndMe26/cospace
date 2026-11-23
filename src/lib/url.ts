export function getBaseUrl(request: Request): string {
  return process.env.APP_URL ?? request.url;
}
