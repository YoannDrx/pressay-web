export function GET(request: Request) { return Response.redirect(new URL("/account", request.url), 302); }
