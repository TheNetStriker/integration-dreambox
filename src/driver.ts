import * as uc from "@unfoldedcircle/integration-api";
import { Entities } from "@unfoldedcircle/integration-api/dist/mjs/lib/entities/entities.js";

import * as pages from "./pages.js";
import * as dreambox from "./dreambox.js";
import * as config from "./config.js";
import { driverSetupHandler } from "./setup_flow.js";

const driver = new uc.IntegrationAPI();

/**
 * Configured Dreambox devices.
 * @type {Map<string, DreamboxDevice>}
 */
const configuredDevices = new Map<string, config.DreamboxDevice>();
const subscribedEntities = new Map<string, boolean>();
let pollingInterval: NodeJS.Timeout;

driver.on(uc.Events.Connect, async () => {
  await driver.setDeviceState(uc.DeviceStates.Connected);
});

driver.on(uc.Events.Disconnect, async () => {
  await driver.setDeviceState(uc.DeviceStates.Disconnected);
});

driver.on(uc.Events.EnterStandby, async () => {
  console.debug("Enter standby event: disable polling");
  clearInterval(pollingInterval);
});

driver.on(uc.Events.ExitStandby, async () => {
  console.debug("Enter standby event: enable polling");
  startPolling();
});

driver.on(uc.Events.SubscribeEntities, async (entityIds: string[]) => {
  entityIds.forEach((entityId: string) => {
    subscribedEntities.set(entityId, true);
    console.debug(`Subscribed entity: ${entityId}`);
  });
});

driver.on(uc.Events.UnsubscribeEntities, async (entityIds: string[]) => {
  entityIds.forEach((entityId: string) => {
    subscribedEntities.set(entityId, false);
    console.debug(`Unsubscribed entity: ${entityId}`);
  });
});

function processDreamboxCommandResult(result: dreambox.DreamboxCommandResult<any> | null): uc.StatusCodes {
  if (result) {
    if (result.entityState) {
      driver.updateEntityAttributes(result.entityId, {
        [result.entityStateType]: result.entityState
      });
    }

    if (result.error) {
      console.error(result.error);
    }

    return result.statusCode;
  }

  return uc.StatusCodes.NotFound;
}

function remoteSendCommand(
  device: config.DreamboxDevice,
  command: string
): Promise<dreambox.DreamboxCommandResult<any>> {
  if (command == "DOWNMIX_ON") {
    return dreambox.sendDownmixState(device, uc.RemoteCommands.On);
  } else if (command == "DOWNMIX_OFF") {
    return dreambox.sendDownmixState(device, uc.RemoteCommands.Off);
  } else if (command == "DOWNMIX_TOGGLE") {
    return dreambox.sendDownmixState(device, uc.RemoteCommands.Toggle);
  } else {
    return dreambox.sendRemoteCommand(device, dreambox.RC_DREAMBOX_MAP[command]);
  }
}

/**
 * Dreambox remote command handler.
 *
 * Called by the integration-API if a command is sent to a configured entity.
 *
 * @param entity button entity
 * @param cmdId command
 * @param params optional command parameters
 * @return status of the command
 */
const remoteCmdHandler: uc.CommandHandler = async function (
  entity: uc.Entity,
  cmdId: string,
  params?: {
    [key: string]: string | number | boolean | string[];
  }
): Promise<uc.StatusCodes> {
  let device = configuredDevices.get(entity.id);
  let result: dreambox.DreamboxCommandResult<any> | null = null;

  if (device) {
    switch (cmdId) {
      case uc.RemoteCommands.On:
      case uc.RemoteCommands.Off:
        result = await dreambox.sendPowerState(device, cmdId);
        break;
      case uc.RemoteCommands.Toggle:
        result = await dreambox.sendRemoteCommand(device, dreambox.RC_DREAMBOX_MAP["POWER"]);
        break;
      case uc.RemoteCommands.SendCmd: {
        if (params && typeof params.command === "string") {
          const repeat: number = Number(params.repeat) || 1;

          for (let i = 0; i < repeat; i++) {
            result = await remoteSendCommand(device, params.command);

            if (result.statusCode != uc.StatusCodes.Ok) {
              return processDreamboxCommandResult(result);
            }
          }
        } else {
          console.error("Command argument missing.");
        }
        break;
      }
      case uc.RemoteCommands.SendCmdSequence: {
        if (params && Array.isArray(params.sequence) && typeof params.delay === "number") {
          // const seqRepeat = params.repeat || 1;
          const seqDelay = params.delay || 0;

          for (const command of params.sequence) {
            result = await remoteSendCommand(device, command);

            if (result.statusCode != uc.StatusCodes.Ok) {
              return processDreamboxCommandResult(result);
            }

            await new Promise((resolve) => setTimeout(resolve, seqDelay));
          }
        } else {
          console.error("Command sequence argument missing.");
        }
        break;
      }
      default:
        console.error(`Unsupported command: ${cmdId}`);
    }
  }

  return processDreamboxCommandResult(result);
};

const supportedCommands = Object.keys(dreambox.RC_DREAMBOX_MAP);

supportedCommands.push("DOWNMIX_ON");
supportedCommands.push("DOWNMIX_OFF");
supportedCommands.push("DOWNMIX_TOGGLE");

