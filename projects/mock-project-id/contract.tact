import "@stdlib/deploy";

contract TipMe with Deployable {
    owner: Address;

    init(owner: Address) {
        self.owner = owner;
    }

    receive(msg: slice) {
        let op = msg~loadUint(32);
        if (op == 1) {
            self.tipOwner();
        }
    }

    fun tipOwner() {
        let msg = beginCell()
            .storeUint(0x18, 6)
            .storeSlice(self.owner)
            .storeCoins(1000000000)
            .storeUint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .endCell();
        send(msg, 128);
    }
}
