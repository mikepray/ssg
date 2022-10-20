export function d100() {
    return Math.floor(Math.random() * 100) + 1;
}

export function d20() {
    return Math.floor(Math.random() * 20) + 1;
}

export function dN(n: number) {
    return Math.floor(Math.random() * n) + 1;
}