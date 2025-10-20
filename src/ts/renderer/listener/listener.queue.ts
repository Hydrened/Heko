import ListenerManager from "./listener.js";
import App from "./../app.js";

export default class ListenerQueueManager {
    constructor(private app: App, private listener: ListenerManager) {
        
    }
};
