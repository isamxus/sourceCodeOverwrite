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
                console.log(res, 'fwefwe');
            })
```
