import {decodeQuotedPrintable} from "../encoding.js";
import {Parameter} from "../properties.js";
import {ValueFormatter} from "./simple.js";

export default class AddressValue implements ValueFormatter {
    components: {
        poBox: string,
        suite: string,
        street: string,
        locality: string,
        region: string,
        postCode: string,
        country: string,
    }|undefined;
    formatted: string;
    original: any;

    constructor(rawValue: string, parameters: Parameter[]) {
        this.original = rawValue;
        this.formatted = this.extract(parameters.find(p => 'ENCODING' === p.name)?.value);
    }

    extract(encoding?: string) {
        const [_, poBox, suite, street, locality, region, postCode, country] =
            <[string, string, string, string, string, string, string, string]>
                this.original.match(/(.*)?;(.*)?;(.*)?;(.*)?;(.*)?;(.*)?;(.*)?/);

        this.components = {poBox, suite, street, locality, region, postCode, country};

        if ('QUOTED-PRINTABLE' === encoding) {
            for (const [key, value] of Object.entries(this.components)) {
                Object.assign(this.components, {[key]: decodeQuotedPrintable(value)});
            }
        }

        return Object.values(this.components).filter(v => v).join(', ');
    }
}
