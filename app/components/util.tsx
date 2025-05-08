
export function Loading(navigation:any) {
  if (navigation.state === "loading" || navigation.state === "submitting"){
    return (
      <div className="loading z-50">
        <div role="status" className="absolute -translate-x-1/2 -translate-y-1/2 top-2/4 left-1/2">
          <svg className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    )
  }
}

/**
 * 現在日付から初期表示する年月を取得する
 * @returns yyyy-mm
 */
export function viewMonth() {
  const today = new Date()
  return ((today.getDate() <= 20 && today.getMonth() == 0) ? today.getFullYear()-1 : today.getFullYear()) + '-' + ('0' + ((today.getDate() <= 20) ? ((today.getMonth() == 0) ? 12 : today.getMonth()) : (today.getMonth() + 1))).slice(-2)
}

export function viewMonthList() {
  const today = new Date()
  const today_year = today.getFullYear()
  const today_month = today.getMonth() + 1
  const ym_list = []
  for(let i=0; i < 13; i++){
    ym_list.push({
      value: ((i<today_month) ? today_year : today_year-1) + '-' + ('0' + ( (i < today_month) ? today_month - i : today_month - i + 12)).slice(-2),
      confirm: false
    })
  }
  return ym_list
}

export function downloadYearList() {
  const today = new Date()
  const today_year = today.getFullYear()
  const today_month = today.getMonth() + 1
  if (today_month <= 3){
    return [today_year - 1, today_year -2, today_year - 3]
  }else{
    return [today_year, today_year - 1, today_year - 2]
  }
}

export function createDates(dt:string) {
  const now_dt: Date = new Date(dt);
  const prev_dt: Date = new Date(dt);
  const next_dt: Date = new Date(dt);
  prev_dt.setDate(prev_dt.getDate() - 1);
  next_dt.setDate(next_dt.getDate() + 1);
  return [now_dt, prev_dt, next_dt]
}

export const weekday = ['日', '月', '火', '水', '木', '金', '土', ]

export function closeButton(closeFunc: (arg0: boolean) => void) {
  return (
    <button type="button" className="btn-close" onClick={() => closeFunc(false)}>
      <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
        <path stroke="currentColor" strokeLinecap={"round"} strokeLinejoin={"round"} strokeWidth={2} d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
      </svg>
      <span className="sr-only">Close modal</span>
    </button>
  )
}