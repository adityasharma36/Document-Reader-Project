
export interface AppError extends Error{
    statusCode:number
}

export class InternalError implements AppError{
    statusCode: number
    message: string
    name: string
    constructor(mss:string){
        this.name = "InternalError",
        this.message = mss,
        this.statusCode= 500
    }
}

export class BadRequestError implements AppError{
    statusCode: number
    message: string
    name: string
    constructor(msg:string){
        this.name = "BadRequestError",
      
        this.message = msg,
      
        this.statusCode = 400
    }
}

export class NotFoundError implements AppError{
    statusCode: number
    message: string
    name: string
    constructor(msg:string){
        this.name = "NotFoundError",
        this.message = msg
        this.statusCode = 404
    }
}

export class UnauthorizedError implements AppError{
    statusCode: number
    message: string
    name: string
    constructor(msg:string){
        this.name = "UnauthorizedError",
        this.message = msg,
        this.statusCode = 401
    }
}