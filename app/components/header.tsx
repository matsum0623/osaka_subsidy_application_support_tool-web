import { Link } from '@remix-run/react';

export function Header(user_data:any) {
  return (
    <div className="container sticky top-0 bg-white">
      <header className="bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-2 sm:p-6 sm:px-8" aria-label="Global">
          <div className="flex sm:flex-1">
            <Link to="/" className="-m-1.5 p-1.5">
              <span className="sr-only">月次報告作成サイト</span>
              <img className="h-8 w-auto" src="https://tailwindui.com/plus/img/logos/mark.svg?color=indigo&shade=600" alt=""/>
              </Link>
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