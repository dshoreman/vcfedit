export default class VCard {
    constructor(filename, parentColumn) {
        this.filename = filename;
        this.column = parentColumn;
    }

    process(vcfData) {
        this.column.querySelector('h2').innerText = this.filename;
        this.column.querySelector('pre').innerText = vcfData;
    }
}
