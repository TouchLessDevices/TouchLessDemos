export class HandStateManager {
	private state = {
		stateSwitching: {
			potentialNewState: null,
			potentialNewStateCount: 0,
			currentState: null,
			currentStateCount: 0,
			switchStateAtCount: 2
		},
		handStateSwitching: {
			handFound: false,
			handFoundNumberOfTimes: 0,
			handNotFoundNumberOfTimes: 0,
			currentStateCount: 0,
			switchStateAtCount: 20
		},
		handSubStateSpread: {
			amount: 0,
			isActive: false,
			isActiveCount: 0
		}
	};

	constructor() {}

	public updateState = (newState: string) => {
		this.state.stateSwitching.potentialNewState = newState;
	};

	public checkState = () => {
		if (this.state.stateSwitching.potentialNewState !== this.state.stateSwitching.currentState) {
			this.state.stateSwitching.potentialNewStateCount++;
			if (this.state.stateSwitching.potentialNewStateCount >= this.state.stateSwitching.switchStateAtCount) {
				this.state.stateSwitching.currentState = this.state.stateSwitching.potentialNewState;
				this.state.stateSwitching.potentialNewStateCount = 0;
				this.state.stateSwitching.currentStateCount = 0;
			}
		} else {
			this.state.stateSwitching.currentStateCount++;
		}
	};

	public getState = () => {
		return this.state.stateSwitching.currentState;
	};

	public getStateCount = () => {
		return this.state.stateSwitching.currentStateCount;
	};

	public handFoundUpdate(onHandFound) {
		this.state.handStateSwitching.handFoundNumberOfTimes++;
		//console.log('this.state.handStateSwitching.handFoundNumberOfTimes : ' + this.state.handStateSwitching.handFoundNumberOfTimes)
		if (this.state.handStateSwitching.handFound === false && this.state.handStateSwitching.handFoundNumberOfTimes >= this.state.handStateSwitching.switchStateAtCount) {
			this.state.handStateSwitching.handFound = true;
			this.state.handStateSwitching.handNotFoundNumberOfTimes = 0;

			if (onHandFound) {
				onHandFound();
			}
		}
	}

	public handFound() {
		return this.state.handStateSwitching.handFound;
	}

	public handFoundCount() {
		return this.state.handStateSwitching.handFoundNumberOfTimes;
	}

	public noHandFoundCount = noHandFoundCallback => {
		this.state.handStateSwitching.handNotFoundNumberOfTimes++;
		if (this.state.handStateSwitching.handFound === true && this.state.handStateSwitching.handNotFoundNumberOfTimes >= this.state.handStateSwitching.switchStateAtCount) {
			this.state.handStateSwitching.handFound = false;
			this.state.handStateSwitching.handFoundNumberOfTimes = 0;

			if (noHandFoundCallback) {
				noHandFoundCallback();
			}
		}
	};
}
