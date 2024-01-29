function findOrFail(selector: string, parent: Document|HTMLElement): any {
    const el = parent.querySelector(selector);

    if (!el) {
        throw new Error(`Element ${selector} does not exist.`);
    }

    return el
}

export const element = (selector: string, parent: Document|HTMLElement = document):
    HTMLElement => findOrFail(selector, parent);

export const image = (selector: string, parent: Document|HTMLElement = document):
    HTMLImageElement => findOrFail(selector, parent);

export const template = (selector: string):
    HTMLTemplateElement => findOrFail(selector, document);

export function applyValues(tpl: string, values: {[key: string]: string}) {
    const clone = template(`#${tpl}`).content.cloneNode(true) as HTMLElement,
        container = element(':first-child', clone).className;

    Object.entries(values).forEach(([name, value]) => {
        element(`.${container}-${name}`, clone).innerHTML = value;
    });

    return clone;
}
