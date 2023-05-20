import { TCommonFn, TExecutor, TResolveAndReject } from "./CustomPromise";

const enum PromiseStatus {
    PENDING = 'pending',
    FULFILLED = 'fulfilled',
    REJECTED = 'rejected'
}

export abstract class AbstractPromise<T> {
    public value:any;
    protected status:PromiseStatus = PromiseStatus.PENDING;
    protected successCallbacks:Array<any> = []; // then方法中的第一个回调集合(成功)
    protected failCallbacks:Array<any> = []; // then方法中的第二个回调集合(失败)
    protected resolveFn = (result:any) => { 
        setTimeout(() => { //确保构造函数executor异步改变状态，如果不用setTimeout，executor中同步改变状态会导致回调数组一直为空
            if(this.status !== PromiseStatus.PENDING) return;
            this.status = PromiseStatus.FULFILLED;
            this.value = result;
            this.handleCallback(this.successCallbacks);
        })
    }
    protected rejectFn = (reason:any) => {
        setTimeout(() => { 
            if(this.status !== PromiseStatus.PENDING) return;
            this.status = PromiseStatus.REJECTED;
            this.value = reason;
            this.handleCallback(this.failCallbacks);
        })
    }
    constructor(executor:TExecutor){
        try {
            executor(this.resolveFn, this.rejectFn);
        } catch(err) {
            this.rejectFn(err);
        }
    }
    handleCallback(callbacks:Array<any>){
        callbacks.forEach(callback => {
            if(typeof callback !== 'function') return;
            callback(this.value);
        })
    }
    abstract then(resolve:TResolveAndReject,reject:TResolveAndReject):T;
    abstract catch(reject:TResolveAndReject):T;
    abstract done():void;
    abstract finally(callback:TCommonFn):T;
    abstract resolve(target:any):T;
    abstract reject(target:any):T;
    abstract all(target:Array<any>):T;
    abstract race(target:Array<any>):T;
    abstract allSettled(target:Array<any>):T;
}