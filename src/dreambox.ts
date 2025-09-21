import * as uc from "@unfoldedcircle/integration-api";
import { XMLParser } from "fast-xml-parser";

import * as config from "./config.js";

const RC_DREAMBOX_MAP: Record<string, number> = {
  POWER: 116,
  "1": 2,
  "2": 3,
  "3": 4,
  "4": 5,
  "5": 6,
  "6": 7,
  "7": 8,
  "8": 9,
  "9": 10,
  "0": 11,
  PREVIOUS: 412,
  NEXT: 407,
  VOLUME_UP: 115,
  VOLUME_DOWN: 114,
  MUTE: 113,
  BOUQUET_UP: 402,
  BOUQUET_DOWN: 403,
  BACK: 174,
  INFO: 358,
  CURSOR_UP: 103,
  CURSOR_DOWN: 108,
  CURSOR_LEFT: 105,
  CURSOR_RIGHT: 106,
  MENU: 139,
  OK: 352,
  HELP: 138,
  VIDEO: 393,
  RED: 398,
  GREEN: 399,
  YELLOW: 400,
  BLUE: 401,
  REWIND: 168,
  PLAY: 207,
  STOP: 128,
  FORWARD: 159,
  TV: 377,
  RADIO: 385,
  TEXT: 388,
  RECORD: 167
};

class DreamboxInfoResult {
  name: string;
  macAddress: string;
  entityId: string;

  constructor(name: string, macAddress: string) {
    this.name = name;
    this.macAddress = macAddress;
    this.entityId = `remote-${macAddress.replaceAll(":", "")}`;
  }
}

class DreamboxCommandResult<EntityStateType> {
  entityId: string;
  entityStateType: string;
  statusCode: uc.StatusCodes;
  entityState: EntityStateType;
  error: any;

  constructor(
    entityId: string,
    entityStateType: string,
    statusCode: uc.StatusCodes,
    entityState: EntityStateType,
    error: any = undefined
  ) {
    this.entityId = entityId;
    this.entityStateType = entityStateType;
    this.statusCode = statusCode;
    this.entityState = entityState;
    this.error = error;
  }
}

function getFetchOptions(username: string, password: string) {
  const options: {
    method: string;
    headers: { [key: string]: string };
  } = {
    method: "GET",
    headers: {
      Accept: "application/xml"
    }
  };

  if (username && password) {
    const token = Buffer.from(`${username}:${password}`).toString("base64");
    options.headers["Authorization"] = `Basic ${token}`;
  }

  return options;
}

async function getDreamboxInfo(deviceAddress: string, username: string, password: string): Promise<DreamboxInfoResult> {
  const url = `http://${deviceAddress}/web/deviceinfo`;
  const options = getFetchOptions(username, password);
  return new Promise(function (resolve, reject) {
    fetch(url, options)
      .then(async (response) => {
        if (response.status == 200) {
          const responseText = await response.text();
          const xmlParser = new XMLParser();
          const xmlData = xmlParser.parse(responseText);
          const deviceName = xmlData["e2deviceinfo"]["e2devicename"];
          const macAddress = xmlData["e2deviceinfo"]["e2network"]["e2interface"]["e2mac"];

          resolve(new DreamboxInfoResult(deviceName, macAddress));
        } else {
          reject(`Response code ${response.status}`);
        }
      })
      .catch((error) => {
        reject(`Response error ${error}`);
      });
  });
}

async function getDreamboxPromise<StateType>(
  url: string,
  username: string,
  password: string,
  entityId: string,
  entityStateType: string,
  xmlRoot: string,
  xmlChild: string,
  positiveXmlValue: any,
  positiveStatusCode: uc.StatusCodes,
  negativeStatusCode: uc.StatusCodes,
  positiveEntityState: StateType | undefined,
  negativeEntityState: StateType | undefined
): Promise<DreamboxCommandResult<StateType | undefined>> {
  const options = getFetchOptions(username, password);
  return new Promise(function (resolve, reject) {
    fetch(url, options)
      .then(async (response) => {
        if (response.status == 200) {
          const responseText = await response.text();
          const xmlParser = new XMLParser();
          const xmlData = xmlParser.parse(responseText);
          const result = xmlData[xmlRoot][xmlChild];

          if (positiveXmlValue == undefined || result == positiveXmlValue) {
            resolve(new DreamboxCommandResult(entityId, entityStateType, positiveStatusCode, positiveEntityState));
          } else {
            resolve(new DreamboxCommandResult(entityId, entityStateType, negativeStatusCode, negativeEntityState));
          }
        } else {
          resolve(
            new DreamboxCommandResult(
              entityId,
              entityStateType,
              uc.StatusCodes.ServerError,
              undefined,
              `Response code ${response.status}`
            )
          );
        }
      })
      .catch((error) => {
        resolve(new DreamboxCommandResult(entityId, entityStateType, uc.StatusCodes.ServerError, undefined, error));
      });
  });
}

