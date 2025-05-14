import {
  useLoaderData,
  redirect,
  useNavigate,
  Form,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { getData, postData, putData, deleteData } from "~/api/fetchApi";
import { getLs } from "~/lib/ls";
import { Loading  } from "~/components/util";
import { RightHeader } from "~/components/header";

export const clientLoader = async () => {
  const idToken = getLs('idToken') || ''
  const user_id = getLs('user_id') || ''
  const user_data = JSON.parse(getLs('user_data') || '{}')
  const data = JSON.parse(getLs('user_data') || '{}')
  data.idToken = idToken
  data.user_id = user_id
  data.user_data = user_data
  return data
};

export default function Index() {
  const data = useLoaderData<typeof clientLoader>()
  if (!data.idToken){
    redirect("/");
  }

  const navigate = useNavigate()

  const [modal_type, setModalType] = useState('add')
  const [user_id, setUserId] = useState('')
  const [user_name, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [after_schools, setAfterSchools] = useState([''])
  const [admin_flag, setAdminFlag] = useState(false)
  const [modal_open, setModalOpen] = useState(false)
  const [is_loading, setIsLoading] = useState(false)

  const [after_schools_list, setAfterSchoolsList] = useState([])
  const [user_list, setUserList] = useState([])

  const openModal = (
    modal_type:string = 'add',
    user_id:string = '',
    user_name:string = '',
    email:string = '',
    after_schools:string[] = [],
    admin_flag:boolean = false,
  ) => {
    setModalOpen(true)
    setModalType(modal_type)
    setUserId(user_id)
    setUserName(user_name)
    setEmail(email)
    setAfterSchools(after_schools)
    setAdminFlag(admin_flag)
  }

  const changeAfterSchools = (e:any) => {
    if(e.target.checked){
      setAfterSchools([...after_schools, e.target.value])
    }else{
      setAfterSchools(after_schools.filter((school_id, index) => (school_id !== e.target.value)))
    }
  }

  const handleSubmit = async (e:any) => {
    setIsLoading(true)
    e.preventDefault()
    const post_data = {
      user_id: user_id,
      user_name: user_name,
      email: email,
      after_schools: after_schools,
      admin_flag: admin_flag,
    }
    // TODO:モーダルを無理やり閉じてる
    document.getElementById('add_modal_cancel')?.click()
    if(modal_type == 'add'){
      // 追加
      const response = await postData(`/user`, post_data, data.idToken)
    }else{
      // 更新
      const response = await putData(`/user/${user_id}`, post_data, data.idToken)
    }
    const users = await getData("/users", data.idToken)
    setUserList(users.list)
    setIsLoading(false)
    navigate('./')
  }

  const DeleteUser = async (user_id:string) => {
    setIsLoading(true)
    const response = await deleteData(`/user/${user_id}`, {}, data.idToken)
    const users = await getData("/users", data.idToken)
    setUserList(users.list)
    setIsLoading(false)
  }

  const search_data = async () => {
    setIsLoading(true)
    const after_school_data = await getData("/after_school", data.idToken)
    const user_data = await getData("/users", data.idToken)
    setAfterSchoolsList(after_school_data.list)
    setUserList(user_data.list)
    setIsLoading(false)
  }

  useEffect(() => {
    search_data()
  }, [])

  return (
    <div>
      {is_loading && Loading()}
      <div className="flex justify-between">
        <div className="flex gap-24 py-2">
          <div className="p-1">
            <p className="text-2xl font-bold">学童一覧</p>
          </div>
          <div className="">
            <button className="btn btn-primary h-full" onClick={() => navigate(`./after_school/new`)}>学童追加</button>
          </div>
        </div>
        {RightHeader(data.user_id, data.user_data, )}
      </div>
      <table className="table table-bordered text-center mt-3 w-full">
        <thead>
          <tr>
            <td>学童ID</td>
            <td>学童名</td>
            <td>児童数</td>
            <td>指導員数</td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          {after_schools_list.map((afs:any) => (
            <tr key={afs.school_id}>
              <td className="align-middle">{afs.school_id}</td>
              <td className="align-middle">{afs.school_name}</td>
              <td className="align-middle">{afs.child_count}</td>
              <td className="align-middle">{afs.instructor_count}</td>
              <td><button className="btn btn-primary" onClick={() => navigate(`./after_school/${afs.school_id}`)}>編集</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-24 mt-2">
        <div className="">
          <p className="text-2xl font-bold">ユーザ一覧</p>
        </div>
        <div className="">
          <button type="button" className="btn btn-primary" onClick={() => openModal()}>ユーザ追加</button>
        </div>
      </div>
      <table className="table table-bordered text-center mt-3 w-full">
        <thead>
          <tr>
            <td>ユーザID</td>
            <td>ユーザ名</td>
            <td>メールアドレス</td>
            <td>管理学童数</td>
            {data.user_data.admin && <td>管理者</td>}
            <td colSpan={2}></td>
          </tr>
        </thead>
        <tbody>
          {user_list.map((user:any) => (
            <tr key={user.user_id}>
              <td className="col-sm-4 align-middle">{user.user_id}</td>
              <td className="col-sm-4 align-middle">{user.user_name}</td>
              <td className="col-sm-4 align-middle">{user.email}</td>
              <td className="col-sm-1 align-middle">{user.after_schools.length}</td>
              {data.user_data.admin &&
                <td>{user.admin && '〇'}</td>
              }
              <td className="col-sm-1">
                <button className="btn btn-primary" onClick={() => openModal('edit', user.user_id, user.user_name, user.email, user.after_schools, user.admin)}>編集</button>
              </td>
              <td className="col-sm-1">{(data.user_id != user.user_id) && <button className="btn btn-danger" onClick={() => DeleteUser(user.user_id)}>削除</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/** ユーザ追加・編集ダイアログ */}
      <div id="edit-modal" tabIndex={-1}
        className={(modal_open ? "block" : "hidden") + " modal-back-ground"}
        onClick={(e) => {
          if((e.target as HTMLElement).id == 'edit-modal'){
            setModalOpen(false)
          }
        }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <Form onSubmit={(e) => handleSubmit(e)}>
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  ユーザ{modal_type == 'add' ? '追加' : '編集'}
                </h3>
                <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={() => setModalOpen(false)}>
                  <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" strokeLinecap={"round"} strokeLinejoin={"round"} strokeWidth={2} d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="UserIdInput" className="form-label">ユーザID</label>
                  <input type="text" name="user_id" className="input-default" id="UserIdInput" placeholder="ユーザID" required value={user_id} onChange={(e) => setUserId(e.target.value)} disabled={modal_type == 'edit'}/>
                </div>
                <div className="mb-3">
                  <label htmlFor="UserNameInput" className="form-label">ユーザ名</label>
                  <input type="text" name="user_name" className="input-default" id="UserNameInput" placeholder="ユーザ名" required value={user_name} onChange={(e) => setUserName(e.target.value)}/>
                </div>
                <div className="mb-3">
                  <label htmlFor="EmailInput" className="form-label">メールアドレス</label>
                  <input type="email" name="email" className="input-default" id="EmailInput" placeholder="メールアドレス" required value={email} onChange={(e) => setEmail(e.target.value)}/>
                </div>
                <div className="mb-3">
                  <label htmlFor="AfterSchoolSelect" className="form-label">管理学童</label>
                  <div id="AfterSchoolSelect">
                    {after_schools_list.map((afs:any) => (
                      <div className="flex items-center mb-4 ml-2" key={afs.school_id}>
                        <input className="check-box-default" type="checkbox" name={`after_school_check_${afs.school_id}`} value={afs.school_id} id={`check_${afs.school_id}`} checked={after_schools.includes(afs.school_id)} onChange={(e) => changeAfterSchools(e)}/>
                        <label className="check-box-label-default" htmlFor={`check_${afs.school_id}`}>{`${afs.school_id}:${afs.school_name}`}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="Admin" className="form-label">管理者</label>
                  <input type="checkbox" name="admin_flag" id="Admin" className="ml-2" checked={admin_flag} onChange={(e) => setAdminFlag(e.target.checked)}/>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-danger w-28" onClick={() => setModalOpen(false)}>キャンセル</button>
                <button type="submit" className="ms-3 btn-primary w-28" onClick={() => setModalOpen(false)}>登録</button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
