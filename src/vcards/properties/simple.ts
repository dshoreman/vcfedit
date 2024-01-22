import {decodeString, encodeString} from "../encoding.js";
import {Parameter} from "../properties.js";

export interface ValueFormatter {
    components?: any;
    formatted: string;
    original: string;
    extract(parameters: Parameter[]): string;
    export(parametersLength?: number): string;
}

export class SimpleValue implements ValueFormatter {
    formatted: string;
    original: string;
    parameters: Parameter[];

    constructor(rawValue: string, parameters: Parameter[]) {
        this.original = rawValue;
        this.parameters = parameters;
        this.formatted = this.extract();
    }

    extract = () => decodeString(this.original, this.parameters);
    export = () => encodeString(this.formatted, this.parameters);
}
