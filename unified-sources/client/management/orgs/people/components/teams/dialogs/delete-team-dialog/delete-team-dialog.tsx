import * as React from "react";
import { observer } from "mobx-react";
import { ConfirmationDialog, PrimaryButton } from "@root/shared";
import { Team } from "@root/data/management/models/team";
import { DialogUIStore } from "../dialog-ui-store";
import { TeamType } from "@root/data/management/stores/team-store";

export const deleteTeamDialogStore = new DialogUIStore();

export interface DeleteTeamDialogProps {
  team: Team;
  organizationName: string;
  onConfirmLeaveTeam: (organizationName: string, team: Team) => void;
  closeOnConfirm?: boolean;
  progress?: boolean;
  teamType: TeamType;
}

@observer
export class DeleteTeamDialog extends React.Component<DeleteTeamDialogProps, {}> {
  public render() {
    const { team, progress, teamType } = this.props;
    const { isVisible } = deleteTeamDialogStore;
    return (
      <ConfirmationDialog
        data-test-id="team-delete-dialog"
        visible={isVisible}
        title={`Delete ${team ? team.displayName : ""} permanently?`}
        description={`If you delete this ${teamType}, you won’t be able to recover it.`}
        cancelButton="Cancel"
        confirmButton={
          <PrimaryButton data-test-id="delete-team-dialog-confirm-button" progress={progress}>
            {progress ? "Deleting" : "Delete"}
          </PrimaryButton>
        }
        danger
        onConfirm={this.onConfirm}
        onCancel={this.closeDialog}
      />
    );
  }

  private onConfirm = (): void => {
    const { organizationName, team, onConfirmLeaveTeam, closeOnConfirm } = this.props;
    if (!team) {
      // If there was no team set, harmlessly close the dialog and don't take any action.
      // NOTE: This was added because we need to render the child tree in all cases to
      // make sure the Overlay mounts at the correct time (on page load), rather than
      // waiting until the team is set. This is just an extra fail-safe to make sure we
      // can't try to delete a null/undefined team.
      deleteTeamDialogStore.setVisible(false);
      return;
    }

    if (closeOnConfirm) {
      this.closeDialog();
    }
    if (typeof onConfirmLeaveTeam === "function") {
      onConfirmLeaveTeam(organizationName, team);
    }
  };

  private closeDialog(): void {
    deleteTeamDialogStore.setVisible(false);
  }
}
