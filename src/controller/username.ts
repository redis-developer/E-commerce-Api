const { redis } = require("..//config/redis");

export async function checkusername(username: string) {
  const key = "usernames";
  let checkUsername = await redis.call("BF.EXISTS", key, username);
  return checkUsername;
}
