import * as uc from "@unfoldedcircle/integration-api";

import * as config from "./config.js";
import * as dreambox from "./dreambox.js";

enum SetupSteps {
  INIT = 0,
  CONFIGURATION_MODE = 1,
  DISCOVER = 2,
  RECONFIGURE = 3
}

var setupStep = SetupSteps.INIT;
var cfgAddDevice: boolean = false;
var reconfiguredDevice: config.DreamboxDevice | undefined;

function userInputDeviceSettings(): uc.RequestUserInput {
  return new uc.RequestUserInput("Setup mode", [
    {
      id: "address",
      label: { en: "Dreambox IP address", de: "Dreambox IP Adresse" },
      field: { text: { value: "" } }
    }
  ]);
}

/**
 * Start driver setup.
 *
 * Initiated by the UC Remote to set up the driver.
 * @param {uc.DriverSetupRequest} msg value(s) of input fields in the first setup screen.
 * @return the SetupAction on how to continue
 */
async function handleDriverSetup(msg: uc.DriverSetupRequest): Promise<uc.SetupAction> {
  const reconfigure = msg.reconfigure;
  console.debug(`Starting driver setup, reconfigure=${reconfigure}`);

  // workaround for web-configurator not picking up first response
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (reconfigure) {
    setupStep = SetupSteps.CONFIGURATION_MODE;

    // get all configured devices for the user to choose from
    const dropdownDevices: Array<{ id: string; label: { en: string } }> = [];
    for (const device of config.devices.all()) {
      dropdownDevices.push({
        id: device.id,
        label: { en: `${device.name} (${device.id} - ${device.address})` }
      });
    }

    // build user actions, based on available devices
    let selectedActionIndex = 0;
    const dropdownActions: Array<{
      id: string;
      label: {
        [key: string]: string;
      };
    }> = [
      {
        id: "add",
        label: { en: "Add a new device", de: "Neues Gerät hinzufügen" }
      }
    ];

    // add remove & reset actions if there's at least one configured device
    if (dropdownDevices.length > 0) {
      // pre-select configure action if at least one device exists
      selectedActionIndex = 1;
      dropdownActions.push({
        id: "configure",
        label: { en: "Configure selected device", de: "Selektiertes Gerät konfigurieren" }
      });

      dropdownActions.push({
        id: "remove",
        label: { en: "Delete selected device", de: "Selektiertes Gerät löschen" }
      });

      dropdownActions.push({
        id: "reset",
        label: { en: "Reset configuration and reconfigure", de: "Konfiguration zurücksetzen und neu konfigurieren" }
      });
    } else {
      // dummy entry if no devices are available
      dropdownDevices.push({ id: "", label: { en: "---" } });
    }

    return new uc.RequestUserInput({ en: "Configuration mode", de: "Konfigurations-Modus" }, [
      {
        field: {
          dropdown: {
            value: dropdownDevices[0].id,
            items: dropdownDevices
          }
        },
        id: "choice",
        label: { en: "Configured devices", de: "Konfigurierte Geräte" }
      },
      {
        field: {
          dropdown: {
            value: dropdownActions[selectedActionIndex].id,
            items: dropdownActions
          }
        },
        id: "action",
        label: { en: "Action", de: "Aktion" }
      }
    ]);
  }

  // Initial setup, make sure we have a clean configuration
  config.devices.clear(); // triggers device instance removal
  setupStep = SetupSteps.DISCOVER;
  return userInputDeviceSettings();
}

