export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/", 
    "/attendance/:path*", 
    "/company/:path*", 
    "/users/:path*", 
    "/jurnal/:path*", 
    "/settings/:path*"
  ],
};