const sendRemoteCommand = async function (
  device: config.DreamboxDevice,
  commandId: number
): Promise<DreamboxCommandResult<uc.RemoteStates | undefined>> {
  const url = `http://${device.address}/web/remotecontrol?command=${commandId}`;
  return getDreamboxPromise<uc.RemoteStates>(
    url,
    device.username,
    device.password,
    device.id,
    uc.RemoteAttributes.State,
    "e2remotecontrol",
    "e2result",
    "True",
    uc.StatusCodes.Ok,
    uc.StatusCodes.ServerError,
    undefined,
    undefined
  );
};

const sendPowerState = async function (
  device: config.DreamboxDevice,
  remoteCommand: uc.RemoteCommands
): Promise<DreamboxCommandResult<uc.RemoteStates | undefined>> {
  const powerStateQueryParamValue = remoteCommand == uc.RemoteCommands.On ? 4 : 5;
  const url = `http://${device.address}/web/powerstate?newstate=${powerStateQueryParamValue}`;
  // For some reason Dreambox is not always returning the correct standby value when setting power.
  // Ignoring the expected value here.
  return getDreamboxPromise<uc.RemoteStates | undefined>(
    url,
    device.id,
    device.username,
    device.password,
    uc.RemoteAttributes.State,
    "e2powerstate",
    "e2instandby",
    undefined,
    uc.StatusCodes.Ok,
    uc.StatusCodes.ServerError,
    remoteCommand == uc.RemoteCommands.On ? uc.RemoteStates.On : uc.RemoteStates.Off,
    uc.RemoteStates.Unknown
  );
};

const getPowerState = async function (
  device: config.DreamboxDevice
): Promise<DreamboxCommandResult<uc.RemoteStates | undefined>> {
  const url = `http://${device.address}/web/powerstate`;
  return getDreamboxPromise<uc.RemoteStates | undefined>(
    url,
    device.username,
    device.password,
    device.id,
    uc.RemoteAttributes.State,
    "e2powerstate",
    "e2instandby",
    true,
    uc.StatusCodes.Ok,
    uc.StatusCodes.Ok,
    uc.RemoteStates.Off,
    uc.RemoteStates.On
  );
};

const sendDownmixState = async function (
  device: config.DreamboxDevice,
  remoteCommand: uc.RemoteCommands.On | uc.RemoteCommands.Off | uc.RemoteCommands.Toggle
): Promise<DreamboxCommandResult<uc.SwitchStates | undefined>> {
  let downmixStateQueryParamValue = undefined;

  switch (remoteCommand) {
    case uc.RemoteCommands.On:
      downmixStateQueryParamValue = "True";
      break;
    case uc.RemoteCommands.Off:
      downmixStateQueryParamValue = "False";
      break;
    case uc.RemoteCommands.Toggle:
      let currentDownmixResult = await getDownmixState(device);

      if (currentDownmixResult.entityState == undefined) {
        return currentDownmixResult;
      }

      downmixStateQueryParamValue = currentDownmixResult.entityState == uc.SwitchStates.On ? "False" : "True";
      break;
  }

  const url = `http://${device.address}/web/downmix?enable=${downmixStateQueryParamValue}`;

  return getDreamboxPromise<uc.SwitchStates | undefined>(
    url,
    device.username,
    device.password,
    device.id,
    uc.SwitchAttributes.State,
    "e2simplexmlresult",
    "e2state",
    "True",
    uc.StatusCodes.Ok,
    uc.StatusCodes.Ok,
    uc.SwitchStates.On,
    uc.SwitchStates.Off
  );
};

const getDownmixState = async function (
  device: config.DreamboxDevice
): Promise<DreamboxCommandResult<uc.SwitchStates | undefined>> {
  const url = `http://${device.address}/web/downmix`;
  return getDreamboxPromise<uc.SwitchStates | undefined>(
    url,
    device.username,
    device.password,
    device.id,
    uc.SwitchAttributes.State,
    "e2simplexmlresult",
    "e2state",
    "True",
    uc.StatusCodes.Ok,
    uc.StatusCodes.Ok,
    uc.SwitchStates.On,
    uc.SwitchStates.Off
  );
};

export {
  RC_DREAMBOX_MAP,
  DreamboxInfoResult,
  DreamboxCommandResult,
  getDreamboxInfo,
  sendRemoteCommand,
  sendPowerState,
  getPowerState,
  sendDownmixState,
  getDownmixState
};
