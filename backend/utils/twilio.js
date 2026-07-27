import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export const getTurnCredentials = async () => {
  const token = await client.tokens.create({
    ttl: 3600 // 1 hour expiry
  });
  return token.iceServers;
};