export function shallow_equality(obj1, obj2) {
    const obj1_keys = Object.keys(obj1);
    const obj2_keys = Object.keys(obj2);

    if (obj1_keys.length !== obj2_keys.length)
        return false;

    return obj1_keys.every((key) => obj1[key] === obj2[key]) &&
           obj2_keys.every((key) => obj2[key] === obj1[key]);
}

export function deep_clone(obj) {
    if (window.structuredClone)
        return window.structuredClone(obj);

    // Safari :D
    const ret = {};
    for (const key in obj) {
        if ((Array.isArray(obj[key])))
            ret[key] = [].concat(obj[key]);
        else if ((typeof obj[key]) === 'object')
            ret[key] = deep_clone(obj[key]);
        else
            ret[key] = obj[key];
    }

    return ret;
}

export function date_delta(from, to) {
    const delta = Math.floor((to - from) / 1000);

    if (delta < 60)
        return `${delta} second${delta === 1 ? '' : 's'} ago`;

    if ((delta / 60) < 60) {
        const d = Math.floor(delta / 60);
        return `${d} minute${d === 1 ? '' : 's'} ago`;
    }

    const d = Math.floor(delta / 60 / 60);
    return `${d} hour${d === 1 ? '' : 's'} ago`;
}

function relative_luminance(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function parse_colour(colour) {
    const n = Number.parseInt(colour.slice(1), 16);
    let r, g, b;
    if (colour.slice(1).length === 3) {
        r = (n & 0xf00) >>> 4;
        g = n & 0xf0;
        b = (n & 0xf) << 4;

        r |= r >>> 4;
        g |= g >>> 4;
        b |= b >>> 4;
    } else if (colour.slice(1).length === 6) {
        r = (n & 0xff0000) >>> 16;
        g = (n & 0xff00) >>> 8;
        b = n & 0xff;
    }

    return { r, g, b };
}

export function text_colour_from_bg(r, g, b) {
    return relative_luminance(r, g, b) < 128 ? 'light' : 'dark';
}
