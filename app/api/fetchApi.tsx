export abstract class CustomBaseError extends Error {
    private errorCode:number;
    private moduleError: Error | undefined;

    constructor(errorCode:number, message:string, e?: Error) {
        super(); //this.messageはここではいれないが、super()は必須なので空で初期化
        this.errorCode = errorCode;
        this.moduleError = e;
        this.message = message;
        this.describeMessage();
    }

    // アプリケーションのエラー仕様に合わせて出力形式を整える
    // logger使って構造化ログ(json)で出力するのが本当はオススメ
    // そこらへんの形式などもここで統一化し、各エラークラスで共通化する
    private describeMessage(){
        const errorCode = this.errorCode;
        const errorType = this.constructor.name;
        const errorCategory = this.moduleError ? 'ModuleError' : 'ApplicationError';
        const moduleErrorMessage =  this.moduleError ? this.moduleError.message : '';
        const errorMessage =  this.message;

        console.error(
            `ErrorCode: ${errorCode}\n` +
            `ErrorType: ${errorType}\n` +
            `ErrorCategory: ${errorCategory}\n` +
            `ModuleErrorMessage: ${moduleErrorMessage}\n` +
            `ErrorMessage: ${errorMessage}\n`
        )
    }
}

export class NotFoundError extends CustomBaseError{
    constructor(message:string, e?: Error){
        super(400, message, e)
    }
}

export async function fetchApi(path:string, opt:object) {
    return await fetch(import.meta.env.VITE_REST_API + path, opt)
    .then(response => {
        if(response.status == 200){
            return response.json().then(j => j.data)
        }else {
            throw new NotFoundError('Data Not Found.')
        }
    }).catch(
        error => {throw error}
    )
}

export async function getData(path:string, idToken:string) {
    return await fetchApi(path, {
        method: "GET",
        headers: new Headers({'Authorization': idToken}),
    })
}

export async function postData(path:string, postData:object, idToken:string) {
    return await fetchApi(path, {
        method: "POST",
        headers: new Headers({'Authorization': idToken}),
        body: JSON.stringify(postData),
    })
}

export async function putData(path:string, postData:object, idToken:string) {
    return await fetchApi(path, {
        method: "PUT",
        headers: new Headers({'Authorization': idToken}),
        body: JSON.stringify(postData),
    })
}

export async function deleteData(path:string, postData:object, idToken:string) {
    return await fetchApi(path, {
        method: "DELETE",
        headers: new Headers({'Authorization': idToken}),
        body: JSON.stringify(postData),
    })
}