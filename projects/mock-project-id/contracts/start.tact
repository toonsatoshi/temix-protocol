import "@stdlib/deploy";

contract StartContract with Deployable {
    init() {
        // Initialization logic
    }

    receive() {
        // Default receive handler
    }

    get fun start(): Int {
        return 42;
    }

    get fun help(): String {
        return "This is a help function that returns a help message.";
    }
}