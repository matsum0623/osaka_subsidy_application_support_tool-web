import {
  Form,
  ClientActionFunctionArgs,
  redirect,
  useSearchParams,
  useNavigation,
  useNavigate
} from "@remix-run/react";
import { signIn, signOut, confirmSignIn, resetPassword, confirmResetPassword } from 'aws-amplify/auth'
import { useState } from "react";
import { closeButton, Loading } from "~/components/util";
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
  const [is_reset_password_confirm, setIsResetPasswordConfirm] = useState(false)
  const [reset_confirm_username, setResetConfirmUsername] = useState('')

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

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const reset_username:string = formData.get("reset_username")?.toString() || ''
    try {
      const reset_result = await resetPassword({ username: reset_username })
      switch (reset_result.nextStep.resetPasswordStep) {
        case "CONFIRM_RESET_PASSWORD_WITH_CODE":
          alert(`パスワードリセットのためのコードを${reset_result.nextStep.codeDeliveryDetails.deliveryMedium}に送信しました。\nno-reply@verificationemail.comからのメールを確認してください。`)
          setResetConfirmUsername(reset_username)
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
                <label htmlFor="user_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">ユーザ名</label>
                <input type="text" name="username" id="user_name" className="input-default" placeholder="name@company.com" required />
              </div>
              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">パスワード</label>
                <input type="password" name="password" id="password" placeholder="••••••••" className="input-default" required />
              </div>
              <p className="text-red-500">{searchParams.has('auth_error') && "※ユーザ、またはパスワードが間違っています。"}</p>
              <div className="flex items-center justify-end">
                <a href="#" className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500" onClick={() => setIsResetPassword(true)}>パスワードリセット</a>
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
                  <input type="password" name="new_password" id="new_password" placeholder="••••••••" className="login-input" required disabled={is_confirm_submit}/>
                </div>
                <div>
                  <label htmlFor="new_password_check" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">新しいパスワード（再入力）</label>
                  <input type="password" name="new_password_check" id="new_password_check" placeholder="••••••••" className="login-input" required disabled={is_confirm_submit}/>
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
            <Form onSubmit={(e) => handleResetPassword(e)}>
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  パスワード再設定
                </h3>
                {closeButton(setIsResetPassword)}
              </div>
              <div className="modal-body">
                <div>
                  <label htmlFor="reset_username" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">ユーザ名</label>
                  <input type="text" name="reset_username" id="reset_username" placeholder="ユーザ名" className="login-input" required/>
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
    </main>
  );
}
