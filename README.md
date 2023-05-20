# 使用Typescript面向对象编程手撕ES6新特性源码
> ## 一、实现async/await特性
>> ### 实现思路
>>> * 封装一个CustomAsync类，构造函数参数接收一个Generator函数作为私有属性，类中实现async方法，async方法返回Promise实例。  
```typescript
            class CustomAsync {
                constructor(private generatorFn:GeneratorFn){}
                public async():Promise<any>{
                    /** ... */
                }
            }
```
>>> * 当创建CustomAsync实例，调用async方法后，返回一个Promise，Promise回调函数中，Generator函数执行，得到一个迭代器对象。  
```typescript
            function *generator():Generator{
                const test1 = yield 1;
                const test2 = yield 2;
            }
            const promise = new CustomAsync(generator).async()
```
>>> * 接下来调用迭代器对象的next方法得到结果，当done为false时，使用Promise.resolve等待异步/同步操作执行完成后，调用then方法，将异步/同步操作的结果伴随下一次next执行传入到Generator函数中，直到调用next方法返回的done为true时，通过resolve抛出。  
```typescript
            public async():Promise<any>{
                return new Promise((resolve, reject) => {
                    const gen = this.generatorFn(); // 获取迭代器的对象
                    const execute = (value?:any) => { //excute辅助函数处理每次next调用逻辑
                        try {
                            const result = gen.next(value); //将上一次调用next接收的结果，作为上一Generator函数yield的返回值，相当于语法糖await的返回值
                            if (result.done) return resolve(result.value);
                            Promise.resolve(result.value).then(res => {
                                execute(res); //等等异步/同步结果处理完成，将该结果传入下一次调用逻辑
                            }).catch(err => {
                                gen.throw(err);
                            })
                        } catch(err){
                            reject(err);
                        }
                    }
                    execute();
                })
            }
```
>>> * 此时async方法返回的Promise实例状态改变，可以通过then方法获取到resolve的值。  
```typescript
            promise.then(res => {
                console.log(res, '结果');
            })
```

> ## 二、实现Promise
>> ### 实现思路
>>> * 按照面向抽象编程的思路，先定义好AbstractPromise抽象类，类中抽象then,catch,done,finally, resolve,reject,all,allSettled,race,any方法，交给子类实现，有些方法在原生Promise中是以静态方法的形式存在的，这里为了体现抽象的概念，把这些方法都归纳为实例方法。
>>> * Promise类的状态枚举有Pending(等待中)，Fulfilled(成功)，Rejected(失败)，抽象类中控制状态改变的两个函数resolveFn和rejectFn分别改变Promise为成功态和失败态。
>>> * 类中抽象方法的定义与原生Promise的方法大致相同，下面是抽象类的完整代码，接口声明部分可自行到源码中查看。  
```typescript
            const enum PromiseStatus {
                PENDING = 'pending',
                FULFILLED = 'fulfilled',
                REJECTED = 'rejected'
            }

            export abstract class AbstractPromise<T> {
                public value:any;
                protected status:PromiseStatus = PromiseStatus.PENDING;
                protected successCallbacks:Array<any> = []; // then方法中的第一个回调集合(成功)
                protected failCallback:Array<any> = []; // then方法中的第二个回调集合(失败)
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
                        if(this.status !== PromiseStatus.REJECTED) return;
                        this.status = PromiseStatus.REJECTED;
                        this.value = reason;
                        this.handleCallback(this.failCallback);
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
                abstract done(resolve:TResolveAndReject, reject:TResolveAndReject):void;
                abstract finally(callback:TCommonFn):T;
                abstract resolve(target:any):T;
                abstract reject(target:any):T;
                abstract all(target:Array<any>):T;
                abstract race(target:Array<any>):T;
                abstract allSettled(target:Array<any>):T;
            }
```
>>> * 接下来就是继承抽象类，实现子类CustomPromise的逻辑，首先实现then方法，该方法有两个参数，分别是Promise实例状态为成功和失败的回调函数。
>>> * 参考原生Promise逻辑，当我们通过new Promise传入一个回调函数executor时，executor会立即执行，并通过内置的resolve和reject方法改变Promise实例的状态，Promise实例维护两个数组successCallbacks，failCallback，then方法执行，传入then方法的两个回调维护到上述两个数组中。
>>> * 由于Promise实例的状态是延时改变的，可以理解为resolve，reject的执行是异步的，而then方法传入回调时是同步的，这就达到了then方法的目的了，就是等待Promise实例状态改变后执行then方法传入的回调
>>> * 传入then方法的两个回调函数都经过了封装，当Promise实例状态改变后，如果是成功态，则执行成功回调，否则执行失败回调，因为then方法本身又会返回一个新的Promise实例，而这个实例的状态改变有两种情况，跟回调函数的返回值有关：
>>>> * 当成功/失败回调函数的返回值不为Promise实例时，直接通过resolve/reject方法改变then方法返回的Promise实例的状态。
>>>> * 当成功/失败回调函数的返回值为Promise实例(记作P2)，then方法返回的Promise实例(记作P1)的状态由P2的状态决定，P2成功则P1成功，P2失败则P1失败。
>>> * then方法完整实现如下：
```typescript
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
```

