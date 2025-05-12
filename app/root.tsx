import {
  Links,
  Meta,
  MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { LinksFunction } from "@remix-run/node";
import stylesheet from "./globals.css?url"
import { Amplify } from "aws-amplify"
Amplify.configure({
  Auth: {
      Cognito: {
          userPoolId: import.meta.env.VITE_USER_POOL_ID || "",
          userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || ""
      }
  }
});

export const meta: MetaFunction = () => {
  return [
    { title: "大阪市学童補助金支援ツール Ver.0.1" },
    { name: "description", content: "補助金の申請って大変だよね!" },
    { name: "viewport", content: "width=device-width, initial-scale=1, shrink-to-fit=no" }
  ];
};

export const links: LinksFunction = () => [
  {rel: "stylesheet", href: stylesheet},
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <Meta />
        <Links />
      </head>
      <body>
        <main className="container px-2">
          <Outlet />
        </main>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <>
      <Outlet />
    </>
  );
}

export function HydrateFallback() {
  return <p>Loading...</p>;
}
