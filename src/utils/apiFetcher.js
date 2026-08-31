
const { parseRscDump } = require("../utils/rscTrimmer");

async function getPartOfProfile(profileIdentifier, regexPattern) {
  // add regexpattern to the api url to get the specific data you want, for example: "ExperienceOnly" or "SkillsOnly"
  // console.log('profileIdentifier:', profileIdentifier);
  // console.log('regexPattern:', regexPattern);
  const response = await fetch("https://www.linkedin.com/flagship-web/rsc-action/actions/component?componentId=com.linkedin.sdui.generated.profile.dsl.impl.profileCards" + regexPattern + "&sduiid=com.linkedin.sdui.generated.profile.dsl.impl.profileCards" + regexPattern + "", {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "no-cache",
    "content-type": "application/json",
    "csrf-token": process.env.CSRF_TOKEN,
    "pragma": "no-cache",
    "priority": "u=1, i",
    "sec-ch-prefers-color-scheme": "light",
    "sec-ch-ua": "\"Chromium\";v=\"152\", \"Not?A_Brand\";v=\"24\", \"Google Chrome\";v=\"152\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-li-anchor-page-key": "d_flagship3_profile_view_base",
    "x-li-application-instance": "Z5RzhtPNQKuAOblLCH4ZGA==",
    "x-li-application-version": "0.2.7003",
    "x-li-page-instance": "urn:li:page:d_flagship3_profile_view_base;Y9cVKhNdQNymoOgf2nMHNQ==",
    "x-li-page-instance-tracking-id": "Y9cVKhNdQNymoOgf2nMHNQ==",
    "x-li-pageforestid": "00065a44fa0ebbac00193ae4e6dd48a2",
    "x-li-rsc-stream": "true",
    "x-li-traceparent": "00-00065a44fa0ebbac00193ae4e6dd48a2-3b45269e27e3477d-00",
    "x-li-tracestate": "LinkedIn=3b45269e27e3477d",
    "x-li-track": "{\"clientVersion\":\"0.2.7003\",\"mpVersion\":\"0.2.7003\",\"osName\":\"web\",\"timezoneOffset\":5.5,\"timezone\":\"Asia/Calcutta\",\"deviceFormFactor\":\"DESKTOP\",\"mpName\":\"web\",\"displayDensity\":1.5,\"displayWidth\":1920,\"displayHeight\":1200}",
    "cookie": process.env.COOKIE
  },
  "body": "{\"clientArguments\":{\"payload\":{\"isSelfView\":false,\"vanityName\":\"" + profileIdentifier + "\"},\"states\":[],\"requestMetadata\":{\"$type\":\"proto.sdui.common.RequestMetadata\"},\"screenId\":\"com.linkedin.sdui.flagshipnav.home.Home\",\"knownTemplateIds\":[]}}",
  "method": "POST"
});
  
  const contentType = response.headers.get('content-type') || '';
  let body;
  try {
    if (contentType.includes('application/json')) {
      body = JSON.stringify(await response.json(), null, 2);
    } else {
      body = await response.text();
    }
  } catch {
    body = '[could not read response body]';
  }

  console.log('External API response status:', response.status);
  // console.log('External API response headers:', response.headers);
  // console.log('External API response body:', body);
  // console.log('profileIdentifier:', profileIdentifier);

  if (!response.ok) {
    throw new Error(`External API returned status ${response.status}`);
  }
  // apply try catch for parseRscDump to handle any potential errors
  try {
    const trimmedLines = parseRscDump(body, "0"); // "0" is the root chunk id
    const cleanText = trimmedLines.join("\n");
    return cleanText;
  } catch (error) {
    console.error('Error parsing RSC dump:', error);
    throw new Error('Failed to parse RSC dump');
  }
  // console.log('Cleaned text extracted from RSC dump:', cleanText);
  
}

module.exports = { getPartOfProfile };