import {
  redirect,
} from "@remix-run/react";
import { signOut } from 'aws-amplify/auth'

export const clientLoader = async () => {
  // この画面にくる場合はサインアウトさせる
  await signOut({ global: true })
  return redirect('/login')
};

export default function Index() {
  return <div></div>
}
