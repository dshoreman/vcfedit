import {decodeComponents} from "../encoding.js";
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
        this.formatted = this.extract(parameters);
    }

    extract(parameters: Parameter[]) {
        const [_, poBox, suite, street, locality, region, postCode, country] =
            <[string, string, string, string, string, string, string, string]>
                this.original.match(/(.*);(.*);(.*);(.*);(.*);(.*);(.*)/);

        this.components = decodeComponents({
            poBox, suite, street, locality, region, postCode, country
        }, parameters);

        return Object.values(this.components).filter(v => v).join(', ');
    }
}
