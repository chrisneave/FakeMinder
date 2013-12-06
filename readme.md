# FakeMinder

A fake implementation of CA's SiteMinder product that enables easy development of your SiteMinder integrated application without installing SiteMinder on your development environment.

Runs as a reverse proxy using the fabulous node-http-proxy library and injects custom logic to protect a target site, handle login and manage SM session state.

## Motivation

Because testing an application that integrates with SiteMinder is hard if you cannot deploy SiteMinder to all of your development and test environments.

Because this is my first Node.js project and it seemed like a good fit for learning Node!

*DISCLAIMER*
This software is in no way affiliated with or intends to be a representation of SiteMinder. Its intended use is limited to a mock version of the application for testing purposes only. This software does not intend to replicate any production ready functionality found in SiteMinder.

## Features

### Block access to a protected folder

- Configure protected folder in config.json.
- Validate presence of SMSESSION cookie.
- Redirect to configured URL for custom authentication error handling.

### Authentication

- Intercept and handle POST requests to a configured login FCC.
- Redirect to the TARGET after credential validation.
- Assign a FORMCRED cookie to track credential validation results.
- Redirect custom URLs for handling login failures.

## Other Behaviors

- Re-writes URLs in Location headers when the target application sends a 302 redirect to the client.

## Coming Soon

- Support for change password logic using smpwservices.fcc.

## Installation

`npm install fakeminder -g`

It is preferable to install the package to your global store so you can use the command line interface.

## Usage

### Viewing help

View command line help using:

`fakeminder --help`

or

`fakeminder -h`

### Starting a new instance of the server

Start an instance of the server using:

`fakeminder start <config_file>`

Where `<config_file>` is the configuration file to use. Defaults to using the config.json in the project root folder.

### Creating a new configuration file from the command line

Use a series of command line prompts to create a new configuration file using:

`fakeminder create`

Follow the instructions onscreen and FakeMinder will save the results to a new configuration JSON file.

## Running Tests

Unit tests are written using Mocha and can be run using the standard command:

`mocha`

Integration tests are executed using PhantomJS and CasperJS.

1. Start FakeMinder using: `node main.js`
2. Start the sample app using: `npm run-script run-sample`
3. Execute the tests using: `casperjs test ./sample_target/test/*.js`

## Code Coverage

Install Instanbul into your global packages using:

`npm install instanbul -g`

Then execute the npm script *coverage* using the following command:

`npm run-script coverage`

The results of the coverage test run will now be displayed in your default browser.

## Contributing

I'm not actively looking for contributions but if you feel there can be improvements made or you find  a bug please fork and submit a pull request. For bugs please also raise an issue on the Github project site.
