import {Parameter} from "../properties.js";
import {ValueFormatter} from "./simple.js";

export default class PhotoValue implements ValueFormatter {
    folded: string;
    formatted: string;
    original: string;

    constructor(rawValue: string, parameters: Parameter[], folded?: string) {
        this.original = rawValue;
        this.folded = folded || rawValue;
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

    export(parametersLength: number) {
        const findAfter = this.folded.search(/^PHOTO(;(.*))?:/m),
            foldedAt = this.folded.indexOf('\r\n ', findAfter),
            foldLength = foldedAt - findAfter;

        return this.original
            .padStart(this.original.length + parametersLength, '-')
            .replace(new RegExp(`(?<=.{1,${foldLength}})(.{1,${foldLength-1}})`, 'g'), '$1\r\n ')
            .replace(new RegExp(`^-{${parametersLength}}`), '')
            .trim() + '\r\n';
    }
}
