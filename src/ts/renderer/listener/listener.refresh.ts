import ListenerManager from "./listener.js";
import App from "./../app.js";

export default class ListenerRefreshManager {
    constructor(private app: App, private listener: ListenerManager) {
        this.refresh();
    }

    public refresh(): void {

    }
};