async function handleConfigurationMode(
  msg: uc.UserDataResponse
): Promise<uc.RequestUserInput | uc.SetupComplete | uc.SetupError> {
  const action = msg.inputValues["action"];

  // workaround for web-configurator not picking up first response
  await new Promise((resolve) => setTimeout(resolve, 1000));

  switch (action) {
    case "add":
      cfgAddDevice = true;
      break;
    case "remove": {
      const choice = msg.inputValues["choice"];
      if (!config.devices.remove(choice)) {
        console.warn(`Could not remove device from configuration: ${choice}`);
        return new uc.SetupError(uc.IntegrationSetupError.Other);
      }
      config.devices.store();
      return new uc.SetupComplete();
    }
    case "configure": {
      // Reconfigure device if the identifier has changed
      const choice = msg.inputValues["choice"];
      const selectedDevice = config.devices.get(choice);
      if (!selectedDevice) {
        console.warn(`Can not configure device from configuration: ${choice}`);
        return new uc.SetupError(uc.IntegrationSetupError.Other);
      }

      setupStep = SetupSteps.RECONFIGURE;
      reconfiguredDevice = selectedDevice;

      return userInputDeviceSettings();
    }
    case "reset":
      config.devices.clear(); // triggers device instance removal
      break;
    default:
      console.error(`Invalid configuration action: ${action}`);
      return new uc.SetupError(uc.IntegrationSetupError.Other);
  }

  setupStep = SetupSteps.DISCOVER;
  return userInputDeviceSettings();
}

async function handleDiscovery(msg: uc.UserDataResponse): Promise<uc.SetupComplete | uc.SetupError> {
  const address = msg.inputValues["address"];

  console.debug(`Starting manual driver setup for ${address}`);

  try {
    const deviceInfo = await dreambox.getDreamboxInfo(address);
    const existing = config.devices.get(deviceInfo.entityId);

    if (cfgAddDevice && existing) {
      console.warn(`Manually specified device is already configured ${address}: ${deviceInfo.name}`);
      // no better error code at the moment
      return new uc.SetupError(uc.IntegrationSetupError.Other);
    }

    const device = new config.DreamboxDevice(deviceInfo.entityId, deviceInfo.name, address);

    config.devices.addOrUpdate(device);

    console.info(`Setup successfully completed for ${device.name}`);
    return new uc.SetupComplete();
  } catch (error) {
    console.error(`Cannot connect to manually entered address ${address}: ${error}`);
    return new uc.SetupError(uc.IntegrationSetupError.ConnectionRefused);
  }
}

async function handleDeviceReconfigure(msg: uc.UserDataResponse): Promise<uc.SetupComplete | uc.SetupError> {
  if (reconfiguredDevice === null) {
    return new uc.SetupError();
  }

  const address = msg.inputValues["address"];

  console.debug("User has changed configuration");

  try {
    const deviceInfo = await dreambox.getDreamboxInfo(address);

    if (deviceInfo.entityId != reconfiguredDevice!.id) {
      console.error(
        `Dreambox mac address not matching. Original mac: ${reconfiguredDevice!.id} New mac: ${deviceInfo.entityId}`
      );
      return new uc.SetupError(uc.IntegrationSetupError.Other);
    }

    reconfiguredDevice!.address = msg.inputValues["address"];
    config.devices.update(reconfiguredDevice!);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.info("Setup successfully completed for %s", reconfiguredDevice!.name);

    return new uc.SetupComplete();
  } catch (error) {
    console.error(`Cannot connect to manually entered address ${address}: ${error}`);
    return new uc.SetupError(uc.IntegrationSetupError.ConnectionRefused);
  }
}

const driverSetupHandler = async function (msg: any): Promise<uc.SetupAction> {
  if (msg instanceof uc.DriverSetupRequest) {
    setupStep = SetupSteps.INIT;
    reconfiguredDevice = undefined;
    cfgAddDevice = false;
    return await handleDriverSetup(msg);
  }

  if (msg instanceof uc.UserDataResponse) {
    console.debug("UserDataResponse: %s %s", msg, setupStep);

    if (setupStep == SetupSteps.CONFIGURATION_MODE && "action" in msg.inputValues) {
      return await handleConfigurationMode(msg);
    }

    if (setupStep == SetupSteps.DISCOVER && "address" in msg.inputValues) {
      return await handleDiscovery(msg);
    }

    if (setupStep == SetupSteps.RECONFIGURE) {
      return await handleDeviceReconfigure(msg);
    }

    console.error("No or invalid user response was received: %s", msg);
  } else if (msg instanceof uc.AbortDriverSetup) {
    console.info("Setup was aborted with code: %s", msg.error);
    setupStep = SetupSteps.INIT;
  }

  return new uc.SetupError();
};

export { driverSetupHandler };