const createButtonMappings = () => {
  return [
    uc.ui.createBtnMapping(uc.ui.Buttons.Home, "MENU"),
    uc.ui.createBtnMapping(uc.ui.Buttons.Back, "BACK"),
    uc.ui.createBtnMapping(uc.ui.Buttons.ChannelUp, "BOUQUET_UP"),
    uc.ui.createBtnMapping(uc.ui.Buttons.ChannelDown, "BOUQUET_DOWN"),
    uc.ui.createBtnMapping(uc.ui.Buttons.VolumeDown, "VOLUME_DOWN"),
    uc.ui.createBtnMapping(uc.ui.Buttons.VolumeUp, "VOLUME_UP"),
    uc.ui.createBtnMapping(uc.ui.Buttons.Mute, "MUTE"),
    uc.ui.createBtnMapping(uc.ui.Buttons.Prev, "PREVIOUS"),
    uc.ui.createBtnMapping(uc.ui.Buttons.Play, "PLAY"),
    uc.ui.createBtnMapping(uc.ui.Buttons.Next, "NEXT"),
    uc.ui.createBtnMapping(uc.ui.Buttons.DpadUp, "CURSOR_UP"),
    uc.ui.createBtnMapping(uc.ui.Buttons.DpadDown, "CURSOR_DOWN"),
    uc.ui.createBtnMapping(uc.ui.Buttons.DpadLeft, "CURSOR_LEFT"),
    uc.ui.createBtnMapping(uc.ui.Buttons.DpadRight, "CURSOR_RIGHT"),
    uc.ui.createBtnMapping(uc.ui.Buttons.DpadMiddle, "OK"),
    uc.ui.createBtnMapping(uc.ui.Buttons.Red, "RED"),
    uc.ui.createBtnMapping(uc.ui.Buttons.Green, "GREEN"),
    uc.ui.createBtnMapping(uc.ui.Buttons.Yellow, "YELLOW"),
    uc.ui.createBtnMapping(uc.ui.Buttons.Blue, "BLUE"),
    uc.ui.createBtnMapping(uc.ui.Buttons.Power, "POWER")
  ];
};

const createUi = () => {
  return [pages.MAIN_PAGE, pages.KEYPAD_PAGE];
};

async function addConfiguredDevice(device: config.DreamboxDevice) {
  configuredDevices.set(device.id, device);

  let remoteState = uc.RemoteStates.Unknown;
  let powerResult = await dreambox.getPowerState(device);

  if (powerResult.statusCode == uc.StatusCodes.Ok && powerResult.entityState) {
    remoteState = powerResult.entityState;
  }

  if (powerResult.error) {
    console.error(powerResult.error);
  }

  const remoteEntity = new uc.Remote(device.id, device.name, {
    features: [uc.RemoteFeatures.OnOff, uc.RemoteFeatures.Toggle],
    attributes: { [uc.RemoteAttributes.State]: remoteState },
    simpleCommands: supportedCommands,
    buttonMapping: createButtonMappings(),
    uiPages: createUi(),
    cmdHandler: remoteCmdHandler
  });

  driver.addAvailableEntity(remoteEntity);
}

/**
 * Handle a newly added device in the configuration.
 * @param {DreamboxDevice} device
 */
function onDeviceAdded(device: config.DreamboxDevice | null) {
  if (device) {
    console.debug("New device added:", JSON.stringify(device));
    addConfiguredDevice(device);
  }
}

/**
 * Handle a removed device in the configuration.
 * @param {DreamboxDevice} device
 */
function onDeviceRemoved(device: config.DreamboxDevice | null) {
  /** Handle a removed device in the configuration. */
  if (device === null) {
    console.debug("Configuration cleared, disconnecting & removing all configured AVR instances");
    configuredDevices.clear();
    driver.clearConfiguredEntities();
    driver.clearAvailableEntities();
  } else {
    if (configuredDevices.has(device.id)) {
      configuredDevices.delete(device.id);
      driver.getConfiguredEntities().removeEntity(device.id);
      driver.getAvailableEntities().removeEntity(device.id);
    }
  }
}

async function refreshEntityState(entities: Entities, device: config.DreamboxDevice, entityId: string) {
  let entityState = entities.getEntity(entityId)?.attributes?.state;
  let dreamboxResult = await dreambox.getPowerState(device);

  if (dreamboxResult.entityState != undefined && entityState != dreamboxResult.entityState) {
    driver.updateEntityAttributes(dreamboxResult.entityId, {
      [dreamboxResult.entityStateType]: dreamboxResult.entityState
    });
  }
}

function startPolling() {
  pollingInterval = setInterval(function () {
    let entities = driver.getConfiguredEntities();

    configuredDevices.forEach(async (device) => {
      if (subscribedEntities.get(device.id)) {
        refreshEntityState(entities, device, device.id);
      }
    });
  }, 60000);
}

async function main() {
  let dataDirPath = process.env.UC_DATA_HOME || "./";
  // load configured devices
  config.devices.init(dataDirPath, onDeviceAdded, onDeviceRemoved);

  for (const device of config.devices.all()) {
    addConfiguredDevice(device);
  }

  driver.init("driver.json", driverSetupHandler);

  startPolling();

  const info = driver.getDriverVersion();
  console.info("Dreambox integration %s started", info.version.driver);
}

// Execute the main function if the module is run directly
if (import.meta.url === new URL("", import.meta.url).href) {
  await main();
}
