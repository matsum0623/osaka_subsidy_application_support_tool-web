import {
  Form,
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "@remix-run/react"
import React, { useEffect } from "react";
import { useState } from "react";
import { getData, postData } from "~/api/fetchApi";
import { ExcessShortage } from "~/components/ExcessShortage";
import { RightHeader } from "~/components/header";
import { createDates, Loading, viewMonth, weekday } from "~/components/util";
import { checkInstructor } from "~/lib/common_check";
import { getLs } from "~/lib/ls";

export default function Index() {
  const context: {
    id_token: string,
  } = useOutletContext();

  const navigate = useNavigate()

  const user_id = getLs('user_id') ?? ''
  const user_data = JSON.parse(getLs('user_data') || '{}')

  const [searchParams, setSearchParams] = useSearchParams();
  const [search_date, setSearchDate] = useState(searchParams.get('date') || (viewMonth() + '-01'))
  const [search_school_id, setSearchSchoolId] = useState(searchParams.get('school_id') || user_data.user_data.after_schools[0].school_id)

  const [instructors, setInstructors] = useState<{[key: string]: { start: string, end: string, hours: string, additional_check?: boolean}}>({})
  const [sum_hours, setSumHours] = useState('')
  const [open_type, setOpenType] = useState('0')
  const [open_time, setOpenTime] = useState({ start: '', end: '' })
  const [children_sum, setChildrenSum] = useState(0)
  const [children_disability, setChildrenDisability] = useState(0)
  const [children_medical_care, setChildrenMedicalCare] = useState(0)
  const [instChk, setInstChk] = useState(false)
  const [open_types, setOpenTypes] = useState<{ [key: string]: any }>({})

  const [is_loading, setIsLoading] = useState(false)

  const [modal_open, setModalOpen] = useState(false)
  const [go_next, setGoNext] = useState(false)

  const [ct, setCt] = useState(0) // 再描画用のState

  const [now_dt, prev_dt, next_dt] = createDates(search_date)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsLoading(true)
    e.preventDefault();
    const post_data = {
      school_id: search_school_id,
      date: now_dt.toISOString().slice(0, 10),
      open_type: open_type,
      open_time: open_time,
      instructors: instructors,
      children: {
          sum: children_sum,
          disability: children_disability,
          medical_care: children_medical_care,
      },
      summary: {
          hours: sum_hours,
      },
    }
    await postData("/monthly/daily", post_data, context.id_token)
    if(go_next){
      changeParams(search_school_id, next_dt.toISOString().slice(0, 10))
    }
    setIsLoading(false)
  }

  const changeOpenType = (value:string) => {
    const open = value != '9' ? open_types[value].OpenTime : open_time.start
    const close = value != '9' ? open_types[value].CloseTime : open_time.end
    setOpenType(value)
    setOpenTime({
      start: open,
      end: close
    })
    setInstChk(checkInstructor(instructors, open, close).check)
  }

  const instructorCheck = () => {
    setInstChk(checkInstructor(instructors, open_time.start, open_time.end).check)
  }

  const setHour = (target:any) => {
    const [id, k] = target.name.split('.').slice(-2)
    const start_time = (k == 'start') ? target.value : instructors[id].start
    const end_time = (k == 'end') ? target.value : instructors[id].end
    if (!start_time || !end_time){
      instructors[id].start = start_time
      instructors[id].end = end_time
      instructors[id].hours = ''
    }else if (start_time >= end_time){
      // TODO: 不正な登録の場合は画面に表示する
      console.log("不正な時刻登録です", start_time, end_time)
      instructors[id].hours = ''
    }else{
      const [start_hour, start_min] = start_time.split(':').map((i:any) => (parseInt(i)))
      const [end_hour, end_min] = end_time.split(':').map((i:any) => (parseInt(i)))
      const hour_min = start_min > end_min ? end_min - start_min + 60 : end_min - start_min
      const hour_hour = start_min > end_min ? end_hour - start_hour - 1 : end_hour - start_hour
      instructors[id].hours = hour_hour + ':' + ( '00' + hour_min ).slice( -2 )
      instructors[id].start = start_time
      instructors[id].end = end_time
    }
    setInstructors(instructors)

    let sum_hour = 0
    let sum_min = 0
    Object.values(instructors).map((inst:any) => {
      if (inst.hours){
        const [hour, min] = inst.hours.split(':')
        sum_hour += parseInt(hour)
        sum_min += parseInt(min)
      }
    })
    Object.values(instructors).filter((inst) => inst.hours).reduce((result:any, inst:any) => {
      const [hour, min] = inst.hours.split(':').map((i:any) => (parseInt(i)))
      result.sum_hour += hour
      result.sum_min += min
      return result
    }, {
      sum_hour: 0,
      sum_min: 0
    })
    sum_hour += Math.floor(sum_min / 60)
    sum_min = sum_min % 60
    setSumHours(sum_hour + ':' + ( '00' + sum_min ).slice( -2 ))
    setCt(ct + 1)
  }

  const changeAdditional = (id:string, checked:boolean) => {
    instructors[id].additional_check = checked
    const open = open_time.start
    const close = open_time.end
    const check_response = checkInstructor(instructors, open, close)
    setInstChk(check_response.check)
    setInstructors(instructors)
    setCt(ct + 1)
  }

  const CancelClick = () => {
    navigate(`/monthly?ym=${search_date.slice(0, 7)}&school_id=${search_school_id}`)
  }

  useEffect(() => {
    search_data(search_school_id, search_date)
  }, [])

  const search_data = async (school_id:string, date:string): Promise<any> => {
    setIsLoading(true)
    const res = await getData(`/monthly/daily?school_id=${school_id}&date=${date}`, context.id_token)
    setInstructors(res.instructors)
    setSumHours(res.summary.hours)
    setOpenType(res.open_type || '0')
    setChildrenSum(res.children.sum)
    setChildrenDisability(res.children.disability)
    setChildrenMedicalCare(res.children.medical_care)
    setInstChk(checkInstructor(res.instructors, res.open_time.start, res.open_time.end).check)
    setOpenTime({start: res.open_time.start, end: res.open_time.end})
    setOpenTypes(res.config.open_types)
    setIsLoading(false)
  }

  const changeParams = async (school_id:string, date:string) => {
    setIsLoading(true)
    setSearchDate(date)
    setSearchSchoolId(school_id)
    navigate(`/monthly/edit?school_id=${school_id}&date=${date}`)
    await search_data(school_id, date)
    setIsLoading(false)
  }

  return (
    <div>
      {is_loading && Loading()}
      <div className="bg-white flex justify-between sticky top-0 sm:top-0">
        <div className="text-base sm:text-2xl flex gap-3 justify-center sm:justify-start h-14">
          <div className="flex py-2">
            <input type="date" value={search_date} onChange={(e) => changeParams(search_school_id, e.target.value)} className="input-default sm:text-xl p-1.5" />
            <span className="hidden sm:block py-1">({weekday[now_dt.getDay()]})</span>
          </div>
          <div className="py-3">
            <span className={(instChk ? 'text-green-500' : 'text-red-500 font-bold')}>{instChk ? "OK" : "NG"}</span>
          </div>
          <div className="py-2">
            <button type="button" className="btn-primary min-w-10 h-full" onClick={() => changeParams(search_school_id, prev_dt.toISOString().slice(0, 10))}>
              <span className="hidden sm:block px-3">前日</span>
              <span className="sm:hidden">前</span>
            </button>
          </div>
          <div className="py-2">
            <button type="button" className="btn-primary min-w-10 h-full" onClick={() => changeParams(search_school_id, next_dt.toISOString().slice(0, 10))}>
              <span className="hidden sm:block px-3">翌日</span>
              <span className="sm:hidden">翌</span>
            </button>
          </div>
        </div>
        {RightHeader(user_id, user_data)}
      </div>

      {/** 過不足確認ダイアログ */}
      <div id="excess-shortage-modal" tabIndex={-1}
        className={(modal_open ? "block" : "hidden") + " modal-back-ground"}
        onClick={(e) => {
          if((e.target as HTMLElement).id == 'excess-shortage-modal'){
            setModalOpen(false)
          }
        }}>
        <div className="modal-dialog max-w-7xl top-0 sm:top-2 p-1 SM-P-4">
          <div className="modal-content">
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                指導員過不足確認
              </h3>
              <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={() => setModalOpen(false)}>
                <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                  <path stroke="currentColor" strokeLinecap={"round"} strokeLinejoin={"round"} strokeWidth={2} d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>
            {ExcessShortage(open_time.start, open_time.end, instructors, search_date)}
          </div>
        </div>
      </div>

      <Form method="post" onSubmit={(e) => handleSubmit(e)}>
        <div className="sm:flex w-full text-center">
          <div className="flex w-full sm:w-2/5 justify-between">
            <div className="w-full border">
              <div className="hidden sm:block border-b font-bold p-1">開所パターン</div>
              <div>
                <select className="py-2 sm:px-2 text-sm" name="open_type" value={open_type} onChange={(e) => changeOpenType(e.target.value)}>
                  {
                    Object.keys(open_types).map((key:string) => (
                      <option value={key} key={key}>{open_types[key].TypeName}</option>
                    ))
                  }
                  <option value={9} key={9}>{"日曜加算"}</option>
                </select>
              </div>
            </div>
            <div className="flex sm:block w-full border justify-between">
              <div className="hidden sm:block w-1/4 sm:w-full border-b font-bold p-1">開所時間</div>
              <div className="w-full sm:px-2 flex justify-center gap-1 sm:gap-2">
                <input className="input-default" name={"times.open.start"} value={open_time.start} type="time" min={"06:00:00"} max={"22:00:00"} step={"900"}
                  onChange={(e) => setOpenTime({start: e.target.value, end: open_time.end})} onBlur={() => instructorCheck()} />
                <span className="py-2">～</span>
                <input className="input-default" name={"times.open.end"} value={open_time.end} type="time" min={"06:00:00"} max={"22:00:00"} step={"900"}
                  onChange={(e) => setOpenTime({start: open_time.start, end: e.target.value})} onBlur={() => instructorCheck()} />
              </div>
            </div>
          </div>
          <div className="flex w-full sm:w-3/5">
            <div className="flex sm:block w-full border">
              <div className="w-1/4 sm:w-full border-b font-bold p-1">
                <span className="hidden sm:block">児童数</span>
                <span className="block sm:hidden">児</span>
              </div>
              <div className="w-3/4 sm:w-full px-2"><input className="text-right input-default" name="children" type="number" value={children_sum} onChange={(e) => setChildrenSum(parseInt(e.target.value))}/></div>
            </div>
            <div className="flex sm:block w-full border">
              <div className="w-1/4 sm:w-full border-b font-bold p-1">
                <span className="hidden sm:block">加配</span>
                <span className="block sm:hidden">障</span>
              </div>
              <div className="w-3/4 sm:w-full px-2"><input className="text-right input-default" name="disability" type="number" value={children_disability} onChange={(e) => setChildrenDisability(parseInt(e.target.value))}/></div>
            </div>
            <div className="flex sm:block w-full border">
              <div className="w-1/4 sm:w-full border-b font-bold p-1">
                <span className="hidden sm:block">医ケア</span>
                <span className="block sm:hidden">医</span>
              </div>
              <div className="w-3/4 sm:w-full px-2"><input className="text-right input-default" name="medical_care" type="number" value={children_medical_care} onChange={(e) => setChildrenMedicalCare(parseInt(e.target.value))}/></div>
            </div>
          </div>
        </div>

        <table className="table table-bordered text-center mt-3 w-full">
          <thead>
            <tr>
              <td>氏名</td>
              <td className="hidden sm:table-cell">指</td>
              <td className="hidden sm:table-cell">加</td>
              <td className="hidden sm:table-cell">医</td>
              <td>開始</td>
              <td>終了</td>
              <td>時間</td>
              <td>加配</td>
            </tr>
          </thead>
          <tbody>
            {
              Object.values(instructors).filter((inst:any) => (!inst.retirement_date || search_date <= inst.retirement_date)).sort((a:any, b:any) => (a.order - b.order)).map((inst: any) => {
                return (
                <tr key={inst.id}>
                  <td className="py-0.5 sm:py-2 text-base table-cell sm:hidden">{inst.name.slice(0,2)}</td>
                  <td className="py-0.5 sm:py-2 text-base hidden sm:table-cell">{inst.name}</td>
                  <td className="py-0.5 sm:py-2 hidden sm:table-cell">{(inst.qualification) ? '〇' : ''}</td>
                  <td className="py-0.5 sm:py-2 hidden sm:table-cell">{(inst.additional) ? '〇' : ''}</td>
                  <td className="py-0.5 sm:py-2 hidden sm:table-cell">{(inst.medical_care) ? '〇' : ''}</td>
                  <td className="py-0.5 sm:py-2"><input name={"times." + inst.id + ".start"} value={inst.start} type="time" min={"06:00:00"} max={"22:00:00"} step={"900"} onChange={(e) => setHour(e.target)} onBlur={() => instructorCheck()}/></td>
                  <td className="py-0.5 sm:py-2"><input name={"times." + inst.id + ".end"} value={inst.end} type="time" min={"06:00:00"} max={"22:00:00"} step={"900"} onChange={(e) => setHour(e.target)} onBlur={() => instructorCheck()}/></td>
                  <td className="py-0.5 sm:py-2"><input name={"times." + inst.id + ".hour"} value={inst.hours} type="hidden" />{inst.hours}</td>
                  <td className="py-0.5 sm:py-2"><input name={"additional." + inst.id} checked={inst.additional_check} type="checkbox" disabled={!inst.additional || inst.hours == ''} onChange={(e) => changeAdditional(inst.id, e.target.checked)}/></td>
                </tr>
              )})
            }
            <tr key='sum'>
              <td className="py-0.5 sm:py-2">合計</td>
              <td className="py-0.5 sm:py-2 table-cell sm:hidden" colSpan={2}></td>
              <td className="py-0.5 sm:py-2 hidden sm:table-cell" colSpan={5}></td>
              <td className="py-0.5 sm:py-2"><input name={"hour_summary"} defaultValue={sum_hours} type="hidden" />{sum_hours}</td>
              <td className="py-0.5 sm:py-2 w-1/12">
                <button type="button" className="btn-check min-w-10" onClick={() => setModalOpen(true)}>
                  <span className="hidden sm:block">チェック</span>
                  <span className="sm:hidden">CHK</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p className="text-end mt-2">
          <button type="submit" name='next' value={next_dt.toISOString().slice(0, 10)} className="btn-primary ml-6 mr-3" onClick={() => setGoNext(true)}>登録して翌日</button>
          <button type="submit" className="btn-primary mr-3" onClick={() => setGoNext(false)}>登録</button>
          <button onClick={() => CancelClick()} type="button" className="btn btn-danger sm:mr-10">戻る</button>
        </p>
        <input type='hidden' name="school_id" value={search_school_id} />
        <input type='hidden' name="date" value={now_dt.toISOString().slice(0, 10)} />
      </Form>

    </div>
  )
}