import fs from "fs";
import path from "path";

const CFG_FILENAME = "dreambox_config.json";

class DreamboxDevice {
  id: string;
  name: string;
  address: string;

  /**
   * Dreambox device configuration.
   * @param {string} id Unique id of the device.
   * @param {string} name Friendly name of the device.
   * @param {string} address IP address of the device.
   */
  constructor(id: string, name: string, address: string) {
    this.id = id;
    this.name = name;
    this.address = address;
  }
}

/**
 * Integration driver configuration class. Manages all configured Dreambox devices.
 */
class Devices {
  #config: DreamboxDevice[] = [];
  #dataPath = "";
  #cfgFilePath = "";
  #addHandler: ((dreamboxDevice: DreamboxDevice | null) => void) | null = null;
  #removeHandler: ((dreamboxDevice: DreamboxDevice | null) => void) | null = null;

  /**
   * Return the configuration path.
   * @return {string}
   */
  get dataPath() {
    return this.#dataPath;
  }

  /**
   * Initialize devices from configuration file.
   *
   * @param {string} dataPath Configuration path for the configuration file.
   * @return true if configuration could be loaded, false otherwise.
   */
  init(
    dataPath: string,
    addHandler: (dreamboxDevice: DreamboxDevice | null) => void,
    removeHandler: (dreamboxDevice: DreamboxDevice | null) => void
  ) {
    this.#dataPath = dataPath;
    this.#cfgFilePath = path.join(dataPath, CFG_FILENAME);
    this.#addHandler = addHandler;
    this.#removeHandler = removeHandler;
    return this.load();
  }

  /**
   * Get all device configurations.
   * @return {Array<DreamboxDevice>}
   */
  all() {
    return this.#config;
  }

  /**
   * Check if there's a device with the given device identifier.
   * @param {string} gcId device identifier
   * @return {boolean}
   */
  contains(gcId: string) {
    return this.#config.some((item) => item.id === gcId);
  }

  /**
   * Add a new configured Global Caché device and persist configuration.
   *
   * The device is updated if it already exists in the configuration.
   * @param {GcDevice} device
   */
  addOrUpdate(device: DreamboxDevice) {
    if (!this.update(device)) {
      this.#config.push(device);
      this.store();
      if (this.#addHandler) {
        this.#addHandler(device);
      }
    }
  }

  /**
   * Get device configuration for given identifier.
   * @param {string} gcId device identifier
   * @return {GcDevice|undefined}
   */
  get(gcId: string) {
    return this.#config.find((item) => item.id === gcId);
  }

  /**
   * Update a configured Global Caché device and persist configuration.
   * @param {GcDevice} device
   */
  update(device: DreamboxDevice) {
    const index = this.#config.findIndex((item) => item.id === device.id);
    if (index !== -1) {
      this.#config[index] = { ...this.#config[index], ...device };
      this.store();
      return true;
    }
    return false;
  }

  /**
   * Remove the given device configuration.
   * @param {string} gcId device identifier
   * @return {boolean}
   */
  remove(gcId: string) {
    const index = this.#config.findIndex((item) => item.id === gcId);
    if (index !== -1) {
      const [removedDevice] = this.#config.splice(index, 1);
      if (this.#removeHandler) {
        this.#removeHandler(removedDevice);
      }
      return true;
    }
    return false;
  }

  /**
   * Clear configuration and remove configuration file.
   */
  clear() {
    this.#config = [];
    if (fs.existsSync(this.#cfgFilePath)) {
      fs.unlink(this.#cfgFilePath, (e) => {
        if (e) {
          console.error("Could not delete configuration file. %s", e);
        }
      });
    }
    if (this.#removeHandler) {
      this.#removeHandler(null);
    }
  }

  /**
   * Store the configuration file.
   * @return {boolean} true if the configuration could be saved.
   */
  store() {
    try {
      fs.writeFileSync(this.#cfgFilePath, JSON.stringify(this.#config), "utf-8");
      return true;
    } catch (err) {
      console.error("Cannot write the config file:", err);
      return false;
    }
  }

  /**
   * Load the configuration from the configuration file.
   * @return {boolean} true if the configuration could be loaded.
   */
  load() {
    if (!fs.existsSync(this.#cfgFilePath)) {
      console.info("No configuration file found, using empty configuration.");
      this.#config.length = 0;
      return false;
    }
    try {
      const json = JSON.parse(fs.readFileSync(this.#cfgFilePath, "utf8"));

      this.#config = json.map((item: any) => {
        return new DreamboxDevice(item.id, item.name, item.address);
      });
      return true;
    } catch (err) {
      console.error("Cannot open the config file: %s", err);
      return false;
    }
  }
}

const devices = new Devices();

export { DreamboxDevice, devices };
