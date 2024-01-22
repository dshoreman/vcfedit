import AddressValue from "./properties/address.js";
import NameValue from "./properties/name.js";
import PhotoValue from "./properties/photo.js";
import {SimpleValue, ValueFormatter} from "./properties/simple.js";

export enum Property {
    begin = 'BEGIN', end = 'END', version = 'VERSION',
    formattedName = 'FN', name = 'N', photo = 'PHOTO',
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

    constructor(folded: string, unfolded: string) {
        const [propString, value] = <[string, string]>unfolded.split(/:(.*)/),
            [property, ...rawParams] = <[Property, ...[string]]>propString.split(';');

        if (!Object.values(Property).includes(property)) {
            throw new Error(`Unhandled VCF line: '${unfolded}'`);
        }

        this.name = property;
        this.parameters = rawParams.map(parameterParser);

        switch (property) {
            case 'N': this.value = new NameValue(value, this.parameters); break;
            case 'ADR': this.value = new AddressValue(value, this.parameters); break;
            case 'PHOTO': this.value = new PhotoValue(value, this.parameters, folded); break;
            default: this.value = new SimpleValue(value);
        }
    }

    export(): string {
        const parameters = [this.name, ...this.parameters.map(({name, value}) => {
            if (name && value) {
                return `${name}=${value}`;
            }

            return name || value;
        })].join(';');

        return `${parameters}:${this.value.export(parameters.length + 1)}`
    }

    type(): string {
        return this.parameters.find(
            (p) => 'TYPE' === p.name || !p.name
        )?.value || '';
    }
}
