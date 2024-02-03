export function applyValues(tpl: string, values: {[key: string]: string}) {
    const clone = template(`#${tpl}`).content.cloneNode(true) as HTMLElement,
        container = element(':first-child', clone).className;

    Object.entries(values).forEach(([name, value]) => {
        element(`.${container}-${name}`, clone).innerHTML = value;
    });

    return clone;
}

// Find the closest `selector` (contained within `parent`?) to the position of `MouseEvent`.
export function closest(selector: string, {clientX, clientY}: MouseEvent, parent?: Element): HTMLElement|null {
    let closest = null, closestDistance = Infinity;

    (parent || document).querySelectorAll(selector).forEach(element => {
        const rect = element.getBoundingClientRect(),
            // (cursorX - elCentreX)² + (cursorY - elCentreY)²
            distanceSquared = Math.pow(clientX - (rect.left + rect.width / 2), 2) +
                Math.pow(clientY - (rect.top + rect.height / 2), 2);

        if (distanceSquared < closestDistance) {
            closestDistance = distanceSquared;
            closest = element;
        }
    });

    return closest;
}

export const element = (selector: string, parent: Document|HTMLElement = document):
    HTMLElement => findOrFail(selector, parent);

function findOrFail(selector: string, parent: Document|HTMLElement): any {
    const el = parent.querySelector(selector);

    if (!el) {
        throw new Error(`Element ${selector} does not exist.`);
    }

    return el
}

export function icon(name: string): HTMLElement {
    const i = document.createElement('i');

    i.className = 'material-symbols-outlined';
    i.innerText = name;

    return i;
}

export const image = (selector: string, parent: Document|HTMLElement = document):
    HTMLImageElement => findOrFail(selector, parent);

export const template = (selector: string):
    HTMLTemplateElement => findOrFail(selector, document);
