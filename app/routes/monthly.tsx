import {
  useLoaderData,
  Outlet,
  redirect,
} from "@remix-run/react";
import { getLs } from "~/lib/ls";

export const clientLoader = async () => {
  const idToken = getLs('idToken') || ''
  const data = JSON.parse(getLs('user_data') || '{}')
  if(data.user_data.after_schools.length == 0){
    return data.user_data.admin ? redirect('/admin') : redirect(`/after_school_settings`)
  }

  return {
    idToken: idToken,
  }
};

export default function Index() {
  const data = useLoaderData<typeof clientLoader>()
  return (
    <Outlet context={{
      id_token: data.idToken,
    }}/>
  );
}
