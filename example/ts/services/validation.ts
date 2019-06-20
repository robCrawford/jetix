
export function validateCount(n: number): Promise<string> {
    // Mock async
    return new Promise(resolve => {
        setTimeout(() => resolve(isNegative(n) ? "x Invalid" : "✓ Vaild"), 500);
    });
}

export function isNegative(n: number): boolean {
    return n < 0;
}
