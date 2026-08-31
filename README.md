# LinkedIn Profile Identifier API

Install dependencies and start the service:

```powershell
npm.cmd install
npm.cmd start
```

Send a `POST` request to `https://challenge-z1of.onrender.com/api/profile-identifier` with JSON:

```json
{
  "profileUrl": "https://www.linkedin.com/in/vamsidhar-kalaga-7738b8230/"
}
```

Successful response:

```json
{
  "success": true,
  "profileIdentifier": "vamsidhar-kalaga-7738b8230"
  "profileData": ....
}
```

The endpoint returns `400 Bad Request` when `profileUrl` is missing or is not a LinkedIn `/in/<identifier>` profile URL.
