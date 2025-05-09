import { Form, Link } from '@remix-run/react';
import { confirmResetPassword, resetPassword } from 'aws-amplify/auth';
import { useState } from 'react';
import { getLs } from '~/lib/ls';
import { closeButton } from './util';

export function Header(user_data:any) {
  return (
    <div className="container sticky top-0 bg-white">
      <header className="bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-2 sm:p-6 sm:px-8" aria-label="Global">
          <div className="flex sm:flex-1">
            <span className="hidden sm:block text-2xl">月次報告作成サイト</span>
          </div>
          <div className='flex gap-9'>
            <div className="flex sm:gap-x-12">
              <Link to="/monthly" className="text-sm sm:text-xl font-semibold leading-6 text-gray-900 underline">月次報告</Link>
              {
                user_data.admin &&
                <Link to="/admin" className="hidden sm:flex text-sm sm:text-xl font-semibold leading-6 text-gray-900 underline">管理画面</Link>
              }
              {
                !user_data.admin &&
                <Link to="/after_school_settings" className="hidden sm:flex text-sm sm:text-xl font-semibold leading-6 text-gray-900 underline">学童設定</Link>
              }
            </div>
            <div className="flex sm:flex-1 sm:justify-end">
              <Link to="/logout" className="text-sm sm:text-xl font-semibold leading-6 text-gray-900">ログアウト<span aria-hidden="true">&rarr;</span></Link>
            </div>
          </div>
        </nav>
      </header>
    </div>
  );
}

export function AccountHeader() {
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

  return (
    <div className="flex sm:flex-1 sm:justify-end">
      <button type="button" className="text-sm sm:text-xl font-semibold leading-6 text-gray-900" onClick={() => setOpenAccount(!open_account)}>アカウント</button>
      <div className="absolute bg-white border-2 border-gray-300 top-11 px-3 py-2" hidden={!open_account}>
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
  )
}