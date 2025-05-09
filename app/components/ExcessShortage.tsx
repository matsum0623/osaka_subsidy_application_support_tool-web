import React from "react";
import { checkInstructor } from "~/lib/common_check";

const check_cell_class = (start:string, end:string, chk_start:string, chk_end:string, qua:boolean, add:boolean) => {
  // 勤務時間外はfalse
  const border_right = chk_start.split(':')[1] == '45' ? ' border-r-gray-500' : ''
  if (start == "" || end == "" || start > chk_start || end < chk_end) return '' + border_right
  if (add) return 'bg-blue-200' + border_right
  if (qua) return 'bg-green-200' + border_right
  return 'bg-lime-200' + border_right
}

const excess_shortage_cell = (excess_shortage:any, chk_start:string, type:string) => {
  const border_right = chk_start.split(':')[1] == '45' ? ' border-r-gray-500' : ''
  if (!(chk_start in excess_shortage)){
    return <td className={"px-0 sm:p-2" + border_right}></td>
  }
  if (type == 'qua'){
    if (excess_shortage[chk_start].shortage.qua > 0){
      return <td className={"bg-red-400 px-0 sm:p-2" + border_right}></td>
    }else if (excess_shortage[chk_start].excess.qua > 0 && excess_shortage[chk_start].sum.num > 2){
      return <td className={"bg-blue-400 px-0 sm:p-2" + border_right}>{excess_shortage[chk_start].excess.qua}</td>
    }
  } else if (type == 'sub'){
    if ((excess_shortage[chk_start].shortage.num - excess_shortage[chk_start].shortage.qua) > 0){
      return <td className={"bg-red-200 px-0 sm:p-2" + border_right}></td>
    }else if ((excess_shortage[chk_start].excess.num - excess_shortage[chk_start].excess.qua) > 0){
      return <td className={"bg-blue-200 px-0 sm:p-2" + border_right}>{excess_shortage[chk_start].excess.num - excess_shortage[chk_start].excess.qua}</td>
    }
  }
  return <td className={"px-0 sm:p-2" + border_right}></td>
}

export function calcExcessShortageConfig(open:any, close:any) {
  let [open_h, open_m] = open.split(':').map((s:string) => parseInt(s))
  const time_dict: { [key: string]: any[] } = {}
  let tmp_list = []
  let pre_hour = undefined
  while(true){
    if(pre_hour == undefined){
      pre_hour = open_h
    }else if(pre_hour != open_h){
      time_dict[('00' + String(pre_hour)).slice(-2)] = tmp_list
      pre_hour = open_h
      tmp_list = []
    }
    const start_key = ('00' + String(open_h)).slice(-2) + ':' + ('00' + String(open_m)).slice(-2)
    if(start_key >= close){
        break
    }
    open_m += 15
    if(open_m >= 60){
        open_h += 1
        open_m -= 60
    }
    tmp_list.push([start_key, ('00' + String(open_h)).slice(-2) + ':' + ('00' + String(open_m)).slice(-2)])
  }
  if(tmp_list.length > 0){
    time_dict[('00' + String(pre_hour)).slice(-2)] = tmp_list
  }
  return time_dict
}

export function ExcessShortage(start:string, end:string, instructors: { [key: string]: { start: string, end: string, hours: string, additional_check?: boolean } }, ) {
  /** 過不足確認ダイアログ */
  const excess_shortage = checkInstructor(instructors, start, end).excess_shortage
  const excess_shortage_config = calcExcessShortageConfig(start, end)
  return (
    <div className="modal-body overflow-scroll">
      <table className="w-full text-xs sm:text-base">
        <thead>
          <tr>
            <td rowSpan={3}><span className="hidden sm:block">指導員名</span></td>
            <td colSpan={99} className="py-1 sm:p-2">勤務時間</td>
          </tr>
          <tr>
            {Object.keys(excess_shortage_config).sort((a:any, b:any) => (a - b)).map((key:string) => (
              <td className="py-1 sm:p-2" colSpan={excess_shortage_config[key].length} key={key}>{key}</td>
            ))}
          </tr>
          <tr className="hidden sm:table-row">
            {Object.keys(excess_shortage_config).sort((a:any, b:any) => (a - b)).map((key:string) => {
              return excess_shortage_config[key].map((time:any) => {
                return <td key={key + time} className="px-0"><span className="hidden sm:block">{time[0].split(':')[1]}</span></td>
              })
            })}
          </tr>
        </thead>
        <tbody>
          {
            Object.values(instructors).sort((a:any, b:any) => (a.order - b.order)).map((inst: any) => {
              return (
                <tr key={'es' + inst.id}>
                  <td className="table-cell sm:hidden px-0 py-1">{inst.name.slice(0,2)}</td>
                  <td className="hidden sm:table-cell py-1">{inst.name}</td>
                  {Object.keys(excess_shortage_config).sort((a:any, b:any) => (a - b)).map((key:string) => {
                    return excess_shortage_config[key].map((time:any) => {
                      return <td className={check_cell_class(inst.start, inst.end, time[0], time[1], inst.qualification, inst.additional_check) + " px-0 sm:p-2"} key={time[0]}></td>
                    })
                  })}
                </tr>
              )
            })
          }
          <tr className="border-t-4" key='es_inst'>
            <td className="py-1">
              <span className="hidden sm:block">過不足(指)</span>
              <span className="sm:hidden">指</span>
            </td>
            {Object.keys(excess_shortage_config).sort((a:any, b:any) => (a - b)).map((key:string) => {
              return excess_shortage_config[key].map((time:any) => {
                return <React.Fragment key={time[0]}>{excess_shortage_cell(excess_shortage, time[0], 'qua')}</React.Fragment>
              })
            })}
          </tr>
          <tr key='es_sub'>
            <td className="py-1">
              <span className="hidden sm:block">過不足(補)</span>
              <span className="sm:hidden">補</span>
            </td>
            {Object.keys(excess_shortage_config).sort((a:any, b:any) => (a - b)).map((key:string) => {
              return excess_shortage_config[key].map((time:any) => {
                return <React.Fragment key={time[0]}>{excess_shortage_cell(excess_shortage, time[0], 'sub')}</React.Fragment>
              })
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )
}