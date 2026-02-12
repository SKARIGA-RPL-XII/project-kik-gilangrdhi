import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/",
    "/attendance/:path*",
    "/company/:path*",
    "/users/:path*",
    "/jurnal/:path*",
    "/settings/:path*",
  ],
};
