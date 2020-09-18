export class ActiveStateController {
    private _pageVisible = true;
    private domMessage: HTMLElement;

    get pageVisible(): boolean {
        return this._pageVisible;
    }

    set pageVisible(value: boolean) {
        this._pageVisible = value;
        this.domMessage.style.opacity = value ? '0' : '1';
    }

    constructor() {
        this.domMessage = document.getElementById('ActiveStateController-inactive');

        //Disable rendering when window not in focus, useful when developing locally:
        document.addEventListener('visibilitychange', () => {
            this.pageVisible = !document.hidden;
        });
        window.addEventListener('focus', () => {
            if (!document.hidden) {
                this.pageVisible = true;
            }
        });
        window.addEventListener('blur', () => {
            this.pageVisible = false;
        });
    }
}
