import {
  useNavigate,
  useLoaderData,
  Outlet,
  ClientLoaderFunctionArgs,
  Form,
  useMatches,
  useNavigation,
  redirect,
} from "@remix-run/react";
import { getData } from "~/api/fetchApi";
import { Header } from "~/components/header";
import { useRef, useState } from "react";
import { Loading, viewMonth, viewMonthList } from "~/components/util";
import { getLs } from "~/lib/ls";
import { checkInstructor } from "~/lib/common_check";

export const clientLoader = async ({
  params,
}: ClientLoaderFunctionArgs) => {
  const idToken = getLs('idToken') || ''
  const data = JSON.parse(getLs('user_data') || '{}')
  if(data.user_data.after_schools.length == 0){
    return data.user_data.admin ? redirect('/admin') : redirect(`/after_school_settings`)
  }
  data.idToken = idToken
  data.ym = (!params.ym || !params.school_id) ? viewMonth() : params.ym
  data.school_id = (!params.ym || !params.school_id) ? data.user_data.after_schools[0].school_id : params.school_id

  const res = await getData(`/monthly?ym=${data.ym}&school_id=${data.school_id}`, idToken)
  data.search_results = res.list
  data.config = res.config
  data.holidays = Object.keys(res.holidays)

  data.ym_list = viewMonthList()

  // 月初のデータを取得
  data.daily_data = await getData(`/monthly/daily?date=${data.ym}-01&school_id=${data.school_id}`, idToken)

  return data
};

