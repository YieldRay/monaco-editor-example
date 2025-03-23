// TODO: this should use (value: V, key: K) => number for the capacity
export class LRUCache<K, V>
    implements Pick<Map<K, V>, "get" | "delete" | "clear" | "has" | "size">
{
    private capacity: number;
    private head!: DLinkedList<K, V>;
    private tail!: DLinkedList<K, V>;
    private map = new Map<K, DLinkedList<K, V>>();
    constructor(capacity: number) {
        this.capacity = capacity;
        this.clear();
    }

    public clear(): void {
        this.map = new Map<K, DLinkedList<K, V>>();
        this.head = DLinkedList.dummy<K, V>();
        this.tail = DLinkedList.dummy<K, V>();
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    public get(key: K): V | undefined {
        const node = this.map.get(key);
        if (!node) return undefined;
        this.moveToHead(node);
        return node.value;
    }

    public set(key: K, value: V): this {
        if (this.map.has(key)) {
            const node = this.map.get(key)!;
            node.value = value;
            this.moveToHead(node);
        } else {
            const node = new DLinkedList(key, value);
            this.map.set(key, node);
            this.addToHead(node);
            if (this.map.size > this.capacity) {
                this.removeLRU();
            }
        }
        return this;
    }

    private moveToHead(node: DLinkedList<K, V>): void {
        this.removeNode(node);
        this.addToHead(node);
    }

    private removeNode(node: DLinkedList<K, V>): void {
        node.prev!.next = node.next;
        node.next!.prev = node.prev;
    }

    private addToHead(node: DLinkedList<K, V>): void {
        node.prev = this.head;
        node.next = this.head.next;
        this.head.next!.prev = node;
        this.head.next = node;
    }

    private removeLRU(): void {
        const node = this.tail.prev!;
        this.removeNode(node);
        this.map.delete(node.key);
    }

    public delete(key: K): boolean {
        const node = this.map.get(key);
        if (!node) return false;
        this.removeNode(node);
        this.map.delete(key);
        return true;
    }

    public has(key: K): boolean {
        return this.map.has(key);
    }

    public get size(): number {
        return this.map.size;
    }
}

/**
 * @internal
 */
class DLinkedList<K, V> {
    prev: DLinkedList<K, V> | null = null;
    next: DLinkedList<K, V> | null = null;
    key: K;
    value: V;
    constructor(key: K, value: V) {
        this.key = key;
        this.value = value;
    }

    static dummy<K, V>() {
        return new DLinkedList(null as K, null as V);
    }
}
