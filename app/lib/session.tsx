import { createCookieSessionStorage } from "@remix-run/node";

const { getSession, commitSession, destroySession } = createCookieSessionStorage(
    {
      cookie: {
        name: "__session",
        // 自身のサイトのドメインとする
        domain: process.env.DOMAIN,
        httpOnly: true,
        maxAge: 3600,
        path: "/",
        sameSite: "lax",
        secrets: ["s3cret1"],
        // localhostの場合はhttpsではないので、プロダクションのみtrueとする
        secure: process.env.NODE_ENV === "production" ? true : false
      },
    }
  );

export { getSession, commitSession, destroySession };