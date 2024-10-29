export class PriorityQueue<T> {
    private elements: [T, number][];
    private compare: (a: [T, number], b: [T, number]) => boolean;

    constructor(compare: (a: [T, number], b: [T, number]) => boolean) {
        this.elements = [];
        this.compare = compare;
    }

    enqueue(element: [T, number]): void {
        this.elements.push(element);
        this.elements.sort((a, b) => this.compare(a, b) ? -1 : 1);
    }

    dequeue(): [T, number] | undefined {
        return this.elements.shift();
    }

    isEmpty(): boolean {
        return this.elements.length === 0;
    }

    includes(element: [T, number]): boolean {
        return this.elements.some(e => e[0] === element[0] && e[1] === element[1]);
    }
}