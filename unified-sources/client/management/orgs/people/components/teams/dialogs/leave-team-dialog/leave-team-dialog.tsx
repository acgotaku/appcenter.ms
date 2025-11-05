import * as React from "react";
import { observer } from "mobx-react";
import { ConfirmationDialog } from "@root/shared";
import { Team } from "@root/data/management/models/team";
import { DialogUIStore } from "../dialog-ui-store";
import { TeamType } from "@root/data/management/stores/team-store";

export const leaveTeamDialogStore = new DialogUIStore();

export interface LeaveTeamDialogProps {
  team: Team;
  organizationName: string;
  onConfirmLeaveTeam: (organizationName: string, team: Team) => void;
  closeOnConfirm?: boolean;
  teamType: TeamType;
}

@observer
export class LeaveTeamDialog extends React.Component<LeaveTeamDialogProps, {}> {
  public render() {
    const { team, teamType } = this.props;
    if (!team) {
      return null;
    }

    const { isVisible } = leaveTeamDialogStore;
    return (
      <ConfirmationDialog
        visible={isVisible}
        title={`Leave ${team.displayName} team?`}
        description={`You will lose permission to apps from ${team.displayName} ${teamType}.`}
        confirmButton="Leave"
        danger
        cancelButton="Cancel"
        onConfirm={this.onConfirm}
        onCancel={this.closeDialog}
      />
    );
  }

  private onConfirm = (): void => {
    const { organizationName, team, onConfirmLeaveTeam, closeOnConfirm } = this.props;
    if (closeOnConfirm) {
      this.closeDialog();
    }
    if (typeof onConfirmLeaveTeam === "function") {
      onConfirmLeaveTeam(organizationName, team);
    }
  };

  private closeDialog(): void {
    leaveTeamDialogStore.setVisible(false);
  }
}
