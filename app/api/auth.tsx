import {fetchAuthSession} from 'aws-amplify/auth'

export async function getIdToken() {
    const session = await fetchAuthSession()
    return session?.tokens?.idToken?.toString()
}