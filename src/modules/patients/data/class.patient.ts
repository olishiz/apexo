import { stringToTagType, TagTypeToString } from "@common-components";
import {
	Appointment,
	appointments,
	Gender,
	genderToString,
	ISOTeeth,
	Label,
	PatientJSON,
	setting,
	stringToGender,
	Tooth
	} from "@modules";
import { comparableTime, formatDate, generateID } from "@utils";
import { computed, observable, observe } from "mobx";

export class Patient {
	_id: string = generateID();

	@observable triggerUpdate = 0;

	@observable name: string = "";

	@observable birthYear: number = 0;

	@observable gender: Gender = Gender.male;

	@observable tags: string = "";

	@observable address: string = "";

	@observable email: string = "";

	@observable phone: string = "";

	@observable labels: Label[] = [];

	@observable medicalHistory: string[] = [];

	@observable gallery: string[] = [];

	teeth: Tooth[] = [];

	@computed
	get age() {
		const diff = new Date().getFullYear() - this.birthYear;
		return diff > this.birthYear ? this.birthYear : diff;
	}

	@computed
	get appointments(): Appointment[] {
		return appointments.list.filter(
			appointment => appointment.patientID === this._id
		);
	}

	@computed
	get lastAppointment() {
		return this.appointments
			.filter(appointment => appointment.isDone === true)
			.sort((a, b) => b.date - a.date)[0];
	}

	@computed
	get nextAppointment() {
		return this.appointments
			.filter(appointment => {
				if (appointment.isDone) {
					return false;
				}
				const t = comparableTime(new Date());
				const a = comparableTime(new Date(appointment.date));
				return t.y <= a.y && t.m <= a.m && t.d <= a.d;
			})
			.sort((a, b) => a.date - b.date)[0];
	}

	@computed
	get hasPrimaryTeeth() {
		return this.age < 18;
	}

	@computed
	get hasPermanentTeeth() {
		return this.age > 5;
	}

	@computed get totalPayments() {
		return this.appointments
			.map(x => x.paidAmount)
			.reduce((t, c) => {
				t = t + c;
				return t;
			}, 0);
	}

	@computed get outstandingAmount() {
		return this.appointments
			.map(x => x.outstandingAmount)
			.reduce((t, c) => {
				t = t + c;
				return t;
			}, 0);
	}

	@computed get overpaidAmount() {
		return this.appointments
			.map(x => x.overpaidAmount)
			.reduce((t, c) => {
				t = t + c;
				return t;
			}, 0);
	}

	@computed get differenceAmount() {
		return this.overpaidAmount - this.outstandingAmount;
	}

	@computed
	get searchableString() {
		return `
			${this.age} ${this.birthYear}
			${this.phone} ${this.email} ${this.address} ${genderToString(this.gender)}
			${this.name} ${this.labels
			.map(x => x.text)
			.join(" ")} ${this.medicalHistory.join(" ")}
			${this.teeth.map(x => x.notes.join(" ")).join(" ")}
			${
				this.nextAppointment
					? (this.nextAppointment.treatment || { type: "" }).type
					: ""
			}
			${
				this.nextAppointment
					? formatDate(
							this.nextAppointment.date,
							setting.getSetting("date_format")
					  )
					: ""
			}
			${
				this.lastAppointment
					? (this.lastAppointment.treatment || { type: "" }).type
					: ""
			}
			${
				this.lastAppointment
					? formatDate(
							this.lastAppointment.date,
							setting.getSetting("date_format")
					  )
					: ""
			}
			${this.differenceAmount < 0 ? "outstanding " + this.outstandingAmount : ""}
			${this.differenceAmount > 0 ? "Overpaid " + this.overpaidAmount : ""}
		`.toLowerCase();
	}

	constructor(json?: PatientJSON) {
		for (let index = 0; index < ISOTeeth.permanent.length; index++) {
			const number = ISOTeeth.permanent[index];
			this.teeth[number] = new Tooth(number);
		}
		for (let index = 0; index < ISOTeeth.deciduous.length; index++) {
			const number = ISOTeeth.deciduous[index];
			this.teeth[number] = new Tooth(number);
		}
		if (json) {
			this.fromJSON(json);
		} else {
			observe(this.medicalHistory, () => this.triggerUpdate++);
			observe(this.labels, () => this.triggerUpdate++);
			observe(this.gallery, () => this.triggerUpdate++);
			this.teeth.forEach((tooth, index) => {
				observe(this.teeth[index], () => this.triggerUpdate++);
			});
		}
	}

	fromJSON(json: PatientJSON) {
		this._id = json._id;
		this.name = json.name;
		this.birthYear = json.birthYear;
		this.gender = stringToGender(json.gender);
		this.tags = json.tags;
		this.address = json.address;
		this.email = json.email;
		this.phone = json.phone;
		this.medicalHistory = Array.isArray(json.medicalHistory)
			? json.medicalHistory
			: [];
		this.gallery = json.gallery || [];
		json.teeth.map(toothObj => {
			if (toothObj) {
				const tooth = new Tooth(toothObj);
				this.teeth[tooth.ISO] = tooth;
			}
		});
		this.labels = json.labels.map(x => {
			return {
				text: x.text,
				type: stringToTagType(x.type)
			};
		});
		observe(this.medicalHistory, () => this.triggerUpdate++);
		observe(this.gallery, () => this.triggerUpdate++);
		observe(this.labels, () => this.triggerUpdate++);
		this.teeth.forEach((tooth, index) => {
			if (tooth) {
				observe(this.teeth[index], () => this.triggerUpdate++);
				observe(this.teeth[index].notes, () => this.triggerUpdate++);
			}
		});
	}

	toJSON(): PatientJSON {
		return {
			_id: this._id,
			name: this.name,
			birthYear: this.birthYear,
			gender: genderToString(this.gender),
			tags: this.tags,
			address: this.address,
			email: this.email,
			phone: this.phone,
			medicalHistory: Array.from(this.medicalHistory),
			gallery: Array.from(this.gallery),
			teeth: Array.from(this.teeth.map(x => x.toJSON())),
			labels: Array.from(
				this.labels.map(x => {
					return {
						text: x.text,
						type: TagTypeToString(x.type)
					};
				})
			)
		};
	}
}
