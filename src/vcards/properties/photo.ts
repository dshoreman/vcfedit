import {Parameter} from "../properties.js";
import {ValueFormatter} from "./simple.js";

export default class PhotoValue implements ValueFormatter {
    formatted: string;
    original: any;

    constructor(rawValue: string, parameters: Parameter[]) {
        this.original = rawValue;
        this.formatted = this.extract(parameters);
    }

    static default() {
        return 'images/avatar.png';
    }

    extract(parameters: Parameter[]) {
        const encoding = parameters.find(p => 'ENCODING' === p.name)?.value;

        if ('BASE64' === encoding) {
            return `data:image/jpg;base64,${this.original}`;
        }

        console.warn(`Photo has unknown/unsupported encoding '${encoding}'.`);

        return PhotoValue.default();
    }
}
