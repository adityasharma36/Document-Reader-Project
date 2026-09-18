
import dotenv from 'dotenv'

function configLoad(){
    dotenv.config();
}

configLoad();



type serverConfigType = {
    PORT:number
}

export const serverConfig:serverConfigType = {
    PORT:Number(process.env.PORT) || 3000
}