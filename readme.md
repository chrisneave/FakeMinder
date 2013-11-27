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

1. Clone this repository.
2. Install package dependencies using: `npm install`
3. Start the server using: `node main.js`

## Running Tests

## Code Coverage

Install Instanbul into your global packages using:

`npm install instanbul -g`

Then execute the npm script *coverage* using the following command:

`npm run-script coverage`

The results of the coverage test run will now be displayed in your default browser.

## Contributing

I'm not actively looking for contributions but if you feel there can be improvements made or you find  a bug please fork and submit a pull request.
