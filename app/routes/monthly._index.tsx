import { Form, useNavigate, useOutletContext, useSearchParams } from "@remix-run/react";
import { confirmResetPassword, resetPassword } from "aws-amplify/auth";
import { useEffect, useRef, useState } from "react";
import { getData, putData } from "~/api/fetchApi";
import { RightHeader } from "~/components/header";
import { downloadYearList, Loading, viewMonth, viewMonthList, weekday } from "~/components/util"
import { check_int_plus, check_float_plus } from "~/lib/common_check";
import { getLs } from "~/lib/ls";

export default function Index() {
  const context: {
    id_token: string,
  } = useOutletContext();

  const user_id = getLs('user_id') ?? ''
  const user_data = JSON.parse(getLs('user_data') || '{}')

  const [searchParams, setSearchParams] = useSearchParams();
  const [search_ym, setSearchYM] = useState(searchParams.get('ym') || viewMonth())
  const [search_school_id, setSearchSchoolId] = useState(searchParams.get('school_id') || user_data.user_data.after_schools[0].school_id)

  const ym_list = viewMonthList()

  const [view_data, setViewData] = useState({list: []})
  const [open_types, setOpenTypes] = useState<{ [key: string]: any }>({})
  const [child_summary, setChildSummary] = useState({
    'children': 0,
    'disability': 0,
    'medical_care': 0,
    'open_qualification': 0,
    'open_non_qualification': 0,
    'close_qualification': 0,
    'close_non_qualification': 0,
    'additional_time': 0,
  })
  const [holidays, setHolidays] = useState<string[]>([])

  const [children_input_modal_open, setChildrenInputModalOpen] = useState(false)

  const [open_download, setOpenDownload] = useState(false)
  const [download_type, setDownloadType] = useState('1')
  const download_y_list = downloadYearList()
  const [download_y, setDownloadY] = useState<number>(download_y_list[0])
  const [download_ym, setDownloadYM] = useState(search_ym)

  const [is_loading, setIsLoading] = useState(false)

  const navigate = useNavigate();

  const handleSubmit = async (e:any) => {
    setIsLoading(true)
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    // formデータを日付をキーに持つオブジェクトに変換
    const children_obj: { [key: string]: { [key: string]: number } } = {}
    form.forEach((value:FormDataEntryValue, key:string) => {
      const [d, t] = key.split('|')
      if (d in children_obj){
        children_obj[d][t] = Number(value)
      }else{
        children_obj[d] = {}
        children_obj[d][t] = Number(value)
      }
    })
    // 登録済みのデータと比較して変更箇所のみのデータを抜き出す
    const new_children_obj = Object.entries(children_obj).reduce((result:any, [d, v]) => {
      const old_data = view_data.list.find((i: any) => i[0] == d) as { [key: string]: any } | undefined;
      if (old_data){
        if (old_data[3] != Number(v['open_type']) || old_data[4] != v['children'] || old_data[5] != v['disability'] || old_data[6] != v['medical_care']){
          result[d] = v
        }
      }
      return result
    }, {})
    // 修正が1件でもあれば登録
    if (Object.keys(new_children_obj).length > 0){
      await putData(`/monthly/children`, {
        school_id: search_school_id,
        data: new_children_obj,
      }, context.id_token)
      alert('登録しました。')
    }else{
      alert('変更はありませんでした。')
    }
    setIsLoading(false)
    setChildrenInputModalOpen(false)
    changeParams(search_ym, search_school_id)
  }

  const check_row = (i:any) => {
    if (
      i[4] != '' && i[4] > 0
        || i[7] != '' && i[7] > 0
        || i[8] != '' && i[8] > 0
        || i[9] != '' && i[9] > 0
        || i[10] != '' && i[10] > 0
    ){
      return true
    }else{
      return false
    }
  }

  const bg_color_weekday = (date:string, weekday:number) => {
    if (weekday == 6){
      return "bg-cyan-100 hover:bg-cyan-200 "
    }else if (weekday == 0 || holidays.includes(date)){
      return "bg-red-100 hover:bg-red-200 "
    }else{
      return "hover:bg-slate-200 "
    }
  }

  const search_data = async (ym:string, school_id:string): Promise<any> => {
    setIsLoading(true)
    const res = await getData(`/monthly?ym=${ym}&school_id=${school_id}`, context.id_token)
    setViewData({list: res.list})
    setOpenTypes(res.config.open_types)
    setChildSummary(res.list.reduce((result:any, i:any) => {
      result.children                += check_int_plus(i[4])
      result.disability              += check_int_plus(i[5])
      result.medical_care            += check_int_plus(i[6])
      result.open_qualification      += check_int_plus(i[7])
      result.open_non_qualification  += check_int_plus(i[8])
      result.close_qualification     += check_int_plus(i[9])
      result.close_non_qualification += check_int_plus(i[10])
      result.additional_time         += check_float_plus(i[13])
      return result;
    }, {
      'children': 0,
      'disability': 0,
      'medical_care': 0,
      'open_qualification': 0,
      'open_non_qualification': 0,
      'close_qualification': 0,
      'close_non_qualification': 0,
      'additional_time': 0,
    }))

    setHolidays(Object.keys(res.holidays))
    setIsLoading(false)
  }

  useEffect(() => {
    search_data(search_ym, search_school_id)
  }, [])

  const anchorRef = useRef<HTMLAnchorElement>(null)
  const downloadMonthlyReport = async (output_type:string = 'monthly_report') => {
    setIsLoading(true)
    const report_data = await getData(`/monthly/download?ym=${download_ym}&school_id=${search_school_id}&type=${output_type}`, context.id_token)
    const link = anchorRef.current
    if (link) {
      link.setAttribute('href', report_data.url)
      link.click()
    }
    setIsLoading(false)
  }

  const downloadSummary = async () => {
    setIsLoading(true)
    const report_data = await getData(`/monthly/download/summary?year=${download_y}&school_id=${search_school_id}`, context.id_token)
    const link = anchorRef.current
    if (link) {
      link.setAttribute('href', report_data.url)
      link.click()
    }
    setIsLoading(false)
  }

  const downloadSubmit = async (e:any) => {
    switch (download_type) {
      case '1':
        await downloadMonthlyReport()
        break
      case '2':
        await downloadMonthlyReport('work_schedule')
        break
      case '3':
        await downloadSummary()
        break
      default:
        break
    }
  }

  const changeParams = async (ym:string, school_id:string) => {
    setIsLoading(true)
    setSearchYM(ym)
    setDownloadYM(ym)
    setSearchSchoolId(school_id)
    navigate(`/monthly?ym=${ym}&school_id=${school_id}`)
    await search_data(ym, school_id)
    setIsLoading(false)
  }

  const editPage = (school_id:string, date:string) => {
    setIsLoading(true)
    navigate(`/monthly/edit?school_id=${school_id}&date=${date}`)
    setIsLoading(false)
  }

  return (
    <>
      {is_loading && Loading()}
      <div className="flex justify-between bg-white sticky top-0 z-10">
        <div className="flex">
          <div className="py-2 sm:p-2">
            <select name="school_id" className="select sm:text-xl p-1.5" value={search_school_id} onChange={(e) => changeParams(search_ym ,e.target.value)}>
              {user_data.user_data.after_schools.map((item:any) => (
                <option key={item.school_id} value={item.school_id}>{item.school_id + ':' + item.school_name}</option>
              ))}
            </select>
          </div>
          <div className="py-2 sm:p-2">
            <select name="ym" className="select sm:text-xl p-1.5" value={search_ym} onChange={(e) => changeParams(e.target.value, search_school_id)}>
              {ym_list.map((item:any) => (
                <option key={item.value} value={item.value}>{item.value.split('-').join('年') + '月' + (item.confirm ? ' 確定済み' : '')}</option>
              ))}
            </select>
          </div>
          <div className="ms-auto p-2 hidden sm:block sm:ml-4">
            <button type="button" onClick={() => setOpenDownload(true)}
              className="btn-download">
                資料ダウンロード
            </button>
            <a ref={anchorRef} className='hidden' download={'テストファイル'}></a>
          </div>
        </div>
        {RightHeader(user_id, user_data)}
      </div>
      <div>
        <table className="w-full border-separate border-spacing-0 border-b">
          <thead className="hidden sm:table-header-group sticky top-monthly-header-sm bg-white z-0">
            <tr className="row-top">
              <th rowSpan={2} className="col-no-right-border">日付</th>
              <th rowSpan={2} className="col-no-right-border">曜日</th>
              <th rowSpan={2} className="col-no-right-border">開所<br/>種別</th>
              <th colSpan={3} className="col-no-right-border">
                児童数
                <button type="button" className="btn-primary px-3 py-2 ml-4" onClick={() => setChildrenInputModalOpen(true)}>
                  一括入力
                </button>
              </th>
              <th colSpan={2} className="col-no-right-border">開所時職員数</th>
              <th colSpan={2} className="col-no-right-border">閉所時職員数</th>
              <th rowSpan={2} className="col-no-right-border">加配<br/>時間</th>
              <th rowSpan={2} className="col-no-right-border">開所<br/>閉所</th>
              <th rowSpan={2}>配置</th>
            </tr>
            <tr className="row-middle">
              <th className="col-no-right-border">合　計</th>
              <th className="col-no-right-border">加　配</th>
              <th className="col-no-right-border">医ケア</th>
              <th className="col-no-right-border">支援員</th>
              <th className="col-no-right-border">支以外</th>
              <th className="col-no-right-border">支援員</th>
              <th className="col-no-right-border">支以外</th>
            </tr>
            <tr key={'summary'} className="">
              <td colSpan={3} className="col-no-right-border">合計</td>
              <td className="col-no-right-border">{child_summary['children']}</td>
              <td className="col-no-right-border">{child_summary['disability']}</td>
              <td className="col-no-right-border">{child_summary['medical_care']}</td>
              <td className="col-no-right-border">{child_summary['open_qualification']}</td>
              <td className="col-no-right-border">{child_summary['open_non_qualification']}</td>
              <td className="col-no-right-border">{child_summary['close_qualification']}</td>
              <td className="col-no-right-border">{child_summary['close_non_qualification']}</td>
              <td className="col-no-right-border">{child_summary['additional_time']}</td>
              <td colSpan={2}></td>
            </tr>
          </thead>
          <thead className="table-header-group sm:hidden sticky top-monthly-header bg-white">
            <tr>
              <th className="col-no-right-border">日付</th>
              <th className="col-no-right-border">開所<br/>閉所</th>
              <th>配置</th>
            </tr>
          </thead>

          <tbody>
            {Object.values(view_data.list)?.map((i:any) => (
              <tr key={i[0]} className={"row-middle " + bg_color_weekday(i[0], i[2])} onClick={() => editPage(search_school_id, i[0])}>
                <td className="hidden sm:table-cell col-no-right-border">{i[1]}</td>
                <td className="hidden sm:table-cell col-no-right-border">{weekday[i[2]]}</td>
                <td className="table-cell sm:hidden col-no-right-border">{i[1]}（{weekday[i[2]]}）</td>
                <td className="hidden sm:table-cell col-no-right-border">{check_row(i) ? (i[3] != '9' ? open_types[i[3]]?.TypeName : '日曜加算') : ''}</td>
                <td className="hidden sm:table-cell col-no-right-border">{check_row(i) ? i[4]  : ''}</td>
                <td className="hidden sm:table-cell col-no-right-border">{check_row(i) ? i[5]  : ''}</td>
                <td className="hidden sm:table-cell col-no-right-border">{check_row(i) ? i[6]  : ''}</td>
                <td className="hidden sm:table-cell col-no-right-border">{check_row(i) ? i[7]  : ''}</td>
                <td className="hidden sm:table-cell col-no-right-border">{check_row(i) ? i[8]  : ''}</td>
                <td className="hidden sm:table-cell col-no-right-border">{check_row(i) ? i[9]  : ''}</td>
                <td className="hidden sm:table-cell col-no-right-border">{check_row(i) ? i[10] : ''}</td>
                <td className="hidden sm:table-cell col-no-right-border">{i[12] ? i[13] : ''}</td>
                <td className="col-no-right-border">
                  <span className={(i[7] + i[8] >= 2 && i[9] + i[10] >= 2) ? 'text-green-500' : 'text-red-500 font-bold'}>
                    {check_row(i) ? (i[3] >= 0 ? ((i[7] + i[8] >= 2 && i[9] + i[10] >= 2)  ? 'OK' : 'NG') : '') : ''}
                  </span>
                </td>
                <td>
                  <span className={i[3] >= 0 ? (i[11] ? 'text-green-500' : 'text-red-500 font-bold') : ''}>{check_row(i) ? (i[3] >= 0 ? (i[11] ? 'OK' : 'NG') : '') : ''}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/** 児童数一括登録ダイアログ */}
      <div id="all-date-input-modal" tabIndex={-1}
        className={(children_input_modal_open ? "block" : "hidden") + " modal-back-ground"}
        onClick={(e) => {
          if((e.target as HTMLElement).id == 'all-date-input-modal'){
            setChildrenInputModalOpen(false)
          }
        }}>
        {is_loading && <div className="loading z-50">
          <div role="status" className="absolute -translate-x-1/2 -translate-y-1/2 top-2/4 left-1/2">
            <svg className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        </div>}
        <div className="modal-dialog max-w-6xl top-2">
          <div className="modal-content">
            <Form onSubmit={(e) => handleSubmit(e)}>
              <div className="flex items-center justify-between p-4 md:p-5 rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  児童数一括登録
                </h3>
                <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={() => setChildrenInputModalOpen(false)}>
                  <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" strokeLinecap={"round"} strokeLinejoin={"round"} strokeWidth={2} d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
              </div>

              <div className="modal-body max-h-140 overflow-auto p-0">
                <table className="w-full border-separate border-spacing-0">
                  <thead className="hidden sm:table-header-group sticky top-0 bg-white">
                    <tr className="row-top">
                        <th rowSpan={2} className="col-no-right-border py-1">日付</th>
                        <th rowSpan={2} className="col-no-right-border py-1">曜日</th>
                        <th rowSpan={2} className="col-no-right-border py-1">開所<br/>種別</th>
                        <th colSpan={3} className="py-1">児童数</th>
                    </tr>
                    <tr className="row-middle">
                        <th className="col-no-right-border py-1">合計</th>
                        <th className="col-no-right-border py-1">内、加配</th>
                        <th className="py-1">内、医ケア児</th>
                    </tr>
                    <tr key={'summary'} className="row-middle">
                      <td colSpan={3}  className="col-no-right-border py-1">合計</td>
                      <td className="col-no-right-border py-1">{child_summary['children']}</td>
                      <td className="col-no-right-border py-1">{child_summary['disability']}</td>
                      <td className="py-1">{child_summary['medical_care']}</td>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(view_data.list)?.map((i:any) => (
                      <tr key={i[0]} className={"row-middle " + bg_color_weekday(i[0], i[2])}>
                        <td className="table-cell col-no-right-border py-1">{i[1]}</td>
                        <td className="table-cell col-no-right-border py-1">{weekday[i[2]]}</td>
                        <td className="table-cell col-no-right-border py-1">
                          <select className="py-2 sm:px-2 text-sm" name={i[0] + "|open_type"} defaultValue={i[3]}>
                            <option value="" key="none"></option>
                            {
                              Object.keys(open_types).map((key:string) => (
                                <option value={key} key={key}>{open_types[key].TypeName}</option>
                              ))
                            }
                            <option value={9} key={9}>{"日曜加算"}</option>
                          </select>
                        </td>
                        <td className="table-cell col-no-right-border py-1"><input className="text-right input-default" name={i[0] + "|children"} type="number" defaultValue={i[4]}/></td>
                        <td className="table-cell col-no-right-border py-1"><input className="text-right input-default" name={i[0] + "|disability"} type="number" defaultValue={i[5]}/></td>
                        <td className="table-cell py-1"><input className="text-right input-default" name={i[0] + "|medical_care"} type="number" defaultValue={i[6]}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-danger w-28" onClick={() => setChildrenInputModalOpen(false)}>キャンセル</button>
                <button type="submit" className="ms-3 btn-primary w-28">登録</button>
              </div>
            </Form>
          </div>
        </div>
      </div>

      {/** 資料ダウンロードダイアログ */}
      <div id="edit-modal" tabIndex={-1}
        className={(open_download ? "block" : "hidden") + " modal-back-ground"}
        onClick={(e) => {
          if((e.target as HTMLElement).id == 'edit-modal'){
            setOpenDownload(false)
          }
        }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <Form onSubmit={(e) => downloadSubmit(e)}>
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  資料ダウンロード
                </h3>
                <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={() => setOpenDownload(false)}>
                  <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" strokeLinecap={"round"} strokeLinejoin={"round"} strokeWidth={2} d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group ml-2">
                  <label htmlFor="a" className="form-label">種別：</label>
                  <span className="radio-inline">
                    <input id="a" className="form-check-input" type="radio" name="download_type" value={'1'} checked={download_type=='1'} onChange={() => setDownloadType('1')}/>
                    <label htmlFor="a">月次報告書</label>
                  </span>
                  <span className="radio-inline ml-2">
                    <input id="b" className="form-check-input" type="radio" name="download_type" value={'2'} checked={download_type=='2'} onChange={() => setDownloadType('2')}/>
                    <label htmlFor="b">勤務表</label>
                  </span>
                  <span className="radio-inline ml-2">
                    <input id="c" className="form-check-input" type="radio" name="download_type" value={'3'} checked={download_type=='3'} onChange={() => setDownloadType('3')}/>
                    <label htmlFor="c">加配時間</label>
                  </span>
                </div>
                <div className={"form-group ml-2 flex " + (download_type != '3' ? '' : 'hidden')}>
                  <label htmlFor="download_ym" className="form-label py-2">年月：</label>
                  <select id="download_ym" name="download_ym" className="select w-1/3" value={download_ym} onChange={(e) => setDownloadYM(e.target.value)}>
                    {ym_list.map((item:any) => (
                      <option key={item.value} value={item.value}>{item.value.split('-').join('年') + '月' + (item.confirm ? ' 確定済み' : '')}</option>
                    ))}
                  </select>
                </div>
                <div className={"form-group ml-2 flex " + (download_type == '3' ? '' : 'hidden')} >
                  <label htmlFor="download_y" className="form-label py-2">年度：</label>
                  <select id="download_y" name="download_y" className="select w-1/3" value={download_y} onChange={(e) => setDownloadY(parseInt(e.target.value))}>
                    {download_y_list.map((year:any) => (
                      <option key={year} value={year}>{year + '年度'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-red-600 text-sm mt-2">※月次報告の児童数は現時点での情報が出力されます。</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="ms-3 btn-primary w-28" onClick={() => setOpenDownload(false)}>ダウンロード</button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}
