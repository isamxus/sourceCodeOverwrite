import { AbstractPromise } from "./AbstractLayer";
import { TResolveAndReject, TCommonFn } from "./CustomPromise";

export class CustomPromise extends AbstractPromise<CustomPromise> {
    then(resolveFn: TResolveAndReject, rejectFn: TResolveAndReject): CustomPromise {
        resolveFn = typeof resolveFn !== 'function' ? result => result : resolveFn;
        rejectFn = typeof rejectFn !== 'function' ? reason => this.reject(reason) : rejectFn;
        return new CustomPromise((resolve, reject) => {
            this.successCallbacks.push((result:any) => {
                try{
                    const res = resolveFn(result);
                    if (res instanceof CustomPromise) return res.then(resolve, reject); // 本Promise实例的状态由返回返回值的Promise决定
                    resolve(res); //返回值不是Promise直接标注为成功态
                }catch(err){
                    reject(err);
                }
            });
            this.failCallback.push((reason:any) => {
                try {
                    const res = rejectFn(reason);
                    if(res instanceof CustomPromise) return res.then(resolve, reject);
                    resolve(res);
                } catch(err){
                    reject(err);
                }
            })
        })
    }
    catch(reject: TResolveAndReject): CustomPromise {
        throw new Error("Method not implemented.");
    }
    done(resolve: TResolveAndReject, reject: TResolveAndReject): void {
        throw new Error("Method not implemented.");
    }
    finally(callback: TCommonFn): CustomPromise {
        throw new Error("Method not implemented.");
    }
    resolve(target: any): CustomPromise {
        throw new Error("Method not implemented.");
    }
    reject(target: any): CustomPromise {
        throw new Error("Method not implemented.");
    }
    all(target: any[]): CustomPromise {
        throw new Error("Method not implemented.");
    }
    race(target: any[]): CustomPromise {
        throw new Error("Method not implemented.");
    }
    allSettled(target: any[]): CustomPromise {
        throw new Error("Method not implemented.");
    }
}

const promise = new CustomPromise((resolve, reject) => {
    resolve(1);
}).then(res => {
    console.log(res, 'success');
}, err => {
    console.log(err, 'error');
})