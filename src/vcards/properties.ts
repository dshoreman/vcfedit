import AddressValue from "./properties/address.js";
import NameValue from "./properties/name.js";
import PhotoValue from "./properties/photo.js";
import {SimpleValue, ValueFormatter} from "./properties/simple.js";

export enum Property {
    begin = 'BEGIN', end = 'END', source =  'SOURCE', kind = 'KIND', xml = 'XML',   // General Properties
    formattedName = 'FN', name = 'N', nickname = 'NICKNAME', photo = 'PHOTO',       // Identification Properties
        birthday = 'BDAY', anniversary = 'ANNIVERSARY', gender = 'GENDER',          //     ...
    address = 'ADR',                                                                // Delivery Addressing Properties
    phone = 'TEL', email = 'EMAIL', impp = 'IMPP', lang = 'LANG',                   // Communications Properties
    timezone = 'TZ', geo = 'GEO',                                                   // Geographical Properties
    orgTitle = 'TITLE', orgRole = 'ROLE', orgName = 'ORG',                          // Organizational Properties
        logo = 'LOGO', member = 'MEMBER', related = 'RELATED',                      //     ...
    categories = 'CATEGORIES', note = 'NOTE', product = 'PRODID', revision = 'REV', // Explanatory Properties
        sound = 'SOUND', uid = 'UID', pidmap = 'CLIENTPIDMAP', url = 'URL', version = 'VERSION',    //   ...
    key = 'KEY',                                                                    // Security Properties
    busyUrl = 'FBURL', calUserUri = 'CALADRURI', calUri = 'CALURI',                 // Calendar Properties
};

export type Parameter = {
    name: string,
    value: string,
};

export const HiddenPropertyFilter = (p: VCardProperty) =>
    ![Property.begin, Property.end, Property.version].includes(p.name);

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

        if (!Object.values(Property).includes(property) && !property.startsWith('X-')) {
            throw new Error(`Unhandled VCF line: '${unfolded}'`);
        }

        this.name = property;
        this.parameters = rawParams.map(parameterParser);

        switch (property) {
            case 'N': this.value = new NameValue(value, this.parameters); break;
            case 'ADR': this.value = new AddressValue(value, this.parameters); break;
            case 'PHOTO': this.value = new PhotoValue(value, this.parameters, folded); break;
            default: this.value = new SimpleValue(value, this.parameters);
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
