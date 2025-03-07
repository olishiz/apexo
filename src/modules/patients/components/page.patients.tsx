import {
	AsyncComponent,
	Col,
	DataTableComponent,
	ProfileComponent,
	ProfileSquaredComponent,
	Row,
	TagComponent
	} from "@common-components";
import { router, text, user } from "@core";
import {
	genderToString,
	Patient,
	PatientAppointmentsPanel,
	PatientGalleryPanel,
	patients,
	setting
	} from "@modules";
import { formatDate } from "@utils";
import { computed, observable } from "mobx";
import { observer } from "mobx-react";
import {
	Icon,
	IconButton,
	Panel,
	PanelType,
	PersonaInitialsColor,
	TooltipHost
	} from "office-ui-fabric-react";
import * as React from "react";

@observer
export class PatientsPage extends React.Component<{}, {}> {
	@observable selectedId: string = router.currentLocation.split("/")[1];

	@observable viewWhich: number = router.currentLocation.split("/")[1]
		? 1
		: 0;

	@computed
	get patient() {
		return patients.list.find(patient => patient._id === this.selectedId);
	}

	@computed get canEdit() {
		return user.currentUser.canEditPatients;
	}

	render() {
		return (
			<div className="patients-component p-15 p-l-10 p-r-10">
				{this.patient ? (
					<Panel
						key={this.selectedId + this.viewWhich}
						isOpen={!!this.patient}
						type={PanelType.medium}
						closeButtonAriaLabel="Close"
						isLightDismiss={true}
						onDismiss={() => {
							this.selectedId = "";
							this.viewWhich = 0;
						}}
						onRenderNavigation={() => {
							return (
								<Row className="panel-heading">
									<Col span={22}>
										<ProfileComponent
											name={this.patient!.name}
											secondaryElement={
												<div>
													{this.viewWhich === 1
														? text(
																"Patient Details"
														  )
														: ""}
													{this.viewWhich === 2
														? text("Dental History")
														: ""}
													{this.viewWhich === 3
														? text(
																"Gallery and X-Rays"
														  )
														: ""}
													{this.viewWhich === 4
														? text(
																"Patient Appointments"
														  )
														: ""}
												</div>
											}
											size={3}
										/>
									</Col>
									<Col span={2} className="close">
										<IconButton
											iconProps={{ iconName: "cancel" }}
											onClick={() => {
												this.selectedId = "";
												this.viewWhich = 0;
											}}
										/>
									</Col>
								</Row>
							);
						}}
					>
						{this.viewWhich === 1 ? (
							<AsyncComponent
								key=""
								loader={async () => {
									const PatientDetailsPanel = (await import("./patient-details"))
										.PatientDetailsPanel;
									return (
										<PatientDetailsPanel
											patient={this.patient!}
										/>
									);
								}}
							/>
						) : (
							""
						)}
						{this.viewWhich === 2 ? (
							<AsyncComponent
								key=""
								loader={async () => {
									const DentalHistoryPanel = (await import("./dental-history"))
										.DentalHistoryPanel;
									return (
										<DentalHistoryPanel
											patient={this.patient!}
										/>
									);
								}}
							/>
						) : (
							""
						)}
						{this.viewWhich === 3 ? (
							<PatientGalleryPanel patient={this.patient} />
						) : (
							""
						)}
						{this.viewWhich === 4 ? (
							<PatientAppointmentsPanel patient={this.patient} />
						) : (
							""
						)}
					</Panel>
				) : (
					""
				)}
				<DataTableComponent
					maxItemsOnLoad={10}
					className={"patients-data-table"}
					heads={[
						text("Patient"),
						text("Last/Next Appointment"),
						text("Total/Outstanding Payments"),
						text("Label")
					]}
					rows={patients.list.map(patient => ({
						id: patient._id,
						searchableString: patient.searchableString,
						cells: [
							{
								dataValue:
									patient.name +
									" " +
									patient.age +
									" " +
									genderToString(patient.gender),
								component: (
									<div>
										<ProfileComponent
											name={patient.name}
											secondaryElement={
												<span>
													{text(
														genderToString(
															patient.gender
														)
													)}{" "}
													- {patient.age}{" "}
													{text("years old")}
												</span>
											}
											size={3}
										/>
										<br />

										<TooltipHost
											content={text("Patient Details")}
										>
											<IconButton
												className="action-button"
												iconProps={{
													iconName: "DietPlanNotebook"
												}}
												onClick={() => {
													this.selectedId =
														patient._id;
													this.viewWhich = 1;
												}}
											/>
										</TooltipHost>

										<TooltipHost
											content={text("Dental History")}
										>
											<IconButton
												className="action-button"
												iconProps={{
													iconName: "Teeth"
												}}
												onClick={() => {
													this.selectedId =
														patient._id;
													this.viewWhich = 2;
												}}
											/>
										</TooltipHost>

										<TooltipHost
											content={text("Gallery and X-Rays")}
										>
											<IconButton
												className="action-button"
												iconProps={{
													iconName: "PhotoCollection"
												}}
												onClick={() => {
													this.selectedId =
														patient._id;
													this.viewWhich = 3;
												}}
											/>
										</TooltipHost>

										{user.currentUser
											.canViewAppointments ? (
											<TooltipHost
												content={text(
													"Patient Appointments"
												)}
											>
												<IconButton
													className="action-button"
													iconProps={{
														iconName: "Calendar"
													}}
													onClick={() => {
														this.selectedId =
															patient._id;
														this.viewWhich = 4;
													}}
												/>
											</TooltipHost>
										) : (
											""
										)}
										<TooltipHost content={text("Delete")}>
											<IconButton
												className="action-button delete"
												iconProps={{
													iconName: "Trash"
												}}
												onClick={() =>
													patients.deleteModal(
														patient._id
													)
												}
												disabled={!this.canEdit}
											/>
										</TooltipHost>
									</div>
								),
								className: "no-label"
							},
							{
								dataValue: (
									patient.lastAppointment ||
									patient.nextAppointment || { date: 0 }
								).date,
								component: (
									<div>
										<ProfileSquaredComponent
											text={
												patient.lastAppointment
													? patient.lastAppointment
															.treatment
														? patient
																.lastAppointment
																.treatment.type
														: ""
													: ""
											}
											subText={
												patient.lastAppointment
													? formatDate(
															patient
																.lastAppointment
																.date,
															setting.getSetting(
																"date_format"
															)
													  )
													: text(
															"No last appointment"
													  )
											}
											size={3}
											onRenderInitials={() => (
												<Icon iconName="Previous" />
											)}
											onClick={() => {}}
											initialsColor={
												patient.lastAppointment
													? undefined
													: PersonaInitialsColor.transparent
											}
										/>
										<br />
										<ProfileSquaredComponent
											text={
												patient.nextAppointment
													? patient.nextAppointment
															.treatment
														? patient
																.nextAppointment
																.treatment.type
														: ""
													: ""
											}
											subText={
												patient.nextAppointment
													? formatDate(
															patient
																.nextAppointment
																.date,
															setting.getSetting(
																"date_format"
															)
													  )
													: text(
															"No next appointment"
													  )
											}
											size={3}
											onRenderInitials={() => (
												<Icon iconName="Next" />
											)}
											onClick={() => {}}
											initialsColor={
												patient.nextAppointment
													? undefined
													: PersonaInitialsColor.transparent
											}
										/>
									</div>
								),
								className: "hidden-xs"
							},
							{
								dataValue: patient.totalPayments,
								component: (
									<div>
										<ProfileSquaredComponent
											text={
												setting.getSetting(
													"currencySymbol"
												) +
												patient.totalPayments.toString()
											}
											subText={text("Payments made")}
											size={3}
											onRenderInitials={() => (
												<Icon iconName="CheckMark" />
											)}
											onClick={() => {}}
											initialsColor={
												patient.totalPayments > 0
													? PersonaInitialsColor.darkBlue
													: PersonaInitialsColor.transparent
											}
										/>
										<br />
										<ProfileSquaredComponent
											text={
												setting.getSetting(
													"currencySymbol"
												) +
												(patient.differenceAmount < 0
													? patient.outstandingAmount.toString()
													: patient.differenceAmount >
													  0
													? patient.overpaidAmount.toString()
													: "0")
											}
											subText={
												patient.differenceAmount < 0
													? text("Outstanding amount")
													: patient.differenceAmount >
													  0
													? text("Overpaid amount")
													: text(
															"No outstanding amount"
													  )
											}
											size={3}
											onRenderInitials={() => (
												<Icon iconName="Cancel" />
											)}
											onClick={() => {}}
											initialsColor={
												patient.differenceAmount !== 0
													? PersonaInitialsColor.darkRed
													: PersonaInitialsColor.transparent
											}
										/>
									</div>
								),
								className: "hidden-xs"
							},
							{
								dataValue: patient.labels
									.map(x => x.text)
									.join(","),
								component: (
									<div>
										{patient.labels.map((label, index) => {
											return (
												<TagComponent
													key={index}
													text={label.text}
													type={label.type}
												/>
											);
										})}
									</div>
								),
								className: "hidden-xs"
							}
						]
					}))}
					commands={
						this.canEdit
							? [
									{
										key: "addNew",
										title: "Add new",
										name: text("Add new"),
										onClick: () => {
											const patient = new Patient();
											patients.list.push(patient);
											this.selectedId = patient._id;
											this.viewWhich = 1;
										},
										iconProps: {
											iconName: "Add"
										}
									}
							  ]
							: []
					}
				/>
			</div>
		);
	}
}
