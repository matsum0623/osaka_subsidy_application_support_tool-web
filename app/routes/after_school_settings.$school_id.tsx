import {
  useLoaderData,
  redirect,
  ClientLoaderFunctionArgs,
  useNavigate,
  Form,
  ClientActionFunctionArgs,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { getIdToken } from "~/api/auth";
import { getData, postData, putData } from "~/api/fetchApi";
import { Loading } from "~/components/util";

export const clientLoader = async ({
  params,
}: ClientLoaderFunctionArgs) => {
  // データを取ってくる
  const idToken = await getIdToken();
  if (!idToken){
    return redirect(`/`)
  }else{
    try {
      return {
        idToken: idToken,
        school_id: params.school_id,
      }
    } catch (error) {
      return redirect(`/`)
    }
  }
};

export const clientAction = async({
  request,
  params,
}: ClientActionFunctionArgs) => {
  const idToken = await getIdToken();
  if (!idToken){
    return redirect(`/`)
  }
  if(params.school_id == 'new'){
    const res = await postData(`/after_school`, Object.fromEntries(await request.formData()), idToken)
  }else{
    const res = await putData(`/after_school/${params.school_id}`, Object.fromEntries(await request.formData()), idToken)
  }
  return redirect(`/admin/after_school/${params.school_id}`)
}

export default function Index() {
  const data = useLoaderData<typeof clientLoader>()
  if (!data.idToken){
    redirect("/");
  }

  const [school_name, setSchoolName] = useState('')
  const [school_number, setSchoolNumber] = useState('')
  const [instructor_num, setInstructorNum] = useState(0)

  const [c6, setC6] = useState(0)
  const [c5, setC5] = useState(0)
  const [c4, setC4] = useState(0)
  const [c3, setC3] = useState(0)
  const [c2, setC2] = useState(0)
  const [c1, setC1] = useState(0)
  const [c_sum, setCSum] = useState(0)

  const [c6_avg, setC6Avg] = useState(0)
  const [c5_avg, setC5Avg] = useState(0)
  const [c4_avg, setC4Avg] = useState(0)
  const [c3_avg, setC3Avg] = useState(0)
  const [c2_avg, setC2Avg] = useState(0)
  const [c1_avg, setC1Avg] = useState(0)
  const [c_avg_sum, setCAvgSum] = useState(0)

  const [open_types, setOpenTypes] = useState<{ [key: string]: { type_name: string; open_time: string; close_time: string } }>({})

  const setAvg = (d:number, target:any) => {
    const week_num:number = 6
    const num:number = target.value == '' ? 0 : parseInt(target.value)
    const avg = Math.ceil(d * num / week_num)
    const sum_list = [c6, c5, c4, c3, c2, c1]
    const avg_list = [c6_avg, c5_avg, c4_avg, c3_avg, c2_avg, c1_avg]
    switch (d) {
      case 6:
        setC6(num)
        setC6Avg(avg)
        break;
      case 5:
        setC5(num)
        setC5Avg(avg)
        break;
      case 4:
        setC4(num)
        setC4Avg(avg)
        break;
      case 3:
        setC3(num)
        setC3Avg(avg)
        break;
      case 2:
        setC2(num)
        setC2Avg(avg)
        break;
      case 1:
        setC1(num)
        setC1Avg(avg)
        break;
      default:
        break;
    }
    sum_list[week_num-d] = num
    avg_list[week_num-d] = avg
    setCSum(sum_list.reduce((sum, item) => sum + item, 0))
    setCAvgSum(avg_list.reduce((sum, item) => sum + item, 0))
  }

  const search_data = async () => {
    setIsLoading(true)
    const afterschool_data = await getData(`/after_school/${data.school_id}`, data.idToken)
    setSchoolName(afterschool_data.school_name)
    setSchoolNumber(afterschool_data.school_number)
    setC6(parseInt(afterschool_data.children.c6))
    setC5(parseInt(afterschool_data.children.c5))
    setC4(parseInt(afterschool_data.children.c4))
    setC3(parseInt(afterschool_data.children.c3))
    setC2(parseInt(afterschool_data.children.c2))
    setC1(parseInt(afterschool_data.children.c1))
    setC6Avg(Math.ceil(6 * parseInt(afterschool_data.children.c6) / 6))
    setC5Avg(Math.ceil(5 * parseInt(afterschool_data.children.c5) / 6))
    setC4Avg(Math.ceil(4 * parseInt(afterschool_data.children.c4) / 6))
    setC3Avg(Math.ceil(3 * parseInt(afterschool_data.children.c3) / 6))
    setC2Avg(Math.ceil(2 * parseInt(afterschool_data.children.c2) / 6))
    setC1Avg(Math.ceil(1 * parseInt(afterschool_data.children.c1) / 6))
    setCSum(Object.values(afterschool_data.children).map((item:any) => parseInt(item)).reduce((sum, item) => sum + item, 0))
    setCAvgSum(Object.keys(afterschool_data.children).sort().map((item:any, index) => Math.ceil((index + 1) * parseInt(afterschool_data.children[item]) / 6)).reduce((sum, item) => sum + item, 0))
    setInstructorNum(afterschool_data.instructor_num)
    setOpenTypes(afterschool_data.open_types)
    setIsLoading(false)
  }

  useEffect(() => {
    search_data()
  }, [data.school_id])

  const [is_loading, setIsLoading] = useState(false)

  const navigate = useNavigate()

  return (
    <div>
      {is_loading && Loading()}
      <Form method="post">
        <div className="flex my-2">
          <div>
            <p className="text-2xl font-bold">学童情報修正</p>
          </div>
        </div>
        <div className="mt-2 px-5">
          <div>
            <label htmlFor="AfterSchoolId" className="text-xl">学童ID</label>
            <input type="text" className="input-default" name="after_school_id" id="AfterSchoolId" defaultValue={data.school_id} readOnly={data.school_id != ''} placeholder="学童を一意に区別するID"/>
          </div>
          <div className="mt-2">
            <label htmlFor="AfterSchoolName" className="text-xl">学童名称</label>
            <input type="text" className="input-default" name="after_school_name" id="AfterSchoolName" defaultValue={school_name} placeholder="学童の正式名称"/>
          </div>
          <div className="mt-2">
            <label htmlFor="AfterSchoolNumber" className="text-xl">大阪市学童ID</label>
            <input type="text" className="input-default" name="after_school_number" id="AfterSchoolNumber" defaultValue={school_number} placeholder="大阪市から配布された学童番号"/>
          </div>
          <div className="mt-2">
            <label htmlFor="ChildrenCount" className="text-xl">児童数</label>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="w-28">日数</th>
                  <th>6/6</th>
                  <th>5/6</th>
                  <th>4/6</th>
                  <th>3/6</th>
                  <th>2/6</th>
                  <th>1/6</th>
                  <th className="w-20">合計</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="">登録<br/>児童数</td>
                  <td className="">
                    <input type="number" className="input-default text-center" name="children_6" value={c6} onChange={(e) => setAvg(6, e.target)}/>
                  </td>
                  <td className="">
                    <input type="number" className="input-default text-center" name="children_5" value={c5} onChange={(e) => setAvg(5, e.target)}/>
                  </td>
                  <td className="">
                    <input type="number" className="input-default text-center" name="children_4" value={c4} onChange={(e) => setAvg(4, e.target)}/>
                  </td>
                  <td className="">
                    <input type="number" className="input-default text-center" name="children_3" value={c3} onChange={(e) => setAvg(3, e.target)}/>
                  </td>
                  <td className="">
                    <input type="number" className="input-default text-center" name="children_2" value={c2} onChange={(e) => setAvg(2, e.target)}/>
                  </td>
                  <td className="">
                    <input type="number" className="input-default text-center" name="children_1" value={c1} onChange={(e) => setAvg(1, e.target)}/>
                  </td>
                  <td className="">
                    {c_sum}
                  </td>
                </tr>
                <tr>
                  <td>平均登録<br/>児童数</td>
                  <td>{c6_avg}</td>
                  <td>{c5_avg}</td>
                  <td>{c4_avg}</td>
                  <td>{c3_avg}</td>
                  <td>{c2_avg}</td>
                  <td>{c1_avg}</td>
                  <td>{c_avg_sum}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <label htmlFor="InstructorCount" className="text-xl">指導員数</label>
            <button type="button" className="btn btn-primary ml-3" onClick={() => navigate(`../instructors/${data.school_id}`)}>指導員編集</button>
            <input type="text" className="input-default mt-1" id="InstructorCount" value={instructor_num} disabled/>
          </div>
          <div className="mt-4">
            <label htmlFor="ChildrenCount" className="text-xl">開所タイプ</label>
            <button type="button" className="btn btn-primary ml-6" onClick={() => navigate(`../holidays/${data.school_id}`)}>休日設定</button>
            <table className="mt-1">
              <thead>
                <tr>
                  <th>開所タイプ名称</th>
                  <th>開所時刻</th>
                  <th>閉所時刻</th>
                </tr>
              </thead>
              <tbody>
                {
                  Object.keys(open_types).map((key) => (
                    <tr key={key}>
                      <td className="w-80">{open_types[key].type_name}</td>
                      <td className="w-40">
                        <input type="time" defaultValue={open_types[key].open_time} name={"open_time_" + key + "_open"} className="input-default text-center"/>
                      </td>
                      <td className="w-40">
                        <input type="time" defaultValue={open_types[key].close_time} name={"open_time_" + key + "_close"} className="input-default text-center"/>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
          <div className="col">
            <div className="flex justify-start">
              <div className="flex">
                <button type="submit" className="btn btn-primary ml-2 mr-2 mt-3">保存</button>
                <button type="button" className="btn btn-danger mt-3" onClick={() => navigate('/after_school_settings')}>キャンセル</button>
              </div>
              <div className="flex ml-96">
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
