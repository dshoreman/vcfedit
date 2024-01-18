export enum Property {
    begin = 'BEGIN', end = 'END', version = 'VERSION',
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
    parameters: Parameter[];
    value: string;

    constructor(line: string) {
        const [propString, value] = <[string, string]>line.split(/:(.*)/),
            [property, ...rawParams] = <[Property, ...[string]]>propString.split(';');

        if (!Object.values(Property).includes(property)) {
            throw new Error(`Unhandled VCF line: '${line}'`);
        }

        this.name = property;
        this.parameters = rawParams.map(parameterParser);
        this.value = value;
    }
}
