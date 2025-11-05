import * as React from "react";
import { PasswordState } from "./certificate-upload-handler";
import { IDragDropUploadHandlerStore } from "@root/shared";
import { AppleConnectCertficate } from "./apple/apple-connect-certifcate";
import { GeneralCertificate } from "./apple/general-certifcate";

export interface CertificateUploadProps {
  handler: IDragDropUploadHandlerStore;
  passwordState?: PasswordState;
  password: string;
  onPasswordChange?: React.ChangeEventHandler<HTMLInputElement>;
  appleConnectKeyHandler?: any;
}

export class CertificateUpload extends React.Component<CertificateUploadProps, {}> {
  public render() {
    const { handler, onPasswordChange, passwordState, password, appleConnectKeyHandler } = this.props;

    return appleConnectKeyHandler ? (
      <AppleConnectCertficate handler={handler} appleConnectKeyHandler={appleConnectKeyHandler} />
    ) : (
      <GeneralCertificate handler={handler} onPasswordChange={onPasswordChange} passwordState={passwordState} password={password} />
    );
  }
}
