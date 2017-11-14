import { Observable } from 'rxjs/Observable';
import { IRethinkResponse, IRethinkDBAPIConfig, IAuthStrategies } from './interfaces';

export class RethinkDbAuthStrategies {

    private API_URL: string;
    constructor(private confParams: IRethinkDBAPIConfig){
        this.API_URL = (!!confParams.host ? confParams.host : '') + (!!confParams.port ? ':' + confParams.port : '' );
    }
    
    /**
     * 
     * @param user 
     * @returns Observable os RethinkDB response
     */
    createUser(user: Object): Observable<IRethinkResponse> {
        return Observable.fromPromise(
            fetch(this.API_URL + '/api/createUser', {
                method: 'POST',
                body: JSON.stringify([this.confParams, user]),
                headers: new Headers({
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                })
            })
        )
        .switchMap(response => 
            Observable.fromPromise(response.json())
                .flatMap(json => response.status >= 400 ? Observable.throw(json) : Observable.of(json))
                .map(json => json as IRethinkResponse)
        )
    }

    /**
     * @description Function to authenticate users and user sessionStorage
     * @param user 
     * @param password 
     * @returns true or false
     */
    authenticate(user: string, password: string): Observable<boolean> {
        return Observable.fromPromise(
            fetch(this.API_URL + '/api/authUser', {
                method: 'POST',
                body: JSON.stringify([this.confParams, {user: user, password: password}]),
                headers: new Headers({
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                })
            })
        )
        .switchMap(response => {              
            return Observable.fromPromise(response.json())
                .flatMap(json => response.status >= 400 ? Observable.throw(json) : Observable.of(json))
                .map((json: {token: string, err?: string}) => {
                    if (!!json.token){
                        sessionStorage.setItem('__token__', json.token)
                        sessionStorage.setItem('__user__', user)
                        return !!json.token
                    }
                    return !!json.token;
                })
        })
    }

    /**
     * @description Function to authenticate users using FB and user sessionStorage
     * @returns Observable boolean
     */
    authWithFacebook(): Observable<boolean> {
        return Observable.of(true);
    }

    /**
     * @description Function to authenticate users using Google and user sessionStorage
     * @returns Observable boolean
     */
    authWithGoogle(): Observable<boolean>  {
        return Observable.of(true);
    }

    isAuthenticated(): Observable<boolean>  {
        return Observable.fromPromise(
            fetch(this.API_URL + '/api/isAuth', {
                method: 'POST',
                body: JSON.stringify([this.confParams, sessionStorage.getItem('__token__')]),
                headers: new Headers({
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                })
            })
        )
        .switchMap(response => {
            return Observable.fromPromise(response.json())
                .flatMap(json => response.status >= 400 ? Observable.throw(json) : Observable.of(json))
                .map((json: {msj: string, err?: string}) => {
                    return !!json.msj;
                })
            }               
        )
    }

    /**
     * @description
     * @returns Observable boolean
     */
    logout(): Observable<boolean> {
        sessionStorage.removeItem('__token__');
        sessionStorage.removeItem('__user__');
        return Observable.of(true);
    }
}