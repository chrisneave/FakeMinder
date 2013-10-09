# FakeMinder

A fake implementation of CA SiteMinder to enable easy development against SiteMinder in a non-SiteMinder enabled test environment.

## Motivation

My own desire to mock SiteMinder to test my own custom implementations of login and change password changes.

### Block access to protected URI

Configure protected URI
Check for SMSESSION cookie
Redirect to configured URI for authentication failure.

### Authentication

Accept form post containing:
- USER
- PASSWORD
- TARGET
Validate USER and PASSWORD against configured user.
Redirect to TARGET. Repond with 302.
Assign SMSESSION cookie and track against user.

### Allow access to protected URI

Configure protected URI
Check for SMSESSION cookie
Assign HTTP headers mapped to user's identity.
Forward request to protected site.

### Redirect on change temporary password

Accept form post containing:
- USER
- PASSWORD
- TARGET
Validate USER and PASSWORD against configured user.
Redirect to TARGET URL.
Detect temporary password.
Redirect to configured change password URL.

### Accept change password request

Accept form post containing:
- USERNAME
- PASSWORD
- NEWPASSWORD
- CONFIRMATION
Validate form post values and redirect to TARGET.
