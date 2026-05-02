import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export const proxy = async (req: NextRequest) => {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const url = new URL(req.url);
  const { pathname } = url;

  if (!token) {
    return NextResponse.redirect(new URL("/login", url));
  }

  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", url));
  }

  if (pathname.startsWith("/student") && token.role !== "STUDENT") {
    return NextResponse.redirect(new URL("/dashboard", url));
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/admin/:path*", "/student/:path*", "/dashboard"],
};
