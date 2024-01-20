import {decodeComponents} from "../encoding.js";
import {Parameter} from "../properties.js";
import {ValueFormatter} from "./simple.js";

export default class NameValue implements ValueFormatter {
    components: {
        prefixes: string,
        givenNames: string,
        otherNames: string,
        familyNames: string,
        suffixes: string,
    }|undefined;
    formatted: string;
    original: any;

    constructor(rawValue: string, parameters: Parameter[]) {
        this.original = rawValue;
        this.formatted = this.extract(parameters);
    }

    extract(parameters: Parameter[]) {
        const [_, familyNames, givenNames, otherNames, prefixes, suffixes] =
            <[string, string, string, string, string, string]>
            this.original.match(/(.*);(.*);(.*);(.*);(.*)/);

        this.components = decodeComponents({
            prefixes, givenNames, otherNames, familyNames, suffixes
        }, parameters);

        return Object.values(this.components).filter(v => v).join(' ');
    }

    export() {
        if (!this.components) {
            throw new Error("Contact is missing name components for conversion.");
        }

        const c = this.components,
            values = [c.familyNames, c.givenNames, c.otherNames, c.prefixes, c.suffixes];

        return values.join(';');
    }
}
