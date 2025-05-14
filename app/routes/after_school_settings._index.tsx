import {
  useLoaderData,
  redirect,
  useNavigate,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { getData } from "~/api/fetchApi";
import { RightHeader } from "~/components/header";
import { Loading } from "~/components/util";
import { getLs } from "~/lib/ls";

export const clientLoader = async () => {
  const idToken = getLs('idToken') || ''
  const user_id = getLs('user_id') || ''
  const user_data = JSON.parse(getLs('user_data') || '{}')
  const data = JSON.parse(getLs('user_data') || '{}')
  data.idToken = idToken
  data.user_id = user_id
  data.user_data = user_data
  return data
};

export default function Index() {
  const data = useLoaderData<typeof clientLoader>()
  if (!data.idToken){
    redirect("/");
  }

  const navigate = useNavigate()

  const [is_loading, setIsLoading] = useState(false)
  const [after_schools_list, setAfterSchoolsList] = useState([])

  const search_data = async () => {
    setIsLoading(true)
    const after_school_data = await getData("/after_school", data.idToken)
    setAfterSchoolsList(after_school_data.list)
    setIsLoading(false)
  }

  useEffect(() => {
    search_data()
  }, [])

  return (
    <div>
      {is_loading && Loading()}
      <div className="flex justify-between">
        <div className="flex gap-24 py-2">
          <div className="p-1">
            <p className="text-2xl font-bold">学童一覧</p>
          </div>
        </div>
        {RightHeader(data.user_id, data.user_data, )}
      </div>
      <table className="table table-bordered text-center mt-3 w-full">
        <thead>
          <tr>
            <td>学童ID</td>
            <td>学童名</td>
            <td>児童数</td>
            <td>指導員数</td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          {after_schools_list.map((afs:any) => (
            <tr key={afs.school_id}>
              <td className="align-middle">{afs.school_id}</td>
              <td className="align-middle">{afs.school_name}</td>
              <td className="align-middle">{afs.child_count}</td>
              <td className="align-middle">{afs.instructor_count}</td>
              <td><button className="btn btn-primary" onClick={() => navigate(`./${afs.school_id}`)}>編集</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
