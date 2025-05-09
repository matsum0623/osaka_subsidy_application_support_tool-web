import {
  useNavigate,
  useLoaderData,
  Outlet,
  ClientLoaderFunctionArgs,
  Form,
  useMatches,
  useNavigation,
  redirect,
  Link,
} from "@remix-run/react";
import { getData } from "~/api/fetchApi";
import { useRef, useState } from "react";
import { closeButton, downloadYearList, Loading, viewMonth, viewMonthList } from "~/components/util";
import { getLs } from "~/lib/ls";
import { checkInstructor } from "~/lib/common_check";
import { AccountHeader } from "~/components/header";
import { confirmResetPassword, resetPassword } from "aws-amplify/auth";

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

  // ダウンロード用の年度を作成、過去3年
  data.download_y_list = downloadYearList()

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

  const [open_download, setOpenDownload] = useState(false)
  const [download_type, setDownloadType] = useState('1')
  const [download_y, setDownloadY] = useState(data.download_y_list[0])
  const [download_ym, setDownloadYM] = useState(data.ym)

  const [open_account, setOpenAccount] = useState(false)
  const [is_reset_password, setIsResetPassword] = useState(false)
  const [is_reset_password_confirm, setIsResetPasswordConfirm] = useState(false)
  const [reset_confirm_username, setResetConfirmUsername] = useState('')

  const user_id = getLs('user_id') ?? ''
  const account = JSON.parse(getLs('user_data') ?? '{}')

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const reset_result = await resetPassword({ username: user_id })
      switch (reset_result.nextStep.resetPasswordStep) {
        case "CONFIRM_RESET_PASSWORD_WITH_CODE":
          alert(`パスワードリセットのためのコードを${reset_result.nextStep.codeDeliveryDetails.deliveryMedium}に送信しました。\nno-reply@verificationemail.comからのメールを確認してください。`)
          setResetConfirmUsername(user_id)
          setIsResetPassword(false)
          setIsResetPasswordConfirm(true)
          break
        case "DONE":
          alert('パスワードリセットが完了しました。')
          break
        default:
          alert('予期せぬエラーが発生しました。')
          break
      }
    } catch (e) {
      console.error(e)
      alert('パスワードリセットに失敗しました。')
    }
  }

  const handleResetPasswordConfirm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const reset_code:string = formData.get("verification_code")?.toString() || ''
    const new_password:string = formData.get("reset_new_password")?.toString() || ''
    try {
      const reset_result = await confirmResetPassword(
        { username: reset_confirm_username,
          confirmationCode: reset_code,
          newPassword: new_password,
        })
        console.log(reset_result)
      alert('パスワードリセットが完了しました。')
      setIsResetPasswordConfirm(false)
    } catch (e) {
      console.error(e)
      alert('パスワードリセットに失敗しました。')
    }
  }


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
    const report_data = await getData(`/monthly/download?ym=${download_ym}&school_id=${search_school_id}&type=${output_type}`, data.idToken)
    const link = anchorRef.current
    if (link) {
      link.setAttribute('href', report_data.url)
      link.click()
    }
    setIsLoading("idle")
  }

  const downloadSummary = async (output_type:string = 'monthly_report') => {
    setIsLoading("loading")
    const report_data = await getData(`/monthly/download/summary?year=${download_y}&school_id=${search_school_id}`, data.idToken)
    const link = anchorRef.current
    if (link) {
      link.setAttribute('href', report_data.url)
      link.click()
    }
    setIsLoading("idle")
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

  const navigation = useNavigation()

  return (
    <>
      <div>
        {Loading((navigation.state == 'loading' || navigation.state == 'submitting') ? navigation : {state: is_loading})}
        {
          (matches.length < 3 || (matches.length == 3 && !matches[2].pathname.includes('/edit/'))) &&
          <div className="flex justify-between bg-white sticky top-0 z-10">
            <Form>
              <div className="flex">
                <div className="py-2 sm:p-2">
                  <select name="school_id" className="select" value={search_school_id} onChange={(e) => changeParams(search_ym ,e.target.value)}>
                    {data.user_data.after_schools.map((item:any) => (
                      <option key={item.school_id} value={item.school_id}>{item.school_id + ':' + item.school_name}</option>
                    ))}
                  </select>
                </div>
                <div className="py-2 sm:p-2">
                  <select name="ym" className="select" value={search_ym} onChange={(e) => changeParams(e.target.value, search_school_id)}>
                    {data.ym_list.map((item:any) => (
                      <option key={item.value} value={item.value}>{item.value.split('-').join('年') + '月' + (item.confirm ? ' 確定済み' : '')}</option>
                    ))}
                  </select>
                </div>
                <div className="ms-auto p-2 hidden sm:block sm:ml-4">
                  <button type="button" onClick={() => setOpenDownload(true)}
                    className="btn-download">
                      資料ダウンロード
                  </button>
                </div>
              </div>
            </Form>
            <div className="flex">
              <a ref={anchorRef} className='hidden' download={'テストファイル'}></a>
              <div className="ms-auto p-2 hidden sm:flex sm:gap-4">
                <div>
                  {
                    data.user_data.admin &&
                    <Link to="/admin" className="hidden sm:flex text-sm sm:text-xl font-semibold leading-6 text-gray-900 underline sm:py-2">管理画面</Link>
                  }
                  {
                    !data.user_data.admin &&
                    <Link to="/after_school_settings" className="hidden sm:flex text-sm sm:text-xl font-semibold leading-6 text-gray-900 underline sm:py-2">学童設定</Link>
                  }
                </div>
                <div className="flex sm:flex-1 sm:justify-end">
                  <button type="button" className="text-sm sm:text-xl font-semibold leading-6 text-gray-900" onClick={() => setOpenAccount(!open_account)}>アカウント</button>
                  <div className="absolute bg-white border-2 border-gray-300 top-11 px-3 py-2 rounded-lg" hidden={!open_account}>
                    <table className="table-auto text-sm sm:text-xl leading-6 text-gray-900 account-table">
                      <tbody>
                        <tr>
                          <td className="text-right">ユーザID：</td>
                          <td>{user_id}</td>
                        </tr>
                        <tr>
                          <td className="text-right">名前：</td>
                          <td>{account.user_data.user_name}</td>
                        </tr>
                        <tr>
                          <td className="text-right">学童数：</td>
                          <td>{account.user_data.after_schools.length}施設</td>
                        </tr>
                        <tr>
                          <td className="text-right">権限：</td>
                          <td>{account.user_data.admin ? '管理者' : '一般'}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="py-1 text-right mt-2"><button type="button" className="text-sm sm:text-xl font-semibold leading-6 text-gray-900" onClick={() => setIsResetPassword(true)}>パスワード変更</button></div>
                    <div className="py-1 text-right"><Link to="/logout" className="text-sm sm:text-xl text-red-500 font-semibold leading-6 sm:py-2" >ログアウト</Link></div>
                  </div>

                  {/** パスワードリセットダイアログ */}
                  <div id="reset-modal" tabIndex={-1}
                    className={(is_reset_password ? "block" : "hidden") + " modal-back-ground"}
                    onClick={(e) => {
                      if((e.target as HTMLElement).id == 'reset-modal'){
                        setIsResetPassword(false)
                      }
                    }}>
                    <div className="modal-dialog">
                      <div className="modal-content">
                        <Form onSubmit={(e) => handleResetPassword(e)}>
                          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                              パスワード再設定
                            </h3>
                            {closeButton(setIsResetPassword)}
                          </div>
                          <div className="modal-body">
                            <div>
                              <p className="mb-2 text-xl font-medium text-gray-900 dark:text-white">パスワードをリセットしますか？</p>
                            </div>
                          </div>
                          <div className="modal-footer">
                            <button type="button" className="btn-danger w-28" onClick={() => setIsResetPassword(false)}>キャンセル</button>
                            <button type="submit" className="ms-3 btn-primary w-28">実行</button>
                          </div>
                        </Form>
                      </div>
                    </div>
                  </div>

                  {/** パスワードリセット認証コード入力ダイアログ */}
                  <div id="reset-modal" tabIndex={-1}
                    className={(is_reset_password_confirm ? "block" : "hidden") + " modal-back-ground"}
                    onClick={(e) => {
                      if((e.target as HTMLElement).id == 'reset-modal'){
                        setIsResetPasswordConfirm(false)
                      }
                    }}>
                    <div className="modal-dialog">
                      <div className="modal-content">
                        <Form onSubmit={(e) => handleResetPasswordConfirm(e)}>
                          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                              検証コードを入力
                            </h3>
                            {closeButton(setIsResetPasswordConfirm)}
                          </div>
                          <div className="modal-body">
                            <div>
                              <label htmlFor="verification_code" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">検証コード</label>
                              <input type="text" name="verification_code" id="verification_code" placeholder="検証コード" className="login-input" required/>
                            </div>
                            <div>
                              <label htmlFor="reset_new_password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">新しいパスワード</label>
                              <input type="password" name="reset_new_password" id="reset_new_password" placeholder="********" className="login-input" required/>
                            </div>
                          </div>
                          <div className="modal-footer">
                            <button type="button" className="btn-danger w-28" onClick={() => setIsResetPasswordConfirm(false)}>キャンセル</button>
                            <button type="submit" className="ms-3 btn-primary w-28">登録</button>
                          </div>
                        </Form>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
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
                  <label htmlFor="download_type" className="form-label">種別：</label>
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
                  <label htmlFor="download_type" className="form-label py-2">年月：</label>
                  <select name="download_y" className="select w-1/3" value={download_ym} onChange={(e) => setDownloadYM(e.target.value)}>
                    {data.ym_list.map((item:any) => (
                      <option key={item.value} value={item.value}>{item.value.split('-').join('年') + '月' + (item.confirm ? ' 確定済み' : '')}</option>
                    ))}
                  </select>
                </div>
                <div className={"form-group ml-2 flex " + (download_type == '3' ? '' : 'hidden')} >
                  <label htmlFor="download_type" className="form-label py-2">年度：</label>
                  <select name="download_y" className="select w-1/3" value={download_y} onChange={(e) => setDownloadY(e.target.value)}>
                    {data.download_y_list.map((year:any) => (
                      <option key={year} value={year}>{year + '年度'}</option>
                    ))}
                  </select>
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
