# Ecosystem boundaries

Campus has independent Supabase, auth, data and deployment. Workspace sessions are not Campus identity; never import its credentials or database.

The desktop sidebar and mobile drawer provide a normal same-tab link to https://www.syrka.co/workspace under Syrka Apps. It transfers no credentials, adds no API dependency and leaves Workspace authentication independent.

Workspace documents can currently be linked as HTTPS external course resources. This is an ordinary link, not an API integration or access grant. Authors must independently configure Workspace permissions.

Future integrations require published versioned APIs, explicit issuer/audience checks, short-lived scoped credentials and institutional consent. Store institution-scoped external identifiers instead of copying document internals. Do not render external HTML as trusted Campus content.

Passport credentials require institution-verified outcomes, a documented credential format, authorized issuance/revocation and an audit trail. Grades do not automatically become credentials.

No shared SSO, document creation, Tables automation, Present integration or Passport issuance exists in this milestone.
