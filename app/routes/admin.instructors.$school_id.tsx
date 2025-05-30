import {
  useLoaderData,
  redirect,
  ClientLoaderFunctionArgs,
  Form,
  useNavigate,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { getIdToken } from "~/api/auth";
import { getData, putData, postData, deleteData } from "~/api/fetchApi";
import { Loading  } from "~/components/util";

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
    }
  }
};

export default function Index() {
  const data = useLoaderData<typeof clientLoader>()
  if (!data.idToken){
    redirect("/");
  }

  const [is_loading, setIsLoading] = useState(false)
  const [view_retirement, setViewRetirement] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e:any) => {
    setIsLoading(true)
    const post_data = {
      instructor_id: instructorId,
      instructor_Name: instructorName,
      qualification: qualification,
      additional: additional,
      medical_care: medicalCare,
      modal_type: modalType,
      seiki: seiki,
      koyou: koyou,
      hire_date: hire_date,
      order: order,
    }
    e.preventDefault();
    if(modalType == "add"){
      await postData("/after_school/" + data.school_id + '/instructors', post_data, data.idToken)
    }else if(modalType == "edit"){
      await putData("/after_school/" + data.school_id + '/instructors', post_data, data.idToken)
    }
    setModalOpenAdd(false)
    setIsLoading(false)
    navigate('./')
  }

  const handleDeleteSubmit = async (e:any) => {
    setIsLoading(true)
    e.preventDefault();
    const post_data = {
      instructor_id: instructorId,
      instructor_Name: instructorName,
      retirement_date: retirement_date,
    }
    await deleteData("/after_school/" + data.school_id + '/instructors', post_data, data.idToken)
    setModalOpenDelete(false)
    setIsLoading(false)
    navigate('./')
  }

  const [instructors, setInstructors] = useState<any>([])

  const [instructorId, setInstructorId] = useState<string>("")
  const [instructorName, setInstructorName] = useState<string>("")
  const [qualification, setQualification] = useState<boolean>(false)
  const [additional, setAdditional] = useState<boolean>(false)
  const [medicalCare, setMedicalCare] = useState<boolean>(false)
  const [seiki, setSeiki] = useState<string>('')
  const [koyou, setKoyou] = useState<string>('')
  const [hire_date, setHireDate] = useState<string>('')
  const [order, setOrder] = useState<number>(9999)
  const [modalType, setModalType] = useState<string>("add")
  const [modalTypeStr, setModalTypeStr] = useState<string>("追加")

  const [modal_open_add, setModalOpenAdd] = useState<boolean>(false)
  const [modal_open_delete, setModalOpenDelete] = useState<boolean>(false)

  const [retirement_date, setRetirementDate] = useState<string>("")

  const openModal = (
    type:string = "add",
    instructor_info:any = {}
  ) => {
    setInstructorId(instructor_info.id ? instructor_info.id : "")
    setInstructorName(instructor_info.name ? instructor_info.name : "")
    setQualification(instructor_info.qualification ? instructor_info.qualification : false)
    setAdditional(instructor_info.additional ? instructor_info.additional : false)
    setMedicalCare(instructor_info.medical_care ? instructor_info.medical_care : false)
    setModalType(type)
    setModalTypeStr(type == 'add' ? '追加' : '編集')
    setSeiki(instructor_info.seiki ? instructor_info.seiki : '2')
    setKoyou(instructor_info.koyou ? instructor_info.koyou : '3')
    setHireDate(instructor_info.hire_date ? instructor_info.hire_date : '')
    setOrder(instructor_info.order ? instructor_info.order : 99)
    setModalOpenAdd(true)
  }

  const openDeleteConfirmModal = (id:string, name:string) => {
    setInstructorId(id)
    setInstructorName(name)
    setRetirementDate('')
    setModalOpenDelete(true)
  }

  const search_data = async () => {
    setIsLoading(true)

    const instructor_data = await getData("/after_school/" + data.school_id + '/instructors', data.idToken)
    setInstructors(instructor_data.instructors.sort((a:any, b:any) => a.order - b.order))

    setIsLoading(false)
  }

  useEffect(() => {
    search_data()
  }, [data.school_id])

  return (
    <div>
      {is_loading && Loading()}
      <div className="flex justify-between my-2">
        <div>
          <p className="text-2xl font-bold">指導員情報</p>
        </div>
        <div className="flex mr-5">
          <div className="mr-16 my-1 text-xl">
            <input type="checkbox" id="view_retirement" className="scale-150" onChange={() => setViewRetirement(!view_retirement)}/>
            <label htmlFor="view_retirement" className="ml-2">退職職員表示</label>
          </div>
          <button type="button" value={"戻る"} className="btn-danger" onClick={() => navigate('/admin/after_school/' + data.school_id)}>戻る</button>
        </div>
      </div>
      <table className="w-full text-center mt-3">
        <thead>
          <tr>
            <td>指導員ID</td>
            <td>氏名</td>
            <td>指導員資格</td>
            <td>障害加算</td>
            <td>医ケア</td>
            <td>雇用・勤務形態</td>
            <td>雇入れ日</td>
            <td>表示順</td>
            <td></td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          {instructors.filter((ins:any) => (view_retirement || !ins.retirement_date)).map((ins:any) => (
            <tr key={ins.id} className={ins.retirement_date && "bg-gray-300"}>
              <td className="align-middle">{ins.id}</td>
              <td className="align-middle">{ins.name}</td>
              <td className="align-middle">{ins.qualification && '○'}</td>
              <td className="align-middle">{ins.additional && '○'}</td>
              <td className="align-middle">{ins.medical_care && '○'}</td>
              <td>{ins.seiki == '1' ? '正規' : (ins.seiki == '2' ? '非正規' : '')}・{ins.koyou == '1' ? '常勤' : (ins.koyou == '3' ? '非常勤' : '')}</td>
              <td className="align-middle">{ins.hire_date}</td>
              <td className="align-middle">{ins.order}</td>
              <td className={!ins.retirement_date ? "hidden" : ""} colSpan={2}>退職済み({ins.retirement_date})</td>
              <td className={ins.retirement_date && "hidden"}><button className="btn btn-primary" onClick={() => (openModal("edit", ins))}>編集</button></td>
              <td className={ins.retirement_date && "hidden"}><button className="btn btn-danger" onClick={() => (openDeleteConfirmModal(ins.id, ins.name))}>削除</button></td>
            </tr>
          ))}
            <tr key={'new'}>
              <td className="align-middle"></td>
              <td className="align-middle"></td>
              <td className="align-middle"></td>
              <td className="align-middle"></td>
              <td className="align-middle"></td>
              <td></td>
              <td></td>
              <td></td>
              <td><button type="button" value={"追加"} className="btn-add" onClick={() => openModal()}>＋追加</button></td>
              <td></td>
            </tr>
        </tbody>
      </table>

      {/** 指導員追加ダイアログ */}
      <Form onSubmit={(e) => handleSubmit(e)}>
        <div id="add_modal" tabIndex={-1} className={(modal_open_add ? "block" : "hidden") + " modal-back-ground"}
        onClick={(e) => {
          if((e.target as HTMLElement).id == 'add_modal'){
            setModalOpenAdd(false)
          }
        }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">指導員{modalTypeStr}</h5>
                <button type="button" className="close-svg" onClick={() => setModalOpenAdd(false)}>
                  <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" strokeLinecap={"round"} strokeLinejoin={"round"} strokeWidth={2} d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
              </div>
              <div className="modal-body">
                <div className={"mb-3" + (modalType == 'add' ? " hidden" : "")}>
                  <label htmlFor="InstructorIdInput" className="form-label">指導員ID</label>
                  <input type="text" name="instructor_id" className="input-default" id="InstructorIdInput" placeholder="指導員ID" value={instructorId} required={modalType == 'edit'} onChange={(e) => setInstructorId(e.target.value)} disabled={modalType == 'edit'}/>
                </div>
                <div className="mb-3">
                  <label htmlFor="InstructorNameInput" className="form-label">指導員氏名</label>
                  <input type="text" name="instructor_name" className="input-default" id="InstructorNameInput" placeholder="指導員氏名" value={instructorName} required onChange={(e) => setInstructorName(e.target.value)}/>
                </div>
                <div>
                  <span>資格</span>
                  <div className="form-check ml-2">
                    <input className="check-box-default" type="checkbox" name="qualification" id="CheckQualification" checked={qualification} onChange={() => setQualification(!qualification)}/>
                    <label className="check-box-label-default" htmlFor="CheckQualification">指導員資格</label>
                  </div>
                  <div className="form-check ml-2">
                    <input className="check-box-default" type="checkbox" name="additional" id="CheckAdditional" checked={additional} onChange={() => setAdditional(!additional)}/>
                    <label className="check-box-label-default" htmlFor="CheckAdditional">加配職員</label>
                  </div>
                  <div className="form-check ml-2">
                    <input className="check-box-default" type="checkbox" name="additional" id="CheckMedicalCare" checked={medicalCare} onChange={() => setMedicalCare(!medicalCare)}/>
                    <label className="check-box-label-default" htmlFor="CheckMedicalCare">医ケア</label>
                  </div>
                </div>
                <div className="mt-3">
                  <span>雇用形態</span>
                  <div className="form-group ml-2">
                    <span className="radio-inline">
                      <input id="a" className="form-check-input" type="radio" name="seiki" value={'1'} checked={seiki=='1'} onChange={() => setSeiki('1')}/>
                      <label htmlFor="a">正規</label>
                    </span>
                    <span className="radio-inline ml-2">
                      <input id="b" className="form-check-input" type="radio" name="seiki" value={'2'} checked={seiki=='2'} onChange={() => setSeiki('2')}/>
                      <label htmlFor="b">非正規</label>
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <span>勤務形態</span>
                  <div className="form-group ml-2">
                    <span className="radio-inline">
                      <input id="d" className="form-check-input" type="radio" name="koyou" value={'1'} checked={koyou=='1'} onChange={() => setKoyou('1')}/>
                      <label htmlFor="d">常勤</label>
                    </span>
                    <span className="radio-inline ml-2">
                      <input id="f" className="form-check-input" type="radio" name="koyou" value={'3'} checked={koyou=='3'} onChange={() => setKoyou('3')}/>
                      <label htmlFor="f">非常勤</label>
                    </span>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="HireDateInput" className="form-label">雇入れ日</label>
                  <input type="date" name="hire_date" className="input-default" id="HireDateInput" placeholder="雇入れ日" value={hire_date} required onChange={(e) => setHireDate(e.target.value)}/>
                </div>
                <div className="mb-3">
                  <label htmlFor="OrderInput" className="form-label">表示順</label>
                  <input type="number" name="order" className="input-default" id="OrderInput" placeholder="表示順" value={order} required onChange={(e) => setOrder(parseInt(e.target.value))}/>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-danger" onClick={() => setModalOpenAdd(false)}>キャンセル</button>
                <button type="submit" className="btn-primary ml-3">登録</button>
              </div>
            </div>
          </div>
        </div>
      </Form>

      {/** 指導員削除確認ダイアログ */}
      <Form onSubmit={(e) => handleDeleteSubmit(e)}>
        <div id="delete_modal" tabIndex={-1} className={(modal_open_delete ? "block" : "hidden") + " modal-back-ground"}
        onClick={(e) => {
          if((e.target as HTMLElement).id == 'delete_modal'){
            setModalOpenDelete(false)
          }
        }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">指導員削除</h5>
                <button type="button" className="close-svg" onClick={() => setModalOpenDelete(false)}>
                  <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" strokeLinecap={"round"} strokeLinejoin={"round"} strokeWidth={2} d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="mb-3">[{instructorId}:{instructorName}]を削除します。よろしいですか？</div>
                <label htmlFor="RetirementDate" className="form-label">退職日を入力してください。</label>
                <input type="date" name="retirement_date" id="RetirementDate" value={retirement_date} required className="ml-8 input-default w-40 inline" onChange={(e) => setRetirementDate(e.target.value)}/>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-gray" onClick={() => setModalOpenDelete(false)}>キャンセル</button>
                <button type="submit" className="btn-danger ml-4">削除</button>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
