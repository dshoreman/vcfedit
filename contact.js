export default class Contact {
    template = document.querySelector('#vcard-contact').content;

    constructor(rawData) {
        this.rawData = rawData;

        this.#parseLines();
    }

    vCard() {
        const clone = this.template.cloneNode(true);

        clone.querySelector('h3').innerText = this.fullName;
        clone.querySelector('img').src = this.photo;
        clone.querySelector('em').innerText = this.phone || '';
        clone.querySelector('span').innerText = this.email || '';
        clone.querySelector('p').innerText = this.organisation || '';
        clone.toString = () => this.rawData;

        return clone;
    }

    #parseLines() {
        // Split continuous lines on CRLF followed by space or tab.
        // Section 3.2 of RFC 6350: "Line Delimiting and Folding".
        const unfolded = this.rawData.replace(/\r\n[\t\u0020]/g, '');

        for (const line of unfolded.split('\r\n')) {
            const [param, value] = line.split(':', 2);

            if ('' === line.trim() || ['BEGIN', 'END', 'VERSION'].includes(param)) {
                continue;
            }

            switch(param.split(';')[0]) {
                case 'N': this.#extractName(line); break;
                case 'FN': this.#extractFullName(line); break;
                case 'TEL': this.#extractPhone(line); break;
                case 'EMAIL': this.#extractEmail(line); break;
                case 'ORG': this.#extractOrganisation(line); break;
                case 'PHOTO':
                    // Todo: Move this to `#extractPhoto` and improve parsing
                    if (param === 'PHOTO;ENCODING=BASE64;JPEG') {
                        this.#extractBase64Photo(value);
                        break;
                    }
                default:
                    console.warn(`Unhandled VCF line: '${line}'`);
            }
        }
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

    #extractBase64Photo(data) {
        this.photo = `data:image/jpg;base64,${data}`;
    }
};
