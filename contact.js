export default class Contact {
    template = document.querySelector('#vcard-contact').content;

    constructor(rawData) {
        this.rawData = rawData;

        this.#parseLines();
    }

    vCard() {
        const clone = this.template.cloneNode(true);

        clone.querySelector('b').innerText = this.fullName;
        clone.querySelector('em').innerText = this.phone || '';
        clone.querySelector('span').innerText = this.email || '';
        clone.querySelector('sup').innerText = this.organisation || '';
        clone.toString = () => this.rawData;

        return clone;
    }

    #extractEmail(line) {
        this.email = line.replace('EMAIL:', '');
    }

    #extractFullName(line) {
        this.fullName = line.replace('FN:', '');

        if (this.fullName !== `${this.firstName} ${this.lastName}`.trim()) {
            this.fullName += ` (${this.firstName} ${this.lastName})`;
        }
    }

    #extractName(line) {
        const [_, last, first] = line.match(/N:(.*)?;(.*)?;;;/);

        this.firstName = first || '';
        this.lastName = last || '';
        this.nameRaw = line.substring(2);
    }

    #extractOrganisation(line) {
        this.organisation = line.substring(4);
    }

    #extractPhone(line) {
        this.phone = line.replace('TEL;CELL:', '');
    }

    #parseLines() {
        for (const line of this.rawData.split(/[\r\n]+/)) {
            switch (true) {
                case line.startsWith('N:'):
                    this.#extractName(line);
                    break;
                case line.startsWith('FN:'):
                    this.#extractFullName(line);
                    break;
                case line.startsWith('TEL;CELL:'):
                    this.#extractPhone(line);
                    break;
                case line.startsWith('EMAIL:'):
                    this.#extractEmail(line);
                    break;
                case line.startsWith('ORG:'):
                    this.#extractOrganisation(line);
                    break;
                case /^(BEGIN|END):VCARD$/.test(line):
                case /VERSION:[0-9\.]+/.test(line):
                    break; // no-op
                default: console.warn("Unhandled VCF line: " + line);
            }
        }
    }
};
