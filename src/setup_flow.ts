import * as uc from "@unfoldedcircle/integration-api";
import * as config from "./config.js";

/**
 * Start driver setup.
 *
 * Initiated by the UC Remote to set up the driver.
 * @param {uc.DriverSetupRequest} msg value(s) of input fields in the first setup screen.
 * @return the SetupAction on how to continue
 */
async function handleDriverSetup(msg: any): Promise<uc.SetupAction> {
  const dreamboxDevice = new config.DreamboxDevice("remote1", "Dreambox", msg.setupData.address);
  config.devices.addOrUpdate(dreamboxDevice);

  return new uc.SetupComplete();
}

const driverSetupHandler = async function (msg: any): Promise<uc.SetupAction> {
  if (msg instanceof uc.DriverSetupRequest) {
    return await handleDriverSetup(msg);
  }

  return new uc.SetupError();
};

export { driverSetupHandler };
