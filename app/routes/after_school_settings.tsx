import {
  useLoaderData,
  redirect,
  Outlet,
} from "@remix-run/react";
import { getLs } from "~/lib/ls";

export const clientLoader = async () => {
  const idToken = getLs('idToken') || ''
  const data = JSON.parse(getLs('user_data') || '{}')
  data.idToken = idToken
  return data
};

export default function Index() {
  const data = useLoaderData<typeof clientLoader>()
  if (!data.idToken){
    redirect("/");
  }

  const child_data = {
    after_schools: data.user_data.after_schools
  }

  return (
    <div>
      <Outlet context={child_data}/>
    </div>
  );
}
