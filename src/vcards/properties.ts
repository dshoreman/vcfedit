export enum Property {
    begin = 'BEGIN', end = 'END', version = 'VERSION',
    orgTitle = 'TITLE', orgName = 'ORG',
};

export class VCardProperty {
    name: Property;
    value: string;

    constructor(line: string) {
        const [propString, value] = <[string, string]>line.split(/:(.*)/),
            [property] = <[Property]>propString.split(';', 1);

        if (!Object.values(Property).includes(property)) {
            throw new Error(`Unhandled VCF line: '${line}'`);
        }

        this.name = property;
        this.value = value;
    }
}
