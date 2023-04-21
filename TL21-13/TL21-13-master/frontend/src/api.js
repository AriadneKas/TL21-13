import axios from "axios";
import config, { apiUrl } from "./config";

axios.defaults.baseURL = config.apiUrl;

export const passesCost = wholeUrl => {
    const requestUrl = apiUrl + "/PassesCost/" + wholeUrl;
    return axios.get(requestUrl)
};