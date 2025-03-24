import { Form, useOutletContext } from "@remix-run/react";
import { useState } from "react";
import { putData } from "~/api/fetchApi";
import { weekday } from "~/components/util"

export default function Index() {
  const context: {
    id_token: string,
    search_ym: string,
    search_school_id: string,
    search_results: object[],
    config: {
      open_types: any,
    },
    holidays: string[],
    setEditParams(school_id: string, date: string, child:boolean): void,
    changeParams(ym: string, school_id: string): void,
  } = useOutletContext();

  const [children_input_modal_open, setChildrenInputModalOpen] = useState(false)
  const [is_loading, setIsLoading] = useState(false)
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
      const old_data = context.search_results.find((i: any) => i[0] == d) as { [key: string]: any } | undefined;
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
        school_id: context.search_school_id,
        data: new_children_obj,
      }, context.id_token)
      alert('登録しました。')
    }else{
      alert('変更はありませんでした。')
    }
    setIsLoading(false)
    setChildrenInputModalOpen(false)
    context.changeParams(context.search_ym, context.search_school_id)
  }

  const check_plus = (val:string) => {return parseInt(val) > 0 ? parseInt(val)  : 0}
  const child_summary = context.search_results.reduce((result:any, i:any) => {
    result.children                += check_plus(i[4])
    result.disability              += check_plus(i[5])
    result.medical_care            += check_plus(i[6])
    result.open_qualification      += check_plus(i[7])
    result.open_non_qualification  += check_plus(i[8])
    result.close_qualification     += check_plus(i[9])
    result.close_non_qualification += check_plus(i[10])
    return result;
  }, {
    'children': 0,
    'disability': 0,
    'medical_care': 0,
    'open_qualification': 0,
    'open_non_qualification': 0,
    'close_qualification': 0,
    'close_non_qualification': 0,
  });

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

  return (
    <>
      <table className="w-full">
        <thead className="hidden sm:table-header-group">
          <tr>
              <th rowSpan={2}>日付</th>
              <th rowSpan={2}>曜日</th>
              <th rowSpan={2}>開所<br/>種別</th>
              <th colSpan={3}>
                児童数
                <button type="button" className="btn-primary px-3 py-2 ml-4" onClick={() => setChildrenInputModalOpen(true)}>
                  一括入力
                </button>
              </th>
              <th colSpan={2}>開所時職員数</th>
              <th colSpan={2}>閉所時職員数</th>
              <th rowSpan={2}>開所<br/>閉所</th>
              <th rowSpan={2}>配置</th>
              <th rowSpan={2}></th>
          </tr>
          <tr>
              <th>合計</th>
              <th>内、障がい児</th>
              <th>内、医ケア児</th>
              <th>支援員数</th>
              <th>支援員以外</th>
              <th>支援員数</th>
              <th>支援員以外</th>
          </tr>
          <tr key={'summary'}>
            <td colSpan={3}>合計</td>
            <td>{child_summary['children']}</td>
            <td>{child_summary['disability']}</td>
            <td>{child_summary['medical_care']}</td>
            <td>{child_summary['open_qualification']}</td>
            <td>{child_summary['open_non_qualification']}</td>
            <td>{child_summary['close_qualification']}</td>
            <td>{child_summary['close_non_qualification']}</td>
            <td colSpan={3}></td>
          </tr>
        </thead>
        <thead className="table-header-group sm:hidden">
          <tr>
              <th>日付</th>
              <th>開所<br/>閉所</th>
              <th>配置</th>
              <th></th>
          </tr>
        </thead>

        <tbody>
          {Object.values(context.search_results)?.map((i:any) => (
            <tr key={i[0]} className={i[2]==6 ? "bg-cyan-100" : ((i[2]==0 || context.holidays.includes(i[0])) ? "bg-red-100" : "")}>
              <td className="hidden sm:table-cell">{i[1]}</td>
              <td className="hidden sm:table-cell">{weekday[i[2]]}</td>
              <td className="table-cell sm:hidden">{i[1]}（{weekday[i[2]]}）</td>
              <td className="hidden sm:table-cell">{check_row(i) ? (i[3] != '9' ? context.config.open_types[i[3]]?.TypeName : '日曜加算') : ''}</td>
              <td className="hidden sm:table-cell">{check_row(i) ? i[4]  : ''}</td>
              <td className="hidden sm:table-cell">{check_row(i) ? i[5]  : ''}</td>
              <td className="hidden sm:table-cell">{check_row(i) ? i[6]  : ''}</td>
              <td className="hidden sm:table-cell">{check_row(i) ? i[7]  : ''}</td>
              <td className="hidden sm:table-cell">{check_row(i) ? i[8]  : ''}</td>
              <td className="hidden sm:table-cell">{check_row(i) ? i[9]  : ''}</td>
              <td className="hidden sm:table-cell">{check_row(i) ? i[10] : ''}</td>
              <td>
                <span className={(i[7] + i[8] >= 2 && i[9] + i[10] >= 2) ? 'text-green-500' : 'text-red-500 font-bold'}>
                  {check_row(i) ? (i[3] >= 0 ? ((i[7] + i[8] >= 2 && i[9] + i[10] >= 2)  ? 'OK' : 'NG') : '') : ''}
                </span>
              </td>
              <td>
                <span className={i[3] >= 0 ? (i[11] ? 'text-green-500' : 'text-red-500 font-bold') : ''}>{check_row(i) ? (i[3] >= 0 ? (i[11] ? 'OK' : 'NG') : '') : ''}</span>
              </td>
              <td>
                <button type="button" className="btn-primary" onClick={() => context.setEditParams(context.search_school_id, i[0], true)}>
                  入力
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/** 児童数一括登録ダイアログ */}
      <div id="edit-modal" tabIndex={-1}
        className={(children_input_modal_open ? "block" : "hidden") + " modal-back-ground"}
        onClick={(e) => {
          if((e.target as HTMLElement).id == 'edit-modal'){
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
          <div className="modal-dialog max-w-6xl">
          <div className="modal-content">
            <Form onSubmit={(e) => handleSubmit(e)}>
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
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
              <div className="modal-body max-h-200 overflow-auto">

                <table className="w-full">
                  <thead className="hidden sm:table-header-group sticky top-0 bg-white">
                    <tr className="">
                        <th rowSpan={2}>日付</th>
                        <th rowSpan={2}>曜日</th>
                        <th rowSpan={2}>開所<br/>種別</th>
                        <th colSpan={3}>児童数</th>
                    </tr>
                    <tr>
                        <th>合計</th>
                        <th>内、障がい児</th>
                        <th>内、医ケア児</th>
                    </tr>
                    <tr key={'summary'}>
                      <td colSpan={3}>合計</td>
                      <td>{child_summary['children']}</td>
                      <td>{child_summary['disability']}</td>
                      <td>{child_summary['medical_care']}</td>
                    </tr>
                  </thead>

                  <tbody>
                    {Object.values(context.search_results)?.map((i:any) => (
                      <tr key={i[0]} className={i[2]==6 ? "bg-cyan-100" : ((i[2]==0 || context.holidays.includes(i[0])) ? "bg-red-100" : "")}>
                        <td className="hidden sm:table-cell">{i[1]}</td>
                        <td className="hidden sm:table-cell">{weekday[i[2]]}</td>
                        <td className="table-cell sm:hidden">{i[1]}（{weekday[i[2]]}）</td>
                        <td className="hidden sm:table-cell">
                          <select className="py-2 sm:px-2 text-sm" name={i[0] + "|open_type"} defaultValue={i[3]}>
                            <option value="" key="none"></option>
                            {
                              Object.keys(context.config.open_types).map((key:string) => (
                                <option value={key} key={key}>{context.config.open_types[key].TypeName}</option>
                              ))
                            }
                            <option value={9} key={9}>{"日曜加算"}</option>
                          </select>
                        </td>
                        <td className="hidden sm:table-cell"><input className="text-right input-default" name={i[0] + "|children"} type="number" defaultValue={i[4]}/></td>
                        <td className="hidden sm:table-cell"><input className="text-right input-default" name={i[0] + "|disability"} type="number" defaultValue={i[5]}/></td>
                        <td className="hidden sm:table-cell"><input className="text-right input-default" name={i[0] + "|medical_care"} type="number" defaultValue={i[6]}/></td>
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
    </>
  );
}
