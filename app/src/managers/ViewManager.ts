import { AbstractView } from '../views/core/AbstractView';

interface RegisteredView {
	name: string;
	view: typeof AbstractView;
}

interface ActiveView {
	path: string;
	data: HTMLElement;
	view: AbstractView;
}

export class ViewManager {
	private _viewData: NodeListOf<HTMLDivElement>;
	private _viewContainer: HTMLDivElement;
	private _registeredViews: Array<RegisteredView> = [];
	private _activeViews: Array<ActiveView> = [];
	private _path: string;
	private _queue: Array<ActiveView> = [];

	private _blocked: boolean = false;
	private _initial: boolean = true;

	public defaultUrl = document.location.protocol + '//' + window.location.host;

	constructor(viewContainer: HTMLDivElement) {
		this._viewContainer = viewContainer;
		this._viewData = viewContainer.querySelectorAll('div [data-view]');

		let l = this._viewData.length;

		for (let i = 0; i < l; i++) {
			this._viewData[i].parentNode.removeChild(this._viewData[i]);
		}

		this._viewContainer.style.display = 'block';

		history.scrollRestoration = 'manual';
		window.addEventListener('popstate', this.onHashChange);
	}

	public init() {
		let currentPath = this.getPath();
		this.onHashChange();
	}

	private onHashChange = (e = null) => {
		let url = this.getPath();

		url = url.split('?')[0];
		url = url.split('#')[0];

		let newPath = this.extractPath(url);

		if (this._activeViews.length > 0) {
			this._blocked = true;
			let activeView;

			let l = this._activeViews.length;

			for (let i = 0; i < l; i++) {
				activeView = this._activeViews.pop();
				activeView.view.out();
			}
		}

		if (this._initial) {
			let view = this.initView(this.getData(newPath), newPath);
			view.in();
			this._initial = false;
		} else if (this._blocked) {
			this._queue.push({
				path: newPath,
				data: this.getData(newPath),
				view: this.initView(this.getData(newPath), newPath)
			});
		} else {
			let view = this.initView(this.getData(newPath), newPath);
			view.in();

			this._blocked = true;
		}
	};

	public extractPath = str => {
		var arr1 = str.split('#');
		var arr2 = arr1[arr1.length - 1].split('/');
		var arr3 = [];
		var l = arr2.length;
		var currPart;

		for (let i = 0; i < l; i += 1) {
			currPart = arr2[i];
			if (currPart !== null && currPart !== '') {
				arr3.push(currPart);
			}
		}
		let newPath = arr3.join('/');
		return newPath;
	};

	public getPath() {
		let fullURL = window.location.href;
		let url = fullURL.substring(this.defaultUrl.length, fullURL.length);

		return url;
	}

	public registerView = (view: RegisteredView) => {
		this._registeredViews.push(view);
	};

	public addView = (element: HTMLElement) => {
		element.setAttribute('data-id', Math.round(99999999999999 * Math.random()) + '');
		this._viewContainer.appendChild(element);
	};

	public removeView = (element: HTMLElement) => {
		if (element.parentNode) {
			element.parentNode.removeChild(element);
		}

		element = null;
	};

	public allowNextView = () => {
		if (this._queue.length > 0) {
			let que = this._queue.pop();
			que.view.in();

			this._blocked = true;
		} else {
			this._blocked = false;
		}
	};

	public setPath(newPath: string) {
		newPath = '/' + newPath;
		history.pushState(newPath, newPath, newPath);
		this.onHashChange();
	}

	private getData(path: String) {
		let l = this._viewData.length;
		let data;

		for (let i = 0; i < l; i++) {
			if (this._viewData[i].getAttribute('data-path') === path) {
				data = this._viewData[i].cloneNode(true);
				break;
			}
		}

		return data;
	}

	private initView(data: HTMLElement, path: string) {
		let view = this.getView(data, data.getAttribute('data-view'));

		this._activeViews.push({
			path: path,
			data: data,
			view: view
		});

		if (typeof (window as any).gtag !== 'undefined') {
			if (path === '') {
				path = '/';
			}

			if (path.substring(0, 1) !== '/') {
				path = '/' + path;
			}

			let base = window.location.protocol + '//' + window.location.host + '/';

			(window as any).gtag('event', 'page_view', { page_path: path.replace(base, '') });
		} else if (typeof (window as any).ga !== 'undefined') {
			if (path === '') {
				path = '/';
			}

			if (path.substring(0, 1) !== '/') {
				path = '/' + path;
			}

			let base = window.location.protocol + '//' + window.location.host + '/';

			(window as any).ga('send', {
				hitType: 'pageview',
				page: path.replace(base, '')
			});
		}

		return view;
	}

	public getView = (data: HTMLElement, name: string) => {
		let l = this._registeredViews.length;
		let view: AbstractView;
		let found = false;

		for (let i = 0; i < l; i++) {
			if (this._registeredViews[i].name === name) {
				view = new this._registeredViews[i].view(data, name, this._initial);
				found = true;
				break;
			}
		}

		if (!found) {
			console.error('View with name: ' + name + ' not found');
		}

		return view;
	};

	public isRetina = () => {
		let mediaQuery = '(-webkit-min-device-pixel-ratio: 1.5),\
            (min--moz-device-pixel-ratio: 1.5),\
            (-o-min-device-pixel-ratio: 3/2),\
            (min-resolution: 1.5dppx)';

		if (window.devicePixelRatio > 1 || (window.matchMedia && window.matchMedia(mediaQuery).matches)) {
			return true;
		} else {
			return false;
		}
	};

	public resize = () => {
		let l = this._activeViews.length;

		for (let i = 0; i < l; i++) {
			this._activeViews[i].view.resize();
		}

		//this._viewContainer.style.width = window.innerWidth + 'px';
		//this._viewContainer.style.height = window.innerHeight + 'px';
	};
}
