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

    constructor(rawValue: string) {
        this.original = rawValue;
        this.formatted = this.extract();
    }

    extract = () => this.original;
    export = () => this.original;
}
