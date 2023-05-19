import { GeneratorFn } from "./CustomAsync";


class CustomAsync {
    constructor(private generatorFn:GeneratorFn){}
    public async():Promise<any>{
        return new Promise((resolve, reject) => {
            const gen = this.generatorFn();
            const execute = (value?:any) => {
                try {
                    const result = gen.next(value);
                    if (result.done) return resolve(result.value);
                    Promise.resolve(result.value).then(res => {
                        execute(res);
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
}

function *generator():Generator{
    const result1 = yield 1;
    const result2 = yield 2;
}
const promise = new CustomAsync(generator).async();

promise.then(res => {
    console.log(res, '结果');
})



