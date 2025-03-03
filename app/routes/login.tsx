import {
  Form,
  ClientActionFunctionArgs,
  redirect,
  useSearchParams,
  useNavigation,
  useNavigate
} from "@remix-run/react";
import { signIn, signOut, confirmSignIn } from 'aws-amplify/auth'
import { useState } from "react";
import { Loading } from "~/components/util";
import { setLs } from "~/lib/ls";

export const clientLoader = async () => {
  // この画面にくる場合はサインアウトさせる
  await signOut({ global: true })
  return []
};

export const clientAction = async({
  request,
}: ClientActionFunctionArgs) => {
  const formData = await request.formData()
  const sign_in_res = await signIn({
    username: formData.get("username")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  }).then((res)=>{
    return res
  }).catch((e) => {
    return {
      nextStep: {
        signInStep: "ERROR"
      }
    }
  })
  if(sign_in_res.nextStep.signInStep === "DONE"){
    setLs('user_id', formData.get("username")?.toString() || '')
    return redirect(`/`,);
  }else if(sign_in_res.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED"){
    // 新しいパスワードを設定する画面に遷移
    setLs('user_id', formData.get("username")?.toString() || '')
    return redirect(`/login?confirm_new_password`)
  }else{
    return redirect(`/login?auth_error`)
  }
}

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate()

  const [is_invalid, setIsInvalid] = useState(false)
  const [is_confirm_submit, setIsConfirmSubmit] = useState(false)
  const [is_reset_password, setIsResetPassword] = useState(false)

  const commitNewPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsConfirmSubmit(true)
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const new_password:string = formData.get("new_password")?.toString() || ''
    const new_password_check:string = formData.get("new_password_check")?.toString() || ''
    if(new_password !== new_password_check){
      alert('パスワードが一致しません。')
      return
    }
    const confirm_sign_in_res = await confirmSignIn({
      challengeResponse: new_password,
      options: {
        ChallengeName: "NEW_PASSWORD_REQUIRED",
      },
    }).then((res) => {
      return res
    }).catch((e) => {
      const next = e.message.includes('does not conform to policy') ? 'invalid': 'ERROR'
      return {
        nextStep: {
          signInStep: next
        }
      }
    })
    if(confirm_sign_in_res.nextStep.signInStep === "DONE"){
      return navigate(`/monthly`,);
    }else if(confirm_sign_in_res.nextStep.signInStep == 'invalid'){
      setIsInvalid(true)
    }else{
      alert('予期せぬエラーが発生しました。')
      setIsInvalid(false)
      navigate(`/login`)
    }
    setIsConfirmSubmit(false)
  }

  const resetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log('reset')
    console.log(e)
  }

  return (
    <main className="w-100 m-auto">
      {Loading(useNavigation())}
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto mt-8 lg:py-0">
        <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-lg xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
              ログイン
            </h1>
            <Form className="space-y-4 md:space-y-6" method="POST">
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">ユーザ名</label>
                <input type="text" name="username" id="email" className="input-default" placeholder="name@company.com" required />
              </div>
              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">パスワード</label>
                <input type="password" name="password" id="password" placeholder="••••••••" className="input-default" required />
              </div>
              <p className="text-red-500">{searchParams.has('auth_error') && "※ユーザ、またはパスワードが間違っています。"}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-start">
                  {/*<div className="flex items-center h-5">
                    <input id="remember" aria-describedby="remember" type="checkbox" className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800" required />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="remember" className="text-gray-500 dark:text-gray-300">Remember me</label>
                  </div>*/}
                </div>
                {/*<a href="#" className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500" onClick={() => setIsResetPassword(true)}>パスワードを忘れましたか?</a>*/}
              </div>
              <button type="submit" className="w-full text-white bg-blue-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">ログイン</button>
            </Form>
          </div>
        </div>
      </div>

      {/** パスワード変更ダイアログ */}
      <div id="edit-modal" tabIndex={-1}
        className={(searchParams.has('confirm_new_password') ? "block" : "hidden") + " modal-back-ground"}>
        <div className="modal-dialog">
          <div className="modal-content">
            <Form onSubmit={(e) => commitNewPassword(e)}>
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  パスワードを更新してください
                </h3>
              </div>
              <div className="modal-body">
                <div>
                  <label htmlFor="new_password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">新しいパスワード</label>
                  <input type="password" name="new_password" id="new_password" placeholder="••••••••" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required disabled={is_confirm_submit}/>
                </div>
                <div>
                  <label htmlFor="new_password_check" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">新しいパスワード（再入力）</label>
                  <input type="password" name="new_password_check" id="new_password_check" placeholder="••••••••" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required disabled={is_confirm_submit}/>
                </div>
                {is_invalid &&
                  <p className="text-red-500">
                    ※パスワードポリシーを満たしていません。<br/>
                      ・最小 8 文字<br/>
                      ・少なくとも 1 つの数字を含む<br/>
                      ・少なくとも 1 つの小文字を含む<br/>
                      ・少なくとも 1 つの大文字を含む<br/>
                      ・少なくとも 1 つの特殊文字を含む<br/>
                  </p>
                }

              </div>
              <div className="modal-footer">
                <button type="button" className="btn-danger w-28" onClick={() => setSearchParams('')}>キャンセル</button>
                <button type="submit" className="ms-3 btn-primary w-28">登録</button>
              </div>
            </Form>
          </div>
        </div>
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
            <Form onSubmit={(e) => resetPassword(e)}>
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  パスワードをリセット
                </h3>
                <button type="button" className="btn-close" onClick={() => setIsResetPassword(false)}>
                  <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" strokeLinecap={"round"} strokeLinejoin={"round"} strokeWidth={2} d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
              </div>
              <div className="modal-body">
                <div>
                  <label htmlFor="reset_email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">登録メールアドレス</label>
                  <input type="email" name="reset_email" id="reset_email" placeholder="sample@email.com" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required disabled={is_confirm_submit}/>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-danger w-28" onClick={() => setIsResetPassword(false)}>キャンセル</button>
                <button type="submit" className="ms-3 btn-primary w-28">登録</button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </main>
  );
}
