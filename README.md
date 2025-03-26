# brad

Discord bot that manages user nicknames and roles on the VEX Worlds server.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

- [Node.js](https://nodejs.org/)

### Environment Variables

|         Variable         | Required |    Default    |                 Description                 |
| :----------------------: | :------: | :-----------: | :-----------------------------------------: |
|     `ADMIN_ROLE_ID`      |    ✓     |               |    Id of the administrator Discord role     |
|     `DISCORD_TOKEN`      |    ✓     |               | Token of the Discord account to log in with |
| `NEW_MEMBERS_CHANNEL_ID` |    ✓     |               |    Id of the new members Discord channel    |
|   `ROBOT_EVENTS_TOKEN`   |    ✓     |               |           Robot Events API token            |
|    `RULES_CHANNEL_ID`    |    ✓     |               |       Id of the rules Discord channel       |
|       `SERVER_ID`        |    ✓     |               |          Id of the Discord server           |
|    `VEX_WORLDS_FILE`     |    ✓     |               |  Path to the VEX Worlds configuration file  |
|       `LOG_LEVEL`        |          |    `INFO`     |              Minimum log level              |
|        `NODE_ENV`        |          | `development` |       Node.JS application environment       |

### Installing

Install dependencies

```sh
npm install
```

Start the bot

```sh
npm run dev
```

## Deployment

Install dependencies

```sh
npm install
```

Compile source

```sh
npm run build
```

Start the bot

```sh
npm start
```

## Versioning

We use [SemVer](https://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/jtkiesel/brad/tags).

## Authors

- **Jordan Kiesel** - [LinkedIn](https://www.linkedin.com/in/jtkiesel/)

See also the list of [contributors](https://github.com/jtkiesel/brad/contributors) who participated in this project.

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
