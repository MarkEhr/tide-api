
import { APP_LOADING_START, APP_LOADING_END} from "./types";

export function startLoading(){
    return { type: APP_LOADING_START }
}

export function endLoading(){
    return { type: APP_LOADING_END }
}