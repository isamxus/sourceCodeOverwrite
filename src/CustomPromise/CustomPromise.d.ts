export type TResolveAndReject = (result:any) => any;
export type TCommonFn = () => any;
export type TExecutor = (resolve:TResolveAndReject,reject:TResolveAndReject) => any;