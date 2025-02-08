import { useOutletContext } from "@remix-run/react";
import { weekday } from "~/components/util"

export default function Index() {
  const context: {
    search_school_id: string,
    search_results: object[],
    config: {
      open_types: any,
    },
    holidays: string[],
    setEditParams(school_id: string, date: string, child:boolean): void
  } = useOutletContext();

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
      {<table className="w-full">
        <thead className="hidden sm:table-header-group">
          <tr>
              <th rowSpan={2}>日付</th>
              <th rowSpan={2}>曜日</th>
              <th rowSpan={2}>開所<br/>種別</th>
              <th colSpan={3}>児童数</th>
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
      </table>}
    </>
  );
}
