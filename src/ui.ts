type CursorRelativeElement = ['cursor'|'element', HTMLElement];
type ElementWithListener = HTMLElement & {
    listen(event: string, listener: EventListener): ElementWithListener
};
type HTMLTarget = {target: HTMLElement};

export function applyValues(tpl: string, values: {[key: string]: string}) {
    const clone = template(`#${tpl}`).content.cloneNode(true) as HTMLElement,
        container = element(':first-child', clone).className;

    Object.entries(values).forEach(([name, value]) => {
        element(`.${container}-${name}`, clone).innerHTML = value;
    });

    return clone;
}

// Find the closest `selector` within `parent` (or document) to the position of
// `MouseEvent`, and whether the 'cursor' or 'element' centre position is first.
export function closest(
    selector: string,
    {clientY, target}: MouseEvent & HTMLTarget,
    haystack: HTMLElement[] = [],
): ['cursor'|'element', HTMLElement] | [null, null] {
    let closest: CursorRelativeElement|HTMLElement|null = <HTMLElement | null> target.closest(selector);

    if (closest) {
        const [first] = directionAndDistanceTo(closest, clientY);

        return [first, closest];
    }

    let shortestDistance = Infinity;
    for (const el of haystack) {
        const [first, distance] = directionAndDistanceTo(el, clientY);
        if (shortestDistance < distance)
            continue;

        closest = [first, el];
        shortestDistance = distance;
    }

    return closest || [null, null];
}

// Returns a tuple with which comes first between 'cursor'/'element',
// and the distance between `y` and the vertical center of `target`.
function directionAndDistanceTo(target: HTMLElement, y: number): ['cursor'|'element', number] {
    const rect = target.getBoundingClientRect(),
        centerY = rect.top + rect.height / 2,
        distance = Math.abs(y - centerY);

    if (y < centerY) {
        return ['cursor', distance];
    }

    return ['element', distance];
}

export function element(selector: string, parent: Document|HTMLElement = document): ElementWithListener {
    const el: ElementWithListener = findOrFail(selector, parent);

    el.listen = (event: string, listener: EventListener) =>
        listen(el, event, listener);

    return el;
}

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

function listen <T extends ElementWithListener> (
    element: T,
    event: string,
    listener: EventListener,
): T {
    element.addEventListener(event, listener);

    return element;
}

export const template = (selector: string):
    HTMLTemplateElement => findOrFail(selector, document);
