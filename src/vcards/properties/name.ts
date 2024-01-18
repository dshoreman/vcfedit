import {decodeQuotedPrintable} from "../encoding.js";
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
        this.formatted = this.extract(parameters.find(p => 'ENCODING' === p.name)?.value);
    }

    extract(encoding?: string) {
        const [_, familyNames, givenNames, otherNames, prefixes, suffixes] =
            <[string, string, string, string, string, string]>
            this.original.match(/(.*)?;(.*)?;(.*)?;(.*)?;(.*)?/);

        this.components = {prefixes, givenNames, otherNames, familyNames, suffixes};

        if ('QUOTED-PRINTABLE' === encoding) {
            for (const [key, value] of Object.entries(this.components)) {
                Object.assign(this.components, {[key]: decodeQuotedPrintable(value)});
            }
        }

        return Object.values(this.components).filter(v => v).join(' ');
    }
}
