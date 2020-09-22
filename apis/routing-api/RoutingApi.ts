import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { Profiles } from "./Profiles";

export class RoutingApi {
    url: string;
    key: string;

    constructor(url: string, key?: string) {
        this.url = url;
        this.key = key;
    }

    getProfiles(callback: (profiles: string[]) => void) {        
        var requestConfig: AxiosRequestConfig = {
            baseURL: this.url,
            url: "/profiles",
            params: {
                apiKey: this.key
            }
        };

        axios(requestConfig).then(response => {
            var parse = <Profiles>response.data;
            callback(parse.supportedProfiles);
        }).catch(reason => {
            console.log("getProfiles failed: " + reason);
        }); 
    }
}