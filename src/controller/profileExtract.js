const { getProfileInformation, authenticateUser } = require('../services/linkedInApiClient');

function getProfileIdentifier(profileUrl) {
  if (typeof profileUrl !== 'string' || !profileUrl.trim()) {
    return null;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(profileUrl.trim());
  } catch {
    return null;
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (hostname !== 'linkedin.com' && hostname !== 'www.linkedin.com') {
    return null;
  }

  const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
  if (pathSegments.length !== 2 || pathSegments[0].toLowerCase() !== 'in') {
    return null;
  }

  return pathSegments[1];
}

async function extractProfileIdentifier(req, res) {
  const profileIdentifier = getProfileIdentifier(req.body?.profileUrl);

  if (!profileIdentifier) {
    return res.status(400).json({
      success: false,
      message: 'profileUrl must be a valid LinkedIn profile URL such as https://www.linkedin.com/in/kriti-jaiswal1-/'
    });
  }

  try {
    const profileInformation = await getProfileInformation(profileIdentifier);
    // const authenticatedProfileInformation = await authenticateUser();
    return res.status(200).json({
      success: true,
      profileIdentifier,
      profileInformation
    });
  } catch (error) {
    console.error('Error fetching profile information:', error);
    return res.status(502).json({
      console: console.error('Error fetching profile information:', error),
      success: false,
      message: 'Unable to retrieve profile information from the external API.'
    });
  }
}

module.exports = { extractProfileIdentifier, getProfileIdentifier };
