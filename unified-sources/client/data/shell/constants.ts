export const VERSION = "/v0.1";

export const API = {
  SERVICE_CONNECTIONS_MULTIFACTOR: `${VERSION}/user/multifactor/serviceConnections`,
  SERVICE_CONNECTIONS: `${VERSION}/user/serviceConnections`,
  SERVICE_CONNECTION_BY_ID: `${VERSION}/user/serviceConnections/:serviceConnectionId`,
  VALIDATE_SERVICE_CONNECTIONS: `${VERSION}/user/validateServiceConnection`,
  VERIFY_AUTHENTICATION: `${VERSION}/user/serviceConnections/:serviceConnectionId/verifyAuth`,
};
