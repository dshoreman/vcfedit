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
        const [_, last, first] = line.match(/N:(.*)?;(.*)?;;;/);

        if (first && last) {
            this.fullName = `${first} ${last}`;
        } else if (first) {
            this.fullName = first;
        } else {
            this.fullName = last;
        }
    }

    #parseLines() {
        for (const line of this.rawData.split(/[\r\n]+/)) {
            switch (true) {
                case line.startsWith('N:'):
                    this.#extractFullName(line);
                    break;
                case /^(BEGIN|END):VCARD$/.test(line):
                    break; // no-op
                default: console.warn("Unhandled VCF line: " + line);
            }
        }
    }
};
