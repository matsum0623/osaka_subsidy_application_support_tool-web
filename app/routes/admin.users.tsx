import {
  useNavigate,
  useLoaderData,
  redirect,
  useNavigation,
  Outlet,
} from "@remix-run/react";
import { getIdToken } from "~/api/auth";
import { Loading } from "~/components/util"

export const clientLoader = async () => {
  // データを取ってくる
  const idToken = await getIdToken();
  if (!idToken){
    return redirect(`/`)
  }else{
    return {
      idToken: idToken,
    };
  }
};

export default function Index() {
  const data = useLoaderData<typeof clientLoader>()
  if (!data.idToken){
    redirect("/");
  }
  return (
    <div>
      ユーザ情報
    </div>
  );
}
