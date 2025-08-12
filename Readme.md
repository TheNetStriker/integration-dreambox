# Dreambox integration for Unfolded Circle Remote Two and 3

The driver lets you control one Dreambox via network using the Unfolded Circle Remote Two and 3.

## Installation

### Installation on the Remote (recommended)

- Download the release from the release section : file ending with `.tar.gz`
- Navigate into the Web Configurator of the remote, go into the `Integrations` tab, click on `Add new` and select : `Install custom`
- Select the downloaded `.tar.gz` file and click on upload
- Once uploaded, the new integration should appear in the list : click on it and select `Start setup`
- Your TV must be running and connected to the network before proceed

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
