import {
  useLoaderData,
  redirect,
  ClientLoaderFunctionArgs,
  useNavigate,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { getIdToken } from "~/api/auth";
import { getData, putData } from "~/api/fetchApi";
import { weekday, Loading  } from "~/components/util";

export const clientLoader = async ({
  params,
}: ClientLoaderFunctionArgs) => {
  // データを取ってくる
  const idToken = await getIdToken();
  if (!idToken){
    return redirect(`/`)
  }else{
    return {
      idToken: idToken,
      school_id: params.school_id,
      years: [
        (new Date().getFullYear() + 1).toString(),
        new Date().getFullYear().toString(),
        (new Date().getFullYear() - 1).toString()
      ]
    }
  }
};

export default function Index() {
  const data = useLoaderData<typeof clientLoader>()
  if (!data.idToken){
    redirect("/");
  }

  const navigate = useNavigate()

  const [selected_year, setSelectedYear] = useState((new Date().getFullYear()).toString())
  const [holidays, setHolyDays] = useState<{ [key: string]: {Name: string, Add:boolean} }>({})
  const [japan_holidays, setJapanHolidays] = useState<{ [key: string]: string }>({})
  const [change_flag, setChangeFlag] = useState(false)
  const [addDay, setAddDay] = useState("")
  const [addName, setAddName] = useState("")
  const [is_loading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    const post_holidays: { [key: string]: string } = {}
    Object.keys(holidays).map((item:string) => {
      post_holidays[item] = holidays[item].Name
    })
    await putData(`/after_school/${data.school_id}/holidays`, {year: selected_year, holidays: post_holidays}, data.idToken)
    setChangeFlag(false)
    const holiday_dict: { [key: string]: { Name: string, Add: boolean } } = {}
    Object.keys(holidays).map((item:string) => {
      holiday_dict[item] = {Name: holidays[item].Name, Add: false}
    })
    setHolyDays(holiday_dict);
    setIsLoading(false)
  }

  const setAllJapanHolydays =  () => {
    setIsLoading(true)
    Object.keys(japan_holidays).filter((item:string) => item.includes(selected_year)).map((item:string) => (
      holidays[item] = {Name: japan_holidays[item], Add: true}
    ))
    setChangeFlag(true)
    setIsLoading(false)
  }
  const addHoliday = () => {
    setIsLoading(true)
    const newHolidays = { ...holidays };
    newHolidays[addDay] = {Name: addName, Add: true};
    console.log(newHolidays)
    setHolyDays(newHolidays);
    setChangeFlag(true)
    setIsLoading(false)
  }
  const deleteHoliday = (item:string) => {
    setIsLoading(true)
    const newHolidays = { ...holidays };
    delete newHolidays[item];
    setHolyDays(newHolidays);
    setChangeFlag(true)
    setIsLoading(false)
  }
  const changeYear = async (year:string) => {
    setIsLoading(true)
    if(change_flag){
      const change_confirm = confirm('変更が保存されていません。年度を変更しますか？')
      if(!change_confirm){
        return
      }
    }
    setSelectedYear(year)
    const holidays: { [key: string]: string } = await getData(`/after_school/${data.school_id}/holidays/?year=${year}`, data.idToken)
    const holiday_dict: { [key: string]: { Name: string, Add: boolean } } = {}
    Object.keys(holidays).map((item:string) => {
      holiday_dict[item] = {Name: holidays[item], Add: false}
    })
    setHolyDays(holiday_dict)
    setChangeFlag(false)
    setIsLoading(false)
  }

  const search_data = async () => {
    setIsLoading(true)

    // 日本の祝日を取得
    const japan_holidays: { [key: string]: string } = await fetch('https://holidays-jp.github.io/api/v1/date.json', {
      method: "GET",
    }).then(response => {
      if(response.status == 200){
          return response.json()
      }else {
          return {}
      }
    }).catch(
        error => {throw error}
    )
    setJapanHolidays(japan_holidays)

    const holidays: { [key: string]: string } = await getData(`/after_school/${data.school_id}/holidays/?year=${data.years[1]}`, data.idToken)
    const holiday_dict: { [key: string]: { Name: string, Add: boolean } } = {}
    Object.keys(holidays).map((item:string) => {
      holiday_dict[item] = {Name: holidays[item], Add: false}
    })
    setHolyDays(holiday_dict)
    setIsLoading(false)
  }

  useEffect(() => {
    search_data()
  }, [data.school_id])

  return (
    <div>
      {is_loading && Loading()}
      <div className="flex justify-between my-2">
        <div className="flex">
          <p className="text-2xl font-bold">休日設定</p>
          <select id="HolidaysSelect" className="select w-28 text-xl py-0 ml-4" value={selected_year} onChange={(e) => changeYear(e.target.value)}>
            {data.years.map((item:string) => (
              <option key={item} value={item}>{item}年</option>
            ))}
          </select>
        </div>
        <div className="col text-right mr-5">
          <button type="button" value={"保存"} className="btn-primary" onClick={handleSubmit}>保存</button>
          <button type="button" value={"戻る"} className="btn-danger ml-4" onClick={() => navigate('/admin/after_school/' + data.school_id)}>戻る</button>
        </div>
      </div>
      <div className="flex justify-between">
        <div className="w-full">
          <div className="flex justify-start">
            <p className="text-xl my-2">設定休日</p>
          </div>
          <table id="Holidays" className="w-full text-center mt-3">
            <thead>
              <tr>
                <td>日付</td>
                <td>祝日名</td>
                <td></td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1">
                  <input type="date" min={selected_year + '-01-01'} max={selected_year + '-12-31'} className="input-default py-2" value={addDay} onChange={(e) => setAddDay(e.target.value)}/>
                </td>
                <td className="py-1">
                  <input type="text" className="input-default py-2" value={addName} onChange={(e) => setAddName(e.target.value)}/>
                </td>
                <td className="p-0"><button type="button" className="btn-add p-2 py-1" onClick={addHoliday}>追加</button></td>
              </tr>
              {Object.keys(holidays).sort().map((item:string) => (
                <tr key={item} className={(new Date(item)).getDay()==6 ? "bg-cyan-100" : ((new Date(item)).getDay()==0 ? "bg-red-100" : "")}>
                  <td className={holidays[item].Add ? "text-red-600" : ""}>{item}({weekday[(new Date(item)).getDay()]})</td>
                  <td className={holidays[item].Add ? "text-red-600" : ""}>{holidays[item].Name}</td>
                  <td className="p-0"><button type="button" className="btn-danger p-2 py-1" onClick={() => deleteHoliday(item)}>削除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="w-32">
        </div>
        <div className="w-full">
          <div className="flex justify-start">
            <p className="text-xl my-2">日本の祝日</p>
            <button type="button" className="btn-primary ml-2" onClick={setAllJapanHolydays}>すべて設定</button>
          </div>
          <table id="JapanHolidays" className="w-full text-center mt-3">
            <thead>
              <tr>
                <td>日付</td>
                <td>祝日名</td>
              </tr>
            </thead>
            <tbody>
              {Object.keys(japan_holidays).sort().filter((item:string) => item.includes(selected_year)).map((item:string) => (
                <tr key={item} className={(new Date(item)).getDay()==6 ? "bg-cyan-100" : ((new Date(item)).getDay()==0 ? "bg-red-100" : "")}>
                  <td>{item}({weekday[(new Date(item)).getDay()]})</td>
                  <td>{japan_holidays[item]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
