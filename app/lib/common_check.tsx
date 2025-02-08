// 共通のチェック処理を実装する

export function checkInstructor(instData: any, open:any, close:any) {
    // 開所・閉所時間から勤務ボックス作成
    let [open_h, open_m] = open.split(':').map((s:string) => parseInt(s))
    const work_member:{[key: string]: {
        num: number,
        qua: number,
        add: number,
        med: number,
        shortage: {
            num: number,
            qua: number,
        },
        excess: {
            num: number,
            qua: number,
        }
    }} = {}
    while(true){
        const key = ('00' + String(open_h)).slice(-2) + ':' + ('00' + String(open_m)).slice(-2)
        if(key >= close){
            break
        }
        work_member[key] = {
            num: 0,
            qua: 0,
            add: 0,
            med: 0,
            shortage: {
                num: 0,
                qua: 0,
            },
            excess: {
                num: 0,
                qua: 0,
            }
        }
        open_m += 15
        if(open_m >= 60){
            open_h += 1
            open_m -= 60
        }
    }
    Object.values(instData).forEach((value:any) => {
        if(value.hours != ''){
            Object.keys(work_member).forEach((key:string) => {
                if(value.start <= key && key < value.end){
                    if(!value.additional_check){
                        work_member[key].num += 1
                    }
                    if(value.qualification && !value.additional_check){
                        work_member[key].qua += 1
                    }
                    if(value.additional_check){
                        work_member[key].add += 1
                    }
                    if(value.medical_care){
                        work_member[key].med += 1
                    }
                }
            })
        }
    })
    /*
        配置をチェックする
            １．全時間帯で2人以上
            ２．全時間帯にquaが1人以上
    */
    let check_response = true
    Object.keys(work_member).map((key) => {
        if(work_member[key].num < 2){
            check_response = false
            work_member[key].shortage.num = 2 - work_member[key].num
        }else if(work_member[key].num > 2){
            work_member[key].excess.num = work_member[key].num - 2
        }
        // 資格者が1人以上配置されているか
        if(work_member[key].qua < 1){
            check_response = false
            work_member[key].shortage.qua = 1 - work_member[key].qua
        }else if(work_member[key].qua > 1){
            // 資格者の余りがあっても、人数が2の場合は余っていないとみなす
            if (work_member[key].num == 2){
                work_member[key].excess.qua = 0
            }else if(work_member[key].num == work_member[key].qua){
                work_member[key].excess.qua = work_member[key].qua - 2
            }else{
                work_member[key].excess.qua = work_member[key].qua - 1
            }
        }
    })
    const excess_shortage: { [key: string]: { key: string, shortage: { num: number, qua: number }, excess: { num: number, qua: number }, sum: { num: number, qua: number }  } } = {}
    Object.keys(work_member).map((key) => {
        if(work_member[key].shortage.num > 0 || work_member[key].shortage.qua > 0 ||
            work_member[key].excess.num > 0 || work_member[key].excess.qua > 0){
            excess_shortage[key] = {
                'key': key,
                'shortage': {
                    'num': work_member[key].shortage.num,
                    'qua': work_member[key].shortage.qua,
                },
                'excess': {
                    'num': work_member[key].excess.num,
                    'qua': work_member[key].excess.qua,
                },
                'sum': {
                    'num': work_member[key].num,
                    'qua': work_member[key].qua,
                }
            }
        }
    })

    return {
        check: check_response,
        work_member: work_member,
        excess_shortage: excess_shortage,
    }
}