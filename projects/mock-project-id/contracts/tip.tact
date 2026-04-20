import "@stdlib/deploy";

contract TipContract with Deployable {
    owner: Address;
    
    init(owner: Address) {
        self.owner = owner;
    }
    
    receive(msg: slice) {
        // Accept any incoming messages
    }
    
    // Function to send tip to owner
    fun tip() {
        let msg = beginCell()
            .storeUint(0, 32)  // op: simple transfer
            .storeCoins(1000000000)  // 1 TON in nanotons
            .storeAddress(self.owner)
            .storeUint(0, 1)
            .endCell();
        
        send(msg, 128);  // mode 128: pay transfer fees separately
    }
}