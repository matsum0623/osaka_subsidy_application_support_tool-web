import {
  useLoaderData,
  redirect,
  useNavigate,
} from "@remix-run/react";
import { after } from "node:test";
import { getData } from "~/api/fetchApi";
import { getLs } from "~/lib/ls";

export const clientLoader = async () => {
  const idToken = getLs('idToken') || ''
  const user_id = getLs('user_id') || ''
  const data = JSON.parse(getLs('user_data') || '{}')
  data.idToken = idToken
  data.user_id = user_id
  data.after_schools = await getData("/after_school", idToken)
  data.users = await getData("/users", idToken)
  return data
};

export default function Index() {
  const data = useLoaderData<typeof clientLoader>()
  if (!data.idToken){
    redirect("/");
  }

  const navigate = useNavigate()

  const EditAfterSchool = (school_id:string) => {
    navigate(`./${school_id}`)
  }

  return (
    <div className="border-t-2 ">
      <div className="flex gap-24 mt-2">
        <div className="">
          <p className="text-2xl font-bold">学童一覧</p>
        </div>
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
          {data.after_schools.list.map((afs:any) => (
            <tr key={afs.school_id}>
              <td className="align-middle">{afs.school_id}</td>
              <td className="align-middle">{afs.school_name}</td>
              <td className="align-middle">{afs.child_count}</td>
              <td className="align-middle">{afs.instructor_count}</td>
              <td><button className="btn btn-primary" onClick={() => EditAfterSchool(afs.school_id)}>編集</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
