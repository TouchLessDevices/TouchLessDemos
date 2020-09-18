export class DrawingAppSimple {
	private _ctx: CanvasRenderingContext2D;

	private _currentTouches: any = [
		{ x: 0, y: 0 },
		{ x: 0, y: 0 },
		{ x: 0, y: 0 },
		{ x: 0, y: 0 },
		{ x: 0, y: 0 }
	];

	private _canvas: HTMLCanvasElement;

	constructor(element) {
		this._canvas = document.createElement('canvas') as HTMLCanvasElement;
		this._canvas.style.zIndex = '0';
		this._canvas.style.position = 'absolute';
		this._canvas.style.top = '0px';
		element.appendChild(this._canvas);
		this._ctx = this._canvas.getContext('2d');

		this._canvas.width = window.innerWidth;
		this._canvas.height = window.innerHeight;

		this._currentTouches = new Array();

		var mouse = { x: 0, y: 0 };

		this._canvas.addEventListener(
			'mousemove',
			function(e) {
				mouse.x = e.pageX - this.offsetLeft;
				mouse.y = e.pageY - this.offsetTop;
			},
			false
		);

		this._ctx.lineJoin = 'round';
		this._ctx.lineCap = 'round';
		this._ctx.strokeStyle = 'red';
	}

	public clear = () => {
		this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
	};

	public fingerStartTouch(id, x, y, color) {
		this._currentTouches[id] = {
			id: id,
			pageX: x,
			pageY: y,
			color: color
		};

		this._ctx.beginPath();
		this._ctx.arc(x, y, 2.5, Math.PI * 2, 0);
		this._ctx.fillStyle = color;
		this._ctx.fill();
	}

	public touchMoved(id, x, y, lineWidth) {
		var currentTouch = this._currentTouches[id];
		this._ctx.beginPath();
		this._ctx.moveTo(currentTouch.x, currentTouch.y);
		this._ctx.lineTo(x, y);
		this._ctx.lineWidth = lineWidth * 4;
		this._ctx.strokeStyle = currentTouch.color;
		this._ctx.stroke();
		currentTouch.x = x;
		currentTouch.y = y;
	}

	public getCanvas = () => {
		return this._canvas;
	};
}
