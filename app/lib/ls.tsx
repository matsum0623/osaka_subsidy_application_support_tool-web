export function setLs(key:string, value:string) {
    window.localStorage.setItem(key, value);
}

export function getLs(key:string) {
    return window.localStorage.getItem(key);
}

