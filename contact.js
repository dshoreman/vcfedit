export default class Contact {
    template = document.querySelector('#vcard-contact').content;

    constructor(rawData) {
        this.rawData = rawData;

        this.#parseLines();
    }

    vCard() {
        const clone = this.template.cloneNode(true);

        clone.querySelector('li').innerText = this.fullName;
        clone.toString = () => this.rawData;

        return clone;
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
        this.nameRaw = line.split(':', 2)[1];
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
                case /^(BEGIN|END):VCARD$/.test(line):
                    break; // no-op
                default: console.warn("Unhandled VCF line: " + line);
            }
        }
    }
};