export default function Index() {
  const data = useLoaderData<typeof clientLoader>()

  const navigate = useNavigate();
  const matches = useMatches()

  // State管理
  const [search_ym, setSearchDate] = useState(data.ym)
  const [search_school_id, setSearchSchoolId] = useState(data.school_id)
  const [search_results, setSearchResults] = useState(data.search_results)
  const [holidays, setHolidays] = useState(data.holidays)

  const [edit_school_id, setEditSchoolId] = useState(data.school_id)
  const [edit_date, setEditDate] = useState(`${data.ym}-01`)
  const [instructors, setInstructors] = useState(data.daily_data.instructors)
  const [sum_hours, setSumHours] = useState(data.daily_data.sum_hours)
  const [open_type, setOpenType] = useState(data.daily_data.open_type || '0')
  const [open_time, setOpenTime] = useState({ start: data.daily_data.open_time.start, end: data.daily_data.open_time.end })
  const [children_sum, setChildrenSum] = useState(data.daily_data.instructors)
  const [children_disability, setChildrenDisability] = useState(data.daily_data.instructors)
  const [children_medical_care, setChildrenMedicalCare] = useState(data.daily_data.instructors)

  const check_inst = checkInstructor(data.daily_data.instructors, data.daily_data.open_time.start, data.daily_data.open_time.end)
  const [instChk, setInstChk] = useState(check_inst.check)

  const [is_loading, setIsLoading] = useState("idle")

  const changeParams = async (ym:string, school_id:string) => {
    setIsLoading("loading")
    setSearchDate(ym)
    setSearchSchoolId(school_id)
    const res = await getData(`/monthly?ym=${ym}&school_id=${school_id}`, data.idToken)
    setSearchResults(res.list)
    setHolidays(Object.keys(res.holidays))
    setIsLoading("idle")
  }

  const setEditParams = async (school_id:string, date:string, child:boolean = false) => {
    setIsLoading("loading")
    await getData(`/monthly/daily?school_id=${school_id}&date=${date}`, data.idToken).then((res) => {
      setInstructors(res.instructors)
      setSumHours(res.summary.hours)
      setOpenType(res.open_type || '0')
      setChildrenSum(res.children.sum)
      setChildrenDisability(res.children.disability)
      setChildrenMedicalCare(res.children.medical_care)
      setInstChk(checkInstructor(res.instructors, res.open_time.start, res.open_time.end).check)
      setOpenTime({start: res.open_time.start, end: res.open_time.end})
    })
    setEditSchoolId(school_id)
    setEditDate(date)
    if (child){
      navigate(`/monthly/edit`)
    }
    setIsLoading("idle")
  }

  const anchorRef = useRef<HTMLAnchorElement>(null)
  const downloadMonthlyReport = async (output_type:string = 'monthly_report') => {
    setIsLoading("loading")
    const report_data = await getData(`/monthly/download?ym=${search_ym}&school_id=${search_school_id}&type=${output_type}`, data.idToken)
    const link = anchorRef.current
    if (link) {
      link.setAttribute('href', report_data.url)
      link.click()
    }
    setIsLoading("idle")
  }

  const downloadSummary = async (output_type:string = 'monthly_report') => {
    setIsLoading("loading")
    const report_data = await getData(`/monthly/download/summary?year=2024&school_id=${search_school_id}`, data.idToken)
    const link = anchorRef.current
    if (link) {
      link.setAttribute('href', report_data.url)
      link.click()
    }
    setIsLoading("idle")
  }

  const navigation = useNavigation()

  return (
    <div>
      {Loading((navigation.state == 'loading' || navigation.state == 'submitting') ? navigation : {state: is_loading})}
      {Header(data.user_data)}
      {
        (matches.length < 3 || (matches.length == 3 && !matches[2].pathname.includes('/edit/'))) &&
        <div className="flex justify-between bg-white border-t-2 sticky top-10 sm:top-20">
          <Form>
            <div className="flex">
              <div className="p-2">
                <select name="school_id" className="select" value={search_school_id} onChange={(e) => changeParams(search_ym ,e.target.value)}>
                  {data.user_data.after_schools.map((item:any) => (
                    <option key={item.school_id} value={item.school_id}>{item.school_id + ':' + item.school_name}</option>
                  ))}
                </select>
              </div>
              <div className="p-2">
                <select name="ym" className="select" value={search_ym} onChange={(e) => changeParams(e.target.value, search_school_id)}>
                  {data.ym_list.map((item:any) => (
                    <option key={item.value} value={item.value}>{item.value.split('-').join('年') + '月' + (item.confirm ? ' 確定済み' : '')}</option>
                  ))}
                </select>
              </div>
            </div>
          </Form>
          <div className="flex">
            <div className="ms-auto p-2 hidden sm:block">
              <button type="button" onClick={() => downloadMonthlyReport()}
                className="btn-download">
                  報告書ダウンロード
              </button>
            </div>
            <div className="ms-auto p-2 hidden sm:block">
              <button type="button" onClick={() => downloadMonthlyReport('work_schedule')}
                className="btn-download">
                  勤務表ダウンロード
              </button>
            </div>
            {/*
            <div className="ms-auto p-2 hidden sm:block">
              <button type="button" onClick={() => downloadSummary()}
                className="btn-download">
                  資料ダウンロード
              </button>
            </div>
            */}
            <a ref={anchorRef} className='hidden' download={'テストファイル'}></a>
          </div>
        </div>
      }
      <Outlet context={{
        id_token: data.idToken,
        search_school_id: search_school_id,
        search_ym: search_ym,
        edit_school_id: edit_school_id,
        edit_date: edit_date,
        search_results: search_results,
        config: data.config,
        holidays: holidays,
        instructors: instructors,
        sum_hours: sum_hours,
        open_type: open_type,
        open_time: open_time,
        children_sum: children_sum,
        children_disability: children_disability,
        children_medical_care: children_medical_care,
        instChk: instChk,
        setEditParams: setEditParams,
        changeParams: changeParams,
        setInstructors: setInstructors,
        setOpenType: setOpenType,
        setOpenTime: setOpenTime,
        setChildrenSum: setChildrenSum,
        setChildrenDisability: setChildrenDisability,
        setChildrenMedicalCare: setChildrenMedicalCare,
        setSumHours: setSumHours,
        setIsLoading: setIsLoading,
        setInstChk: setInstChk,
      }}/>
    </div>
  );
}
