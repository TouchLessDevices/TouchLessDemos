export interface View {
	name: string;
	in: Function;
	inComplete: Function;
	out: Function;
	outComplete: Function;
	resize: Function;
	kill: Function;
}
