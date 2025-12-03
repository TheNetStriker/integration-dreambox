# Dreambox/Enigma2 integration for Unfolded Circle Remote Two and 3

The driver lets you control multiple Dreambox/Enigma2 devices via network using the Unfolded Circle Remote Two and 3.

## Commands

### Supported commands

| Name              | Id  |
| ----------------- | --- |
| POWER             | 116 |
| 1                 | 2   |
| 2                 | 3   |
| 3                 | 4   |
| 4                 | 5   |
| 5                 | 6   |
| 6                 | 7   |
| 7                 | 8   |
| 8                 | 9   |
| 9                 | 10  |
| 0                 | 11  |
| PREVIOUS          | 412 |
| NEXT              | 407 |
| VOLUME_UP         | 115 |
| VOLUME_DOWN       | 114 |
| MUTE              | 113 |
| BOUQUET_UP        | 402 |
| BOUQUET_DOWN      | 403 |
| BACK              | 174 |
| INFO              | 358 |
| CURSOR_UP         | 103 |
| CURSOR_DOWN       | 108 |
| CURSOR_LEFT       | 105 |
| CURSOR_RIGHT      | 106 |
| MENU              | 139 |
| OK                | 352 |
| HELP              | 138 |
| AUDIO             | 392 |
| VIDEO             | 393 |
| RED               | 398 |
| GREEN             | 399 |
| YELLOW            | 400 |
| BLUE              | 401 |
| REWIND            | 165 |
| PLAY              | 207 |
| STOP              | 128 |
| FORWARD           | 163 |
| TV                | 377 |
| RADIO             | 385 |
| TEXT              | 388 |
| RECORD            | 167 |
| EXIT              | 1   |
| PLAYPAUSE         | 164 |
| TIMESHIFT         | 119 |
| SUBTITLE          | 370 |
| SETTINGS_MENU     | 141 |
| TIMER             | 359 |
| FAVORITE_BOUQUETS | 364 |
| EPG               | 365 |
| PLUGIN_BROWSER    | 394 |

### Custom commands

Custom commands can be sent with `SEND COMMAND` or `COMMAND SEQUENCE` by just setting the command name or id as the command parameter.

If a command is not listed in the table above, you can add use `SEND COMMAND` with the command id as the parameter. If you would like that the command will be added to the library please create an issue here.

Please note that the numeric commands from 0 to 9 are recognized as the numbers from 0 to 9 and not the actual command id is sent. So for the `EXIT` command you must use the text `EXIT` as the command parameter instead of entering the command id `1`.

Command sequences can be used to switch to a specific channel. For example to switch to channel `123` you can use `1,2,3,OK` as the command sequence parameter.

## Installation

### Installation on the Remote (recommended)

- Download the release from the release section : file ending with `.tar.gz`
- Navigate into the Web Configurator of the remote, go into the `Integrations` tab, click on `Add new` and select : `Install custom`
- Select the downloaded `.tar.gz` file and click on upload
- Once uploaded, the new integration should appear in the list : click on it and select `Start setup`
- Your TV must be running and connected to the network before proceed

#### Update on the Remote

To update to the lastest version of the remote follow these steps:

- Delete the integration from the remote. If entities where already added the integration has to be deleted twice.
- Wait for the integration to dissapear.
- Download the release from the release section : file ending with `.tar.gz`
- Navigate into the Web Configurator of the remote, go into the `Integrations` tab, click on `Add new` and select : `Install custom`
- Select the downloaded `.tar.gz` file and click on upload
- Once the integration shows wait for a few seconds then start the setup.
- The setup will automatically recognize if a previous configuration exists and skip the Matter setup step.

### Running as Docker container

To start the integration as a docker container just download the code and execute `docker compose up -d` in the root directory. This will automatically build the docker image and start the integration.

### Icons

The integration uses custom icons for the color buttons that can be found in the icons folder. If you want to see the colored buttons just upload all 4 files as custom images on the remote.

### Run

The integration can be started using Visual Studio code debugger.

### Access

After startup, the integration is available at `http://localhost:9090` and can be configured in Remote Two/Three.

## License

This project is licensed under the [**Mozilla Public License 2.0**](https://choosealicense.com/licenses/mpl-2.0/).
See the [LICENSE](LICENSE) file for details.
