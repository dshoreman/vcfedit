import AddressValue from "./properties/address.js";
import NameValue from "./properties/name.js";
import PhotoValue from "./properties/photo.js";
import {SimpleValue, ValueFormatter} from "./properties/simple.js";

export enum Property {
    begin = 'BEGIN', end = 'END', version = 'VERSION',
    name = 'N', photo = 'PHOTO',
    address = 'ADR',
    phone = 'TEL', email = 'EMAIL',
    orgTitle = 'TITLE', orgName = 'ORG',
};

export type Parameter = {
    name: string,
    value: string,
};

export function parameterParser(parameter: string) {
    let [name, value] = <[string, string]>parameter.split('=', 2);

    if (!value && 'PREF' !== name) {
        [name, value] = [value, name];
    }

    return {name, value};
}

export class VCardProperty {
    name: Property;
    components?: string[];
    parameters: Parameter[];
    value: ValueFormatter;

    constructor(line: string) {
        const [propString, value] = <[string, string]>line.split(/:(.*)/),
            [property, ...rawParams] = <[Property, ...[string]]>propString.split(';');

        if (!Object.values(Property).includes(property)) {
            throw new Error(`Unhandled VCF line: '${line}'`);
        }

        this.name = property;
        this.parameters = rawParams.map(parameterParser);

        switch (property) {
            case 'N': this.value = new NameValue(value, this.parameters); break;
            case 'ADR': this.value = new AddressValue(value, this.parameters); break;
            case 'PHOTO': this.value = new PhotoValue(value, this.parameters); break;
            default: this.value = new SimpleValue(value);
        }
    }
}
